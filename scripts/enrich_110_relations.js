/**
 * 晋南北朝(dynasty_110)数据丰富脚本（对齐 enrich_109_relations.js）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   #5 泛化「关联」关系细化
 *   #6 事件经过分阶段叙述（关键事件手写，其余自动切分）
 * 用法: node scripts/enrich_110_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f110 = path.join(DIR, 'dynasty_110.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 晋南北朝历史脉络宏观时间线（10节点骨干） ---------- */
const JINB_TIMELINE_KEY = '晋南北朝兴衰';
const JINB_TIMELINE = [
  { title: '西晋建立', year: '265年', desc: '司马氏代魏', event_id: 110325 },
  { title: '西晋灭吴', year: '280年', desc: '短促的一统', event_id: 110301 },
  { title: '八王之乱', year: '291年', desc: '宗室内耗', event_id: 110302 },
  { title: '永嘉之乱', year: '311年', desc: '衣冠南渡', event_id: 110303 },
  { title: '东晋建立', year: '317年', desc: '偏安江左', event_id: 110328 },
  { title: '淝水之战', year: '383年', desc: '北府决胜', event_id: 110310 },
  { title: '刘裕代晋', year: '420年', desc: '南朝宋建立', event_id: 110331 },
  { title: '北魏迁都洛阳', year: '494年', desc: '孝文汉化改革', event_id: 110337 },
  { title: '侯景之乱', year: '548年', desc: '江南浩劫', event_id: 110322 },
  { title: '北周灭北齐', year: '577年', desc: '北朝统一', event_id: 110324 },
];

/* ---------- #6 事件经过分阶段叙述（关键事件手写，含独立标题/正文） ---------- */
const JINB_EVENT_STAGES = {
  110325: [ // 西晋建立
    { tag: '起因', title: '三马食曹，权柄尽归', description: '司马懿父子相继把持魏政，魏帝沦为傀儡，代魏立晋之势已不可逆转。' },
    { tag: '经过', title: '司马炎受禅，建晋代魏', description: '266年司马炎受魏元帝曹奂禅让，即皇帝位，定都洛阳，建立西晋。' },
    { tag: '结果', title: '三分去一，晋室定鼎', description: '西晋建立时蜀已灭、吴未服，司马氏开启重新统一天下的进程。' }
  ],
  110301: [ // 西晋灭吴
    { tag: '起因', title: '晋兴兵伐吴，志在混一', description: '西晋经羊祜多年谋划筹备，于279年冬大举兴兵伐吴，志在完成统一。' },
    { tag: '经过', title: '六路并进，直捣建业', description: '晋军分多路自长江上中下游同时进击，王濬水师顺流而下攻占江陵武昌。' },
    { tag: '结果', title: '孙皓出降，三分归晋', description: '280年晋军兵临建业，吴主孙皓出降，三国分裂局面至此彻底终结，天下一统。' }
  ],
  110302: [ // 八王之乱
    { tag: '起因', title: '惠帝暗弱，贾后专权', description: '晋惠帝愚弱，皇后贾南风与外戚弄权，宗室诸王对中央权力虎视眈眈。' },
    { tag: '经过', title: '诸王相争，轮番主政', description: '赵王司马伦起兵病乱，齐王冏、成都王颖、河间王颙相继入洛，互相攻伐。' },
    { tag: '转折', title: '战火绵延，国力大耗', description: '诸王混战波及洛阳关中河北，长期内战严重消耗西晋国力民力。' },
    { tag: '结果', title: '宗室凋零，晋室日衰', description: '八王之乱使西晋政权迅速衰弱，为永嘉之乱埋下覆亡伏笔。' }
  ],
  110303: [ // 永嘉之乱
    { tag: '起因', title: '八王混战，胡骑南下', description: '八王之乱耗竭晋室，匈奴刘渊乘机起兵，北方诸胡纷扰南下。' },
    { tag: '经过', title: '洛阳陷没，怀帝被掳', description: '311年石勒攻陷洛阳，晋怀帝被俘，洛阳宫室焚毁殆尽。' },
    { tag: '结果', title: '衣冠南渡，西晋将亡', description: '永嘉之乱使中原大乱，大批士民南迁，西晋统治土崩瓦解。' }
  ],
  110304: [ // 刘曜灭西晋
    { tag: '起因', title: '怀帝遇害，愍帝继立', description: '怀帝遇害后，司马邺在长安即位，是为愍帝，晋室垂危。' },
    { tag: '经过', title: '长安被围，晋室出降', description: '刘曜率汉赵军长驱入关，围攻长安，城中粮尽援绝。' },
    { tag: '结果', title: '愍帝出降，西晋灭亡', description: '316年愍帝出降，西晋灭亡。中原尽为胡族所占，华北大乱。' }
  ],
  110328: [ // 东晋建立
    { tag: '起因', title: '晋室南渡，典午中兴', description: '永嘉之乱后，司马睿在王导辅佐下渡江至建康，网罗南迁士族。' },
    { tag: '经过', title: '司马睿称帝，建元建武', description: '317年西晋亡后，司马睿在建康即晋王位，明年称帝，史称东晋。' },
    { tag: '结果', title: '偏安江左，南北对峙', description: '东晋据长江以南与北方诸政权长期对峙，王导等共理国政、王与马共天下。' }
  ],
  110310: [ // 淝水之战
    { tag: '起因', title: '苻坚南征，志在一统', description: '前秦苻坚统一北方后，尽起倾国之兵南下，欲一举荡平东晋。' },
    { tag: '经过', title: '谢玄破阵，北府扬威', description: '晋将谢玄率北府兵在淝水列阵，苻坚下令后撤以诱敌。' },
    { tag: '转折', title: '草木皆兵，风声鹤唳', description: '秦军后撤时一退而不可止，晋军乘势渡水猛攻，秦军全线崩溃。' },
    { tag: '结果', title: '北方分裂，南北对峙', description: '淝水战败后前秦土崩瓦解，北方重陷分裂，南北对峙格局得以延续。' }
  ],
  110309: [ // 前秦灭前燕
    { tag: '起因', title: '苻坚图燕，王猛主谋', description: '苻坚任用王猛厉行改革后国力大盛，前燕内乱衰乱，时机成熟。' },
    { tag: '经过', title: '王猛兴兵，连克燕地', description: '370年王猛统军东征，连战连捷，攻克前燕重镇门户。' },
    { tag: '结果', title: '慕容暐出降，燕亡', description: '王猛攻陷前燕都城邺，慕容暐出降，前燕灭亡，北方大部归一。' }
  ],
  110308: [ // 桓温北伐
    { tag: '起因', title: '桓温掌兵，志在立功', description: '桓温凭借荆州兵权，屡次上表请战，志在收复中原以立威名。' },
    { tag: '经过', title: '三度用兵，几至长安洛阳', description: '桓温先后三次北伐，曾兵临长安灞上、收复洛阳，震动北方。' },
    { tag: '结果', title: '粮援不继，功亏一篑', description: '因粮道不济、后援断绝，三次北伐皆半途而废，未能巩固战果。' }
  ],
  110322: [ // 侯景之乱
    { tag: '起因', title: '降将离心，祸生肘腋', description: '北朝降将侯景受梁武帝厚遇，心怀不满，在寿阳举兵叛乱。' },
    { tag: '经过', title: '建康被围，江南糜烂', description: '侯景渡江攻建康，台城被围十月而陷，梁武帝困饿而死。' },
    { tag: '转折', title: '江左诸镇，乘乱争据', description: '萧氏诸王拥兵观望、互相猜忌，江南陷入军阀混战。' },
    { tag: '结果', title: '江南大乱，梁室衰微', description: '侯景之乱屠戮江南士庶，梁朝元气大伤，不久为陈霸先所代建陈。' }
  ],
  110331: [ // 刘裕代晋
    { tag: '起因', title: '桓玄簒晋，刘裕起兵', description: '桓玄废晋自立，刘裕于京口起兵讨伐，兴复东晋。' },
    { tag: '经过', title: '刘裕灭桓，专擅朝权', description: '刘裕平桓玄后总揽军政，北灭南燕后秦，威望一时无两。' },
    { tag: '结果', title: '受禅代晋，刘宋建立', description: '420年刘裕受晋恭帝禅让称帝，建立南朝宋，东晋覆亡。' }
  ],
  110337: [ // 北魏迁都洛阳
    { tag: '起因', title: '孝文图治，欲行汉化', description: '孝文帝拓跋宏为全面汉化、摆脱旧贵阻力，决意迁都中原。' },
    { tag: '经过', title: '假南伐之名，定迁都之策', description: '493年孝文帝佯称南伐，率众南行至洛阳后驻驾不返，遂定迁都之议。' },
    { tag: '结果', title: '都洛立制，汉化大进', description: '迁都洛阳后禁胡语胡服、改汉姓，与汉士通婚，北魏逐步融入华夏。' }
  ],
  110336: [ // 孝文帝改革
    { tag: '起因', title: '文武并兴，革旧图新', description: '北魏立国渐老，胡汉矛盾深重，孝文帝与冯太后先后推行改革。' },
    { tag: '经过', title: '颁均田、立三长、行汉化', description: '颁布均田制、三长制，迁都改制，全面吸收中原制度文化。' },
    { tag: '结果', title: '胡汉交融，国势鼎盛', description: '孝文帝改革促进民族融合，北魏国力进入鼎盛，影响南北格局。' }
  ],
  110319: [ // 河阴之变
    { tag: '起因', title: '胡后专权，政乱民困', description: '北魏后期胡太后临朝弄权，朝政腐败，六镇军事贵族怨声载道。' },
    { tag: '经过', title: '尔朱荣举兵，屠虐朝士', description: '528年尔朱荣以清君侧之名入洛，在河阴纵兵屠杀朝臣百官两千余人。' },
    { tag: '结果', title: '迁政元魏，神器动摇', description: '河阴之变屠戮士族元老，北魏权威扫地，国势急转直下。' }
  ],
  110324: [ // 北周灭北齐
    { tag: '起因', title: '齐政衰乱，周主图强', description: '北齐末主昏暴、上下离心，北周武帝宇文邕独揽朝纲、整军经武。' },
    { tag: '经过', title: '宇文邕亲征，连破齐军', description: '576年北周大军东进，攻陷晋阳、邺城，北齐诸军望风披靡。' },
    { tag: '结果', title: '北齐灭亡，北方复统', description: '577年北齐亡，北方重归统一，北周国力达到颠峰。' }
  ],
};

/* ---------- #5 泛化「关联」标签细化：按有序名字对覆盖为具体关系 ---------- */
const REL_FIX_110 = {
  // —— 西晋/东晋皇室世系 ——
  '司马昭|司马炎': '父子', '司马炎|司马衷': '父子',
  '司马越|司马炽': '兄弟', '司马炽|司马邺': '叔侄',
  '司马睿|司马绍': '父子', '司马绍|司马昱': '兄弟',
  '司马昱|司马曜': '父子', '司马曜|司马德宗': '父子',
  // —— 王谢玉谢士族 ——
  '王导|王敦': '堂兄弟', '王导|王羲之': '叔侄', '王羲之|王献之': '父子',
  '王献之|王徽之': '兄弟', '王羲之|王徽之': '父子',
  '谢安|谢玄': '叔侄', '谢安|谢琰': '父子',
  '谢玄|谢灵运': '曾祖孙', '谢安|谢道韫': '同族',
  // —— 竹林七贤 ——
  '嵇康|阮籍': '同游', '嵇康|山涛': '绝交', '嵇康|刘伶': '同游',
  '阮籍|刘伶': '同游', '阮籍|向秀': '同游', '嵇康|向秀': '同游',
  '向秀|山涛': '同僚',
  // —— 平吴/北伐名将 ——
  '羊祜|杜预': '继任', '羊祜|王濬': '同僚', '杜预|王濬': '同僚',
  '王濬|陶侃': '同僚', '祖逖|刘琨': '闻鸡起舞',
  '庾亮|桓温': '同僚', '桓温|桓玄': '父子',
  '谢玄|刘裕': '同幕', '刘裕|谢晦': '君臣',
  // —— 五胡十六国 ——
  '刘渊|刘曜': '同族', '石勒|石虎': '叔侄', '石虎|石遵': '父子',
  '苻坚|王猛': '君臣', '苻坚|慕容垂': '君臣',
  '慕容垂|慕容恪': '兄弟', '慕容垂|慕容儁': '兄弟', '慕容恪|慕容儁': '兄弟',
  '姚兴|鸠摩罗什': '君臣',
  // —— 南朝帝王世系 ——
  '刘裕|刘义隆': '父子', '刘义隆|刘义康': '兄弟',
  '萧衍|萧统': '父子', '萧衍|萧纲': '父子', '萧衍|萧绎': '父子', '萧衍|萧誉': '父子',
  '萧道成|萧鸾': '同族', '陈霸先|陈祎': '父子',
  '王僧辩|陈霸先': '政敌',
  // —— 北朝皇室世系 ——
  '拓跋珪|拓跋焘': '祖孙', '拓跋焘|拓跋宏': '父子',
  '冯太后|拓跋宏': '祖母',
  '高欢|高澄': '父子', '高欢|高洋': '父子', '高浩|高澄': '兄弟', '高澄|高洋': '兄弟',
  '宇文泰|宇文毓': '父子', '宇文泰|宇文邕': '父子', '宇文毓|宇文邕': '兄弟',
  '高欢|高演': '父子', '高欢|高湛': '父子', '高演|高湛': '兄弟',
  '高颎|杨坚': '君臣', '杨坚|独孤信': '姻亲',
  // —— 文化思想人物间的师承/并称 ——
  '王弼|何晏': '师徒', '裴秀|张华': '同僚',
  '杨坚|高颎': '君臣',
  '郦道元|贾思勰': '同乡',
  // ===== 一级人物 related_people 中 padding 产生的「关联」全部细化为具体关系 =====
  // —— 司马氏/晋皇室 ——
  '司马衷|贾南风': '夫妻', '司马衷|司马伦': '宗族', '司马衷|司马颖': '兄弟',
  '司马衷|杨芷': '母子', '司马衷|司马冏': '宗族', '司马衷|司马颙': '宗族',
  // —— 西晋重臣 ——
  '杜预|杜锡': '父子', '杜预|贾充': '同僚',
  '裴秀|司马衷': '君臣', '裴秀|贾南风': '君臣', '裴秀|贾充': '同僚', '裴秀|司马伦': '君臣', '裴秀|杨骏': '同僚', '裴秀|卫瓘': '同僚',
  '左思|司马衷': '君臣', '左思|杜预': '同朝', '左思|贾南风': '君臣', '左思|贾充': '同僚', '左思|司马颖': '君臣',
  // —— 东晋世族 ——
  '王敦|王羲之': '同族', '庾亮|庾冰': '兄弟', '庾亮|庾翼': '兄弟',
  '祖逖|祖约': '兄弟', '桓温|桓冲': '兄弟', '桓温|庾翼': '姻亲',
  '谢玄|谢琰': '兄弟', '谢玄|谢道韫': '兄妹',
  '刘裕|何无忌': '同僚', '王羲之|王敦': '同族',
  // —— 与东晋名士同朝（魏晋科技/佛学人物 padding） ——
  '葛洪|王导': '同朝', '葛洪|谢安': '同朝', '葛洪|庾亮': '同朝', '葛洪|桓温': '同朝',
  '法显|谢玄': '同朝', '法显|鸠摩罗什': '同流', '法显|谢灵运': '同朝', '法显|刘毅': '同朝', '法显|何无忌': '同朝',
  // —— 十六国政权世系与对立 ——
  '刘渊|刘聪': '父子', '刘渊|张华': '同朝', '刘渊|贾南风': '君臣', '刘渊|石虎': '敌对', '刘渊|司马睿': '敌对',
  '王猛|谢玄': '敌对', '王猛|谢安': '敌对', '王猛|王导': '敌对', '王猛|庾亮': '敌对', '王猛|陶侃': '敌对',
  '慕容垂|慕容皝': '父子', '慕容垂|慕容宝': '父子', '慕容垂|慕容德': '同族',
  '姚兴|姚泓': '父子', '姚兴|谢玄': '敌对', '姚兴|拓跋焘': '敌对', '姚兴|苻坚': '君臣',
  '赫连勃勃|赫连昌': '父子',
  // —— 南朝帝王世系 ——
  '刘义隆|刘义真': '兄弟', '萧衍|萧宏': '兄弟',
  '范缜|侯景': '敌对', '范缜|陶弘景': '同朝', '范缜|陈庆之': '同朝', '范缜|萧纲': '君臣',
  '萧统|萧纲': '兄弟', '萧统|萧绎': '兄弟', '萧统|萧子显': '同族',
  '侯景|萧统': '敌对', '侯景|范缜': '敌对', '侯景|萧纲': '君臣', '侯景|萧绎': '敌对',
  '陈霸先|陈顼': '同族', '陈庆之|萧统': '君臣', '陈庆之|宇文泰': '敌对', '陈庆之|高欢': '敌对', '陈庆之|陈霸先': '同朝', '陈庆之|范缜': '同朝',
  // —— 北朝皇室世系 ——
  '拓跋珪|拓跋嗣': '父子', '拓跋焘|拓跋嗣': '父子', '冯太后|冯熙': '兄妹', '拓跋宏|元勰': '兄弟',
  '宇文泰|宇文护': '宗族',
  '高洋|高演': '兄弟', '高洋|高湛': '兄弟', '高洋|高长恭': '叔侄',
  '杨坚|杨忠': '父子', '杨坚|高洋': '敌对', '杨坚|高长恭': '敌对', '杨坚|高欢': '敌对',
  // —— 文化思想人物 ——
  '阮籍|阮咸': '叔侄',
  '陶弘景|王羲之': '同流', '陶弘景|陶侃': '同族', '陶弘景|司马睿': '同朝', '陶弘景|侯景': '敌对',
  '刘勰|萧衍': '君臣', '刘勰|陶弘景': '同朝', '刘勰|萧子良': '同僚', '刘勰|萧纲': '君臣', '刘勰|萧绎': '君臣',
  '谢灵运|谢惠连': '叔侄', '谢灵运|谢晦': '同族', '谢灵运|谢琰': '同族',
  '高长恭|高澄': '父子', '高长恭|高演': '叔侄', '高长恭|高湛': '叔侄',
  '郦道元|崔浩': '同朝', '贾思勰|拓跋焘': '同朝', '贾思勰|宇文泰': '同朝',
};

// 无真实关系、由 BFS 自动补链产生的错误「关联」，直接移除
const REMOVE_REL_110 = new Set([
  '王弼|拓跋宏',       // 相距数百年无干系
  '郦道元|高洋', '郦道元|高演', // 北魏人强行连北齐
  '贾思勰|宇文邕', '贾思勰|高欢', '贾思勰|高长恭', // 北魏农学家连北齐/北周
  '姚兴|刘义隆',       // 后秦与刘宋帝不同期
  '法显|刘义隆',       // 法显归国在东晋、刘义隆为宋帝
  '杨坚|宇文泰',       // 不相遇
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
const CURATED_110 = {
  // —— 西晋文士与政治人物 ——
  '王戎': { persons: [['嵇康', '同游'], ['阮籍', '同游'], ['山涛', '同游']], events: ['竹林名士活动'] },
  '潘岳': { persons: [['陆机', '同僚'], ['陆云', '同僚'], ['石崇', '同僚'], ['张华', '同僚']], events: ['太康之治'] },
  '陆机': { persons: [['陆云', '兄弟'], ['潘岳', '同僚'], ['张华', '同僚']], events: ['太康之治'] },
  '陆云': { persons: [['陆机', '兄弟'], ['潘岳', '同僚'], ['张华', '同僚']], events: ['太康之治'] },
  '卫恒': { persons: [['卫瓘', '父子'], ['卫玠', '兄弟'], ['张华', '同僚']], events: ['八王之乱'] },
  '贾充': { persons: [['司马炎', '君臣'], ['贾南风', '父女'], ['荀勖', '同僚']], events: ['西晋建立'] },
  '贾南风': { persons: [['贾充', '父女'], ['司马衷', '夫妻'], ['张华', '政敌']], events: ['八王之乱'] },
  '杨骏': { persons: [['司马衷', '外戚'], ['贾南风', '政敌'], ['司马亮', '政敌']], events: ['八王之乱'] },
  '石崇': { persons: [['潘岳', '同僚'], ['贾充', '党附'], ['王恺', '对手']], events: ['太康之治'] },
  '荀勖': { persons: [['贾充', '同僚'], ['张华', '政敌'], ['裴秀', '同僚']], events: ['西晋建立'] },
  '王浑': { persons: [['王濬', '同僚'], ['羊祜', '同僚'], ['杜预', '同僚']], events: ['西晋灭吴'] },
  '司马伦': { persons: [['贾南风', '政敌'], ['司马衷', '宗族'], ['石崇', '政敌']], events: ['八王之乱'] },
  // —— 东晋士族与文士 ——
  '谢道韫': { persons: [['谢安', '叔侄'], ['王献之', '姻亲'], ['王徽之', '姻亲']], events: ['《世说新语》成书'] },
  '王献之': { persons: [['王羲之', '父子'], ['谢道韫', '姻亲'], ['王徽之', '兄弟']], events: ['《兰亭序》创作'] },
  '王徽之': { persons: [['王羲之', '父子'], ['王献之', '兄弟'], ['谢道韫', '姻亲']], events: ['《兰亭序》创作'] },
  '桓冲': { persons: [['桓温', '兄弟'], ['谢安', '同僚'], ['谢玄', '同僚']], events: ['淝水之战'] },
  '郗鉴': { persons: [['王导', '同僚'], ['庾亮', '同僚'], ['陶侃', '同僚']], events: ['东晋建立'] },
  '殷浩': { persons: [['桓温', '政敌'], ['王羲之', '姻亲'], ['庾亮', '同僚']], events: ['桓温北伐'] },
  '谢万': { persons: [['谢安', '兄弟'], ['桓温', '同僚'], ['谢玄', '叔侄']], events: ['桓温北伐'] },
  '庾冰': { persons: [['庾亮', '兄弟'], ['王导', '同僚'], ['何充', '同僚']], events: ['东晋建立'] },
  '何充': { persons: [['王导', '同僚'], ['庾冰', '同僚'], ['司马昱', '君臣']], events: ['东晋建立'] },
  '谢朗': { persons: [['谢安', '兄弟'], ['谢道韫', '叔侄'], ['王献之', '姻亲']], events: ['《世说新语》成书'] },
  // —— 南朝文士 ——
  '谢惠连': { persons: [['谢灵运', '堂兄弟'], ['鲍照', '并称'], ['江淹', '同僚']], events: ['山水诗兴盛'] },
  '谢朓': { persons: [['谢灵运', '同族'], ['沈约', '同僚'], ['范云', '同僚']], events: ['山水诗兴盛'] },
  '鲍照': { persons: [['谢惠连', '并称'], ['谢灵运', '并称'], ['刘义庆', '同僚']], events: ['山水诗兴盛'] },
  '江淹': { persons: [['沈约', '同僚'], ['范云', '同僚'], ['谢朓', '同僚']], events: ['《山居赋》'] },
  '范云': { persons: [['沈约', '同僚'], ['谢朓', '同僚'], ['江淹', '同僚']], events: ['永明体'] },
  '徐陵': { persons: [['庾信', '并称'], ['萧纲', '君臣'], ['萧统', '同僚']], events: ['《文选》编纂'] },
  '庾信': { persons: [['徐陵', '并称'], ['萧纲', '君臣'], ['萧绎', '君主'], ['王褒', '同僚']], events: ['江陵之战'] },
  '裴松之': { persons: [['裴骃', '同族'], ['萧统', '同僚'], ['刘义隆', '君臣']], events: ['《宋书》编纂'] },
  '范晔': { persons: [['刘义隆', '君臣'], ['谢灵运', '同僚'], ['沈约', '同流']], events: ['《后汉书》成书'] },
  '魏收': { persons: [['崔鸿', '同僚'], ['刘义隆', '同僚'], ['拓跋宏', '君臣']], events: ['《宋书》编纂'] },
  '萧子显': { persons: [['萧统', '兄弟'], ['萧衍', '父祖'], ['裴松之', '同流']], events: ['《宋书》编纂'] },
  // —— 北朝重臣 ——
  '崔浩': { persons: [['拓跋焘', '君臣'], ['拓跋嗣', '君臣'], ['高允', '同僚']], events: ['北魏统一北方'] },
  '李冲': { persons: [['冯太后', '君臣'], ['拓跋宏', '君臣'], ['王肃', '同僚']], events: ['北魏迁都洛阳'] },
  '王肃': { persons: [['拓跋宏', '君臣'], ['李冲', '同僚'], ['裴松之', '同族']], events: ['北魏迁都洛阳'] },
  '冯熙': { persons: [['冯太后', '兄弟'], ['拓跋宏', '外戚'], ['拓跋嗣', '宗室']], events: ['北魏迁都洛阳'] },
  '尔朱荣': { persons: [['元子攸', '君臣'], ['高欢', '部属'], ['尔朱兆', '宗族']], events: ['河阴之变'] },
  '尔朱兆': { persons: [['尔朱荣', '宗族'], ['高欢', '部属'], ['元子攸', '政敌']], events: ['河阴之变'] },
  '高澄': { persons: [['高欢', '父子'], ['高洋', '兄弟'], ['孝静帝', '君臣']], events: ['东魏建立'] },
  '高洋': { persons: [['高欢', '父子'], ['高澄', '兄弟'], ['高颎', '同僚']], events: ['北齐建立'] },
  '斛律光': { persons: [['高洋', '君臣'], ['高湛', '君臣'], ['段韶', '同僚'], ['韦孝宽', '敌对']], events: ['玉璧之战'] },
  '段韶': { persons: [['高洋', '君臣'], ['斛律光', '同僚'], ['高演', '君臣']], events: ['玉璧之战'] },
  '宇文护': { persons: [['宇文泰', '宗族'], ['宇文毓', '政敌'], ['宇文邕', '政敌']], events: ['北周六镇'] },
  '韦孝宽': { persons: [['斛律光', '敌对'], ['宇文邕', '君臣'], ['杨坚', '同僚']], events: ['玉璧之战'] },
  '杨忠': { persons: [['杨坚', '父子'], ['宇文泰', '君臣'], ['独孤信', '同僚']], events: ['玉璧之战'] },
  // —— 佛学思想人物 ——
  '支遁': { persons: [['王羲之', '同游'], ['谢安', '同游'], ['慧远', '同流']], events: ['佛教南传'] },
  '道生': { persons: [['鸠摩罗什', '师徒'], ['僧肇', '同门'], ['慧远', '同流']], events: ['佛教南传'] },
  '僧肇': { persons: [['鸠摩罗什', '师徒'], ['道生', '同门'], ['道融', '同门']], events: ['鸠摩罗什译经'] },
  '竺法护': { persons: [['道安', '同门'], ['法显', '同流'], ['鸠摩罗什', '同流']], events: ['佛教南传'] },
  '佛陀跋陀罗': { persons: [['法显', '同流'], ['道生', '同流'], ['僧肇', '同流']], events: ['佛教南传'] },
  '道融': { persons: [['鸠摩罗什', '师徒'], ['僧肇', '同门'], ['道生', '同门']], events: ['鸠摩罗什译经'] },
  '何晏': { persons: [['王弼', '师徒'], ['挚虞', '同流'], ['夏侯玄', '同流']], events: ['正始玄风'] },
  '向秀': { persons: [['嵇康', '同游'], ['阮籍', '同游'], ['山涛', '同游']], events: ['竹林名士活动'] },
  '刘伶': { persons: [['嵇康', '同游'], ['阮籍', '同游'], ['山涛', '同游']], events: ['竹林名士活动'] },
  '山涛': { persons: [['嵇康', '同游'], ['阮籍', '同游'], ['向秀', '同游']], events: ['竹林名士活动'] },
  // —— 文艺科技 ——
  '谢灵运': { persons: [['谢惠连', '兄弟'], ['颜延之', '并称'], ['谢朓', '同族']], events: ['山水诗兴盛'] },
  '傅玄': { persons: [['杜预', '同僚'], ['张华', '同僚'], ['司马炎', '君臣']], events: ['太康之治'] },
  '卫瓘': { persons: [['杜预', '同僚'], ['羊祜', '同僚'], ['司马炎', '君臣'], ['卫恒', '父子']], events: ['西晋灭吴'] },
  '高颎': { persons: [['杨坚', '君臣'], ['韦孝宽', '同僚'], ['高洋', '宗族']], events: ['杨坚受禅'] },
  '庾翼': { persons: [['庾亮', '兄弟'], ['王导', '同僚'], ['陶侃', '同僚']], events: ['东晋建立'] },
  '徐羡之': { persons: [['刘裕', '君臣'], ['刘义隆', '政敌'], ['谢晦', '同僚'], ['檀道济', '同僚']], events: ['元嘉北伐'] },
  '萧子良': { persons: [['萧道成', '祖父'], ['萧衍', '同族'], ['沈约', '同僚'], ['王俭', '同僚']], events: ['《宋书》编纂'] },
  '王俭': { persons: [['萧道成', '君臣'], ['萧衍', '同僚'], ['沈约', '同僚'], ['萧子良', '同僚']], events: ['《宋书》编纂'] },
  '徐勉': { persons: [['萧衍', '君臣'], ['沈约', '同僚'], ['徐陵', '同族'], ['萧统', '同僚']], events: ['《文选》编纂'] },
  '萧宏': { persons: [['萧衍', '兄弟'], ['萧统', '叔侄'], ['侯景', '政敌'], ['陈霸先', '政敌']], events: ['侯景之乱'] },
  '朱异': { persons: [['萧衍', '君臣'], ['侯景', '政敌'], ['萧纲', '君臣'], ['萧统', '同僚']], events: ['侯景之乱'] },
  '徐陵': { persons: [['庾信', '并称'], ['萧纲', '君臣'], ['萧统', '同僚'], ['徐勉', '同族']], events: ['《文选》编纂'] },
  '王褒': { persons: [['庾信', '兄弟'], ['萧绎', '君臣'], ['王筠', '同族']], events: ['江陵之战'] },
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
  const d = load(f110);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[JINB_TIMELINE_KEY] = JINB_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = JINB_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', JINB_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  console.log('\n===== #6 事件经过细化（分阶段叙述） =====');
  let stageOk = 0;
  events.forEach(ev => {
    const stages = JINB_EVENT_STAGES[ev.id];
    if (stages && Array.isArray(stages) && stages.length) {
      ev.narratives = stages.map(s => ({ year: ev.start_year, tag: s.tag, title: s.title, description: s.description }));
      stageOk++;
    } else {
      ev.narratives = (ev.summary ? ev.summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).map(s => ({ year: ev.start_year, tag: '经过', title: '', description: s })).slice(0, 6) : []);
    }
  });
  console.log('  已应用分阶段叙述的事件数:', stageOk, '/', events.length);

  // ---- 关键人物补全：Excel人事关系表缺失部分事件的关键人物，导致四类全空 ----
  // （晋南北朝数据经查无四类全空的事件，暂不补全）
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
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级 narrative_relations（因缘际会） —— 自动生成：核心人物 + 有真实关系的邻居 + 事件
  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_110);
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
    return REL_FIX_110[a + '|' + b] || REL_FIX_110[b + '|' + a] || cur;
  };
  persons.forEach(p => (p.related_people || []).forEach(r => {
    if (REMOVE_REL_110.has(p.name + '|' + r.name) || REMOVE_REL_110.has(r.name + '|' + p.name)) { r._remove = true; removed++; return; }
    const nv = fix(p.name, r.name, r.relation);
    if (nv !== r.relation) { r.relation = nv; fixed++; }
  }));
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  events.forEach(ev => (ev.person_relations || []).forEach(r => {
    if (REMOVE_REL_110.has(r.source + '|' + r.target) || REMOVE_REL_110.has(r.target + '|' + r.source)) { r._remove = true; removed++; return; }
    const nv = fix(r.source, r.target, r.type);
    if (nv !== r.type) { r.type = nv; fixed++; }
  }));
  events.forEach(ev => { if (ev.person_relations) ev.person_relations = ev.person_relations.filter(r => !r._remove).map(({ _remove, ...rest }) => rest); });
  console.log('  已细化的关联关系数:', fixed, '；已移除的错误关联:', removed);

  save(f110, d);
  console.log('\n完成。');
}
module.exports = {};
main();