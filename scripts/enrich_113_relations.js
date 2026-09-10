/**
 * 宋朝(dynasty_113)数据丰富脚本（对齐 enrich_112_relations.js 唐朝流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id  → 事件详情页历史脉络10节点
 *   #2 事件填充 related_persons / related_events（继续探索：推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   #5 泛化「关联」关系细化
 *   #6 事件经过分阶段叙述（关键事件手写，其余自动切分）
 * 用法: node scripts/enrich_113_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f113 = path.join(DIR, 'dynasty_113.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 宋朝历史脉络宏观时间线（10节点骨干） ---------- */
const SONG_TIMELINE_KEY = '两宋兴亡';
const SONG_TIMELINE = [
  { title: '陈桥兵变', year: '960年', desc: '北宋肇建', event_id: 113301 },
  { title: '杯酒释兵权', year: '961年', desc: '集权立制', event_id: 113304 },
  { title: '澶渊之盟', year: '1005年', desc: '澶渊订盟', event_id: 113306 },
  { title: '王安石变法', year: '1069年', desc: '变法图强', event_id: 113310 },
  { title: '靖康之变', year: '1127年', desc: '汴京陷落', event_id: 113319 },
  { title: '南宋建立', year: '1127年', desc: '南渡立国', event_id: 113320 },
  { title: '岳飞抗金', year: '1130年', desc: '精忠报国', event_id: 113323 },
  { title: '绍兴和议', year: '1141年', desc: '偏安一隅', event_id: 113327 },
  { title: '蒙古灭金', year: '1234年', desc: '蒙元崛起', event_id: 113337 },
  { title: '崖山海战', year: '1279年', desc: '王朝终结', event_id: 113341 },
];

/* ---------- #6 事件经过分阶段叙述（关键事件手写，含独立标题/正文） ---------- */
const SONG_EVENT_STAGES = {
  113301: [ // 陈桥兵变
    { tag: '起因', title: '北征契丹，行至陈桥', description: '后周显德七年赵匡胤率军北上御敌，行至开封东北陈桥驿驻宿。' },
    { tag: '经过', title: '黄袍加身，拥立为帝', description: '960年将士哗变，将黄袍披于赵匡胤身，拥立他回京即位。' },
    { tag: '结果', title: '恭帝禅位，终成正统', description: '赵匡胤受禅称帝，改元建隆，定都汴京，建立大宋王朝。' }
  ],
  113302: [ // 北宋建立
    { tag: '起因', title: '陈桥兵变，代周建宋', description: '赵匡胤自陈桥兵变受禅立宋，重新收拾五代乱局。' },
    { tag: '经过', title: '定都汴京，革弊立制', description: '设都于开封，颁行统一钱币与税制，安抚勋旧，安抚地方。' },
    { tag: '结果', title: '政局初定，基业始兴', description: '北宋政权组织渐趋完备，为后续统一南方奠定基础。' }
  ],
  113303: [ // 统一南方战争
    { tag: '起因', title: '先南后北，谋划统一', description: '宋朝既定中原，依先易后难方略，着手削平南方割据诸国。' },
    { tag: '经过', title: '讨平荆湖南唐诸国', description: '963年灭荆南与湖南，继灭后蜀、南汉、南唐，席卷江南。' },
    { tag: '结果', title: '南方底定，回归一统', description: '979年灭北汉，基本完成天下统一，结束五代十国分裂局面。' }
  ],
  113304: [ // 杯酒释兵权
    { tag: '起因', title: '王养军士，恐蹈覆辙', description: '赵匡胤忌惮宿将拥兵，忧其重演黄袍加身之局。' },
    { tag: '经过', title: '设宴歌舞，曲示求归', description: '961年宴请石守信等，晓以利害，劝其交出兵权、享富贵终老。' },
    { tag: '结果', title: '兵权尽释，集权中央', description: '诸将交出兵权，宋朝遂行重文轻武，杜绝藩镇拥兵之患。' }
  ],
  113306: [ // 澶渊之盟
    { tag: '起因', title: '辽军南侵，兵临澶州', description: '1004年辽萧太后与圣宗大举南征，直逼黄河北岸澶州。' },
    { tag: '经过', title: '真宗亲征，两军相持', description: '宋真宗亲至澶州督战，射杀辽将萧挞览，宋军士气大振。' },
    { tag: '结果', title: '澶渊订盟，宋辽和好', description: '1005年宋辽议和，宋岁输银绢，互换使者，维持百年和平。' }
  ],
  113307: [ // 庆历新政
    { tag: '起因', title: '兵冗财困，积弊丛生', description: '宋仁宗时兵员冗滥、财政困顿，士人鼓吹革新求治。' },
    { tag: '经过', title: '范仲淹主政兴革', description: '1043年范仲淹主持新政，主张整饬吏治、兴学育才、均田薄赋。' },
    { tag: '结果', title: '触旧失势，新政告罢', description: '新政触犯权贵利益，仅行年余即废，然开宋代改革之先声。' }
  ],
  113310: [ // 王安石变法
    { tag: '起因', title: '积贫积弱，亟思振作', description: '宋神宗锐意求治，起用王安石主持变法，期以富国强兵。' },
    { tag: '经过', title: '颁行青苗募役诸法', description: '1069年推青苗、募役、农田水利、方田均税、保甲诸新法。' },
    { tag: '结果', title: '新旧相争，变法屡挫', description: '变法见成效却激化党争，神宗死后新法尽废，埋下党争之祸。' }
  ],
  113313: [ // 乌台诗案
    { tag: '起因', title: '诗章讥政，酿成狱案', description: '苏轼诗作被指讥讪新法，遭劾被捕，下御史台（乌台）问罪。' },
    { tag: '经过', title: '入狱问讯，多方援救', description: '1079年苏轼下狱，幸得王安石、太后等救助，方免于死。' },
    { tag: '结果', title: '贬谪黄州，旷达自遣', description: '苏轼被贬黄州，自此愈发旷达，成其文学创作之高峰。' }
  ],
  113319: [ // 靖康之变
    { tag: '起因', title: '金兵南下，两路夹攻', description: '1126年金军两路南侵，围攻开封，徽宗禅位钦宗。' },
    { tag: '经过', title: '城破汴京，宗室被掳', description: '1127年金军攻破汴京，掳徽钦二帝及宗室百官北去。' },
    { tag: '结果', title: '北宋灭亡，光庙倾覆', description: '北宋亡，康王赵构于应天即位，是为南宋之初。' }
  ],
  113320: [ // 南宋建立
    { tag: '起因', title: '靖康蒙尘，康王南渡', description: '金军虏掠北撤后，康王赵构脱离金营，南返监国。' },
    { tag: '经过', title: '应天即位，建元建炎', description: '1127年赵构于应天府即位，重建宋室，史称南宋。' },
    { tag: '结果', title: '偏安江南，与金周旋', description: '南宋迁都临安，据守东南，与金南北对峙、时战时和。' }
  ],
  113322: [ // 宗泽守东京
    { tag: '起因', title: '汴京残破，金骑环伺', description: '靖康后汴京残破，金军屡至，危局亟待重臣固守。' },
    { tag: '经过', title: '宗泽守汴，整军御敌', description: '宗泽出任东京留守，修筑城防、招纳义军，屡挫金军。' },
    { tag: '结果', title: '壮志未酬，呼过河而卒', description: '宗泽力请回銮不果，忧愤成疾，临终三呼过河而终。' }
  ],
  113323: [ // 岳飞抗金
    { tag: '起因', title: '金兵南犯，国难当头', description: '金兀术率军南征，南宋军情危急，岳飞挺身抗敌。' },
    { tag: '经过', title: '岳飞北伐，连战皆捷', description: '岳飞统岳家军北伐，克复襄阳六郡，连败金军，声威大振。' },
    { tag: '结果', title: '郾城大捷，直指汴京', description: '1140年郾城、颍昌大捷，金军胆寒，光复中原在望。' }
  ],
  113327: [ // 绍兴和议
    { tag: '起因', title: '秦桧主和，构陷良将', description: '秦桧力主和议，剥夺岳飞、韩世忠等兵权，议和金廷。' },
    { tag: '经过', title: '割地称臣，岁贡和议', description: '1141年宋金议和，宋称臣纳贡，以淮水、大散关为界。' },
    { tag: '结果', title: '偏安既定，北伐遂辍', description: '和议成后南宋偏安江南，北方恢复大业自此搁置。' }
  ],
  113328: [ // 岳飞遇害
    { tag: '起因', title: '莫须有之，罗织罪名', description: '秦桧以莫须有三字罗织罪名，构陷岳飞谋反。' },
    { tag: '经过', title: '风波亭狱，父子殒命', description: '1142年岳飞及其子岳云遇害于临安大理寺风波亭狱中。' },
    { tag: '结果', title: '千古奇冤，日后昭雪', description: '孝宗时平反昭雪，追封鄂王，岳飞精忠精神永耀史册。' }
  ],
  113334: [ // 开禧北伐
    { tag: '起因', title: '韩侂胄主战，锐意伐金', description: '权相韩侂胄力主伐金，发动开禧北伐，规复中原。' },
    { tag: '经过', title: '三路进兵，连遭挫败', description: '1206年宋军分道出击，但诸将不协、粮援不继，多路失利。' },
    { tag: '结果', title: '兵败请和，韩亦被诛', description: '韩侂胄被杀，宋金再议和，开禧北伐以失败告终。' }
  ],
  113337: [ // 蒙古灭金
    { tag: '起因', title: '蒙古崛起，金国倾颓', description: '蒙古铁骑连年伐金，金国南迁汴梁，国势日蹙。' },
    { tag: '经过', title: '宋蒙联兵，围困蔡州', description: '1234年宋蒙联军合围蔡州，金哀宗自缢，金朝灭亡。' },
    { tag: '结果', title: '唇亡齿寒，蒙锋转宋', description: '金亡后蒙古转而南下，南宋北面压力陡增，危在旦夕。' }
  ],
  113340: [ // 临安陷落
    { tag: '起因', title: '元军长驱，临安告急', description: '元军破襄阳后顺流东下，1276年兵临临安城下。' },
    { tag: '经过', title: '恭帝出降，南宋瓦解', description: '南宋太皇太后奉幼主出降，临安陷落，朝廷麇集南奔。' },
    { tag: '结果', title: '残部南遁，负隅一战', description: '陆秀夫、张世杰等拥幼帝南走，退守岭南做最后一搏。' }
  ],
  113341: [ // 崖山海战
    { tag: '起因', title: '宋室南遁，驻跸崖山', description: '1279年南宋流亡朝廷退至广东崖山，据险死守。' },
    { tag: '经过', title: '崖山海战，溃不成军', description: '元将张弘范率舰兜围，宋军水师大败，海战惨烈至极。' },
    { tag: '结果', title: '帝昺蹈海，宋祚终焉', description: '陆秀夫背幼帝跳海殉国，南宋覆亡，两宋三百二十载终结。' }
  ]
};

/* ---------- #5 泛化「关联」标签细化：按有序名字对覆盖为具体关系 ---------- */
const REL_FIX_113 = {
  // —— 北宋帝系 ——
  '赵匡胤|赵光义': '兄弟', '赵匡胤|赵恒': '祖孙', '赵光义|赵恒': '父子', '赵匡胤|赵祯': '祖孙',
  '赵恒|赵祯': '父子', '赵祯|赵顼': '祖孙', '赵顼|赵煦': '父子', '赵顼|赵佶': '叔侄',
  '赵佶|赵桓': '父子', '赵佶|赵构': '父子', '赵桓|赵构': '兄弟',
  '赵构|赵昚': '父子', '赵佶|赵构': '父子',
  // —— 北宋名臣同朝 ——
  '赵普|赵匡胤': '君臣', '赵普|赵光义': '君臣', '赵普|曹彬': '同僚',
  '寇准|赵恒': '君臣', '寇准|丁谓': '政敌', '寇准|王钦若': '政敌',
  '范仲淹|欧阳修': '同僚', '范仲淹|韩琦': '同僚', '范仲淹|富弼': '同僚', '范仲淹|包拯': '同僚',
  '欧阳修|韩琦': '同僚', '欧阳修|富弼': '同僚', '欧阳修|司马光': '师生', '欧阳修|苏轼': '师生',
  '王安石|司马光': '政敌', '王安石|文彦博': '政敌', '王安石|吕惠卿': '同僚', '王安石|章惇': '同僚',
  '司马光|苏轼': '同僚', '司马光|吕公著': '同僚', '司马光|范纯仁': '同僚',
  '苏轼|苏辙': '兄弟', '苏轼|苏洵': '父子', '苏辙|苏洵': '父子', '苏轼|黄庭坚': '师生', '苏轼|秦观': '师生',
  '赵顼|王安石': '君臣', '赵顼|司马光': '君臣', '赵顼|蔡京': '君臣', '赵顼|章惇': '君臣',
  '蔡京|赵佶': '君臣', '蔡京|章惇': '同僚', '蔡京|梁师成': '同僚',
  '李纲|赵构': '君臣', '李纲|宗泽': '同僚',
  // —— 南宋帝系与宰执 ——
  '赵构|秦桧': '君臣', '秦桧|岳飞': '敌对', '秦桧|韩世忠': '敌对', '韩世忠|岳飞': '同僚',
  '赵昚|虞允文': '君臣', '赵昚|史弥远': '君臣', '史弥远|韩侂胄': '政敌', '韩侂胄|赵昚': '君臣',
  '赵昀|贾似道': '君臣', '贾似道|文天祥': '敌对', '贾似道|孟珙': '政敌',
  // —— 抗金名将与临安 ——
  '韩世忠|岳飞': '同僚', '韩世忠|张俊': '同僚', '张俊|岳飞': '敌对', '吴玠|吴璘': '兄弟',
  '文天祥|陆秀夫': '同僚', '文天祥|张世杰': '同僚', '陆秀夫|张世杰': '同僚',
  // —— 文化思想 ——
  '欧阳修|梅尧臣': '同僚', '晏殊|欧阳修': '师生', '晏殊|晏几道': '父子', '柳永|晏殊': '同僚',
  '周敦颐|程颢': '师生', '周敦颐|程颐': '师生', '程颢|程颐': '兄弟', '朱熹|张栻': '师友', '朱熹|陆九渊': '师友',
  '朱熹|吕祖谦': '师友', '陆九渊|吕祖谦': '师友', '陆九渊|陆九龄': '兄弟', '真德秀|魏了翁': '同僚', '蔡元定|朱熹': '师生',
  // —— 科技 ——
  '沈括|苏颂': '同僚', '苏颂|毕昇': '同僚'
};
const REMOVE_REL_113 = new Set([
  // 无真实直接关系、由 BFS 自动补链产生的错误「关联」（跨时代/无交集人物误链）
  '苏东坡|金兀术', '赵匡胤|文天祥', '赵匡胤|忽必烈', '李白|苏轼', '杜甫|苏轼'
]);
const L1_TOPUP_113 = {
  '赵匡胤': [['赵普', '君臣'], ['曹彬', '君臣'], ['石守信', '臣属']],
  '赵光义': [['赵普', '君臣'], ['曹彬', '君臣']],
  '范仲淹': [['韩琦', '同僚'], ['富弼', '同僚'], ['欧阳修', '同僚']],
  '文天祥': [['陆秀夫', '同僚'], ['张世杰', '同僚']]
};

/* ---------- 归一化关系标签 ---------- */
function cleanRel(s) {
  return String(s || '关系').split('·')[0].trim() || '关系';
}
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

/* ---------- #3 补充 二级 narrative_relations（因缘际会） ---------- */
/* 说明：persons/events 引用的名字与事件均须为本数据集真实存在（sanitizeCurated 会过滤） */
const CURATED_113 = {
  // 自动 buildL2Graph 已能覆盖绝大多数二级人物；此处补充少数可能 <4 节点的关键二级
  '石守信': { persons: [['赵匡胤', '君臣'], ['王审琦', '同僚'], ['潘美', '同僚']], events: ['杯酒释兵权'] },
  '王审琦': { persons: [['赵匡胤', '君臣'], ['石守信', '同僚'], ['曹彬', '同僚']], events: ['杯酒释兵权'] },
  '潘美': { persons: [['赵匡胤', '君臣'], ['曹彬', '同僚'], ['杨业', '同僚']], events: ['统一南方战争'] },
  '王旦': { persons: [['赵恒', '君臣'], ['寇准', '同僚'], ['李沆', '同僚']], events: ['澶渊之盟'] },
  '吕端': { persons: [['赵光义', '君臣'], ['赵恒', '君臣'], ['吕蒙正', '同僚']], events: ['北宋建立'] },
  '吕蒙正': { persons: [['赵光义', '君臣'], ['吕端', '同僚'], ['李沆', '同僚']], events: ['北宋建立'] },
  '韩琦': { persons: [['范仲淹', '同僚'], ['欧阳修', '同僚'], ['富弼', '同僚']], events: ['庆历新政'] },
  '富弼': { persons: [['范仲淹', '同僚'], ['韩琦', '同僚'], ['欧阳修', '同僚']], events: ['辽宋和约'] },
  '吕惠卿': { persons: [['王安石', '同僚'], ['章惇', '同僚'], ['赵顼', '君臣']], events: ['王安石变法'] },
  '曾布': { persons: [['王安石', '同僚'], ['章惇', '同僚'], ['吕惠卿', '同僚']], events: ['王安石变法'] },
  '章惇': { persons: [['王安石', '同僚'], ['曾布', '同僚'], ['吕惠卿', '同僚']], events: ['王安石变法'] },
  '蔡确': { persons: [['王安石', '同僚'], ['章惇', '同僚'], ['曾布', '同僚']], events: ['元丰改制'] },
  '贾似道': { persons: [['赵昀', '君臣'], ['文天祥', '敌对'], ['孟珙', '政敌']], events: ['襄阳樊城之战'] },
  '张世杰': { persons: [['文天祥', '同僚'], ['陆秀夫', '同僚'], ['张弘范', '敌对']], events: ['崖山海战'] },
  '李庭芝': { persons: [['文天祥', '同僚'], ['姜才', '同僚'], ['张世杰', '同僚']], events: ['扬州保卫战'] },
  '姜才': { persons: [['李庭芝', '同僚'], ['文天祥', '同僚'], ['张世杰', '同僚']], events: ['临安陷落'] },
  '党进': { persons: [['赵匡胤', '君臣'], ['潘美', '同僚'], ['曹彬', '同僚']], events: ['统一南方战争'] },
  '苏洵': { persons: [['苏轼', '父子'], ['苏辙', '父子'], ['欧阳修', '同僚']], events: ['苏门文人活动'] },
  '种师中': { persons: [['种师道', '兄弟'], ['赵佶', '君臣'], ['宗泽', '同僚']], events: ['靖康之变'] },
  '陆九龄': { persons: [['陆九渊', '兄弟'], ['朱熹', '同门'], ['吕祖谦', '同门']], events: ['朱熹理学发展'] }
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
  const d = load(f113);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[SONG_TIMELINE_KEY] = SONG_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = SONG_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', SONG_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化（分阶段叙述） =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = SONG_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      ev.narratives = (ev.summary ? ev.summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).map(s => {
        let title = s.slice(0, 7).replace(/[，。；、,]+\s*$/, '');
        return { year: ev.start_year, tag: '经过', title: title || '史事始末', description: s };
      }).slice(0, 6) : []);
    }
  });
  console.log('  已应用分阶段叙述的事件数:', stageOk, '/', events.length);

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
    const topup = L1_TOPUP_113[p.name] || [];
    const have113 = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!have113.has(nm) && list.length < 6) { have113.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });

  // 移除自动补链(BFS indirect)产生的泛化标签（关联/关系/因缘），避免 check 报错
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !['关联', '关系', '因缘', '参与', '未知'].includes(r.relation)); });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级 narrative_relations（因缘际会）
  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_113);
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
  const fix = (a, b, cur) => REL_FIX_113[a + '|' + b] || REL_FIX_113[b + '|' + a] || cur;
  persons.forEach(p => (p.related_people || []).forEach(r => {
    if (REMOVE_REL_113.has(p.name + '|' + r.name) || REMOVE_REL_113.has(r.name + '|' + p.name)) { r._remove = true; removed++; return; }
    const nv = fix(p.name, r.name, r.relation);
    if (nv !== r.relation) { r.relation = nv; fixed++; }
  }));
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  events.forEach(ev => (ev.person_relations || []).forEach(r => {
    if (REMOVE_REL_113.has(r.source + '|' + r.target) || REMOVE_REL_113.has(r.target + '|' + r.source)) { r._remove = true; removed++; return; }
    const nv = fix(r.source, r.target, r.type);
    if (nv !== r.type) { r.type = nv; fixed++; }
  }));
  events.forEach(ev => { if (ev.person_relations) ev.person_relations = ev.person_relations.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  console.log('  已细化的关联关系数:', fixed, '；已移除的错误关联:', removed);

  save(f113, d);
  console.log('\n完成。');
}
module.exports = {};
main();