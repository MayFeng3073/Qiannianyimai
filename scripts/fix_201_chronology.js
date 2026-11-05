// 夏商西周事件「经过」逐节点编年：写入 narratives[].year_text
// 史实锚点（夏商周断代工程）：夏约前2070-约前1600；商约前1600-前1046；
//   盘庚迁殷约前1300；武丁约前1250-前1192；牧野之战前1046；
//   成康之治前1042-前996；国人暴动前841；西周亡前771
// 规则：公元前写「约前2070年」「前1046年」；跨两个确定/推定年份写「约前2070-约前1600年」；
//       背景/后续超出事件区间可用「约前2070年前」「前771年后」；
//       传说性节点（后羿代夏、寒浞篡夏等）用「约前20世纪」这类世纪表达，不编造精确年份
// 用法：node scripts/fix_201_chronology.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_201.json';

// 事件区间修正（仅修正与节点编年明显矛盾的条目）
const YEAR_OVERRIDES = {
  武丁中兴: { start_year: -1250, end_year: -1192 },
  妇好征伐: { start_year: -1250, end_year: -1250 },
  商王对外征伐: { start_year: -1250, end_year: -1192 },
  周公东征: { start_year: -1042, end_year: -1040 },
  制礼作乐: { start_year: -1040, end_year: -1036 },
  成康之治: { start_year: -1042, end_year: -996 },
  分封制: { start_year: -1046, end_year: -771 },
  宣王中兴: { start_year: -827, end_year: -782 },
  烽火戏诸侯: { start_year: -782, end_year: -771 }
};

// 事件名 → { 节点标题: 年份文字 }
const MAP = {
  太康失国: { 太康继位: '约前20世纪', 后羿夺权: '约前20世纪', 太康流亡: '约前20世纪' },
  少康中兴: { 少康生于危难: '约前20世纪', 寄居有虞氏: '约前20世纪', 起兵复国: '约前19世纪', 光复夏朝: '约前19世纪' },
  夏桀暴政: { 夏桀暴政: '约前17世纪' },
  商汤灭夏: { 商汤灭夏: '约前1600年' },
  盘庚迁殷: { 盘庚继位: '约前1300年', 决意迁都: '约前1300年', 发表训诰: '约前1300年', 迁都完成: '约前1300年' },
  武丁中兴: { 武丁继位: '约前1250年', 任用傅说: '约前1250年', 整顿内政: '约前1250年', 征伐四方: '约前1250-约前1192年', 盛世鼎盛: '约前1250-约前1192年' },
  妇好征伐: { 妇好征伐: '约前1250年' },
  商王对外征伐: { 商王对外征伐: '约前1250-约前1192年' },
  商末政治危机: { 商末政治危机: '约前11世纪' },
  牧野之战: { 孟津观兵: '前1046年前', 大军东进: '前1046年', 牧野誓师: '前1046年', 商军倒戈: '前1046年', 纣王自焚: '前1046年' },
  周公东征: { 周公东征: '前1042-前1040年' },
  成康之治: { 成王亲政: '前1036年', 册封诸侯: '前1036-前1021年', 康王继位: '前1021年', 天下太平: '前1042-前996年' },
  制礼作乐: { 制礼作乐: '前1040-前1036年' },
  分封制: { 分封制: '前1046-前771年' },
  国人暴动: { 厉王专利: '前841年前', 卫巫弭谤: '前841年前', 暴动爆发: '前841年', 厉王出逃: '前841年' },
  宣王中兴: { 宣王继位: '前827年', 任用贤才: '前827年', 征伐戎狄: '前827-前782年', 中兴之世: '前827-前782年' },
  犬戎攻周: { 犬戎攻周: '前771年' },
  西周灭亡: { 西周灭亡: '前771年' },
  启建夏朝: { 大禹去世: '约前2070年', 启夺王位: '约前2070年', 建立夏朝: '约前2070年', 甘之战: '约前2070年' },
  国人暴动与共和行政: { 专利政策: '前841年前', 卫巫弭谤: '前841年前', 国人暴动: '前841年', 厉王出逃: '前841年', 宣王继位: '前827年' },
  烽火戏诸侯: { 幽王继位: '前782年', 宠幸褒姒: '前779年', 烽火戏诸侯: '前779-前771年', 犬戎破京: '前771年', 西周灭亡: '前771年' }
};

// 从 year_text 取首个年份数字
function firstYear(text) {
  const m = String(text).match(/(\d{3,4})/);
  return m ? -Number(m[1]) : null;
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let eventsTouched = 0, nodesTouched = 0, totalNodes = 0;
let eventsDiffYear = 0, overrideCount = 0;
const missingNodes = [], missingEvents = [], overrideReport = [];

for (const e of data.events || []) {
  const name = String(e.name || '').trim();
  const map = MAP[name];
  if (!map) { missingEvents.push(name); continue; }
  const oldStart = e.start_year, oldEnd = e.end_year;
  if (YEAR_OVERRIDES[name]) {
    Object.assign(e, YEAR_OVERRIDES[name]);
    overrideCount++;
    overrideReport.push(`${name}: ${oldStart}~${oldEnd} → ${e.start_year}~${e.end_year}`);
  }
  let diff = false;
  for (const n of e.narratives || []) {
    totalNodes++;
    const title = String(n.title || '').trim();
    const yt = map[title];
    if (!yt) { missingNodes.push(name + '/' + title); continue; }
    if (firstYear(yt) !== e.start_year) diff = true;
    if (n.year_text !== yt) { n.year_text = yt; nodesTouched++; }
  }
  if (diff) eventsDiffYear++;
  eventsTouched++;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('事件数', eventsTouched, '节点数', totalNodes, '写入节点年份', nodesTouched, '条');
console.log('年份（与事件起始年）不同的事件数', eventsDiffYear);
console.log('修正事件区间', overrideCount, '条：');
overrideReport.forEach(x => console.log('  - ' + x));
if (missingEvents.length) console.log('未覆盖事件:', missingEvents.join('、'));
if (missingNodes.length) console.log('未覆盖节点:', missingNodes.join('、'));
console.log('缺失数', missingEvents.length + missingNodes.length);
console.log((missingEvents.length + missingNodes.length) === 0 && eventsTouched === 21 && totalNodes === 57 ? 'PASS' : 'FAIL');
