/**
 * 元朝(dynasty_114)数据丰富脚本（对齐 enrich_113_relations.js 宋朝流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（继续探索：推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   #5 泛化「关联」关系细化
 *   #6 事件经过分阶段叙述（关键事件手写，其余自动切分）
 * 用法: node scripts/enrich_114_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f114 = path.join(DIR, 'dynasty_114.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 元朝历史脉络宏观时间线（10节点骨干） ---------- */
const YUAN_TIMELINE_KEY = '元朝兴衰';
const YUAN_TIMELINE = [
  { title: '忽必烈即位', year: '1260年', desc: '忽必烈称汗', event_id: 114301 },
  { title: '元朝定国号', year: '1271年', desc: '改国号大元', event_id: 114302 },
  { title: '襄阳樊城之战', year: '1273年', desc: '叩开南宋门户', event_id: 114306 },
  { title: '南宋灭亡', year: '1279年', desc: '完成大一统', event_id: 114308 },
  { title: '行省制度确立', year: '1280年', desc: '确立行政架构', event_id: 114305 },
  { title: '海都之乱', year: '1301年', desc: '西北宗王叛乱', event_id: 114320 },
  { title: '南坡之变', year: '1323年', desc: '英宗遇弑', event_id: 114322 },
  { title: '天历之变', year: '1328年', desc: '两都之争', event_id: 114323 },
  { title: '红巾军起义', year: '1351年', desc: '元末大乱', event_id: 114328 },
  { title: '元朝灭亡', year: '1368年', desc: '大都陷落', event_id: 114331 },
];

/* ---------- #6 事件经过分阶段叙述（关键事件手写，标题均为4-8字无标点短语） ---------- */
const YUAN_EVENT_STAGES = {
  114301: [ // 忽必烈即位
    { tag: '起因', title: '蒙哥汗战死', description: '1259年蒙哥汗死于合州钓鱼城，蒙古内部汗位空缺。' },
    { tag: '经过', title: '忽必烈称汗', description: '1260年忽必烈于开平即大汗位，建元中统。' },
    { tag: '结果', title: '四汗分立', description: '阿里不哥败降，成吉思汗黄金家族分裂为四大汗国。' }
  ],
  114302: [ // 元朝定国号
    { tag: '起因', title: '忽必烈稳固汗位', description: '经阿里不哥之战后忽必烈稳固统治，决意建国号。' },
    { tag: '经过', title: '取易经大元', description: '1271年取《易经》"大哉乾元"之意，定国号为元。' },
    { tag: '结果', title: '元朝建立', description: '中国历史上首次由少数民族建立的大一统王朝正式确立。' }
  ],
  114303: [ // 至元改制
    { tag: '起因', title: '蒙制不适应', description: '成吉思汗旧制不适应中原广大疆域，亟需变革。' },
    { tag: '经过', title: '刘秉忠主持改制', description: '刘秉忠、许衡等参照汉制，官制礼仪全面改革。' },
    { tag: '结果', title: '确立元朝典制', description: '形成蒙汉杂糅的行省制度与政治框架，影响深远。' }
  ],
  114306: [ // 襄阳樊城之战
    { tag: '起因', title: '蒙宋攻宋前哨', description: '蒙宋战争持续，襄樊为南宋长江门户、必争之地。' },
    { tag: '经过', title: '阿术围攻六年', description: '1268年起阿术、史天泽围攻襄樊，切断外援。' },
    { tag: '结果', title: '吕文焕投降', description: '1273年樊城破、襄阳降，南宋长江门户洞开。' }
  ],
  114307: [ // 临安陷落
    { tag: '起因', title: '元军南下', description: '襄樊失守后元军乘胜东进，直指南宋行在临安。' },
    { tag: '经过', title: '伯颜直逼临安', description: '1275年伯颜统兵东下，连克重镇，逼近临安。' },
    { tag: '结果', title: '恭帝出降', description: '1276年宋恭帝奉表出降，临安陷落。' }
  ],
  114308: [ // 南宋灭亡
    { tag: '起因', title: '宋室南逃', description: '临安陷落后南宋残部南逃，拥立二王继续抵抗。' },
    { tag: '经过', title: '崖山海战', description: '1279年张弘范围崖山，宋军溃败，陆秀夫背帝蹈海。' },
    { tag: '结果', title: '南宋覆亡', description: '两宋320年国祚终结，元朝完成全国统一。' }
  ],
  114305: [ // 行省制度确立
    { tag: '起因', title: '疆域空前辽阔', description: '元朝疆域横跨欧亚，亟需新的行政制度。' },
    { tag: '经过', title: '十行省分立', description: '忽必烈创行省制，中央中书省管辖十一个行中书省。' },
    { tag: '结果', title: '影响后世', description: '行省制奠定中国今日省制之基，沿用至今。' }
  ],
  114311: [ // 元代科举恢复
    { tag: '起因', title: '长期停废科举', description: '元朝立国后科举长期停废，士人出路不畅。' },
    { tag: '经过', title: '仁宗延祐复科', description: '1313年元仁宗下诏恢复科举，分蒙古色目汉人南人两榜。' },
    { tag: '结果', title: '科举续行', description: '此后科举延续至元末，为士人提供入仕通道。' }
  ],
  114315: [ // 阿合马专权
    { tag: '起因', title: '理财聚敛', description: '忽必烈需要巨额军费和财政收入，重用阿合马理财。' },
    { tag: '经过', title: '阿合马独揽财权', description: '阿合马主政二十年，兴铁冶、增盐税、理财政，树敌甚众。' },
    { tag: '结果', title: '被刺身亡', description: '1282年阿合马被王著、高和尚刺杀于大都。' }
  ],
  114317: [ // 桑哥理财
    { tag: '起因', title: '财政困窘', description: '征日征缅耗资巨大，忽必烈朝财政捉襟见肘。' },
    { tag: '经过', title: '桑哥整顿财政', description: '1287年桑哥任尚书省丞相，清理钱谷、增收节支。' },
    { tag: '结果', title: '桑哥被诛', description: '桑哥理财虽见成效但树敌过多，1291年被诛。' }
  ],
  114320: [ // 海都之乱
    { tag: '起因', title: '西北宗王不满', description: '海都为窝阔台孙，不满忽必烈汗位传承，密谋叛乱。' },
    { tag: '经过', title: '海都长期扰边', description: '1266年起海都联合乃颜叛乱，屡犯岭北甘肃。' },
    { tag: '结果', title: '忽必烈亲征', description: '忽必烈亲征西北，海都势衰，1301年海都败亡。' }
  ],
  114321: [ // 乃颜之乱
    { tag: '起因', title: '东部宗王叛乱', description: '乃颜为成吉思汗弟后裔，1287年联合诸王叛乱。' },
    { tag: '经过', title: '忽必烈亲讨乃颜', description: '忽必烈率师亲征，用汉军步骑大破乃颜叛军。' },
    { tag: '结果', title: '乃颜被擒', description: '乃颜被擒杀，东部宗王叛乱平息。' }
  ],
  114322: [ // 南坡之变
    { tag: '起因', title: '英宗锐意改革', description: '元英宗即位后重用拜住，推行新政、裁减冗官。' },
    { tag: '经过', title: '铁失发动政变', description: '1323年御史大夫铁失勾结也先帖木儿发动政变。' },
    { tag: '结果', title: '英宗遇弑', description: '英宗、拜住被弑于南坡行宫，泰定帝上台。' }
  ],
  114323: [ // 天历之变
    { tag: '起因', title: '皇位争夺', description: '泰定帝死后上都立天顺帝、大都立文宗，两都并立。' },
    { tag: '经过', title: '两都之战', description: '燕铁木儿拥文宗于大都，击败上都天顺帝政权。' },
    { tag: '结果', title: '文宗继立', description: '天顺帝败亡，文宗图帖睦尔二次即位。' }
  ],
  114324: [ // 脱脱更化
    { tag: '起因', title: '伯颜倒行逆施', description: '权臣伯颜专权，贬逐异己、虐害汉臣，朝野怨愤。' },
    { tag: '经过', title: '脱脱逐伯颜', description: '1340年脱脱发动政变驱逐伯颜，开始脱脱更化。' },
    { tag: '结果', title: '新政受挫', description: '脱脱更化一度见效，但旋因贾鲁治河失败、红巾起义中断。' }
  ],
  114327: [ // 贾鲁治河
    { tag: '起因', title: '黄河连年决口', description: '黄河多次决口泛滥，民生凋敝、流民四起。' },
    { tag: '经过', title: '贾鲁主持治河', description: '1351年贾鲁征发十七万民工大修黄河。' },
    { tag: '结果', title: '红巾起义爆发', description: '繁重劳役成为红巾军起义导火索，元朝急速覆亡。' }
  ],
  114328: [ // 红巾军起义
    { tag: '起因', title: '繁重劳役民族矛盾', description: '贾鲁治河强征民工、元朝民族压迫，社会矛盾总爆发。' },
    { tag: '经过', title: '韩山童刘福通起义', description: '1351年韩山童、刘福通率众起义，头裹红巾称红巾军。' },
    { tag: '结果', title: '元朝分崩离析', description: '红巾军蜂起，各地群雄割据，元朝统治基础动摇。' }
  ],
  114331: [ // 大都失陷与元朝灭亡
    { tag: '起因', title: '北伐之势已成', description: '1356年朱元璋占据集庆称吴王，实力壮大。' },
    { tag: '经过', title: '朱元璋北伐大都', description: '1367年朱元璋遣徐达常遇春北伐，1368年兵临大都。' },
    { tag: '结果', title: '元顺帝北遁', description: '元顺帝妥欢帖睦尔北遁上都，明朝建立，元朝覆亡。' }
  ]
};

/* ---------- #5 泛化「关联」标签细化 ---------- */
const REL_FIX_114 = {
  '忽必烈|刘秉忠': '君臣', '忽必烈|廉希宪': '君臣', '忽必烈|姚枢': '君臣',
  '忽必烈|张文谦': '君臣', '忽必烈|赵璧': '君臣', '忽必烈|王盘': '君臣',
  '忽必烈|许衡': '师生', '忽必烈|窦默': '师生', '忽必烈|安童': '君臣',
  '忽必烈|伯颜': '君臣', '忽必烈|阿术': '君臣', '忽必烈|阿里海牙': '君臣',
  '忽必烈|阿合马': '君臣', '忽必烈|桑哥': '君臣',
  '铁穆耳|玉昔帖木儿': '君臣', '铁穆耳|完泽': '君臣', '铁穆耳|哈剌哈孙': '君臣',
  '铁穆耳|月赤察儿': '君臣', '铁穆耳|不忽木': '君臣',
  '海山|月赤察儿': '君臣', '海山|脱脱': '君臣',
  '爱育黎拔力八达|李孟': '君臣', '爱育黎拔力八达|拜住': '君臣',
  '硕德八剌|拜住': '君臣', '硕德八剌|铁失': '敌对',
  '图帖睦尔|燕铁木儿': '君臣', '图帖睦尔|阿鲁图': '君臣',
  '妥欢帖睦尔|脱脱': '君臣', '妥欢帖睦尔|马札儿台': '君臣',
  '妥欢帖睦尔|贾鲁': '君臣', '妥欢帖睦尔|也先帖木儿': '君臣',
  '木华黎|成吉思汗': '君臣', '木华黎|博尔术': '同僚',
  '伯颜|阿术': '同僚', '伯颜|阿里海牙': '同僚',
  '阿合马|王著': '敌对', '阿合马|高和尚': '敌对',
  '忽必烈|蒙哥': '兄弟', '忽必烈|阿里不哥': '兄弟',
  '忽必烈|旭烈兀': '兄弟', '忽必烈|拔都': '堂兄弟',
  '妥欢帖睦尔|爱育黎拔力八达': '祖孙',
  '许衡|姚枢': '师生', '许衡|窦默': '师生', '许衡|耶律有尚': '师生',
  '赵孟頫|管道升': '夫妻', '赵孟頫|高克恭': '同僚',
  '郭守敬|王恂': '同僚', '郭守敬|刘秉忠': '师生',
  '郭守敬|许衡': '同僚', '王恂|许衡': '同僚',
  '关汉卿|王实甫': '同僚', '马致远|白朴': '同僚', '马致远|关汉卿': '同僚',
  '刘因|吴澄': '师友', '赵复|刘因': '师生',
  '虞集|揭傒斯': '同僚', '虞集|黄溍': '同僚', '黄溍|欧阳玄': '同僚',
  '姚燧|程钜夫': '同僚', '程钜夫|赵孟頫': '同僚',
  '脱脱|马札儿台': '父子', '脱脱|也先帖木儿': '兄弟',
  '红巾军|元朝': '敌对', '朱元璋|元军': '敌对'
};
const REMOVE_REL_114 = new Set(['忽必烈|朱元璋', '忽必烈|陈友谅', '忽必烈|张士诚', '忽必烈|徐达', '忽必烈|常遇春']);
const L1_TOPUP_114 = {
  '忽必烈': [['铁木真', '祖孙'], ['阿里不哥', '兄弟'], ['旭烈兀', '兄弟']],
  '铁木真': [['木华黎', '君臣'], ['博尔术', '君臣'], ['速不台', '君臣']]
};

/* ---------- 归一化关系标签 ---------- */
function cleanRel(s) { return String(s || '关系').split('·')[0].trim() || '关系'; }
const REL_SET = {
  '关系': 0, '关联': 0, '因缘': 0, '参与': 0,
  '敌对': 1, '对手': 1, '政敌': 1, '敌人': 1,
  '君臣': 2, '父子': 3, '母子': 3, '兄弟': 3, '夫妻': 3, '亲属': 3, '宗族': 3, '叔侄': 3, '祖孙': 3,
  '盟友': 4, '同盟': 4, '同僚': 5, '同袍': 5, '同朝': 5,
  '师生': 6, '师徒': 6, '影响': 7, '继承': 8, '交流': 9, '支持': 10
};
const REL_PRIORITY = {
  '君臣': 6, '父子': 6, '兄弟': 6, '夫妻': 6, '亲属': 6, '政敌': 6, '敌人': 6, '盟友': 5, '同盟': 5,
  '敌对': 5, '对手': 5, '师生': 4, '师徒': 4, '同僚': 3, '同袍': 3, '同朝': 3,
  '影响': 2, '继承': 2, '交流': 1, '支持': 1, '关联': 0, '关系': 0, '因缘': 0
};
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

/* ---------- #3 二级 narrative_relations（因缘际会） ---------- */
const CURATED_114 = {
  '木华黎': { persons: [['忽必烈', '君臣'], ['速不台', '同僚'], ['博尔术', '同僚']], events: ['元朝统一全国'] },
  '博尔术': { persons: [['忽必烈', '君臣'], ['木华黎', '同僚'], ['速不台', '同僚']], events: ['元朝统一全国'] },
  '速不台': { persons: [['木华黎', '同僚'], ['博尔术', '同僚'], ['忽必烈', '君臣']], events: ['元朝统一全国'] },
  '安童': { persons: [['忽必烈', '君臣'], ['廉希宪', '同僚'], ['许衡', '同僚']], events: ['至元改制'] },
  '廉希宪': { persons: [['忽必烈', '君臣'], ['安童', '同僚'], ['张文谦', '同僚']], events: ['至元改制'] },
  '许衡': { persons: [['忽必烈', '师生'], ['姚枢', '师生'], ['窦默', '同僚']], events: ['至元改制'] },
  '赵璧': { persons: [['忽必烈', '君臣'], ['安童', '同僚'], ['张文谦', '同僚']], events: ['至元改制'] },
  '张文谦': { persons: [['忽必烈', '君臣'], ['窦默', '同僚'], ['赵璧', '同僚']], events: ['至元改制'] },
  '姚枢': { persons: [['忽必烈', '君臣'], ['许衡', '师生'], ['窦默', '同僚']], events: ['至元改制'] },
  '董文炳': { persons: [['忽必烈', '君臣'], ['伯颜', '同僚'], ['阿术', '同僚']], events: ['临安陷落'] },
  '李恒': { persons: [['伯颜', '同僚'], ['阿术', '同僚'], ['董文炳', '同僚']], events: ['临安陷落'] },
  '阿合马': { persons: [['忽必烈', '君臣'], ['王著', '敌对'], ['桑哥', '同僚']], events: ['阿合马专权'] },
  '王著': { persons: [['阿合马', '敌对'], ['高和尚', '同僚']], events: ['刺杀阿合马'] },
  '桑哥': { persons: [['忽必烈', '君臣'], ['阿合马', '同僚']], events: ['桑哥理财'] },
  '铁失': { persons: [['硕德八剌', '敌对'], ['也先帖木儿', '同僚']], events: ['南坡之变'] },
  '脱脱': { persons: [['妥欢帖睦尔', '君臣'], ['马札儿台', '父子'], ['也先帖木儿', '兄弟']], events: ['脱脱更化'] },
  '马札儿台': { persons: [['妥欢帖睦尔', '君臣'], ['脱脱', '父子'], ['也先帖木儿', '父子']], events: ['脱脱更化'] },
  '贾鲁': { persons: [['妥欢帖睦尔', '君臣'], ['脱脱', '同僚']], events: ['贾鲁治河'] },
  '刘基': { persons: [['朱元璋', '君臣'], ['宋濂', '同僚'], ['徐达', '同僚']], events: ['红巾军起义'] },
  '宋濂': { persons: [['朱元璋', '君臣'], ['刘基', '同僚']], events: ['红巾军起义'] },
  '徐寿辉': { persons: [['陈友谅', '同僚'], ['明玉珍', '同僚'], ['彭莹玉', '同僚']], events: ['红巾军起义'] },
  '陈友谅': { persons: [['徐寿辉', '同僚'], ['明玉珍', '同僚'], ['朱元璋', '敌对']], events: ['元末群雄割据'] },
  '张士诚': { persons: [['朱元璋', '敌对'], ['陈友谅', '敌对'], ['方国珍', '同僚']], events: ['元末群雄割据'] },
  '方国珍': { persons: [['张士诚', '同僚'], ['朱元璋', '敌对']], events: ['元末群雄割据'] },
  '徐达': { persons: [['朱元璋', '君臣'], ['常遇春', '同僚'], ['刘基', '同僚']], events: ['大都失陷与元朝灭亡'] },
  '常遇春': { persons: [['朱元璋', '君臣'], ['徐达', '同僚']], events: ['大都失陷与元朝灭亡'] },
  '郭守敬': { persons: [['王恂', '同僚'], ['刘秉忠', '师生'], ['许衡', '同僚']], events: ['元代科技'] },
  '赵孟頫': { persons: [['管道升', '夫妻'], ['高克恭', '同僚'], ['程钜夫', '同僚']], events: ['元代文艺'] },
  '黄公望': { persons: [['王蒙', '同僚'], ['倪瓒', '同僚'], ['吴镇', '同僚']], events: ['元代文艺'] },
  '拔都': { persons: [['忽必烈', '堂兄弟'], ['贵由', '堂兄弟'], ['速不台', '同僚']], events: ['元朝统一全国'] },
  '贵由': { persons: [['忽必烈', '堂兄弟'], ['拔都', '堂兄弟'], ['海都', '堂兄弟']], events: ['海都之乱'] },
  '董文忠': { persons: [['忽必烈', '君臣'], ['董文炳', '兄弟'], ['董文用', '兄弟']], events: ['元朝统一全国'] },
  '王著': { persons: [['阿合马', '敌对'], ['高和尚', '同僚']], events: ['刺杀阿合马'] },
  '高和尚': { persons: [['阿合马', '敌对'], ['王著', '同僚']], events: ['刺杀阿合马'] },
  '虞集': { persons: [['揭傒斯', '同僚'], ['黄溍', '同僚'], ['欧阳玄', '同僚']], events: ['元代科举恢复'] }
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
  const d = load(f114);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const l1NameSet = new Set(persons.filter(p => (p.level || 1) === 1).map(p => p.name));
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[YUAN_TIMELINE_KEY] = YUAN_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = YUAN_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', YUAN_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化 =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = YUAN_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      ev.narratives = (ev.summary ? ev.summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).map(s => {
        let title = s.split(/[，,。；;、]/)[0].trim().slice(0, 6).replace(/[，。；、,.:：！?？]+$/, '');
        return { year: ev.start_year, tag: '经过', title: title || '史事始末', description: s };
      }).slice(0, 6) : []);
    }
  });
  console.log('  已应用分阶段叙述的事件数:', stageOk, '/', events.length);

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

  const adjAll = new Map();
  const linkA = (a, b, rel) => {
    if (!nameSet.has(a) || !nameSet.has(b) || a === b) return;
    if (!adjAll.has(a)) adjAll.set(a, new Map());
    if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel);
  };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  const mentionedInStory = (text) => { if (!text) return []; return personNamesArr.filter(n => n && text.includes(n)); };
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
    let result = scored.slice(0, 6).map(s => s.name);

    // Fallback: 人物共享不足3个时，按时间邻近+同类型+同 timeline 补充
    if (result.length < 3) {
      const have = new Set(result);
      const sameTimeline = events.filter(o => o.id !== ev.id && o.timeline_id === ev.timeline_id);
      sameTimeline.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
      sameTimeline.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      if (result.length < 4) {
        const sameType = events.filter(o => o.id !== ev.id && o.event_type === ev.event_type && !have.has(o.name));
        sameType.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
        sameType.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      }
      if (result.length < 3) {
        const near = events.filter(o => o.id !== ev.id && Math.abs(o.start_year - ev.start_year) <= 30 && !have.has(o.name));
        near.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
        near.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      }
    }
    return result;
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
    // L1 人物优先加权（确保继续探索里 L1 出现在前面）
    const list = [...merged.entries()].map(([nm, info]) => ({
      name: nm, relation: cleanRel(info.type),
      influence: Math.min(95, 55 + info.count * 8 + (l1NameSet.has(nm) ? 20 : 0)),
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
      direct.sort((a, b) => {
        const l1a = l1NameSet.has(a[0]) ? 1 : 0, l1b = l1NameSet.has(b[0]) ? 1 : 0;
        if (l1a !== l1b) return l1b - l1a;
        return degA(b[0]) - degA(a[0]);
      }).forEach(([nm, rel]) => { if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '关系', influence: 60 + (l1NameSet.has(nm) ? 15 : 0) }); } });
      indirect.sort((a, b) => {
        const l1a = l1NameSet.has(a[0]) ? 1 : 0, l1b = l1NameSet.has(b[0]) ? 1 : 0;
        if (l1a !== l1b) return l1b - l1a;
        return degA(b[0]) - degA(a[0]);
      }).forEach(([nm, rel]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 + (l1NameSet.has(nm) ? 15 : 0) }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    const topup = L1_TOPUP_114[p.name] || [];
    const have114 = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!have114.has(nm) && list.length < 6) { have114.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !['关联', '关系', '因缘', '参与', '未知'].includes(r.relation)); });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_114);
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
  const fix = (a, b, cur) => REL_FIX_114[a + '|' + b] || REL_FIX_114[b + '|' + a] || cur;
  persons.forEach(p => (p.related_people || []).forEach(r => {
    if (REMOVE_REL_114.has(p.name + '|' + r.name) || REMOVE_REL_114.has(r.name + '|' + p.name)) { r._remove = true; removed++; return; }
    const nv = fix(p.name, r.name, r.relation);
    if (nv !== r.relation) { r.relation = nv; fixed++; }
  }));
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  events.forEach(ev => (ev.person_relations || []).forEach(r => {
    if (REMOVE_REL_114.has(r.source + '|' + r.target) || REMOVE_REL_114.has(r.target + '|' + r.source)) { r._remove = true; removed++; return; }
    const nv = fix(r.source, r.target, r.type);
    if (nv !== r.type) { r.type = nv; fixed++; }
  }));
  events.forEach(ev => { if (ev.person_relations) ev.person_relations = ev.person_relations.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  console.log('  已细化的关联关系数:', fixed, '；已移除的错误关联:', removed);

  save(f114, d);
  console.log('\n完成。');
}
module.exports = {};
main();
