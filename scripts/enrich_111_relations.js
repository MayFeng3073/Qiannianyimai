/**
 * 隋朝(dynasty_111)数据丰富脚本（对齐 enrich_110_relations.js）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   #5 泛化「关联」关系细化
 *   #6 事件经过分阶段叙述（关键事件手写，其余自动切分）
 * 用法: node scripts/enrich_111_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f111 = path.join(DIR, 'dynasty_111.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 隋朝历史脉络宏观时间线（10节点骨干） ---------- */
const SUI_TIMELINE_KEY = '隋朝兴衰';
const SUI_TIMELINE = [
  { title: '隋朝建立', year: '581年', desc: '杨坚代周建隋', event_id: 111301 },
  { title: '平陈统一', year: '589年', desc: '结束南北朝分裂', event_id: 111303 },
  { title: '开皇之治', year: '600年', desc: '革新制度、天下富足', event_id: 111304 },
  { title: '大运河开凿', year: '605年', desc: '贯通南北水运', event_id: 111314 },
  { title: '隋灭吐谷浑', year: '609年', desc: '西拓河源、张掖会盟', event_id: 111315 },
  { title: '第一次征高句丽', year: '612年', desc: '连年用兵、师老无功', event_id: 111317 },
  { title: '杨玄感起兵', year: '613年', desc: '反隋烽烟四起', event_id: 111319 },
  { title: '瓦岗军兴起', year: '617年', desc: '隋末群雄逐鹿', event_id: 111323 },
  { title: '李渊晋阳起兵', year: '617年', desc: '大唐基业之始', event_id: 111329 },
  { title: '江都兵变', year: '618年', desc: '炀帝被杀、隋朝灭亡', event_id: 111333 },
];

/* ---------- #6 事件经过分阶段叙述（关键事件手写，含独立标题/正文） ---------- */
const SUI_EVENT_STAGES = {
  111301: [ // 隋朝建立
    { tag: '起因', title: '北周衰微，相权坐大', description: '北周末主昏暴，杨坚以外戚辅政、总揽朝权，篡周之势已成。' },
    { tag: '经过', title: '受禅代周，建立隋朝', description: '581年杨坚受北周静帝禅让称帝，改元开皇，定都大兴，建立隋朝。' },
    { tag: '结果', title: '锐意革新，开启统一', description: '隋朝建立后推行改革，整顿积弊，为平陈统一积蓄力量。' }
  ],
  111302: [ // 开皇改革
    { tag: '起因', title: '拨乱反正，革除旧弊', description: '文帝即位后欲荡涤北周苛政，重整纲纪、富国安民。' },
    { tag: '经过', title: '定制度、行均田、兴科举', description: '确立三省六部制，颁行均田、租调，废除门阀九品中正。' },
    { tag: '转折', title: '废郡置州、厘正官制', description: '罢黜冗官、废郡置州，简化层级、削减冗员。' },
    { tag: '结果', title: '开皇之治，天下晏然', description: '开皇改革成效显著，户口增殖、仓廪丰实，海内承平。' }
  ],
  111303: [ // 平陈之战
    { tag: '起因', title: '南北对峙，文帝图混一', description: '隋立后陈后主荒淫、上下离心，文帝决意南下平陈。' },
    { tag: '经过', title: '五十一万大军南下', description: '588年隋发五十余万大军、八路并进，横跨长江直下建康。' },
    { tag: '转折', title: '韩擒虎、贺若弼夹击', description: '贺若弼渡江破京口，韩擒虎进据建康，陈军望风溃败。' },
    { tag: '结果', title: '陈亡，天下一统', description: '589年建康陷落、陈叔宝被俘，南北朝对峙终告结束。' }
  ],
  111304: [ // 开皇之治
    { tag: '起因', title: '文帝励精，务行宽简', description: '文帝躬行节俭、宽以待民，锐意造就太平之世。' },
    { tag: '经过', title: '轻徭薄赋、劝课农桑', description: '实行均田租调、减低徭赋，劝民务本、兴修水利。' },
    { tag: '结果', title: '仓廪充实，户口殷阜', description: '开皇年间经济繁荣、仓储盈溢，史称开皇之治。' }
  ],
  111305: [ // 开皇律颁行
    { tag: '起因', title: '革除酷法，务从宽简', description: '文帝命高颎、苏威等删定律令，革除前代酷刑重罚。' },
    { tag: '经过', title: '颁行开皇律', description: '581—583年修成《开皇律》十二篇，取消许多酷刑。' },
    { tag: '结果', title: '以法治国，刑罚清简', description: '开皇律删繁就简、宽严适中，成为唐律渊源之一。' }
  ],
  111310: [ // 大兴城营建
    { tag: '起因', title: '旧都狭小，重建新都', description: '文帝嫌长安旧城规制卑小、水碱咸卤，决意另营新都。' },
    { tag: '经过', title: '宇文恺主持规划设计', description: '582年由宇文恺督工，于龙首原新建大兴城，规模弘丽。' },
    { tag: '结果', title: '一代帝都，规制严谨', description: '大兴城布局严整、坊市并然，为当时世界最大都市。' }
  ],
  111311: [ // 隋击突厥
    { tag: '起因', title: '突厥犯边，文帝忧北患', description: '隋初突厥可汗屡犯北疆，朝议多有主战与和之争。' },
    { tag: '经过', title: '长孙晟离间，兵威并举', description: '长孙晟行离间之策分裂突厥，隋军乘势出击、大挫其锋。' },
    { tag: '结果', title: '突厥请和，北疆晏然', description: '599—601年隋击突厥，突厥内乱请和，北方边境安定。' }
  ],
  111314: [ // 大运河开凿
    { tag: '起因', title: '南北绾辏，国都需运', description: '炀帝为加强南北联系、转输漕粮、巡幸江南而兴大役。' },
    { tag: '经过', title: '开凿通济渠、永济渠等', description: '605—610年先后开凿通济渠、邗沟、永济渠、江南河，贯通南北。' },
    { tag: '转折', title: '役夫百万，民力大耗', description: '征发民夫数百万，劳役繁重，怨声载道、民生凋敝。' },
    { tag: '结果', title: '南北水路一以贯之', description: '大运河连接五大水系，促进了南北经济文化交流，影响深远。' }
  ],
  111315: [ // 隋灭吐谷浑
    { tag: '起因', title: '炀帝西巡，志拓疆土', description: '炀帝经略西域，决意翦灭盘踞青海的吐谷浑以通商路。' },
    { tag: '经过', title: '发兵四道，大破浑国', description: '609年隋军分道西击，覆通吐谷浑，收其故地为四郡。' },
    { tag: '结果', title: '张掖会盟，丝路重开', description: '隋陈兵河西、召集西域诸国于张掖会盟，商路由此大开。' }
  ],
  111317: [ // 第一次征高句丽
    { tag: '起因', title: '炀帝求功，志在辽东', description: '炀帝欲建功四夷，举倾国之兵亲征高句丽。' },
    { tag: '经过', title: '百万大军，水陆并进', description: '612年发一百余万军队，陆海并进、直扑辽东。' },
    { tag: '转折', title: '萨水一败，全军溃退', description: '隋军渡鸭绿江，在萨水遭高句丽伏击、大败而还。' },
    { tag: '结果', title: '死者山积，国本动摇', description: '首次征辽损兵数十万，隋朝国力民心大受重创。' }
  ],
  111319: [ // 杨玄感起兵
    { tag: '起因', title: '征辽疲弊，怨声载道', description: '二伐高句丽的号令在全国激起广泛不满。' },
    { tag: '经过', title: '黎阳起兵，直趋洛阳', description: '613年杨玄感于黎阳起兵，率众围攻东都洛阳，响者云集。' },
    { tag: '转折', title: '炀帝回师，腹背受敌', description: '炀帝急撤辽东之兵回援，杨玄感腹背受敌、退兵败亡。' },
    { tag: '结果', title: '关陇离心，反隋蜂起', description: '杨玄感之乱暴露关陇集团离析，天下反隋起义随之迸发。' }
  ],
  111323: [ // 瓦岗军兴起
    { tag: '起因', title: '官兵叛隋，投奔瓦岗', description: '隋末逃役、徭苛，聚众瓦岗结寨造反，初以翟让为首。' },
    { tag: '经过', title: '李密入主，号令群雄', description: '李密投瓦岗、定袭仓之策，攻取兴洛仓、开仓放粮。' },
    { tag: '结果', title: '踞有中原，雄踞东都', description: '瓦岗军发展为中原最大反隋力量，与王世充数次大战。' }
  ],
  111329: [ // 李渊晋阳起兵
    { tag: '起因', title: '天下大乱，太原举事', description: '隋末群雄并起，李渊据太原、谋应天命。' },
    { tag: '经过', title: '晋阳起兵，西取长安', description: '617年李渊于晋阳起兵，秋七月誓师，长驱西进攻占长安。' },
    { tag: '结果', title: '立隋恭帝，肇建大唐', description: '李渊立代王杨侑为帝、自为大丞相，为建立唐朝奠定根基。' }
  ],
  111333: [ // 江都兵变
    { tag: '起因', title: '炀帝困守江都，众叛亲离', description: '炀帝滞留江都不归，天下义兵环起，从驾骁果思乡叛离。' },
    { tag: '经过', title: '宇文化及煽乱，弑杀炀帝', description: '618年宇文化及与司马德戡等发难，缢杀隋炀帝于江都。' },
    { tag: '结果', title: '隋朝灭亡，天下更主', description: '江都兵变标志隋朝灭亡，历史由此转入隋末唐初群雄逐鹿。' }
  ],
  111334: [ // 隋朝灭亡
    { tag: '起因', title: '三征高丽，天下大乱', description: '连年征辽、大兴土木，民不聊生，天下起义遍地。' },
    { tag: '经过', title: '群雄并起，隋室失据', description: '李密、窦建德、王世充等并起割据，隋政权分崩离析。' },
    { tag: '结果', title: '江都变起，隋祚终焉', description: '618年炀帝被杀，杨侑禅位李渊，隋朝至是灭亡。' }
  ],
};

/* ---------- #5 泛化「关联」标签细化：按有序名字对覆盖为具体关系 ---------- */
const REL_FIX_111 = {
  // —— 隋宗室世系 ——
  '杨坚|杨勇': '父子', '杨坚|杨广': '父子', '杨坚|杨谅': '父子', '杨坚|杨秀': '父子', '杨坚|杨俊': '父子',
  '杨坚|杨爽': '兄弟', '杨坚|杨雄': '堂兄弟', '杨坚|杨林': '宗族',
  '杨广|杨暕': '父子', '杨广|杨昭': '父子',
  '杨勇|杨广': '兄弟', '杨勇|杨谅': '兄弟', '杨勇|杨秀': '兄弟', '杨勇|杨俊': '兄弟',
  '杨广|杨谅': '兄弟', '杨广|杨秀': '兄弟', '杨广|杨俊': '兄弟', '杨谅|杨秀': '兄弟',
  '杨坚|独孤伽罗': '夫妻',
  '独孤伽罗|杨勇': '母子', '独孤伽罗|杨广': '母子', '独孤伽罗|杨谅': '母子', '独孤伽罗|杨秀': '母子',
  // —— 关陇集团君臣 ——
  '杨坚|高颎': '君臣', '杨坚|苏威': '君臣', '杨坚|杨素': '君臣', '杨坚|牛弘': '君臣',
  '杨坚|李德林': '君臣', '杨坚|贺若弼': '君臣', '杨坚|韩擒虎': '君臣', '杨坚|长孙晟': '君臣',
  '杨坚|赵绰': '君臣', '杨坚|窦荣定': '君臣', '杨坚|元胄': '君臣', '杨坚|柳述': '君臣',
  '杨广|裴矩': '君臣', '杨广|虞世基': '君臣', '杨广|宇文述': '君臣', '杨广|来护儿': '君臣',
  '杨广|张衡': '君臣', '杨广|裴蕴': '君臣', '杨广|裴世矩': '君臣', '杨广|宇文化及': '君臣',
  // —— 同僚名将 ——
  '高颎|苏威': '同僚', '高颎|贺若弼': '同僚', '贺若弼|韩擒虎': '同僚', '韩擒虎|史万岁': '同僚',
  '高颎|杨素': '同僚', '杨素|宇文述': '同僚', '来护儿|周法尚': '同僚', '张须陀|裴仁基': '同僚',
  '杨素|杨约': '兄弟', '杨素|杨玄感': '父子', '苏威|苏孝慈': '同族',
  // —— 隋末群雄对立 ——
  '杨玄感|杨广': '敌对', '李密|王世充': '敌对', '李密|杨广': '敌对', '窦建德|王世充': '敌对',
  '王世充|李密': '敌对', '薛举|李密': '敌对', '刘武周|李密': '敌对',
  '李渊|窦建德': '敌对', '李渊|王世充': '敌对', '李渊|薛举': '敌对', '李渊|刘武周': '敌对',
  '萧铣|李密': '敌对', '萧铣|王世充': '敌对', '杜伏威|辅公祏': '盟友',
  // —— 残留「关联」逐对细化（隋宗室/关陇/群雄） ——
  '独孤伽罗|柳述': '姻亲', '柳述|独孤伽罗': '姻亲', '杨勇|杨昭': '叔侄',
  '长孙晟|长孙览': '同族', '长孙览|长孙晟': '同族', '宇文恺|宇文述': '同族', '杨玄感|杨约': '叔侄',
  '宇文述|宇文化及': '父子', '宇文述|宇文智及': '父子', '宇文化及|宇文智及': '兄弟',
  '智顗|牛弘': '同朝', '智顗|杨坚': '君臣', '智顗|高颎': '同朝', '智顗|杨素': '同朝',
  '辅公祏|杨广': '敌对', '薛举|杨坚': '敌对', '薛举|独孤伽罗': '敌对', '薛举|高颎': '敌对',
  '薛举|杨素': '敌对', '薛举|苏威': '敌对', '薛举|薛仁杲': '父子',
  '刘武周|杨义臣': '敌对', '杨林|杨爽': '同族', '杨俊|独孤伽罗': '母子', '杨俊|杨爽': '兄弟',
  '杨爽|杨广': '叔侄', '杨暕|杨昭': '兄弟', '杨昭|杨勇': '叔侄', '杨昭|杨暕': '兄弟',
  '杨昭|杨侑': '父子', '杨昭|杨浩': '同族', '杨侑|杨广': '祖孙', '杨侑|杨浩': '同族',
  '杨浩|杨广': '同族', '杨浩|杨昭': '同族', '杨浩|杨侑': '同族', '杨侗|杨广': '祖孙',
  '杨达|杨坚': '君臣', '杨达|杨广': '君臣', '杨达|独孤伽罗': '同朝', '杨达|杨约': '同族',
  '杨约|杨达': '同族', '杨约|杨玄感': '叔侄', '杨侗|杨暕': '兄弟',
  '裴世矩|裴矩': '同族', '窦荣定|独孤伽罗': '姻亲', '裴蕴|裴矩': '同族',
  '裴寂|裴矩': '同族', '萧铣|萧皇后': '同族', '杨爽|杨林': '同族', '杨约|杨雄': '同族',
  // —— 新增30人引入的 BFS 泛化「关联」细化 ——
  '杨昭|萧皇后': '母子', '杨暕|萧皇后': '母子', '辅公祏|萧皇后': '同朝', '辅公祏|李子通': '敌对', '裴仁基|裴行俨': '父子'
};
// 无真实关系、由 BFS 自动补链产生的错误「关联」，直接移除
const REMOVE_REL_111 = new Set([]);

// 一级人物 related_people 不足 4 时的保底补入（引用本朝真实人物）
const L1_TOPUP_111 = {
  '辅公祏': [['杜伏威', '盟友'], ['李密', '敌对'], ['窦建德', '敌对'], ['王世充', '敌对']]
};

/* ---------- 归一化关系标签 ---------- */
function cleanRel(s) {
  return String(s || '关系').split('·')[0].trim() || '关系';
}
const REL_SET = {
  '关系': 0, '关联': 0, '因缘': 0, '参与': 0,
  '敌对': 1, '对手': 1, '政敌': 1,
  '君臣': 2, '父子': 3, '母子': 3, '兄弟': 3, '夫妻': 3, '亲属': 3, '宗族': 3,
  '盟友': 4, '同盟': 4, '同僚': 5, '同袍': 5, '同朝': 5,
  '师生': 6, '师徒': 6, '影响': 7, '继承': 8, '交流': 9, '支持': 10
};
const REL_PRIORITY = {
  '君臣': 6, '父子': 6, '兄弟': 6, '夫妻': 6, '亲属': 6, '盟友': 5, '同盟': 5,
  '敌对': 5, '对手': 5, '政敌': 5, '师生': 4, '师徒': 4, '同僚': 3, '同袍': 3, '同朝': 3,
  '影响': 2, '继承': 2, '交流': 1, '支持': 1, '关联': 0, '关系': 0, '因缘': 0
};
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

/* ---------- #3 补充 二级 narrative_relations（因缘际会） ---------- */
/* 说明：persons/events 引用的名字与事件均须为本数据集真实存在（sanitizeCurated 会过滤） */
const CURATED_111 = {
  // —— 隋宗室 ——
  '杨林': { persons: [['杨坚', '宗族'], ['杨广', '君臣']], events: ['隋朝建立'] },
  '杨谅': { persons: [['杨坚', '父子'], ['杨广', '兄弟']], events: ['杨广即位'] },
  '杨秀': { persons: [['杨坚', '父子'], ['杨广', '兄弟']], events: ['杨广即位'] },
  '杨俊': { persons: [['杨坚', '父子'], ['杨广', '兄弟']], events: ['隋朝建立'] },
  '杨爽': { persons: [['杨坚', '兄弟'], ['杨广', '叔侄']], events: ['隋击突厥'] },
  '杨暕': { persons: [['杨广', '父子'], ['杨坚', '祖孙']], events: ['大运河开凿'] },
  '杨昭': { persons: [['杨广', '父子'], ['杨坚', '祖孙'], ['独孤伽罗', '祖母']], events: ['大运河开凿'] },
  '杨侑': { persons: [['杨坚', '曾孙'], ['杨广', '祖孙']], events: ['江都兵变'] },
  '杨浩': { persons: [['杨坚', '孙'], ['宇文化及', '君臣']], events: ['江都兵变'] },
  '杨侗': { persons: [['杨坚', '孙'], ['王世充', '君臣']], events: ['王世充据洛阳'] },
  '杨达': { persons: [['杨坚', '君臣'], ['杨素', '同僚'], ['高颎', '同僚']], events: ['开皇改革'] },
  '杨约': { persons: [['杨素', '兄弟'], ['杨广', '君臣']], events: ['杨玄感起兵'] },
  '杨雄': { persons: [['杨坚', '堂兄弟'], ['杨广', '君臣']], events: ['隋朝建立'] },
  // —— 隋廷文臣 ——
  '柳述': { persons: [['杨坚', '君臣'], ['杨广', '政敌']], events: ['开皇改革'] },
  '赵绰': { persons: [['杨坚', '君臣'], ['苏威', '同僚']], events: ['开皇律颁行'] },
  '张衡': { persons: [['杨广', '君臣'], ['宇文恺', '同僚']], events: ['大兴城营建'] },
  '李德林': { persons: [['杨坚', '君臣'], ['牛弘', '同僚']], events: ['开皇改革'] },
  '李圆通': { persons: [['杨坚', '君臣'], ['高颎', '同僚']], events: ['隋朝建立'] },
  '苏孝慈': { persons: [['苏威', '同族'], ['杨坚', '君臣']], events: ['开皇改革'] },
  '柳彧': { persons: [['杨坚', '君臣'], ['苏威', '同朝']], events: ['开皇之治'] },
  '裴世矩': { persons: [['裴矩', '同族'], ['杨广', '君臣']], events: ['张掖会盟'] },
  '裴蕴': { persons: [['裴矩', '同族'], ['杨广', '君臣']], events: ['大运河开凿'] },
  '卫玄': { persons: [['杨广', '君臣'], ['薛世雄', '同僚']], events: ['杨玄感起兵'] },
  // —— 隋朝军将 ——
  '窦荣定': { persons: [['杨坚', '姻亲'], ['高颎', '同僚']], events: ['隋击突厥'] },
  '达奚长儒': { persons: [['杨坚', '君臣'], ['史万岁', '同僚']], events: ['隋击突厥'] },
  '梁睿': { persons: [['杨坚', '君臣'], ['贺若弼', '同僚']], events: ['隋朝建立'] },
  '长孙览': { persons: [['长孙晟', '叔侄'], ['杨坚', '君臣']], events: ['隋击突厥'] },
  '元景山': { persons: [['杨坚', '君臣'], ['史万岁', '同僚']], events: ['隋击突厥'] },
  '元胄': { persons: [['杨坚', '君臣'], ['高颎', '同僚']], events: ['隋朝建立'] },
  '杨义臣': { persons: [['杨广', '君臣'], ['张须陀', '同僚']], events: ['山东大起义'] },
  '周法尚': { persons: [['杨广', '君臣'], ['来护儿', '同僚']], events: ['平陈之战'] },
  '薛世雄': { persons: [['杨广', '君臣'], ['宇文述', '同僚']], events: ['第一次征高句丽'] },
  '麦铁杖': { persons: [['杨广', '君臣'], ['来护儿', '同僚']], events: ['第一次征高句丽'] },
  '陈棱': { persons: [['杨广', '君臣'], ['来护儿', '同僚']], events: ['隋灭吐谷浑'] },
  '裴仁基': { persons: [['杨广', '君臣'], ['张须陀', '同僚']], events: ['瓦岗军兴起'] },
  '樊子盖': { persons: [['杨广', '君臣'], ['薛世雄', '同僚']], events: ['瓦岗军兴起'] },
  // —— 隋末人物 ——
  '宇文化及': { persons: [['宇文述', '父子'], ['杨广', '君臣']], events: ['江都兵变'] },
  '宇文智及': { persons: [['宇文述', '父子'], ['宇文化及', '兄弟']], events: ['江都兵变'] },
  '刘黑闼': { persons: [['窦建德', '部属'], ['刘武周', '部属']], events: ['窦建德起兵'] },
  '刘文静': { persons: [['裴寂', '同僚'], ['李密', '敌对']], events: ['李渊晋阳起兵'] },
  '裴寂': { persons: [['刘文静', '同僚'], ['王世充', '敌对']], events: ['李渊晋阳起兵'] },
  // —— 新增隋末割据/军将（补齐因缘际会） ——
  '裴行俨': { persons: [['裴仁基', '父子'], ['宇文化及', '敌对'], ['翟让', '同僚']], events: ['瓦岗军兴起'] },
  '罗士信': { persons: [['张须陀', '部属'], ['裴仁基', '同僚'], ['宇文述', '敌对']], events: ['山东大起义'] },
  '李子通': { persons: [['杜伏威', '敌对'], ['沈法兴', '敌对'], ['萧铣', '敌对']], events: ['隋朝灭亡'] },
  '林士弘': { persons: [['萧铣', '敌对'], ['沈法兴', '敌对'], ['杜伏威', '敌对']], events: ['隋朝灭亡'] },
  '朱粲': { persons: [['王世充', '敌对'], ['窦建德', '敌对'], ['萧铣', '敌对']], events: ['隋朝灭亡'] },
  '孟海公': { persons: [['窦建德', '敌对'], ['王世充', '敌对'], ['翟让', '同谋']], events: ['山东大起义'] },
  '徐圆朗': { persons: [['窦建德', '部属'], ['王世充', '敌对'], ['刘武周', '同盟']], events: ['山东大起义'] },
  '郭子和': { persons: [['刘武周', '敌对'], ['梁师都', '敌对'], ['李轨', '同盟']], events: ['隋朝灭亡'] },
  '刘元进': { persons: [['杜伏威', '同盟'], ['沈法兴', '同盟'], ['林士弘', '敌对']], events: ['山东大起义'] },
  '魏刀儿': { persons: [['窦建德', '敌对'], ['刘武周', '同盟'], ['薛举', '同盟']], events: ['山东大起义'] },
  // —— 新增佛学/思想人物 ——
  '灌顶': { persons: [['智威', '师徒'], ['僧璨', '同门'], ['王通', '同朝']], events: ['开皇之治'] },
  '僧璨': { persons: [['灌顶', '同门'], ['智威', '同门'], ['王通', '同朝']], events: ['开皇之治'] },
  '智威': { persons: [['灌顶', '师徒'], ['僧璨', '同门'], ['王通', '同朝']], events: ['开皇之治'] },
  // —— 新增隋代文士 ——
  '薛道衡': { persons: [['杨广', '君臣'], ['牛弘', '同僚'], ['卢思道', '同僚']], events: ['开皇之治', '大运河开凿'] },
  '卢思道': { persons: [['薛道衡', '同僚'], ['杨广', '君臣'], ['王胄', '同僚']], events: ['开皇之治'] },
  '王胄': { persons: [['薛道衡', '同僚'], ['卢思道', '同僚'], ['杨广', '君臣']], events: ['开皇之治'] },
  '明克让': { persons: [['李德林', '同僚'], ['牛弘', '同僚'], ['薛道衡', '同僚']], events: ['开皇之治'] },
};

function sanitizeCurated(raw, CURATED) {
  const personNames = new Set(raw.persons.map(p => p.name));
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => personNames.has(nm));
    const events = (spec.events || []).filter(nm => eventNames.has(nm));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

function main() {
  const d = load(f111);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[SUI_TIMELINE_KEY] = SUI_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = SUI_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', SUI_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化（分阶段叙述） =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = SUI_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      ev.narratives = (ev.summary ? ev.summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).map(s => ({ year: ev.start_year, tag: '经过', title: '', description: s })).slice(0, 6) : []);
    }
  });
  console.log('  已应用分阶段叙述的事件数:', stageOk, '/', events.length);

  const EV_PERSONS_BACKFILL = {};
  let backfillCount = 0;
  events.forEach(ev => {
    const fill = EV_PERSONS_BACKFILL[ev.id];
    if (!fill || !ev.person_groups) return;
    ['leaders', 'participants', 'opponents', 'affected'].forEach(k => {
      (fill[k] || []).forEach(x => {
        if (!ev.person_groups[k].some(y => y.name === x.name)) ev.person_groups[k].push({ name: x.name, role: x.role });
      });
    });
    backfillCount++;
  });
  if (backfillCount) console.log('  关键人物补全事件数:', backfillCount);

  // 事件参与人索引
  const personEvents = new Map();
  const evPersonSet = new Map();
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    evPersonSet.set(ev.id, names);
    names.forEach(n => { if (n && nameSet.has(n)) { if (!personEvents.has(n)) personEvents.set(n, new Set()); personEvents.get(n).add(ev.id); } });
  });

  // 关系线索 & 邻接表
  const adjAll = new Map();
  const linkA = (a, b, rel) => {
    if (!nameSet.has(a) || !nameSet.has(b) || a === b) return;
    if (!adjAll.has(a)) adjAll.set(a, new Map());
    if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel);
  };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  const mentionedInStory = (text) => {
    if (!text) return [];
    return personNamesArr.filter(n => n && text.includes(n));
  };
  persons.forEach(pp => mentionedInStory(pp.story?.content).forEach(m => { if (nameSet.has(m)) linkA(pp.name, m, '因缘'); }));
  const degA = (nm) => (adjAll.get(nm) || new Map()).size;

  const evByName = new Map();
  events.forEach(ev => {
    const ppl = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
      (ev.person_groups?.[k] || []).forEach(x => { if (nameSet.has(x.name)) ppl.add(x.name); }));
    ppl.forEach(n => { if (!evByName.has(n)) evByName.set(n, new Set()); evByName.get(n).add(ev.name); });
  });
  const evRoleByName = new Map();
  events.forEach(ev => {
    const roleOf = (arr, label) => (arr || []).forEach(x => { if (!x.name) return; if (!evRoleByName.has(x.name)) evRoleByName.set(x.name, new Map()); evRoleByName.get(x.name).set(ev.name, label); });
    roleOf(ev.person_groups?.leaders, '主导');
    roleOf(ev.person_groups?.participants, '参与');
    roleOf(ev.person_groups?.opponents, '对抗');
    roleOf(ev.person_groups?.affected, '受影响');
  });

  function relatedEventNames(ev) {
    const mine = evPersonSet.get(ev.id) || new Set();
    const scored = [];
    events.forEach(o => {
      if (o.id === ev.id) return;
      let share = 0; (evPersonSet.get(o.id) || []).forEach(n => { if (mine.has(n)) share++; });
      if (share > 0) scored.push({ id: o.id, name: o.name, share });
    });
    scored.sort((a, b) => b.share - a.share);
    return scored.slice(0, 6).map(s => s.name);
  }

  console.log('\n===== #2 推荐人物 / 推荐事件 =====');
  let rp=0, re=0;
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    ev.related_persons = [...names].filter(n => nameSet.has(n)).slice(0, 12);
    ev.related_events = relatedEventNames(ev).filter(n => n !== ev.name).slice(0, 6);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 一级人物 related_people 扩充 =====');
  let l1ok=0;
  persons.filter(p => (p.level || 1) === 1).forEach(p => {
    const merged = new Map();
    (p.related_people || []).forEach(rp2 => { if (rp2 && rp2.name) merged.set(rp2.name, { type: rp2.relation || '关系', count: (merged.get(rp2.name)?.count || 0) + 1 }); });
    events.forEach(ev => (ev.person_relations || []).forEach(r => {
      const other = r.source === p.name ? r.target : (r.target === p.name ? r.source : null);
      if (other && nameSet.has(other)) { const cur = merged.get(other); merged.set(other, { type: r.type || (cur?.type || '关系'), count: (cur?.count || 0) + 1 }); }
    }));
    events.forEach(ev => {
      const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
      const inGroups = groups.some(g => g.some(x => x.name === p.name));
      if (!inGroups) return;
      groups.forEach((g, gi) => {
        g.forEach(x => { if (x.name && x.name !== p.name && nameSet.has(x.name)) { const rel = gi === 2 ? '敌对' : '同盟'; const cur = merged.get(x.name); if (!cur || cur.count === 0) merged.set(x.name, { type: rel, count: (cur?.count || 0) + 1 }); } });
      });
    });
    const list = [...merged.entries()].map(([nm, info]) => ({
      name: nm, relation: cleanRel(info.type), influence: Math.min(95, 55 + info.count * 8),
    })).sort((a, b) => b.influence - a.influence);
    if (list.length < 6) {
      const have = new Set(list.map(x => x.name));
      const direct = [], indirect = [], visited = new Set([p.name]), q = [[p.name, 0]];
      while (q.length) {
        const [cur, dep] = q.shift();
        if (dep >= 2 || direct.length >= 8) break;
        for (const [nb, rel] of (adjAll.get(cur) || new Map())) {
          if (visited.has(nb)) continue;
          visited.add(nb);
          if (dep === 0) direct.push([nb, rel]); else indirect.push([nb, rel]);
          q.push([nb, dep + 1]);
          if (direct.length >= 8) break;
        }
      }
      direct.sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '关系', influence: 60 }); } });
      indirect.sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    // 一级保底补入：关系不足 4 时并入真实人物，避免人物网络过疏
    const topup = L1_TOPUP_111[p.name] || [];
    const have111 = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!have111.has(nm) && list.length < 6) { have111.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级 narrative_relations（因缘际会）
  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_111);
  const buildL2Graph = (p) => {
    const center = p.name;
    const N = new Map(), E = new Map();
    const addN = (name, type, size) => { if (!N.has(name)) N.set(name, { name, type, size: size || (type === 'person' ? (name === center ? 'large' : 'medium') : 'small') }); };
    const addE = (s, t, label) => { const k = [s, t].sort().join('|'); if (s !== t && !E.has(k)) E.set(k, { source: s, target: t, label, direction: 'forward' }); };
    addN(center, 'person', 'large');
    const cand = new Map();
    for (const [nb, rel] of (adjAll.get(center) || new Map())) {
      const r = cleanRel(rel);
      if (REL_REAL.has(r)) cand.set(nb, r);
    }
    [...cand.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel], i) => {
      addN(nm, 'person', i < 4 ? 'medium' : 'small');
      addE(center, nm, rel);
    });
    const evRoles = evRoleByName.get(center) || new Map();
    for (const [en, rel] of evRoles) { if (N.size >= 7) break; addN(en, 'event', 'small'); addE(center, en, rel); }
    const personNodes = [...N.keys()].filter(nm => nm !== center && N.get(nm).type === 'person');
    const pairs = [];
    for (let i = 0; i < personNodes.length; i++)
      for (let j = i + 1; j < personNodes.length; j++) {
        const rel = adjAll.get(personNodes[i])?.get(personNodes[j]);
        if (rel && REL_REAL.has(cleanRel(rel))) pairs.push({ a: personNodes[i], b: personNodes[j], rel: cleanRel(rel) });
      }
    pairs.sort((x, y) => (REL_PRIORITY[y.rel] ?? 0) - (REL_PRIORITY[x.rel] ?? 0));
    pairs.slice(0, 2).forEach(({ a, b, rel }) => addE(a, b, rel));
    if (personNodes.length < 3 && N.size < 6) {
      const evNamesForCenter = evByName.get(center) || new Set();
      events.forEach(ev => {
        if (!evNamesForCenter.has(ev.name) || N.size >= 7) return;
        const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
        groups.forEach((g, gi) => {
          if (N.size >= 7) return;
          g.forEach(x => {
            if (!x.name || x.name === center || !nameSet.has(x.name) || N.has(x.name)) return;
            const known = adjAll.get(center)?.get(x.name);
            const rel = known && REL_REAL.has(cleanRel(known)) ? cleanRel(known) : (gi === 2 ? '敌对' : '同朝');
            addN(x.name, 'person', 'medium');
            addE(center, x.name, rel);
          });
        });
      });
    }
    if (N.size < 5 && curated[p.name]) {
      const c = curated[p.name];
      const have = new Set(N.keys());
      c.persons.forEach(([nm, rel]) => { if (!have.has(nm) && N.size < 6) { addN(nm, 'person', 'medium'); addE(center, nm, cleanRel(rel) || '关系'); } });
      c.events.forEach(en => { if (!have.has(en) && N.size < 6) { addN(en, 'event', 'small'); addE(center, en, '参与'); } });
    }
    return { nodes: [...N.values()], edges: [...E.values()] };
  };
  let l2ok=0, l2low=[];
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    let g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
    else l2low.push(p.name + '(' + g.nodes.length + ')');
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p=>p.level===2).length);
  if (l2low.length) console.log('  需人工补充的二级人物:', l2low.join(','));

  console.log('\n===== #5 泛化「关联」关系细化 =====');
  let fixed = 0, removed = 0;
  const fix = (a, b, cur) => {
    if (!cur || cur !== '关联') return cur;
    return REL_FIX_111[a + '|' + b] || REL_FIX_111[b + '|' + a] || cur;
  };
  persons.forEach(p => (p.related_people || []).forEach(r => {
    if (REMOVE_REL_111.has(p.name + '|' + r.name) || REMOVE_REL_111.has(r.name + '|' + p.name)) { r._remove = true; removed++; return; }
    const nv = fix(p.name, r.name, r.relation);
    if (nv !== r.relation) { r.relation = nv; fixed++; }
  }));
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  events.forEach(ev => (ev.person_relations || []).forEach(r => {
    if (REMOVE_REL_111.has(r.source + '|' + r.target) || REMOVE_REL_111.has(r.target + '|' + r.source)) { r._remove = true; removed++; return; }
    const nv = fix(r.source, r.target, r.type);
    if (nv !== r.type) { r.type = nv; fixed++; }
  }));
  events.forEach(ev => { if (ev.person_relations) ev.person_relations = ev.person_relations.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  console.log('  已细化的关联关系数:', fixed, '；已移除的错误关联:', removed);

  save(f111, d);
  console.log('\n完成。');
}
module.exports = {};
main();