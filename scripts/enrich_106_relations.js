/**
 * 秦(dynasty_106)数据丰富脚本：
 *   #1 增加「历史脉络」宏观时间线(timelines)并为每条事件打上 timeline_id
 *   #2 为事件填充 related_persons / related_events（推荐人物/推荐事件）
 *   #3 为二级人物设置具体的「身份摘要+一句话定位」引语
 *   #4 丰富一级人物 related_people 与二级人物 narrative_relations（因缘际会/人际关系图）
 *   #5 细化「关联」泛化关系为确切基础关系（父子/宗亲/同僚/敌对等）
 * 用法: node scripts/enrich_106_relations.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_106.json');
function load() { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function save(o) { fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 秦宏观时间线（12 节点骨干） ---------- */
const QIN_TIMELINE_KEY = '秦并天下与二世而亡';
const QIN_TIMELINE = [
  { title: '秦灭六国', year: '前230—前221年', desc: '并吞六国', event_id: 106301 },
  { title: '秦始皇称皇帝', year: '前221年', desc: '皇帝肇始', event_id: 106301 },
  { title: '废分封、行郡县', year: '前221年', desc: '中央集权', event_id: 106302 },
  { title: '驰道修建', year: '前220年', desc: '车同轨', event_id: 106311 },
  { title: '秦始皇巡游与封禅', year: '前219年', desc: '巡行天下', event_id: 106308 },
  { title: '蒙恬北击匈奴', year: '前215年', desc: '北击匈奴', event_id: 106315 },
  { title: '秦长城修筑', year: '前215年', desc: '筑万里长城', event_id: 106310 },
  { title: '灵渠开凿', year: '前214年', desc: '通岭南', event_id: 106312 },
  { title: '焚书坑儒', year: '前213年', desc: '文化浩劫', event_id: 106318 },
  { title: '沙丘政变', year: '前210年', desc: '秦祚生变', event_id: 106319 },
  { title: '陈胜吴广起义', year: '前209年', desc: '大泽乡起义', event_id: 106323 },
  { title: '巨鹿之战', year: '前207年', desc: '秦军瓦解', event_id: 106325 },
  { title: '秦朝灭亡', year: '前207年', desc: '二世而亡', event_id: 106328 },
];

/* ---------- #3 二级人物引语（身份摘要+一句话定位） ---------- */
const LEVEL2_QUOTES_106 = {
  // —— 政治人物 ——
  '王绾': '秦朝丞相，秦统一后与李斯论争，力主于关东复行分封，主张以周制分封子弟，是郡县制之争中守旧一派的代表。',
  '隗状': '秦朝丞相，与王绾、李斯等并列秦廷最高执政集团，亲历秦统一后的制度建设与朝政决策。',
  '周青臣': '秦朝博士，在朝堂之上盛赞秦始皇统一功德，与淳于越针锋相对，成为焚书之议的导火索之一。',
  '冯毋择': '秦廷重臣，出身秦宗室，参与秦朝政权初期的政治建设与朝政运转。',
  '常頞': '秦朝中央与地方事务中的管理官吏，体现了秦朝严密郡县制度下的行政运作。',
  '赵亥': '秦宗室贵族，与赵高有宗亲之谊，在赵高专权时期的秦廷政治中卷入斗争。',
  '成': '秦朝宗室或公卿，作为秦廷成员亲历了秦朝由盛而衰的急剧转折。',
  '王戊': '王氏宗族成员，与王翦、王绾同宗，活跃于秦统一战争前后的秦廷。',
  '赵婴': '赵高宗亲，卷入赵高专权之下的秦廷权力倾轧。',
  '杨樛': '秦朝官吏，与王翦等重臣同朝为官，参与秦统一前后的朝政庶务。',
  '韩谈': '赵高亲信属吏，在秦末秦廷的权力倾轧中扮演角色。',
  '秦零陵令信': '秦朝零陵县令，是秦帝国以郡县制管理边远地区的地方官吏缩影。',
  '扶苏': '秦始皇长子，因谏阻坑儒被贬往上郡监军，仁孝而刚直，是秦朝储君之争中的悲剧主角。',
  '蒙毅': '蒙恬之弟，秦朝上卿，受秦始皇信任掌中枢机要，后为赵高构陷冤死。',
  '冯去疾': '秦朝右丞相，与李斯共同辅政，赵高专权时直谏秦二世而遭下狱赐死。',
  '冯劫': '冯去疾之子，秦朝将军，因反对秦二世与赵高的倒行逆施而含冤下狱。',
  '李由': '李斯长子，秦朝三川郡守，在秦末山东起兵时与起义军苦战而阵亡。',
  '公子高': '秦始皇之子，为免连累家人自请殉葬，以一人之死保全家族，是秦末悲剧的缩影。',
  '公子将闾': '秦始皇之子，因被秦二世猜忌，兄弟三人一同被逼自尽。',
  '赵成': '赵高之弟，任郎中令掌宫廷宿卫，在沙丘政变与赵高专权中协同作恶。',
  '赵佗': '秦南海郡龙川令，秦末割据岭南建立南越国，使秦之制度与文化在岭南延续传承。',
  '张耳': '秦末豪杰，陈胜起义时为赵地军事首领，后辅佐刘邦建汉，受封赵王。',
  '陈馀': '秦末豪杰，与张耳为刎颈之交，后反目成仇自立代王，终为汉军所灭。',
  // —— 秦军世家 / 军事人物 ——
  '蒙骜': '蒙氏将门的奠基者，历事秦昭襄王至秦始皇数朝，为秦开疆拓土的宿将。',
  '蒙武': '蒙骜之子、蒙恬蒙毅之父，率秦军攻灭楚国，是秦统一战争中的核心将领。',
  '李信': '秦始皇时期青年将领，伐楚时轻锐冒进而失利，后在灭燕之战中建功。',
  '内史腾': '秦朝内史、京畿最高长官，曾主持灭韩，是秦统一战略的关键执行者。',
  '杨端和': '秦始皇时期将领，参与灭楚等统一战争，为秦并天下效力。',
  '辛胜': '秦将，参与秦灭六国的统一战争战线。',
  '羌瘣': '秦将，曾率军攻赵，是秦统一战争中的前线将领。',
  '杨熊': '秦末将领，率秦军抗击起义军，后在王离军中效力。',
  '王离': '王翦之孙、王贲之子，率北军东下平叛，在巨鹿之战中为项羽所败被俘。',
  '司马欣': '章邯部将，曾任栎阳狱掾，巨鹿战败后随章邯一起降楚。',
  '董翳': '章邯部将，随章邯降楚，秦亡后被西楚分封为翟王。',
  '涉间': '王离部将，巨鹿之战中坚守不降，城破自焚殉国。',
  '屠睢': '秦将，率大军征伐百越，开拓岭南道的先锋，后为越人袭杀。',
  '任嚣': '秦南海尉，平定桂林、南海、象郡并治理岭南，是南越割据的实际奠基者。',
  '陈胜': '秦末农民起义领袖，与吴广在大泽乡振臂首义，自号陈王，敲响了秦亡的丧钟。',
  '吴广': '陈胜起义的战友与副手，同为大泽乡起义的发动者，助陈胜建立张楚政权。',
  '周文': '陈胜麾下大将，率起义军逾函谷关直逼咸阳，旋因孤军受挫而兵败身死。',
  // —— 思想人物 ——
  '淳于越': '秦博士，力主分封以存万世之业，其「事不师古」的锥论直接引燃了焚书之争。',
  '叔孙通': '秦博士，秦亡后归汉为之制朝仪，是秦火之后儒学得以存续并重振的关键人物。',
  '孔鲋': '孔子九世孙，秦焚书之际冒死将家藏《尚书》等典籍藏于壁中，护经以待来者。',
  '伏生': '秦博士，秦焚书后凭记忆传《尚书》二十九篇，是先秦典籍在秦火后薪火相传的关键人物。',
  // —— 文化人物 ——
  '程邈': '秦狱吏，狱中创隶书以应徒隶书写的便捷之需，是秦汉书体剧烈变革的代表人物。',
  '侯生': '秦始皇求仙所用方士，与卢生相谋后逃匿，其言行激化了始皇的坑儒之举。',
  '卢生': '秦始皇求仙方士，献「亡秦者胡」之谶，与侯生相商后遁逃，促成坑儒之变。',
  // —— 科技人物 ——
  '史禄': '秦朝监禄，主持开凿灵渠，连通湘江与漓江，为秦征百越打通了水运命脉。',
};

/* ---------- #4 二级「因缘际会」手动兜底（关系稀少者的历史关联） ---------- */
/* 说明：persons/events 引用的名字与事件均须为本数据集真实存在（sanitizeCurated 会过滤） */
const CURATED_106 = {
  '王绾': { persons: [['秦始皇（嬴政）', '君臣'], ['李斯', '同僚'], ['王翦', '同朝']], events: ['废分封、行郡县'] },
  '隗状': { persons: [['王绾', '同朝'], ['冯去疾', '同朝'], ['李斯', '同朝']], events: ['建立三公九卿制度'] },
  '常頞': { persons: [['秦始皇（嬴政）', '君臣'], ['蒙恬', '同僚']], events: ['岭南郡县设置', '秦军征服百越'] },
  '成': { persons: [['秦始皇（嬴政）', '宗亲'], ['李斯', '同朝'], ['王绾', '同朝']], events: ['建立三公九卿制度'] },
  '杨樛': { persons: [['王翦', '同僚'], ['王绾', '同僚'], ['秦始皇（嬴政）', '君臣']], events: ['统一度量衡'] },
  '秦零陵令信': { persons: [['秦始皇（嬴政）', '君臣'], ['李斯', '同朝'], ['常頞', '同僚']], events: ['废分封、行郡县'] },
  '李由': { persons: [['李斯', '父子'], ['秦始皇（嬴政）', '君臣'], ['赵高', '敌对']], events: ['章邯镇压起义军', '陈胜吴广起义'] },
  '公子高': { persons: [['秦始皇（嬴政）', '父子'], ['秦二世（胡亥）', '兄弟'], ['公子将闾', '兄弟'], ['扶苏', '兄弟']], events: ['望夷宫之变'] },
  '公子将闾': { persons: [['秦始皇（嬴政）', '父子'], ['秦二世（胡亥）', '兄弟'], ['公子高', '兄弟']], events: ['望夷宫之变'] },
  '赵成': { persons: [['赵高', '兄弟'], ['韩谈', '同党'], ['赵婴', '同族']], events: ['赵高专权', '沙丘政变'] },
  '蒙骜': { persons: [['蒙武', '父子'], ['蒙恬', '祖孙'], ['王翦', '同僚']], events: ['蒙恬北击匈奴'] },
  '蒙武': { persons: [['蒙骜', '父子'], ['蒙恬', '父子'], ['蒙毅', '父子'], ['王翦', '同僚']], events: ['秦军征服百越'] },
  '内史腾': { persons: [['秦始皇（嬴政）', '君臣'], ['王翦', '同僚'], ['李斯', '同僚']], events: ['秦军征服百越'] },
  '叔孙通': { persons: [['秦始皇（嬴政）', '君臣'], ['李斯', '同僚'], ['孔鲋', '同门']], events: ['焚书坑儒'] },
  '冯毋择': { persons: [['秦始皇（嬴政）', '宗亲'], ['冯去疾', '同族'], ['李斯', '同朝']], events: ['建立三公九卿制度'] },
  '周青臣': { persons: [['淳于越', '论政'], ['李斯', '同朝'], ['秦始皇（嬴政）', '君臣']], events: ['焚书坑儒'] },
  '王戊': { persons: [['王翦', '宗亲'], ['王绾', '宗亲'], ['王贲', '同族']], events: [] },
  '赵亥': { persons: [['赵高', '宗亲'], ['赵婴', '宗亲'], ['赵成', '同族']], events: ['赵高专权'] },
  '赵婴': { persons: [['赵高', '宗亲'], ['赵亥', '宗亲'], ['赵成', '同族']], events: ['赵高专权'] },
  '韩谈': { persons: [['赵高', '同僚'], ['赵成', '同党'], ['赵婴', '同族']], events: ['赵高专权', '望夷宫之变'] },
  '冯劫': { persons: [['冯去疾', '父子'], ['李斯', '同僚'], ['赵高', '敌对']], events: ['李斯之死'] },
  '杨熊': { persons: [['章邯', '同僚'], ['王离', '同僚'], ['司马欣', '同僚']], events: ['章邯镇压起义军'] },
  '司马欣': { persons: [['章邯', '同僚'], ['董翳', '同僚'], ['杨熊', '同僚']], events: ['巨鹿之战'] },
  '董翳': { persons: [['章邯', '同僚'], ['司马欣', '同僚'], ['王离', '同僚']], events: ['巨鹿之战', '陈胜吴广起义'] },
  '涉间': { persons: [['王离', '同僚'], ['章邯', '同僚'], ['司马欣', '同僚']], events: ['巨鹿之战'] },
  '辛胜': { persons: [['王翦', '同僚'], ['王贲', '同僚'], ['秦始皇（嬴政）', '君臣']], events: ['秦军征服百越'] },
  '羌瘣': { persons: [['王翦', '同僚'], ['李信', '同僚'], ['杨端和', '同僚']], events: ['秦军征服百越'] },
};

/* ---------- #6 事件经过（分阶段叙述，标题/内容去重，多节点） ---------- */
/* 按事件 id 键控：title 为简明阶段标题（黑体），description 为阶段详情（灰体），tag 为阶段类型 */
const QIN_EVENT_STAGES = {
  106301: [
    { tag: '起因', title: '扫灭六国，天下一统', description: '前230年至前221年，秦先后兼并韩、赵、魏、楚、燕、齐，结束了战国数百年的割据混战，完成统一大业。' },
    { tag: '改名', title: '采皇采帝，自号皇帝', description: '秦王政认为「王」号不足以彰其功业，取「三皇五帝」之意，自号「皇帝」，并自称「朕」，开皇帝尊号之先。' },
    { tag: '定位', title: '独尊天下，集权于一身', description: '规定皇帝自称「朕」、命曰「制」、令曰「诏」，皇权的至高无上与神圣不可侵犯由此确立。' },
    { tag: '影响', title: '皇帝制度肇始', description: '皇帝称号与皇权体系自此成为两千余年封建帝制的根本，始皇帝的尊称亦流传后世。' }
  ],
  106302: [
    { tag: '起因', title: '廷议天下，分封之争', description: '统一之初，朝中就如何治理辽阔疆土展开辩论，丞相王绾主张沿袭周制分封诸王。' },
    { tag: '论争', title: '李斯力主郡县', description: '廷尉李斯以「分封必重蹈周室衰微」上谏，主张废分封、行郡县，将地方权力收归中央。' },
    { tag: '决策', title: '始皇帝定策', description: '秦始皇采纳李斯之议，废分封而设郡县，把全国划为三十六郡，郡下设县，官吏皆由中央任免。' },
    { tag: '影响', title: '中央集权之基', description: '郡县制以官僚政治取代贵族政治，使政令直达地方，成为后世两千余年政治体制的基石。' }
  ],
  106303: [
    { tag: '起因', title: '新朝需新制', description: '统一后，秦始皇着手建立一套系统的中央官僚体系，以革除宗法分封下的旧官制。' },
    { tag: '设三公', title: '三公分权制衡', description: '设置丞相总揽政务、太尉掌军事、御史大夫掌监察，三者互不隶属、直达皇帝。' },
    { tag: '置九卿', title: '九卿各司其职', description: '在三分以下分设奉常、郎中令、卫尉、太仆、廷尉等九卿，分掌礼仪、宿卫、司法、财政等具体政务。' },
    { tag: '影响', title: '官制垂范后世', description: '三公九卿组成中央最高行政中枢，使国家机器运转有序，为后世封建王朝长期沿用。' }
  ],
  106304: [
    { tag: '起因', title: '言异声、文异形', description: '六国文字形体各异、书写混乱，严重阻碍政令传达与文化交流，亟需划一。' },
    { tag: '改制', title: '定小篆为国字', description: '丞相李斯主持，以秦国文字为基础简化字形、统一笔画，颁行全国，定为官方标准字体小篆。' },
    { tag: '佐证', title: '刻石立其标准', description: '巡游途中的泰山、琅琊等刻石皆以小篆勒铭，小篆遂成为大一统政令的标志性书体。' },
    { tag: '影响', title: '书同文，文脉相通', description: '统一文字加强了各地区思想与行政的认同，对中华文化传承与统一影响极为深远。' }
  ],
  106305: [
    { tag: '起因', title: '钱币纷杂难行', description: '战国诸侯货币形制、轻重各异，阻碍商品流通与赋税征收，亟需统一币制。' },
    { tag: '改制', title: '铸半两为本位', description: '由中央统一铸造圆形方孔「半两钱」，废除六国旧币，作为全国通行的法定货币。' },
    { tag: '施行', title: '商路由此而通', description: '铜钱形制、重量整齐划一，便利交易与征税，促进了全国统一市场的形成。' },
    { tag: '影响', title: '方圆之制流传', description: '圆形方孔钱成为此后两千余年中国铜钱的通行样式，其制度影响深远。' }
  ],
  106306: [
    { tag: '起因', title: '丈量与斗斛不一', description: '战国各国尺度、升斗、斤两标准各异，赋税征纳与商贸往来多有龃龉。' },
    { tag: '颁定', title: '定标准、颁天下', description: '由中央制定统一的尺寸、斗斛、斤两标准，颁行全国，命各级官府一体遵行。' },
    { tag: '验证', title: '制器以为凭证', description: '制作标准度量衡器具颁付各县，标准器与诏版成为执行统一制度的凭据。' },
    { tag: '影响', title: '征纳有度、国计有常', description: '度量衡统一规范了赋税与交易，强化了国家对财政的掌控，是秦制统一的重要一环。' }
  ],
  106307: [
    { tag: '起因', title: '以法为治、以刑为威', description: '秦始皇尊崇法家思想，把推行统一而严苛的秦律作为巩固统治的根本国策。' },
    { tag: '立法', title: '综六国而定律', description: '在商鞅变法基础上系统编定律令，条文遍及田律、仓律、工律、盗贼、徭役诸方面。' },
    { tag: '施行', title: '天下遵之如式', description: '以秦律统一适用全国，废除六国旧法，一切「皆有法式」，政令整齐划一。' },
    { tag: '影响', title: '严酷而天下怨', description: '秦律虽使政令有序，但条文苛酷、刑罚酷烈，滥用严刑也加剧了民间的积怨。' }
  ],
  106308: [
    { tag: '起因', title: '宣威天下、镇抚六国', description: '为彰显统一武功、镇压关东残余反抗并考察地方政务，秦始皇多次大规模巡行天下。' },
    { tag: '东巡', title: '东临齐鲁、行封禅', description: '前219年始皇帝东巡，登泰山举行封禅大礼，祭祀天地，昭示君权受命于天。' },
    { tag: '刻石', title: '勒石纪功、昭告四海', description: '沿途于峄山、泰山、琅琊等处刻石立碑，记述统一功业，宣示新的统治秩序。' },
    { tag: '影响', title: '威加海内、靡费不赀', description: '巡游封禅既震慑六国遗民，又因仪仗浩大、耗资巨万，为后世所评议。' }
  ],
  106309: [
    { tag: '起因', title: '笃信神仙方术', description: '秦始皇迷信追求长生不老，对方士之术趋之若鹜，急于求得仙药。' },
    { tag: '遣使', title: '遣徐福入海', description: '遣方士徐福率童男女数千人并携五谷百工，入海求访蓬莱、方丈、瀛洲三神山与仙药。' },
    { tag: '出海', title: '海上仙山不得', description: '徐福一党入海数年终不得仙药，遂借口受阻一去不归，据传东渡至日本。' },
    { tag: '影响', title: '海上传说远播', description: '徐福航海虽未求得仙药，却成为中日文化往来与「徐福东渡」传说的源头。' }
  ],
  106310: [
    { tag: '起因', title: '胡骑屡犯北疆', description: '北方匈奴乘战国之乱日强，屡屡南下掳掠，直接威胁秦之北境安宁。' },
    { tag: '修筑', title: '蒙恬率众筑城', description: '命大将蒙恬率三十万大军，将战国秦、赵、燕三国的北长城加以连接、重修加固。' },
    { tag: '成城', title: '西起临洮、东达辽东', description: '长城凭山据险蜿蜒万里，构成北方的一道坚固军事屏障，史称万里长城。' },
    { tag: '影响', title: '御胡而役苦民焦', description: '长城在一定程度上抵御了匈奴，但役使民夫数十万、劳役苛重，加深了社会矛盾。' }
  ],
  106311: [
    { tag: '起因', title: '帝业需通衢', description: '为便于政令通达、军旅转输与货物往来，秦始皇下令修筑以咸阳为中心的驰道。' },
    { tag: '修建', title: '驰道天下纵横', description: '驰道东通燕齐、南达吴楚，路面坚实宽阔，中央御道、两旁植树立标，规制宏大。' },
    { tag: '配套', title: '直道北贯边塞', description: '另修直道北达九原，贯通南北，以应北御匈奴的军事之需。' },
    { tag: '影响', title: '车同轨而政达四方', description: '驰道、直道的兴建实现「车同轨」，大大便利了帝国治理、军制与物资流通。' }
  ],
  106312: [
    { tag: '起因', title: '南征需转输', description: '为保障征伐岭南的秦军兵马粮草转运，须开辟连接长江与珠江水系的通道。' },
    { tag: '开凿', title: '监禄督凿灵渠', description: '由监御史禄主持，在兴安穿山凿渠，巧妙利用湘漓落差设闸引水。' },
    { tag: '通航', title: '湘漓相接、漕运以通', description: '灵渠建成沟通湘漓二水，中原船只可直抵岭南，粮秣军资远道而来。' },
    { tag: '影响', title: '岭南自此归一', description: '灵渠保障了征百越的胜利，也促进了岭南开发与南北经济文化交融。' }
  ],
  106313: [
    { tag: '起因', title: '务炫帝王威仪', description: '秦始皇志在彰显一统之威，于咸阳大起宫室，以标榜帝国的强盛气象。' },
    { tag: '营建', title: '阿房巍峨、工役浩繁', description: '于渭南大规模营建阿房宫，宫殿壮丽，征发刑徒民夫数十万日夜兴作。' },
    { tag: '苦役', title: '力役频仍、民不堪命', description: '加上长城、驰道、皇陵诸大役，徭役繁重、赋敛无度，四海百姓苦不堪言。' },
    { tag: '结局', title: '宫未成而国先亡', description: '阿房宫未来得及完工，秦朝便告灭亡，宏丽宫室终化尘土与史家之叹。' }
  ],
  106314: [
    { tag: '起因', title: '即位居安、营陵自广', description: '秦始皇即位后即着手营造规模空前的陵墓，以冀死后仍享帝王尊荣。' },
    { tag: '修建', title: '骊山巨冢、穿地三泉', description: '于骊山脚下修建皇陵，动用民夫数十万，穿三泉、下铜致椁，极尽奢华。' },
    { tag: '陈设', title: '地宫珍宝、兵俑拱卫', description: '陵内设百官位次、藏奇珍异宝，并置规模宏大的兵马俑坑，陪侍始皇帝于地下。' },
    { tag: '影响', title: '厚葬劳民、终成暴征', description: '皇陵历时三十余年、耗费巨大，秦亡未久即遭火焚，成为奢靡暴政的象征。' }
  ],
  106315: [
    { tag: '起因', title: '匈奴并为北患', description: '匈奴趁战国纷乱日益强盛，屡犯秦北境，掠夺边地、威胁国家安宁。' },
    { tag: '征伐', title: '蒙恬率师北击', description: '秦始皇命大将蒙恬率三十万大军北伐，收复河南地，将匈奴击退至阴山以远。' },
    { tag: '戍守', title: '筑城设郡、充实边地', description: '蒙恬戍守上郡，修筑长城并置九原郡，迁徙戍卒充实边塞，巩固北方防线。' },
    { tag: '影响', title: '胡不敢南下而牧马', description: '秦军北击使北方边境一度宁靖，蒙恬「威震匈奴」之名流传后世。' }
  ],
  106316: [
    { tag: '起因', title: '略定岭南、拓土千里', description: '为开拓疆土、扩大版图，秦始皇遣大军大举南征百越地区。' },
    { tag: '进军', title: '五十万军分五路', description: '派屠睢率五十万大军分五路南下，深入岭南，与当地越人展开长期较量。' },
    { tag: '转折', title: '主帅遇害、师出受挫', description: '越人凭险顽抗，屠睢遭袭殒命，秦军一度受挫，后经增援方徐徐推进。' },
    { tag: '结果', title: '岭南归入秦版图', description: '秦军最终征服百越，置桂林、南海、象郡，把岭南正式纳入帝国的版图。' }
  ],
  106317: [
    { tag: '起因', title: '百越既平、设治安民', description: '秦征服百越后，为有效治理岭南新地，着手在当地建立行政建置。' },
    { tag: '设郡', title: '置南海、桂林、象郡', description: '在当地分设南海、桂林、象郡三郡，委派官吏治理，推行郡县制。' },
    { tag: '徙民', title: '谪戍中原与越杂居', description: '迁谪中原人与罪徒戍守岭南，与越人杂居通婚，促进民族与文化交融。' },
    { tag: '影响', title: '岭南纳入统一体系', description: '郡县设置使岭南进入统一国家的行政体系，为后世岭南开发奠定基础。' }
  ],
  106318: [
    { tag: '起因', title: '师古与吏政之争', description: '前213年博士淳于越主张恢复分封，丞相李斯痛斥其「师古」妄议，引发朝堂论争。' },
    { tag: '焚书', title: '禁私学、焚典籍', description: '秦始皇采纳李斯之议，下令除秦纪、医药、卜筮、种树之书外，尽焚民间所藏《诗》《书》与百家之言。' },
    { tag: '坑儒', title: '方士生变、坑杀儒生', description: '前212年方士侯生、卢生非议皇帝后亡去，始皇大怒，追查坑杀相关儒生方士四百六十余人。' },
    { tag: '影响', title: '思想一统、亦招千古之讥', description: '焚书坑儒钳制思想、摧残典籍，是秦始皇暴政的标志，对文化与后世影响极深。' }
  ],
  106319: [
    { tag: '起因', title: '千秋巡游、暴崩沙丘', description: '前210年秦始皇第五次东巡，中途病逝于沙丘，遗诏本欲传位于长子扶苏。' },
    { tag: '密谋', title: '赵高李斯矫诏', description: '中车府令赵高与丞相李斯合谋，矫诏逼死扶苏、蒙恬，拥立胡亥为二世皇帝。' },
    { tag: '得逞', title: '胡亥袭位、赵高得志', description: '胡亥即位后赵高执掌大权，秦之最高权力由此落入阴谋私党之手。' },
    { tag: '影响', title: '秦祚由此而变', description: '沙丘政变改变了秦的继承格局，加速了王朝的崩溃，是秦亡的关键转折。' }
  ],
  106320: [
    { tag: '起因', title: '拥立有功、渐揽大权', description: '沙丘政变后赵高因拥立之功深得宠信，随即染指并把持朝政。' },
    { tag: '弄权', title: '指鹿为马、震慑朝堂', description: '赵高当廷指鹿为马以试探群臣，凡不顺从者尽遭清除，朝野震惧而莫敢直言。' },
    { tag: '诛戮', title: '罗织构陷、排除异己', description: '他构陷诛杀李斯等重臣，大举清洗朝臣宗室，秦廷上下人人自危。' },
    { tag: '影响', title: '纲纪废弛、忠良尽去', description: '赵高专权令秦中央政权腐败混乱、贤能尽去，为秦末大乱埋下祸根。' }
  ],
  106321: [
    { tag: '起因', title: '相权与宦权交恶', description: '李斯位极人臣，与赵高渐生嫌隙，赵高蓄意构陷，使二世猜忌李斯。' },
    { tag: '构陷', title: '罗织谋反之罪', description: '赵高以其子李由防守三川不力为由，将李斯下狱，攀引「谋反」罪名严刑拷讯。' },
    { tag: '被杀', title: '含冤腰斩、身死族灭', description: '李斯屈打成招，前208年被腰斩于咸阳并夷三族，临刑上疏终不能自明。' },
    { tag: '影响', title: '朝纲独断、秦政瓦解', description: '李斯之死铲除朝中仅存能制衡赵高之力，中央政治进一步崩坏。' }
  ],
  106322: [
    { tag: '起因', title: '关东大乱、秦军败退', description: '秦末群雄并起、关东大乱，秦军节节败退，赵高恐罪责及身而谋自保。' },
    { tag: '逼宫', title: '围望夷宫、迫帝逊位', description: '赵高命女婿阎乐兵围望夷宫，逼迫秦二世退位，胡亥被迫自杀。' },
    { tag: '转立', title: '立子婴、旋诛赵高', description: '胡亥死后赵高改立子婴为王，子婴随即设计诛杀赵高，结束了赵高之乱。' },
    { tag: '影响', title: '秦廷彻底分裂', description: '望夷宫之变后统治集团彻底分裂，帝国中枢名存实亡，灭亡已不可逆转。' }
  ],
  106323: [
    { tag: '起因', title: '大雨误期、惧法当斩', description: '前209年戍卒陈胜、吴广被征往渔阳戍边，至大泽乡遇大雨误期，按秦律当斩。' },
    { tag: '发难', title: '斩木为兵、揭竿而起', description: '二人遂发动戍卒起义，高呼「王侯将相宁有种乎」，攻占大泽乡。' },
    { tag: '燎原', title: '张楚立号、义军并起', description: '起义迅速席卷关东，陈胜自立为王国号张楚，六国旧族亦纷纷响应。' },
    { tag: '影响', title: '首义亡秦之先声', description: '陈胜吴广起义揭开秦末农民战争序幕，虽遭镇压，却为秦亡奏响了前奏。' }
  ],
  106324: [
    { tag: '起因', title: '义军蜂起、关东告急', description: '陈胜吴广起义后关东反秦力量迅速壮大，秦廷急需派重兵东出镇压。' },
    { tag: '用兵', title: '章邯受命统军', description: '少府章邯临危受命，率军出击，先破周文，再击各路义军，屡战屡胜。' },
    { tag: '连捷', title: '一时力挽危局', description: '章邯一度镇压义军、稳住关中，使风雨飘摇的秦朝在军事上暂得喘息。' },
    { tag: '影响', title: '勇将难扶将倾之厦', description: '章邯虽勇，然秦廷内外已病入膏肓，其胜利终究挽回不了秦亡之局。' }
  ],
  106325: [
    { tag: '起因', title: '秦军围赵于巨鹿', description: '章邯率秦军主力围攻赵地巨鹿，赵王歇乞救，诸侯军皆畏秦而不敢援。' },
    { tag: '出战', title: '项羽破釜沉舟', description: '项羽率楚军北上，渡河后破釜沉舟、以示决死，以少击众猛攻秦军。' },
    { tag: '决战', title: '九战九捷、秦师瓦解', description: '楚军九战皆捷，王离所部被歼被俘，章邯退走，秦之主力精锐自此瓦解。' },
    { tag: '影响', title: '秦亡已成定局', description: '巨鹿之战是秦末战局的转折点，秦朝丧失最精锐军事力量，灭亡无可挽回。' }
  ],
  106326: [
    { tag: '起因', title: '楚军两路伐秦', description: '项羽鏖战巨鹿之际，刘邦率楚军另一路西进，志在率先入关、夺取咸阳。' },
    { tag: '用计', title: '绕函谷、出武关', description: '刘邦采纳谋士之策，避开秦军重兵把守的函谷关，经武关迁回西进。' },
    { tag: '兵临', title: '蓝田再战、秦廷求和', description: '兵临蓝田，连战皆捷渐迫咸阳，秦廷上下无力抵抗、局势急转直下。' },
    { tag: '影响', title: '先入咸阳、约法三章', description: '刘邦率先进入关中并与百姓约法三章，为其日后楚汉相争赢得主动。' }
  ],
  106327: [
    { tag: '起因', title: '大兵压境、国势垂危', description: '刘邦大军迫近咸阳，秦朝中央政权已无力组织抵抗，统治濒临崩溃。' },
    { tag: '平乱', title: '临危诛赵高', description: '子婴即位后，先设计诛杀权臣赵高，以正法度、安朝局，然败局已定。' },
    { tag: '出降', title: '素车白马、奉玺以降', description: '秦王子婴乘白车素马、以绳系颈，奉传国玉玺于轵道旁出降刘邦。' },
    { tag: '影响', title: '秦代至此终结', description: '子婴出降标志着秦朝正式灭亡，盛极一时的大一统帝国二世而亡。' }
  ],
  106328: [
    { tag: '起因', title: '严刑酷役、积弊深重', description: '秦统一后严刑峻法、大兴土木、赋役苛重，社会矛盾迅速激化。' },
    { tag: '爆发', title: '烽烟遍起关东', description: '陈胜吴广首义后，山东各地反秦武装风起云涌，秦政权摇摇欲坠。' },
    { tag: '瓦解', title: '主力覆灭、军溃土崩', description: '巨鹿之战秦军主力尽丧，章邯降楚，秦军土崩瓦解、再无回天之力。' },
    { tag: '结局', title: '二世而亡、教训千古', description: '秦王子婴降汉，秦自前221年统一至前207年灭亡，仅历二世十五年而终。' }
  ]
};

/* 归一化关系标签：去掉历史遗留的 ·因缘 叠缀 */
function cleanRel(s) { const base = (s || '').split('·')[0].trim(); return base || '关联'; }
const REL_SET = {
  '君臣': 1, '敌对': 1, '同盟': 1, '盟友': 1, '师生': 1, '继承': 1, '亲属': 1,
  '对手': 1, '朋友': 1, '兄弟': 1, '同朝': 1, '影响': 1, '交流': 1, '关联': 1,
  '父子': 1, '宗亲': 1, '同僚': 1, '政敌': 1, '同门': 1
};
const REL_PRIORITY = {
  '父子': 12, '君臣': 12, '敌对': 11, '同盟': 11, '盟友': 10, '师生': 10, '亲属': 10,
  '兄弟': 9, '继承': 9, '政敌': 9, '对手': 9, '宗亲': 8, '同僚': 7, '同门': 7,
  '影响': 7, '交流': 5, '关联': 2
};
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

/* 兜底数据只保留数据集真实存在的名字/事件，避免引入脏节点 */
function sanitizeCurated(raw) {
  const personNames = new Set(raw.persons.map(p => p.name));
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED_106).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => personNames.has(nm));
    const events = (spec.events || []).filter(en => eventNames.has(en));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

function main() {
  const d = load();
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const curated = sanitizeCurated(d);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[QIN_TIMELINE_KEY] = QIN_TIMELINE;
  events.forEach(ev => { ev.timeline_id = QIN_TIMELINE_KEY; });
  console.log('  timeline节点', QIN_TIMELINE.length, '；已为', events.length, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化（分阶段叙述，标题/内容去重，多节点） =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = QIN_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      // 每个阶段含独立标题（黑体）与正文（灰体），避免此前标题=正文的重复
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      // 兜底：按句子切分，标题为空以便前端只看正文（不对应具体事件已由 #6 全覆盖）
      ev.narratives = (ev.summary ? ev.summary.split(/。/).map(s => s.trim()).filter(Boolean).map(s => ({ year: ev.start_year, tag: '经过', title: '', description: s })).slice(0, 6) : []);
    }
  });
  console.log('  已细化事件经过的事件数:', stageOk, '/', events.length);

  // 事件人名集合（共享给 #2/#4）
  const evNameSet = e => new Set([
    ...(e.person_relations || []).flatMap(r => { const s = []; if (r.source) s.push(r.source); if (r.target) s.push(r.target); return s; }),
    ...(e.person_groups?.leaders || []).map(x => x.name),
    ...(e.person_groups?.participants || []).map(x => x.name),
    ...(e.person_groups?.opponents || []).map(x => x.name),
    ...(e.person_groups?.affected || []).map(x => x.name),
  ]);
  const evPersonSet = new Map();
  events.forEach(ev => { evPersonSet.set(ev.id, evNameSet(ev)); });
  const personEvents = new Map(); // name -> Set<eventId>
  events.forEach(ev => evPersonSet.get(ev.id).forEach(n => { if (nameSet.has(n)) { if (!personEvents.has(n)) personEvents.set(n, new Set()); personEvents.get(n).add(ev.id); } }));

  // 人物邻接
  const adjAll = new Map();
  const linkA = (a, b, rel) => { if (!nameSet.has(a) || !nameSet.has(b) || a === b) return; if (!adjAll.has(a)) adjAll.set(a, new Map()); if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel); };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  const degA = nm => (adjAll.get(nm) || new Map()).size;

  console.log('\n===== #2 推荐人物 / 推荐事件 =====');
  let rp = 0, re = 0;
  events.forEach(ev => {
    const names = evNameSet(ev);
    const relatedPersons = [...names].filter(n => nameSet.has(n)).slice(0, 12);
    ev.related_persons = relatedPersons;
    const mine = new Set(names);
    const scored = [];
    events.forEach(o => {
      if (o.id === ev.id) return;
      let share = 0; evPersonSet.get(o.id).forEach(n => { if (mine.has(n)) share++; });
      if (share > 0) scored.push({ name: o.name, share });
    });
    scored.sort((a, b) => b.share - a.share);
    QIN_TIMELINE.forEach(t => { if (t.event_id !== ev.id && !scored.some(s => s.name === t.title)) scored.push({ name: t.title, share: 0 }); });
    ev.related_events = scored.slice(0, 6).map(s => s.name).filter(n => n !== ev.name);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 人物关系图 =====');
  const evByName = new Map(); // name -> Set<eventName>
  events.forEach(ev => {
    evPersonSet.get(ev.id).forEach(n => { if (nameSet.has(n)) { if (!evByName.has(n)) evByName.set(n, new Set()); evByName.get(n).add(ev.name); } });
  });
  const evRoleByName = new Map(); // name -> Map(事件名 -> 角色标签)
  events.forEach(ev => {
    const roleOf = (arr, label) => (arr || []).forEach(x => { if (!x.name) return; if (!evRoleByName.has(x.name)) evRoleByName.set(x.name, new Map()); evRoleByName.get(x.name).set(ev.name, label); });
    roleOf(ev.person_groups?.leaders, '主导');
    roleOf(ev.person_groups?.participants, '参与');
    roleOf(ev.person_groups?.opponents, '对抗');
    roleOf(ev.person_groups?.affected, '受影响');
  });
  const bfsPersons = (center, maxCount) => {
    const direct = new Map(), visited = new Set([center]);
    const q = [[center, 0]];
    while (q.length) {
      const [cur, dep] = q.shift();
      if (dep >= 2 || direct.size >= maxCount) break;
      for (const [nb, rel] of (adjAll.get(cur) || new Map())) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        if (dep === 0) direct.set(nb, rel);
        q.push([nb, dep + 1]);
        if (direct.size >= maxCount) break;
      }
    }
    return direct;
  };

  // 一级 related_people 扩充
  let l1ok = 0;
  persons.filter(p => (p.level || 1) === 1).forEach(p => {
    const merged = new Map();
    (p.related_people || []).forEach(r => { if (r && r.name) merged.set(r.name, (merged.get(r.name) || 0) + 1); });
    events.forEach(ev => evPersonSet.get(ev.id).forEach(n => { if (n !== p.name && nameSet.has(n)) merged.set(n, (merged.get(n) || 0) + 1); }));
    const list = [...merged.entries()].map(([nm, count]) => ({
      name: nm, relation: cleanRel(adjAll.get(nm)?.get(p.name) || '同朝'), influence: Math.min(95, 55 + count * 8)
    })).sort((a, b) => b.influence - a.influence);
    if (list.length < 6) {
      const have = new Set(list.map(x => x.name));
      [...bfsPersons(p.name, 8).entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => {
        if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '同朝', influence: 60 }); }
      });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级因缘际会
  const curatedUsed = [0];
  const buildL2Graph = (p) => {
    const center = p.name;
    const N = new Map(), E = new Map();
    const addN = (name, type, size) => { if (!N.has(name)) N.set(name, { name, type, size: size || (type === 'person' ? (name === center ? 'large' : 'medium') : 'small') }); };
    const addE = (s, t, label) => { const k = [s, t].sort().join('|'); if (s !== t && !E.has(k)) E.set(k, { source: s, target: t, label, direction: 'forward' }); };
    addN(center, 'person', 'large');
    const cand = new Map();
    for (const [nb, rel] of (adjAll.get(center) || new Map())) { const r = cleanRel(rel); if (REL_REAL.has(r)) cand.set(nb, r); }
    [...cand.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel], i) => { addN(nm, 'person', i < 4 ? 'medium' : 'small'); addE(center, nm, rel); });
    const evRoles = evRoleByName.get(center) || new Map();
    for (const [en, rel] of evRoles) { if (N.size >= 7) break; addN(en, 'event', 'small'); addE(center, en, rel); }
    const personNodes = [...N.keys()].filter(nm => nm !== center && N.get(nm).type === 'person');
    const pairs = [];
    for (let i = 0; i < personNodes.length; i++) for (let j = i + 1; j < personNodes.length; j++) {
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
      curatedUsed[0]++;
    }
    return { nodes: [...N.values()], edges: [...E.values()] };
  };
  let l2ok = 0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p=>p.level===2).length, '；手动兜底:', curatedUsed[0]);

  console.log('\n===== #3 二级人物引语 =====');
  let q = 0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const quote = LEVEL2_QUOTES_106[p.name];
    if (quote) { p.summary = quote; q++; }
  });
  console.log('  二级人物引语更新:', q, '/', persons.filter(p=>p.level===2).length);

  console.log('\n===== #5 关系细化（去除泛化「关联/关系」） =====');
  const REL_FIX_106 = {
    // 血亲 / 姻亲 / 宗亲
    '秦始皇（嬴政）>>子婴': '宗亲',
    '子婴>>秦始皇（嬴政）': '宗亲',
    '王翦>>王贲': '父子',
    '王贲>>王翦': '父子',
    '王翦>>王绾': '宗亲',
    '王绾>>王翦': '宗亲',
    '王翦>>王戊': '宗亲',
    '王戊>>王翦': '宗亲',
    '蒙恬>>蒙武': '父子',
    '蒙武>>蒙恬': '父子',
    '蒙骜>>蒙武': '父子',
    '蒙武>>蒙骜': '父子',
    '冯毋择>>冯去疾': '宗亲',
    '冯去疾>>冯毋择': '宗亲',
    // 敌对 / 政争
    '李斯>>赵高': '敌对',
    '赵高>>李斯': '敌对',
    '赵高>>赵亥': '宗亲',
    '赵亥>>赵高': '宗亲',
    '赵高>>赵婴': '宗亲',
    '赵婴>>赵高': '宗亲',
  };
  // 剩余仍落在泛化标签（关联/关系/因缘）的，一律兜底为「同朝」（同一朝代共事，客观可考）
  const BAN = new Set(['关联', '因缘', '关系']);
  let fixed = 0, swept = 0;
  persons.forEach(p => {
    (p.related_people || []).forEach(rp => {
      const k = `${p.name}>>${rp.name}`;
      if (REL_FIX_106[k]) { rp.relation = REL_FIX_106[k]; fixed++; return; }
      const r = (rp.relation || '').split('·')[0].trim();
      if (BAN.has(r)) { rp.relation = '同朝'; swept++; }
    });
  });
  console.log('  关系细化(关联→具体):', fixed, '；泛化→同朝兜底:', swept);

  save(d);
  console.log('\n完成。');
}
main();
module.exports = {};