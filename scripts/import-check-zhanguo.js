// 战国导入前置检查脚本（可复用：改 DYN 配置即可检查下一朝代）
// 读 6 个 Excel，挑出「战国」行，自动检查春秋导入时踩过的 4 类坑：
//   A. 序号/命名：姓名重复、空姓名
//   B. 空壳人物：一级缺简介，二级缺故事内容
//   C. 时间轴：一级人生时间轴、事件发生时间是否完整
//   D. 事件详情：背景/历史影响/类型/关键人物是否齐全
// 用法：node scripts/import-check-zhanguo.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'd:/SHUMEI/GraduationProject';

// ==================== 朝代配置（换朝代改这里） ====================
const DYN = { id: 203, name: '战国' };
// ================================================================

function read(fn) {
  try {
    const wb = XLSX.readFile(path.join(dir, fn));
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  } catch (e) {
    throw new Error(`无法读取 ${fn}: ${e.message}`);
  }
}
// 模糊找列：列名包含任一关键字即命中（与导入脚本一致）
function col(r, ...ks) {
  for (const k of ks) {
    const fk = Object.keys(r).find(kk => String(kk).includes(k));
    if (fk && r[fk] != null && String(r[fk]).trim() !== '') return r[fk];
  }
  return null;
}
function str(v) { return (v == null ? '' : String(v).trim()); }

// ---- 读表 ----
const l1 = read('1级人物数据.xlsx').filter(r => str(col(r, '朝代')).includes(DYN.name));
const l2 = read('2级人物数据.xlsx').filter(r => str(col(r, '朝代')).includes(DYN.name));
const ev = read('事件数据.xlsx').filter(r => str(col(r, '朝代')).includes(DYN.name));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

const report = { dynasty: DYN.name, generated_at: new Date().toISOString(), stats: {}, report: [] };
const WARN = [];
const ERR = [];

function fail(msg) { ERR.push(msg); report.report.push('[错] ' + msg); console.log('  [错] ' + msg); }
function warn(msg) { WARN.push(msg); report.report.push('[警] ' + msg); console.log('  [警] ' + msg); }

console.log('='.repeat(56));
console.log(`开始检查「${DYN.name}」导入数据`);
console.log('='.repeat(56));
console.log(`筛选到：一级人物 ${l1.length}，二级人物 ${l2.length}，事件 ${ev.length}`);
if (l1.length + l2.length + ev.length === 0) {
  console.log('\n⚠️  当前 Excel 里暂无「' + DYN.name + '」行（检查「朝代」列是否写了「' + DYN.name + '」）。');
  fs.writeFileSync(path.join(dir, `import_check_${DYN.id}.json`), JSON.stringify(report, null, 2), 'utf-8');
  return;
}

// ---- A. 序号 / 命名 ----
console.log('\n[A] 序号 / 命名检查');
const seen = new Map();
for (const r of l1.concat(l2)) {
  const n = str(col(r, '姓名'));
  if (!n) { warn(`存在空姓名行（朝代=${str(col(r, '朝代'))}）`); continue; }
  if (seen.has(n)) seen.set(n, seen.get(n) + 1); else seen.set(n, 1);
}
for (const r of l2) {
  const n = str(col(r, '姓名'));
  // 一级里也有的二级名字，导入时会按重名跳过（同一人）→ 正常,仅提示
  if (n && l1.some(a => str(col(a, '姓名')) === n)) {
    warn(`「${n}」同时出现在一级与二级表（导入会保留一级、跳过二级）。请确认是否同一人。`);
  }
}
seen.forEach((cnt, n) => { if (cnt > 1) fail(`「${n}」在${DYN.name}数据中出现 ${cnt} 次（可能重复或跨表重复）。`); });
if (seen.size) console.log(`  已登记 ${seen.size} 个不重复人名`);

// ---- B. 空壳人物 ----
console.log('\n[B] 人物完整性检查');
l1.forEach(r => {
  const n = str(col(r, '姓名'));
  const intro = str(col(r, '人物简介')) + str(col(r, '历史地位'));
  if (!intro) fail(`一级人物「${n}」没有人物简介/历史地位（会空壳）。`);
  if (!str(col(r, '人物类型'))) warn(`一级人物「${n}」缺「人物类型」。`);
  if (!str(col(r, '身份'))) warn(`一级人物「${n}」缺「身份」(职业)。`);
  // 人生时间轴必须是合法 JSON 数组
  const lifeRaw = col(r, '人生时间轴');
  if (lifeRaw) {
    try {
      const a = JSON.parse(String(lifeRaw).trim());
      if (!Array.isArray(a)) throw new Error('not array');
    } catch (e) { fail(`一级人物「${n}」的人生时间轴不是合法 JSON 数组。`); }
  }
  // 智能兜底检查：无时间轴且无代表事件时，导入会用合成节点 → 时间轴质量差
  if (!lifeRaw && !col(r, '代表事件')) {
    warn(`一级人物「${n}」既无「人生时间轴」也无「代表事件」，导入后时间轴将用占位节点，建议补「人生时间轴」。`);
  }
});
l2.forEach(r => {
  const n = str(col(r, '姓名'));
  if (l1.some(a => str(col(a, '姓名')) === n)) return; // 与一级重名的二级不强求故事
  if (!str(col(r, '故事内容'))) fail(`二级人物「${n}」缺「故事内容」（会空壳）。`);
  if (!str(col(r, '故事标题'))) warn(`二级人物「${n}」缺「故事标题」（简介定位语会变泛化）。`);
});
console.log(`  一级 ${l1.length} 条、二级 ${l2.length} 条已检查`);

// ---- C. 时间轴 / 事件发生时间 ----
console.log('\n[C] 时间轴完整性检查');
if (ev.length === 0) {
  warn(`没有任何「${DYN.name}」事件，历史时间轴将为空。`);
} else {
  ev.forEach(r => {
    const n = str(col(r, '事件名称'));
    const y = col(r, '发生时间');
    if (!y) warn(`事件「${n}」没有「发生时间」，时间轴将无法排序/落到默认年份。`);
  });
}
const noTimeAxis = l1.filter(r => !col(r, '人生时间轴')).length;
if (noTimeAxis) warn(`有 ${noTimeAxis}/${l1.length} 个一级人物缺「人生时间轴」（时间轴节点会减少）。`);
console.log(`  事件 ${ev.length} 个，一级缺时间轴 ${noTimeAxis} 人`);

// ---- D. 事件详情 ----
console.log('\n[D] 事件详情检查');
const BG = ['政治背景', '经济背景', '社会背景', '文化背景', '地理背景'];
if (ev.length) {
  ev.forEach(r => {
    const n = str(col(r, '事件名称'));
    const missing = [];
    if (!col(r, '简介')) missing.push('简介');
    if (!col(r, '历史影响')) missing.push('历史影响');
    if (!col(r, '类型')) missing.push('类型');
    if (!BG.some(k => col(r, k))) missing.push('背景(五个都空)');
    if (missing.length) {
      const t = missing.join('、');
      fail(`事件「${n}」缺：${t}。`);
    }
  });
  // 每个事件是否在人事关系表里有对应人物
  const evNameSet = new Set(ev.map(r => str(col(r, '事件名称'))));
  const eventPersonCount = new Map();
  pev.forEach(r => {
    const en = str(col(r, '事件'));
    if (evNameSet.has(en)) eventPersonCount.set(en, (eventPersonCount.get(en) || 0) + 1);
  });
  ev.forEach(r => {
    const en = str(col(r, '事件名称'));
    if (!(eventPersonCount.get(en) > 0)) warn(`事件「${en}」在「人事关系表」中没有任何对应人物（详情页关键人物会空）。`);
  });
}

// ---- 关系表引用（人物关系表 / 人事关系表）----
console.log('\n[E] 关系引用检查（人物关系表 / 人事关系表）');
// 本朝人物姓名集合
const personSet = new Set([...l1, ...l2].map(r => str(col(r, '姓名'))));
rel.forEach(r => {
  const a = str(col(r, '起点人物')), b = str(col(r, '终点人物'));
  // 若一个端点在本朝、另一个端点为空白 → 明显缺失
  if (personSet.has(a) && !b) fail(`人物关系表「${a}」的终点人物为空。`);
  if (personSet.has(b) && !a) fail(`人物关系表「${b}」的起点人物为空。`);
  // 一个端点在本朝、另一个却不在本朝人物表 → 跨朝代链接提示（导入时会按当前朝代匹配，匹配不到就跳过本次关系）
  if (personSet.has(a) && !personSet.has(b) && b) warn(`人物关系表「${a} ↔ ${b}」中「${b}」不在「${DYN.name}」人物表，该条关系可能被跳过。`);
  if (personSet.has(b) && !personSet.has(a) && a) warn(`人物关系表「${a} ↔ ${b}」中「${a}」不在「${DYN.name}」人物表，该条关系可能被跳过。`);
});

// ---- 汇总 ----
console.log('\n' + '='.repeat(56));
console.log(`检查完成：错误 ${ERR.length} 条，警告 ${WARN.length} 条`);
console.log('='.repeat(56));
report.stats = { level1: l1.length, level2: l2.length, events: ev.length, errors: ERR.length, warnings: WARN.length };
fs.writeFileSync(path.join(dir, `import_check_${DYN.id}.json`), JSON.stringify(report, null, 2), 'utf-8');
console.log(`报告已写入 import_check_${DYN.id}.json`);