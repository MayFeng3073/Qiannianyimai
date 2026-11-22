/**
 * 民国(dynasty_117)数据丰富脚本（结构对齐 enrich_116_relations.js 清朝流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（继续探索：推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级人物 related_people 扩充 + 二级 related_people 生成
 *   （事件经过由 fix_117_content.js 后续补齐，本脚本不覆盖 narratives）
 * 用法: node scripts/enrich_117_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f117 = path.join(DIR, 'dynasty_117.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 民国历史脉络宏观时间线（10节点骨干，按事件名解析 event_id） ---------- */
const MINGUO_TIMELINE_KEY = '民国国运';
const MINGUO_TIMELINE = [
  { title: '二次革命', year: '1913年', desc: '讨袁失败，南方革命力量受挫' },
  { title: '袁世凯称帝', year: '1915年', desc: '洪宪帝制，共和遭遇危机' },
  { title: '护国战争', year: '1915年', desc: '云南首义，帝制取消' },
  { title: '新文化运动', year: '1915年', desc: '科学与民主，思想启蒙' },
  { title: '五四运动', year: '1919年', desc: '外争主权，拒签和约' },
  { title: '北伐战争', year: '1926年', desc: '北上讨北洋，南京建政' },
  { title: '东北易帜', year: '1928年', desc: '全国名义统一' },
  { title: '九一八事变', year: '1931年', desc: '东北沦陷，民族危机' },
  { title: '全面抗战', year: '1937年', desc: '全民御侮，八年苦战' },
  { title: '重庆谈判', year: '1945年', desc: '抗战胜利，内战再起' }
];

/* ---------- #4 一级人物关系补全（仅在不足时补齐） ---------- */
const L1_TOPUP_117 = {
  '袁世凯': [['孙中山', '敌对'], ['黄兴', '敌对'], ['蔡锷', '敌对'], ['段祺瑞', '君臣'], ['张作霖', '君臣']],
  '孙中山': [['黄兴', '盟友'], ['胡汉民', '盟友'], ['蔡元培', '盟友'], ['宋教仁', '盟友'], ['蒋介石', '君臣']],
  '段祺瑞': [['袁世凯', '君臣'], ['张作霖', '盟友'], ['冯玉祥', '敌对'], ['蔡锷', '敌对'], ['阎锡山', '盟友']],
  '张作霖': [['段祺瑞', '盟友'], ['阎锡山', '盟友'], ['冯玉祥', '敌对'], ['蒋介石', '敌对']],
  '蒋介石': [['孙中山', '君臣'], ['何应钦', '君臣'], ['白崇禧', '敌对'], ['李宗仁', '敌对'], ['张学良', '君臣']],
  '冯玉祥': [['阎锡山', '盟友'], ['李宗仁', '盟友'], ['张作霖', '敌对'], ['蒋介石', '敌对']],
  '阎锡山': [['冯玉祥', '盟友'], ['李宗仁', '盟友'], ['张学良', '盟友'], ['段祺瑞', '盟友']],
  '张学良': [['张作霖', '父子'], ['蒋介石', '君臣'], ['杨虎城', '盟友'], ['冯玉祥', '盟友'], ['宋子文', '盟友']],
  '李宗仁': [['白崇禧', '盟友'], ['蒋介石', '敌对'], ['阎锡山', '盟友'], ['何应钦', '敌对']],
  '白崇禧': [['李宗仁', '盟友'], ['蒋介石', '敌对'], ['何应钦', '敌对'], ['阎锡山', '盟友']],
  '何应钦': [['蒋介石', '君臣'], ['白崇禧', '敌对'], ['李宗仁', '敌对'], ['阎锡山', '同僚']],
  '黄兴': [['孙中山', '盟友'], ['袁世凯', '敌对'], ['宋教仁', '盟友'], ['章太炎', '盟友'], ['胡汉民', '盟友']],
  '蔡锷': [['袁世凯', '敌对'], ['黄兴', '盟友'], ['朱德', '君臣'], ['梁启超', '师生']],
  '胡汉民': [['孙中山', '盟友'], ['蒋介石', '敌对'], ['黄兴', '盟友'], ['宋教仁', '盟友']],
  '宋子文': [['蒋介石', '姻亲'], ['孙中山', '姻亲'], ['孔祥熙', '姻亲'], ['顾维钧', '同僚']],
  '顾维钧': [['袁世凯', '君臣'], ['段祺瑞', '君臣'], ['蒋介石', '君臣'], ['宋子文', '同僚'], ['胡适', '同僚']],
  '章太炎': [['孙中山', '盟友'], ['黄兴', '盟友'], ['蔡元培', '同僚'], ['胡适', '敌对']],
  '蔡元培': [['孙中山', '盟友'], ['胡适', '师生'], ['陈独秀', '同僚'], ['鲁迅', '君臣'], ['竺可桢', '君臣']],
  '陈独秀': [['胡适', '盟友'], ['鲁迅', '盟友'], ['李大钊', '盟友'], ['蔡元培', '同僚']],
  '胡适': [['陈独秀', '盟友'], ['蔡元培', '师生'], ['傅斯年', '师生'], ['顾颉刚', '同僚'], ['竺可桢', '同僚']],
  '鲁迅': [['陈独秀', '盟友'], ['胡适', '敌对'], ['蔡元培', '同僚'], ['茅盾', '盟友']],
  '傅斯年': [['胡适', '师生'], ['顾颉刚', '同僚'], ['陈寅恪', '同僚'], ['竺可桢', '同僚']],
  '竺可桢': [['蔡元培', '君臣'], ['胡适', '同僚'], ['傅斯年', '同僚'], ['叶企孙', '同僚'], ['李四光', '同僚'], ['茅以升', '同僚']],
  '叶企孙': [['竺可桢', '同僚'], ['李四光', '同僚'], ['吴有训', '师生'], ['吴大猷', '师生']],
  '李四光': [['竺可桢', '同僚'], ['叶企孙', '同僚'], ['侯德榜', '同僚'], ['茅以升', '同僚']],
  '朱德': [['蔡锷', '君臣'], ['彭德怀', '同僚'], ['毛泽东', '同僚']],
  '彭德怀': [['朱德', '同僚'], ['毛泽东', '同僚']]
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
const CURATED_117 = {
  '汪精卫': { persons: [['孙中山', '盟友'], ['蒋介石', '敌对'], ['宋教仁', '盟友'], ['廖仲恺', '同僚']], events: ['国民党改组'] },
  '宋教仁': { persons: [['孙中山', '盟友'], ['黄兴', '盟友'], ['袁世凯', '敌对'], ['廖仲恺', '同僚']], events: ['二次革命'] },
  '廖仲恺': { persons: [['孙中山', '君臣'], ['汪精卫', '同僚'], ['蒋介石', '同僚'], ['宋庆龄', '同僚']], events: ['国民党改组'] },
  '孔祥熙': { persons: [['蒋介石', '姻亲'], ['宋子文', '姻亲'], ['孙中山', '姻亲'], ['宋美龄', '亲属']], events: ['法币改革'] },
  '谭延闿': { persons: [['孙中山', '盟友'], ['蒋介石', '同僚'], ['程潜', '同僚'], ['唐生智', '同僚']], events: ['北伐战争'] },
  '林森': { persons: [['孙中山', '盟友'], ['蒋介石', '同僚'], ['胡汉民', '同僚'], ['汪精卫', '同僚']], events: ['国民党改组'] },
  '唐绍仪': { persons: [['袁世凯', '君臣'], ['孙中山', '同僚'], ['顾维钧', '同僚'], ['段祺瑞', '敌对']], events: ['修约外交'] },
  '王宠惠': { persons: [['顾维钧', '同僚'], ['蒋介石', '君臣'], ['孙中山', '盟友'], ['宋子文', '同僚']], events: ['巴黎和会'] },
  '戴季陶': { persons: [['孙中山', '君臣'], ['蒋介石', '盟友'], ['胡汉民', '同僚'], ['汪精卫', '敌对']], events: ['国民党改组'] },
  '张群': { persons: [['蒋介石', '君臣'], ['何应钦', '同僚'], ['白崇禧', '同僚'], ['张学良', '同僚']], events: ['重庆谈判'] },
  '王世杰': { persons: [['蒋介石', '君臣'], ['顾维钧', '同僚'], ['胡适', '同僚'], ['宋子文', '同僚']], events: ['平等新约'] },
  '蒋廷黻': { persons: [['胡适', '同僚'], ['蒋介石', '君臣'], ['傅斯年', '同僚'], ['顾维钧', '同僚']], events: ['中苏互不侵犯条约'] },
  '杨虎城': { persons: [['张学良', '盟友'], ['蒋介石', '敌对'], ['冯玉祥', '盟友'], ['阎锡山', '盟友']], events: ['西安事变'] },
  '程潜': { persons: [['孙中山', '盟友'], ['蒋介石', '同僚'], ['谭延闿', '同僚'], ['唐生智', '同僚']], events: ['北伐战争'] },
  '唐生智': { persons: [['蒋介石', '敌对'], ['程潜', '同僚'], ['谭延闿', '同僚'], ['白崇禧', '敌对']], events: ['北伐战争'] },
  '陈济棠': { persons: [['蒋介石', '敌对'], ['李宗仁', '盟友'], ['白崇禧', '盟友'], ['胡汉民', '盟友']], events: ['中原大战'] },
  '陈绍宽': { persons: [['蒋介石', '君臣'], ['何应钦', '同僚'], ['陈诚', '同僚'], ['张作霖', '敌对']], events: ['全面抗战'] },
  '朱培德': { persons: [['孙中山', '盟友'], ['蒋介石', '君臣'], ['何应钦', '同僚'], ['陈诚', '同僚']], events: ['北伐战争'] },
  '宋哲元': { persons: [['张作霖', '敌对'], ['蒋介石', '君臣'], ['傅作义', '同僚'], ['张自忠', '君臣']], events: ['全面抗战'] },
  '刘湘': { persons: [['蒋介石', '君臣'], ['刘伯承', '敌对'], ['贺龙', '敌对'], ['陈济棠', '同僚']], events: ['全面抗战'] },
  '卫立煌': { persons: [['蒋介石', '君臣'], ['何应钦', '同僚'], ['薛岳', '同僚'], ['杜聿明', '同僚']], events: ['全面抗战'] },
  '孙立人': { persons: [['蒋介石', '君臣'], ['杜聿明', '同僚'], ['陈诚', '同僚'], ['史迪威', '同僚']], events: ['全面抗战'] },
  '杜聿明': { persons: [['蒋介石', '君臣'], ['孙立人', '同僚'], ['卫立煌', '同僚'], ['陈诚', '同僚']], events: ['台儿庄战役'] },
  '陈诚': { persons: [['蒋介石', '君臣'], ['何应钦', '同僚'], ['白崇禧', '同僚'], ['孙立人', '同僚']], events: ['全面抗战'] },
  '张自忠': { persons: [['宋哲元', '君臣'], ['蒋介石', '君臣'], ['傅作义', '同僚'], ['李宗仁', '君臣']], events: ['台儿庄战役'] },
  '傅作义': { persons: [['阎锡山', '君臣'], ['蒋介石', '君臣'], ['宋哲元', '同僚'], ['张自忠', '同僚']], events: ['全面抗战'] },
  '薛岳': { persons: [['蒋介石', '君臣'], ['陈诚', '同僚'], ['卫立煌', '同僚'], ['白崇禧', '同僚']], events: ['全面抗战'] },
  '贺龙': { persons: [['刘伯承', '同僚'], ['陈毅', '同僚'], ['粟裕', '同僚'], ['徐向前', '同僚']], events: ['北伐战争'] },
  '刘伯承': { persons: [['贺龙', '同僚'], ['陈毅', '同僚'], ['粟裕', '同僚'], ['蒋介石', '敌对']], events: ['全面抗战'] },
  '陈毅': { persons: [['粟裕', '盟友'], ['刘伯承', '同僚'], ['贺龙', '同僚'], ['叶挺', '同僚']], events: ['全面抗战'] },
  '粟裕': { persons: [['陈毅', '盟友'], ['刘伯承', '同僚'], ['徐向前', '同僚'], ['贺龙', '同僚']], events: ['全面抗战'] },
  '徐向前': { persons: [['刘伯承', '同僚'], ['粟裕', '同僚'], ['陈毅', '同僚'], ['贺龙', '同僚']], events: ['全面抗战'] },
  '叶挺': { persons: [['聂荣臻', '盟友'], ['陈毅', '同僚'], ['贺龙', '同僚'], ['蒋介石', '敌对']], events: ['北伐战争'] },
  '聂荣臻': { persons: [['叶挺', '盟友'], ['贺龙', '同僚'], ['刘伯承', '同僚'], ['徐向前', '同僚']], events: ['全面抗战'] },
  '李大钊': { persons: [['陈独秀', '盟友'], ['胡适', '盟友'], ['鲁迅', '盟友'], ['蔡元培', '同僚']], events: ['五四运动'] },
  '熊十力': { persons: [['冯友兰', '同僚'], ['梁漱溟', '盟友'], ['胡适', '敌对'], ['章太炎', '影响']], events: ['本位文化论战'] },
  '冯友兰': { persons: [['熊十力', '同僚'], ['胡适', '同僚'], ['金岳霖', '同僚'], ['梁漱溟', '同僚']], events: ['本位文化论战'] },
  '王国维': { persons: [['陈寅恪', '同僚'], ['罗振玉', '师生'], ['梁启超', '同僚'], ['钱穆', '同僚']], events: ['殷墟发掘'] },
  '陈寅恪': { persons: [['王国维', '同僚'], ['傅斯年', '同僚'], ['钱穆', '同僚'], ['顾颉刚', '同僚']], events: ['中研院成立'] },
  '顾颉刚': { persons: [['钱穆', '同僚'], ['傅斯年', '同僚'], ['胡适', '师生'], ['陈垣', '同僚']], events: ['古史辨运动'] },
  '钱穆': { persons: [['顾颉刚', '同僚'], ['陈寅恪', '同僚'], ['王国维', '同僚'], ['胡适', '敌对']], events: ['中研院成立'] },
  '陈垣': { persons: [['陈寅恪', '同僚'], ['顾颉刚', '同僚'], ['胡适', '师生'], ['傅斯年', '同僚']], events: ['中研院成立'] },
  '赵元任': { persons: [['胡适', '同僚'], ['李济', '同僚'], ['傅斯年', '同僚'], ['蔡元培', '君臣']], events: ['中研院成立'] },
  '李济': { persons: [['傅斯年', '同僚'], ['赵元任', '同僚'], ['梁思成', '同僚'], ['胡适', '同僚']], events: ['殷墟发掘'] },
  '梁思成': { persons: [['林徽因', '夫妻'], ['李济', '同僚'], ['梅贻琦', '君臣'], ['竺可桢', '同僚']], events: ['中研院成立'] },
  '林徽因': { persons: [['梁思成', '夫妻'], ['徐志摩', '交流'], ['沈从文', '盟友'], ['金岳霖', '交流']], events: [] },
  '齐白石': { persons: [['黄宾虹', '同僚'], ['徐悲鸿', '盟友'], ['潘天寿', '同僚'], ['梅兰芳', '交流']], events: [] },
  '徐悲鸿': { persons: [['齐白石', '盟友'], ['黄宾虹', '同僚'], ['潘天寿', '同僚'], ['梅兰芳', '交流']], events: [] },
  '梅兰芳': { persons: [['齐如山', '师生'], ['徐悲鸿', '交流'], ['齐白石', '交流'], ['程砚秋', '同僚']], events: ['梅兰芳访美'] },
  '黄宾虹': { persons: [['齐白石', '同僚'], ['徐悲鸿', '同僚'], ['潘天寿', '同僚'], ['黄侃', '同僚']], events: [] },
  '潘天寿': { persons: [['齐白石', '同僚'], ['徐悲鸿', '同僚'], ['黄宾虹', '同僚'], ['林风眠', '同僚']], events: [] },
  '章太炎': { persons: [['黄侃', '师生'], ['刘师培', '同僚'], ['孙中山', '盟友'], ['胡适', '敌对']], events: ['五四运动'] },
  '黄侃': { persons: [['章太炎', '师生'], ['刘师培', '同僚'], ['吴宓', '同僚'], ['钱玄同', '同僚']], events: [] },
  '刘师培': { persons: [['章太炎', '同僚'], ['黄侃', '同僚'], ['胡适', '敌对'], ['钱玄同', '同僚']], events: [] },
  '吴宓': { persons: [['黄侃', '同僚'], ['胡适', '敌对'], ['陈寅恪', '同僚'], ['钱钟书', '师生']], events: [] },
  '胡适': { persons: [['陈独秀', '盟友'], ['李大钊', '盟友'], ['傅斯年', '师生'], ['顾颉刚', '师生']], events: ['新文化运动'] },
  '傅斯年': { persons: [['胡适', '师生'], ['顾颉刚', '同僚'], ['李济', '同僚'], ['赵元任', '同僚']], events: ['殷墟发掘'] },
  '罗家伦': { persons: [['胡适', '师生'], ['傅斯年', '同僚'], ['蔡元培', '师生'], ['蒋廷黻', '同僚']], events: ['五四运动'] },
  '梅贻琦': { persons: [['胡适', '同僚'], ['张伯苓', '同僚'], ['傅斯年', '同僚'], ['梁思成', '同僚']], events: ['北大改革'] },
  '张伯苓': { persons: [['梅贻琦', '同僚'], ['陶行知', '同僚'], ['晏阳初', '同僚'], ['胡适', '同僚']], events: ['乡村建设运动'] },
  '陶行知': { persons: [['晏阳初', '盟友'], ['张伯苓', '同僚'], ['梁漱溟', '同僚'], ['蔡元培', '师生']], events: ['乡村建设运动'] },
  '晏阳初': { persons: [['陶行知', '盟友'], ['梁漱溟', '同僚'], ['张伯苓', '同僚'], ['胡适', '同僚']], events: ['乡村建设运动'] },
  '梁漱溟': { persons: [['晏阳初', '盟友'], ['陶行知', '同僚'], ['熊十力', '盟友'], ['冯友兰', '同僚']], events: ['乡村建设运动'] },
  '卢作孚': { persons: [['晏阳初', '盟友'], ['荣宗敬', '同僚'], ['范旭东', '同僚'], ['张伯苓', '同僚']], events: ['工业内迁'] },
  '荣宗敬': { persons: [['荣德生', '兄弟'], ['范旭东', '同僚'], ['卢作孚', '同僚'], ['侯德榜', '同僚']], events: ['国民经济建设运动'] },
  '荣德生': { persons: [['荣宗敬', '兄弟'], ['范旭东', '同僚'], ['卢作孚', '同僚'], ['侯德榜', '同僚']], events: ['国民经济建设运动'] },
  '范旭东': { persons: [['侯德榜', '君臣'], ['荣宗敬', '同僚'], ['卢作孚', '同僚'], ['吴有训', '同僚']], events: ['侯氏制碱'] },
  '侯德榜': { persons: [['范旭东', '君臣'], ['荣宗敬', '同僚'], ['卢作孚', '同僚'], ['吴有训', '同僚']], events: ['侯氏制碱'] },
  '詹天佑': { persons: [['竺可桢', '同僚'], ['茅以升', '同僚'], ['李四光', '同僚'], ['叶企孙', '同僚']], events: ['钱塘江大桥'] },
  '竺可桢': { persons: [['蔡元培', '君臣'], ['胡适', '同僚'], ['傅斯年', '同僚'], ['叶企孙', '同僚']], events: ['中研院成立'] },
  '茅以升': { persons: [['詹天佑', '同僚'], ['竺可桢', '同僚'], ['李四光', '同僚'], ['叶企孙', '同僚']], events: ['钱塘江大桥'] },
  '童第周': { persons: [['林巧稚', '同僚'], ['吴有训', '同僚'], ['严济慈', '同僚'], ['竺可桢', '同僚']], events: [] },
  '林巧稚': { persons: [['童第周', '同僚'], ['吴有训', '同僚'], ['严济慈', '同僚'], ['叶企孙', '同僚']], events: [] },
  '吴有训': { persons: [['叶企孙', '同僚'], ['严济慈', '同僚'], ['吴大猷', '师生'], ['童第周', '同僚']], events: ['中研院成立'] },
  '严济慈': { persons: [['吴有训', '同僚'], ['叶企孙', '同僚'], ['吴大猷', '同僚'], ['童第周', '同僚']], events: ['中研院成立'] },
  '叶企孙': { persons: [['吴有训', '同僚'], ['严济慈', '同僚'], ['吴大猷', '师生'], ['竺可桢', '同僚']], events: ['中研院成立'] },
  '吴大猷': { persons: [['叶企孙', '师生'], ['吴有训', '师生'], ['严济慈', '同僚'], ['胡适', '同僚']], events: [] },
  '郭沫若': { persons: [['鲁迅', '敌对'], ['茅盾', '同僚'], ['巴金', '同僚'], ['老舍', '同僚']], events: ['左联成立'] },
  '茅盾': { persons: [['鲁迅', '盟友'], ['巴金', '同僚'], ['老舍', '同僚'], ['瞿秋白', '同僚']], events: ['左联成立'] },
  '巴金': { persons: [['茅盾', '同僚'], ['老舍', '同僚'], ['曹禺', '同僚'], ['沈从文', '同僚']], events: ['左联成立'] },
  '老舍': { persons: [['巴金', '同僚'], ['茅盾', '同僚'], ['曹禺', '同僚'], ['沈从文', '同僚']], events: [] },
  '曹禺': { persons: [['老舍', '同僚'], ['巴金', '同僚'], ['茅盾', '同僚'], ['丁玲', '同僚']], events: [] },
  '沈从文': { persons: [['巴金', '同僚'], ['萧红', '同僚'], ['丁玲', '同僚'], ['林徽因', '盟友']], events: ['左联成立'] },
  '张爱玲': { persons: [['苏青', '同僚'], ['胡兰成', '夫妻'], ['沈从文', '同僚'], ['穆旦', '同僚']], events: [] },
  '钱钟书': { persons: [['吴宓', '师生'], ['杨绛', '夫妻'], ['沈从文', '同僚'], ['林语堂', '同僚']], events: [] },
  '周作人': { persons: [['鲁迅', '兄弟'], ['林语堂', '同僚'], ['胡适', '同僚'], ['钱玄同', '同僚']], events: ['新文化运动'] },
  '林语堂': { persons: [['周作人', '同僚'], ['胡适', '同僚'], ['鲁迅', '敌对'], ['钱钟书', '同僚']], events: [] },
  '萧红': { persons: [['萧军', '夫妻'], ['丁玲', '盟友'], ['鲁迅', '师生'], ['端木蕻良', '夫妻']], events: [] },
  '丁玲': { persons: [['萧红', '盟友'], ['沈从文', '同僚'], ['胡也频', '夫妻'], ['艾青', '同僚']], events: ['左联成立'] },
  '萧军': { persons: [['萧红', '夫妻'], ['鲁迅', '师生'], ['艾青', '同僚'], ['丁玲', '同僚']], events: [] },
  '艾青': { persons: [['丁玲', '同僚'], ['萧军', '同僚'], ['穆旦', '同僚'], ['闻一多', '同僚']], events: [] },
  '沙汀': { persons: [['艾芜', '同僚'], ['巴金', '同僚'], ['丁玲', '同僚'], ['沈从文', '同僚']], events: [] },
  '叶圣陶': { persons: [['朱自清', '同僚'], ['茅盾', '同僚'], ['巴金', '同僚'], ['夏丏尊', '同僚']], events: [] },
  '朱自清': { persons: [['闻一多', '同僚'], ['叶圣陶', '同僚'], ['胡适', '师生'], ['穆旦', '师生']], events: [] },
  '闻一多': { persons: [['朱自清', '同僚'], ['艾青', '同僚'], ['徐志摩', '同僚'], ['梁实秋', '同僚']], events: ['五四运动'] },
  '穆旦': { persons: [['艾青', '同僚'], ['朱自清', '师生'], ['闻一多', '师生'], ['张爱玲', '同僚']], events: [] },
  '张恨水': { persons: [['张爱玲', '影响'], ['老舍', '同僚'], ['巴金', '同僚'], ['沈从文', '同僚']], events: [] },
  '吕碧城': { persons: [['秋瑾', '交流'], ['梁启超', '影响'], ['严复', '师生'], ['章太炎', '同僚']], events: [] }
};

function sanitizeCurated(raw, CURATED) {
  // 人物允许跨朝代/非在册（前端按全局索引跳转，找不到则不跳转）；事件必须在本朝事件表内
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => nm && nm.trim());
    const events = (spec.events || []).filter(nm => eventNames.has(nm));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

function main() {
  const d = load(f117);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const l1NameSet = new Set(persons.filter(p => (p.level || 1) === 1).map(p => p.name));
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  const evIdByName = new Map(events.map(e => [e.name, e.id]));
  const tlNodes = MINGUO_TIMELINE.map(n => {
    const id = evIdByName.get(n.title);
    return id ? { ...n, event_id: id } : { ...n };
  });
  d.timelines = d.timelines || {};
  d.timelines[MINGUO_TIMELINE_KEY] = tlNodes;
  events.forEach(ev => { ev.timeline_id = MINGUO_TIMELINE_KEY; });
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

    // 共享人物不足3个时，按同 timeline 邻近 → 同类型 → ±30年 补充
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
    // 事件页需要展示人事关系表中的全部人名，包括无详情页的未在册人物
    ev.related_persons = [...names].slice(0, 12);
    // 兜底：人物组均不在本朝人物表时，按人物人生经历中同名事件补入
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
    const originalRelated = (p.related_people || []).slice();
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
    const topup = L1_TOPUP_117[p.name] || [];
    const haveTop = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!haveTop.has(nm) && list.length < 6 && nameSet.has(nm)) { haveTop.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    // 一端不在册的关系仍需保留在在册人物的 related_people 中（前端点击不跳转）
    const haveExt = new Set(p.related_people.map(x => x.name));
    originalRelated.forEach(r => {
      if (r && r.name && !nameSet.has(r.name) && !haveExt.has(r.name)) {
        p.related_people.push({ name: r.name, relation: cleanRel(r.relation), influence: 60 });
        haveExt.add(r.name);
      }
    });
    if (p.related_people.length >= 4) l1ok++;
  });
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !['关联', '关系', '因缘', '参与', '未知'].includes(r.relation)); });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p => p.level === 1).length);

  console.log('\n===== #4b 二级人物 related_people 生成 =====');
  let l2relOk = 0, l2relTotal = 0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const originalRelated = (p.related_people || []).slice();
    const merged = new Map();
    (p.related_people || []).forEach(rp2 => {
      if (!rp2 || !rp2.name || !REL_REAL.has(cleanRel(rp2.relation))) return;
      merged.set(rp2.name, { name: rp2.name, relation: cleanRel(rp2.relation), influence: rp2.influence || 70 });
    });
    for (const [nb, rel] of (adjAll.get(p.name) || new Map())) {
      const r = cleanRel(rel);
      if (!REL_REAL.has(r)) continue;
      if (!merged.has(nb)) merged.set(nb, { name: nb, relation: r, influence: 55 + (l1NameSet.has(nb) ? 10 : 0) });
    }
    p.related_people = [...merged.values()]
      .sort((a, b) => (REL_PRIORITY[b.relation] ?? 0) - (REL_PRIORITY[a.relation] ?? 0) || b.influence - a.influence)
      .slice(0, 8);
    const haveExt = new Set(p.related_people.map(x => x.name));
    originalRelated.forEach(r => {
      if (r && r.name && !nameSet.has(r.name) && !haveExt.has(r.name) && REL_REAL.has(cleanRel(r.relation))) {
        p.related_people.push({ name: r.name, relation: cleanRel(r.relation), influence: r.influence || 60 });
        haveExt.add(r.name);
      }
    });
    l2relTotal += p.related_people.length;
    if (p.related_people.length >= 3) l2relOk++;
  });
  console.log('  二级人物 related_people (>=3) 数量:', l2relOk, '/', persons.filter(p => p.level === 2).length,
    '；平均条数:', (l2relTotal / Math.max(1, persons.filter(p => p.level === 2).length)).toFixed(2));

  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_117);
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

  save(f117, d);
  console.log('\n完成。');
}
module.exports = {};
main();
