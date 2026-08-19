<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dynasties, persons, events, dynastyStatistics, occupationDistribution } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'
import ComingSoon from '@/components/ComingSoon.vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const showAllEvents = ref(false)
const showAllPersons = ref(false)

// Chart refs
const wordCloudRef = ref<HTMLElement | null>(null)
const occupationChartRef = ref<HTMLElement | null>(null)
const eventBarChartRef = ref<HTMLElement | null>(null)


let occupationChart: echarts.ECharts | null = null
let eventBarChart: echarts.ECharts | null = null

const dynastyId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? 100 : id
})

// JSON 数据缓存
const jsonData = ref<DynastyData | null>(null)

// 优先使用 JSON 中的朝代数据，fallback 到 mock
const dynasty = computed(() => {
  if (jsonData.value) {
    return jsonData.value.dynasty
  }
  return dynasties.find(d => d.id === dynastyId.value)
})
const hasData = computed(() => dynasty.value !== undefined)

const formattedYear = (year: number) => {
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

const dynastyEvents = computed(() => {
  if (jsonData.value && jsonData.value.events.length > 0) {
    return jsonData.value.events
  }
  if (!dynasty.value) return []
  return events.filter(e => e.dynasty === dynasty.value!.name)
})

const dynastyPersons = computed(() => {
  if (jsonData.value && jsonData.value.persons.length > 0) {
    return jsonData.value.persons
  }
  if (!dynasty.value) return []
  return persons.filter(p => p.dynasty === dynasty.value!.name)
})

const characteristics = computed(() => {
  if (!dynasty.value) return []
  return [
    { name: '政治稳定', value: dynasty.value.characteristics.politics, color: '#355C5A', icon: '🏛' },
    { name: '文化繁荣', value: dynasty.value.characteristics.culture, color: '#D8B26A', icon: '🎨' },
    { name: '军事实力', value: dynasty.value.characteristics.military, color: '#C34739', icon: '⚔' },
    { name: '科技发展', value: dynasty.value.characteristics.technology, color: '#4A6F7A', icon: '🔬' },
    { name: '开放程度', value: dynasty.value.characteristics.openness, color: '#5C7A5E', icon: '🌏' }
  ]
})

const eventTypeStats = computed(() => {
  const typeCounts: Record<string, number> = {}
  dynastyEvents.value.forEach(e => {
    const type = e.event_type || '其他'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  return Object.entries(typeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

// =====================================================
// 地图坐标参考系（基于现代中国地图 SVG 路径分析对齐）
// 参考点（已验证坐标）：
//   北京(334,113) 上海(387,213) 广州(310,345) 西安(241,156)
//   洛阳(300,145) 成都(205,225) 杭州(378,230) 南京(345,200)
// 海南岛：x≈286-306, y≈360-385  台湾：x≈380-399, y≈241-300
// =====================================================

// =====================================================
// 5 类配色（本次用户明确指定 5 类中国传统色）
// =====================================================
type KwCategory = 'era' | 'person' | 'event' | 'civilization' | 'geo'
interface DynastyKw { name: string; value: number; category: KwCategory; desc: string }
interface KwLayout extends DynastyKw {
  style: Record<string, string | number>
  hoverColor: string
  detailRoute?: { path: string; label: string }
}

const CATEGORY_COLORS: Record<KwCategory, string> = {
  era: '#C34739',           // ① 朱砂红 — 时代精神/整体印象
  person: '#8B3A2B',        // ② 深棕红 — 代表人物
  event: '#D8B26A',         // ③ 鎏金色 — 重大历史事件
  civilization: '#355C5A',  // ④ 青绿色 — 制度与文明成果
  geo: '#5C7A9E'            // ⑤ 灰蓝色 — 地理与文化地标
}
// 颜色加深（hover 时 略微降亮）
const darken = (hex: string, k = 0.82): string => {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(0, 2), 16) * k)))
  const g = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(2, 4), 16) * k)))
  const b = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(4, 6), 16) * k)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// =====================================================
// 字号 5 级分层（适配 ~420px 容器高度，字号整体缩小）
// =====================================================
const fontSizeByValue = (v: number): number => {
  if (v >= 98) return 52   // 第1档 核心印象（原70）
  if (v >= 92) return 46   // 第2档 内环（原56）
  if (v >= 82) return 40   // 第3档 中环（原46）
  if (v >= 72) return 34   // 第4档 外环（原36）
  return 28                // 第5档 外围（原28）
}

// =====================================================
// 中心聚焦式 三环+中心 椭圆坐标（2+5+7+7 = 21 词，零重叠）
// 适配 420px 容器高度，中心词拉开距离
// =====================================================
const CX = 50, CY = 50
const deg2rad = (d: number) => (d * Math.PI) / 180
// L2 内环（~5 词，缩小椭圆半径）
const L2_ANGS = [-135, -70, 10, 75, 160]
const L2_RX = 22, L2_RY = 16
// L3 中环（~7 词）
const L3_ANGS = [-168, -112, -62, -8, 40, 100, 150]
const L3_RX = 34, L3_RY = 26
// L4 外环（~7 词，上密下疏）
const L4_ANGS = [-172, -125, -80, -25, 35, 115, 155]
const L4_RX = 45, L4_RY = 36
const ellipseXY = (angDeg: number, rx: number, ry: number) => ({
  x: CX + rx * Math.cos(deg2rad(angDeg)),
  y: CY + ry * Math.sin(deg2rad(angDeg))
})
const getLayoutPos = (i: number): { x: number; y: number } => {
  if (i === 0) return { x: 38, y: 48 }    // 核心词1：偏左上（拉开距离）
  if (i === 1) return { x: 64, y: 52 }    // 核心词2：偏右下（拉开距离）
  if (i >= 2 && i <= 6)  return ellipseXY(L2_ANGS[i - 2], L2_RX, L2_RY)
  if (i >= 7 && i <= 13) return ellipseXY(L3_ANGS[i - 7], L3_RX, L3_RY)
  return ellipseXY(L4_ANGS[i - 14], L4_RX, L4_RY)
}

// =====================================================
// 朝代关键词（6 朝，每朝 21 条，每条带 desc 一句话说明）
// 第1、2条 = 用户指定的朝代核心印象词（L1层最大字号70）
// =====================================================
const dynastyKeywords = computed<DynastyKw[]>(() => {
  if (!dynasty.value) return []
  const M: Record<string, DynastyKw[]> = {
    // ============= 【上古】21条 — 用户核心词：华夏起源 + 黄帝 =============
    '上古': [
      // L1 核心（70/68）
      { name: '华夏起源', value: 100, category: 'era', desc: '中华民族与华夏文明的历史发端，文明的第一缕曙光' },
      { name: '黄帝', value: 98, category: 'person', desc: '中华民族共同始祖之一，五帝之首，号「人文初祖」' },
      // L2 ~5 词（56px）
      { name: '炎帝', value: 96, category: 'person', desc: '姜姓部落首领，与黄帝并称华夏始祖，传为神农氏' },
      { name: '华夏民族', value: 94, category: 'era', desc: '炎黄联盟融合九黎等部族，华夏民族共同体形成' },
      { name: '神话时代', value: 92, category: 'era', desc: '盘古开天、女娲补天、后羿射日等创世传说的母题时代' },
      { name: '涿鹿之战', value: 90, category: 'event', desc: '炎黄联盟对战蚩尤，华夏部族确立中原统治权' },
      { name: '阪泉之战', value: 88, category: 'event', desc: '黄帝与炎帝之间的合盟之战，炎黄二族融合' },
      // L3 ~7 词（46px）
      { name: '蚩尤', value: 86, category: 'person', desc: '九黎部落首领，战神象征，涿鹿之战中败于炎黄联盟' },
      { name: '三皇五帝', value: 84, category: 'era', desc: '上古圣王体系的总称，华夏道统与治统的源头' },
      { name: '大禹治水', value: 82, category: 'event', desc: '大禹疏导九州江河，十三年平定水患，奠定夏代基业' },
      { name: '尧舜禅让', value: 80, category: 'event', desc: '尧舜二帝不传子而传贤，儒家称颂的公天下典范' },
      { name: '仓颉造字', value: 78, category: 'civilization', desc: '传说中仓颉创造象形文字，中华文明从此有史可载' },
      { name: '神农尝百草', value: 76, category: 'civilization', desc: '炎帝亲尝百草辨药性，奠定中医药的源头' },
      { name: '龙图腾', value: 74, category: 'civilization', desc: '华夏民族的集体图腾符号，融合各部落图腾而成' },
      // L4 ~7 词（36/28px）
      { name: '部落联盟', value: 72, category: 'civilization', desc: '上古社会形态，由多个部落联合议事、推举首领' },
      { name: '禅让制', value: 70, category: 'civilization', desc: '上古王位推举制度，传贤不传子，夏启后变为家天下' },
      { name: '九黎', value: 68, category: 'geo', desc: '蚩尤领导的东夷部落集团，分布于今山东、河南一带' },
      { name: '共工', value: 66, category: 'person', desc: '上古水神/部族首领，传说怒触不周山改天倾地陷' },
      { name: '后羿射日', value: 64, category: 'event', desc: '神话传说中后羿射落九日，为民除害的英雄传说' },
      { name: '嫦娥', value: 62, category: 'person', desc: '后羿之妻，传说服灵药飞升月宫，中秋节的文化原型' },
      { name: '夏朝建立', value: 60, category: 'event', desc: '禹之子启建立夏朝，中国王朝世袭制时代的开端' }
    ],

    // ============= 【唐朝】21条 — 用户核心词：盛世 + 开放 =============
    '唐朝': [
      { name: '盛世', value: 100, category: 'era', desc: '唐朝最鲜明的时代印象，国富民强，八方来朝' },
      { name: '开放', value: 98, category: 'era', desc: '包容并蓄的社会气质，胡汉交融，万国文化荟萃长安' },
      { name: '唐诗', value: 96, category: 'civilization', desc: '中国古典诗歌的巅峰体裁，《全唐诗》存诗近五万首' },
      { name: '李白', value: 94, category: 'person', desc: '诗仙李白，浪漫主义诗歌之集大成者' },
      { name: '杜甫', value: 92, category: 'person', desc: '诗圣杜甫，沉郁顿挫的现实主义诗歌巨匠' },
      { name: '长安', value: 90, category: 'geo', desc: '唐都长安，百万人口的国际化大都会，丝绸之路起点' },
      { name: '贞观之治', value: 88, category: 'event', desc: '唐太宗贞观年间，君臣合契，政清人和，千古治世典范' },
      { name: '盛唐气象', value: 86, category: 'era', desc: '开元天宝年间，国力、文化、艺术全面鼎盛的时代风貌' },
      { name: '武则天', value: 84, category: 'person', desc: '中国历史上唯一正统女皇帝，开殿试、创武举、重科举' },
      { name: '开元盛世', value: 82, category: 'event', desc: '唐玄宗开元年间，人口、经济、文化臻于极盛' },
      { name: '安史之乱', value: 80, category: 'event', desc: '安禄山史思明叛乱，大唐由盛转衰的关键转折点' },
      { name: '丝绸之路', value: 78, category: 'event', desc: '陆上丝路全盛，驼队西出阳关，东西方商旅络绎不绝' },
      { name: '李世民', value: 76, category: 'person', desc: '唐太宗李世民，贞观之治的缔造者，天可汗' },
      { name: '杨贵妃', value: 74, category: 'person', desc: '四大美女之一，唐玄宗宠妃，马嵬坡之变中香消玉殒' },
      { name: '白居易', value: 72, category: 'person', desc: '新乐府运动倡导者，《长恨歌》《琵琶行》千古传诵' },
      { name: '唐玄奘', value: 70, category: 'person', desc: '西天取经的三藏法师，译经大师，著《大唐西域记》' },
      { name: '唐三彩', value: 68, category: 'civilization', desc: '唐代铅釉彩陶，黄绿蓝三色交融，雕塑艺术瑰宝' },
      { name: '科举制', value: 66, category: 'civilization', desc: '正式确立于唐的人才选拔制度，影响中国一千三百年' },
      { name: '藩镇割据', value: 64, category: 'event', desc: '中晚唐节度使拥兵自立，中央权威瓦解的政治困局' },
      { name: '玄武门之变', value: 62, category: 'event', desc: '李世民诛兄杀弟夺皇位，奠定贞观之治的政治前提' },
      { name: '敦煌壁画', value: 60, category: 'geo', desc: '甘肃敦煌莫高窟壁画，唐代艺术巅峰，中西文明结晶' }
    ],

    // ============= 【汉朝】21条 — 用户核心词：大一统 + 丝绸之路 =============
    '汉朝': [
      { name: '大一统', value: 100, category: 'era', desc: '汉朝奠定了中国统一多民族国家的基本疆域与制度格局' },
      { name: '丝绸之路', value: 98, category: 'event', desc: '张骞凿空西域，连接东西方文明的重要贸易与文化通道' },
      { name: '汉武帝', value: 96, category: 'person', desc: '刘彻，汉武盛世缔造者，北击匈奴，独尊儒术' },
      { name: '汉赋', value: 94, category: 'civilization', desc: '汉代代表性文体，铺张扬厉，司马相如、扬雄为大家' },
      { name: '刘邦', value: 92, category: 'person', desc: '汉高祖刘邦，斩白蛇起义，四百年汉朝的开国皇帝' },
      { name: '张骞出使西域', value: 90, category: 'event', desc: '张骞两次出使西域，"凿空"之行开通丝绸之路' },
      { name: '文景之治', value: 88, category: 'event', desc: '汉文帝、景帝轻徭薄赋、与民休息，国库充盈之治世' },
      { name: '儒家正统', value: 86, category: 'civilization', desc: '汉武帝采纳董仲舒"罢黜百家，独尊儒术"，儒学升为官学' },
      { name: '汉武盛世', value: 84, category: 'era', desc: '汉武帝时期，疆域扩张、文化制度全面鼎盛的半个世纪' },
      { name: '汉书', value: 82, category: 'civilization', desc: '班固编撰的中国第一部纪传体断代史，前四史之一' },
      { name: '司马迁·史记', value: 80, category: 'civilization', desc: '太史公《史记》，史家之绝唱，无韵之离骚' },
      { name: '昭君出塞', value: 78, category: 'event', desc: '王昭君远嫁匈奴呼韩邪单于，汉匈和平半个世纪' },
      { name: '匈奴', value: 76, category: 'geo', desc: '秦汉时期北方草原游牧帝国，汉王朝长期的北方对手' },
      { name: '光武中兴', value: 74, category: 'event', desc: '光武帝刘秀重建汉朝（东汉），拨乱反正，国力恢复' },
      { name: '造纸术', value: 72, category: 'civilization', desc: '蔡伦改进造纸术，书写材料革命，推动人类文明传播' },
      { name: '董仲舒', value: 70, category: 'person', desc: '西汉大儒，天人感应、大一统、独尊儒术的理论建构者' },
      { name: '推恩令', value: 68, category: 'civilization', desc: '主父偃之策，肢解诸侯王国封地，解决汉初藩国问题' },
      { name: '张衡·地动仪', value: 66, category: 'civilization', desc: '张衡发明候风地动仪，世界最早的地震探测仪器' },
      { name: '华佗', value: 64, category: 'person', desc: '东汉神医，创麻沸散、五禽戏，外科医学先驱' },
      { name: '三国鼎立', value: 62, category: 'era', desc: '汉末魏蜀吴三分天下，四百年汉祚最终走向终结' },
      { name: '白马寺', value: 60, category: 'geo', desc: '洛阳白马寺，中国第一古刹，佛教传入中土的第一座寺院' }
    ],

    // ============= 【宋朝】21条 — 核心词：宋韵 + 文化巅峰 =============
    '宋朝': [
      { name: '宋韵', value: 100, category: 'era', desc: '宋代所特有的风雅美学，宋词、茶道、文人画的生活艺术' },
      { name: '文化巅峰', value: 98, category: 'era', desc: '陈寅恪言："华夏民族之文化，历数千载之演进，造极于赵宋之世"' },
      { name: '宋词', value: 96, category: 'civilization', desc: '宋代文学之冠，婉约与豪放并峙，词体艺术的黄金时代' },
      { name: '苏轼', value: 94, category: 'person', desc: '苏东坡，诗词书画皆冠绝，宋代文人精神的化身' },
      { name: '清明上河图', value: 92, category: 'civilization', desc: '张择端绘汴京盛景，宋代市井生活最生动的百科画卷' },
      { name: '开封汴梁', value: 90, category: 'geo', desc: '北宋都城东京汴梁，百万居民，当时世界最繁华都市' },
      { name: '宋太祖·赵匡胤', value: 88, category: 'person', desc: '陈桥兵变黄袍加身，建立宋朝，杯酒释兵权重文抑武' },
      { name: '活字印刷', value: 86, category: 'civilization', desc: '毕昇发明泥活字印刷，信息复制技术的重大革命' },
      { name: '指南针', value: 84, category: 'civilization', desc: '宋代成熟应用罗盘于航海，大航海时代的技术前提' },
      { name: '火药', value: 82, category: 'civilization', desc: '宋代火药武器广泛实战应用，改变人类战争形态' },
      { name: '交子·纸币', value: 80, category: 'civilization', desc: '四川交子，世界最早的纸币，宋代高度商业化的明证' },
      { name: '王安石变法', value: 78, category: 'event', desc: '熙宁变法，青苗、免役诸法，宋代规模最大的改革运动' },
      { name: '靖康之耻', value: 76, category: 'event', desc: '金军攻破汴梁，徽钦二帝被掳，北宋亡国的奇耻大辱' },
      { name: '岳飞·精忠报国', value: 74, category: 'person', desc: '岳武穆，抗金名将，尽忠报国的民族精神象征' },
      { name: '李清照', value: 72, category: 'person', desc: '易安居士，婉约词宗，两宋词坛最杰出的女性词人' },
      { name: '辛弃疾', value: 70, category: 'person', desc: '稼轩居士，豪放词派代表，壮志未酬的爱国词人' },
      { name: 'GDP世界第一', value: 68, category: 'era', desc: '宋代经济总量约占世界22-30%，商业与手工业高度繁荣' },
      { name: '山水画', value: 66, category: 'civilization', desc: '宋代山水文人画高峰，范宽、郭熙、马远、夏圭大家辈出' },
      { name: '杯酒释兵权', value: 64, category: 'event', desc: '宋太祖宴饮之间解除功臣兵权，确立重文轻武之国策' },
      { name: '朱熹·理学', value: 62, category: 'civilization', desc: '朱子集宋代理学之大成，"存天理灭人欲"之学统形成' },
      { name: '崖山海战', value: 60, category: 'event', desc: '南宋与元最后决战，陆秀夫负帝投海，宋室彻底覆亡' }
    ],

    // ============= 【明朝】21条 — 核心词：永乐治世 + 远航 =============
    '明朝': [
      { name: '永乐治世', value: 100, category: 'era', desc: '明成祖永乐年间，下西洋、修大典、迁都北京，盛极一时' },
      { name: '远航', value: 98, category: 'event', desc: '郑和七下西洋，世界大航海时代之前规模最大的远洋航行' },
      { name: '紫禁城', value: 96, category: 'geo', desc: '朱棣迁都营建的北京皇宫，明清两代二十四帝之居所' },
      { name: '朱元璋', value: 94, category: 'person', desc: '明太祖洪武皇帝，乞丐出身推翻元朝，建立大明三百年基业' },
      { name: '郑和下西洋', value: 92, category: 'event', desc: '三宝太监郑和率二百余艘宝船，七下西洋，遍访三十余国' },
      { name: '永乐大典', value: 90, category: 'civilization', desc: '解缙主编的类书巨著，22937卷，古代中国最大百科全书' },
      { name: '永乐盛世', value: 88, category: 'era', desc: '永乐年间疆域辽阔、四夷宾服，国力鼎盛的辉煌年代' },
      { name: '明长城', value: 86, category: 'geo', desc: '今日所见万里长城主体，均为明代重修，东起鸭绿江西至嘉峪' },
      { name: '仁宣之治', value: 84, category: 'event', desc: '仁宗、宣宗时期，宽仁治国，民生安定，堪比文景' },
      { name: '海禁', value: 82, category: 'civilization', desc: '明朝锁国政策，禁止民间私自出海，对后世影响深远' },
      { name: '王阳明·心学', value: 80, category: 'civilization', desc: '王守仁创"致良知"心学，知行合一，影响东亚儒学数百年' },
      { name: '四大名著', value: 78, category: 'civilization', desc: '《三国》《水浒》《西游》三部成书于明代，通俗文学巅峰' },
      { name: '景德镇瓷器', value: 76, category: 'civilization', desc: '景德镇官窑青花瓷独步天下，远销海外，明代手工业代表' },
      { name: '内阁制', value: 74, category: 'civilization', desc: '明代废宰相后形成的票拟制度，内阁大学士渐成事实上的宰辅' },
      { name: '锦衣卫', value: 72, category: 'civilization', desc: '皇帝直辖的亲军特务机构，有巡察缉捕之权，明代高压政治象征' },
      { name: '万历三大征', value: 70, category: 'event', desc: '万历年间宁夏、朝鲜、播州三役皆胜，然国库耗费巨大' },
      { name: '张居正改革', value: 68, category: 'event', desc: '万历首辅张居正推行考成法、一条鞭法，晚明国力短暂中兴' },
      { name: '东厂西厂', value: 66, category: 'civilization', desc: '由宦官执掌的特务机构，与锦衣卫合称厂卫，明代宦权代表' },
      { name: '资本主义萌芽', value: 64, category: 'era', desc: '晚明江南手工业工场雇佣制兴起，被视为资本主义萌芽' },
      { name: '天工开物·宋应星', value: 62, category: 'civilization', desc: '宋应星著《天工开物》，17世纪中国工艺百科全书' },
      { name: '本草纲目·李时珍', value: 60, category: 'civilization', desc: '李时珍历时27年著《本草纲目》，东方药物学集大成巨著' }
    ],

    // ============= 【清朝】21条 — 核心词：康乾盛世 + 百年转折 =============
    '清朝': [
      { name: '康乾盛世', value: 100, category: 'era', desc: '康熙、雍正、乾隆三代一百三十余年，清朝国力最鼎盛时期' },
      { name: '百年转折', value: 98, category: 'era', desc: '鸦片战争后，中国被迫从古代王朝卷入近代世界的百年变局' },
      { name: '四库全书', value: 96, category: 'civilization', desc: '乾隆朝纪昀主编，36000余册，中国古代最大规模丛书' },
      { name: '鸦片战争', value: 94, category: 'event', desc: '1840中英鸦片战争，签订《南京条约》，中国近代史的开端' },
      { name: '红楼梦·曹雪芹', value: 92, category: 'civilization', desc: '曹雪芹《石头记》，中国古典小说艺术的巅峰之作' },
      { name: '圆明园', value: 90, category: 'geo', desc: '万园之园圆明园，集中西园林精华，1860年被英法联军焚毁' },
      { name: '康熙', value: 88, category: 'person', desc: '清圣祖玄烨，平三藩、收台湾、征噶尔丹，康乾盛世奠基者' },
      { name: '乾隆', value: 86, category: 'person', desc: '清高宗弘历，十全老人，文治武功极盛，亦为清由盛转衰之始' },
      { name: '闭关锁国', value: 84, category: 'civilization', desc: '清廷限一口通商、隔绝世界，导致落后于西方工业革命' },
      { name: '八旗制度', value: 82, category: 'civilization', desc: '满清核心制度，集军事、行政、生产于一体的旗人社会组织' },
      { name: '京剧', value: 80, category: 'civilization', desc: '徽班进京后融合昆曲汉调，京剧成形，被视为国粹之代表' },
      { name: '太平天国', value: 78, category: 'event', desc: '洪秀全领导的农民起义，历时十四年，动摇清朝统治根基' },
      { name: '雍正', value: 76, category: 'person', desc: '清世宗胤禛，铁腕反腐、摊丁入亩、设立军机处，承康启乾' },
      { name: '军机处', value: 74, category: 'civilization', desc: '雍正设军机处，跪受笔录，中国君主专制达到顶峰' },
      { name: '收复台湾', value: 72, category: 'event', desc: '施琅率军攻台，郑克塽降清，台湾正式纳入清朝版图' },
      { name: '文字狱', value: 70, category: 'civilization', desc: '康雍乾三朝严酷文网，士子因文获罪，思想界万马齐喑' },
      { name: '统一多民族', value: 68, category: 'era', desc: '清朝疆域极盛1300余万平方公里，奠定现代中国版图基础' },
      { name: '康熙字典', value: 66, category: 'civilization', desc: '张玉书等编撰的大型字书，收字47035个，清代小学巨著' },
      { name: '甲午战争', value: 64, category: 'event', desc: '1894中日甲午海战，北洋水师覆没，签订《马关条约》' },
      { name: '洋务运动', value: 62, category: 'event', desc: '李鸿章、张之洞等办厂造船建海军，中国近代工业化开端' },
      { name: '辛亥革命', value: 60, category: 'event', desc: '1911武昌起义，推翻清朝，结束中国两千余年帝制' }
    ],

    // ============= 【夏商西周】20条 — 核心词：王朝更替 + 青铜文明 =============
    '夏商西周': [
      { name: '王朝更替', value: 100, category: 'era', desc: '夏商周三代相继更替，中国早期国家形态的形成与演变' },
      { name: '青铜文明', value: 98, category: 'era', desc: '商周时期青铜冶炼技术鼎盛，司母戊鼎等国宝级器物代表' },
      { name: '夏朝', value: 96, category: 'era', desc: '中国史书记载的第一个世袭制王朝，启家天下的开端' },
      { name: '商朝', value: 94, category: 'era', desc: '盘庚迁殷后的商王朝，甲骨文、青铜器繁盛的时代' },
      { name: '西周', value: 92, category: 'era', desc: '武王伐纣建立周朝，分封制、宗法制、礼乐制度奠基' },
      { name: '分封制', value: 90, category: 'civilization', desc: '周王将土地和人民分封给诸侯，建立封建等级秩序' },
      { name: '宗法制', value: 88, category: 'civilization', desc: '以血缘关系为基础的嫡长子继承制，维系周王朝统治' },
      { name: '武王伐纣', value: 86, category: 'event', desc: '周武王姬发率诸侯联军于牧野击败商军，建立周朝' },
      { name: '周公旦', value: 84, category: 'person', desc: '周武王之弟，辅政成王，制礼作乐，儒学元圣' },
      { name: '甲骨文', value: 82, category: 'civilization', desc: '商代刻在龟甲和兽骨上的占卜文字，汉字早期形态' },
      { name: '金文', value: 80, category: 'civilization', desc: '铸刻在青铜器上的铭文，西周文字的主要载体' },
      { name: '礼乐制度', value: 78, category: 'civilization', desc: '周公制定的典章制度与音乐规范，维系西周社会秩序' },
      { name: '井田制', value: 76, category: 'civilization', desc: '西周土地制度，以井为单位分配，公私田分明' },
      { name: '商汤', value: 74, category: 'person', desc: '商族首领，鸣条之战灭夏建商，一代明君' },
      { name: '盘庚迁殷', value: 72, category: 'event', desc: '商王盘庚迁都至殷，稳定商朝政治中心' },
      { name: '武丁中兴', value: 70, category: 'event', desc: '商王武丁任用傅说、妇好等人才，开创盛世' },
      { name: '烽火戏诸侯', value: 68, category: 'event', desc: '周幽王宠褒姒，烽火戏诸侯，最终犬戎破镐京' },
      { name: '平王东迁', value: 66, category: 'event', desc: '周平王迁都洛邑，东周开始，西周结束' },
      { name: '司母戊鼎', value: 64, category: 'civilization', desc: '商代晚期青铜礼器，中国现存最大最重的青铜器' },
      { name: '封神演义', value: 62, category: 'civilization', desc: '明代小说，以武王伐纣为背景，演绎商周之际神魔故事' }
    ]
  }
  return M[dynasty.value.name] || M['上古']
})

// =====================================================
// 生成中心聚焦布局 + AABB 碰撞检测（保证零重叠）
// =====================================================
// 1) 每个词按字号×字数计算真实包围盒
// 2) 放置前做 AABB 矩形相交检测，碰撞则螺旋搜索候选点
// 3) 多次失败后自动降一级字号重试，最终确保无重叠
// =====================================================
interface PlacedBox {
  cx: number   // 中心点 x (%)
  cy: number   // 中心点 y (%)
  w: number    // 半宽  (%)
  h: number    // 半高  (%)
}

// AABB 相交检测（大幅增加间隙，确保字间有充足留白）
const aabbOverlap = (a: PlacedBox, b: PlacedBox, pad = 8): boolean => {
  return (
    Math.abs(a.cx - b.cx) < a.w + b.w + pad &&
    Math.abs(a.cy - b.cy) < a.h + b.h + pad
  )
}

// 容器基准（适配 420px 高度，与右卡五维评分等高）
const BASE_W_PX = 980
const BASE_H_PX = 420

// Canvas 精确测量文字宽度（只创建一次）
let measureCanvas: HTMLCanvasElement | null = null
const getTextWidth = (text: string, fontSize: number, fontFamily: string): number => {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
  }
  const ctx = measureCanvas.getContext('2d')!
  ctx.font = `${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}

// 字号 → % 半宽高（使用 Canvas 精确测量文字宽度，避免公式估算的偏差）
const WORD_CLOUD_FONT = "'Ma Shan Zheng', 'KaiTi', 'STKaiti', cursive"
const estimateBox = (name: string, sizePx: number): { wPct: number; hPct: number } => {
  const wPx = getTextWidth(name, sizePx, WORD_CLOUD_FONT)
  const hPx = sizePx * 1.2  // 中文字符近似正方形，行高约为字号的1.2倍
  return {
    wPct: (wPx / BASE_W_PX) * 100 * 0.5,  // 半宽
    hPct: (hPx / BASE_H_PX) * 100 * 0.5   // 半高
  }
}

// 螺旋搜索候选点（围绕初始位置，半径逐渐增大，32 方向，最多 15 环）
const spiralSearch = (
  initX: number, initY: number,
  box: { wPct: number; hPct: number },
  placed: PlacedBox[],
  bound: { xMin: number; xMax: number; yMin: number; yMax: number }
): { x: number; y: number } | null => {
  // 32 方向 + 多步长，避免卡死在局部
  const dirs = [
    [1,0],[0.92,0.38],[0.71,0.71],[0.38,0.92],[0,1],[-0.38,0.92],[-0.71,0.71],[-0.92,0.38],
    [-1,0],[-0.92,-0.38],[-0.71,-0.71],[-0.38,-0.92],[0,-1],[0.38,-0.92],[0.71,-0.71],[0.92,-0.38],
    [1,0.25],[-1,0.25],[0.25,1],[-0.25,-1],[1,-0.25],[-1,-0.25],[0.25,-1],[-0.25,1],
    [0.5,0.5],[-0.5,0.5],[-0.5,-0.5],[0.5,-0.5],[0.87,0.71],[-0.87,0.71],[-0.87,-0.71],[0.87,-0.71]
  ]
  for (let ring = 1; ring <= 15; ring++) {
    const step = ring * 0.65
    for (const [dx, dy] of dirs) {
      const cx = initX + dx * step
      const cy = initY + dy * step
      if (cx < bound.xMin || cx > bound.xMax || cy < bound.yMin || cy > bound.yMax) continue
      const test: PlacedBox = { cx, cy, w: box.wPct, h: box.hPct }
      let hit = false
      for (const p of placed) {
        if (aabbOverlap(test, p)) { hit = true; break }
      }
      if (!hit) return { x: cx, y: cy }
    }
  }
  return null
}

const keywordCloudData = computed<KwLayout[]>(() => {
  const kws = dynastyKeywords.value
  if (kws.length === 0) return []
  // 按 value 从大到小（确保 L1/L2/L3/L4 正确排序）
  const sorted = [...kws].sort((a, b) => b.value - a.value)

  // 为每个关键词查找匹配的 person 或 event 详情路由
  const matchDetail = (kw: DynastyKw): KwLayout['detailRoute'] | undefined => {
    if (kw.category === 'person') {
      const p = dynastyPersons.value.find(pp =>
        pp.name === kw.name || pp.name.includes(kw.name) || kw.name.includes(pp.name)
      )
      if (p) return { path: `/person/${p.id}`, label: '查看人物详情' }
    } else if (kw.category === 'event') {
      const e = dynastyEvents.value.find(ee =>
        ee.name === kw.name || ee.name.includes(kw.name) || kw.name.includes(ee.name)
      )
      if (e) return { path: `/event/${e.id}`, label: '查看事件详情' }
    }
    return undefined
  }

  // 字号分档（降序，用于碰撞失败后逐级降级，适配420px容器）
  const SIZE_STAIRS = [52, 46, 42, 38, 34, 30, 26, 22, 20, 18]
  const pickSizeByValue = (v: number) => fontSizeByValue(v)
  const lowerSize = (cur: number) => {
    const idx = SIZE_STAIRS.findIndex(s => s <= cur)
    if (idx < 0) return 18
    return SIZE_STAIRS[Math.min(SIZE_STAIRS.length - 1, idx + 1)]
  }

  // 放置边界（%，保证不溢出容器，留边距 4% ~ 96%）
  const BOUND = { xMin: 5, xMax: 95, yMin: 6, yMax: 94 }

  const placed: PlacedBox[] = []
  const result: KwLayout[] = []

  for (let i = 0; i < sorted.length; i++) {
    const kw = sorted[i]
    // 初始理想位置（第 0 次重试使用预设位置，后续重试使用随机起点）
    let size = pickSizeByValue(kw.value)
    let finalPos: { x: number; y: number } | null = null
    let finalSize = size

    // 随机初始位置重试（最多 3 次随机起点，避免局部最优无解）
    for (let retry = 0; retry < 3 && !finalPos; retry++) {
      const ideal = retry === 0
        ? getLayoutPos(i)
        : {
            x: BOUND.xMin + Math.random() * (BOUND.xMax - BOUND.xMin),
            y: BOUND.yMin + Math.random() * (BOUND.yMax - BOUND.yMin)
          }
      finalSize = size

      // 碰撞失败 → 最多降 8 级字号重试
      for (let attempt = 0; attempt < 9; attempt++) {
        const box = estimateBox(kw.name, finalSize)
        const candidate: PlacedBox = { cx: ideal.x, cy: ideal.y, w: box.wPct, h: box.hPct }
        // 1) 先试初始位置
        let ok = true
        for (const p of placed) {
          if (aabbOverlap(candidate, p)) { ok = false; break }
        }
        // 2) 碰撞则螺旋搜索
        if (!ok) {
          const sp = spiralSearch(ideal.x, ideal.y, box, placed, BOUND)
          if (sp) {
            finalPos = sp
            break
          } else {
            // 3) 失败 → 降一级字号重试
            finalSize = lowerSize(finalSize)
            continue
          }
        } else {
          finalPos = { x: ideal.x, y: ideal.y }
          break
        }
      }
    }
    if (!finalPos) {
      // 极端兜底：再大一圈搜索 + 最小字号
      finalSize = 18
      const box = estimateBox(kw.name, finalSize)
      const sp = spiralSearch(getLayoutPos(i).x, getLayoutPos(i).y, box, placed, BOUND)
      finalPos = sp || { x: getLayoutPos(i).x, y: getLayoutPos(i).y }
    }

    const color = CATEGORY_COLORS[kw.category]
    const bold = finalSize >= 42 ? 700 : finalSize >= 30 ? 600 : 500
    const route = matchDetail(kw)

    // 登记已放置矩形（用于后续碰撞检测）
    const box = estimateBox(kw.name, finalSize)
    placed.push({ cx: finalPos.x, cy: finalPos.y, w: box.wPct, h: box.hPct })

    result.push({
      ...kw,
      value: kw.value,
      hoverColor: darken(color),
      detailRoute: route,
      style: {
        left: `${finalPos.x}%`,
        top: `${finalPos.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${finalSize}px`,
        color,
        fontWeight: bold,
        fontFamily: WORD_CLOUD_FONT,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        zIndex: finalSize,
        transition: 'transform 0.25s ease, color 0.25s ease, filter 0.25s ease',
        textShadow: '0 1px 4px rgba(255,255,255,0.45)',
        cursor: route ? 'pointer' : 'default'
      }
    })
  }

  return result
})

const handleKwClick = (kw: KwLayout) => {
  if (kw.detailRoute) router.push(kw.detailRoute.path)
}

const associationDensity = computed(() => {
  if (dynastyPersons.value.length === 0) return 0
  const totalRelations = dynastyPersons.value.reduce((sum, p) => {
    return sum + (p.related_people?.length || 0) + (p.related_events?.length || 0)
  }, 0)
  return (totalRelations / dynastyPersons.value.length).toFixed(1)
})

const networkActivity = computed(() => {
  const totalPersons = dynastyPersons.value.length
  const totalRelations = dynastyPersons.value.reduce((sum, p) => {
    return sum + (p.related_people?.length || 0)
  }, 0)
  if (totalPersons === 0) return '0.00'
  const density = totalRelations / (totalPersons * (totalPersons - 1) || 1)
  return density.toFixed(2)
})

const chinaMapData = computed(() => {
  const maps: Record<string, { regions: { name: string; x: number; y: number; r: number; isCapital?: boolean }[] }> = {
    '上古': {
      regions: [
        // 传说时代核心区域：以河洛地区为核心（河南西部、山西南部），仅限黄河中下游
        { name: '阳城', x: 290, y: 150, r: 8, isCapital: true },        // 登封（夏都）
        { name: '二里头', x: 295, y: 148, r: 6 },                        // 偃师（夏都遗址）
        { name: '殷墟', x: 305, y: 130, r: 6 },                          // 安阳（商朝后期都城）
        { name: '周原', x: 248, y: 155, r: 6 },                          // 岐山（西周发源地）
        { name: '陶寺', x: 275, y: 125, r: 5 },                          // 临汾（尧都遗址）
        { name: '石峁', x: 260, y: 115, r: 5 }                           // 神木（陕北古城）
      ]
    },
    '汉朝': {
      regions: [
        // 西汉极盛（汉武帝）：长安为都，设西域都护府，东至朝鲜、西至葱岭、北至漠北、南至越南
        { name: '长安', x: 241, y: 156, r: 10, isCapital: true },       // 西安（西汉都城）
        { name: '洛阳', x: 300, y: 145, r: 8 },                          // 东都
        { name: '成都', x: 205, y: 225, r: 7 },                          // 益州（蜀郡）
        { name: '番禺', x: 310, y: 345, r: 7 },                          // 广州（南海郡治）
        { name: '敦煌', x: 183, y: 128, r: 7 },                          // 河西走廊西端/西域门户
        { name: '轮台', x: 133, y: 110, r: 6 },                          // 西域都护府治所
        { name: '乐浪', x: 420, y: 95, r: 6 },                           // 汉四郡（朝鲜平壤）
        { name: '交趾', x: 265, y: 375, r: 6 },                          // 越南北部（交趾郡）
        { name: '蓟县', x: 334, y: 113, r: 6 },                          // 幽州（北京）
        { name: '辽东', x: 385, y: 90, r: 5 }                            // 辽东郡（辽阳）
      ]
    },
    '唐朝': {
      regions: [
        // 唐高宗极盛：长安为都，设安西、安北、安东、安南、北庭都护府
        { name: '长安', x: 241, y: 156, r: 10, isCapital: true },       // 京师
        { name: '洛阳', x: 300, y: 145, r: 8 },                          // 东都
        { name: '太原', x: 285, y: 125, r: 7 },                          // 北都（并州）
        { name: '成都', x: 205, y: 225, r: 7 },                          // 益州
        { name: '广州', x: 310, y: 345, r: 7 },                          // 岭南
        { name: '龟兹', x: 135, y: 110, r: 7 },                          // 安西都护府（库车）
        { name: '庭州', x: 160, y: 85, r: 7 },                           // 北庭都护府（吉木萨尔）
        { name: '安东', x: 420, y: 95, r: 6 },                           // 安东都护府（朝鲜平壤）
        { name: '安北', x: 285, y: 30, r: 6 },                           // 安北都护府（漠北）
        { name: '敦煌', x: 183, y: 128, r: 6 },                          // 沙州（河西走廊）
        { name: '安南', x: 265, y: 375, r: 6 }                           // 安南都护府（越南河内）
      ]
    },
    '宋朝': {
      regions: [
        // 北宋：开封为都，北界在白沟河（河北雄县），西至秦州，南至海南岛
        { name: '开封', x: 315, y: 135, r: 10, isCapital: true },       // 东京汴梁
        { name: '洛阳', x: 300, y: 145, r: 7 },                          // 西京
        { name: '商丘', x: 335, y: 135, r: 6 },                          // 南京（应天府）
        { name: '大名', x: 325, y: 115, r: 6 },                          // 北京（大名府）
        { name: '杭州', x: 378, y: 230, r: 8 },                          // 临安（南宋都城）
        { name: '成都', x: 205, y: 225, r: 7 },                          // 益州
        { name: '广州', x: 310, y: 345, r: 7 },                          // 岭南
        { name: '泉州', x: 370, y: 255, r: 7 },                          // 海上丝绸之路起点
        { name: '江宁', x: 345, y: 200, r: 6 },                          // 南京（建康）
        { name: '秦州', x: 255, y: 160, r: 5 }                           // 天水（北宋西界）
      ]
    },
    '明朝': {
      regions: [
        // 永乐极盛：北京为都，南京为留都，含奴儿干都司、关西七卫、乌思藏都司
        { name: '北京', x: 334, y: 113, r: 10, isCapital: true },        // 京师（顺天府）
        { name: '南京', x: 345, y: 200, r: 8 },                          // 留都（应天府）
        { name: '西安', x: 241, y: 156, r: 7 },                          // 陕西
        { name: '成都', x: 205, y: 225, r: 7 },                          // 四川
        { name: '广州', x: 310, y: 345, r: 7 },                          // 广东
        { name: '昆明', x: 185, y: 275, r: 6 },                          // 云南
        { name: '奴儿干', x: 430, y: 70, r: 6 },                         // 奴儿干都司（黑龙江口）
        { name: '哈密', x: 183, y: 128, r: 6 },                          // 哈密卫（关西最西端）
        { name: '拉萨', x: 125, y: 260, r: 6 },                          // 乌思藏都司
        { name: '沈阳', x: 385, y: 90, r: 6 },                           // 辽东都司
        { name: '福州', x: 365, y: 250, r: 5 }                           // 福建（市舶司）
      ]
    },
    '清朝': {
      regions: [
        // 乾隆极盛：北京为都，西至巴尔喀什湖，北至外兴安岭，东北至库页岛，南至南海诸岛
        { name: '北京', x: 334, y: 113, r: 10, isCapital: true },        // 京师
        { name: '盛京', x: 385, y: 90, r: 8 },                           // 沈阳（陪都）
        { name: '伊犁', x: 137, y: 95, r: 7 },                           // 伊犁将军府（惠远城）
        { name: '拉萨', x: 125, y: 260, r: 7 },                          // 西藏（驻藏大臣）
        { name: '库伦', x: 275, y: 50, r: 7 },                           // 外蒙古（乌兰巴托）
        { name: '成都', x: 205, y: 225, r: 7 },                          // 四川
        { name: '广州', x: 310, y: 345, r: 7 },                          // 广东
        { name: '台北', x: 390, y: 275, r: 6 },                          // 台湾府
        { name: '喀什', x: 113, y: 113, r: 6 },                          // 喀什噶尔（回部）
        { name: '瑷珲', x: 425, y: 60, r: 6 },                           // 黑龙江（瑷珲）
        { name: '昆明', x: 185, y: 275, r: 6 }                            // 云南
      ]
    }
  }
  return maps[dynasty.value?.name || ''] || maps['上古']
})

// Modern China base outline (viewBox 0 0 500 400) - gray background layer
// 基于现代中国实际疆域轮廓（含台湾、海南、南海诸岛示意）
const modernChinaPath = 'M364.52,329.358L364.225,329.888L363.754,329.81L363.754,329.42L363.636,329.311L363.784,328.952L363.872,328.843L364.402,329.155ZM394.607,264.503L393.93,264.769L391.81,263.953L390.309,263.037L389.396,261.952L389.278,261.485L390.309,261.568L391.339,261.969L391.574,262.57L391.987,262.753L392.252,263.103L394.165,263.92L394.459,264.17ZM398.139,279.037L398.022,279.233L397.021,278.693L395.931,278.578L395.549,278.102L395.49,277.347L396.638,277.38L398.051,278.053L398.375,278.397ZM397.138,281.72L397.109,281.9L396.402,281.295L396.079,281.181L396.226,280.838L396.697,280.756L397.08,281.524ZM399.023,279.708L398.964,280.15L398.728,280.085L398.434,279.315L398.61,279.119L399.023,279.168ZM377.915,320.681L377.296,321.106L376.914,320.901L376.914,320.335L377.12,319.832L376.884,319.47L377.09,319.029L377.561,318.903L377.708,319.171L377.973,319.328L378.062,319.47L378.062,319.753L377.797,320.225L378.003,320.477ZM300.754,359.545L301.048,359.85L301.872,359.637L302.02,360.017L301.99,360.2L301.725,360.641L301.048,360.306L300.371,360.382L299.9,360.352L299.753,360.139L300.135,359.713ZM389.602,296.605L388.895,296.814L388.63,296.814L388.63,296.138L389.219,295.51L389.455,295.719L389.602,296.057ZM326.66,344.453L326.749,344.869L326.101,344.238L325.924,344.207L325.601,343.976L325.424,343.591L325.924,343.575L326.395,344.037ZM320.419,355.08L320.243,355.247L320.007,354.942L319.948,354.484L319.772,354.239L320.184,353.919L320.36,353.582L320.802,353.643L321.008,353.75L320.596,354.102L320.508,354.255ZM319.212,354.744L318.417,354.927L318.241,354.896L318.535,354.438L319.242,354.117ZM281.029,355.904L280.499,355.446L279.616,354.698L279.263,354.606L278.291,354.973L276.908,355.11L276.613,354.728L275.936,355.018L275.289,354.117L274.523,354.071L273.581,353.384L273.228,353.032L273.11,352.512L272.816,352.236L272.462,352.282L272.05,352.007L271.373,351.731L270.843,351.563L270.578,351.701L270.313,351.762L270.254,351.41L270.284,350.368L270.225,349.433L270.078,349.019L269.724,348.712L269.401,348.558L269.283,348.082L269.401,347.145L269.636,346.5L270.078,346.392L270.637,345.931L270.902,345.285L271.255,344.684L269.989,343.837L269.312,343.529L268.576,343.668L267.664,343.93L267.163,343.991L266.928,343.883L266.398,343.113L266.103,342.989L265.456,342.943L264.896,342.943L264.573,343.282L264.102,343.39L263.601,343.406L263.101,342.989L262.365,342.45L261.187,342.079L261.04,341.632L260.745,341.107L260.304,340.628L259.568,339.979L258.95,339.654L258.655,339.855L258.243,340.226L256.683,340.999L255.976,341.292L255.593,341.508L255.299,341.832L255.181,342.619L255.034,343.514L254.593,343.96L254.151,344.299L253.709,344.33L253.268,344.315L252.826,344.453L251.56,345.346L250.972,345.269L250.471,344.777L250.265,344.407L249.706,344.5L248.97,344.915L248.646,345.685L248.469,346.392L248.293,346.7L248.057,346.792L247.821,346.823L245.555,344.761L245.437,344.654L245.025,345.085L244.642,346.162L244.377,346.377L244.2,346.285L243.258,344.9L243.023,344.761L242.817,344.807L242.522,345.269L241.934,345.931L241.492,346.331L241.463,346.777L240.962,347.176L240.403,347.576L240.197,347.606L239.814,347.453L239.313,346.93L238.96,346.377L238.077,345.839L237.076,345.377L236.399,345.023L236.016,344.931L235.663,345.085L235.486,345.315L235.251,345.854L234.662,346.746L234.103,347.453L233.602,347.913L233.22,348.22L232.925,347.929L232.366,347.698L231.718,347.683L230.894,348.144L230.217,347.238L230.04,347.191L229.775,347.268L229.481,347.483L229.275,347.99L229.069,348.681L228.656,349.126L228.274,349.325L228.391,349.724L228.598,350.138L228.568,350.506L228.715,351.088L228.921,351.67L229.716,352.604L230.011,353.108L230.069,353.521L230.099,355.049L230.069,355.675L229.922,356.895L229.922,357.596L230.246,357.916L230.57,358.297L230.541,358.495L230.393,358.571L229.952,358.998L229.775,359.043L229.451,358.876L229.069,358.739L228.774,358.571L228.421,358.312L227.626,358.343L226.301,358.754L226.036,358.632L225.83,358.404L225.742,357.916L225.801,357.353L225.683,357.002L225.418,356.788L225.595,355.782L225.124,355.385L225.212,355.263L225.035,354.163L225.065,353.903L224.976,353.812L224.653,353.72L224.152,353.888L222.651,354.606L221.355,355.934L220.767,356.224L220.178,356.346L219.471,356.117L218.676,355.965L217.587,356.3L217.028,356.148L216.763,355.873L216.557,355.461L216.675,354.942L216.616,354.56L216.145,354.362L215.644,354.194L215.35,353.705L215.203,353.154L215.32,352.435L215.409,351.67L215.144,351.318L214.378,351.134L212.494,350.782L210.816,350.598L210.11,350.69L209.55,350.598L209.226,350.46L209.05,350.215L209.05,349.877L209.315,349.08L209.638,348.297L210.404,347.176L210.463,346.392L210.404,345.485L210.787,344.269L211.464,343.359L211.788,343.082L211.699,342.681L211.434,342.311L211.052,342.11L210.433,341.863L209.432,341.802L208.108,341.555L206.518,341.014L206.695,339.979L206.695,339.33L206.488,338.804L206.165,338.432L205.988,338.092L206.282,337.162L205.9,336.155L205.488,335.736L205.046,335.224L204.987,334.649L205.193,334.121L206.282,332.987L206.282,332.722L206.017,332.738L205.723,332.769L204.251,333.173L204.074,332.924L203.545,332.769L202.455,332.738L201.189,332.816L199.6,333.22L198.128,333.919L197.48,334.416L196.891,334.712L196.45,334.82L195.89,334.603L195.949,333.904L196.95,332.629L197.068,331.758L196.773,330.994L196.744,330.402L196.391,330.013L195.89,329.826L195.625,329.389L195.625,328.14L196.067,326.843L196.773,326.437L197.215,326.233L197.333,325.983L197.097,325.091L197.127,324.511L197.568,323.382L197.98,322.535L198.805,322.676L199.158,322.472L199.541,322.174L199.982,321.656L200.277,321.059L200.63,319.643L200.866,319.439L201.896,319.675L202.19,319.502L202.75,318.683L203.28,317.674L204.045,317.359L204.575,317.327L204.84,316.996L204.81,316.507L204.31,315.717L204.074,315.101L204.133,314.722L204.899,314.485L205.075,314.026L204.958,313.029L205.281,311.84L205.458,310.428L205.517,309.38L205.517,308.585L205.429,307.742L205.311,306.213L204.987,304.873L205.046,304.363L204.987,302.733L204.781,301.356L204.369,301.1L203.603,300.651L203.162,300.571L202.809,300.731L202.661,301.212L202.337,301.66L201.896,301.564L201.719,301.1L201.425,300.507L200.542,297.698L200.424,296.894L200.277,296.073L199.982,295.671L199.659,295.445L198.923,294.494L198.54,294.091L198.363,294.027L197.951,294.091L197.568,294.091L197.244,293.623L196.98,293.042L196.685,292.751L196.185,292.606L195.684,292.654L195.39,293.155L195.184,293.446L194.83,294.107L194.212,295.043L193.918,295.381L193.653,295.204L192.475,294.236L191.916,293.978L191.121,294.269L189.914,294.043L189.443,293.994L188.442,293.22L188.03,293.123L186.617,293.623L186.293,293.978L186.116,293.994L185.734,293.817L185.41,293.575L185.38,293.43L185.793,293.042L185.822,292.784L185.793,292.525L186.352,291.765L187.853,290.293L187.618,289.677L187,288.477L186.941,287.877L186.676,287.617L185.94,287.844L184.438,288.932L184.232,288.818L184.262,288.429L184.114,287.325L184.585,287L185.321,286.577L185.881,286.122L186.028,285.764L185.881,285.65L185.027,285.797L184.703,285.536L184.173,284.527L183.761,284.119L183.408,283.907L182.171,284.429L180.729,285.162L179.139,286.154L179.169,286.675L178.963,286.805L178.668,287.13L178.374,287.585L178.109,287.747L177.814,287.763L177.226,287.633L176.107,287.114L174.929,286.691L174.664,286.74L173.045,286.447L172.986,286.203L172.751,285.731L172.28,285.308L171.838,285.162L170.572,286.073L169.159,286.74L168.335,287.536L167.658,288.315L166.892,288.477L166.863,288.964L166.539,289.402L165.95,289.937L164.802,290.617L164.007,290.989L161.534,291.329L160.651,291.555L160.268,291.911L159.856,292.832L159.562,293.672L158.855,294.365L157.619,295.284L156.147,296.041L155.735,296.54L155.676,296.83L155.853,296.942L156.029,297.168L156.029,297.505L155.823,297.875L154.881,298.518L154.322,298.823L153.792,299.015L153.203,299.063L152.614,298.967L152.438,298.871L152.232,298.999L151.702,299.144L151.231,299.176L150.23,299.898L149.67,299.898L148.964,299.737L148.051,299.625L147.403,299.625L147.374,299.24L147.462,298.116L147.168,297.843L146.255,297.57L145.225,297.2L144.724,296.798L144.459,296.669L144.077,296.733L143.459,297.152L142.87,297.634L142.399,297.682L141.928,297.441L141.457,297.152L139.896,296.733L139.19,296.669L137.953,296.749L136.923,296.653L136.776,296.524L136.776,296.299L136.923,295.832L137.011,295.397L136.894,295.139L135.863,294.817L134.892,294.591L133.891,294.511L133.214,294.672L132.537,295.026L132.007,295.655L131.212,295.929L130.27,296.395L129.799,296.846L129.092,297.779L128.091,298.935L127.179,300.074L126.707,301.164L126.089,301.853L125.442,302.349L124.971,303.708L124.5,303.276L123.94,302.669L123.822,301.821L124.47,299.545L124.617,298.614L124.47,298.261L124.264,297.328L123.881,297.023L122.763,296.54L122.409,296.54L122.027,296.862L121.673,297.087L121.173,297.296L119.936,297.682L118.847,297.875L118.582,298.02L118.494,298.277L118.582,298.598L117.876,298.485L117.14,298.405L116.551,298.453L115.108,299.047L114.608,299.112L114.049,299.047L113.313,299.031L111.899,299.047L110.663,298.887L109.691,298.052L108.985,297.698L108.22,297.409L107.484,297.2L107.219,296.749L106.983,296.524L106.365,296.444L105.864,296.605L105.57,297.73L105.305,297.955L104.687,298.052L104.01,297.779L103.126,297.2L102.773,296.556L102.449,296.331L101.978,296.621L101.949,297.441L101.861,298.004L101.301,298.228L100.948,298.068L100.683,297.489L100.035,296.138L99.358,295.349L98.711,294.833L96.503,294.833L94.883,294.688L94.147,294.462L93.882,293.946L94.147,292.897L94.471,292.089L94.471,291.895L94.177,291.798L93.735,291.733L91.969,292.25L91.498,292.202L91.203,292.024L90.821,291.862L90.526,291.62L90.291,291.264L88.789,290.406L88.348,289.92L87.524,289.321L86.846,288.915L86.405,287.747L86.022,286.626L85.816,286.041L85.168,285.715L84.462,285.471L83.255,285.959L82.283,286.333L81.577,286.382L80.546,285.227L79.693,283.973L78.721,282.896L78.073,282.341L76.925,282.292L75.601,281.688L73.864,280.298L72.598,279.25L70.419,278.086L69.919,277.61L69.742,277.2L69.448,276.378L68.977,275.606L67.446,275.277L65.709,275.03L63.854,275.507L62.529,277.823L61.882,278.315L61.352,278.348L60.91,277.758L60.528,277.15L60.321,276.461L59.409,275.951L58.378,275.293L57.849,274.767L57.26,274.454L56.7,274.305L55.611,273.877L54.404,273.383L53.845,273.317L53.786,272.97L53.963,272.211L53.845,271.501L53.492,271.204L52.932,271.287L51.666,270.261L51.607,270.261L51.578,270.212L51.225,269.931L50.577,269.517L49.517,269.533L48.722,269.699L48.134,269.268L47.28,268.589L47.103,268.44L46.868,268.191L45.984,266.897L44.954,265.352L44.454,265.135L44.189,265.252L43.865,266.067L43.659,265.983L43.276,266.033L42.834,266.332L42.393,266.399L42.098,266.316L41.981,266.116L42.128,265.036L41.863,264.686L42.098,263.937L42.481,263.287L42.069,262.803L41.598,262.119L41.539,261.485L41.804,260.699L41.922,260.013L41.833,259.779L41.451,259.394L39.979,257.533L39.89,257.332L39.626,256.711L39.537,255.77L39.331,255.097L39.096,254.592L39.125,254.339L39.302,254.222L40.214,254.087L41.068,254.019L41.657,253.834L41.951,254.222L42.069,254.794L42.216,255.097L42.776,255.635L43.423,256.156L44.071,256.089L44.63,255.871L45.131,255.013L45.484,254.811L45.896,254.777L45.896,254.71L45.867,254.154L46.014,252.806L45.955,252.266L45.778,251.776L45.808,251.235L45.749,250.441L45.278,249.899L44.984,249.696L44.925,249.408L45.101,248.866L45.19,248.239L45.013,247.713L44.63,247.475L44.189,247.067L43.659,246.541L43.423,246.133L42.982,245.708L42.481,245.027L42.363,243.562L42.334,241.991L42.157,241.222L41.863,239.973L41.892,239.562L42.069,239.253L43.541,238.241L43.865,237.863L43.894,237.554L43.835,237.125L43.57,236.626L42.982,236.248L42.157,235.628L41.392,234.991L40.126,234.595L38.595,234.112L38.212,233.629L37.859,232.489L37.211,230.724L36.534,228.834L36.004,227.688L35.975,227.114L36.299,225.686L36.269,225.39L36.004,225.285L35.475,225.46L35.062,225.686L34.709,225.582L34.356,225.338L34.297,225.251L34.268,225.216L33.649,225.373L32.413,225.46L32.001,225.442L31.382,225.425L30.146,225.094L28.468,224.658L26.76,224.047L25.818,223.557L25.495,223.383L24.729,222.876L24.17,222.438L24.081,221.283L23.669,221.37L22.727,221.791L21.609,222.053L21.02,222.053L20.755,221.878L20.402,220.652L20.137,220.318L19.636,220.178L19.106,219.968L18.841,219.652L18.782,219.248L19.018,218.791L19.312,218.439L19.342,216.273L19.165,215.497L19.018,214.861L18.606,214.048L18.252,213.553L17.693,213.093L16.839,212.615L16.074,212.437L15.132,212.774L14.837,212.65L14.455,211.161L14.219,210.859L12.571,210.237L11.835,210.095L10.951,210.29L10.48,210.45L10.098,210.184L9.48,209.846L8.861,209.597L8.125,209.597L7.625,209.739L7.507,209.65L7.272,209.384L6.271,208.565L6.241,208.351L7.772,207.549L8.685,207.228L9.156,206.996L9.244,207.032L9.48,207.424L10.068,207.656L10.48,207.603L10.716,207.407L11.452,206.961L12.041,206.443L12.365,206.014L12.188,205.335L11.275,204.53L10.687,204.082L10.51,203.796L10.657,202.899L10.863,202.02L10.745,201.678L10.569,201.391L10.48,200.437L10.098,199.267L9.656,198.582L9.538,197.661L9.509,196.811L10.039,195.454L9.833,194.874L9.303,194.348L7.419,193.404L5.476,192.786L4.74,192.804L4.269,192.768L3.739,193.313L3.415,194.04L2.973,194.112L2.149,193.804L1.59,193.331L1.207,192.368L0.883,191.13L0.707,190.747L0.795,190.419L1.001,190.109L1.531,189.835L1.619,189.543L1.531,189.196L1.119,188.739L0.677,188.118L0,186.799L0.118,186.066L0.236,185.019L0.206,184.468L0.883,184.339L1.766,184.045L2.179,183.585L2.443,183.106L2.502,182.812L2.237,181.65L1.884,181.151L1.855,180.745L2.031,180.449L2.267,179.913L2.708,178.839L3.15,178.154L3.386,177.987L3.915,177.82L5.181,177.634L6.565,177.152L8.214,175.702L8.773,175.292L9.48,175.087L10.009,175.106L10.098,174.92L9.744,174.025L9.833,173.708L10.039,173.447L10.274,173.335L11.423,173.801L12.306,173.745L13.366,173.465L15.632,171.877L15.927,171.915L16.162,172.12L16.427,173.073L16.751,175.087L16.928,175.348L18.517,175.367L19.607,174.64L20.078,174.473L20.843,174.584L21.255,174.249L21.667,174.007L22.168,174.845L22.816,174.435L23.493,173.801L23.817,173.129L24.288,172.42L24.641,171.503L24.788,170.642L24.965,170.248L25.347,169.836L26.289,168.051L26.996,167.6L27.614,167.43L29.233,167.75L30.058,167.713L32.501,167.938L33.62,167.6L34.415,167.261L35.563,167.317L36.917,167.035L38.742,164.809L38.772,164.337L38.89,163.826L39.537,163.315L40.362,162.861L41.981,161.761L45.307,160.033L46.485,159.329L46.985,159.348L48.222,158.91L50.371,158.052L50.96,156.983L51.519,156.773L54.051,156.582L54.198,156.467L54.286,156.276L54.139,155.511L53.992,154.84L54.169,154.649L54.375,154.342L54.345,153.92L53.963,152.537L53.727,151.21L53.58,150.034L53.609,149.571L53.933,148.817L54.316,148.121L55.729,147.463L56.671,147.269L56.73,146.843L55.964,146.572L55.405,146.145L55.317,145.893L55.346,145.621L55.464,145.368L56.406,144.883L57.319,144.416L58.408,144.708L58.643,144.513L58.702,144.046L58.467,143.559L58.231,142.78L57.731,142.37L57.701,141.882L58.025,141.062L57.584,139.516L57.113,138.143L56.318,135.803L55.788,135.133L55.493,134.047L55.17,133.474L55.199,132.624L55.258,132.03L55.17,130.86L55.022,129.569L55.17,128.275L55.464,127.418L55.376,127.079L55.552,126.839L55.994,126.76L56.2,126.4L55.994,126.04L55.228,125.761L54.345,125.32L53.315,125.38L52.255,125.461L51.725,125.12L51.254,124.72L51.225,124.459L51.872,123.758L52.756,123.035L54.139,122.714L55.67,122.232L56.435,121.89L57.466,121.649L58.643,121.548L59.262,121.608L60.763,121.145L63.177,120.259L65.385,119.512L66.092,119.068L66.651,119.512L66.916,120.501L67.534,121.004L68.182,121.246L68.535,121.246L69.624,120.843L70.802,120.581L71.273,120.722L71.862,121.226L72.539,121.689L72.892,121.649L73.187,121.306L73.51,120.601L73.716,119.714L73.746,118.765L73.628,118.179L73.393,117.976L72.333,117.632L71.302,117.065L71.185,116.558L71.214,116.193L71.479,115.3L72.127,113.652L72.804,111.367L73.157,109.566L74.276,106.876L75.159,104.05L76.602,99.965L76.837,99.153L76.955,97.86L77.043,97.338L77.544,97.046L78.368,97.318L80.429,98.257L81.989,99.049L82.637,99.32L83.608,99.59L85.11,99.923L85.993,99.819L86.729,99.632L87.759,99.611L89.319,99.861L89.82,99.861L90.438,99.902L90.85,100.298L91.086,101.191L91.41,101.585L91.998,101.44L93.264,100.651L94.059,100.027L95.06,99.132L96.061,99.007L97.121,98.799L97.504,98.361L97.886,97.297L98.534,96.502L98.622,95.498L98.416,94.785L97.945,93.609L97.975,92.832L97.739,90.556L97.445,88.483L97.768,86.829L98.269,84.957L98.475,84.382L98.828,83.635L99.299,82.738L99.947,82.46L101.802,82.268L103.509,81.882L104.392,81.497L105.276,81.261L105.835,80.961L106.777,79.652L107.219,78.878L107.542,76.853L107.307,75.882L107.484,75.017L107.955,74.497L108.573,73.977L109.014,73.89L109.898,73.738L111.399,73.803L112.164,74.042L112.93,74.15L113.401,73.977L113.725,73.586L114.225,73.456L114.991,73.283L115.756,73.044L116.168,73.087L116.256,73.673L116.198,74.107L116.345,74.713L116.639,75.125L116.551,75.536L116.109,75.795L115.697,76.141L115.579,76.594L116.139,77.155L116.315,77.716L117.228,78.039L117.905,78.405L118.17,78.749L118.111,79.158L117.787,79.588L117.463,80.039L117.434,80.318L117.522,80.64L118.199,80.854L118.994,81.197L120.231,81.668L121.085,82.503L121.909,82.738L122.321,83.571L122.409,84.765L123.263,85.362L124.558,86.213L125.206,86.361L125.618,86.85L126.266,87.423L126.825,87.614L127.473,87.699L128.562,87.147L129.799,87.105L130.446,87.402L131.094,88.568L131.536,88.928L131.801,89.266L132.242,89.562L132.654,89.605L133.302,89.351L133.714,88.843L134.273,88.949L134.48,89.288L134.597,89.858L134.892,90.556L135.598,91.083L136.599,91.399L136.746,91.652L136.894,92.369L137.159,92.853L137.512,93.483L137.865,94.659L137.953,95.602L138.101,96.126L138.572,96.983L139.308,98.361L139.896,99.507L140.573,99.736L141.162,100.111L141.486,100.963L142.104,102.56L142.193,103.616L142.252,104.401L142.458,104.752L142.487,105.186L141.987,106.855L141.545,107.616L141.486,108.253L141.78,109.361L142.193,110.201L142.252,111.02L141.898,111.612L141.309,112.368L141.015,112.796L140.544,113.163L139.837,114.609L139.543,116.193L139.455,117.004L139.72,117.592L140.161,118.239L140.279,118.805L141.015,120.057L141.221,120.843L141.516,120.863L141.839,120.601L142.634,120.601L143.341,120.863L144.047,121.427L144.783,121.749L145.843,121.669L146.402,121.97L146.991,122.232L148.257,122.312L149.199,122.312L150.642,122.312L151.819,122.694L153.88,123.015L155.146,122.975L156.854,122.694L157.884,122.875L160.975,123.296L162.8,123.758L163.948,124.259L164.743,125.06L165.685,126.3L166.421,126.859L168.394,127.199L169.748,128.654L170.808,129.191L172.574,130.582L173.84,131.118L175.341,131.614L177.785,131.416L177.932,131.594L177.756,132.347L177.608,133.376L177.608,134.126L177.844,134.502L178.786,134.738L179.228,135.093L179.581,135.803L179.757,136.236L180.552,138.379L181.818,141.55L181.965,142.76L182.407,143.54L183.761,144.766L184.497,145.679L185.557,146.649L185.91,147.54L185.999,148.682L186.264,148.972L188.236,148.701L189.914,148.527L192.976,148.198L197.156,148.798L201.484,149.377L205.311,149.879L207.195,150.13L211.464,150.67L213.848,149.976L215.674,149.455L216.527,149.513L220.06,150.13L222.15,150.439L224.741,150.844L226.566,150.998L228.038,150.998L228.745,151.152L229.392,151.422L229.834,151.806L231.188,153.709L231.954,154.572L233.455,155.204L236.87,155.932L238.784,156.372L240.962,156.869L242.375,157.632L244.024,158.529L246.173,159.671L248.499,159.176L251.03,158.624L252.591,158.3L252.591,160.679L254.858,160.888L255.564,160.85L256.565,161.382L257.124,161.154L257.654,160.641L258.331,159.824L259.273,159.462L260.951,158.548L261.334,158.319L263.807,157.002L267.487,155.396L269.136,154.61L269.636,154.438L270.549,154.035L271.196,153.767L272.286,153.536L273.817,153.402L275.465,153.095L279.175,152.518L279.646,152.46L281.765,152.23L282.648,151.999L283.973,152.114L285.71,152.211L286.858,152.345L288.389,152.23L290.509,152.076L292.187,152.095L293.041,151.903L294.277,151.306L295.131,150.824L296.455,150.246L298.075,149.628L299.193,149.088L299.959,148.721L300.871,148.373L301.107,147.928L301.372,147.598L301.843,147.017L302.726,145.951L303.403,145.019L303.727,144.61L304.463,143.676L305.052,142.975L305.847,142.019L306.494,141.707L307.289,141.453L309.468,140.514L309.88,140.319L310.263,140.28L311.028,139.516L311.646,138.869L312.088,138.379L312.942,138.202L313.413,137.849L313.472,137.377L313.383,136.669L312.971,135.961L312.618,135.31L311.352,134.107L310.704,133.356L310.027,132.386L309.762,131.475L309.291,130.9L309.056,130.384L309.144,129.788L309.762,128.733L309.998,128.076L310.263,126.879L310.851,125.1L311.352,124.279L311.911,123.457L313.118,122.372L314.207,122.171L314.885,122.372L316.327,122.372L317.328,122.433L318.035,122.975L318.829,124.059L319.742,124.459L322.539,125.3L323.746,125.481L324.6,125.521L325.866,125.801L326.278,125.86L326.925,126.04L327.455,125.841L328.28,125.12L329.31,124.319L329.752,124.119L330.546,123.778L330.959,123.437L331.665,122.533L332.607,121.83L333.726,120.763L334.285,119.956L334.403,119.452L334.55,118.886L334.874,118.583L335.581,118.32L336.346,118.239L337.818,118.725L339.82,118.583L340.261,118.522L342.087,118.239L342.882,118.017L344.059,117.794L344.942,116.903L346.12,115.828L346.974,115.239L347.562,115.117L348.269,114.507L348.622,113.836L348.534,113.265L348.416,112.776L348.828,111.878L349.594,110.304L350.3,109.566L350.889,108.972L351.272,108.027L351.713,107.74L352.302,107.637L353.097,106.999L353.686,106.855L354.657,107.164L356.1,107.246L357.042,107.287L357.572,107.164L357.748,106.814L357.748,106.279L358.043,105.083L358.161,104.69L358.426,104.505L359.309,104.484L359.927,104.918L360.339,105.268L360.898,105.31L361.487,105.083L362.282,104.112L363.607,103.554L364.313,103.409L365.55,102.954L366.315,103.119L367.758,103.243L368.317,103.14L368.935,103.243L369.465,102.581L369.907,102.436L370.849,102.726L371.438,103.243L372.527,103.885L373.911,104.174L375.059,104.029L376.266,104.298L376.972,104.277L377.296,104.009L378.297,103.492L378.533,102.767L378.415,102.063L378.533,101.274L378.238,100.672L377.65,99.819L377.414,99.236L377.385,98.486L377.002,97.756L376.089,96.9L375.5,96.481L374.264,94.974L373.852,94.617L373.705,94.386L373.587,93.861L373.116,93.63L372.527,93.231L372.203,92.832L371.997,92.137L371.85,91.673L371.35,91.294L370.82,91.083L370.201,90.809L369.23,90.408L368.671,89.626L367.67,88.144L367.081,87.657L364.991,87.466L364.225,87.105L363.371,87.232L362.841,87.466L361.723,87.466L361.134,87.614L360.369,88.568L359.368,89.837L358.573,90.619L357.984,91.399L357.719,91.695L357.189,91.526L356.453,90.619L355.423,89.816L354.451,89.457L354.039,89.245L352.891,89.055L351.978,89.118L350.86,89.414L349.741,89.351L349.27,89.161L348.563,89.182L347.268,90.027L346.62,90.978L345.825,91.273L345.119,90.64L344.295,89.901L343.529,88.991L343.058,88.123L342.764,85.851L343.706,85.17L344.913,84.424L345.001,83.208L344.972,81.861L345.207,80.361L346.297,78.986L346.856,77.824L346.944,77.112L347.474,75.903L347.975,74.648L348.652,72.979L349.947,70.041L351.478,66.518L352.243,64.76L353.921,65.859L355.011,66.408L356.836,67.285L358.749,67.483L360.545,68.402L361.487,68.686L361.988,68.686L364.549,66.43L366.698,64.496L369.2,62.997L371.026,62.799L372.409,62.357L373.322,61.672L373.852,60.543L374.028,58.967L373.646,58.011L372.763,57.678L372.527,57.344L372.969,56.987L373.293,56.34L373.499,55.336L373.999,54.396L374.853,53.523L375.294,52.536L375.383,51.435L375.883,50.354L376.796,49.272L377.296,48.255L377.385,47.327L377.856,46.194L379.092,44.148L379.916,41.822L381.3,40.197L383.537,38.544L384.951,36.888L385.51,35.249L385.451,33.791L384.803,32.539L384.686,31.238L385.098,29.934L384.744,28.953L383.626,28.299L382.33,28.135L380.77,28.463L379.916,28.065L379.74,26.918L380.152,25.98L381.153,25.275L382.831,23.533L385.127,20.745L387.423,19.228L390.868,18.776L393.635,17.873L396.461,16.92L398.493,16.467L398.846,16.777L399.935,16.848L401.819,16.705L403.556,16.3L405.175,15.655L406.441,15.488L407.383,15.846L407.913,15.846L408.267,15.894L408.473,15.894L408.885,15.631L409.974,16.109L412.035,17.563L413.33,18.206L413.89,18.039L414.478,18.444L415.097,19.394L415.891,19.963L417.305,20.224L418.718,21.266L419.306,21.337L419.483,20.745L420.013,20.414L420.867,20.319L422.103,20.84L423.722,21.952L424.723,22.448L425.135,22.306L425.577,22.519L425.93,23.038L425.96,23.698L425.813,24.028L426.225,24.57L426.666,24.57L427.402,24.828L427.962,25.792L428.462,26.238L428.845,26.637L428.904,26.941L428.933,27.269L428.815,27.527L428.639,27.925L428.58,28.369L428.815,28.86L429.728,29.234L430.022,29.584L430.111,30.073L430.376,30.586L430.994,31.191L431.229,31.703L431.082,32.098L431.259,32.446L431.583,32.702L431.642,33.676L431.671,34.231L432.171,34.856L432.26,36.103L432.613,37.509L433.791,39.417L434.173,40.472L434.056,41.685L434.232,42.256L434.762,42.553L435.027,43.055L434.998,43.807L435.204,44.285L435.38,44.785L435.263,45.558L435.41,46.262L435.704,46.67L435.881,47.418L435.999,48.368L436.793,49.858L438.236,51.884L439.119,53.456L439.443,54.575L439.443,55.492L439.149,56.207L439.119,56.72L439.414,57.054L439.472,57.5L439.384,58.056L439.855,58.723L441.445,59.855L440.797,61.605L440.65,62.843L440.709,64.122L441.121,65.046L441.828,65.574L442.269,66.123L442.416,66.693L443.27,67.307L444.801,67.986L446.744,68.096L449.099,67.658L450.542,67.592L451.072,67.877L451.248,68.315L451.101,68.927L451.484,69.298L452.455,69.495L453.132,69.866L453.515,70.433L453.957,70.586L454.487,70.346L454.987,70.368L455.517,70.695L455.841,70.586L456.106,70.237L456.577,70.237L457.048,70.259L457.342,71.065L457.813,71.522L458.461,71.631L459.462,72.631L461.464,75.471L462.759,76.465L464.054,76.789L465.674,76.853L466.203,77.931L465.762,79.093L465.674,80.06L466.027,80.404L466.527,81.518L467.263,82.182L467.381,82.695L467.734,83.272L467.587,84.339L466.969,85.894L467.146,87.232L468.088,88.314L468.647,89.372L468.765,90.387L469,90.999L469.354,91.21L470.325,91.146L471.944,90.767L473.122,90.83L473.887,91.336L475.742,91.357L478.715,90.893L480.599,90.745L481.394,90.935L482.101,90.281L482.719,88.801L483.278,88.102L483.808,88.187L484.662,87.72L485.84,86.68L486.87,86.17L488.136,86.213L489.52,86.276L490.373,85.83L491.168,84.915L492.581,84.105L495.555,83.037L496.261,82.888L496.585,82.93L497.586,83.101L498.469,83.507L499.293,84.339L499.411,84.872L499.323,85.575L499.146,85.979L498.822,86.446L498.499,87.19L498.705,87.763L499.176,88.991L499.558,89.88L500,90.935L499.823,91.294L499.558,92.032L498.734,93.252L498.293,93.714L497.821,94.176L496.997,94.281L496.644,94.386L496.232,94.575L495.996,95.016L495.702,95.33L495.231,95.937L495.201,96.46L495.407,97.234L495.525,98.027L494.966,98.736L494.554,99.819L494.436,100.152L494.23,100.983L494.171,101.253L494.053,102.995L493.523,104.174L492.758,105.537L492.935,106.361L493.052,107.102L492.876,107.472L492.846,107.801L492.728,108.52L492.493,108.807L491.816,109.259L491.404,109.792L491.492,110.631L491.286,111.347L490.992,111.98L490.638,112.388L490.197,112.654L489.873,112.878L489.637,113.673L489.578,114.283L489.343,114.914L489.49,115.544L489.255,116.072L488.577,116.457L488.224,116.68L487.871,116.781L487.194,117.369L486.605,119.391L486.458,120.561L486.605,121.588L485.781,122.252L485.163,122.774L484.78,122.573L484.368,122.413L483.426,122.171L482.955,122.031L481.983,121.689L480.482,121.266L478.98,120.763L478.068,120.501L477.332,120.279L476.772,119.936L476.301,119.31L475.83,119.573L475.389,120.299L474.682,120.722L474.358,121.528L474.064,122.151L473.298,122.955L472.975,123.296L471.532,123.858L471.179,124.039L470.001,124.159L469.589,124.399L469.177,124.9L469.059,125.42L469.354,125.96L469.825,127.039L470.031,127.777L470.354,129.231L471.414,133.771L471.061,134.541L470.737,137.927L470.825,138.536L470.796,139.477L470.825,140.182L471.032,140.338L471.326,140.593L471.473,140.984L471.444,141.609L471.297,142.058L471.061,142.955L470.767,144.26L470.443,144.766L470.207,145.155L470.031,145.427L470.001,146.339L469.883,146.94L469.383,147.153L468.853,147.502L468.264,147.385L467.705,147.444L467.057,147.676L465.88,147.947L465.173,148.315L464.849,148.585L464.614,148.895L464.584,149.204L464.732,149.358L465.409,149.474L465.85,150.053L465.939,150.67L465.467,151.017L465.232,150.632L464.82,150.516L464.084,149.957L463.554,149.358L463.171,148.701L463.171,147.269L463.112,147.056L462.376,146.765L462.17,146.339L461.817,146.145L461.317,146.261L460.963,146.125L460.669,145.893L460.316,145.873L460.021,146.242L459.845,147.037L459.344,148.353L459.285,149.126L459.079,150.265L458.844,151.691L458.667,151.999L458.108,152.037L457.902,152.134L457.607,152.614L457.254,152.691L456.93,152.422L456.43,152.134L455.959,152.095L455.546,152.384L455.046,152.999L454.752,153.498L454.663,153.959L454.575,154.534L454.074,155.089L453.603,155.377L452.661,156.18L452.337,156.525L451.66,156.525L450.924,156.486L449.923,156.716L448.275,156.83L447.303,156.658L446.096,156.811L445.154,157.079L445.037,157.48L445.066,158.052L445.243,158.433L445.478,158.7L445.861,159.481L446.273,160.242L446.891,160.717L447.156,161.249L447.186,161.742L446.891,162.349L446.42,163.145L446.008,163.656L445.714,163.637L445.213,163.334L444.889,162.975L444.124,162.842L442.24,163.069L441.298,162.918L440.856,162.615L440.061,162.596L438.825,162.198L438.089,162.084L437.736,161.818L437.677,161.249L437.323,160.85L437.117,160.375L436.676,159.766L436.234,159.481L435.822,159.348L435.351,159.709L434.88,160.033L434.527,159.957L434.35,160.052L434.144,160.318L433.349,160.888L433.172,161.401L432.849,162.463L432.642,163.58L432.436,163.978L432.142,164.034L431.818,164.375L431.112,165.414L430.523,166.376L429.61,167.016L429.198,167.6L428.992,168.145L428.344,168.897L427.402,169.028L426.666,169.254L426.225,169.31L425.901,169.61L425.636,170.061L425.548,170.248L425.106,170.248L424.694,170.642L423.663,171.541L422.839,171.709L421.779,172.289L420.867,172.756L420.484,172.999L420.366,173.279L420.248,173.633L419.777,173.708L419.365,173.689L418.394,174.51L417.893,175.199L416.009,176.669L415.244,177.504L415.038,178.58L414.949,178.487L414.272,179.432L412.947,180.32L410.121,180.505L409.238,179.876L408.914,180.32L408.649,180.893L407.913,181.096L406.765,181.133L406.118,181.521L405.764,181.945L404.175,182.093L403.586,182.664L402.585,182.867L398.463,185.35L397.58,186.396L396.726,187.605L396.108,188.227L395.578,188.648L395.107,188.831L394.607,189.251L394.136,189.306L393.635,189.105L393.076,189.178L392.723,189.689L393.017,190.346L392.87,190.638L391.78,190.984L390.161,191.221L389.484,191.658L389.249,191.913L388.895,192.041L388.542,191.185L388.424,190.054L389.102,189.781L389.69,189.635L393.105,188.063L392.693,186.891L392.988,186.378L393.753,185.552L394.253,185.13L393.959,184.983L391.751,185.258L390.456,185.24L389.808,185.148L390.014,184.431L389.896,183.732L389.749,183.456L390.868,182.646L391.398,182.443L391.78,182.462L391.751,181.964L391.427,181.225L391.78,180.264L394.106,179.136L394.666,178.116L395.578,177.17L397.286,174.789L397.403,174.379L397.874,173.26L397.963,172.812L397.197,172.158L396.874,171.241L394.577,169.573L394.371,168.145L394.165,168.202L393.812,169.197L393.517,169.535L392.458,169.554L391.928,169.179L388.984,168.935L388.248,169.573L387.571,170.567L386.923,171.278L386.246,171.653L385.687,172.307L383.302,176.148L382.389,176.446L378.15,178.747L376.03,179.654L374.382,181.262L373.822,182.222L373.322,183.291L373.028,184.909L371.526,186.873L370.996,187.294L370.466,187.459L369.789,187.404L369.171,187.532L368.141,187.349L366.875,187.971L365.462,188.502L364.225,187.166L363.342,186.818L361.929,187.202L361.252,187.807L359.868,190.766L359.368,192.459L359.397,193.15L360.192,195.255L361.105,196.414L363.136,197.751L367.463,198.672L368.464,198.347L369.554,198.347L370.702,199.213L371.408,200.653L371.497,201.642L371.497,201.984L371.762,202.271L371.909,202.756L371.467,203.168L371.114,203.383L370.82,204.888L370.82,206.568L371.173,207.121L372.115,207.906L373.557,208.547L374.882,208.69L377.414,208.387L378.444,207.371L378.386,206.943L378.415,206.371L380.652,204.888L381.918,203.563L381.712,203.222L381.477,202.989L381.712,202.845L382.389,202.756L385.51,201.391L387.953,202.504L389.337,203.796L390.721,204.028L391.692,204.673L392.781,205.246L394.224,205.281L395.431,205.406L395.814,204.87L396.196,204.53L396.609,204.601L397.109,205.281L398.493,205.818L399.759,205.782L400.642,205.585L401.172,205.836L400.406,206.711L400.524,208.12L399.935,208.565L399.376,209.277L399.7,209.739L399.994,209.953L399.965,210.521L399.464,210.841L398.522,211.693L397.963,211.675L397.698,211.515L397.521,211.196L397.403,210.717L397.05,210.397L396.138,210.273L395.166,210.379L393.017,211.64L390.927,212.65L388.719,213.447L387.983,213.942L387.453,214.084L386.57,213.694L386.01,213.73L385.893,213.977L386.599,214.685L386.776,215.232L386.687,215.638L386.305,215.832L385.716,215.515L385.186,215.956L384.951,216.696L384.951,218.439L384.597,218.826L383.626,219.037L382.595,219.599L382.213,219.335L382.065,219.037L382.183,218.228L382.065,217.841L381.594,217.859L380.858,218.087L380.329,218.632L380.152,218.949L380.858,219.968L381.536,220.073L381.712,220.301L381.153,220.81L379.828,221.546L379.593,222.176L379.21,222.771L378.65,223.243L378.268,223.732L377.826,223.994L377.09,224.291L376.178,225.477L375.5,226.609L374.706,227.166L374.087,229.06L372.969,230.066L372.557,231.694L372.851,232.696L374.058,232.679L374.676,233.042L375.972,234.353L377.502,235.198L379.063,235.68L381.006,236.901L381.565,237.4L382.007,238.447L382.86,241.427L383.449,242.896L383.508,243.681L384.421,245.129L385.392,247.611L386.481,249.764L386.717,251.438L386.334,252.215L386.364,253.21L387.453,254.137L389.955,255.198L390.338,255.501L390.838,256.022L390.838,257.617L391.221,258.137L391.574,258.439L393.076,259.126L393.694,259.679L394.371,260.582L394.548,261.384L394.636,262.47L393.782,262.503L393.105,262.386L390.426,260.983L389.72,260.933L388.748,261.134L387.335,260.866L385.834,259.31L384.774,258.841L383.626,258.59L380.888,259.946L380.181,259.846L379.975,259.997L379.651,260.231L380.947,260.515L382.213,260.08L383.449,259.427L385.215,259.779L385.51,260.365L385.804,261.351L387.041,262.019L388.012,262.319L389.219,263.187L390.426,264.57L392.958,266.15L393.988,267.644L394.371,268.622L394.724,269.997L393.841,270.443L393.076,270.51L391.869,270.725L390.986,271.204L390.073,272.063L387.541,273.416L387.041,274.256L386.717,274.981L386.099,275.343L384.509,274.997L383.037,275.03L381.388,276.017L380.976,276.411L381.241,276.346L381.506,276.214L382.242,276.362L383.42,275.836L384.538,277.446L386.776,277.183L388.866,275.836L389.661,275.819L390.338,276.033L391.074,276.559L393.105,278.889L394.195,279.151L395.284,279.692L395.873,279.758L396.402,279.921L394.96,280.772L393.076,282.619L392.252,283.059L391.692,283.549L393.194,283.304L394.283,282.423L394.813,282.21L395.254,282.406L395.46,283.5L395.048,286.837L394.518,286.886L394.018,285.975L393.429,285.699L392.899,285.878L391.928,285.878L391.545,286.285L391.221,286.87L391.81,286.984L392.988,287.991L393.105,288.526L392.781,288.883L391.957,288.737L392.958,289.483L392.693,290.26L392.369,290.568L391.78,290.762L391.427,291.442L391.957,292.557L392.487,293.994L392.546,294.688L391.722,294.398L390.456,295.268L389.779,295.333L389.308,294.188L388.748,294.365L388.366,294.704L387.836,295.945L387.217,297.055L386.658,297.361L386.01,297.28L385.48,297.312L385.628,297.602L386.187,297.971L386.187,298.405L384.98,299.753L384.774,300.283L384.803,300.731L384.185,301.276L384.509,302.189L384.332,302.829L383.773,303.692L383.214,304.267L382.507,305.193L381.653,305.719L380.505,307.663L380.181,308.633L380.093,309.634L379.71,309.968L379.122,310.413L378.415,310.19L378.386,309.523L378.091,309.46L377.915,309.031L377.856,308.474L377.944,308.029L377.65,308.156L377.473,308.681L377.002,309.11L376.531,308.935L376.001,308.585L376.03,309.094L376.295,309.587L376.413,310.095L377.12,310.19L377.62,310.778L378.003,311.65L378.062,311.983L378.356,312.379L378.386,312.712L377.708,313.029L376.855,313.599L375.824,314.595L374.971,315.259L374.205,315.259L373.764,315.18L373.086,314.801L372.321,314.643L373.351,315.986L373.911,316.223L374.617,316.175L375.294,315.67L376.266,315.717L376.501,316.491L376.236,317.359L375.707,318.494L375.618,319.47L376.266,320.854L376.295,321.279L376.03,321.483L375.265,321.122L374.647,320.666L373.999,320.776L373.351,320.587L372.674,320.744L372.38,321.074L372.586,321.609L373.175,322.048L373.528,322.723L373.116,322.959L371.408,322.802L370.996,322.927L370.496,323.665L370.82,324.777L370.437,325.451L369.73,325.623L368.788,326.171L368.229,326.296L368.258,326.53L368.671,326.781L368.906,327.109L368.376,328.234L367.611,328.593L366.374,328.406L365.432,328.671L364.608,328.187L363.725,328.171L363.136,328.78L363.077,329.482L362.488,329.545L362.164,329.498L361.723,329.545L361.782,329.919L362.017,330.246L363.224,330.402L363.43,330.87L363.489,331.602L362.223,332.847L361.693,333.686L360.898,333.671L360.31,334.339L359.986,335.27L359.574,335.084L358.661,335.224L358.367,335.658L358.602,335.844L358.632,336.155L358.249,337.193L357.837,337.472L357.66,337.054L357.542,336.403L357.219,336.356L356.689,336.961L356.041,337.395L355.511,337.565L355.099,337.162L354.098,336.961L353.715,338.695L352.862,339.314L352.479,339.515L351.802,339.577L352.243,339.809L352.39,340.257L352.126,340.69L351.448,340.783L351.066,341.122L350.919,342.666L350.506,343.205L349.476,343.236L348.711,342.881L348.475,343.174L348.357,343.436L347.945,343.714L347.18,343.791L345.443,344.484L344.677,344.284L343.735,344.022L343.058,344.284L342.852,344.807L342.558,345.208L341.616,345.208L340.85,344.715L340.085,344.346L339.231,344.654L338.583,345.3L337.789,345.515L337.641,345.915L337.288,346.115L336.434,346.038L336.11,345.038L335.639,344.9L335.168,345.392L334.992,345.792L334.756,346.085L334.845,346.899L334.374,346.915L333.755,346.423L333.078,346.331L332.489,346.792L332.166,346.669L331.842,346.577L331.312,346.577L331.106,346.7L330.723,346.777L330.458,347.022L330.429,347.053L329.752,346.884L328.898,346.208L328.309,345.085L327.544,344.484L327.19,343.945L327.073,342.989L326.925,342.542L326.984,342.033L327.19,341.585L326.366,341.817L325.777,342.234L325.895,342.758L325.748,343.252L324.835,343.498L324.894,343.714L324.953,343.93L325.659,344.592L325.807,345.146L326.101,345.454L326.66,346.315L326.631,348.006L326.955,348.481L326.837,348.942L326.631,349.586L326.602,349.586L326.425,349.402L326.16,349.433L326.072,349.647L326.042,349.847L326.013,349.862L325.542,350L325.13,350.123L324.806,350.291L324.305,350.782L323.334,350.904L322.863,349.739L322.186,350.521L322.009,352.114L321.744,352.389L321.332,352.619L320.566,352.053L319.889,352.435L319.359,352.818L319.124,353.154L318.741,353.536L318.005,353.169L317.387,352.619L317.534,352.206L317.475,351.946L317.181,351.731L316.886,351.762L317.034,352.298L317.151,353.322L316.857,353.613L316.445,353.842L315.532,353.659L314.914,353.277L314.149,352.955L313.501,352.894L313.354,353.536L312.912,354.071L312.529,354.132L312.117,354.041L311.587,354.606L311.352,355.018L310.704,355.461L308.997,355.66L308.378,356.102L307.584,356.026L306.965,356.133L306.583,356.102L306.288,355.873L305.906,355.873L305.758,356.59L304.787,356.895L303.904,356.971L302.932,357.916L302.226,358.48L301.725,358.541L301.342,358.343L301.136,357.49L300.96,357.398L300.842,358.191L300.665,358.845L300.312,359.211L299.193,360.032L298.87,360.853L299.076,361.598L300.577,361.78L300.783,362.19L300.636,362.524L300.253,362.813L300.165,363.238L301.784,364.572L301.843,365.087L301.578,365.375L301.284,365.996L300.43,366.526L298.605,366.799L297.103,366.526L296.632,365.921L296.662,365.497L297.044,365.618L297.456,365.572L297.339,365.178L297.162,364.951L296.455,364.603L295.896,363.662L296.014,362.889L295.69,362.281L295.366,361.765L295.013,361.461L294.836,361.081L295.19,359.895L294.984,359.211L295.631,358.358L295.808,357.398L296.956,357.063L297.044,356.148L296.191,356.117L295.631,355.446L295.484,355.721L295.042,355.751L294.277,354.469L294.041,354.301L293.688,354.27L293.865,355.644L292.982,356.148L292.246,356.377L291.215,356.468L290.626,356.621L290.097,356.499L290.214,356.087L290.509,355.583L290.244,355.171L289.655,354.866L288.772,354.881L288.154,354.789L287.565,354.82L287.329,354.637L286.77,353.995L286.269,353.598L286.063,353.2L286.269,352.726L286.093,352.451L285.151,352.42L285.18,353.078L285.268,353.873L285.533,354.469L285.357,354.805L284.886,355.034L284.385,354.392L284.15,354.239L283.885,354.27L283.708,354.896L283.267,355.461L282.442,355.4L281.795,355.751ZM304.875,369.157L305.258,369.55L305.523,370.109L305.758,371.135L305.876,372.085L305.052,372.688L304.316,372.929L302.844,375.247L302.52,375.969L302.285,376.284L302.196,376.6L302.226,376.915L301.843,378.027L301.49,379.392L301.284,379.947L300.871,380.367L300.312,380.591L299.988,380.621L299.664,380.741L298.87,381.475L297.986,382.044L298.134,382.299L298.134,382.538L297.751,382.808L297.339,382.763L296.102,382.972L295.631,383.391L295.16,384.154L294.984,384.258L294.248,384.438L293.659,384.512L292.687,383.974L292.216,383.81L290.921,383.585L289.655,383.226L288.772,382.808L286.976,381.775L286.77,379.932L286.446,378.927L286.446,378.567L286.564,375.473L286.682,375.142L286.917,374.841L287.712,374.149L288.625,373.591L289.92,372.447L290.891,371.919L291.686,371.165L291.215,371.195L290.862,371.105L291.215,370.456L291.569,370.109L291.981,369.927L292.834,370.063L293.629,369.927L294.189,369.354L294.748,369.233L296.838,369.414L298.281,369.157L298.987,368.628L299.341,368.598L300.4,368.749L300.813,369.308L300.783,368.931L300.813,368.583L301.019,368.613L302.402,369.293L302.402,368.462L302.491,368.235L302.932,367.888L303.138,367.903L303.698,368.568L304.198,368.961Z'

// Dynasty-specific territory SVG paths (viewBox 0 0 500 400)
// 各朝代鼎盛时期疆域简化多边形，基于真实历史疆域范围绘制
// 坐标系参考（已验证坐标）：
//   北京(334,113) 上海(387,213) 广州(310,345) 西安(241,156)
//   洛阳(300,145) 成都(205,225) 杭州(378,230) 南京(345,200)
// 海南岛：x≈286-306, y≈360-385  台湾：x≈380-399, y≈241-300
const chinaMapPath = computed(() => {
  const paths: Record<string, string> = {
    // 上古（传说时代/夏朝核心区）：仅限黄河中下游河洛地区，约33万km²
    '上古': 'M 255 120 L 240 130 L 230 148 L 232 165 L 242 178 L 258 185 L 278 188 L 295 180 L 310 168 L 322 155 L 325 140 L 318 128 L 302 120 L 285 115 L 268 113 Z',
    // 汉朝（西汉极盛）：约610万km²，东至朝鲜、西至巴尔喀什湖/葱岭、北至贝加尔湖、南至越南
    '汉朝': 'M 38 78 L 32 65 L 50 42 L 80 25 L 120 18 L 175 20 L 230 28 L 280 26 L 330 32 L 370 48 L 405 70 L 430 95 L 438 118 L 420 142 L 400 162 L 388 185 L 382 208 L 388 235 L 395 255 L 388 285 L 370 315 L 352 340 L 338 352 L 325 358 L 300 365 L 275 370 L 250 362 L 228 340 L 210 310 L 195 285 L 180 260 L 165 230 L 152 205 L 138 178 L 118 158 L 95 138 L 72 115 L 52 100 Z',
    // 唐朝（高宗极盛）：约1237万km²，西至咸海/波斯边境、北至贝加尔湖、东至朝鲜、南至越南
    '唐朝': 'M 18 85 L 8 68 L 15 48 L 40 28 L 72 15 L 120 8 L 180 10 L 242 20 L 302 22 L 355 28 L 400 42 L 430 62 L 450 88 L 452 115 L 438 142 L 425 162 L 410 185 L 402 208 L 408 235 L 415 258 L 405 290 L 388 322 L 368 348 L 348 362 L 328 370 L 305 375 L 280 378 L 262 372 L 245 355 L 225 328 L 210 298 L 195 268 L 178 238 L 160 208 L 142 180 L 120 155 L 95 132 L 70 112 L 48 102 Z',
    // 宋朝（北宋）：约264万km²，东至大海、西至秦州、北至白沟河、南至海南岛
    '宋朝': 'M 215 148 L 208 162 L 202 185 L 208 208 L 220 232 L 235 258 L 255 282 L 275 302 L 295 320 L 312 340 L 325 355 L 340 362 L 345 368 L 362 358 L 378 338 L 392 315 L 405 290 L 415 265 L 422 240 L 420 208 L 408 188 L 390 172 L 368 158 L 345 148 L 322 140 L 302 135 L 278 132 L 255 138 L 235 145 Z',
    // 明朝（永乐极盛）：约650万km²，含奴儿干都司、关西七卫、乌思藏都司
    '明朝': 'M 175 118 L 168 132 L 155 155 L 138 190 L 125 225 L 118 260 L 128 285 L 145 302 L 172 318 L 202 330 L 235 340 L 265 348 L 295 350 L 315 356 L 335 362 L 355 358 L 375 338 L 392 315 L 405 290 L 418 265 L 428 240 L 438 215 L 442 182 L 435 158 L 428 138 L 412 118 L 392 100 L 372 82 L 358 62 L 355 42 L 348 30 L 335 32 L 318 48 L 298 58 L 275 66 L 252 76 L 228 88 L 205 100 L 188 110 Z',
    // 清朝（乾隆极盛）：约1300万km²，西至巴尔喀什湖、北至外兴安岭、东至库页岛、南至南海，"海棠叶"形
    '清朝': 'M 38 58 L 48 40 L 72 20 L 108 10 L 152 6 L 200 8 L 255 10 L 305 14 L 355 22 L 392 30 L 425 40 L 450 36 L 462 42 L 456 62 L 448 82 L 444 102 L 448 122 L 440 142 L 432 162 L 422 182 L 415 205 L 422 228 L 430 255 L 425 280 L 408 305 L 388 328 L 368 350 L 348 365 L 328 375 L 305 380 L 280 382 L 262 378 L 242 362 L 225 342 L 208 320 L 192 295 L 175 265 L 158 238 L 142 215 L 122 190 L 100 168 L 78 148 L 58 128 L 48 102 Z'
  }
  return paths[dynasty.value?.name || ''] || paths['上古']
})

const navigateToEvent = (id: number) => router.push(`/event/${id}`)
const navigateToPerson = (id: number) => router.push(`/person/${id}`)
const navigateToTimeline = () => router.push('/timeline')

// =============== 朝代历史发展曲线（山峰风格） ===============
const hoveredStageIdx = ref(-1)

// 给每个朝代预设分阶段节点（9~11 个真实历史节点，体现跌宕起伏的盛衰转折）
// 未预设的朝代就根据它的重大事件（按start_year）自动生成
const dynStagesMap: Record<string, { name: string; year: number; value: number; tag?: string }[]> = {
  '上古': [
    { name: '部落初现', year: -3000, value: 4, tag: '文明萌芽' },
    { name: '神农时代', year: -2800, value: 6, tag: '农耕兴起' },
    { name: '炎帝部落', year: -2700, value: 7.5, tag: '姜水之滨' },
    { name: '炎黄联盟', year: -2600, value: 9, tag: '阪泉合盟' },
    { name: '涿鹿之战', year: -2550, value: 9.5, tag: '蚩尤败北' },
    { name: '黄帝一统', year: -2500, value: 10, tag: '华夏初成' },
    { name: '颛顼帝喾', year: -2350, value: 8, tag: '五帝相承' },
    { name: '尧舜盛世', year: -2200, value: 9.5, tag: '禅让之治' },
    { name: '大禹治水', year: -2100, value: 9, tag: '水患平息' },
    { name: '夏朝建立', year: -2070, value: 8, tag: '家天下始' }
  ],
  '唐朝': [
    { name: '李渊开国', year: 618, value: 6, tag: '大唐建元' },
    { name: '玄武门变', year: 626, value: 5.5, tag: '宫闱之变' },
    { name: '贞观之治', year: 645, value: 9, tag: '天下大治' },
    { name: '永徽之治', year: 670, value: 8.5, tag: '承平之世' },
    { name: '武周称帝', year: 695, value: 8.5, tag: '女皇临朝' },
    { name: '开元盛世', year: 740, value: 10, tag: '万国来朝' },
    { name: '天宝危机', year: 750, value: 7, tag: '隐患已伏' },
    { name: '安史之乱', year: 762, value: 3, tag: '由盛转衰' },
    { name: '元和中兴', year: 818, value: 6, tag: '稍复元气' },
    { name: '会昌中兴', year: 842, value: 5.5, tag: '短暂回暖' },
    { name: '黄巢起义', year: 880, value: 2.5, tag: '大厦将倾' }
  ],
  '汉朝': [
    { name: '楚汉相争', year: -204, value: 5, tag: '逐鹿中原' },
    { name: '刘邦建汉', year: -202, value: 6.5, tag: '高祖定鼎' },
    { name: '吕氏专权', year: -180, value: 5, tag: '外戚初现' },
    { name: '文景之治', year: -157, value: 8.5, tag: '轻徭薄赋' },
    { name: '七国之乱', year: -154, value: 6, tag: '宗室之祸' },
    { name: '汉武盛世', year: -110, value: 10, tag: '北击匈奴' },
    { name: '巫蛊之祸', year: -90, value: 5.5, tag: '宫廷惨剧' },
    { name: '昭宣中兴', year: -70, value: 8.5, tag: '再振国势' },
    { name: '王莽篡汉', year: 9, value: 4, tag: '西汉终结' },
    { name: '光武中兴', year: 55, value: 8, tag: '东汉重光' },
    { name: '黄巾起义', year: 184, value: 2.5, tag: '群雄并起' }
  ],
  '宋朝': [
    { name: '陈桥兵变', year: 960, value: 6, tag: '黄袍加身' },
    { name: '杯酒释兵', year: 961, value: 7, tag: '强干弱枝' },
    { name: '建隆之治', year: 975, value: 8, tag: '初定天下' },
    { name: '咸平之治', year: 1000, value: 8.5, tag: '真宗盛世' },
    { name: '仁宗盛治', year: 1045, value: 9.5, tag: '文化巅峰' },
    { name: '熙宁变法', year: 1075, value: 7.5, tag: '王安石法' },
    { name: '元祐更化', year: 1090, value: 6.5, tag: '新旧党争' },
    { name: '靖康之变', year: 1127, value: 2, tag: '北宋灭亡' },
    { name: '乾淳之治', year: 1175, value: 7, tag: '南宋中兴' },
    { name: '开禧北伐', year: 1206, value: 5, tag: '功亏一篑' },
    { name: '崖山海战', year: 1279, value: 1.5, tag: '宋室终结' }
  ],
  '明朝': [
    { name: '洪武建明', year: 1368, value: 8, tag: '朱元璋立' },
    { name: '胡惟庸案', year: 1380, value: 6.5, tag: '废相集权' },
    { name: '靖难之役', year: 1402, value: 5, tag: '叔侄相争' },
    { name: '永乐盛世', year: 1420, value: 10, tag: '下西洋' },
    { name: '仁宣之治', year: 1432, value: 9, tag: '治世延续' },
    { name: '土木堡变', year: 1449, value: 3.5, tag: '英宗被俘' },
    { name: '弘治中兴', year: 1495, value: 7.5, tag: '又得治世' },
    { name: '大礼议争', year: 1530, value: 5.5, tag: '君臣失和' },
    { name: '万历新政', year: 1580, value: 7, tag: '张居正治' },
    { name: '万历怠政', year: 1605, value: 4.5, tag: '国势渐危' },
    { name: '崇祯亡国', year: 1644, value: 2, tag: '煤山自缢' }
  ],
  '清朝': [
    { name: '清军入关', year: 1644, value: 6.5, tag: '定鼎中原' },
    { name: '剃发易服', year: 1645, value: 5, tag: '民族矛盾' },
    { name: '康熙擒鳌', year: 1669, value: 7.5, tag: '少年亲政' },
    { name: '三藩平定', year: 1681, value: 8.5, tag: '江山一统' },
    { name: '康熙盛世', year: 1700, value: 9.5, tag: '版图奠定' },
    { name: '雍正整顿', year: 1730, value: 9, tag: '励精图治' },
    { name: '康乾盛世', year: 1765, value: 10, tag: '十全武功' },
    { name: '白莲教乱', year: 1796, value: 6.5, tag: '隐患显现' },
    { name: '嘉道中衰', year: 1820, value: 5.5, tag: '国力下滑' },
    { name: '鸦片战争', year: 1840, value: 3, tag: '国门洞开' },
    { name: '太平天国', year: 1856, value: 2.5, tag: '半壁动摇' },
    { name: '同光中兴', year: 1880, value: 4.5, tag: '洋务自强' },
    { name: '甲午战争', year: 1895, value: 2, tag: '洋务梦碎' },
    { name: '辛亥革命', year: 1911, value: 1.5, tag: '帝制终结' }
  ],
  '夏商西周': [
    { name: '启建夏朝', year: -2070, value: 7, tag: '家天下始' },
    { name: '太康失国', year: -2050, value: 4, tag: '羿浞乱政' },
    { name: '少康中兴', year: -2000, value: 8, tag: '夏朝复兴' },
    { name: '夏桀暴政', year: -1700, value: 3, tag: '众叛亲离' },
    { name: '商汤灭夏', year: -1600, value: 7.5, tag: '商朝建立' },
    { name: '盘庚迁殷', year: -1298, value: 7, tag: '定都于殷' },
    { name: '武丁中兴', year: -1250, value: 9.5, tag: '盛世巅峰' },
    { name: '牧野之战', year: -1046, value: 8, tag: '武王伐纣' },
    { name: '成康之治', year: -1035, value: 10, tag: '礼乐鼎盛' },
    { name: '国人暴动', year: -841, value: 4, tag: '共和行政' },
    { name: '宣王中兴', year: -827, value: 6.5, tag: '短暂复兴' },
    { name: '西周灭亡', year: -771, value: 2, tag: '犬戎破京' }
  ]
}

const dynStages = computed(() => {
  if (!dynasty.value) return []
  const mapped = dynStagesMap[dynasty.value.name]
  if (mapped) return mapped
  // 没有预设就用事件自动生成 4 段（开端/鼎盛/过渡/衰落）
  const evs = dynastyEvents.value.slice().sort((a, b) => a.start_year - b.start_year)
  if (!evs.length) {
    const s = dynasty.value.start_year
    const e = dynasty.value.end_year
    const mid = (s + e) / 2
    return [
      { name: '开国', year: s, value: 6 },
      { name: '鼎盛', year: s + (e - s) * 0.35 | 0, value: 9 },
      { name: '中衰', year: mid | 0, value: 6 },
      { name: '衰亡', year: e, value: 3 }
    ]
  }
  const n = Math.min(4, evs.length)
  const step = Math.max(1, Math.floor(evs.length / n))
  const result: { name: string; year: number; value: number; tag?: string }[] = []
  for (let i = 0; i < n; i++) {
    const ev = evs[i * step] || evs[evs.length - 1]
    const v = i === 0 ? 6 : i === n - 1 ? 3 : (i === 1 ? 10 : 6)
    result.push({ name: ev.name.slice(0, 4), year: ev.start_year, value: v, tag: ev.event_type })
  }
  return result
})

const dynCurveW = 960
const dynCurveH = 240
const dynPadX = 48
const dynPadY = 38

const dynPlotPoints = computed(() => {
  const evs = dynStages.value
  if (!evs.length) return []
  const xs = evs.map((_, i) => {
    if (evs.length === 1) return dynPadX + (dynCurveW - 2 * dynPadX) / 2
    const t = i / (evs.length - 1)
    return dynPadX + t * (dynCurveW - 2 * dynPadX)
  })
  const baseY = dynCurveH - dynPadY
  return evs.map((e, i) => {
    const v = Math.max(1, Math.min(10, e.value)) / 10
    const yFactor = 0.15 + 0.85 * v
    const y = baseY - yFactor * (baseY - dynPadY)
    const color = e.value >= 9 ? '#C34739' : e.value >= 7 ? '#8B5A2B' : e.value >= 5 ? '#D8B26A' : '#6B8E7D'
    const r = 3.5 + v * 4
    return {
      x: xs[i],
      y,
      r,
      color,
      year: e.year,
      name: e.name,
      tag: e.tag || '',
      value: e.value
    }
  })
})

const dynBuildPath = (pts: { x: number; y: number }[]) => {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

const dynLinePath = computed(() => dynBuildPath(dynPlotPoints.value))
const dynAreaPath = computed(() => {
  const pts = dynPlotPoints.value
  if (!pts.length) return ''
  const line = dynBuildPath(pts)
  const first = pts[0]
  const last = pts[pts.length - 1]
  const baseY = dynCurveH - dynPadY
  return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
})
// =============== END 朝代历史发展曲线 ===============

// Full pie chart for occupation
const initOccupationChart = () => {
  if (!occupationChartRef.value) return
  if (occupationChart) occupationChart.dispose()
  occupationChart = echarts.init(occupationChartRef.value)
  
  const colors = ['#C34739', '#355C5A', '#D8B26A', '#4A6F7A', '#5C7A5E', '#8B5A2B', '#D4756A']
  
  occupationChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#D8B26A',
      borderWidth: 1,
      textStyle: { color: '#2C2C2C', fontSize: 12 }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#4A4A3A', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      formatter: (name: string) => {
        const item = occupationDistribution.find(d => d.name === name)
        return item ? `${name}  ${item.value}%` : name
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 3,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        scaleSize: 8
      },
      data: occupationDistribution.map((item, i) => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  })
}

const initEventBarChart = () => {
  if (!eventBarChartRef.value) return
  if (eventBarChart) eventBarChart.dispose()
  eventBarChart = echarts.init(eventBarChartRef.value)
  
  const colors = ['#C34739', '#355C5A', '#D8B26A', '#4A6F7A', '#5C7A5E', '#D4756A']
  const data = eventTypeStats.value.map((item, i) => ({
    value: item.value,
    name: item.name,
    color: colors[i % colors.length]
  }))
  
  eventBarChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 件',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#D8B26A',
      borderWidth: 1,
      textStyle: { color: '#2C2C2C', fontSize: 12 }
    },
    grid: { left: 40, right: 30, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#4A4A3A', fontSize: 11, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#4A4A3A', fontSize: 10 }
    },
    series: [{
      type: 'line',
      data: data.map(d => d.value),
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 2, color: '#355C5A' },
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff',
        color: (params: any) => {
          return data[params.dataIndex]?.color || '#355C5A'
        }
      },
      emphasis: {
        symbolSize: 12
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: '#4A4A3A',
        fontSize: 11
      }
    }]
  })
}

const handleResize = () => {
  occupationChart?.resize()
  eventBarChart?.resize()
}

const initAllCharts = () => {
  nextTick(() => {
    setTimeout(() => {
      initOccupationChart()
      initEventBarChart()
    }, 100)
  })
}

watch([dynastyId, dynasty], () => {
  if (hasData.value) {
    initAllCharts()
  }
})

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  
  // 尝试加载 JSON 数据
  const data = await loadDynastyData(dynastyId.value)
  if (data) {
    jsonData.value = data
  }
  
  if (hasData.value) {
    initAllCharts()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  occupationChart?.dispose()
  eventBarChart?.dispose()
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2]">
    <template v-if="hasData">
      <!-- Navigation -->
      <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
        <div class="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
              <div class="w-8 h-8 rounded-full bg-[#C34739] flex items-center justify-center">
                <span class="font-calligraphy text-white text-lg">千</span>
              </div>
              <span class="font-calligraphy text-xl text-[#2C2C2C]">千年一脉</span>
            </div>
            <div class="h-5 w-px bg-[#D8B26A]/30"></div>
            <div class="text-sm text-[#4A4A3A]/60">
              <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/')">首页</span>
              <span class="mx-1.5 text-[#D8B26A]/40">›</span>
              <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToTimeline">中国历史</span>
              <span class="mx-1.5 text-[#D8B26A]/40">›</span>
              <span class="text-[#2C2C2C] font-medium">{{ dynasty!.name }}</span>
            </div>
          </div>
          </div>
      </nav>
    

    <!-- Hero -->
      <section class="relative py-16 px-8 overflow-hidden">
        <div class="absolute top-0 left-1/3 w-[500px] h-[180px] bg-gradient-to-b from-[#D8B26A]/12 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 right-0 w-72 h-72 bg-[#355C5A]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-10 left-10 w-56 h-56 bg-[#C34739]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="max-w-7xl mx-auto relative z-10">
          <div class="text-center mb-10">
            <h1 class="font-calligraphy text-6xl md:text-7xl text-[#2C2C2C] tracking-wider mb-2">{{ dynasty!.name }}</h1>
            <div class="text-lg text-[#4A4A3A]/50 font-light tracking-wider mb-2">{{ dynasty!.english_name }}</div>
            <div class="text-2xl font-serif text-[#355C5A]">{{ formattedYear(dynasty!.start_year) }} — {{ formattedYear(dynasty!.end_year) }}</div>
            <p class="text-[#4A4A3A]/70 mt-6 max-w-2xl mx-auto leading-relaxed">{{ dynasty!.summary }}</p>
          </div>

          <!-- Events & Persons -->
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm text-[#355C5A] tracking-widest font-medium">
                  <svg class="w-4 h-4 inline mr-1.5 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  重大历史事件
                </h3>
                <button 
                  v-if="dynastyEvents.length > 4"
                  @click="showAllEvents = !showAllEvents"
                  class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A] transition-colors"
                >{{ showAllEvents ? '收起' : `查看全部(${dynastyEvents.length})` }}</button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  v-for="event in (showAllEvents ? dynastyEvents : dynastyEvents.slice(0, 4))" 
                  :key="event.id"
                  @click="navigateToEvent(event.id)"
                  class="bg-white/60 border border-[#D8B26A]/20 rounded-md px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group h-[96px] flex flex-col justify-center"
                >
                  <div class="flex items-start justify-between">
                    <span class="px-2 py-0.5 text-xs bg-[#C34739]/10 text-[#C34739] border border-[#C34739]/20 rounded-full">{{ event.event_type }}</span>
                    <span class="text-xs text-[#4A4A3A]/50">{{ formattedYear(event.start_year) }}</span>
                  </div>
                  <h4 class="text-base font-medium text-[#2C2C2C] mt-1.5 mb-0.5 group-hover:text-[#355C5A] transition-colors">{{ event.name }}</h4>
                  <p class="text-xs text-[#4A4A3A]/60 line-clamp-1">{{ event.summary }}</p>
                </div>
              </div>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm text-[#355C5A] tracking-widest font-medium">
                  <svg class="w-4 h-4 inline mr-1.5 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  代表人物
                </h3>
                <button 
                  v-if="dynastyPersons.length > 8"
                  @click="showAllPersons = !showAllPersons"
                  class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A] transition-colors"
                >{{ showAllPersons ? '收起' : `查看全部(${dynastyPersons.length})` }}</button>
              </div>
              <div class="grid grid-cols-4 gap-3">
                <div 
                  v-for="person in (showAllPersons ? dynastyPersons : dynastyPersons.slice(0, 8))" 
                  :key="person.id"
                  @click="navigateToPerson(person.id)"
                  class="cursor-pointer group text-center h-[96px]"
                >
                  <div class="relative w-14 h-14 mx-auto rounded-full bg-[#D8B26A]/15 overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-[#355C5A]/50 transition-all duration-300 group-hover:scale-105">
                    <div class="absolute inset-0 bg-gradient-to-br from-[#D8B26A]/20 to-[#355C5A]/15 flex items-center justify-center">
                      <span class="font-calligraphy text-2xl text-[#2C2C2C]/30">{{ person.name.charAt(0) }}</span>
                    </div>
                    <img :src="person.image_url" :alt="person.name" class="w-full h-full object-cover absolute inset-0 z-10 opacity-0 transition-opacity duration-500" onload="this.style.opacity='1'" @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/person' + person.id + '/200/200'; e.target.onerror = null }" />
                  </div>
                  <span class="font-medium text-[#2C2C2C] text-sm block group-hover:text-[#355C5A] transition-colors">{{ person.name }}</span>
                  <span class="text-xs text-[#4A4A3A]/50">{{ person.category }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

      <!-- Overview + Map -->
      <section class="px-8 py-14">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col lg:flex-row gap-12">
            <div class="flex-1 min-w-[320px]">
              <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-6 flex items-center gap-3">
                <span class="w-1 h-7 bg-[#355C5A] rounded-full"></span>
                朝代简介
              </h2>
              <p class="text-[#4A4A3A]/75 leading-relaxed mb-8">{{ dynasty!.summary }}{{ dynasty!.name }}是中国历史上重要的时期之一，在政治、经济、文化、外交等方面都取得了重要成就。首都{{ dynasty!.capital }}成为当时重要的城市中心。</p>
              <div class="grid grid-cols-2 gap-6">
                <div v-for="item in [
                  { label: '首都', value: dynasty!.capital, icon: '🏛' },
                  { label: '人口', value: dynasty!.population, icon: '👥' },
                  { label: '存续时间', value: dynasty!.duration, icon: '⏳' },
                  { label: '代表建筑', value: dynasty!.representative_buildings.join('、'), icon: '🏯' }
                ]" :key="item.label">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-sm">{{ item.icon }}</span>
                    <span class="text-xs text-[#4A4A3A]/50 uppercase tracking-wider">{{ item.label }}</span>
                  </div>
                  <p class="text-[#2C2C2C] font-medium mt-1">{{ item.value }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex-[1.2] min-w-[420px]">
              <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-6 flex items-center gap-3">
                <span class="w-1 h-7 bg-[#C34739] rounded-full"></span>
                疆域示意图
              </h2>
              <div class="bg-white/40 rounded-md border border-[#D8B26A]/20 p-4">
                <!-- Two-layer China Territory Map: Gray = Modern China, Colored = Dynasty Territory -->
                <svg viewBox="0 0 500 400" class="w-full" style="max-height: 420px;">
                  <!-- Ocean background -->
                  <rect x="0" y="0" width="500" height="400" fill="#F0EDE6" opacity="0.5"/>
                  
                  <!-- Layer 1: Modern China outline (gray base) -->
                  <path 
                    :d="modernChinaPath"
                    fill="#E0E0E0" 
                    stroke="#AAAAAA" 
                    stroke-width="1.5"
                    opacity="0.55"
                  />
                  
                  <!-- Taiwan (modern China) -->
                  <path d="M 393 262 L 400 268 L 403 278 L 400 288 L 393 293 L 387 288 L 385 278 L 388 268 Z" fill="#E0E0E0" stroke="#AAAAAA" stroke-width="1.5" opacity="0.55"/>
                  <!-- Hainan (modern China) -->
                  <path d="M 295 362 L 304 365 L 307 373 L 302 380 L 294 378 L 290 370 Z" fill="#E0E0E0" stroke="#AAAAAA" stroke-width="1.5" opacity="0.55"/>
                  
                  <!-- Layer 2: Dynasty-specific China territory (colored overlay) -->
                  <path 
                    :d="chinaMapPath"
                    fill="#F5E6D3" 
                    stroke="#D8B26A" 
                    stroke-width="2.5"
                    opacity="0.85"
                  />
                  
                  <!-- Dynasty Taiwan & Hainan (if applicable) -->
                  <path d="M 393 262 L 400 268 L 403 278 L 400 288 L 393 293 L 387 288 L 385 278 L 388 268 Z" fill="#F5E6D3" stroke="#D8B26A" stroke-width="1.5" opacity="0.85"/>
                  <path d="M 295 362 L 304 365 L 307 373 L 302 380 L 294 378 L 290 370 Z" fill="#F5E6D3" stroke="#D8B26A" stroke-width="1.5" opacity="0.85"/>
                  
                  <!-- Surrounding region labels (context) -->
                  <text x="72" y="42" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">漠北</text>
                  <text x="155" y="18" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">西域</text>
                  <text x="88" y="278" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">青藏高原</text>
                  <text x="418" y="315" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">南海诸岛</text>
                  <text x="355" y="18" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">外兴安岭</text>
                  <text x="425" y="55" font-size="8" fill="#4A4A3A" opacity="0.35" font-family="serif">库页岛</text>
                  
                  <!-- Location markers -->
                  <g v-for="region in chinaMapData.regions" :key="region.name">
                    <circle 
                      :cx="region.x" :cy="region.y" 
                      :r="region.isCapital ? 5 : 3.5" 
                      :fill="region.isCapital ? '#C34739' : '#355C5A'"
                      :stroke="region.isCapital ? '#C34739' : '#4A6F7A'"
                      stroke-width="1.5"
                      opacity="0.9"
                    />
                    <circle 
                      v-if="region.isCapital"
                      :cx="region.x" :cy="region.y" 
                      r="10" fill="#C34739" opacity="0.15" class="animate-pulse"
                    />
                    <text 
                      v-if="region.isCapital" 
                      :x="region.x" :y="region.y - 8" 
                      text-anchor="middle" font-size="12" fill="#C34739"
                    >★</text>
                    <text 
                      :x="region.x" 
                      :y="region.y + (region.isCapital ? 22 : 16)"
                      text-anchor="middle"
                      :font-size="region.isCapital ? 11 : 9"
                      :fill="region.isCapital ? '#C34739' : '#4A4A3A'"
                      :font-weight="region.isCapital ? 'bold' : 'normal'"
                      font-family="serif"
                    >{{ region.name }}</text>
                  </g>
                  
                  <!-- Legend -->
                  <g transform="translate(12, 372)">
                    <rect x="0" y="0" width="13" height="9" fill="#E0E0E0" stroke="#AAAAAA" stroke-width="1" opacity="0.55" rx="1" />
                    <text x="16" y="8" font-size="8" fill="#4A4A3A" opacity="0.7">现代中国</text>
                    <rect x="82" y="0" width="13" height="9" fill="#F5E6D3" stroke="#D8B26A" stroke-width="1.5" opacity="0.85" rx="1" />
                    <text x="98" y="8" font-size="8" fill="#C34739" font-weight="bold">{{ dynasty!.name }}疆域</text>
                    <circle cx="175" cy="4.5" r="3" fill="#C34739" opacity="0.9" />
                    <text x="182" y="8" font-size="8" fill="#4A4A3A" opacity="0.7">都城</text>
                    <circle cx="218" cy="4.5" r="2.5" fill="#355C5A" opacity="0.9" />
                    <text x="225" y="8" font-size="8" fill="#4A4A3A" opacity="0.7">重要城市</text>
                  </g>
                </svg>
                <div class="text-center mt-2">
                  <span class="text-xs text-[#4A4A3A]/50">{{ dynasty!.name }}疆域示意图 · 灰色为现代中国疆域基准</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

      <!-- Era Portrait -->
      <section class="px-8 py-14">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C]">时代画像</h2>
            <div class="w-12 h-px mx-auto mt-3 bg-[#D8B26A]/40"></div>
          </div>
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left: Text Word Cloud -->
            <div class="flex-1 bg-white/60 border border-[#D8B26A]/20 rounded-md p-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm text-[#4A4A3A]/60 font-medium flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                  时代印象
                </h4>
                <!-- 5 类颜色图例 -->
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#4A4A3A]/75">
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full" style="background:#C34739"></span>时代印象</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full" style="background:#8B3A2B"></span>核心人物</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full" style="background:#D8B26A"></span>历史事件</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full" style="background:#355C5A"></span>文明制度</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full" style="background:#5C7A9E"></span>文化地理</span>
                </div>
              </div>
              <!-- DOM 词云容器 -->
              <div ref="wordCloudRef" class="relative w-full overflow-hidden" style="width: 100%; height: 420px; background-image: radial-gradient(ellipse at center, rgba(216,178,106,0.08) 0%, transparent 65%);">

                <!-- DOM 词云词条渲染 -->
                <span
                  v-for="kw in keywordCloudData"
                  :key="kw.name"
                  class="absolute"
                  :style="kw.style"
                  @click="handleKwClick(kw)"
                >{{ kw.name }}</span>
              </div>
            </div>
            
            <!-- Right: Vertical Scores + Evaluation -->
            <div class="flex-1 bg-white/60 border border-[#D8B26A]/20 rounded-md p-6">
              <h4 class="text-sm text-[#4A4A3A]/60 mb-5 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                五维评分 · 历史评价
              </h4>
              
              <!-- Vertical 5 scores -->
              <div class="space-y-3 mb-3">
                <div 
                  v-for="item in characteristics" 
                  :key="item.name"
                  class="flex items-center gap-3"
                >
                  <span class="text-lg w-7 text-center">{{ item.icon }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm text-[#2C2C2C] font-medium">{{ item.name }}</span>
                      <span class="font-calligraphy text-lg" :style="{ color: item.color }">{{ item.value }}</span>
                    </div>
                    <div class="h-2 bg-[#D8B26A]/15 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-1000" :style="{ width: item.value + '%', backgroundColor: item.color }"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent mb-3"></div>
              
              <div class="bg-[#F8F6F2]/80 rounded-md p-3 border border-[#D8B26A]/20">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <span class="text-xs text-[#4A4A3A]/60 font-medium">一句话评价</span>
                </div>
                <p class="text-[#4A4A3A]/75 text-sm leading-relaxed italic">{{ dynasty!.summary }}{{ dynasty!.name }}在文学、艺术、科技等领域都达到了前所未有的高度，其成就至今仍是中华文化的瑰宝。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

      <!-- Data Insights -->
      <section class="px-8 py-14 bg-[#F5F2EC]/50">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C]">时代数据洞察</h2>
            <div class="w-12 h-px mx-auto mt-3 bg-[#D8B26A]/40"></div>
          </div>

          <!-- Row 1: 历史发展曲线（整行） -->
          <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-6 mb-8">
            <div class="flex items-center justify-between mb-5">
              <div class="font-calligraphy text-xl text-[#2C2C2C] flex items-center gap-2">
                <svg class="w-5 h-5 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                历史发展曲线
              </div>
              <div class="text-xs text-[#4A4A3A]/50 tracking-widest">DYN · CURVE</div>
            </div>

            <div class="relative w-full" style="height: 280px;">
              <svg
                :viewBox="`0 0 ${dynCurveW} ${dynCurveH}`"
                preserveAspectRatio="none"
                class="absolute inset-0 w-full h-full"
              >
                <defs>
                  <linearGradient id="dynAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#C34739" stop-opacity="0.32" />
                    <stop offset="50%" stop-color="#D8B26A" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="#D8B26A" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="dynLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#D4756A" />
                    <stop offset="40%" stop-color="#C34739" />
                    <stop offset="70%" stop-color="#8B5A2B" />
                    <stop offset="100%" stop-color="#6B8E7D" />
                  </linearGradient>
                </defs>
                <g opacity="0.35">
                  <line :x1="dynPadX" :y1="dynCurveH - dynPadY" :x2="dynCurveW - dynPadX" :y2="dynCurveH - dynPadY" stroke="#D8B26A" stroke-width="0.6" stroke-dasharray="2 4" />
                  <line :x1="dynPadX" :y1="dynPadY + (dynCurveH - dynPadY*2)*0.5" :x2="dynCurveW - dynPadX" :y2="dynPadY + (dynCurveH - dynPadY*2)*0.5" stroke="#D8B26A" stroke-width="0.4" stroke-dasharray="2 4" />
                  <line :x1="dynPadX" :y1="dynPadY" :x2="dynCurveW - dynPadX" :y2="dynPadY" stroke="#D8B26A" stroke-width="0.3" stroke-dasharray="2 4" />
                </g>
                <path :d="dynAreaPath" fill="url(#dynAreaGrad)" />
                <path :d="dynLinePath" fill="none" stroke="url(#dynLineGrad)" stroke-width="2.4" stroke-linecap="round" />
                <g v-for="(p, i) in dynPlotPoints" :key="i">
                  <line :x1="p.x" :y1="p.y" :x2="p.x" :y2="dynCurveH - dynPadY + 2" :stroke="p.color" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.5" />
                  <circle :cx="p.x" :cy="p.y" :r="hoveredStageIdx === i ? p.r + 2.5 : p.r" :fill="p.color" stroke="#fff" stroke-width="2.2" class="transition-all duration-300 cursor-pointer" @mouseenter="hoveredStageIdx = i" @mouseleave="hoveredStageIdx = -1" />
                </g>
              </svg>
              <div class="absolute left-0 right-0" :style="{ bottom: '4px' }">
                <div class="relative" style="height: 62px;">
                  <div
                    v-for="(p, i) in dynPlotPoints"
                    :key="i"
                    class="absolute text-center cursor-pointer transition-all duration-200"
                    :style="{
                      left: `${(p.x / dynCurveW) * 100}%`,
                      transform: 'translateX(-50%)',
                      width: dynPlotPoints.length <= 4 ? '120px' : dynPlotPoints.length <= 6 ? '100px' : dynPlotPoints.length <= 8 ? '86px' : dynPlotPoints.length <= 11 ? '74px' : '66px'
                    }"
                    @mouseenter="hoveredStageIdx = i"
                    @mouseleave="hoveredStageIdx = -1"
                  >
                    <div class="text-[11px] mb-0.5 font-medium whitespace-nowrap" :style="{ color: p.color }">{{ formattedYear(p.year) }}</div>
                    <div class="text-[13px] font-calligraphy leading-tight whitespace-nowrap" :class="hoveredStageIdx === i ? 'text-[#2C2C2C] font-bold scale-105' : 'text-[#2C2C2C]/85'">{{ p.name }}</div>
                    <div v-if="p.tag" class="text-[9px] leading-none whitespace-nowrap mt-0.5 transition-opacity" :class="hoveredStageIdx === i ? 'text-[#C34739] opacity-100' : 'text-[#8B5A2B]/60'">· {{ p.tag }} ·</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Pie + Bar + Density/Activity stacked -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Occupation Pie Chart -->
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5">
              <h4 class="text-sm text-[#4A4A3A]/60 mb-3 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                人物职业分布
              </h4>
              <div ref="occupationChartRef" class="w-full" style="height: 300px;"></div>
            </div>

            <!-- Event Type Bar Chart -->
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5">
              <h4 class="text-sm text-[#4A4A3A]/60 mb-3 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                历史事件类型统计
              </h4>
              <div ref="eventBarChartRef" class="w-full" style="height: 300px;"></div>
            </div>

            <!-- Density + Activity stacked -->
            <div class="flex flex-col gap-4">
              <!-- Person-Event Association Density -->
              <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 flex-1">
                <h4 class="text-xs text-[#4A4A3A]/60 mb-3 font-medium flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  人物-事件关联密度
                </h4>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 flex-shrink-0 relative">
                    <svg viewBox="0 0 100 100" class="w-full h-full">
                      <circle cx="50" cy="50" r="8" fill="#C34739" opacity="0.8"/>
                      <circle cx="25" cy="30" r="5" fill="#355C5A" opacity="0.7"/>
                      <circle cx="75" cy="25" r="5" fill="#355C5A" opacity="0.7"/>
                      <circle cx="20" cy="65" r="5" fill="#D8B26A" opacity="0.7"/>
                      <circle cx="80" cy="60" r="5" fill="#D8B26A" opacity="0.7"/>
                      <circle cx="50" cy="82" r="4" fill="#4A6F7A" opacity="0.7"/>
                      <line x1="50" y1="50" x2="25" y2="30" stroke="#D8B26A" stroke-width="1.2" opacity="0.5"/>
                      <line x1="50" y1="50" x2="75" y2="25" stroke="#D8B26A" stroke-width="1.2" opacity="0.5"/>
                      <line x1="50" y1="50" x2="20" y2="65" stroke="#D8B26A" stroke-width="1.2" opacity="0.5"/>
                      <line x1="50" y1="50" x2="80" y2="60" stroke="#D8B26A" stroke-width="1.2" opacity="0.5"/>
                      <line x1="50" y1="50" x2="50" y2="82" stroke="#D8B26A" stroke-width="1.2" opacity="0.5"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-baseline gap-1.5 mb-0.5">
                      <span class="font-calligraphy text-3xl text-[#355C5A]">{{ associationDensity }}</span>
                      <span class="text-xs text-[#4A4A3A]/50">个/人</span>
                    </div>
                    <p class="text-xs text-[#4A4A3A]/50 mb-2">平均每人关联事件数</p>
                    <div class="w-full h-2 bg-[#D8B26A]/15 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-[#355C5A] via-[#4A6F7A] to-[#D8B26A] rounded-full transition-all duration-1000" :style="{ width: Math.min(100, Number(associationDensity) * 20) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Network Activity -->
              <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 flex-1">
                <h4 class="text-xs text-[#4A4A3A]/60 mb-3 font-medium flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  关系网络活跃度
                </h4>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 flex-shrink-0 relative">
                    <svg viewBox="0 0 100 100" class="w-full h-full">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#D8B26A" stroke-width="1.2" opacity="0.4"/>
                      <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="#D8B26A" stroke-width="0.8" opacity="0.3"/>
                      <ellipse cx="50" cy="50" rx="12" ry="35" fill="none" stroke="#D8B26A" stroke-width="0.8" opacity="0.3"/>
                      <circle cx="50" cy="50" r="6" fill="#C34739" opacity="0.8"/>
                      <circle cx="50" cy="38" r="3" fill="#355C5A" opacity="0.7"/>
                      <circle cx="62" cy="50" r="3" fill="#355C5A" opacity="0.7"/>
                      <circle cx="50" cy="62" r="3" fill="#D8B26A" opacity="0.7"/>
                      <circle cx="38" cy="50" r="3" fill="#D8B26A" opacity="0.7"/>
                      <line x1="50" y1="50" x2="50" y2="38" stroke="#D8B26A" stroke-width="0.8" opacity="0.4"/>
                      <line x1="50" y1="50" x2="62" y2="50" stroke="#D8B26A" stroke-width="0.8" opacity="0.4"/>
                      <line x1="50" y1="50" x2="50" y2="62" stroke="#D8B26A" stroke-width="0.8" opacity="0.4"/>
                      <line x1="50" y1="50" x2="38" y2="50" stroke="#D8B26A" stroke-width="0.8" opacity="0.4"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-baseline gap-1.5 mb-0.5">
                      <span class="font-calligraphy text-3xl text-[#C34739]">{{ networkActivity }}</span>
                      <span class="text-xs text-[#4A4A3A]/50">指数</span>
                    </div>
                    <p class="text-xs text-[#4A4A3A]/50 mb-2">网络连接密度指数</p>
                    <div class="w-full h-2 bg-[#D8B26A]/15 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-[#C34739] via-[#D4756A] to-[#D8B26A] rounded-full transition-all duration-1000" :style="{ width: Math.min(100, Number(networkActivity) * 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom stats row -->
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <div class="font-calligraphy text-3xl text-[#355C5A] mb-1">{{ dynastyPersons.length }}</div>
              <span class="text-xs text-[#4A4A3A]/50">当朝人物</span>
            </div>
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <div class="font-calligraphy text-3xl text-[#C34739] mb-1">{{ dynastyEvents.length }}</div>
              <span class="text-xs text-[#4A4A3A]/50">当朝事件</span>
            </div>
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              <div class="font-calligraphy text-3xl text-[#D8B26A] mb-1">{{ dynastyStatistics.work_count }}</div>
              <span class="text-xs text-[#4A4A3A]/50">代表作品</span>
            </div>
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-[#4A6F7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              <div class="font-calligraphy text-3xl text-[#4A6F7A] mb-1">{{ dynastyStatistics.relation_count }}</div>
              <span class="text-xs text-[#4A4A3A]/50">人物关系</span>
            </div>
          </div>
        </div>
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

      <!-- Explore -->
      <section class="px-8 py-14">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              @click="router.push('/dynasty/' + dynastyId + '/events')"
              class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-calligraphy text-xl text-[#2C2C2C] mb-2 group-hover:text-[#C34739] transition-colors">浏览全部历史事件</h3>
                  <p class="text-sm text-[#4A4A3A]/60">共 {{ dynastyEvents.length }} 个事件</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-[#C34739]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
              </div>
            </div>
            <div 
              @click="router.push('/dynasty/' + dynastyId + '/persons')"
              class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-calligraphy text-xl text-[#2C2C2C] mb-2 group-hover:text-[#355C5A] transition-colors">浏览全部历史人物</h3>
                  <p class="text-sm text-[#4A4A3A]/60">共 {{ dynastyPersons.length }} 位人物</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-[#355C5A]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10">
            <h4 class="text-sm text-[#4A4A3A]/60 mb-4 font-medium">相关朝代推荐</h4>
            <div class="flex gap-4">
              <div 
                v-for="d in dynasties.filter(d => d.id !== dynastyId).slice(0, 3)" 
                :key="d.id"
                @click="router.push('/dynasty/' + d.id)"
                class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-4 flex-1 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <div class="flex justify-between items-center">
                  <div>
                    <span class="font-calligraphy text-lg text-[#2C2C2C]">{{ d.name }}</span>
                    <span class="text-xs text-[#4A4A3A]/50 ml-2">{{ formattedYear(d.start_year) }} — {{ formattedYear(d.end_year) }}</span>
                  </div>
                  <svg class="w-5 h-5 text-[#4A4A3A]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="py-8 text-center border-t border-[#D8B26A]/15">
        <div class="font-calligraphy text-2xl text-[#4A4A3A]/40 mb-2">千年一脉</div>
        <p class="text-xs text-[#4A4A3A]/40">历史不会停留在书页，它也存在于每一个家庭</p>
      </footer>
    </template>
    
    <template v-else>
      <ComingSoon title="数据整理中" description="该朝代数据正在整理中，敬请期待。" />
    </template>
  </div>
</template>