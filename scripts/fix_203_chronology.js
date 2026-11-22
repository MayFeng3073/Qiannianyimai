// 战国事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「前356年」；跨两个确年写「前356-前338年」；
//       事发前的背景/事后的影响若超出事件区间，用「前453年前」「前221年后」表达
// 用法：node scripts/fix_203_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_203.json';

// 事件区间修正（原数据为单一年份，与节点编年明显矛盾）
const YEAR_OVERRIDES = {
  战国七雄形成: { start_year: -453, end_year: -403 },
  魏文侯变法: { start_year: -445, end_year: -396 },
  李悝变法: { start_year: -406, end_year: -395 },
  吴起变法: { start_year: -386, end_year: -381 },
  申不害变法: { start_year: -355, end_year: -337 },
  齐威王改革: { start_year: -356, end_year: -320 },
  商鞅变法: { start_year: -356, end_year: -338 },
  商鞅二次变法: { start_year: -350, end_year: -338 },
  桂陵之战: { start_year: -354, end_year: -353 },
  长平之战: { start_year: -262, end_year: -260 },
  邯郸之战: { start_year: -259, end_year: -257 },
  秦灭六国: { start_year: -230, end_year: -221 },
  百家争鸣: { start_year: -475, end_year: -221 },
  孟子游说诸侯: { start_year: -372, end_year: -289 },
  庄子思想: { start_year: -369, end_year: -286 },
  墨家兴盛: { start_year: -468, end_year: -376 },
  '《墨经》成书': { start_year: -400, end_year: -300 },
  铁器推广: { start_year: -475, end_year: -221 },
  战国长城修筑: { start_year: -400, end_year: -221 },
  '《考工记》成书': { start_year: -475, end_year: -221 },
  荀子思想: { start_year: -313, end_year: -238 },
  稷下学术交流: { start_year: -370, end_year: -221 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  战国七雄形成: { 七雄雏形初定: '前453年', 大国兼并时代: '前403年' },
  魏文侯变法: { 魏文侯广纳贤才: '前445年', 魏国率先富强: '前403年' },
  李悝变法: { 李悝整法兴农: '前406年', 集权国富: '前395年' },
  吴起变法: { 吴起整军强楚: '前386年', 触怒贵戚半途而废: '前381年' },
  申不害变法: { 申不害以术治国: '前355年', 韩国一度国治兵强: '前337年' },
  齐威王改革: { 齐威王整肃纲纪: '前356年', 齐国摆脱积弱: '前341年', 稷下学风渐盛: '前320年代' },
  商鞅变法: { 商鞅首行新法: '前356年', 秦国由弱转强: '前350年' },
  商鞅二次变法: { 商鞅再行新政: '前350年', 县制取代封邑: '前350年', 中央集权成型: '前338年' },
  逢泽之会: { 魏惠王大会诸侯: '前344年', 诸侯坐大周室益衰: '前344年后' },
  桂陵之战: { 魏攻邯郸齐发兵: '前354年', 围魏救赵: '前353年', 千古奇计传世: '前353年后' },
  马陵之战: { 孙膑减灶骄敌: '前341年', 马陵道设伏: '前341年', 魏衰齐兴: '前341年后' },
  徐州相王: { 齐魏互尊王号: '前334年', 礼制进一步崩坏: '前334年', 列国竞相称王: '前334年后' },
  五国伐秦: { 五国联手伐秦: '前318年', 联军各怀异志: '前318年', 合纵抗秦之先声: '前318年后' },
  胡服骑射: { 赵武灵王倡胡服: '前307年', 骑兵取代车战: '前307年后', 农牧文明交流: '前307年后' },
  沙丘宫变: { 主父干政起疑: '前295年', 沙丘宫围困: '前295年', 赵国政局转向: '前295年后' },
  伊阙之战: { 秦军挥师韩魏: '前293年', 白起分割歼敌: '前293年', 中原格局逆转: '前293年后' },
  乐毅伐齐: { 燕昭王整军伐齐: '前284年', 连下七十余城: '前284年', 东方格局剧变: '前284年后' },
  田单复齐: { 田单即墨死守: '前279年', 火牛阵破燕: '前279年', 齐国转危为安: '前279年后' },
  白起破郢: { 白起深入楚境: '前278年', 楚都陷落迁都: '前278年', 楚国由盛转衰: '前278年后' },
  长平之战: { 秦赵争夺上党: '前262年', 白起坑杀赵军: '前260年', 赵国元气大伤: '前260年后' },
  邯郸之战: { 秦军再围邯郸: '前259年', 魏楚联军来援: '前257年', 赵国转危为安: '前257年' },
  窃符救赵: { 信陵君盗兵符: '前257年', 邯郸之围得解: '前257年', 合纵精神的缩影: '前257年后' },
  秦灭西周: { 秦灭西周国: '前256年', 周室名存实亡: '前256年', 周政秩序终结: '前256年后' },
  秦灭东周: { 秦灭东周国: '前249年', 周朝彻底落幕: '前249年', 秦统一大势已成: '前249年后' },
  信陵君合纵抗秦: { 信陵君统率联军: '前247年', 合纵难以为继: '前247年', 六国最后的联合: '前247年后' },
  五国攻秦: { 五国再攻强秦: '前241年', 联军无功而返: '前241年', 合纵抗秦的绝唱: '前241年后' },
  嫪毐之乱: { 嫪毐集团作乱: '前238年', 秦王政收揽大权: '前238年', 秦王真正亲政: '前238年' },
  肥之战: { 李牧肥地御秦: '前233年', 重创秦军: '前233年', 赵国最后的胜仗: '前233年后' },
  荆轲刺秦: { 太子丹遣荆轲: '前227年', 图穷匕见事败: '前227年', 侠客悲歌传世: '前227年后' },
  秦灭六国: { 秦王远交近攻: '前230年前', 六国次第而灭: '前230-前221年' },
  秦统一六国: { 始皇帝并天下: '前221年', 开帝制之先河: '前221年' },
  百家争鸣: { 礼崩乐坏思变: '前453年', 诸子各逞其说: '前350年代' },
  孟子游说诸侯: { 孟子周游列国: '前320年代', 仁政思想传世: '前289年后' },
  庄子思想: { 庄子齐物逍遥: '前300年代', 泽被后世文哲: '前286年后' },
  墨家兴盛: { 墨子创墨家: '前450年代', 重科学兼济世: '前400年代' },
  '《墨经》成书': { 墨家后学论科学: '前300年代', 先秦科学瑰宝: '前221年前' },
  都江堰修建: { 李冰筑都江堰: '前256年', 成都平原成天府: '前256年后', 千年水利明珠: '前221年后' },
  郑国渠修建: { 郑国引泾灌田: '前246年', 关中沃野千里: '前246年后', 疲秦反成强秦: '前246年后' },
  铁器推广: { 铁农具渐兴: '前400年代', 冶铁带动百业: '前350年代', 生产力大跃升: '前300年代' },
  战国长城修筑: { 列国各筑长城: '前400年代', 分段戍守边陲: '前350年代', 秦长城之先声: '前221年后' },
  '《考工记》成书': { 百工技艺集大成: '前400年代', 古代工艺宝典: '前221年前' },
  '《吕氏春秋》': { 吕不韦集众著书: '前239年', 杂家之集大成: '前239年' },
  秦统一文字: { 六国文字各异: '前221年前', 李斯厘定小篆: '前221年', 天下书同文: '前221年后' },
  荀子思想: { 百家争鸣激荡: '前300年代', 荀子融通儒法: '前260年代', 影响秦汉儒法: '前238年后' },
  稷下学术交流: { 齐国广招贤士: '前370年代', 百家汇聚稷下: '前320年代', 学术繁荣之巅: '前300年代' }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0;
let nodesTotal = 0, diffEvents = 0;
const missingNodes = [], missingEvents = [], appliedOverrides = [];

const defaultYear = (e) => (e.start_year < 0 ? '前' + Math.abs(e.start_year) + '年' : e.start_year + '年');

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  if (YEAR_OVERRIDES[name]) {
    appliedOverrides.push(name + ': ' + e.start_year + '~' + e.end_year + ' → ' +
      YEAR_OVERRIDES[name].start_year + '~' + YEAR_OVERRIDES[name].end_year);
    Object.assign(e, YEAR_OVERRIDES[name]);
  }
  const fallback = defaultYear(e);
  let eventDiffs = 0;
  for (const n of e.narratives || []) {
    nodesTotal++;
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
    if (yt !== fallback) eventDiffs++;
  }
  if (eventDiffs > 0) diffEvents++;
  eventsTouched++;
}

console.log('事件数:', eventsTouched, '/', (data.events || []).length);
console.log('节点数:', nodesTotal, '（写入', nodesTouched, '条）');
console.log('年份不同于起始年的事件数:', diffEvents);
if (appliedOverrides.length) console.log('区间修正:\n  ' + appliedOverrides.join('\n  '));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
console.log('缺失数:', missingEvents.length + missingNodes.length);

if (missingEvents.length || missingNodes.length || nodesTotal !== 119) {
  console.log('RESULT: FAIL');
  process.exitCode = 1;
} else {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('RESULT: PASS');
}
