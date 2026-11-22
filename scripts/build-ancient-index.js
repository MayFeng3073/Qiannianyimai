// 生成上古只读快照：frontend/public/data/ancient-index.json
// ================================================================
// 上古神话模块完全依赖 frontend/src/mock/data.ts，没有对应的 dynasty_*.json。
// 为了让家族模块能检索到上古人物/事件，这里在不改动 mock 的前提下，
// 从 mock/data.ts 只读解析「上古 / 虞夏时期」条目，生成一份静态索引快照。
//
// - 只读：脚本不写回 mock，也不被上古页面引用，上古模块零改动。
// - 合并：运行时与大历史索引（search-index.json）合并，按 kind:id 去重，
//        大历史优先（同名 id 冲突时以朝代 JSON 为准）。
//
// 用法：node scripts/build-ancient-index.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mockFile = path.join(root, 'frontend', 'src', 'mock', 'data.ts');
const outFile = path.join(root, 'frontend', 'public', 'data', 'ancient-index.json');

const src = fs.readFileSync(mockFile, 'utf8');

/** 从 TS 源码中截取 `export const <name> ... = [ ... ]` 的数组字面量 */
function extractArray(name) {
  const decl = src.indexOf(`export const ${name}`);
  if (decl < 0) throw new Error(`未找到数组 ${name}`);
  const open = src.indexOf('[', src.indexOf('=', decl));
  if (open < 0) throw new Error(`未找到数组 ${name} 的起始括号`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = open; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];

    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && next === '/') { lineComment = true; i++; continue; }
    if (c === '/' && next === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '[' || c === '{') { depth++; continue; }
    if (c === ']' || c === '}') {
      depth--;
      if (depth === 0 && c === ']') return src.slice(open, i + 1);
    }
  }
  throw new Error(`数组 ${name} 未闭合`);
}

/** 数组字面量是纯 JS 对象，直接求值即可（不执行任何模块代码） */
function evalArray(name) {
  return new Function(`return (${extractArray(name)});`)();
}

function fmtYear(y) {
  if (y === null || y === undefined) return '';
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
}
function yearSpan(a, b) {
  if (a === null && b === null) return '';
  if (a === null) return fmtYear(b);
  if (b === null || b === a) return fmtYear(a);
  return `${fmtYear(a)}—${fmtYear(b)}`;
}
function impactAvg(impacts) {
  const list = Array.isArray(impacts) ? impacts : [];
  if (!list.length) return 0;
  return list.reduce((s, i) => s + (Number(i && i.score) || 0), 0) / list.length;
}

const ANCIENT_DYNASTIES = new Set(['上古', '虞夏时期']);
const ANCIENT_DYN_ID = 100;

const dynasties = evalArray('dynasties');
const persons = evalArray('persons');
const events = evalArray('events');

const meta = dynasties.find(d => d.id === ANCIENT_DYN_ID) || { id: ANCIENT_DYN_ID, name: '上古' };

const entries = [];
let personCount = 0;
let eventCount = 0;
let workCount = 0;

// 朝代条目：让首页搜索「上古」也能直达朝代页（historyIndex 会忽略非人物/事件条目）
entries.push({
  t: 'd',
  i: ANCIENT_DYN_ID,
  n: meta.name,
  s: `${yearSpan(meta.start_year, meta.end_year)}${meta.capital ? ' · 都 ' + meta.capital : ''}`
});

for (const p of persons) {
  const name = String(p.name || '').trim();
  if (!name || !ANCIENT_DYNASTIES.has(p.dynasty)) continue;
  personCount++;
  const works = (p.works || []).length;
  workCount += works;
  const yt = yearSpan(p.birth_year, p.death_year) || '生卒不详';
  entries.push({
    t: 'p',
    i: p.id,
    n: name,
    s: [p.dynasty, p.category || '', yt].filter(Boolean).join(' · '),
    // 与 search-index 对齐：2 级人物跳转独立的「人物故事」页
    l: p.level === 2 ? 2 : 1,
    d: ANCIENT_DYN_ID,
    y: [p.birth_year ?? null, p.death_year ?? null],
    yt,
    // 作品数：首页统计「代表作品」时按条目精确累加
    wc: works,
    w: Number(p.influence) || (p.dimension_scores && p.dimension_scores.historical_influence) || 60
  });
}

for (const e of events) {
  const name = String(e.name || '').trim();
  if (!name || !ANCIENT_DYNASTIES.has(e.dynasty)) continue;
  eventCount++;
  const yt = yearSpan(e.start_year, e.end_year);
  entries.push({
    t: 'e',
    i: e.id,
    n: name,
    s: `${yt} · ${e.dynasty}`,
    o: String(e.one_sentence || e.summary || '').slice(0, 80),
    d: ANCIENT_DYN_ID,
    y: [e.start_year ?? null, e.end_year ?? null],
    yt,
    w: 1
      + (e.related_persons || []).length
      + (e.narratives || []).length * 2
      + (e.impacts || []).length
      + (e.chain || []).length
      + (e.background ? 1 : 0)
      + (e.significance ? 1 : 0)
      + Math.round(impactAvg(e.impacts) / 20)
  });
}

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'frontend/src/mock/data.ts（只读快照，上古模块与 mock 均未被修改）',
  dynasty: {
    id: ANCIENT_DYN_ID,
    name: meta.name,
    start: meta.start_year ?? null,
    end: meta.end_year ?? null,
    capital: meta.capital || '',
    duration: meta.duration || '',
    summary: String(meta.summary || '')
  },
  stats: { persons: personCount, events: eventCount, works: workCount },
  entries
};

fs.writeFileSync(outFile, JSON.stringify(out), 'utf8');
const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log('已生成', outFile);
console.log('上古快照', entries.length, '条', JSON.stringify(out.stats), kb + 'KB');
