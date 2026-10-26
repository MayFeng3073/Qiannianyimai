/**
 * 明朝(dynasty_115)数据丰富脚本（对齐 enrich_114_relations.js 元朝流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（继续探索：推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级 related_people 扩充
 *   （事件经过由 fix_115_content.js 全部手写，本脚本不再覆盖）
 * 用法: node scripts/enrich_115_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f115 = path.join(DIR, 'dynasty_115.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 明朝历史脉络宏观时间线（10节点骨干，按事件名解析 event_id） ---------- */
const MING_TIMELINE_KEY = '明祚兴衰';
const MING_TIMELINE = [
  { title: '明朝建立', year: '1368年', desc: '应天称帝，国号大明' },
  { title: '废除丞相', year: '1380年', desc: '罢中书省，皇权集中' },
  { title: '靖难之役', year: '1399年', desc: '燕王起兵，南京易主' },
  { title: '郑和下西洋', year: '1405年', desc: '七下西洋，远播国威' },
  { title: '迁都北京', year: '1421年', desc: '政治中心北移' },
  { title: '土木之变', year: '1449年', desc: '英宗被俘，京师震动' },
  { title: '张居正改革', year: '1572年', desc: '考成清丈，整顿财政' },
  { title: '万历三大征', year: '1592年', desc: '三役并兴，军费浩繁' },
  { title: '萨尔浒之战', year: '1619年', desc: '明军四路溃败' },
  { title: '明亡北京陷落', year: '1644年', desc: '崇祯自缢，明祚中绝' }
];

/* ---------- #4 一级人物关系补全（仅在不足时补齐） ---------- */
const L1_TOPUP_115 = {
  '朱元璋': [['徐达', '君臣'], ['刘伯温', '君臣'], ['李善长', '君臣'], ['常遇春', '君臣']],
  '朱棣': [['姚广孝', '君臣'], ['解缙', '君臣'], ['郑和', '君臣']],
  '朱祁镇': [['王振', '君臣'], ['于谦', '敌对'], ['石亨', '君臣']],
  '朱祁钰': [['于谦', '君臣'], ['石亨', '君臣']],
  '朱厚照': [['王阳明', '君臣']],
  '朱厚熜': [['严嵩', '君臣'], ['戚继光', '君臣']],
  '朱翊钧': [['张居正', '君臣'], ['戚继光', '君臣'], ['李成梁', '君臣']],
  '朱由校': [['魏忠贤', '君臣'], ['袁崇焕', '君臣']],
  '朱由检': [['魏忠贤', '敌对'], ['袁崇焕', '君臣'], ['孙承宗', '君臣']],
  '于谦': [['朱祁钰', '君臣'], ['石亨', '敌对']],
  '徐达': [['朱元璋', '君臣'], ['常遇春', '同僚']],
  '常遇春': [['朱元璋', '君臣'], ['徐达', '同僚']],
  '刘伯温': [['朱元璋', '君臣'], ['李善长', '同僚']],
  '王阳明': [['朱厚照', '君臣'], ['湛若水', '交流'], ['王艮', '师生'], ['徐爱', '师生']],
  '张居正': [['朱翊钧', '君臣'], ['高拱', '敌对'], ['戚继光', '影响']],
  '戚继光': [['俞大猷', '同僚'], ['谭纶', '同僚'], ['胡宗宪', '同僚']],
  '俞大猷': [['戚继光', '同僚'], ['谭纶', '同僚']],
  '袁崇焕': [['孙承宗', '师生'], ['朱由检', '君臣'], ['毛文龙', '敌对']],
  '孙承宗': [['袁崇焕', '师生'], ['祖大寿', '君臣']],
  '郑和': [['朱棣', '君臣'], ['王景弘', '同僚'], ['马欢', '同僚']],
  '郑成功': [['郑芝龙', '父子'], ['朱由榔', '君臣']],
  '史可法': [['朱由崧', '君臣']],
  '魏忠贤': [['朱由校', '君臣'], ['朱由检', '敌对'], ['高攀龙', '敌对']],
  '严嵩': [['朱厚熜', '君臣'], ['徐阶', '敌对']],
  '徐阶': [['严嵩', '敌对'], ['高拱', '敌对'], ['张居正', '师生']],
  '高拱': [['徐阶', '敌对'], ['张居正', '敌对']],
  '李自成': [['吴三桂', '敌对'], ['朱由检', '敌对']],
  '顾炎武': [['黄宗羲', '交流']],
  '黄宗羲': [['顾炎武', '交流'], ['王夫之', '交流']],
  '汤显祖': [['李贽', '交流']],
  '徐光启': [['李之藻', '交流'], ['宋应星', '交流']],
  '李时珍': [['宋应星', '交流']],
  '宋应星': [['徐光启', '交流'], ['李时珍', '交流']]
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

/* ---------- #3 二级 narrative_relations（因缘际会）人工补强 ---------- */
const CURATED_115 = {
  '李善长': { persons: [['朱元璋', '君臣'], ['刘伯温', '同僚'], ['胡惟庸', '同僚']], events: ['明朝建立', '胡惟庸案'] },
  '胡惟庸': { persons: [['朱元璋', '君臣'], ['李善长', '同僚'], ['蓝玉', '同僚']], events: ['胡惟庸案', '废除丞相'] },
  '李文忠': { persons: [['朱元璋', '亲属'], ['徐达', '同僚'], ['冯胜', '同僚']], events: ['北伐灭元'] },
  '冯胜': { persons: [['朱元璋', '君臣'], ['蓝玉', '同僚'], ['傅友德', '同僚']], events: ['平定云南'] },
  '邓愈': { persons: [['朱元璋', '君臣'], ['汤和', '同僚'], ['徐达', '同僚']], events: ['明朝建立'] },
  '汤和': { persons: [['朱元璋', '君臣'], ['邓愈', '同僚'], ['徐达', '同僚']], events: ['平定明夏'] },
  '沐英': { persons: [['朱元璋', '亲属'], ['傅友德', '同僚'], ['蓝玉', '同僚']], events: ['平定云南'] },
  '傅友德': { persons: [['朱元璋', '君臣'], ['蓝玉', '同僚'], ['沐英', '同僚']], events: ['平定云南', '平定明夏'] },
  '蓝玉': { persons: [['朱元璋', '君臣'], ['傅友德', '同僚'], ['沐英', '同僚']], events: ['捕鱼儿海之战', '蓝玉案'] },
  '朱升': { persons: [['朱元璋', '君臣'], ['刘伯温', '同僚'], ['陶安', '同僚']], events: ['明朝建立'] },
  '陶安': { persons: [['朱元璋', '君臣'], ['朱升', '同僚'], ['刘伯温', '同僚']], events: ['明朝建立'] },
  '马皇后': { persons: [['朱元璋', '夫妻'], ['朱棣', '母子'], ['徐达', '同僚']], events: ['明朝建立'] },
  '叶琛': { persons: [['朱元璋', '君臣'], ['陶安', '同僚'], ['朱升', '同僚']], events: ['明朝建立'] },
  '姚广孝': { persons: [['朱棣', '君臣'], ['解缙', '同僚'], ['方孝孺', '敌对']], events: ['靖难之役', '迁都北京'] },
  '解缙': { persons: [['朱棣', '君臣'], ['姚广孝', '同僚'], ['杨士奇', '同僚']], events: ['《永乐大典》编成'] },
  '杨士奇': { persons: [['朱高炽', '君臣'], ['杨荣', '同僚'], ['杨溥', '同僚']], events: ['迁都北京'] },
  '杨荣': { persons: [['朱棣', '君臣'], ['杨士奇', '同僚'], ['杨溥', '同僚']], events: ['北征蒙古'] },
  '杨溥': { persons: [['朱高炽', '君臣'], ['杨士奇', '同僚'], ['杨荣', '同僚']], events: ['迁都北京'] },
  '蹇义': { persons: [['朱高炽', '君臣'], ['夏原吉', '同僚'], ['杨士奇', '同僚']], events: ['迁都北京'] },
  '夏原吉': { persons: [['朱棣', '君臣'], ['蹇义', '同僚'], ['杨士奇', '同僚']], events: ['迁都北京'] },
  '张辅': { persons: [['朱棣', '君臣'], ['朱能', '同僚'], ['丘福', '同僚']], events: ['明军征安南'] },
  '朱能': { persons: [['朱棣', '君臣'], ['张辅', '同僚'], ['丘福', '同僚']], events: ['靖难之役'] },
  '丘福': { persons: [['朱棣', '君臣'], ['张辅', '同僚'], ['朱能', '同僚']], events: ['北征蒙古'] },
  '王景弘': { persons: [['郑和', '同僚'], ['马欢', '同僚'], ['朱棣', '君臣']], events: ['郑和下西洋'] },
  '马欢': { persons: [['郑和', '同僚'], ['王景弘', '同僚'], ['朱棣', '君臣']], events: ['郑和下西洋'] },
  '陈诚': { persons: [['朱棣', '君臣'], ['金幼孜', '同僚'], ['胡濙', '同僚']], events: ['郑和下西洋'] },
  '金幼孜': { persons: [['朱棣', '君臣'], ['杨荣', '同僚'], ['胡濙', '同僚']], events: ['北征蒙古'] },
  '胡濙': { persons: [['朱棣', '君臣'], ['金幼孜', '同僚'], ['解缙', '同僚']], events: ['迁都北京'] },
  '王振': { persons: [['朱祁镇', '君臣'], ['于谦', '敌对'], ['石亨', '同僚']], events: ['土木之变'] },
  '石亨': { persons: [['朱祁镇', '君臣'], ['于谦', '敌对'], ['曹吉祥', '盟友']], events: ['北京保卫战', '夺门之变'] },
  '曹吉祥': { persons: [['朱祁镇', '君臣'], ['石亨', '盟友'], ['于谦', '敌对']], events: ['夺门之变'] },
  '孙太后': { persons: [['朱祁镇', '母子'], ['朱祁钰', '亲属'], ['于谦', '君臣']], events: ['土木之变', '北京保卫战'] },
  '钱皇后': { persons: [['朱祁镇', '夫妻'], ['朱祁钰', '亲属'], ['孙太后', '亲属']], events: ['土木之变', '夺门之变'] },
  '王骥': { persons: [['朱祁镇', '君臣'], ['杨善', '同僚'], ['于谦', '同僚']], events: ['土木之变'] },
  '杨善': { persons: [['朱祁镇', '君臣'], ['王骥', '同僚'], ['也先', '敌对']], events: ['土木之变'] },
  '李贤': { persons: [['朱祁镇', '君臣'], ['商辂', '同僚'], ['于谦', '同僚']], events: ['夺门之变'] },
  '商辂': { persons: [['朱祁镇', '君臣'], ['李贤', '同僚'], ['于谦', '同僚']], events: ['夺门之变'] },
  '马文升': { persons: [['朱祐樘', '君臣'], ['刘大夏', '同僚'], ['李东阳', '同僚']], events: ['八股取士'] },
  '刘大夏': { persons: [['朱祐樘', '君臣'], ['马文升', '同僚'], ['李东阳', '同僚']], events: ['八股取士'] },
  '李东阳': { persons: [['朱祐樘', '君臣'], ['刘健', '同僚'], ['谢迁', '同僚']], events: ['八股取士'] },
  '刘健': { persons: [['朱祐樘', '君臣'], ['李东阳', '同僚'], ['谢迁', '同僚']], events: ['八股取士'] },
  '谢迁': { persons: [['朱祐樘', '君臣'], ['刘健', '同僚'], ['李东阳', '同僚']], events: ['八股取士'] },
  '杨廷和': { persons: [['朱厚照', '君臣'], ['朱厚熜', '敌对'], ['张璁', '敌对']], events: ['大礼议'] },
  '汪直': { persons: [['朱见深', '君臣'], ['王振', '同僚'], ['商辂', '敌对']], events: ['设立西厂'] },
  '王艮': { persons: [['王阳明', '师生'], ['王畿', '同僚'], ['徐爱', '同僚']], events: ['阳明心学'] },
  '王畿': { persons: [['王阳明', '师生'], ['钱德洪', '同僚'], ['王艮', '同僚']], events: ['阳明心学'] },
  '钱德洪': { persons: [['王阳明', '师生'], ['王畿', '同僚'], ['徐爱', '同僚']], events: ['阳明心学'] },
  '徐爱': { persons: [['王阳明', '师生'], ['王畿', '同僚'], ['钱德洪', '同僚']], events: ['阳明心学'] },
  '湛若水': { persons: [['王阳明', '交流'], ['王艮', '影响'], ['邹守益', '同僚']], events: ['阳明心学'] },
  '邹守益': { persons: [['王阳明', '师生'], ['聂豹', '同僚'], ['罗洪先', '同僚']], events: ['阳明心学'] },
  '聂豹': { persons: [['王阳明', '影响'], ['邹守益', '同僚'], ['罗洪先', '同僚']], events: ['阳明心学'] },
  '罗洪先': { persons: [['王阳明', '影响'], ['聂豹', '同僚'], ['邹守益', '同僚']], events: ['阳明心学'] },
  '唐顺之': { persons: [['胡宗宪', '同僚'], ['谭纶', '同僚'], ['王世贞', '交流']], events: ['明代抗倭'] },
  '王世贞': { persons: [['李攀龙', '盟友'], ['李东阳', '影响'], ['张居正', '敌对']], events: ['东林书院'] },
  '李攀龙': { persons: [['王世贞', '盟友'], ['李东阳', '影响'], ['王锡爵', '同僚']], events: ['东林书院'] },
  '徐阶': { persons: [['严嵩', '敌对'], ['高拱', '敌对'], ['张居正', '师生']], events: ['大礼议'] },
  '高拱': { persons: [['徐阶', '敌对'], ['张居正', '敌对'], ['申时行', '同僚']], events: ['张居正改革'] },
  '申时行': { persons: [['张居正', '同僚'], ['高拱', '同僚'], ['王锡爵', '同僚']], events: ['国本之争'] },
  '李春芳': { persons: [['严嵩', '同僚'], ['徐阶', '同僚'], ['高拱', '同僚']], events: ['张居正改革'] },
  '王锡爵': { persons: [['申时行', '同僚'], ['顾宪成', '敌对'], ['高攀龙', '敌对']], events: ['国本之争'] },
  '胡宗宪': { persons: [['戚继光', '君臣'], ['俞大猷', '同僚'], ['谭纶', '同僚']], events: ['明代抗倭'] },
  '谭纶': { persons: [['戚继光', '同僚'], ['俞大猷', '同僚'], ['胡宗宪', '同僚']], events: ['明代抗倭', '戚家军整顿'] },
  '严世蕃': { persons: [['严嵩', '父子'], ['徐阶', '敌对'], ['张居正', '敌对']], events: ['大礼议'] },
  '徐渭': { persons: [['胡宗宪', '幕僚'], ['文徵明', '影响'], ['王世贞', '交流']], events: ['明代抗倭'] },
  '文徵明': { persons: [['唐寅', '盟友'], ['仇英', '影响'], ['董其昌', '影响']], events: ['《牡丹亭》问世'] },
  '仇英': { persons: [['文徵明', '影响'], ['唐寅', '影响'], ['董其昌', '影响']], events: ['《牡丹亭》问世'] },
  '李贽': { persons: [['王艮', '影响'], ['顾宪成', '敌对'], ['汤显祖', '交流']], events: ['东林书院'] },
  '冯梦龙': { persons: [['凌濛初', '交流'], ['袁宏道', '交流'], ['汤显祖', '影响']], events: ['《牡丹亭》问世'] },
  '凌濛初': { persons: [['冯梦龙', '交流'], ['袁宏道', '交流'], ['汤显祖', '影响']], events: ['《牡丹亭》问世'] },
  '袁宏道': { persons: [['袁宗道', '兄弟'], ['袁中道', '兄弟'], ['李贽', '师生']], events: ['东林书院'] },
  '袁宗道': { persons: [['袁宏道', '兄弟'], ['袁中道', '兄弟'], ['李贽', '师生']], events: ['东林书院'] },
  '袁中道': { persons: [['袁宏道', '兄弟'], ['袁宗道', '兄弟'], ['李贽', '师生']], events: ['东林书院'] },
  '顾宪成': { persons: [['高攀龙', '盟友'], ['王锡爵', '敌对'], ['李贽', '敌对']], events: ['东林书院'] },
  '高攀龙': { persons: [['顾宪成', '盟友'], ['魏忠贤', '敌对'], ['王锡爵', '敌对']], events: ['东林书院', '魏忠贤专权'] },
  '罗贯中': { persons: [['施耐庵', '师生'], ['冯梦龙', '影响'], ['吴承恩', '影响']], events: ['《牡丹亭》问世'] },
  '施耐庵': { persons: [['罗贯中', '师生'], ['冯梦龙', '影响'], ['吴承恩', '影响']], events: ['《牡丹亭》问世'] },
  '陈洪绶': { persons: [['董其昌', '影响'], ['文徵明', '影响'], ['仇英', '影响']], events: ['《牡丹亭》问世'] },
  '潘季驯': { persons: [['张居正', '君臣'], ['朱翊钧', '君臣'], ['申时行', '同僚']], events: ['一条鞭法'] },
  '孙传庭': { persons: [['朱由检', '君臣'], ['卢象升', '同僚'], ['洪承畴', '同僚']], events: ['明末农民战争'] },
  '卢象升': { persons: [['朱由检', '君臣'], ['孙传庭', '同僚'], ['杨嗣昌', '敌对']], events: ['明末农民战争'] },
  '毛文龙': { persons: [['袁崇焕', '敌对'], ['孙承宗', '君臣'], ['祖大寿', '同僚']], events: ['萨尔浒之战'] },
  '祖大寿': { persons: [['孙承宗', '君臣'], ['袁崇焕', '同僚'], ['洪承畴', '同僚']], events: ['松锦之战'] },
  '洪承畴': { persons: [['朱由检', '君臣'], ['祖大寿', '同僚'], ['皇太极', '敌对']], events: ['松锦之战'] },
  '吴三桂': { persons: [['李自成', '敌对'], ['祖大寿', '同僚'], ['多尔衮', '盟友']], events: ['山海关之战', '清军入关'] },
  '李定国': { persons: [['朱由榔', '君臣'], ['孙可望', '敌对'], ['张煌言', '盟友']], events: ['南明抗清'] },
  '张煌言': { persons: [['郑成功', '盟友'], ['李定国', '盟友'], ['朱由榔', '君臣']], events: ['南明抗清'] },
  '瞿式耜': { persons: [['朱由榔', '君臣'], ['何腾蛟', '同僚'], ['张煌言', '盟友']], events: ['南明抗清'] },
  '黄道周': { persons: [['朱由检', '君臣'], ['郑芝龙', '敌对'], ['瞿式耜', '盟友']], events: ['南明抗清'] },
  '郑芝龙': { persons: [['郑成功', '父子'], ['朱由榔', '君臣'], ['黄道周', '敌对']], events: ['南明抗清'] },
  '高迎祥': { persons: [['李自成', '同僚'], ['张献忠', '盟友'], ['孙传庭', '敌对']], events: ['明末农民战争'] },
  '罗汝才': { persons: [['李自成', '同僚'], ['张献忠', '盟友'], ['高迎祥', '同僚']], events: ['明末农民战争'] },
  '刘宗敏': { persons: [['李自成', '君臣'], ['吴三桂', '敌对'], ['罗汝才', '同僚']], events: ['明末农民战争', '明亡北京陷落'] },
  '孙可望': { persons: [['张献忠', '君臣'], ['李定国', '敌对'], ['朱由榔', '君臣']], events: ['南明抗清'] },
  '阎应元': { persons: [['史可法', '盟友'], ['郑成功', '盟友'], ['多铎', '敌对']], events: ['南明抗清'] },
  '陈子龙': { persons: [['夏完淳', '师生'], ['柳如是', '交流'], ['钱谦益', '交流']], events: ['南明抗清'] },
  '夏完淳': { persons: [['陈子龙', '师生'], ['钱谦益', '交流'], ['洪承畴', '敌对']], events: ['南明抗清'] },
  '方孝孺': { persons: [['朱允炆', '君臣'], ['朱棣', '敌对'], ['姚广孝', '敌对']], events: ['靖难之役'] },
  '李之藻': { persons: [['徐光启', '交流'], ['利玛窦', '师生'], ['宋应星', '交流']], events: ['中西科技交流'] },
  '王夫之': { persons: [['顾炎武', '交流'], ['黄宗羲', '交流'], ['方以智', '交流']], events: ['南明抗清'] },
  '吴又可': { persons: [['李时珍', '影响'], ['陈实功', '同僚'], ['吴有性', '同僚']], events: ['《本草纲目》刊行'] },
  '陈实功': { persons: [['李时珍', '影响'], ['吴又可', '同僚'], ['徐光启', '交流']], events: ['《本草纲目》刊行'] },
  '柳如是': { persons: [['钱谦益', '夫妻'], ['陈子龙', '交流'], ['张岱', '交流']], events: ['南明抗清'] },
  '钱谦益': { persons: [['柳如是', '夫妻'], ['张岱', '交流'], ['陈子龙', '交流']], events: ['南明抗清'] },
  '张岱': { persons: [['钱谦益', '交流'], ['柳如是', '交流'], ['袁宏道', '影响']], events: ['明末农民战争'] },
  '方以智': { persons: [['王夫之', '交流'], ['黄宗羲', '交流'], ['顾炎武', '交流']], events: ['南明抗清'] }
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
  const d = load(f115);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const l1NameSet = new Set(persons.filter(p => (p.level || 1) === 1).map(p => p.name));
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  const evIdByName = new Map(events.map(e => [e.name, e.id]));
  const tlNodes = MING_TIMELINE.map(n => {
    const id = evIdByName.get(n.title);
    return id ? { ...n, event_id: id } : { ...n };
  });
  d.timelines = d.timelines || {};
  d.timelines[MING_TIMELINE_KEY] = tlNodes;
  events.forEach(ev => { ev.timeline_id = MING_TIMELINE_KEY; });
  console.log('  timeline节点', tlNodes.length, '（已挂事件', tlNodes.filter(n => n.event_id).length, '个）');

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

    // Fallback：共享人物不足3个时，按同 timeline 邻近 → 同类型 → ±30年 补充
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
  let rp = 0, re = 0;
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    ev.related_persons = [...names].filter(n => nameSet.has(n)).slice(0, 12);
    // 兜底：人物组均不在本朝人物表时（如萨尔浒之战），按人物人生经历中同名事件补入
    if (!ev.related_persons.length) {
      ev.related_persons = [...new Set(persons
        .filter(p => (p.life_events || []).some(le => le.title === ev.name))
        .map(p => p.name))].slice(0, 12);
    }
    ev.related_events = relatedEventNames(ev).filter(n => n !== ev.name).slice(0, 6);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 一级人物 related_people 扩充 =====');
  let l1ok = 0;
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
      }).forEach(([nm]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 + (l1NameSet.has(nm) ? 15 : 0) }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    const topup = L1_TOPUP_115[p.name] || [];
    const haveTop = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!haveTop.has(nm) && list.length < 6 && nameSet.has(nm)) { haveTop.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !['关联', '关系', '因缘', '参与', '未知'].includes(r.relation)); });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p => p.level === 1).length);

  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_115);
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
  let l2ok = 0, l2low = [];
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
    else l2low.push(p.name + '(' + g.nodes.length + ')');
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p => p.level === 2).length);
  if (l2low.length) console.log('  需人工补充的二级人物:', l2low.join(','));

  save(f115, d);
  console.log('\n完成。');
}
module.exports = {};
main();
