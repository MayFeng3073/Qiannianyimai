<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { persons, dynasties, events } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'
import ComingSoon from '@/components/ComingSoon.vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

// 从人物ID推断朝代ID (201001 -> 201)
const personId = Number(route.params.id) || 1001
const jsonData = ref<DynastyData | null>(null)

// 加载数据 - 尝试可能的朝代ID
async function tryLoadPersonData(id: number): Promise<DynastyData | null> {
  const prefix = Math.floor(id / 1000)
  const candidates = [prefix]
  // 对于已知的映射关系添加候选
  if (id >= 200000) candidates.push(201)
  for (const dId of [...new Set(candidates)]) {
    const data = await loadDynastyData(dId)
    if (data && data.persons.some(p => p.id === id)) {
      return data
    }
  }
  return null
}

// 优先从 JSON 数据查找人物，fallback 到 mock
const person = computed(() => {
  if (jsonData.value) {
    const found = jsonData.value.persons.find(p => p.id === personId)
    if (found) return found
  }
  return persons.find(p => p.id === personId)
})
const hasData = computed(() => person.value !== undefined)
const isLevel2 = computed(() => person.value?.level === 2)

const relationChartRef = ref<HTMLElement | null>(null)
const radarChartRef = ref<HTMLElement | null>(null)
let relationChart: echarts.ECharts | null = null
let radarChart: echarts.ECharts | null = null
const exploreTab = ref<'person' | 'event'>('person')

const dimensionConfig: Record<string, { common: string[], professional: string[] }> = {
  '统治者': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['政治统治力', '制度建设度', '开创贡献度']
  },
  '政治人物': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['政治影响力', '制度改革度', '治国贡献度']
  },
  '军事人物': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['军事贡献度', '战略指挥力', '战绩影响度']
  },
  '文化人物': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['文学艺术成就', '文化传播度', '时代代表性']
  },
  '思想人物': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['思想影响力', '教育贡献度', '文化传播度']
  },
  '科技人物': {
    common: ['历史影响力', '关系活跃度'],
    professional: ['技术创新度', '科学贡献度', '社会影响度']
  }
}

const achievementTitleMap: Record<string, string> = {
  '统治者': '主要贡献',
  '政治人物': '主要贡献',
  '军事人物': '主要战绩',
  '文化人物': '代表作品',
  '思想人物': '核心思想',
  '科技人物': '科技成果'
}

const currentDimensions = computed(() => {
  if (!person.value) return { common: [], professional: [], all: [] }
  const cfg = dimensionConfig[person.value.category] || dimensionConfig['统治者']
  return {
    common: cfg.common,
    professional: cfg.professional,
    all: [...cfg.common, ...cfg.professional]
  }
})

const achievementTitle = computed(() => {
  if (!person.value) return '代表成果'
  return achievementTitleMap[person.value.category] || '代表成果'
})

const dimensionValues = computed(() => {
  if (!person.value?.dimension_scores) {
    const base = person.value?.influence || 70
    return [base, base - 10, base - 5, base - 8, base - 12]
  }
  const ds = person.value.dimension_scores
  return [ds.historical_influence, ds.relation_activity, ds.professional_1, ds.professional_2, ds.professional_3]
})

const formattedYear = (year: number | null | undefined) => {
  if (!year && year !== 0) return '不详'
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

const lifeSpan = computed(() => {
  if (!person.value) return ''
  const b = formattedYear(person.value.birth_year)
  const d = formattedYear(person.value.death_year)
  return `${b} — ${d}`
})

const personTags = computed(() => {
  if (!person.value) return []
  const tags: string[] = []
  if (person.value.category) tags.push(person.value.category)
  if (person.value.occupations) tags.push(...person.value.occupations.slice(0, 2))
  if (person.value.art_name) tags.push(person.value.art_name)
  return tags.slice(0, 5)
})

const famousQuote = computed(() => {
  if (!person.value) return ''
  const quotes: Record<string, string> = {
    '黄帝': '中华民族共同始祖，\n相传统一华夏各部落，\n奠定中华文明的重要基础。',
    '炎帝': '神农尝百草，\n始有医药，\n教民耕种，五谷兴焉。',
    '蚩尤': '铜头铁额，\n食沙石子，\n造立兵杖刀戟大弩。',
    '大禹': '禹八年于外，\n三过其门而不入。'
  }
  return quotes[person.value.name] || person.value.summary?.slice(0, 30) || ''
})

const relatedEventsData = computed(() => {
  if (!person.value?.related_events?.length) return []
  
  // 使用 JSON 数据中的事件或 mock 数据
  const allEvents = jsonData.value?.events || events
  
  return person.value.related_events.map(re => {
    const name = typeof re === 'string' ? re : re.name
    const role = typeof re === 'string' ? '参与者' : re.role
    const found = allEvents.find(e => e.name === name)
    return {
      ...found,
      role,
      id: found?.id || 0
    }
  }).filter(e => e.id)
})

// =============== 人生起伏曲线 ===============
const hoveredLifeIdx = ref(-1)

const sortedLifeEvents = computed(() => {
  const evs = (person.value?.life_events || []).slice()
  evs.sort((a, b) => a.year - b.year)
  return evs
})

const lifeEventColor = (imp?: number) => {
  const v = imp ?? 7
  return v >= 9 ? '#C34739' : v >= 7 ? '#8B5A2B' : v >= 5 ? '#D8B26A' : '#6B8E7D'
}
const lifeLineEventColor = (imp?: number) => {
  const v = imp ?? 7
  const color = v >= 9 ? '#C34739' : v >= 7 ? '#8B5A2B' : v >= 5 ? '#D8B26A' : '#6B8E7D'
  return color + '33'
}
const importanceLabel = (imp: number) => {
  return imp >= 9 ? '顶峰' : imp >= 7 ? '重要' : imp >= 5 ? '平稳' : '过渡'
}
// =============== END 人生起伏曲线 ===============

const achievementsList = computed(() => {
  if (!person.value) return []
  if (person.value.works?.length) {
    return person.value.works.map(w => w.name)
  }
  if (person.value.name === '黄帝') {
    return [
      '建立华夏联盟',
      '推动部落融合',
      '奠定中华文明',
      '创立制度（传说）',
      '创制衣冠制度',
      '发明舟车指南',
      '命仓颉造字',
      '定音律历数'
    ]
  }
  if (person.value.name === '炎帝') {
    return [
      '尝百草创医药',
      '教民农耕稼穑',
      '发明耒耜工具',
      '开辟市场贸易',
      '制麻为布衣裳',
      '作五弦琴乐'
    ]
  }
  return []
})

const historicalAssessment = computed(() => {
  if (!person.value) return { title: '', influence: [], quotes: [] }
  const data: Record<string, { title: string, influence: string[], quotes: { text: string, author: string }[] }> = {
    '黄帝': {
      title: '中华民族共同始祖',
      influence: [
        '奠定华夏文明根基',
        '推动民族融合统一',
        '成为中华文化重要象征',
        '开启中华人文初祖时代'
      ],
      quotes: [
        { text: '黄帝垂衣裳而天下治，盖取诸乾坤。', author: '《周易·系辞》' },
        { text: '昔在黄帝，生而神灵，弱而能言，幼而徇齐，长而敦敏，成而聪明。', author: '《史记·五帝本纪》' }
      ]
    },
    '炎帝': {
      title: '中华农业与医药始祖',
      influence: [
        '开创农耕文明',
        '奠定中医药基础',
        '推动原始社会发展',
        '与黄帝并称华夏始祖'
      ],
      quotes: [
        { text: '神农尝百草之滋味，水泉之甘苦，令民知所避就。', author: '《淮南子·修务训》' }
      ]
    },
    '启': {
      title: '夏朝建立者 · 家天下制度开创者',
      influence: [
        '打破禅让传统，开创世袭王权制度',
        '建立中国历史上第一个王朝——夏朝',
        '开启"家天下"时代，影响中国政治四千年'
      ],
      quotes: [
        { text: '启代益作后，卒然离蠥。', author: '《楚辞·天问》' },
        { text: '夏启有钧台之享，以继禹之绪。', author: '《左传·昭公四年》' }
      ]
    },
    '太康': {
      title: '夏朝第三任君主 · 失国之君',
      influence: [
        '因荒淫失国成为后世君王的警示',
        '太康失国标志夏朝第一次严重政治危机',
        '开启夏朝约四十年的"无王之世"'
      ],
      quotes: [
        { text: '太康尸位，以逸豫灭厥德，黎民咸贰。', author: '《尚书·五子之歌》' },
        { text: '太康失邦，昆弟五人须于洛汭。', author: '《尚书·序》' }
      ]
    },
    '仲康': {
      title: '夏朝第四任君主 · 困厄中维系王统',
      influence: [
        '在后羿专政的阴影下维系夏朝王统',
        '为少康中兴保留了夏朝血脉'
      ],
      quotes: [
        { text: '仲康肇位四海，胤侯命掌六师。', author: '《尚书·胤征》' }
      ]
    },
    '少康': {
      title: '夏朝中兴之主 · 复国明君',
      influence: [
        '历经艰险光复夏朝，开创"少康中兴"',
        '成为中国历史上最早的中兴之主典范',
        '以"有田一成、有众一旅"成就复国大业'
      ],
      quotes: [
        { text: '少康灭浇于过，后杼灭豷于戈，有穷由是遂亡。', author: '《左传·襄公四年》' },
        { text: '少康中兴，夏室复兴。', author: '《史记·夏本纪》' }
      ]
    },
    '夏桀': {
      title: '夏朝末代君主 · 暴政亡国之君',
      influence: [
        '成为后世"暴君"形象的典型代表',
        '夏朝灭亡标志着禅让制遗风的彻底终结',
        '其暴政与商汤仁政的对比成为历代政治教材'
      ],
      quotes: [
        { text: '桀不务德而武伤百姓，百姓弗堪。', author: '《史记·夏本纪》' },
        { text: '时日曷丧，予及汝皆亡！', author: '《尚书·汤誓》' }
      ]
    },
    '商汤': {
      title: '商朝建立者 · 以仁伐暴的开国之君',
      influence: [
        '以"网开一面"的仁德成为仁政典范',
        '建立中国历史上第二个王朝——商朝',
        '"十一征而无敌于天下"开创商朝基业'
      ],
      quotes: [
        { text: '汤武革命，顺乎天而应乎人。', author: '《周易·革卦》' },
        { text: '有夏多罪，天命殛之。', author: '《尚书·汤誓》' }
      ]
    },
    '太甲': {
      title: '商朝第五任君主 · 悔过自新的明君',
      influence: [
        '被放逐桐宫后改过自新，成为"知错能改"的典范',
        '伊尹放太甲的典故开创了相权制约君权的先例'
      ],
      quotes: [
        { text: '太甲悔过，自怨自艾，于桐处仁迁义。', author: '《孟子·万章上》' },
        { text: '帝太甲立三年，不明，暴虐，不遵汤法。', author: '《史记·殷本纪》' }
      ]
    },
    '太戊': {
      title: '商朝第九任君主 · 商朝中兴之主',
      influence: [
        '任用伊陟、巫咸修德政，使商朝由衰转盛',
        '"祥桑共生于朝"的典故成为天人感应的典型案例'
      ],
      quotes: [
        { text: '帝太戊修德，桑谷死。', author: '《史记·殷本纪》' },
        { text: '太戊赞于伊陟，作《伊陟》《原命》。', author: '《尚书·序》' }
      ]
    },
    '盘庚': {
      title: '商朝第十九任君主 · 迁都兴邦的雄主',
      influence: [
        '力排众议迁都于殷，使商朝政治中心稳定',
        '发表《盘庚》三篇训诰，是商代文学重要遗产',
        '迁殷后商朝再未迁都，为武丁中兴奠定基础'
      ],
      quotes: [
        { text: '盘庚迁殷，民咨胥怨。', author: '《尚书·盘庚》' },
        { text: '殷道复兴，诸侯来朝。', author: '《史记·殷本纪》' }
      ]
    },
    '武丁': {
      title: '商朝第二十二任君主 · 武丁中兴开创者',
      influence: [
        '在位五十九年开创商朝最辉煌的时代',
        '从版筑工中发现傅说，不拘一格降人才',
        '商朝疆域空前扩大，青铜文明达到鼎盛'
      ],
      quotes: [
        { text: '武丁修政行德，天下咸驩，殷道复兴。', author: '《史记·殷本纪》' },
        { text: '在武丁时，旧劳于外，爰及小人。', author: '《尚书·无逸》' }
      ]
    },
    '妇好': {
      title: '商代女将军 · 中华第一女将',
      influence: [
        '中国历史上第一位有据可查的女将军',
        '主持祭祀大典，集军事与宗教权力于一身',
        '妇好墓出土大量珍贵文物，震惊世界'
      ],
      quotes: [
        { text: '妇好伐羌方，登妇好三千，登旅万。', author: '殷墟甲骨文' },
        { text: '妇好其比沚𪳂伐羌方，王自东亳伐。', author: '殷墟甲骨文' }
      ]
    },
    '祖甲': {
      title: '商朝第二十四任君主 · 礼制改革者',
      influence: [
        '完善商朝祭祀制度，推行礼制改革',
        '体恤民情，减轻赋税，是一位有作为的商王'
      ],
      quotes: [
        { text: '祖甲立，是为帝甲，淫乱，殷复衰。', author: '《史记·殷本纪》' },
        { text: '肆祖甲之享国三十有三年。', author: '《尚书·无逸》' }
      ]
    },
    '帝乙': {
      title: '商朝第二十九任君主 · 末世守成之君',
      influence: [
        '在位期间征伐东夷，维持商朝权威',
        '无力扭转商朝衰落之势，为帝辛留下隐患'
      ],
      quotes: [
        { text: '帝乙在位，殷益衰。', author: '《史记·殷本纪》' }
      ]
    },
    '帝辛': {
      title: '商朝末代君主 · 千古争议的亡国之君',
      influence: [
        '天资聪颖却荒淫暴虐，成为暴君代名词',
        '征伐东夷开拓疆土，但损耗国力',
        '牧野之战奴隶倒戈，商朝六百年基业毁于一旦'
      ],
      quotes: [
        { text: '纣之不善，不如是之甚也。是以君子恶居下流，天下之恶皆归焉。', author: '《论语·子张》' },
        { text: '资辨捷疾，闻见甚敏；材力过人，手格猛兽。', author: '《史记·殷本纪》' }
      ]
    },
    '周太王': {
      title: '周族奠基人 · 古公亶父',
      influence: [
        '率周族迁居岐山周原，奠定周朝基业',
        '建立城邑，发展农业，使周族从部落走向文明',
        '被周人尊为太王，是周王朝的奠基人'
      ],
      quotes: [
        { text: '古公亶父，来朝走马，率西水浒，至于岐下。', author: '《诗经·大雅·绵》' },
        { text: '周太王修后稷、公刘之业，积德行义。', author: '《史记·周本纪》' }
      ]
    },
    '王季': {
      title: '周族先公 · 文王之父',
      influence: [
        '继承周太王之业，征伐戎狄扩张周族势力',
        '与商朝联姻，提升周族在商朝政治中的地位',
        '为周文王灭商奠定了坚实基础'
      ],
      quotes: [
        { text: '王季勤于王家，以笃周祜。', author: '《诗经·周颂》' }
      ]
    },
    '周文王': {
      title: '周朝奠基者 · 内圣外王的典范',
      influence: [
        '施行仁政，使周族"三分天下有其二"',
        '被囚羑里演《周易》，影响中华文化数千年',
        '渭水访贤聘姜子牙，为灭商奠定人才基础',
        '被后世儒家奉为"内圣外王"的理想君主'
      ],
      quotes: [
        { text: '文王在上，于昭于天。周虽旧邦，其命维新。', author: '《诗经·大雅·文王》' },
        { text: '文王拘而演《周易》。', author: '司马迁《报任安书》' }
      ]
    },
    '周武王': {
      title: '周朝建立者 · 牧野兴周的开国之君',
      influence: [
        '牧野一战灭商，建立绵延八百年的周朝',
        '大规模分封诸侯，开创封建制度',
        '发表《牧誓》历数纣王罪状，为后世革命理论奠基'
      ],
      quotes: [
        { text: '武王伐纣，前徒倒戈，攻于后以北。', author: '《尚书·武成》' },
        { text: '武王徵九牧之君，登豳之阜，以望商邑。', author: '《史记·周本纪》' }
      ]
    },
    '周成王': {
      title: '周朝第二任君主 · 成康之治的开创者',
      influence: [
        '在周公辅佐下平定三监之乱，巩固周朝统治',
        '与周康王共同开创"成康之治"太平盛世',
        '营建东都洛邑，建立周朝对东方的有效统治'
      ],
      quotes: [
        { text: '成王靖四方，以康兆民。', author: '《尚书·周官》' },
        { text: '成康之际，天下安宁，刑错四十余年不用。', author: '《史记·周本纪》' }
      ]
    },
    '周康王': {
      title: '周朝第三任君主 · 成康之治的继承者',
      influence: [
        '继承成王基业，延续周朝鼎盛局面',
        '天下安宁、刑法不用，达到了西周太平盛世的顶峰'
      ],
      quotes: [
        { text: '康王即位，遍告诸侯，宣告以文、武之业以申之。', author: '《史记·周本纪》' },
        { text: '成康之际，天下安宁，刑错四十余年不用。', author: '《史记·周本纪》' }
      ]
    },
    '周穆王': {
      title: '西周第五任君主 · 好游巡狩的传奇之王',
      influence: [
        '西征犬戎，东伐徐国，开疆拓土',
        '制定《吕刑》，是中国最早的成文刑法之一',
        '西行昆仑会见西王母的传说流传千古'
      ],
      quotes: [
        { text: '穆王将征犬戎，祭公谋父谏曰："不可。"', author: '《国语·周语》' },
        { text: '穆王巡狩，远至昆仑。', author: '《竹书纪年》' }
      ]
    },
    '周厉王': {
      title: '西周第十任君主 · 专利弭谤的暴君',
      influence: [
        '实行专利政策，与民争利，激起民愤',
        '"防民之口甚于防川"成为千古名训',
        '国人暴动出逃，开启"共和行政"时代'
      ],
      quotes: [
        { text: '防民之口，甚于防川。川壅而溃，伤人必多。', author: '《国语·周语》' },
        { text: '厉王虐，国人谤王。', author: '《国语·周语》' }
      ]
    },
    '周宣王': {
      title: '西周第十一任君主 · 宣王中兴之主',
      influence: [
        '任用贤臣中兴周朝，史称"宣王中兴"',
        '征伐猃狁、荆蛮、淮夷，恢复周朝声威',
        '晚年连年征战，消耗国力，为西周衰亡埋下隐患'
      ],
      quotes: [
        { text: '宣王即位，修政，法文、武、成、康之遗风，诸侯复宗周。', author: '《史记·周本纪》' },
        { text: '薄伐猃狁，至于大原。文武吉甫，万邦为宪。', author: '《诗经·小雅·六月》' }
      ]
    },
    '周幽王': {
      title: '西周末代君主 · 烽火戏诸侯的亡国之君',
      influence: [
        '烽火戏诸侯失信于天下，导致西周灭亡',
        '废嫡立庶引发政治危机，犬戎破镐京',
        '平王东迁开启东周时代，春秋战国由此开始'
      ],
      quotes: [
        { text: '幽王昏乱，西周遂亡。', author: '《诗经·小雅·正月》' },
        { text: '褒姒不好笑，幽王欲其笑万方，故不笑。', author: '《史记·周本纪》' }
      ]
    },
    '周公旦': {
      title: '周初元圣 · 礼乐制度奠基人',
      influence: [
        '摄政七年平定三监之乱，巩固周朝统治',
        '制礼作乐，奠定中国古代礼制基础',
        '营建洛邑，建立周朝东都',
        '被孔子尊为"元圣"，是儒家思想的重要源头'
      ],
      quotes: [
        { text: '周公吐哺，天下归心。', author: '曹操《短歌行》' },
        { text: '周公恐惧流言日，王莽谦恭未篡时。', author: '白居易《放言》' },
        { text: '武王崩，成王幼，周公践天子之位以治天下。', author: '《礼记·明堂位》' }
      ]
    }
  }
  return data[person.value.name] || {
    title: person.value.summary || '',
    influence: [
      '对后世产生深远影响',
      '是历史上重要的人物',
      '留下了宝贵的文化遗产'
    ],
    quotes: []
  }
})

const initRelationChart = () => {
  if (!relationChartRef.value || !person.value) return
  if (relationChart) relationChart.dispose()
  try {
    relationChart = echarts.init(relationChartRef.value)
    
    const colors: Record<string, string> = {
      '盟友': '#5C7A5E',
      '君臣': '#D8B26A',
      '亲属': '#D4756A',
      '敌对': '#C34739',
      '对手': '#8B5A2B',
      '朋友': '#4A4A3A',
      '师生': '#4A6F7A',
      '兄弟': '#C34739',
      '继承': '#355C5A'
    }
    
    const directionalRels = ['君臣', '师生', '继承']
    
    const nodes: any[] = [{
      name: person.value.name,
      symbolSize: 58,
      category: 0,
      itemStyle: { color: '#C34739', shadowBlur: 15, shadowColor: 'rgba(195,71,57,0.3)' },
      label: { show: true, position: 'bottom', distance: 8, fontSize: 14, fontWeight: 'bold', color: '#2C2C2C' }
    }]
    
    const links: any[] = []
    const cats: any[] = [{ name: '本人', itemStyle: { color: '#C34739' } }]
    const catMap = new Map<string, number>()
    let catIdx = 1
    
    person.value.related_people?.forEach(rp => {
      let ci = catMap.get(rp.relation)
      if (ci === undefined) {
        ci = catIdx++
        catMap.set(rp.relation, ci)
        cats.push({ name: rp.relation, itemStyle: { color: colors[rp.relation] || '#5C7A5E' } })
      }
      const inf = rp.influence || 60
      nodes.push({
        name: rp.name,
        symbolSize: Math.max(36, inf * 0.48),
        category: ci,
        itemStyle: { color: colors[rp.relation] || '#5C7A5E', shadowBlur: 8, shadowColor: (colors[rp.relation] || '#5C7A5E') + '40' },
        label: { show: true, position: 'bottom', distance: 5, fontSize: 12, color: '#4A4A3A', fontWeight: 500 }
      })
      
      const isDirectional = directionalRels.includes(rp.relation)
      links.push({
        source: person.value!.name,
        target: rp.name,
        value: rp.relation,
        symbol: isDirectional ? ['none', 'arrow'] : ['none', 'none'],
        symbolSize: isDirectional ? [0, 10] : [0, 0],
        label: {
          show: true,
          formatter: rp.relation,
          fontSize: 11,
          color: colors[rp.relation] || '#5C7A5E',
          backgroundColor: 'rgba(255,255,255,0.85)',
          padding: [2, 6],
          borderRadius: 4
        },
        lineStyle: { color: colors[rp.relation] || '#5C7A5E', width: Math.max(1.5, inf / 30), opacity: 0.55, curveness: 0 }
      })
    })
    
    relationChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => p.dataType === 'edge' 
          ? `${p.data.source} → ${p.data.target}<br/>关系：${p.data.value}`
          : `<strong style="font-size:13px;">${p.name}</strong>`,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: { color: '#2C2C2C', fontSize: 12 }
      },
      legend: { 
        data: cats.map(c => c.name), 
        bottom: 5, 
        textStyle: { color: '#4A4A3A', fontSize: 12 },
        itemGap: 15
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: cats,
        roam: false,
        draggable: false,
        force: { repulsion: 320, gravity: 0.1, edgeLength: [120, 180], friction: 0.6 },
        animation: false,
        emphasis: { focus: 'adjacency', lineStyle: { width: 5 } },
        lineStyle: { opacity: 0.55, width: 2, curveness: 0 }
      }]
    })
    
    relationChart.on('click', (p: any) => {
      if (p.dataType === 'node' && p.name !== person.value?.name) {
        const found = jsonData.value 
          ? jsonData.value.persons.find(pp => pp.name === p.name)
          : persons.find(pp => pp.name === p.name)
        if (found) {
          if (found.level === 2) {
            router.push(`/person/${found.id}/story`)
          } else {
            router.push(`/person/${found.id}`)
          }
        }
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const initRadarChart = () => {
  if (!radarChartRef.value || !person.value) return
  if (radarChart) radarChart.dispose()
  try {
    radarChart = echarts.init(radarChartRef.value)
    
    const dimIcons = ['📈', '👥', '🛡️', '🏛️', '💡']
    const indicators = currentDimensions.value.all.map((name, i) => ({
      name: `${dimIcons[i]} ${name}`,
      max: 100
    }))
    
    radarChart.setOption({
      radar: {
        indicator: indicators,
        center: ['50%', '52%'],
        radius: '68%',
        splitNumber: 4,
        axisNameGap: 20,
        axisName: { 
          color: '#4A4A3A', 
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: 'rgba(248,246,242,0.9)',
          padding: [4, 10],
          borderRadius: 4
        },
        splitLine: { lineStyle: { color: '#4A4A3A15' } },
        splitArea: {
          areaStyle: {
            color: ['rgba(216,178,106,0.03)', 'rgba(216,178,106,0.06)', 'rgba(216,178,106,0.09)', 'rgba(216,178,106,0.12)']
          }
        },
        axisLine: { lineStyle: { color: '#4A4A3A20' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: dimensionValues.value,
          name: person.value.name,
          areaStyle: { color: 'rgba(195,71,57,0.18)' },
          lineStyle: { color: '#C34739', width: 2 },
          itemStyle: { color: '#C34739' },
          label: {
            show: true,
            formatter: (p: any) => p.value,
            fontSize: 11,
            color: '#C34739',
            fontWeight: 'bold'
          },
          labelLayout: (params: any) => {
            const idx = params.dataIndex
            const total = dimensionValues.value.length
            const angle = -Math.PI / 2 + (2 * Math.PI / total) * idx
            const dist = 10
            return {
              dx: Math.cos(angle) * dist,
              dy: Math.sin(angle) * dist,
              align: Math.abs(Math.cos(angle)) < 0.2 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right'),
              verticalAlign: Math.abs(Math.sin(angle)) < 0.2 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom')
            }
          }
        }]
      }]
    })
  } catch (e) {
    console.error(e)
  }
}

const navigateToEvent = (id: number) => router.push(`/event/${id}`)
const navigateToPerson = (id?: number) => {
  if (id) {
    const p = jsonData.value
      ? jsonData.value.persons.find(pp => pp.id === id)
      : persons.find(pp => pp.id === id)
    if (p?.level === 2) {
      router.push(`/person/${id}/story`)
    } else {
      router.push(`/person/${id}`)
    }
  }
}
const navigateToDynasty = () => {
  if (!person.value) return
  const d = dynasties.find(dy => dy.name === person.value!.dynasty)
  if (d) router.push(`/dynasty/${d.id}`)
}
const navigateToDynastyPersons = () => {
  if (!person.value) return
  const d = dynasties.find(dy => dy.name === person.value!.dynasty)
  if (d) router.push(`/dynasty/${d.id}/persons`)
}

// 推荐人物：同朝代、排除本人和已关联人物
const relatedPersonNames = computed(() => new Set(person.value?.related_people?.map(rp => rp.name) || []))
const recommendedPersons = computed(() => {
  if (!person.value) return []
  return persons
    .filter(p => p.id !== person.value!.id && p.dynasty === person.value!.dynasty && !relatedPersonNames.value.has(p.name))
    .slice(0, 6)
})

// 推荐事件：同朝代、排除已关联事件
const relatedEventNames = computed(() => new Set(
  (person.value?.related_events || []).map(re => typeof re === 'string' ? re : re.name)
))
const recommendedEvents = computed(() => {
  if (!person.value) return []
  return events
    .filter(e => e.dynasty === person.value!.dynasty && !relatedEventNames.value.has(e.name))
    .slice(0, 6)
})

const handleResize = () => {
  relationChart?.resize()
  radarChart?.resize()
}

onMounted(async () => {
  // 尝试加载 JSON 数据
  if (personId >= 200000) {
    const data = await tryLoadPersonData(personId)
    if (data) {
      jsonData.value = data
    }
  }

  nextTick(() => {
    setTimeout(() => {
      initRelationChart()
      initRadarChart()
    }, 200)
  })
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    relationChart?.dispose()
    radarChart?.dispose()
    window.removeEventListener('resize', handleResize)
  })
})

watch(() => route.params.id, () => {
  nextTick(() => {
    setTimeout(() => {
      initRelationChart()
      initRadarChart()
    }, 200)
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative" v-if="hasData">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

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
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/timeline')">中国历史</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynasty">{{ person!.dynasty }}</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynastyPersons">代表人物</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">{{ person!.name }}</span>
          </div>
        </div>
        </div>
    </nav>

    

    <section class="relative py-16 px-8" style="min-height: 580px;">
      <div class="absolute top-0 left-1/3 w-[500px] h-[180px] bg-gradient-to-b from-[#D8B26A]/12 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-72 h-72 bg-[#355C5A]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 left-10 w-56 h-56 bg-[#C34739]/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="max-w-6xl mx-auto relative z-10">
        <div class="grid grid-cols-12 gap-10 items-center">
          <div class="col-span-5">
            <div class="w-full aspect-[3/4] rounded-md overflow-hidden shadow-xl border border-[#D8B26A]/20 relative">
              <div class="absolute inset-0 bg-gradient-to-br from-[#D8B26A]/25 to-[#355C5A]/20 flex items-center justify-center">
                <span class="font-calligraphy text-8xl text-[#2C2C2C]/30">{{ person!.name.charAt(0) }}</span>
              </div>
              <img :src="person!.image_url" :alt="person!.name" class="w-full h-full object-cover absolute inset-0 z-10 opacity-0 transition-opacity duration-500" onload="this.style.opacity='1'" @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/person' + person!.id + '/400/500'; e.target.onerror = null }" />
            </div>
          </div>
          
          <div class="col-span-7">
            <div class="flex items-baseline gap-4 mb-4">
              <h1 class="font-calligraphy text-6xl md:text-7xl text-[#2C2C2C] tracking-wider">{{ person!.name }}</h1>
              <span class="text-xl text-[#4A4A3A] font-light" v-if="person!.courtesy_name">字 {{ person!.courtesy_name }}</span>
            </div>
            
            <div class="flex items-center gap-4 text-base text-[#4A4A3A] mb-6">
              <span>{{ person!.dynasty }}</span>
              <span class="w-1 h-1 rounded-full bg-[#D8B26A]/50"></span>
              <span>{{ person!.occupations?.[0] || '历史人物' }}</span>
              <span class="w-1 h-1 rounded-full bg-[#D8B26A]/50"></span>
              <span>{{ person!.category }}</span>
            </div>
            
            <div class="text-xl text-[#2C2C2C] font-serif mb-6 italic">
              "{{ famousQuote.split('\n')[0] }}"
            </div>
            
            <div class="text-sm text-[#4A4A3A]/80 leading-relaxed mb-6 space-y-3">
              <p>{{ person!.summary }}</p>
              <p v-if="person!.name === '黄帝'">黄帝在位期间，国势强盛，政治安定，文化进步。相传他有许多发明创造，如文字、音乐、历数、宫室、舟车、衣裳和指南车等，对中华文明的发展产生了深远影响。</p>
              <p v-if="person!.name === '黄帝'">黄帝联合炎帝部落，共同击败蚩尤，统一中原地区，奠定了华夏民族的基础。后世帝王多以黄帝为祖先，称自己为炎黄子孙，黄帝也因此被尊为中华民族的共同始祖。</p>
              <p v-if="person!.name === '炎帝'">炎帝与黄帝同为中华民族的始祖，两人带领的部落逐渐融合，形成了华夏民族的主体。炎帝对中国农业、医药、贸易等领域的发展做出了开创性的贡献。</p>
            </div>
            
            <div class="flex items-center gap-4 text-sm text-[#4A4A3A]/60 mb-6">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{{ lifeSpan }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
                <span>{{ person!.birth_place || '不详' }}</span>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="tag in personTags" 
                :key="tag"
                class="px-4 py-1.5 text-sm bg-white/60 border border-[#D8B26A]/30 text-[#4A4A3A] rounded-full hover:border-[#D8B26A]/60 hover:text-[#C34739] transition-all cursor-default"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section v-if="!isLevel2 || (person!.life_events?.length || 0) > 0" class="px-8 py-14">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-10 gap-10">
          <div :class="(!isLevel2 && (person!.related_people?.length || 0) > 0) ? 'col-span-4' : 'col-span-10'">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
              <span class="w-1 h-7 bg-[#C34739] rounded-full"></span>
              人生轨迹
            </h2>

            <div class="space-y-1 ml-2">
              <div 
                v-for="(event, idx) in sortedLifeEvents" 
                :key="event.year + '-' + idx"
                class="flex gap-4 group cursor-pointer"
                @mouseenter="hoveredLifeIdx = idx"
                @mouseleave="hoveredLifeIdx = -1"
              >
                <div class="flex flex-col items-center pt-1.5">
                  <div
                    class="w-3 h-3 rounded-full group-hover:scale-125 transition-transform ring-4"
                    :class="[
                      hoveredLifeIdx === idx ? 'ring-[#C34739]/20' : 'ring-[#C34739]/10'
                    ]"
                    :style="{ backgroundColor: lifeEventColor(event.importance) }"
                  ></div>
                  <div v-if="idx < sortedLifeEvents.length - 1" class="w-px flex-1 mt-1" :style="{ background: lifeLineEventColor(event.importance) }"></div>
                </div>
                <div class="flex-1 pb-6">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="text-xs font-medium" :style="{ color: lifeEventColor(event.importance) }">{{ formattedYear(event.year) }}</div>
                    <span v-if="event.importance" class="text-[10px] text-[#4A4A3A]/40 tracking-wider">
                      {{ importanceLabel(event.importance) }}
                    </span>
                  </div>
                  <div class="text-base text-[#2C2C2C] font-medium mb-1 group-hover:text-[#C34739] transition-colors">{{ event.title }}</div>
                  <p v-if="event.description" class="text-sm text-[#4A4A3A]/65 leading-relaxed">{{ event.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!isLevel2 || (person!.related_people?.length || 0) > 0" class="col-span-6">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
              <span class="w-1 h-7 bg-[#355C5A] rounded-full"></span>
              人物关系
            </h2>
            <div ref="relationChartRef" class="w-full h-[480px] bg-white/40 rounded-md border border-[#D8B26A]/15"></div>
            <p class="text-xs text-[#4A4A3A]/50 text-center mt-2">点击人物节点可跳转至对应人物详情页</p>
          </div>
        </div>
      </div>
    </section>

    <template v-if="!isLevel2 || relatedEventsData.length > 0">
    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14 bg-[#F5F2EC]/50">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
          <span class="w-1 h-7 bg-[#8B5A2B] rounded-full"></span>
          代表事件
        </h2>
        <div class="grid grid-cols-3 gap-6" v-if="relatedEventsData.length > 0">
          <div 
            v-for="ev in relatedEventsData" 
            :key="ev.id"
            @click="navigateToEvent(ev.id)"
            class="group bg-white/60 border border-[#D8B26A]/20 rounded-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div class="aspect-video overflow-hidden rounded-t-md relative">
              <div class="absolute inset-0 bg-gradient-to-br from-[#355C5A]/20 via-[#D8B26A]/15 to-[#C34739]/20 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-14 h-14 text-[#355C5A]/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <div class="text-[#4A4A3A]/60 text-sm">{{ ev.name }}</div>
                </div>
              </div>
              <img 
                v-if="ev.image_url"
                :src="ev.image_url" 
                :alt="ev.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 absolute inset-0 z-10 opacity-0"
                onload="this.style.opacity='1'"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/event' + ev.id + '/400/300'; e.target.onerror = null }"
              />
              <div class="absolute top-3 left-3 px-2.5 py-0.5 bg-[#C34739] text-white text-xs rounded z-20">
                {{ ev.role }}
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-medium text-[#2C2C2C] group-hover:text-[#C34739] transition-colors">{{ ev.name }}</h3>
                <span class="text-xs text-[#4A4A3A]/50">{{ formattedYear(ev.start_year) }}</span>
              </div>
              <p class="text-sm text-[#4A4A3A]/70 line-clamp-2 mb-4">{{ ev.summary }}</p>
              <div class="flex items-center text-sm text-[#355C5A] font-medium group-hover:gap-2 transition-all gap-1">
                <span>查看事件</span>
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-[#4A4A3A]/50 text-sm">暂无相关事件数据</div>
      </div>
    </section>
    </template>

    <template v-if="!isLevel2 || achievementsList.length > 0">
    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
          <span class="w-1 h-7 bg-[#5C7A5E] rounded-full"></span>
          {{ achievementTitle }}
        </h2>

        <!-- Unified achievements list -->
        <div v-if="person?.works?.length" class="grid grid-cols-2 gap-x-12 gap-y-1">
          <div
            v-for="(w, idx) in person?.works || []"
            :key="'ach-' + idx"
            class="group cursor-default"
          >
            <div class="flex items-start gap-3 py-3 border-b border-[#D8B26A]/10">
              <div class="w-7 h-7 rounded-md bg-gradient-to-br from-[#D8B26A]/25 to-[#C34739]/15 flex items-center justify-center flex-shrink-0 group-hover:from-[#D8B26A]/35 group-hover:to-[#C34739]/25 transition-all mt-0.5">
                <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-[#2C2C2C] font-medium group-hover:text-[#C34739] transition-colors">{{ w.name }}</span>
                <p v-if="w.description" class="text-sm text-[#4A4A3A]/70 leading-relaxed mt-1 font-serif">{{ w.description }}</p>
                <p v-else-if="w.excerpt" class="text-sm text-[#4A4A3A]/60 leading-relaxed mt-1 font-serif italic border-l-2 border-[#D8B26A]/30 pl-3">{{ w.excerpt }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fallback for persons without works -->
        <div v-else-if="achievementsList.length > 0" class="grid grid-cols-2 gap-x-12 gap-y-3">
          <div 
            v-for="(item, idx) in achievementsList"
            :key="'ach-fallback-' + idx"
            class="flex items-start gap-3 py-2.5 border-b border-[#D8B26A]/10 group cursor-default"
          >
            <div class="w-7 h-7 rounded-md bg-gradient-to-br from-[#D8B26A]/25 to-[#C34739]/15 flex items-center justify-center flex-shrink-0 group-hover:from-[#D8B26A]/35 group-hover:to-[#C34739]/25 transition-all mt-0.5">
              <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <span class="text-[#2C2C2C] group-hover:text-[#C34739] transition-colors pt-0.5">{{ item }}</span>
          </div>
        </div>
      </div>
    </section>
    </template>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14 bg-[#F5F2EC]/50">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-10 flex items-center gap-3">
          <span class="w-1 h-7 bg-[#D8B26A] rounded-full"></span>
          历史定位
        </h2>
        <div class="grid grid-cols-10 gap-10 items-stretch">
          <div class="col-span-6 space-y-8">
            <div>
              <div class="text-xl text-[#C34739] font-serif font-medium mb-3">{{ historicalAssessment.title }}</div>
              <div class="w-16 h-px bg-[#D8B26A]/50 mb-4"></div>
            </div>
            
            <div>
              <h4 class="text-sm text-[#4A4A3A]/60 mb-3 font-medium">历史影响</h4>
              <ul class="space-y-2">
                <li 
                  v-for="(inf, i) in historicalAssessment.influence" 
                  :key="i"
                  class="flex items-start gap-2 text-[#4A4A3A]"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-[#D8B26A] mt-2 flex-shrink-0"></span>
                  <span>{{ inf }}</span>
                </li>
              </ul>
            </div>
            
            <div v-if="historicalAssessment.quotes.length > 0">
              <h4 class="text-sm text-[#4A4A3A]/60 mb-4 font-medium">史书记载</h4>
              <div class="space-y-4">
                <div 
                  v-for="(q, i) in historicalAssessment.quotes" 
                  :key="i"
                  class="relative bg-[#F8F6F2]/60 rounded-md p-4 border border-[#D8B26A]/20"
                >
                  <div class="absolute -top-2 -left-1 text-3xl text-[#D8B26A]/40 font-serif leading-none">"</div>
                  <p class="text-[#4A4A3A]/80 italic font-serif leading-relaxed relative z-10 pl-2">"{{ q.text }}"</p>
                  <p class="text-sm text-[#C34739] text-right mt-2">—— {{ q.author }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-span-4">
            <div class="bg-white/60 rounded-md border border-[#D8B26A]/20 px-6 py-6 flex flex-col h-full">
              <div class="text-center mb-3">
                <h4 class="font-calligraphy text-lg text-[#2C2C2C] mb-1">五维分析</h4>
                <div class="w-12 h-px mx-auto bg-[#D8B26A]/40"></div>
              </div>
              <div ref="radarChartRef" class="w-full flex-1 min-h-0 mb-3" style="min-height: 340px;"></div>
              <div class="pt-3 border-t border-[#D8B26A]/20 flex items-center justify-between">
                <span class="text-sm text-[#4A4A3A]/70">综合评分</span>
                <span class="font-calligraphy text-3xl text-[#C34739]">{{ Math.round(dimensionValues.reduce((a,b) => a+b, 0) / dimensionValues.length) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14 relative overflow-hidden">
      <div class="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#355C5A]/5 to-transparent pointer-events-none"></div>
      <div class="absolute bottom-0 left-1/4 w-72 h-32 bg-[#2C2C2C]/3 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/3 w-56 h-24 bg-[#4A4A3A]/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="max-w-7xl mx-auto relative z-10">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-calligraphy text-2xl text-[#2C2C2C] flex items-center gap-3">
            <span class="w-1 h-7 bg-[#4A6F7A] rounded-full"></span>
            继续探索
          </h2>
          <div class="flex items-center gap-2 bg-white/50 rounded-md p-1 border border-[#D8B26A]/20">
            <button 
              @click="exploreTab = 'person'"
              class="px-4 py-1.5 text-sm rounded transition-all"
              :class="exploreTab === 'person' ? 'bg-[#355C5A] text-white' : 'text-[#4A4A3A] hover:text-[#355C5A]'"
            >推荐人物</button>
            <button 
              @click="exploreTab = 'event'"
              class="px-4 py-1.5 text-sm rounded transition-all"
              :class="exploreTab === 'event' ? 'bg-[#355C5A] text-white' : 'text-[#4A4A3A] hover:text-[#355C5A]'"
            >推荐事件</button>
          </div>
        </div>
        
        <div v-if="exploreTab === 'person'" class="grid grid-cols-6 gap-4 min-h-[280px]">
          <div 
            v-for="rp in recommendedPersons" 
            :key="rp.id"
            @click="navigateToPerson(rp.id)"
            class="group cursor-pointer"
          >
            <div class="aspect-[3/4] rounded-md overflow-hidden border border-[#D8B26A]/15 mb-2 relative">
              <div class="absolute inset-0 bg-gradient-to-br from-[#D8B26A]/20 to-[#355C5A]/15 flex items-center justify-center">
                <span class="font-calligraphy text-5xl text-[#2C2C2C]/25">{{ rp.name.charAt(0) }}</span>
              </div>
              <img 
                :src="rp.image_url"
                :alt="rp.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 absolute inset-0 z-10 opacity-0"
                onload="this.style.opacity='1'"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/person' + rp.id + '/400/500'; e.target.onerror = null }"
              />
              <div class="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-xs rounded z-20">
                {{ rp.category }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#355C5A] transition-colors">{{ rp.name }}</div>
              <div class="text-xs text-[#4A4A3A]/50">{{ rp.dynasty }} · {{ rp.occupations?.[0] || rp.category }}</div>
            </div>
          </div>
          <div v-if="recommendedPersons.length === 0" class="col-span-6 text-center py-12 text-[#4A4A3A]/50 text-sm">
            暂无更多推荐人物
          </div>
        </div>
        
        <div v-else class="grid grid-cols-6 gap-4 min-h-[280px]">
          <div 
            v-for="ev in recommendedEvents" 
            :key="ev.id"
            @click="navigateToEvent(ev.id)"
            class="group cursor-pointer"
          >
            <div class="aspect-[3/4] rounded-md overflow-hidden border border-[#D8B26A]/15 mb-2 relative">
              <div class="absolute inset-0 bg-gradient-to-br from-[#355C5A]/15 via-[#D8B26A]/15 to-[#C34739]/15 flex items-center justify-center">
                <div class="text-center px-2">
                  <svg class="w-10 h-10 text-[#355C5A]/30 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <div class="text-[#4A4A3A]/50 text-xs leading-tight">{{ ev.name }}</div>
                </div>
              </div>
              <img 
                v-if="ev.image_url"
                :src="ev.image_url"
                :alt="ev.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 absolute inset-0 z-10 opacity-0"
                onload="this.style.opacity='1'"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/event' + ev.id + '/400/300'; e.target.onerror = null }"
              />
              <div class="absolute top-2 left-2 px-2 py-0.5 bg-[#355C5A]/80 backdrop-blur-sm text-white text-xs rounded z-20">
                {{ ev.event_type }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#355C5A] transition-colors">{{ ev.name }}</div>
              <div class="text-xs text-[#4A4A3A]/50">{{ ev.dynasty }} · {{ formattedYear(ev.start_year) }}</div>
            </div>
          </div>
          <div v-if="recommendedEvents.length === 0" class="col-span-6 text-center py-12 text-[#4A4A3A]/50 text-sm">
            暂无更多推荐事件
          </div>
        </div>
      </div>
    </section>

    <footer class="py-8 text-center border-t border-[#D8B26A]/15">
      <div class="font-calligraphy text-2xl text-[#4A4A3A]/40 mb-2">千年一脉</div>
      <p class="text-xs text-[#4A4A3A]/40">历史不会停留在书页，它也存在于每一个家庭</p>
    </footer>
  </div>
  
  <ComingSoon v-else title="数据整理中" description="该人物数据正在整理中，敬请期待。" />
</template>

<style scoped>
</style>
