<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dynasties, persons, events } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'
import { RELATED_DYNASTIES } from '@/services/dynastyRelations'
import { recordRecentDynasty } from '@/services/recentDynasties'
import ComingSoon from '@/components/ComingSoon.vue'
import BackButton from '@/components/BackButton.vue'
import DynastyTerritoryMap from '@/components/DynastyTerritoryMap.vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const showAllEvents = ref(false)
const showAllPersons = ref(false)

// Chart refs
const wordCloudRef = ref<HTMLElement | null>(null)
const occupationChartRef = ref<HTMLElement | null>(null)
const eventBarChartRef = ref<HTMLElement | null>(null)

// 词云容器实测尺寸（px）：使碰撞检测与实际渲染使用同一坐标系，杜绝比例失配导致的重叠/截断
const cloudBoxW = ref(980)
const cloudBoxH = ref(420)


let occupationChart: echarts.ECharts | null = null
let eventBarChart: echarts.ECharts | null = null
let wordCloudResizeObserver: ResizeObserver | null = null

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
  if (jsonData.value && jsonData.value.persons.length > 0 && dynasty.value) {
    // 按 dynasty 字段过滤：让已划到其他朝代的人物（如傅玄/卫瓘→晋南北朝）卡片移出当前朝代列表
    const name = dynasty.value.name
    return jsonData.value.persons.filter(p => p.dynasty === name)
  }
  if (!dynasty.value) return []
  return persons.filter(p => p.dynasty === dynasty.value!.name)
})

/* ---------------- 当朝真实统计（不再使用全局写死值） ---------------- */
// 代表作品：当朝人物 works 数量之和
const dynastyWorkCount = computed(() =>
  dynastyPersons.value.reduce((sum, p) => sum + (p.works?.length || 0), 0)
)

// 人物关系：当朝人物之间去重后的无向关系对数（A—B 与 B—A 视为同一条）
const dynastyRelationCount = computed(() => {
  const names = new Set(dynastyPersons.value.map(p => p.name).filter(Boolean))
  const pairs = new Set<string>()
  const addPair = (a: string, b: string) => {
    const x = a.trim()
    const y = b.trim()
    if (!x || !y || x === y) return
    pairs.add(x < y ? `${x}|${y}` : `${y}|${x}`)
  }

  for (const p of dynastyPersons.value) {
    for (const e of p.narrative_relations?.edges || []) {
      if (names.has(e.source) && names.has(e.target)) addPair(e.source, e.target)
    }
  }
  if (pairs.size) return pairs.size

  // 没有叙事关系网时退回 related_people，仍限定在当朝人物内
  for (const p of dynastyPersons.value) {
    for (const r of p.related_people || []) {
      if (names.has(r.name)) addPair(p.name, r.name)
    }
  }
  return pairs.size
})

// 人物构成：固定按六类人物类型统计，顺序与配色稳定，便于跨朝代对比
const PERSON_TYPE_ORDER = ['统治者', '政治人物', '军事人物', '文化人物', '思想人物', '科技人物']
const PERSON_TYPE_COLORS: Record<string, string> = {
  统治者: '#C34739',
  政治人物: '#355C5A',
  军事人物: '#D8B26A',
  文化人物: '#4A6F7A',
  思想人物: '#5C7A5E',
  科技人物: '#8B5A2B',
  其他: '#D4756A'
}

const personTypeStats = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of dynastyPersons.value) {
    const raw = String(p.category || '').trim()
    // 部分导入数据用「思想家」，统一归到六类中的「思想人物」
    const name = (raw === '思想家' ? '思想人物' : raw) || '其他'
    counts[name] = (counts[name] || 0) + 1
  }
  const ordered = PERSON_TYPE_ORDER
    .filter(name => counts[name])
    .map(name => ({ name, value: counts[name] }))
  const rest = Object.entries(counts)
    .filter(([name]) => !PERSON_TYPE_ORDER.includes(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
  return [...ordered, ...rest]
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

/* ---------------- 相关朝代推荐：内容相关优先，时间相邻兜底 ---------------- */
interface RelatedDynastyItem {
  id: number
  name: string
  start_year: number
  end_year: number
  reason: string
}

const relatedDynasties = computed<RelatedDynastyItem[]>(() => {
  const ordered = [...dynasties].sort((a, b) => a.start_year - b.start_year)
  const build = (id: number, reason: string): RelatedDynastyItem | null => {
    const d = ordered.find(x => x.id === id)
    return d ? { id: d.id, name: d.name, start_year: d.start_year, end_year: d.end_year, reason } : null
  }

  const curated = RELATED_DYNASTIES[dynastyId.value]
  if (curated && curated.length) {
    return curated
      .map(x => build(x.id, x.reason))
      .filter((x): x is RelatedDynastyItem => !!x)
  }

  // 无策展关系时回退到时间相邻（前朝 + 后朝），不硬凑满 3 条
  const i = ordered.findIndex(d => d.id === dynastyId.value)
  if (i < 0) return []
  return [ordered[i - 1], ordered[i + 1]]
    .filter((d): d is (typeof ordered)[number] => !!d)
    .map(d => ({ id: d.id, name: d.name, start_year: d.start_year, end_year: d.end_year, reason: '时间相邻' }))
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
  xPct: number
  yPct: number
}

const KW_CATEGORY_LABEL: Record<KwCategory, string> = {
  era: '时代印象', person: '核心人物', event: '历史事件', civilization: '文明制度', geo: '文化地理'
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
    '汉': [
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

    // ============= 【元朝】20条 — 核心词：铁骑纵横 + 行省制度 + 中外交流 =============
    '元': [
      { name: '铁骑纵横', value: 100, category: 'era', desc: '蒙古铁骑横扫欧亚大陆，建立人类史上疆域最大的陆地帝国' },
      { name: '行省制度', value: 98, category: 'civilization', desc: '元朝首创的中央集权行政区划制度，影响明清至今' },
      { name: '疆域空前', value: 96, category: 'era', desc: '元朝鼎盛时期疆域约1300万平方公里，为中国历史之最' },
      { name: '成吉思汗', value: 94, category: 'person', desc: '铁木真统一蒙古各部，建立大蒙古国，世界征服者' },
      { name: '忽必烈', value: 92, category: 'person', desc: '元世祖，改国号为元、灭南宋、开创大元一统之局' },
      { name: '马可·波罗', value: 90, category: 'person', desc: '威尼斯商人来华17年，著《东方见闻录》，东西文化交流使者' },
      { name: '海上丝路', value: 88, category: 'event', desc: '元代泉州为世界最大港口，海上丝绸之路空前繁荣' },
      { name: '郭守敬', value: 86, category: 'person', desc: '元代科学家，编制《授时历》精度领先世界数百年' },
      { name: '元曲', value: 84, category: 'civilization', desc: '元曲（杂剧+散曲）为元代文学之代表，关汉卿、马致远等名家辈出' },
      { name: '科举回存', value: 82, category: 'event', desc: '仁宗延祐年间恢复科举取士，为元朝中期文治之象征' },
      { name: '红巾军起义', value: 80, category: 'event', desc: '1351年韩山童、刘福通起义，元朝由盛转衰的转折点' },
      { name: '四等人制', value: 78, category: 'civilization', desc: '蒙古色目汉南四等人的民族歧视政策，元朝社会矛盾根源' },
      { name: '大都', value: 76, category: 'geo', desc: '元大都（今北京）为元朝都城，世界最大城市之一' },
      { name: '上都', value: 74, category: 'geo', desc: '元朝夏都开平（今内蒙古正蓝旗），皇帝每年巡幸之地' },
      { name: '《马可波罗游记》', value: 72, category: 'civilization', desc: '东方见闻录，让欧洲人第一次系统了解中国，大航海时代思想先驱' },
      { name: '关汉卿', value: 70, category: 'person', desc: '元曲四大家之首，《窦娥冤》作者，中国戏剧奠基人' },
      { name: '黄道婆', value: 68, category: 'person', desc: '元代棉纺织家，改进纺织技术，江南棉纺织业奠基人' },
      { name: '西藏归附', value: 66, category: 'event', desc: '元朝设宣政院管理西藏，西藏正式纳入中国版图' },
      { name: '元青花瓷', value: 64, category: 'civilization', desc: '景德镇官窑青花瓷工艺成熟，为中国瓷器艺术巅峰之一' },
      { name: '蒙古西征', value: 62, category: 'event', desc: '成吉思汗及子孙三次西征，打通欧亚大陆，促进东西文化交流' }
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
    ],
    // ============= 【春秋】20条 — 核心词：争霸会盟 + 礼崩乐坏 + 思想萌发 =============
    '春秋': [
      { name: '春秋争霸', value: 100, category: 'era', desc: '春秋五霸迭起，齐、晋、楚、秦、吴越相继争雄' },
      { name: '礼崩乐坏', value: 98, category: 'era', desc: '周王室衰微，礼乐制度崩坏，诸侯僭越周礼' },
      { name: '周王室衰微', value: 96, category: 'era', desc: '平王东迁后王权旁落，诸侯坐大，天下共主名存实亡' },
      { name: '诸侯争霸', value: 94, category: 'event', desc: '齐桓、晋文、楚庄等霸主以尊王攘夷为旗号逐鹿中原' },
      { name: '齐桓公', value: 92, category: 'person', desc: '姜小白，任用管仲为相，九合诸侯，春秋首霸' },
      { name: '管仲改革', value: 90, category: 'civilization', desc: '管仲相齐，变革军政、通货积财，助齐桓公开创霸业' },
      { name: '晋文公', value: 88, category: 'person', desc: '重耳，退避三舍，城濮之战大败楚军，成为中原霸主' },
      { name: '城濮之战', value: 86, category: 'event', desc: '晋楚争霸关键一役，晋文公以少胜多确立晋国霸权' },
      { name: '楚庄王', value: 84, category: 'person', desc: '一鸣惊人，问鼎中原，邲之战败晋成为南方霸主' },
      { name: '问鼎中原', value: 82, category: 'event', desc: '楚庄王陈兵周疆，问九鼎之轻重，图谋天子的象征' },
      { name: '晋楚争霸', value: 80, category: 'event', desc: '晋楚长期争雄，后晋国渐衰、六卿分权' },
      { name: '吴越争霸', value: 78, category: 'event', desc: '吴王夫差与越王勾践争雄，勾践卧薪尝胆终灭吴' },
      { name: '勾践卧薪尝胆', value: 76, category: 'person', desc: '越王勾践忍辱负重、励精图治，最终复国灭吴' },
      { name: '孔子', value: 74, category: 'person', desc: '儒家创始人，开私学、存六经，影响中国两千余年' },
      { name: '儒家思想', value: 72, category: 'civilization', desc: '仁礼为核心，孔子开创，成为中华文化正统' },
      { name: '百家争鸣', value: 70, category: 'civilization', desc: '儒、道、法、墨等诸子思想并起，思想大解放' },
      { name: '晋国六卿', value: 68, category: 'era', desc: '晋国被智、赵、韩、魏等六卿把持，公室衰微' },
      { name: '三家分晋', value: 66, category: 'event', desc: '韩赵魏瓜分晋国，标志春秋之终、战国之始' },
      { name: '尊王攘夷', value: 64, category: 'civilization', desc: '霸主尊奉周王、抵御外夷的旗号，名实相济' },
      { name: '弭兵会盟', value: 62, category: 'civilization', desc: '晋楚争霸后期由宋国倡导的停战会盟，暂息干戈' }
    ],
    // ============= 【战国】21条 — 核心词：战国争雄 + 百家争鸣 =============
    '战国': [
      // L1 核心（70/68）
      { name: '战国争雄', value: 100, category: 'era', desc: '七雄并立、合纵连横，兼并战争与变法图强贯穿始终的时代' },
      { name: '百家争鸣', value: 98, category: 'civilization', desc: '儒道法墨名等诸子学说鼎盛交锋，中国思想史的黄金时代' },
      // L2 ~5 词（56px）
      { name: '商鞅变法', value: 96, category: 'civilization', desc: '秦孝公任商鞅变法，废井田、奖军功，使秦国由弱变强' },
      { name: '合纵连横', value: 94, category: 'event', desc: '苏秦合纵抗秦、张仪连横破纵，纵横家主导七国外交格局' },
      { name: '七雄并立', value: 92, category: 'era', desc: '秦、楚、齐、燕、赵、魏、韩七大国并峙，征伐不休' },
      { name: '长平之战', value: 90, category: 'event', desc: '秦赵之间最大规模会战，白起坑杀赵卒，秦统一大势已定' },
      { name: '都江堰', value: 88, category: 'civilization', desc: '李冰父子主持修建，使成都平原成为天府之国' },
      // L3 ~7 词（46px）
      { name: '秦始皇', value: 86, category: 'person', desc: '秦王政扫灭六国、统一天下，开创中国第一个大一统王朝' },
      { name: '屈原', value: 84, category: 'person', desc: '楚国诗人，开创楚辞体，《离骚》千古传诵' },
      { name: '李斯', value: 82, category: 'person', desc: '秦相李斯，辅佐秦始皇统一六国，主持郡县制与书同文' },
      { name: '孙膑', value: 80, category: 'person', desc: '孙膑著《孙膑兵法》，桂陵、马陵两战大败魏军' },
      { name: '信陵君', value: 78, category: 'person', desc: '战国四公子之一，窃符救赵，礼贤下士' },
      { name: '赵武灵王', value: 76, category: 'person', desc: '推行胡服骑射，赵国军力大振，成为东方强国' },
      { name: '荆轲刺秦', value: 74, category: 'event', desc: '荆轲图穷匕见刺秦王，慷慨悲歌，壮士一去不复还' },
      // L4 ~7 词（36/28px）
      { name: '郑国渠', value: 72, category: 'civilization', desc: '韩国水工郑国主持修建，灌溉关中沃野，秦因之益强' },
      { name: '孙膑兵法', value: 70, category: 'civilization', desc: '孙膑所著兵书，讲究因势利导、奇正相生' },
      { name: '曾侯乙编钟', value: 68, category: 'civilization', desc: '战国青铜礼乐重器，全套编钟一钟双音，代表先秦音乐巅峰' },
      { name: '战国策', value: 66, category: 'civilization', desc: '记录纵横家言行的国别体史书，文学价值极高' },
      { name: '铁器牛耕', value: 64, category: 'civilization', desc: '铁制农具与牛耕普及，生产力飞跃推动社会变革' },
      { name: '函谷关', value: 62, category: 'geo', desc: '秦之东门，六国屡次叩关而不得入，军事要冲' },
      { name: '胡服骑射', value: 60, category: 'event', desc: '赵武灵王改革军制，学习胡人骑射，赵国武备大兴' }
    ],
    // ============= 【秦】20条 — 核心词：秦并天下 + 皇帝制度 =============
    '秦': [
      // L1 核心（70/68）
      { name: '秦并天下', value: 100, category: 'era', desc: '秦始皇扫灭六国，实现中国历史上第一次真正的大一统' },
      { name: '皇帝制度', value: 98, category: 'civilization', desc: '首创皇帝尊号与三公九卿制，奠定两千余年中央集权政体' },
      // L2 ~5 词（56px）
      { name: '书同文', value: 96, category: 'civilization', desc: '统一文字为小篆，车同轨、书同文、行同伦' },
      { name: '焚书坑儒', value: 94, category: 'event', desc: '禁绝私学、焚毁典籍，思想专制与文化的重大浩劫' },
      { name: '万里长城', value: 92, category: 'geo', desc: '北筑长城以御匈奴，是世界古代最宏大的军事防御工程' },
      { name: '郡县制', value: 90, category: 'civilization', desc: '废分封、行郡县，官僚政治取代贵族政治' },
      { name: '沙丘政变', value: 88, category: 'event', desc: '秦始皇病逝沙丘，赵高矫诏拥立胡亥，秦政自此崩坏' },
      // L3 ~7 词（46px）
      { name: '秦始皇', value: 86, category: 'person', desc: '嬴政扫六合而定天下，功过并存的千古一帝' },
      { name: '李斯', value: 84, category: 'person', desc: '秦相李斯，辅佐统一、主持郡县制与书同文，终为赵高所杀' },
      { name: '蒙恬', value: 82, category: 'person', desc: '北逐匈奴、修长城、掌管重兵的秦朝名将' },
      { name: '王翦', value: 80, category: 'person', desc: '灭赵灭楚的老将，为秦统一立下不世战功' },
      { name: '统一度量衡', value: 78, category: 'civilization', desc: '统一衡石丈尺，便利赋税与商贸，强化政令整齐划一' },
      { name: '阿房宫', value: 76, category: 'geo', desc: '大兴土木营建咸阳宫室，劳役苛重加剧民怨' },
      { name: '灵渠', value: 74, category: 'geo', desc: '开凿灵渠联通湘漓，为征岭南开辟水运通道' },
      // L4 ~7 词（36/28px）
      { name: '赵高', value: 72, category: 'person', desc: '指鹿为马的秦朝权宦，篡改遗诏、弄权误国' },
      { name: '章邯', value: 70, category: 'person', desc: '秦末名将，镇压起义军却终为项羽所败' },
      { name: '巨鹿之战', value: 68, category: 'event', desc: '项羽破釜沉舟大败秦军主力，秦亡大势已定' },
      { name: '大泽乡起义', value: 66, category: 'event', desc: '陈胜吴广首举义旗，点燃秦末农民战争燎原之火' },
      { name: '指鹿为马', value: 64, category: 'event', desc: '赵高当廷指鹿为马试探群臣，尽显秦廷纲纪废弛' },
      { name: '驰道', value: 62, category: 'geo', desc: '修建以咸阳为中心辐射全国的驰道，车同轨以通政令' },
      { name: '陈胜吴广', value: 60, category: 'event', desc: '大泽乡揭竿而起，「王侯将相宁有种乎」' }
    ]
  }
  // 优先使用 JSON 导入的朝代关键词，避免回退到上古占位数据
  if (jsonData.value?.keywords && jsonData.value.keywords.length > 0) {
    return jsonData.value.keywords as DynastyKw[]
  }
  return M[dynasty.value.name] || []
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

// AABB 相交检测（分轴留白，水平/垂直使用不同 %，保证字间有舒适留白）
const aabbOverlap = (a: PlacedBox, b: PlacedBox, padX = PAD_X, padY = PAD_Y): boolean => {
  return (
    Math.abs(a.cx - b.cx) < a.w + b.w + padX &&
    Math.abs(a.cy - b.cy) < a.h + b.h + padY
  )
}

// 计算某词专属可行边界（%）：把「半宽/半高 + 留白 + 边距」都钳制在 0~100 内，
// 中心点落在此区间即保证整词完整、不越界、不截断
const boxBound = (box: { wPct: number; hPct: number }): { xMin: number; xMax: number; yMin: number; yMax: number } => {
  const MARGIN = 0.6
  const xMin = Math.max(0, box.wPct + PAD_X + MARGIN)
  const xMax = Math.min(100, 100 - box.wPct - PAD_X - MARGIN)
  const yMin = Math.max(0, box.hPct + PAD_Y + MARGIN)
  const yMax = Math.min(100, 100 - box.hPct - PAD_Y - MARGIN)
  return {
    xMin, xMax: Math.max(xMin, xMax),
    yMin, yMax: Math.max(yMin, yMax)
  }
}

// 词间留白（%）：水平/垂直对应窄卡片下的紧凑间隙，既美观又给 20 个词留出可放置空间
const PAD_X = 1.0
const PAD_Y = 2.0

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

// 字号 → % 半宽高（使用 Canvas 精确测量文字宽度 + 容器实测尺寸，保证碰撞与渲染同一坐标系）
const WORD_CLOUD_FONT = "'Ma Shan Zheng', 'KaiTi', 'STKaiti', cursive"
const estimateBox = (name: string, sizePx: number): { wPct: number; hPct: number } => {
  const wPx = getTextWidth(name, sizePx, WORD_CLOUD_FONT)
  const hPx = sizePx * 1.2  // 中文字符近似正方形，行高约为字号的1.2倍
  const RW = cloudBoxW.value
  const RH = cloudBoxH.value
  return {
    wPct: (wPx / RW) * 100 * 0.5,  // 半宽
    hPct: (hPx / RH) * 100 * 0.5   // 半高
  }
}

// 螺旋搜索候选点（围绕初始位置，半径逐渐增大，32 方向，覆盖整个可行区域）
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
  // 半径逐步扩大到覆盖整个容器（55 环 × step 1.15 ≈ 63% 半径，足以扫满画布）
  for (let ring = 1; ring <= 55; ring++) {
    const step = ring * 1.15
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

// 全画布细网格寻空（极端兜底）：保证不重叠、不越界，尽量靠近中心
// pad 可传 0 进行「零留白」搜索，确保即便常规留白无处可放，也能挤进真正不重叠的缝隙
const findAnyFree = (
  box: { wPct: number; hPct: number },
  placed: PlacedBox[],
  bound: { xMin: number; xMax: number; yMin: number; yMax: number },
  padX = PAD_X,
  padY = PAD_Y
): { x: number; y: number } | null => {
  for (let gx = bound.xMin; gx <= bound.xMax; gx += 0.6) {
    for (let gy = bound.yMin; gy <= bound.yMax; gy += 1.0) {
      const test: PlacedBox = { cx: gx, cy: gy, w: box.wPct, h: box.hPct }
      let hit = false
      for (const p of placed) {
        if (aabbOverlap(test, p, padX, padY)) { hit = true; break }
      }
      if (!hit) return { x: gx, y: gy }
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

  const placed: PlacedBox[] = []
  const result: KwLayout[] = []

  for (let i = 0; i < sorted.length; i++) {
    const kw = sorted[i]
    let finalPos: { x: number; y: number } | null = null
    // 初始字号按 value 取值；失败时逐级下降直到找到可放置位置
    let finalSize = pickSizeByValue(kw.value)
    const ideal = getLayoutPos(i)

    // 字号逐级下降，寻找「不越界 + 不碰撞」的放置点
    for (let attempt = 0; attempt < 10 && !finalPos; attempt++) {
      const box = estimateBox(kw.name, finalSize)
      // 该词专属可行边界：保证整词 + 留白 + 边距 都在卡片内，杜绝截断/溢出
      const bound = boxBound(box)

      // 3 组起点（理想点 + 两个随机点），每组先试起点再螺旋搜索
      for (let r = 0; r < 3 && !finalPos; r++) {
        const sx = r === 0
          ? Math.min(Math.max(ideal.x, bound.xMin), bound.xMax)
          : bound.xMin + Math.random() * (bound.xMax - bound.xMin)
        const sy = r === 0
          ? Math.min(Math.max(ideal.y, bound.yMin), bound.yMax)
          : bound.yMin + Math.random() * (bound.yMax - bound.yMin)
        const cand: PlacedBox = { cx: sx, cy: sy, w: box.wPct, h: box.hPct }
        let collide = false
        for (const p of placed) {
          if (aabbOverlap(cand, p)) { collide = true; break }
        }
        if (!collide) { finalPos = { x: sx, y: sy }; break }
        // 撞中心/既有框 → 螺旋搜索可行边界内空位
        const sp = spiralSearch(sx, sy, box, placed, bound)
        if (sp) { finalPos = sp; break }
      }
      // 字号全部尝试仍无空位 → 降一级字号重试
      if (!finalPos) finalSize = lowerSize(finalSize)
    }

    // 极端兜底：最小字号 + 全画布细网格寻空（先用常规留白，失败则零留白，确保绝不重叠、绝不越界）
    if (!finalPos) {
      finalSize = 16
      const box = estimateBox(kw.name, finalSize)
      const bound = boxBound(box)
      finalPos = findAnyFree(box, placed, bound)
      if (!finalPos) finalPos = findAnyFree(box, placed, bound, 0, 0)
      if (!finalPos) {
        // 理论上 20 词极难发生；极特殊兜底：置于专属边界中心，仍钳制在框内
        finalPos = { x: (bound.xMin + bound.xMax) / 2, y: (bound.yMin + bound.yMax) / 2 }
      }
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
      xPct: finalPos.x,
      yPct: finalPos.y,
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
        cursor: route ? 'pointer' : 'help'
      }
    })
  }

  return result
})

// 词条释义：悬停即时展示，无详情路由的词条可点击固定（再点一次取消）
const hoveredKw = ref<KwLayout | null>(null)
const pinnedKw = ref<KwLayout | null>(null)
const activeKw = computed(() => hoveredKw.value || pinnedKw.value)
const kwCardStyle = computed(() => {
  const kw = activeKw.value
  if (!kw) return {}
  // 以词云实测尺寸计算像素坐标：优先向右展开，空间不足则翻到左侧，并上下钳制在容器内
  const W = cloudBoxW.value
  const H = cloudBoxH.value
  const cardW = 248
  const cardH = 92
  const pad = 6
  const x = (kw.xPct / 100) * W
  const y = (kw.yPct / 100) * H
  let left = x + 14
  if (left + cardW > W - pad) left = x - 14 - cardW
  left = Math.max(pad, left)
  const top = Math.min(Math.max(y - cardH / 2, pad), H - cardH - pad)
  return { left: `${left}px`, top: `${top}px` }
})
const handleKwClick = (kw: KwLayout) => {
  if (kw.detailRoute) router.push(kw.detailRoute.path)
  else pinnedKw.value = pinnedKw.value?.name === kw.name ? null : kw
}

// 事件参与度：人物↔事件关联对数 ÷ 事件数，反映平均每个事件有多少位人物参与
const associationDensity = computed(() => {
  const persons = dynastyPersons.value
  const events = dynastyEvents.value
  if (events.length === 0 || persons.length === 0) return '0'
  const clicks = new Set<string>() // "人物|事件" 去重，统计人物参与/关联事件的真实对数
  // 只统计本朝代人物表中的在册人物，跨朝代未接入的人物不计入
  const known = new Set(persons.map(p => p.name))
  dynastyEvents.value.forEach(ev => {
    const names = new Set<string>()
    ;(ev.person_relations || []).forEach(r => { if (r.source) names.add(r.source); if (r.target) names.add(r.target) })
    const groups: Array<'leaders' | 'participants' | 'opponents'> = ['leaders', 'participants', 'opponents']
    groups.forEach((k) =>
      (ev.person_groups?.[k] || []).forEach((x: any) => { if (x.name) names.add(x.name) }))
    names.forEach(n => { if (known.has(n)) clicks.add(`${n}|${ev.name}`) })
  })
  // 兜底合并人物自身的 related_events
  persons.forEach(p => (p.related_events || []).forEach((e: any) => {
    const en = typeof e === 'string' ? e : e?.name
    if (en) clicks.add(`${p.name}|${en}`)
  }))
  return (clicks.size / events.length).toFixed(1)
})

// 平均关系度：人物关系条目总数 ÷ 人物数，反映每人平均关联几位人物
const networkActivity = computed(() => {
  const persons = dynastyPersons.value
  if (persons.length === 0) return '0'
  const total = persons.reduce((s, p) => s + (p.related_people?.length || 0), 0)
  return (total / persons.length).toFixed(1)
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
  '秦': [
    { name: '商鞅变法', year: -356, value: 8.5, tag: '富国强兵' },
    { name: '长平之战', year: -260, value: 9, tag: '重创赵国' },
    { name: '嬴政即位', year: -246, value: 8.5, tag: '秦王临朝' },
    { name: '灭韩赵', year: -230, value: 9, tag: '统一战争' },
    { name: '灭楚', year: -223, value: 9.5, tag: '南方平定' },
    { name: '统一六国', year: -221, value: 10, tag: '天下一统' },
    { name: '修长城', year: -215, value: 8, tag: '北御匈奴' },
    { name: '焚书坑儒', year: -213, value: 5.5, tag: '思想禁锢' },
    { name: '始皇驾崩', year: -210, value: 4.5, tag: '沙丘之变' },
    { name: '陈胜起义', year: -209, value: 3, tag: '天下大乱' },
    { name: '巨鹿之战', year: -207, value: 2, tag: '秦军覆灭' },
    { name: '秦亡', year: -206, value: 1, tag: '秦室终结' }
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
  '唐': [
    { name: '唐朝建立', year: 618, value: 6, tag: '大唐建元' },
    { name: '玄武门变', year: 626, value: 5.5, tag: '宫闱之变' },
    { name: '贞观之治', year: 630, value: 9, tag: '天下大治' },
    { name: '武周称帝', year: 690, value: 8, tag: '女皇临朝' },
    { name: '开元盛世', year: 730, value: 10, tag: '万国来朝' },
    { name: '安史之乱', year: 755, value: 3, tag: '由盛转衰' },
    { name: '藩镇割据', year: 780, value: 5.5, tag: '两税法行' },
    { name: '甘露之变', year: 835, value: 3.5, tag: '宦官专权' },
    { name: '黄巢起义', year: 880, value: 2.5, tag: '大厦将倾' },
    { name: '朱温篡唐', year: 907, value: 1.5, tag: '大唐终结' }
  ],
  '汉': [
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
  '宋': [
    { name: '陈桥兵变', year: 960, value: 6, tag: '黄袍加身' },
    { name: '杯酒释兵', year: 961, value: 7, tag: '强干弱枝' },
    { name: '先南后北', year: 975, value: 8, tag: '初定天下' },
    { name: '澶渊之盟', year: 1005, value: 8, tag: '宋辽和议' },
    { name: '庆历新政', year: 1043, value: 8.5, tag: '范公改革' },
    { name: '王安石变', year: 1070, value: 9.5, tag: '熙宁立新' },
    { name: '元祐更化', year: 1086, value: 6.5, tag: '新旧党争' },
    { name: '靖康之变', year: 1127, value: 2, tag: '北宋灭亡' },
    { name: '高宗南渡', year: 1130, value: 5, tag: '南宋肇建' },
    { name: '绍兴和议', year: 1141, value: 6, tag: '宋金对峙' },
    { name: '乾淳之治', year: 1175, value: 8, tag: '南宋中兴' },
    { name: '端平入洛', year: 1234, value: 5.5, tag: '收复京洛' },
    { name: '崖山海战', year: 1279, value: 1.5, tag: '宋室终结' }
  ],
  '元': [
    { name: '成吉思汗立国', year: 1206, value: 6.5, tag: '蒙古崛起' },
    { name: '成吉思汗西征', year: 1220, value: 8, tag: '横扫欧亚' },
    { name: '灭金', year: 1234, value: 8.5, tag: '中原易主' },
    { name: '忽必烈即位', year: 1260, value: 8, tag: '汉地经营' },
    { name: '改国号为元', year: 1271, value: 8.5, tag: '大元建号' },
    { name: '灭南宋统一', year: 1279, value: 10, tag: '一统天下' },
    { name: '忽必烈逝世', year: 1294, value: 7, tag: '成宗守成' },
    { name: '武宗极盛', year: 1307, value: 8, tag: '国力鼎盛' },
    { name: '英宗新政', year: 1322, value: 6, tag: '南坡之变' },
    { name: '顺帝昏聩', year: 1340, value: 4, tag: '吏治腐败' },
    { name: '红巾军起义', year: 1351, value: 2.5, tag: '天下大乱' },
    { name: '大都陷落', year: 1368, value: 1, tag: '元朝覆亡' }
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
  '民国': [
    { name: '民国肇建', year: 1912, value: 6, tag: '共和初立' },
    { name: '二次革命', year: 1913, value: 4.5, tag: '讨袁受挫' },
    { name: '洪宪帝制', year: 1915, value: 3.5, tag: '帝制复辟' },
    { name: '新文化运动', year: 1917, value: 5, tag: '思想启蒙' },
    { name: '五四运动', year: 1919, value: 5.5, tag: '外争主权' },
    { name: '军阀混战', year: 1920, value: 3, tag: '割据纷争' },
    { name: '北伐统一', year: 1928, value: 6.5, tag: '南京建政' },
    { name: '黄金十年', year: 1935, value: 7.5, tag: '经济建设' },
    { name: '抗战爆发', year: 1937, value: 4, tag: '全民御侮' },
    { name: '抗战胜利', year: 1945, value: 7, tag: '民族凯旋' },
    { name: '内战再起', year: 1946, value: 4, tag: '战火重燃' },
    { name: '政权迁台', year: 1949, value: 2, tag: '大陆易帜' }
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
  ],
  '春秋': [
    { name: '平王东迁', year: -770, value: 6, tag: '东周肇始' },
    { name: '繻葛之战', year: -707, value: 5.5, tag: '王权衰微' },
    { name: '管仲改革', year: -685, value: 8, tag: '齐桓变法' },
    { name: '齐桓践土', year: -654, value: 8.5, tag: '尊王攘夷' },
    { name: '葵丘会盟', year: -651, value: 9.5, tag: '齐桓称霸' },
    { name: '城濮之战', year: -632, value: 9, tag: '晋文霸业' },
    { name: '楚庄问鼎', year: -606, value: 8.5, tag: '问鼎中原' },
    { name: '邲之战', year: -597, value: 8, tag: '楚庄称霸' },
    { name: '弭兵会盟', year: -546, value: 7, tag: '晋楚休兵' },
    { name: '柏举之战', year: -506, value: 7.5, tag: '吴师入郢' },
    { name: '勾践灭吴', year: -473, value: 7, tag: '越霸中原' },
    { name: '三家分晋', year: -403, value: 3, tag: '春秋终结' }
  ],
  '战国': [
    { name: '晋阳之战', year: -455, value: 5.5, tag: '智氏覆灭' },
    { name: '魏文侯变法', year: -445, value: 7.5, tag: '魏国崛起' },
    { name: '三家分晋', year: -403, value: 6.5, tag: '战国肇始' },
    { name: '商鞅变法', year: -356, value: 8.5, tag: '秦国强盛' },
    { name: '桂陵之战', year: -354, value: 8, tag: '孙庞斗智' },
    { name: '马陵之战', year: -341, value: 6.5, tag: '魏国衰落' },
    { name: '徐州相王', year: -334, value: 7, tag: '齐魏并王' },
    { name: '胡服骑射', year: -307, value: 8, tag: '赵武灵王' },
    { name: '乐毅伐齐', year: -284, value: 6, tag: '燕国复仇' },
    { name: '长平之战', year: -260, value: 4, tag: '白起坑赵' },
    { name: '邯郸之战', year: -257, value: 6.5, tag: '合纵救赵' },
    { name: '荆轲刺秦', year: -227, value: 4.5, tag: '垂死一搏' },
    { name: '秦灭六国', year: -221, value: 9, tag: '天下归一' }
  ],
  '三国': [
    { name: '曹丕代汉', year: 220, value: 7, tag: '三国始' },
    { name: '刘备称帝', year: 221, value: 7.5, tag: '蜀汉立' },
    { name: '夷陵之战', year: 222, value: 4.5, tag: '孙刘决裂' },
    { name: '孙权称帝', year: 229, value: 8.5, tag: '鼎足之势' },
    { name: '诸葛亮北伐', year: 234, value: 8, tag: '丞相星陨' },
    { name: '高平陵之变', year: 249, value: 6, tag: '司马篡权' },
    { name: '淮南三叛', year: 255, value: 5.5, tag: '曹氏抗争' },
    { name: '魏灭蜀之战', year: 263, value: 4, tag: '蜀汉亡' },
    { name: '司马昭称晋公', year: 264, value: 5.5, tag: '晋奠基' },
    { name: '司马炎代魏', year: 266, value: 6.5, tag: '西晋立' },
    { name: '晋灭吴之战', year: 280, value: 7.5, tag: '三国终' },
    { name: '太康之治', year: 282, value: 7, tag: '统一后治世' }
  ],
  '晋南北朝': [
    { name: '西晋灭吴', year: 280, value: 7.5, tag: '代魏一统' },
    { name: '八王之乱', year: 300, value: 3.5, tag: '宗室内耗' },
    { name: '永嘉之乱', year: 311, value: 2.5, tag: '衣冠南渡' },
    { name: '王敦之乱', year: 324, value: 5, tag: '东晋初定' },
    { name: '淝水之战', year: 383, value: 8.5, tag: '北府决胜' },
    { name: '桓玄篡晋', year: 402, value: 5.5, tag: '东晋内争' },
    { name: '刘宋代晋', year: 420, value: 6, tag: '南朝宋立' },
    { name: '元嘉之治', year: 445, value: 8, tag: '南朝治世' },
    { name: '北魏孝文改制', year: 493, value: 8.5, tag: '汉化改革' },
    { name: '侯景之乱', year: 548, value: 3, tag: '江南浩劫' },
    { name: '北周灭北齐', year: 577, value: 6.5, tag: '北朝一统' },
    { name: '隋代北周', year: 581, value: 7, tag: '南北朝终' }
  ],
  '隋': [
    { name: '隋代北周', year: 581, value: 6.5, tag: '文帝开国' },
    { name: '开皇改革', year: 585, value: 8.5, tag: '三省六部' },
    { name: '平陈统一', year: 589, value: 9, tag: '天下一统' },
    { name: '开皇律颁', year: 590, value: 8, tag: '以法治国' },
    { name: '大兴城营建', year: 595, value: 7.5, tag: '都城营造' },
    { name: '科举制兴', year: 600, value: 8, tag: '取士新制' },
    { name: '隋击突厥', year: 602, value: 7, tag: '北疆永安' },
    { name: '炀帝即位', year: 605, value: 6.5, tag: '大业改元' },
    { name: '大运河开凿', year: 610, value: 7.5, tag: '南北贯通' },
    { name: '灭吐谷浑', year: 609, value: 7, tag: '西拓河源' },
    { name: '三征高句丽', year: 613, value: 3, tag: '连年用兵' },
    { name: '隋末大起义', year: 616, value: 2, tag: '群雄并起' },
    { name: '江都兵变', year: 618, value: 1.5, tag: '隋室倾覆' }
  ]
}

const dynStages = computed(() => {
  if (!dynasty.value) return []
  // 朝代对象的 name 可能是不带「朝」的简称（如「明」），预设表里却是「明朝」
  const mapped = dynStagesMap[dynasty.value.name] || dynStagesMap[`${dynasty.value.name}朝`]
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
  // 没有预设就从事件中均匀抽取最多 10 个节点，按「先升后降」生成曲线
  const n = Math.min(10, evs.length)
  const result: { name: string; year: number; value: number; tag?: string }[] = []
  for (let i = 0; i < n; i++) {
    const idx = n === 1 ? 0 : Math.round((i * (evs.length - 1)) / (n - 1))
    const ev = evs[idx]
    const t = n === 1 ? 0 : i / (n - 1)
    // 约 60% 处达到峰值
    const raw = t <= 0.6 ? 6 + 4 * (t / 0.6) : 10 - 7 * ((t - 0.6) / 0.4)
    result.push({
      name: ev.name.slice(0, 4),
      year: ev.start_year,
      value: Math.round(raw * 2) / 2,
      tag: ev.event_type
    })
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

  const stats = personTypeStats.value
  const sum = stats.reduce((s, d) => s + d.value, 0) || 1
  const fallbackColors = ['#C34739', '#355C5A', '#D8B26A', '#4A6F7A', '#5C7A5E', '#8B5A2B', '#D4756A']
  
  occupationChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}% ({c}人)',
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
        const item = stats.find(d => d.name === name)
        if (!item) return name
        return `${name}  ${Math.round((item.value / sum) * 100)}%`
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
      data: stats.map((item, i) => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: PERSON_TYPE_COLORS[item.name] || fallbackColors[i % fallbackColors.length] }
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

// 记录最近浏览的朝代，供首页「为你推荐」使用
watch(dynastyId, (id) => recordRecentDynasty(id), { immediate: true })

watch([dynastyId, dynasty], () => {
  if (hasData.value) {
    initAllCharts()
  }
})

onMounted(async () => {
  window.addEventListener('resize', handleResize)

  // 实测词云容器尺寸并让布局按真实坐标重排（避免硬编码基准与实际渲染宽度不一致）
  const syncCloudBox = () => {
    if (wordCloudRef.value) {
      cloudBoxW.value = wordCloudRef.value.offsetWidth || 980
      cloudBoxH.value = wordCloudRef.value.offsetHeight || 420
    }
  }
  syncCloudBox()
  // 容器尺寸随 responsive/字体加载变化，用 ResizeObserver 保证碰撞与渲染始终一致
  const cloudResizeObserver = new ResizeObserver(syncCloudBox)
  if (wordCloudRef.value) cloudResizeObserver.observe(wordCloudRef.value)
  nextTick(syncCloudBox)

  // 尝试加载 JSON 数据
  const data = await loadDynastyData(dynastyId.value)
  if (data) {
    jsonData.value = data
  }
  
  if (hasData.value) {
    initAllCharts()
  }

  await focusKeywordFromQuery()

  // 保存 observer 以便卸载时断开
  wordCloudResizeObserver = cloudResizeObserver
})

// 首页搜索词条 → /dynasty/:id?kw=xxx：滚动到词云并固定该词释义
const focusKeywordFromQuery = async () => {
  const kwName = String(route.query.kw || '')
  if (!kwName) return
  await nextTick()
  const target = keywordCloudData.value.find(k => k.name === kwName)
  if (!target) return
  pinnedKw.value = target
  await nextTick()
  wordCloudRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(
  () => route.query.kw,
  () => { focusKeywordFromQuery() }
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  wordCloudResizeObserver?.disconnect()
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

      <BackButton fallback="/timeline" />

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
              <DynastyTerritoryMap
                :dynasty-id="dynastyId"
                :dynasty-name="dynasty?.name || ''"
              />
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
                  @mouseenter="hoveredKw = kw"
                  @mouseleave="hoveredKw = null"
                  @click="handleKwClick(kw)"
                >{{ kw.name }}</span>

                <!-- 词条释义卡片：悬停显示；无详情页的词条可点击固定 -->
                <div
                  v-if="activeKw && activeKw.desc"
                  class="absolute z-[999] w-[248px] rounded-md border border-[#D8B26A]/35 bg-white/95 px-3.5 py-2.5 shadow-[0_6px_20px_rgba(44,44,44,0.12)] pointer-events-none"
                  :style="kwCardStyle"
                >
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-[13px] font-medium" :style="{ color: CATEGORY_COLORS[activeKw.category] }">{{ activeKw.name }}</span>
                    <span class="text-[10px] text-[#4A4A3A]/45">{{ KW_CATEGORY_LABEL[activeKw.category] }}</span>
                  </div>
                  <p class="text-[12px] leading-[1.7] text-[#4A4A3A]/85">{{ activeKw.desc }}</p>
                </div>
              </div>
              <div class="mt-1 text-center text-[11px] text-[#4A4A3A]/45">悬停词条查看释义，点击有详情的人物/事件可跳转</div>
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
                人物构成
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
                  事件参与度
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
                      <span class="text-xs text-[#4A4A3A]/50">位/事件</span>
                    </div>
                    <p class="text-xs text-[#4A4A3A]/50 mb-2">平均每个事件关联人物数</p>
                    <div class="w-full h-2 bg-[#D8B26A]/15 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-[#355C5A] via-[#4A6F7A] to-[#D8B26A] rounded-full transition-all duration-1000" :style="{ width: Math.min(100, Number(associationDensity) * 18) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Network Activity -->
              <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 flex-1">
                <h4 class="text-xs text-[#4A4A3A]/60 mb-3 font-medium flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  平均关系度
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
                      <span class="text-xs text-[#4A4A3A]/50">位/人</span>
                    </div>
                    <p class="text-xs text-[#4A4A3A]/50 mb-2">平均每人关联人物数</p>
                    <div class="w-full h-2 bg-[#D8B26A]/15 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-[#C34739] via-[#D4756A] to-[#D8B26A] rounded-full transition-all duration-1000" :style="{ width: Math.min(100, Number(networkActivity) * 14) + '%' }"></div>
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
              <div class="font-calligraphy text-3xl text-[#D8B26A] mb-1">{{ dynastyWorkCount }}</div>
              <span class="text-xs text-[#4A4A3A]/50">代表作品</span>
            </div>
            <div class="bg-white/60 border border-[#D8B26A]/20 rounded-md p-5 text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-[#4A6F7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              <div class="font-calligraphy text-3xl text-[#4A6F7A] mb-1">{{ dynastyRelationCount }}</div>
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
                v-for="d in relatedDynasties" 
                :key="d.id"
                :title="d.reason"
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