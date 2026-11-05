// 宋（113）事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「1069年」；跨两个确年写「1069-1085年」；
//       事发前的背景/事后的影响若超出事件区间，用「960年前」「1279年后」表达
// 用法：node scripts/fix_113_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_113.json';

// 事件区间修正（仅修正与节点编年明显矛盾的 29 条）
const YEAR_OVERRIDES = {
  统一南方战争: { start_year: 963, end_year: 979 },
  开宝藏雕印: { start_year: 971, end_year: 983 },
  澶渊之盟: { start_year: 1004, end_year: 1005 },
  庆历新政: { start_year: 1043, end_year: 1045 },
  狄青平侬智高: { start_year: 1052, end_year: 1053 },
  王安石变法: { start_year: 1069, end_year: 1085 },
  熙河开边: { start_year: 1071, end_year: 1073 },
  元祐更化: { start_year: 1085, end_year: 1093 },
  绍圣绍述: { start_year: 1094, end_year: 1097 },
  洛学兴起: { start_year: 1070, end_year: 1100 },
  苏门文人活动: { start_year: 1086, end_year: 1101 },
  北宋党争: { start_year: 1069, end_year: 1127 },
  靖康之变: { start_year: 1125, end_year: 1127 },
  南宋建立: { start_year: 1127, end_year: 1138 },
  建炎南渡: { start_year: 1127, end_year: 1141 },
  宗泽守东京: { start_year: 1127, end_year: 1128 },
  岳飞抗金: { start_year: 1127, end_year: 1140 },
  黄天荡之战: { start_year: 1130, end_year: 1130 },
  岳飞遇害: { start_year: 1141, end_year: 1142 },
  宋金隆兴和议: { start_year: 1163, end_year: 1164 },
  隆兴北伐: { start_year: 1163, end_year: 1164 },
  乾道淳熙之治: { start_year: 1165, end_year: 1189 },
  朱熹理学发展: { start_year: 1160, end_year: 1200 },
  庆元党禁: { start_year: 1195, end_year: 1197 },
  开禧北伐: { start_year: 1205, end_year: 1208 },
  嘉定和议: { start_year: 1207, end_year: 1208 },
  襄阳樊城之战: { start_year: 1267, end_year: 1273 },
  钓鱼城抗战: { start_year: 1243, end_year: 1279 },
  临安陷落: { start_year: 1274, end_year: 1276 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  陈桥兵变: { 北征行至陈桥: '960年', 黄袍加身: '960年', 受禅称帝: '960年' },
  北宋建立: { 陈桥兵变建宋: '960年', 定都汴京立制: '960年', 政局初定: '960年' },
  统一南方战争: { 先南后北方略: '963年', 讨平诸国: '963-975年', 天下一统: '979年' },
  杯酒释兵权: { 恐蹈前朝覆辙: '961年', 设宴示富贵: '961年', 兵权尽释: '961年' },
  开宝藏雕印: { 太祖敕刻藏经: '971年', 首部官刻大藏: '971-983年', 佛典流传后世: '983年后' },
  澶渊之盟: { 辽军南侵澶州: '1004年', 真宗亲征督战: '1004年', 澶渊订盟: '1005年' },
  庆历新政: { 兵冗财困: '1043年前', 范仲淹主新政: '1043年', 新政告罢: '1045年' },
  庆历和议: { 宋夏战罢议和: '1044年', 西夏接受册封: '1044年', 西北边境趋稳: '1044年后' },
  狄青平侬智高: { 侬智高起兵反宋: '1052年', 狄青南平岭南: '1053年', 稳固岭南统治: '1053年后' },
  王安石变法: { 积贫积弱思治: '1069年前', 颁行诸新法: '1069-1085年', 新旧党争: '1085年后' },
  熙河开边: { 王韶经略河湟: '1071-1072年', 宋军拓地熙河: '1072-1073年', 拓展西北边疆: '1073年后' },
  元丰改制: { 神宗改革官制: '1082年', 厘定三省职掌: '1082年', 规范中央行政: '1082年后' },
  乌台诗案: { 诗章讥政: '1079年', 入狱受审: '1079年', 贬谪黄州: '1079年' },
  元祐更化: { 宣仁太后临朝: '1085年', 力主恢复旧制: '1085-1086年', 政治路线转向: '1085-1093年' },
  绍圣绍述: { 哲宗亲政绍述: '1094年', 清算元祐旧党: '1094-1097年', 党争愈演愈烈: '1094年后' },
  洛学兴起: { 二程创立洛学: '1070-1085年', 倡格物穷理: '1070-1100年', 洛学泽被后世: '1100年后' },
  苏门文人活动: { 苏门文人结集: '1086-1093年', 推动北宋文风: '1086-1101年' },
  北宋党争: { 新旧党争肇始: '1069年', 政策用人对立: '1069-1100年', 党争蔓延朝野: '1100-1127年' },
  靖康之变: { 金兵两路南下: '1125-1126年', 城破汴京: '1127年', 北宋灭亡: '1127年' },
  南宋建立: { 靖康后南渡: '1127年', 应天即位: '1127年', 偏安江南: '1138年后' },
  建炎南渡: { 高宗辗转南迁: '1127-1131年', 北人大量南迁: '1127-1141年', 南宋格局奠定: '1131年后' },
  宗泽守东京: { 汴京残破待守: '1127年', 宗泽整军御敌: '1127-1128年', 三呼过河而卒: '1128年' },
  岳飞抗金: { 金兵南犯: '1127-1130年', 北伐连战皆捷: '1134-1140年', 郾城大捷: '1140年' },
  黄天荡之战: { 韩世忠阻击金军: '1130年', 水网设防制敌: '1130年', 抗金信心大振: '1130年后' },
  顺昌大捷: { 刘锜顺昌迎战: '1140年', 守城伏击破金: '1140年', 重创金军南下: '1140年后' },
  郾城之战: { 岳飞郾城迎敌: '1140年', 大破金军骑兵: '1140年', 遏制金军南侵: '1140年后' },
  绍兴和议: { 秦桧主和: '1141年', 割地称臣: '1141年', 北伐遂辍: '1141年后' },
  岳飞遇害: { 莫须有罪名: '1141年', 风波亭狱: '1142年', 日后昭雪: '1162年后' },
  宋金隆兴和议: { 北伐失利议和: '1163-1164年', 宋金达成和议: '1164年', 宋金改定名分: '1164年', 宋金长期相安: '1164年后' },
  隆兴北伐: { 孝宗起用主战: '1163年', 宋军初胜后败: '1163年', 北伐未果促和: '1163-1164年' },
  乾道淳熙之治: { 孝宗整饬内政: '1165-1189年', 社会经济繁荣: '1165-1189年', 改革持重谨慎: '1165-1189年', 南宋中期承平: '1165-1189年' },
  朱熹理学发展: { 朱熹集成理学: '1175-1200年', 讲学著述传道: '1160-1200年', 朱学影响后世: '1200年后' },
  庆元党禁: { 韩侂胄斥理学: '1195年', 理学被斥伪学: '1195-1197年', 党争牵连学术: '1195-1197年', 禁令渐弛学兴: '1202年后' },
  开禧北伐: { 韩侂胄主战: '1205年', 三路进兵失利: '1206年', 兵败请和: '1207-1208年' },
  嘉定和议: { 开禧北伐失利: '1207-1208年', 诛韩侂胄求和: '1207年', 重定边界岁币: '1208年', 宋金维持和平: '1208年后' },
  端平入洛: { 蒙古灭金图洛: '1234年', 宋军入洛受挫: '1234年', 宋蒙关系破裂: '1234年后' },
  蒙古灭金: { 蒙古崛起: '1234年前', 宋蒙联兵围蔡: '1234年', 蒙锋转宋: '1234年后' },
  襄阳樊城之战: { 襄樊长期攻防: '1267-1273年', 蒙军断援取势: '1268-1273年', 襄樊失守: '1273年' },
  钓鱼城抗战: { 合州山城据险: '1243年', 军民坚守山城: '1243-1259年', 蒙哥殒命城下: '1259年', 孤城坚守至终: '1279年' },
  临安陷落: { 元军长驱东下: '1274-1276年', 恭帝出降: '1276年', 残部南遁: '1276年' },
  崖山海战: { 宋室南遁崖山: '1279年', 崖山海战大败: '1279年', 帝昺蹈海: '1279年' }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0, totalNodes = 0, missingNodes = [], missingEvents = [];
let variedEvents = 0;
const overridesApplied = [];

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  if (YEAR_OVERRIDES[name]) {
    const before = e.start_year + '-' + e.end_year;
    Object.assign(e, YEAR_OVERRIDES[name]);
    overridesApplied.push(name + ' ' + before + ' → ' + e.start_year + '-' + e.end_year);
  }
  const years = new Set();
  for (const n of e.narratives || []) {
    totalNodes++;
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    years.add(yt);
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
  }
  if (years.size > 1) variedEvents++;
  eventsTouched++;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('已编年事件', eventsTouched, '个，节点', totalNodes, '个，写入节点年份', nodesTouched, '条');
console.log('节点年份非单一的事件:', variedEvents, '个');
console.log('修正事件区间:', overridesApplied.length, '条');
overridesApplied.forEach(s => console.log('  - ' + s));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
console.log('缺失事件数:', missingEvents.length, '缺失节点数:', missingNodes.length);
console.log((missingEvents.length === 0 && missingNodes.length === 0 && totalNodes === 127 && eventsTouched === 41) ? 'PASS' : 'FAIL');
