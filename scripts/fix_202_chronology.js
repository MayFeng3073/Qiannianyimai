// 春秋事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「前632年」；跨两个确年写「前685-前643年」；
//       事发前的背景/事后的影响若超出事件区间，用「前770年前」「前453年后」表达
// 用法：node scripts/fix_202_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_202.json';

// 事件区间修正（仅修正与节点编年明显矛盾的 12 条，见脚本末尾报告）
const YEAR_OVERRIDES = {
  齐桓公即位与管仲改革: { start_year: -685, end_year: -643 },
  士会返晋: { start_year: -620, end_year: -613 },
  魏绛和戎: { start_year: -569, end_year: -562 },
  晋楚弭兵会盟: { start_year: -579, end_year: -546 },
  晋国六卿崛起: { start_year: -588, end_year: -490 },
  申包胥哭秦庭: { start_year: -506, end_year: -505 },
  勾践卧薪尝胆: { start_year: -494, end_year: -473 },
  晋阳之战: { start_year: -455, end_year: -453 },
  三家分晋: { start_year: -453, end_year: -403 },
  鲁国三桓专政: { start_year: -590, end_year: -505 },
  孔子周游列国: { start_year: -497, end_year: -484 },
  季札让国: { start_year: -561, end_year: -527 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  平王东迁: { 犬戎破镐京: '前771年', 平王即位: '前770年', 迁都洛邑: '前770年' },
  繻葛之战: { 君臣交恶: '前720年', 王师来伐: '前707年', 射王中肩: '前707年' },
  齐桓公即位与管仲改革: { 公孙无知之乱: '前686年', 齐桓即位: '前685年', 管仲为相: '前685年', 厉行改革: '前684年' },
  齐桓公伐楚: { 楚侵中原: '前656年', 齐率诸侯伐楚: '前656年', 召陵之盟: '前656年' },
  葵丘会盟: { 齐霸巅峰: '前651年', 周王遣使: '前651年', 订立盟约: '前651年' },
  重耳返晋即位: { 骊姬之乱: '前656年', 秦助返晋: '前636年', 整顿内政: '前636年' },
  介之推隐居绵山: { 辞禄不授: '前636年', 携母隐居: '前636年', 母子被焚: '前636年' },
  城濮之战: { 楚围宋国: '前633年', 晋伐曹卫: '前632年', 退避三舍: '前632年', 大破楚军: '前632年' },
  秦晋殽之战: { 郑人告密: '前628年', 秦过晋境: '前627年', 伏击全歼: '前627年', 放归三帅: '前627年' },
  赵穿弑晋灵公: { 灵公暴虐: '前607年', 灵公欲杀赵盾: '前607年', 赵穿弑君: '前607年' },
  '董狐书“赵盾弑其君”': { 弑君事发: '前607年', 太史直书: '前607年', 孔子称善: '前607年后' },
  楚庄王问鼎中原: { 楚伐陆浑: '前606年', 问鼎轻重: '前606年', 王孙满对: '前606年' },
  邲之战: { 楚攻郑国: '前597年', 晋楚对峙: '前597年', 晋军大败: '前597年', 楚霸南天: '前597年后' },
  鞍之战: { 齐伐鲁卫: '前589年', 晋师来援: '前589年', 齐师大败: '前589年', 齐晋盟约: '前589年' },
  士会返晋: { 奔秦避祸: '前620年', 秦晋相持: '前614年', 诱返晋国: '前614年', 出任执政: '前613年' },
  鄢陵之战: { 晋楚将战: '前576年', 对峙鄢陵: '前575年', 晋军扬威: '前575年', 晋国复振: '前575年后' },
  栾书弑晋厉公: { 厉公集权: '前575年', 厉公诛卿: '前574年', 栾书弑君: '前574年', 迎立悼公: '前573年' },
  晋悼公即位与晋国复兴: { 亡国公子: '前573年前', 即位明志: '前573年', 任用贤能: '前572年', 霸业中兴: '前569年' },
  魏绛和戎: { 戎族来犯: '前569年前', 魏绛进言: '前569年', 晋戎结盟: '前569年', 辑睦相安: '前562年' },
  晋楚弭兵会盟: { 第一次弭兵: '前579年', 盟约破裂: '前577年', 宋国再倡: '前546年', 四十载休兵: '前546年' },
  晋国六卿崛起: { 增设六卿: '前588年', 郤氏崛起: '前588年', 灭祁氏: '前514年', 六卿制晋: '前490年' },
  吴王阖闾即位: { 公子世系: '前526年', 专诸刺僚: '前515年', 任贤整军: '前515年' },
  专诸刺吴王僚: { 公子蓄志: '前515年', 鱼腹藏剑: '前515年', 阖闾立国: '前515年' },
  柏举之战: { 吴师远征: '前506年', 五战五捷: '前506年', 攻破郢都: '前506年', 鞭尸雪恨: '前506年' },
  吴军攻破郢都: { 乘胜追逼: '前506年', 郢都破城: '前506年', 占有楚室: '前506年' },
  伍子胥复仇: { 灭门之祸: '前522年', 助阖闾立: '前515年', 率师入郢: '前506年', 掘墓鞭尸: '前506年' },
  申包胥哭秦庭: { 楚都陷落: '前506年', 徒步入秦: '前506年', 哭秦庭七日: '前506年', 秦师复楚: '前505年' },
  楚国复国: { 秦师入楚: '前505年', 吴溃退兵: '前505年', 昭王复郢: '前505年', 修政图强: '前504年' },
  吴越檇李之战: { 越王新立: '前496年', 檇李对阵: '前496年', 越大破吴: '前496年', 夫差立志: '前496年' },
  会稽之战与勾践受辱: { 夫差报怨: '前494年', 夫椒大败: '前494年', 屈身请和: '前494年', 入吴为质: '前494年' },
  勾践卧薪尝胆: { 质于吴宫: '前494年', 归国图治: '前490年', 十年生聚: '前486年', 灭吴雪耻: '前473年' },
  黄池之会: { 夫差北上: '前482年', 会盟黄池: '前482年', 吴强争长: '前482年', 越袭吴都: '前482年' },
  勾践灭吴: { 越攻姑苏: '前478年', 吴都失守: '前473年', 夫差自刎: '前473年', 勾践称霸: '前473年' },
  晋阳之战: { 智伯索地: '前455年', 围困晋阳: '前454年', 水灌晋阳: '前453年', 三家灭智: '前453年' },
  智氏灭亡: { 智伯逞强: '前455年', 三家结盟: '前453年', 韩魏反水: '前453年', 智族覆灭: '前453年' },
  三家分晋: { 瓜分智地: '前453年', 三家专政: '前452年', 周王册封: '前403年', 战国开启: '前403年后' },
  鲁国三桓专政: { 三桓始盛: '前590年', 三分公室: '前562年', 逼走昭公: '前517年', 三桓专政: '前505年' },
  孔子周游列国: { 去鲁出行: '前497年', 厄于陈蔡: '前489年', 楚郊受讥: '前489年', 归鲁修书: '前484年' },
  季札让国: { 季札让位: '前561年', 出使列国: '前544年', 再让君位: '前527年', 岩盟让国: '前527年后' }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0;
const missingNodes = [], missingEvents = [], badFormat = [], extraEvents = [];
const multiYearEvents = [];
const seenEvents = new Set();

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  seenEvents.add(name);
  if (YEAR_OVERRIDES[name]) Object.assign(e, YEAR_OVERRIDES[name]);
  const years = new Set();
  for (const n of e.narratives || []) {
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    if (!/^前\d+年(?:前|后)?$/.test(yt) && !/^前\d+-前\d+年$/.test(yt)) badFormat.push(name + '/' + title + '=' + yt);
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
    years.add(yt);
  }
  if (years.size > 1) multiYearEvents.push(name);
  eventsTouched++;
}

for (const name of Object.keys(MAP)) if (!seenEvents.has(name)) extraEvents.push(name);

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log('已编年事件', eventsTouched, '个，写入节点年份', nodesTouched, '条');
console.log('事件节点总数', (data.events || []).reduce((a, e) => a + ((e.narratives || []).length), 0));
console.log('节点年份多样的事件', multiYearEvents.length, '个:', multiYearEvents.join('、'));
console.log('修正事件区间', Object.keys(YEAR_OVERRIDES).length, '个:', Object.keys(YEAR_OVERRIDES).map(k => k + ' ' + YEAR_OVERRIDES[k].start_year + '~' + YEAR_OVERRIDES[k].end_year).join('、'));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
if (extraEvents.length) console.log('映射中多余事件:', extraEvents.join('、'));
if (badFormat.length) console.log('格式异常:', badFormat.join('、'));
console.log('缺失事件', missingEvents.length, '个，缺失节点', missingNodes.length, '个，格式异常', badFormat.length, '个');
if (missingEvents.length || missingNodes.length || badFormat.length || extraEvents.length) process.exitCode = 1;
else console.log('PASS');
