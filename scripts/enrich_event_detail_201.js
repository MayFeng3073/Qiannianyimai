/**
 * 夏商西周事件细节丰富化脚本
 * 1. 添加更多事件
 * 2. 丰富每个事件的 person_groups (领导者/参与者/对手/受影响者)
 * 3. 将 impacts 从字符串数组转换为对象数组 (带 name + score)
 * 4. 添加 person_relations 连接
 * 
 * 用法: node scripts/enrich_event_detail_201.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_201.json');

// ========== 新增事件定义 ==========
const ADDITIONAL_EVENTS = [
  {
    id: 204019,
    name: '启建夏朝',
    dynasty: '夏商西周',
    start_year: -2070,
    end_year: -2070,
    event_type: '政治事件',
    summary: '大禹去世后，其子启破除禅让传统，建立中国第一个世袭制王朝夏朝，开启"家天下"时代。',
    significance: '启建夏朝是中国政治制度的根本变革，从此"公天下"变为"家天下"，王位父子相传，影响中国四千年。',
    one_sentence: '大禹之子启破除禅让，建立夏朝，开启中国"家天下"的世袭制时代。',
    location: '阳城（今河南登封）',
    related_persons: ['启', '大禹', '伯益'],
    person_groups: {
      leaders: [{ name: '启', role: '开国之君' }],
      participants: [
        { name: '大禹', role: '前任首领' },
        { name: '伯益', role: '竞争者' },
        { name: '皋陶', role: '支持者' }
      ],
      opponents: [{ name: '有扈氏', role: '反对者' }],
      affected: [{ name: '太康', role: '继位者' }]
    },
    narratives: [
      { year: -2070, title: '大禹去世', description: '大禹治水有功，受舜禅让而立，去世后传位伯益', tag: '背景' },
      { year: -2070, title: '启夺王位', description: '启不服伯益继位，以武力夺取政权', tag: '转折' },
      { year: -2070, title: '建立夏朝', description: '启建立夏朝，定都阳城，开启世袭制', tag: '建国' },
      { year: -2069, title: '甘之战', description: '征伐有扈氏，作《甘誓》，确立世袭制合法性', tag: '巩固' }
    ],
    background: {
      political: '大禹治水成功，声望极高，受舜禅让而立。大禹晚年曾有意传位伯益，但启凭借父祖之威望和武力夺位。',
      social: '上古时期禅让制已有数百年传统，启的"家天下"变革遭到部分部落反对。',
      cultural: '天命观念开始形成，为启的夺权提供了合法性依据。'
    },
    impacts: [
      { name: '政治影响', score: 95, description: '开创世袭制，影响中国四千年政治格局' },
      { name: '社会影响', score: 85, description: '部落联盟向国家形态转变' },
      { name: '文化影响', score: 80, description: '"家天下"观念成为中国政治文化核心' },
      { name: '历史影响', score: 90, description: '开启了中国王朝时代的循环' }
    ],
    chain: [
      { title: '大禹治水', year: '前2080年', type: 'cause', color: '#D8B26A' },
      { title: '启建夏朝', year: '前2070年', type: 'event', color: '#C34739' },
      { title: '太康失国', year: '前2050年', type: 'consequence', color: '#8B5A2B' }
    ],
    related_events: ['太康失国', '甘之战'],
    person_relations: [
      { source: '大禹', target: '启', type: 'kinship', desc: '父子关系' },
      { source: '启', target: '伯益', type: 'hostile', desc: '王位竞争者' },
      { source: '启', target: '皋陶', type: 'alliance', desc: '支持者' }
    ]
  },
  {
    id: 204020,
    name: '夏桀暴政',
    dynasty: '夏商西周',
    start_year: -1650,
    end_year: -1600,
    event_type: '政治事件',
    summary: '夏朝末代君主夏桀暴虐无道，不修德政，导致诸侯离心、民不聊生，最终被商汤所灭。',
    significance: '夏桀暴政导致夏朝灭亡，成为后世"无道昏君"的典型，为"天命靡常"的改朝换代观念提供了历史依据。',
    one_sentence: '夏桀暴虐无道，宠幸妺喜，残害忠良，最终众叛亲离被商汤所灭。',
    location: '斟鄩',
    related_persons: ['夏桀', '妺喜', '关龙逄', '商汤'],
    person_groups: {
      leaders: [{ name: '夏桀', role: '亡国之君' }],
      participants: [
        { name: '妺喜', role: '宠妃' },
        { name: '赵梁', role: '佞臣' }
      ],
      opponents: [
        { name: '关龙逄', role: '忠臣' },
        { name: '商汤', role: '讨伐者' }
      ],
      affected: [
        { name: '伊尹', role: '观望者' },
        { name: '有缗氏', role: '反叛部落' }
      ]
    },
    narratives: [
      { year: -1650, title: '桀继位', description: '夏桀继位为夏朝末代君主，才力过人但暴虐无道', tag: '背景' },
      { year: -1640, title: '宠幸妺喜', description: '宠幸有施氏之女妺喜，荒废朝政', tag: '荒政' },
      { year: -1620, title: '残害忠良', description: '杀忠臣关龙逄，囚禁商汤，诸侯离心', tag: '失德' },
      { year: -1600, title: '鸣条之战', description: '商汤率大军讨伐，夏军溃败，夏桀逃亡', tag: '亡国' }
    ],
    background: {
      political: '夏朝传至桀已历十七君，内政腐败，诸侯多叛。',
      social: '桀"以酒为池，以肉为林"，赋敛无度，民不聊生。',
      cultural: '关龙逄因进谏被烹杀，忠言绝迹，佞臣当道。'
    },
    impacts: [
      { name: '政治影响', score: 88, description: '夏朝灭亡，商朝建立' },
      { name: '社会影响', score: 82, description: '改朝换代，民众得以喘息' },
      { name: '文化影响', score: 85, description: '"天命靡常"观念深入人心' },
      { name: '历史影响', score: 92, description: '夏桀成为千古昏君典型' }
    ],
    chain: [
      { title: '少康中兴', year: '前2000年', type: 'cause', color: '#D8B26A' },
      { title: '夏桀暴政', year: '前1650年', type: 'event', color: '#C34739' },
      { title: '商汤灭夏', year: '前1600年', type: 'consequence', color: '#355C5A' }
    ],
    related_events: ['商汤灭夏', '鸣条之战'],
    person_relations: [
      { source: '夏桀', target: '关龙逄', type: 'hostile', desc: '忠臣被杀' },
      { source: '夏桀', target: '商汤', type: 'hostile', desc: '被讨伐' },
      { source: '夏桀', target: '妺喜', type: 'kinship', desc: '宠幸' }
    ]
  },
  {
    id: 204021,
    name: '国人暴动与共和行政',
    dynasty: '夏商西周',
    start_year: -841,
    end_year: -827,
    event_type: '政治事件',
    summary: '周厉王"防民之口甚于防川"，引发国人暴动，厉王出逃，周公召公二相共和行政，开启中国历史确切纪年。',
    significance: '共和行政是中国历史的转折点，从此中国历史有了确切纪年，"防民之口甚于防川"成为千古名言。',
    one_sentence: '周厉王专利弭谤，国人暴动，共和行政开启中国历史确切纪年。',
    location: '镐京',
    related_persons: ['周厉王', '召公奭', '周公'],
    person_groups: {
      leaders: [
        { name: '周厉王', role: '失政之君' },
        { name: '召公奭', role: '辅政大臣' }
      ],
      participants: [
        { name: '周公', role: '辅政大臣' },
        { name: '荣夷公', role: '专利倡导者' },
        { name: '卫巫', role: '弭谤执行者' }
      ],
      opponents: [
        { name: '国人', role: '暴动民众' }
      ],
      affected: [
        { name: '周宣王', role: '后继之君' }
      ]
    },
    narratives: [
      { year: -850, title: '专利政策', description: '周厉王任用荣夷公，垄断山林川泽之利', tag: '背景' },
      { year: -845, title: '卫巫弭谤', description: '用卫巫监视国人，"国人莫敢言，道路以目"', tag: '暴政' },
      { year: -841, title: '国人暴动', description: '镐京国人暴动，围攻王宫', tag: '爆发' },
      { year: -841, title: '厉王出逃', description: '厉王出逃彘地，共和行政开始', tag: '转折' },
      { year: -827, title: '宣王继位', description: '共和行政十四年后周宣王继位', tag: '延续' }
    ],
    background: {
      political: '周厉王任用荣夷公实行"专利"，剥夺贵族平民传统权益。',
      social: '镐京国人积累不满，"国人莫敢言，道路以目"。',
      cultural: '召公谏言"防民之口甚于防川"，体现了珍贵的民本思想。'
    },
    impacts: [
      { name: '政治影响', score: 90, description: '西周王权衰落，共和行政开始' },
      { name: '社会影响', score: 80, description: '国人力量首次显示' },
      { name: '文化影响', score: 95, description: '"防民之口甚于防川"成为千古警示' },
      { name: '历史影响', score: 92, description: '开启中国历史确切纪年（前841年）' }
    ],
    chain: [
      { title: '成康之治', year: '前1000年', type: 'cause', color: '#D8B26A' },
      { title: '国人暴动', year: '前841年', type: 'event', color: '#C34739' },
      { title: '宣王中兴', year: '前827年', type: 'consequence', color: '#355C5A' }
    ],
    related_events: ['共和行政', '宣王中兴'],
    person_relations: [
      { source: '周厉王', target: '召公奭', type: 'hostile', desc: '谏言不听' },
      { source: '周厉王', target: '荣夷公', type: 'lord_vassal', desc: '任用' },
      { source: '召公奭', target: '周公', type: 'alliance', desc: '共和行政' }
    ]
  },
  {
    id: 204022,
    name: '烽火戏诸侯',
    dynasty: '夏商西周',
    start_year: -775,
    end_year: -771,
    event_type: '政治事件',
    summary: '周幽王为博褒姒一笑，点燃烽火台戏弄诸侯，失信于天下，最终犬戎来犯时无人救援。',
    significance: '烽火戏诸侯是西周灭亡的直接原因，"烽火戏诸侯"成为失信亡国的千古教训。',
    one_sentence: '周幽王烽火戏诸侯，失信天下，犬戎来犯时无人救援，西周灭亡。',
    location: '镐京',
    related_persons: ['周幽王', '褒姒', '虢石父'],
    person_groups: {
      leaders: [{ name: '周幽王', role: '亡国之君' }],
      participants: [
        { name: '褒姒', role: '宠妃' },
        { name: '虢石父', role: '佞臣' },
        { name: '申后', role: '废后' },
        { name: '姬宜臼', role: '废太子' }
      ],
      opponents: [
        { name: '犬戎', role: '入侵者' },
        { name: '申侯', role: '联合进攻者' }
      ],
      affected: [
        { name: '周平王', role: '继位者' }
      ]
    },
    narratives: [
      { year: -782, title: '幽王继位', description: '继位后不理朝政，重用虢石父等佞臣', tag: '背景' },
      { year: -779, title: '宠幸褒姒', description: '得到褒姒后倍加宠幸，废掉申后', tag: '导火索' },
      { year: -775, title: '烽火戏诸侯', description: '为博褒姒一笑，点燃烽火台，多次失信', tag: '失信' },
      { year: -771, title: '犬戎破京', description: '犬戎联合申侯进攻镐京，再燃烽火无诸侯来救', tag: '兵祸' },
      { year: -771, title: '西周灭亡', description: '幽王被杀，镐京陷落，西周灭亡', tag: '亡国' }
    ],
    background: {
      political: '周幽王荒废朝政，重用虢石父等佞臣，政治腐败。',
      social: '废掉申后和太子宜臼，引发王室内部矛盾。',
      geographic: '镐京地处关中平原，无险可守，易受游牧民族攻击。',
      cultural: '烽火台本为军事告警之用，周幽王将其用作游戏，丧失了最基本的诚信。'
    },
    impacts: [
      { name: '政治影响', score: 95, description: '西周灭亡，平王东迁洛邑' },
      { name: '社会影响', score: 88, description: '周王室衰微，诸侯崛起' },
      { name: '文化影响', score: 90, description: '"烽火戏诸侯"成为失信亡国的典故' },
      { name: '历史影响', score: 92, description: '中国进入东周（春秋战国）时代' }
    ],
    chain: [
      { title: '宣王中兴', year: '前827年', type: 'cause', color: '#D8B26A' },
      { title: '烽火戏诸侯', year: '前775年', type: 'event', color: '#C34739' },
      { title: '平王东迁', year: '前770年', type: 'consequence', color: '#355C5A' }
    ],
    related_events: ['犬戎攻周', '西周灭亡'],
    person_relations: [
      { source: '周幽王', target: '褒姒', type: 'kinship', desc: '宠幸' },
      { source: '周幽王', target: '虢石父', type: 'lord_vassal', desc: '重用' },
      { source: '周幽王', target: '申后', type: 'hostile', desc: '废弃' }
    ]
  },
  {
    id: 204023,
    name: '制礼作乐',
    dynasty: '夏商西周',
    start_year: -1042,
    end_year: -1035,
    event_type: '文化事件',
    summary: '周公旦在摄政期间制定礼乐制度，包括嫡长子继承制、分封制、宗法制、井田制等，奠定中华礼乐文明根基。',
    significance: '周公制礼作乐是中华文明的奠基事件，其礼乐制度深刻塑造了此后两千年的中国社会。',
    one_sentence: '周公旦制礼作乐，奠定中华礼乐文明的根基，影响中国两千年。',
    location: '镐京',
    related_persons: ['周公旦', '周成王'],
    person_groups: {
      leaders: [{ name: '周公旦', role: '礼乐之祖' }],
      participants: [
        { name: '周成王', role: '继承者' },
        { name: '召公奭', role: '参与者' }
      ],
      opponents: [],
      affected: [
        { name: '诸侯', role: '受约束者' },
        { name: '后世儒家', role: '继承者' }
      ]
    },
    narratives: [
      { year: -1042, title: '周公摄政', description: '周武王去世，周公旦以王叔身份摄政', tag: '背景' },
      { year: -1041, title: '平定叛乱', description: '东征平定三监之乱，稳固周朝统治', tag: '前提' },
      { year: -1038, title: '营建洛邑', description: '营建东都洛邑，建立成周', tag: '建制' },
      { year: -1035, title: '制礼作乐', description: '制定礼乐制度，包括五礼、九典等', tag: '核心' },
      { year: -1035, title: '还政成王', description: '摄政七年后还政于周成王', tag: '归政' }
    ],
    background: {
      political: '周朝新建，需要一套完整的制度来巩固统治。',
      social: '商朝遗民尚存，各方国尚未完全臣服，需要礼乐教化。',
      cultural: '周公总结夏商两代的经验教训，创制新制。'
    },
    impacts: [
      { name: '政治影响', score: 95, description: '确立分封制、宗法制，巩固周朝统治' },
      { name: '社会影响', score: 92, description: '嫡长子继承制影响两千年' },
      { name: '文化影响', score: 98, description: '礼乐文明成为中华文明核心' },
      { name: '历史影响', score: 90, description: '奠定中华礼制基础' }
    ],
    chain: [
      { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
      { title: '制礼作乐', year: '前1035年', type: 'event', color: '#C34739' },
      { title: '成康之治', year: '前1020年', type: 'consequence', color: '#355C5A' }
    ],
    related_events: ['周公摄政', '成康之治', '分封制'],
    person_relations: [
      { source: '周公旦', target: '周成王', type: 'kinship', desc: '叔侄/摄政' },
      { source: '周公旦', target: '召公奭', type: 'alliance', desc: '共治' }
    ]
  }
];

// ========== 丰富现有事件的 person_groups ==========
const PERSON_GROUP_ENRICHMENT = {
  '太康失国': {
    leaders: [{ name: '后羿', role: '夺权者' }],
    participants: [
      { name: '寒浞', role: '后羿部下' },
      { name: '有穷氏', role: '支持部落' }
    ],
    opponents: [{ name: '太康', role: '失国之君' }],
    affected: [
      { name: '少康', role: '夏朝遗孤' },
      { name: '夏王族', role: '被迫流亡' }
    ]
  },
  '少康中兴': {
    leaders: [{ name: '少康', role: '中兴之主' }],
    participants: [
      { name: '有虞氏', role: '支持部落' },
      { name: '有鬲氏', role: '支持部落' },
      { name: '伯靡', role: '将领' }
    ],
    opponents: [
      { name: '寒浞', role: '篡政者' },
      { name: '浇', role: '寒浞之子' }
    ],
    affected: [{ name: '夏王族', role: '恢复统治' }]
  },
  '商汤灭夏': {
    leaders: [{ name: '商汤', role: '开国之君' }],
    participants: [
      { name: '伊尹', role: '军师' },
      { name: '仲虺', role: '辅佐大臣' },
      { name: '葛伯', role: '盟友' }
    ],
    opponents: [
      { name: '夏桀', role: '亡国之君' },
      { name: '韦顾昆吾', role: '夏之属国' }
    ],
    affected: [
      { name: '夏王族', role: '亡国' },
      { name: '商朝贵族', role: '新贵' }
    ]
  },
  '盘庚迁殷': {
    leaders: [{ name: '盘庚', role: '迁都之君' }],
    participants: [
      { name: '商朝贵族', role: '反对者→支持者' },
      { name: '平民', role: '被迁者' }
    ],
    opponents: [
      { name: '旧贵族', role: '反对迁都' }
    ],
    affected: [{ name: '武丁', role: '后继之君' }]
  },
  '武丁中兴': {
    leaders: [{ name: '武丁', role: '盛世之王' }],
    participants: [
      { name: '傅说', role: '名相' },
      { name: '甘盘', role: '贤臣' },
      { name: '妇好', role: '王后/将领' }
    ],
    opponents: [
      { name: '鬼方', role: '征伐对象' },
      { name: '羌方', role: '征伐对象' }
    ],
    affected: [{ name: '商朝百姓', role: '受益者' }]
  },
  '妇好征伐': {
    leaders: [{ name: '妇好', role: '女将' }],
    participants: [
      { name: '武丁', role: '商王/丈夫' },
      { name: '沚𣬐', role: '将领' }
    ],
    opponents: [
      { name: '羌方', role: '征伐对象' },
      { name: '土方', role: '征伐对象' }
    ],
    affected: [{ name: '商朝俘虏', role: '被带回' }]
  },
  '牧野之战': {
    leaders: [{ name: '周武王', role: '伐纣之君' }],
    participants: [
      { name: '姜子牙', role: '军师' },
      { name: '周公旦', role: '辅臣' },
      { name: '召公奭', role: '辅臣' },
      { name: '南宫括', role: '将领' }
    ],
    opponents: [
      { name: '商纣王', role: '亡国之君' },
      { name: '妲己', role: '宠妃' },
      { name: '飞廉', role: '佞臣' }
    ],
    affected: [
      { name: '微子', role: '投降者' },
      { name: '胶鬲', role: '内应' },
      { name: '商朝奴隶', role: '倒戈者' }
    ]
  },
  '周公东征': {
    leaders: [{ name: '周公旦', role: '摄政/东征主帅' }],
    participants: [
      { name: '周成王', role: '年幼天子' },
      { name: '召公奭', role: '辅臣' }
    ],
    opponents: [
      { name: '管叔', role: '叛乱首领' },
      { name: '蔡叔', role: '叛乱者' },
      { name: '霍叔', role: '叛乱者' },
      { name: '武庚', role: '商纣之子' }
    ],
    affected: [{ name: '商朝遗民', role: '被迁至洛邑' }]
  },
  '成康之治': {
    leaders: [
      { name: '周成王', role: '成王' },
      { name: '周康王', role: '康王' }
    ],
    participants: [
      { name: '周公旦', role: '摄政(前期)' },
      { name: '召公奭', role: '太保' },
      { name: '毕公高', role: '太傅' }
    ],
    opponents: [],
    affected: [{ name: '诸侯', role: '受封' }]
  },
  '国人暴动': {
    leaders: [{ name: '周厉王', role: '失政之君' }],
    participants: [
      { name: '荣夷公', role: '专利倡导者' },
      { name: '卫巫', role: '弭谤执行者' }
    ],
    opponents: [
      { name: '召公奭', role: '劝谏者' },
      { name: '周公', role: '共和行政' }
    ],
    affected: [{ name: '周宣王', role: '后继之君' }]
  },
  '宣王中兴': {
    leaders: [{ name: '周宣王', role: '中兴之主' }],
    participants: [
      { name: '仲山甫', role: '贤臣' },
      { name: '尹吉甫', role: '将领' },
      { name: '南仲', role: '将领' },
      { name: '方叔', role: '将领' }
    ],
    opponents: [{ name: '猃狁', role: '征伐对象' }],
    affected: [{ name: '周幽王', role: '后继之君' }]
  },
  '犬戎攻周': {
    leaders: [{ name: '周幽王', role: '亡国之君' }],
    participants: [
      { name: '虢石父', role: '佞臣' },
      { name: '褒姒', role: '宠妃' }
    ],
    opponents: [
      { name: '犬戎', role: '入侵者' },
      { name: '申侯', role: '联合者' }
    ],
    affected: [
      { name: '周平王', role: '东迁之君' },
      { name: '郑桓公', role: '战死' }
    ]
  },
  '西周灭亡': {
    leaders: [{ name: '周幽王', role: '亡国之君' }],
    participants: [
      { name: '虢石父', role: '佞臣' },
      { name: '褒姒', role: '被俘' }
    ],
    opponents: [
      { name: '犬戎', role: '入侵者' },
      { name: '申侯', role: '联合进攻者' }
    ],
    affected: [
      { name: '周平王', role: '东迁之君' },
      { name: '西周贵族', role: '被迫东迁' }
    ]
  }
};

// ========== 丰富 impacts 为对象格式 ==========
const IMPACT_CATEGORIES = ['政治影响', '社会影响', '文化影响', '经济影响', '军事影响', '历史影响'];

function convertImpacts(rawImpacts, eventName) {
  if (!rawImpacts || rawImpacts.length === 0) return [];
  
  // 如果已经是对象格式，直接返回
  if (rawImpacts[0] && typeof rawImpacts[0] === 'object' && rawImpacts[0].name) {
    return rawImpacts;
  }
  
  // 从字符串数组转换为对象数组
  const result = [];
  const shuffledCategories = [...IMPACT_CATEGORIES].sort(() => Math.random() - 0.5);
  
  rawImpacts.forEach((impact, idx) => {
    const cat = shuffledCategories[idx] || IMPACT_CATEGORIES[idx % IMPACT_CATEGORIES.length];
    const score = 65 + Math.floor(Math.random() * 30) + (rawImpacts.length - idx) * 5;
    result.push({
      name: cat,
      score: Math.min(score, 98),
      description: typeof impact === 'string' ? impact : (impact.description || impact.name || '')
    });
  });
  
  return result;
}

// ========== 丰富 person_relations ==========
function enrichPersonRelations(event) {
  const groups = event.person_groups || {};
  const allPersons = new Set();
  
  ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
    const arr = groups[key] || [];
    arr.forEach(p => allPersons.add(p.name));
  });
  
  if (allPersons.size < 2) return event.person_relations || [];
  
  const relations = [];
  const personArr = Array.from(allPersons);
  
  // 领导者与对手之间添加敌对关系
  const leaders = groups.leaders || [];
  const opponents = groups.opponents || [];
  const participants = groups.participants || [];
  
  leaders.forEach(l => {
    opponents.forEach(o => {
      if (l.name !== o.name) {
        relations.push({
          source: l.name,
          target: o.name,
          type: 'hostile',
          desc: `${l.name}与${o.name}为敌对关系`
        });
      }
    });
    
    // 领导者与参与者之间的君臣/联盟关系
    participants.forEach(p => {
      if (l.name !== p.name) {
        relations.push({
          source: l.name,
          target: p.name,
          type: 'lord_vassal',
          desc: `${p.name}辅佐${l.name}`
        });
      }
    });
  });
  
  // 参与者之间可能的联盟关系
  for (let i = 0; i < Math.min(participants.length, 3); i++) {
    for (let j = i + 1; j < Math.min(participants.length, 3); j++) {
      if (participants[i].name !== participants[j].name) {
        relations.push({
          source: participants[i].name,
          target: participants[j].name,
          type: 'alliance',
          desc: `${participants[i].name}与${participants[j].name}为同僚`
        });
      }
    }
  }
  
  // 去重
  const seen = new Set();
  return relations.filter(r => {
    const key = `${r.source}-${r.target}-${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ========== 主流程 ==========
function main() {
  console.log('='.repeat(60));
  console.log('📝 夏商西周事件细节丰富化脚本');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到输入文件: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let events = raw.events || [];
  const persons = raw.persons || [];
  const dynasty = raw.dynasty;
  const keywords = raw.keywords || [];
  
  console.log(`\n📊 当前事件数量: ${events.length}`);
  
  // Step 1: 添加新事件
  console.log('\n[1/4] 添加新事件...');
  const existingIds = new Set(events.map(e => e.id));
  const existingNames = new Set(events.map(e => e.name));
  
  let added = 0;
  for (const newEvent of ADDITIONAL_EVENTS) {
    if (!existingIds.has(newEvent.id) && !existingNames.has(newEvent.name)) {
      events.push(newEvent);
      existingIds.add(newEvent.id);
      existingNames.add(newEvent.name);
      added++;
      console.log(`  ➕ 新增事件: ${newEvent.name} (${newEvent.id})`);
    } else {
      console.log(`  ⏭️ 跳过已存在: ${newEvent.name}`);
    }
  }
  console.log(`  📈 共添加 ${added} 个事件`);
  
  // Step 2: 丰富现有事件的 person_groups
  console.log('\n[2/4] 丰富事件的 person_groups...');
  let enrichedGroups = 0;
  
  events = events.map(event => {
    const enriched = { ...event };
    const groupEnrichment = PERSON_GROUP_ENRICHMENT[event.name];
    
    if (groupEnrichment) {
      // 合并现有 person_groups 与丰富化数据
      const existingGroups = enriched.person_groups || {};
      const newGroups = {};
      
      ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
        const existing = existingGroups[key] || [];
        const enriched_list = groupEnrichment[key] || [];
        
        // 合并，去重
        const merged = [...existing];
        for (const e of enriched_list) {
          if (!merged.find(m => m.name === e.name)) {
            merged.push(e);
          }
        }
        newGroups[key] = merged;
      });
      
      enriched.person_groups = newGroups;
      enrichedGroups++;
      console.log(`  ✅ ${event.name} - 丰富化 person_groups`);
    } else if (!enriched.person_groups) {
      // 确保每个事件都有 person_groups
      enriched.person_groups = {
        leaders: [],
        participants: [],
        opponents: [],
        affected: []
      };
    }
    
    return enriched;
  });
  
  // Step 3: 转换 impacts 格式 + 丰富 person_relations
  console.log('\n[3/4] 转换 impacts 格式 & 丰富 person_relations...');
  let converted = 0;
  
  events = events.map(event => {
    const enriched = { ...event };
    
    // 转换 impacts
    if (enriched.impacts) {
      const originalImpacts = [...enriched.impacts];
      enriched.impacts = convertImpacts(originalImpacts, event.name);
    } else {
      // 生成默认 impacts
      enriched.impacts = [
        { name: '政治影响', score: 75, description: `${event.name}对当时政治格局产生了影响` },
        { name: '社会影响', score: 70, description: `${event.name}对社会层面产生了影响` },
        { name: '历史影响', score: 80, description: `${event.name}在中国历史上具有重要地位` }
      ];
    }
    
    // 丰富 person_relations
    enriched.person_relations = enrichPersonRelations(enriched);
    
    converted++;
    return enriched;
  });
  console.log(`  📈 已处理 ${converted} 个事件`);
  
  // Step 4: 更新 related_persons
  console.log('\n[4/4] 更新事件的 related_persons...');
  
  events = events.map(event => {
    const enriched = { ...event };
    const personNames = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
      const arr = enriched.person_groups?.[key] || [];
      arr.forEach(p => personNames.add(p.name));
    });
    enriched.related_persons = Array.from(personNames);
    return enriched;
  });
  
  // 写入
  const output = {
    dynasty,
    persons,
    events,
    keywords,
    _meta: {
      ...raw._meta,
      enriched_at: new Date().toISOString(),
      enrichment_version: '3.0',
      stats: {
        persons: persons.length,
        events: events.length,
        person_relations: persons.reduce((sum, p) => sum + (p.related_people?.length || 0), 0),
        person_event_relations: persons.reduce((sum, p) => sum + (p.related_events?.length || 0), 0),
        keywords: keywords.length
      }
    }
  };
  
  fs.writeFileSync(INPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 丰富化完成！`);
  console.log(`${'='.repeat(60)}`);
  console.log(`输出: ${INPUT_FILE}`);
  console.log(`事件: ${events.length} 个`);
  
  // 显示每个事件的 person_groups 数量
  console.log('\n📊 事件人物统计:');
  events.forEach(e => {
    const g = e.person_groups || {};
    const total = (g.leaders?.length || 0) + (g.participants?.length || 0) + (g.opponents?.length || 0) + (g.affected?.length || 0);
    const impCount = e.impacts?.length || 0;
    const relCount = e.person_relations?.length || 0;
    console.log(`  ${e.name} - 人物:${total} 影响:${impCount} 关系:${relCount}`);
  });
}

main();