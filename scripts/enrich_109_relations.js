/**
 * 三国(dynasty_109)数据丰富脚本（对齐 enrich_107_relations.js 汉流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   #5 泛化「关联」关系细化
 *   #6 事件经过分阶段叙述（关键事件手写，其余自动切分）
 * 用法: node scripts/enrich_109_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f109 = path.join(DIR, 'dynasty_109.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 三国历史脉络宏观时间线（9节点骨干） ---------- */
const SANGUO_TIMELINE_KEY = '三国鼎立兴衰';
const SANGUO_TIMELINE = [
  { title: '曹丕代汉', year: '220年', desc: '东汉终结，三国始', event_id: 109322 },
  { title: '刘备称帝', year: '221年', desc: '蜀汉建立', event_id: 109324 },
  { title: '夷陵之战', year: '222年', desc: '孙刘决裂', event_id: 109301 },
  { title: '孙权称帝', year: '229年', desc: '鼎足之势成', event_id: 109326 },
  { title: '诸葛亮北伐', year: '228—234年', desc: '六出祁山', event_id: 109305 },
  { title: '高平陵之变', year: '249年', desc: '司马篡权', event_id: 109327 },
  { title: '淮南三叛', year: '255年', desc: '曹氏最后的抗争', event_id: 109330 },
  { title: '魏灭蜀之战', year: '263年', desc: '蜀汉灭亡', event_id: 109316 },
  { title: '司马炎代魏', year: '266年', desc: '西晋建立', event_id: 109334 },
  { title: '晋灭吴之战', year: '279—280年', desc: '三国终结', event_id: 109319 },
];

/* ---------- #6 事件经过分阶段叙述（关键事件手写，含独立标题/正文） ---------- */
const SANGUO_EVENT_STAGES = {
  109301: [
    { tag: '起因', title: '荆州之失，刘备寻仇', description: '关羽北伐襄樊兵败被杀，荆州落入东吴之手。刘备为报弟仇并夺回荆州，于222年亲率大军东征孙吴。' },
    { tag: '经过', title: '深入吴境，连营七百里', description: '蜀军连战连胜，深入吴境五六百里，屯兵于山林之间、连营数百里，声势虽盛而兵骄将惰。' },
    { tag: '转折', title: '陆逊避锐，火攻破之', description: '吴大都督陆逊坚守不战、避其锋芒，待蜀军锐气耗尽，抓住时机火攻蜀营，陆逊以火烧连营大破蜀军。' },
    { tag: '结果', title: '彝陵大败，白帝托孤', description: '刘备战败退守白帝城，不久病逝。夷陵之战使孙刘联盟彻底破裂，蜀汉元气大伤，三国鼎立格局最终奠定。' }
  ],
  109305: [
    { tag: '起因', title: '受托孤辅政，志在恢复', description: '刘备托孤后，诸葛亮辅佐刘禅，为完成兴复汉室之志，多次举兵北伐曹魏。' },
    { tag: '经过', title: '六出祁山，屡战屡退', description: '诸葛亮先后五次北伐，几次出祁山争夺陇右，虽有斩获，却受限于粮运与地形难以取得决定性突破。' },
    { tag: '结果', title: '星落五丈原，遗志未竟', description: '234年第五次北伐时，诸葛亮积劳成疾，病逝于五丈原军中，北伐大业终因后继乏力而中止。' }
  ],
  109316: [
    { tag: '起因', title: '司马昭定策，大举伐蜀', description: '司马昭总揽魏国大权后，为统一天下而决意灭蜀，于263年发兵分路进攻蜀汉。' },
    { tag: '经过', title: '钟会取关中，邓艾出阴平', description: '钟会主力取道汉中进军，邓艾则率偏师从阴平偷渡险道，直插蜀汉腹地绵竹、成都一带。' },
    { tag: '转折', title: '诸葛瞻战死，谯周劝降', description: '诸葛瞻率军拒守绵竹力战阵亡，成都守备空虚，后主刘禅纳谯周之言出降，蜀汉灭亡。' },
    { tag: '结果', title: '蜀汉覆亡，三国归晋', description: '魏灭蜀之战结束蜀汉政权，三国鼎立只剩魏吴对峙，为西晋统一天下铺平道路。' }
  ],
  109327: [
    { tag: '起因', title: '明帝托孤，曹爽专权', description: '曹叡病逝后遗诏辅政，曹爽与司马懿同受顾命，曹爽日渐专权、排挤司马懿于朝堂之外。' },
    { tag: '经过', title: '司马装病，伺机夺权', description: '司马懿称病韬光养晦，麻痹曹爽，暗中布置应变之策，等待时机。' },
    { tag: '转折', title: '高平陵变，政变成功', description: '249年曹爽随魏帝曹芳出城祭扫高平陵，司马懿趁空发动政变控制洛阳，逼迫曹爽交出兵权。' },
    { tag: '结果', title: '曹爽伏诛，司马擅政', description: '曹爽及其党羽被诛，司马懿掌控曹魏军政大权，自此司马氏逐渐取代曹氏，成为魏国的真正统治者。' }
  ],
  109332: [
    { tag: '起因', title: '帝不甘臣，谋除权相', description: '魏帝曹髦见司马昭专权跋扈、代魏之势已成，不甘坐以待毙，决意谋除司马昭。' },
    { tag: '经过', title: '率众讨贼，身死道消', description: '260年曹髦亲率宫中卫士数百人攻司马昭府，途中遭贾充指使的成济弑杀于南阙之下。' },
    { tag: '结果', title: '魏室名存，禅位旧事', description: '曹髦被弑后司马昭立曹奂为帝，魏室实权尽失、形同虚设，为司马炎代魏立晋最终扫除障碍。' }
  ],
  109334: [
    { tag: '起因', title: '三马食曹，权柄尽归', description: '司马懿、司马师、司马昭父子相继把持朝政，魏帝形同傀儡，代魏大势已不可逆转。' },
    { tag: '经过', title: '司马炎受禅，建晋代魏', description: '266年司马昭之子司马炎接受魏元帝曹奂禅让，即皇帝位，建立西晋，曹魏正式灭亡。' },
    { tag: '结果', title: '三分去一，晋室定鼎', description: '西晋建立后仅存蜀已灭、吴未服，司马氏一统天下的局面由此展开最终进程。' }
  ],
  109319: [
    { tag: '起因', title: '晋兴兵伐吴，志在混一', description: '西晋经数年准备，于279年冬兴兵大举伐吴，志在完成天下一统。' },
    { tag: '经过', title: '六路并进，直捣建业', description: '晋军分多路自长江上中下游同时进击，迅速攻占江陵、武昌等重镇，突破东吴长江防线。' },
    { tag: '结果', title: '孙皓出降，三国告终', description: '280年晋军兵临建业，吴主孙皓出降，东吴灭亡。三国分裂时代至此彻底结束，西晋重新一统天下。' }
  ],
};

/* ---------- #5 泛化「关联」标签细化：按有序名字对覆盖为具体关系 ---------- */
const REL_FIX_109 = {
  '曹操|曹丕': '父子',
  '曹操|曹植': '父子',
  '曹丕|曹植': '兄弟',
  '曹操|曹叡': '祖孙',
  '曹丕|曹叡': '父子',
  '司马懿|司马师': '父子',
  '司马懿|司马昭': '父子',
  '司马师|司马昭': '兄弟',
  '司马昭|司马炎': '父子',
  '刘备|关羽': '君臣',
  '刘备|张飞': '君臣',
  '刘备|诸葛亮': '君臣',
  '关羽|张飞': '同僚',
  '刘备|刘禅': '父子',
  '孙权|孙策': '兄弟',
  '孙权|诸葛恪': '君臣',
  '周瑜|孙权': '君臣',
  '周瑜|鲁肃': '同僚',
  '诸葛亮|关羽': '同僚',
  '诸葛亮|张飞': '同僚',
  '诸葛亮|赵云': '同僚',
  '吕布|刘备': '盟友',
  '袁绍|曹操': '敌对',
  '董卓|袁绍': '敌对',
  // —— 家族/宗族关系细化 ——
  '曹操|曹彰': '父子', '曹植|曹彰': '兄弟', '曹植|曹冲': '兄弟',
  '曹操|曹冲': '父子', '曹操|曹休': '宗族', '曹操|曹仁': '宗族',
  '曹操|夏侯惇': '宗族', '夏侯惇|夏侯尚': '宗族', '曹操|夏侯渊': '宗族',
  '诸葛瑾|诸葛恪': '父子', '诸葛亮|诸葛恪': '叔侄', '诸葛恪|诸葛瞻': '同族',
  '陆逊|陆抗': '父子', '陆抗|陆凯': '同族', '陆逊|陆凯': '同族',
  '荀彧|荀攸': '叔侄',
  '诸葛亮|诸葛瞻': '父子', '诸葛瞻|诸葛尚': '父子', '诸葛亮|诸葛尚': '祖孙',
  '邓艾|邓忠': '父子',
  '辛毗|辛评': '兄弟', '辛毗|辛宪英': '父女',
  '王朗|王元姬': '祖孙',
  '司马懿|张春华': '夫妻', '司马师|张春华': '母子', '司马昭|张春华': '母子', '司马炎|张春华': '祖孙',
  '司马师|司马炎': '叔侄', '司马懿|司马炎': '祖孙', '司马炎|王元姬': '母子', '司马昭|王元姬': '夫妻',
  '司马孚|司马懿': '同族', '司马孚|司马师': '同族', '司马孚|司马昭': '同族', '司马孚|司马炎': '同族',
  '袁绍|袁术': '兄弟',
  '刘备|刘封': '父子', '刘禅|刘封': '兄弟',
  '糜竺|糜芳': '兄弟',
  '马超|马岱': '堂兄弟',
  '吴懿|吴班': '同族',
  '向朗|向宠': '叔侄',
  '马谡|马良': '兄弟',
  '关羽|关平': '父子', '关平|关兴': '兄弟', '关羽|关兴': '父子',
  '张飞|张苞': '父子',
  '诸葛亮|黄月英': '夫妻', '诸葛瞻|黄月英': '母子',
  '诸葛亮|诸葛瑾': '兄弟',
  '孙权|孙登': '父子', '孙权|孙鲁班': '父女', '孙鲁班|孙鲁育': '姐妹', '孙权|孙鲁育': '父女', '全琮|孙鲁班': '夫妻',
  '孙权|孙韶': '宗族', '孙策|孙韶': '宗族', '孙韶|孙桓': '同族', '孙权|孙桓': '宗族',
  '孙权|孙皎': '宗族', '孙策|孙皎': '宗族',
  '曹叡|甄宓': '母子', '袁绍|甄宓': '姻亲',
  '曹操|杜夫人': '夫妻',
  '王元姬|钟会': '同朝',
  // —— 同僚/君臣关系细化 ——
  '刘禅|诸葛瞻': '君臣', '张飞|刘禅': '姻亲',
  '陆逊|诸葛恪': '同僚', '陆逊|诸葛瑾': '同僚', '诸葛瑾|陆逊': '同僚',
  '王昶|王凌': '同族',
  '司马师|王元姬': '同族',
  '刘禅|刘封': '兄弟',
};

// 无真实关系、由 BFS 自动补链产生的错误「关联」，直接移除
const REMOVE_REL_109 = new Set([
  '蔡文姬（蔡琰）|孙权', '蔡文姬（蔡琰）|陈群', '蔡文姬（蔡琰）|刘备', '蔡文姬（蔡琰）|关羽', '蔡文姬（蔡琰）|周瑜',
]);

/* ---------- 归一化关系标签：去掉「·因缘」叠缀 ---------- */
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

/* ---------- #3 补充 二级 narrative_relations（因缘际会）：低节点人物人工策展 ---------- */
/* 说明：persons/events 引用的名字与事件均须为本数据集真实存在（sanitizeCurated 会过滤） */
const CURATED_109 = {
  // —— 曹魏宗室与宿将 ——
  '曹彰': { persons: [['曹操', '父子'], ['曹植', '兄弟'], ['曹冲', '兄弟']], events: ['曹丕代汉', '曹魏屯田'] },
  '曹冲': { persons: [['曹操', '父子'], ['曹植', '兄弟'], ['曹彰', '兄弟']], events: ['曹丕代汉', '曹魏屯田'] },
  '夏侯惇': { persons: [['曹操', '同族'], ['夏侯渊', '兄弟'], ['曹植', '同朝']], events: ['曹丕代汉', '曹魏屯田'] },
  '夏侯渊': { persons: [['曹操', '同族'], ['夏侯惇', '兄弟'], ['黄忠', '敌对']], events: ['刘备称帝', '曹丕代汉'] },
  '夏侯玄': { persons: [['夏侯尚', '同族'], ['司马懿', '政敌'], ['曹叡', '君臣']], events: ['高平陵之变', '正始玄风'] },
  '于禁': { persons: [['曹操', '君臣'], ['关羽', '敌对'], ['张郃', '同僚']], events: ['曹丕代汉'] },
  '典韦': { persons: [['曹操', '君臣'], ['许褚', '同袍'], ['夏侯惇', '同僚'], ['曹植', '同朝']], events: ['曹丕代汉'] },
  '许褚': { persons: [['曹操', '君臣'], ['典韦', '同袍'], ['曹植', '同朝']], events: ['曹丕代汉', '曹魏屯田'] },
  '田豫': { persons: [['曹操', '君臣'], ['牵招', '同僚'], ['曹叡', '君臣']], events: ['曹丕伐吴', '曹魏屯田'] },
  '牵招': { persons: [['曹操', '君臣'], ['田豫', '同僚'], ['曹叡', '君臣']], events: ['曹丕伐吴', '曹魏屯田'] },
  '董昭': { persons: [['曹操', '君臣'], ['曹植', '同朝'], ['华歆', '同僚']], events: ['曹丕代汉', '九品中正制'] },
  '蒋济': { persons: [['曹叡', '君臣'], ['司马懿', '同僚'], ['王凌', '同朝']], events: ['高平陵之变'] },
  '杨修': { persons: [['曹操', '君臣'], ['曹植', '党附'], ['司马懿', '同朝']], events: ['建安文学余韵'] },
  '崔琰': { persons: [['曹操', '君臣'], ['曹植', '同朝'], ['杨修', '同僚']], events: ['建安文学余韵'] },
  '辛毗': { persons: [['曹叡', '君臣'], ['辛评', '兄弟'], ['司马懿', '同僚']], events: ['诸葛亮北伐'] },
  '辛评': { persons: [['袁绍', '君臣'], ['辛毗', '兄弟'], ['袁术', '同宗'], ['曹操', '敌对']], events: [] },
  '袁术': { persons: [['袁绍', '兄弟'], ['曹操', '敌对'], ['孙策', '君臣'], ['刘备', '盟友']], events: [] },
  '甄宓': { persons: [['曹植', '叔嫂'], ['曹操', '公婆'], ['曹叡', '母子']], events: ['曹植《洛神赋》', '曹丕代汉'] },
  '杜夫人': { persons: [['曹操', '夫君'], ['曹植', '继子'], ['甄宓', '同宫']], events: ['曹丕代汉'] },
  // —— 蜀汉臣僚 ——
  '刘封': { persons: [['刘备', '义父'], ['关羽', '同僚'], ['诸葛亮', '同朝']], events: ['刘备称帝'] },
  '关平': { persons: [['关羽', '父子'], ['刘封', '同僚'], ['刘备', '君臣']], events: ['夷陵之战'] },
  '霍峻': { persons: [['刘备', '君臣'], ['魏延', '同僚'], ['黄忠', '同袍']], events: ['刘备称帝'] },
  '糜竺': { persons: [['刘备', '君臣'], ['糜芳', '兄弟'], ['简雍', '同僚']], events: ['刘备称帝'] },
  '糜芳': { persons: [['刘备', '君臣'], ['糜竺', '兄弟'], ['关羽', '同僚'], ['孙权', '归降']], events: ['夷陵之战'] },
  '马岱': { persons: [['马超', '兄弟'], ['诸葛亮', '君臣'], ['魏延', '同僚']], events: ['诸葛亮北伐', '五丈原之战'] },
  '吴班': { persons: [['刘备', '同族'], ['吴懿', '兄弟'], ['诸葛亮', '君臣']], events: ['夷陵之战', '刘备称帝'] },
  '向宠': { persons: [['刘禅', '君臣'], ['诸葛亮', '君臣'], ['郭攸之', '同僚']], events: ['诸葛亮北伐'] },
  '庞德公': { persons: [['诸葛亮', '师友'], ['庞统', '同族'], ['黄月英', '姻亲'], ['刘备', '同朝']], events: [] },
  '费诗': { persons: [['刘备', '君臣'], ['诸葛亮', '同僚'], ['李严', '同朝']], events: ['刘备称帝'] },
  '黄月英': { persons: [['诸葛亮', '夫妻'], ['庞德公', '姻亲'], ['刘备', '同朝']], events: ['木牛流马', '连弩改进'] },
  // —— 东吴宗室与名臣 ——
  '孙韶': { persons: [['孙权', '宗族'], ['孙皎', '兄弟'], ['陆逊', '同僚']], events: ['曹丕伐吴', '孙权称帝'] },
  '孙桓': { persons: [['孙权', '宗族'], ['陆逊', '同僚'], ['刘备', '敌对']], events: ['夷陵之战', '孙权称帝'] },
  '孙皎': { persons: [['孙权', '兄弟'], ['吕蒙', '同僚'], ['关羽', '敌对'], ['孙韶', '同族']], events: [] },
  '吕岱': { persons: [['孙权', '君臣'], ['陆逊', '同僚'], ['诸葛恪', '同朝']], events: ['孙权称帝'] },
  // —— 西晋初与文士 ——
  '辛宪英': { persons: [['辛毗', '父女'], ['曹叡', '同朝'], ['司马懿', '同朝']], events: ['高平陵之变'] },
  '张春华': { persons: [['司马懿', '夫妻'], ['司马师', '母子'], ['司马昭', '母子']], events: ['高平陵之变'] },
  '王元姬': { persons: [['司马昭', '夫妻'], ['司马炎', '母子'], ['司马师', '同族']], events: ['司马炎代魏'] },
  '皇甫谧': { persons: [['司马炎', '君臣'], ['傅玄', '同朝'], ['杜预', '同朝']], events: ['司马炎代魏', '晋灭吴之战'] },
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
  const d = load(f109);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[SANGUO_TIMELINE_KEY] = SANGUO_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = SANGUO_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', SANGUO_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化（分阶段叙述） =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = SANGUO_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      ev.narratives = (ev.summary ? ev.summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).map(s => ({ year: ev.start_year, tag: '经过', title: '', description: s })).slice(0, 6) : []);
    }
  });
  console.log('  已应用分阶段叙述的事件数:', stageOk, '/', events.length);

  // ---- 关键人物补全：Excel人事关系表缺失部分事件的关键人物，导致四类全空 ----
  const EV_PERSONS_BACKFILL = {
    109326: { // 孙权称帝
      leaders: [{ name: '孙权', role: '皇帝' }],
      participants: [
        { name: '张昭', role: '劝进' },
        { name: '顾雍', role: '劝进' },
        { name: '陆逊', role: '劝进' }
      ],
      opponents: [], affected: []
    },
    109346: { // 马钧翻水车
      leaders: [{ name: '马钧', role: '发明者' }],
      participants: [
        { name: '傅玄', role: '记载' }
      ],
      opponents: [], affected: []
    }
  };
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
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级 narrative_relations（因缘际会） —— 自动生成：核心人物 + 有真实关系的邻居 + 事件
  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_109);
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
    return REL_FIX_109[a + '|' + b] || REL_FIX_109[b + '|' + a] || cur;
  };
  persons.forEach(p => (p.related_people || []).forEach(r => {
    if (REMOVE_REL_109.has(p.name + '|' + r.name) || REMOVE_REL_109.has(r.name + '|' + p.name)) { r._remove = true; removed++; return; }
    const nv = fix(p.name, r.name, r.relation);
    if (nv !== r.relation) { r.relation = nv; fixed++; }
  }));
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  events.forEach(ev => (ev.person_relations || []).forEach(r => {
    if (REMOVE_REL_109.has(r.source + '|' + r.target) || REMOVE_REL_109.has(r.target + '|' + r.source)) { r._remove = true; removed++; return; }
    const nv = fix(r.source, r.target, r.type);
    if (nv !== r.type) { r.type = nv; fixed++; }
  }));
  events.forEach(ev => { if (ev.person_relations) ev.person_relations = ev.person_relations.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  console.log('  已细化的关联关系数:', fixed, '；已移除的错误关联:', removed);

  save(f109, d);
  console.log('\n完成。');
}
module.exports = {};
main();