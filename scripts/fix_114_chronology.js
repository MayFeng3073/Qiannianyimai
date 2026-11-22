// 元朝事件「经过」逐节点编年：写入 narratives[].year_text
// 规则：单一确年写「1271年」；跨两个确年写「1271-1279年」；
//       事发前的背景/事后的影响若超出事件区间，用「1206年前」「1368年后」表达
// 用法：node scripts/fix_114_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_114.json';

// 事件区间修正（仅修正与节点编年明显矛盾者）
const YEAR_OVERRIDES = {
  至元改制: { start_year: 1260, end_year: 1279 },
  大都营建: { start_year: 1267, end_year: 1285 },
  行省制度确立: { start_year: 1271, end_year: 1279 },
  襄阳樊城之战: { start_year: 1268, end_year: 1273 },
  元缅战争: { start_year: 1277, end_year: 1287 },
  元安南战争: { start_year: 1283, end_year: 1288 },
  阿合马专权: { start_year: 1260, end_year: 1282 },
  桑哥理财: { start_year: 1287, end_year: 1291 },
  海都之乱: { start_year: 1266, end_year: 1301 },
  天历之变: { start_year: 1328, end_year: 1329 },
  延祐复科: { start_year: 1313, end_year: 1315 },
  脱脱更化: { start_year: 1340, end_year: 1351 },
  徐寿辉起义: { start_year: 1351, end_year: 1360 },
  张士诚起义: { start_year: 1353, end_year: 1367 },
  元末群雄割据: { start_year: 1351, end_year: 1368 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  忽必烈即位: { 蒙哥汗战死: '1259年', 忽必烈称汗: '1260年', 四汗分立: '1260年后' },
  元朝定国号: { 忽必烈稳固汗位: '1260-1264年', 取易经大元: '1271年', 元朝建立: '1271年' },
  至元改制: { 蒙制不适应: '1260年前', 刘秉忠主持改制: '1260-1264年', 确立元朝典制: '1271-1279年' },
  大都营建: { 燕京旧城: '1267年前', 择址规划: '1267年', 宫城营建: '1267-1274年', 定都大都: '1272年' },
  行省制度确立: { 疆域空前辽阔: '1271-1279年', 十行省分立: '1279年', 影响后世: '1279年后' },
  襄阳樊城之战: { 蒙宋攻宋前哨: '1268年前', 阿术围攻六年: '1268-1273年', 吕文焕投降: '1273年' },
  临安陷落: { 元军南下: '1274-1275年', 伯颜直逼临安: '1276年', 恭帝出降: '1276年' },
  南宋灭亡: { 宋室南逃: '1276-1278年', 崖山海战: '1279年', 南宋覆亡: '1279年' },
  元朝统一全国: { 南北分治: '1279年前', 崖山定局: '1279年', 疆域一统: '1279年', 混一南北: '1279年后' },
  澎湖巡检司设置: { 经略海疆: '1281年前', 设司澎湖: '1281年', 海道归治: '1281年后' },
  元代科举恢复: { 长期停废科举: '1313年前', 仁宗延祐复科: '1313年', 科举续行: '1313年后' },
  第一次征日战争: { 高丽归附: '1259-1270年', 遣使招日: '1266-1273年', 文永之役: '1274年', 暴风折返: '1274年' },
  第二次征日战争: { 南宋已灭: '1279年', 两路东征: '1281年', 鹰岛鏖战: '1281年', 台风覆师: '1281年' },
  元缅战争: { 缅使挑衅: '1277年前', 元军南征: '1277年', 牙嵩羌战: '1277年', 缅甸臣服: '1287年' },
  元安南战争: { 安南拒命: '1283年前', 元军三征: '1283-1288年', 陈氏游击: '1285-1288年', 元军撤退: '1288年' },
  阿合马专权: { 世祖理财: '1260年', 阿合马掌财: '1262年', 专权树敌: '1262-1282年', 朝野怨愤: '1282年' },
  刺杀阿合马: { 王著密谋: '1282年', 铜锤行刺: '1282年', 阿合马毙命: '1282年' },
  桑哥理财: { 财政困窘: '1287年前', 桑哥主政: '1287年', 清查钱谷: '1287-1291年', 增收节支: '1287-1291年' },
  桑哥案: { 专权树敌: '1287-1291年', 台臣弹劾: '1291年', 桑哥被诛: '1291年' },
  海都之乱: { 西北宗王不满: '1266年前', 海都长期扰边: '1266-1301年', 忽必烈亲征: '1289年' },
  乃颜之乱: { 东部宗王叛乱: '1287年', 忽必烈亲讨乃颜: '1287年', 乃颜被擒: '1287年' },
  南坡之变: { 英宗锐意改革: '1320-1322年', 铁失发动政变: '1323年', 英宗遇弑: '1323年' },
  天历之变: { 皇位争夺: '1328年', 两都之战: '1328年', 文宗继立: '1329年' },
  延祐复科: { 科举久废: '1313年前', 仁宗下诏: '1313年', 延祐首科: '1315年' },
  脱脱更化: { 伯颜专权: '1333-1340年', 脱脱逐伯颜: '1340年', 更化新政: '1340-1344年', 改革中断: '1351年' },
  黄河决口: { 河患频仍: '1344年前', 灾情蔓延: '1344年', 灾民流离: '1344年' },
  贾鲁治河: { 黄河连年决口: '1344-1351年', 贾鲁主持治河: '1351年', 红巾起义爆发: '1351年' },
  红巾军起义: { 繁重劳役民族矛盾: '1351年前', 韩山童刘福通起义: '1351年', 元朝分崩离析: '1351年后' },
  韩林儿称帝: { 红巾势盛: '1351-1355年', 亳州建号: '1355年', 小明王立: '1355年' },
  徐寿辉起义: { 蕲州起兵: '1351年', 天完建号: '1351年', 转战长江: '1351-1360年' },
  张士诚起义: { 盐丁起事: '1353年', 高邮建号: '1354年', 割据苏吴: '1356-1367年' },
  元末群雄割据: { 红巾蜂起: '1351年', 群雄并立: '1355-1360年', 相互攻伐: '1360-1367年', 元廷失控: '1355-1368年' },
  大都失陷与元朝灭亡: { 江南易手: '1367年', 徐达北伐: '1367-1368年', 大都陷落: '1368年', 元廷北遁: '1368年' }
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0, totalNodes = 0;
const missingNodes = [], missingEvents = [], extraNodes = [];
const seenEvents = new Set();

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  seenEvents.add(name);
  if (YEAR_OVERRIDES[name]) Object.assign(e, YEAR_OVERRIDES[name]);
  const seenTitles = new Set();
  for (const n of e.narratives || []) {
    totalNodes++;
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    seenTitles.add(title);
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
  }
  for (const key of Object.keys(map)) {
    if (!seenTitles.has(key)) extraNodes.push(name + '/' + key + '（映射多余）');
  }
  eventsTouched++;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('已编年事件', eventsTouched, '个，写入节点年份', nodesTouched, '条');
console.log('覆盖节点', totalNodes - missingNodes.length, '/', totalNodes);
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
if (extraNodes.length) console.log('映射多余节点:', extraNodes.join('、'));
console.log((!missingEvents.length && !missingNodes.length) ? 'PASS' : 'FAIL');
