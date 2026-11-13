// 生成首页全局搜索索引：frontend/public/data/search-index.json
// 汇总 14 个朝代 JSON 中的朝代、人物、事件、关键词，供首页搜索与推荐模块使用。
// 用法：node scripts/build-search-index.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'frontend', 'public', 'data');

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

const entries = [];
const stats = { persons: 0, events: 0, works: 0, relations: 0, keywords: 0, dynasties: 0 };
const dynasties = [];

// 关键词类别（数据中为英文）→ 中文展示
const KW_CAT_LABEL = { event: '事件', civilization: '文明', person: '人物', era: '时代', geo: '地理' };
// 朝代常用别称：让「唐朝」「汉朝」「南北朝」等口语化输入也能直达朝代页
const DYN_ALIAS = {
  106: ['秦朝'], 107: ['汉朝'], 109: ['三国时期'], 110: ['晋朝', '南北朝', '两晋南北朝'],
  111: ['隋朝'], 112: ['唐朝'], 113: ['宋朝'], 114: ['元朝'], 115: ['明朝'], 116: ['清朝'],
  117: ['民国时期'], 201: ['夏朝', '商朝', '西周'], 202: ['春秋时期'], 203: ['战国时期']
};

const files = fs.readdirSync(dir).filter(f => /^dynasty_\d+\.json$/.test(f)).sort();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const meta = d.dynasty || {};
  const dynName = String(meta.name || '').trim();
  const dynId = Number(meta.id);

  dynasties.push({
    id: dynId,
    name: dynName,
    start: meta.start_year,
    end: meta.end_year,
    capital: meta.capital || '',
    duration: meta.duration || '',
    summary: String(meta.summary || '')
  });
  stats.dynasties++;

  entries.push({
    t: 'd',
    i: dynId,
    n: dynName,
    s: `${yearSpan(meta.start_year, meta.end_year)}${meta.capital ? ' · 都 ' + meta.capital : ''}`,
    a: DYN_ALIAS[dynId] || []
  });

  for (const p of d.persons || []) {
    const name = String(p.name || '').trim();
    if (!name) continue;
    stats.persons++;
    stats.works += (p.works || []).length;
    stats.relations += ((p.narrative_relations && p.narrative_relations.edges) || []).length;
    const parts = [p.dynasty || dynName, p.category || '', yearSpan(p.birth_year, p.death_year)].filter(Boolean);
    entries.push({
      t: 'p',
      i: p.id,
      n: name,
      s: parts.join(' · '),
      l: p.level === 2 ? 2 : 1
    });
  }

  for (const e of d.events || []) {
    const name = String(e.name || '').trim();
    if (!name) continue;
    stats.events++;
    entries.push({
      t: 'e',
      i: e.id,
      n: name,
      s: `${yearSpan(e.start_year, e.end_year)} · ${e.dynasty || dynName}`,
      o: String(e.one_sentence || e.summary || '').slice(0, 80)
    });
  }

  for (const k of d.keywords || []) {
    const name = String(k.name || '').trim();
    if (!name) continue;
    stats.keywords++;
    const cat = KW_CAT_LABEL[String(k.category || '')] || ''
    entries.push({
      t: 'k',
      n: name,
      s: cat ? `${dynName} · ${cat}` : dynName,
      d: dynId
    });
  }
}

const out = { generatedAt: new Date().toISOString().slice(0, 10), stats, dynasties, entries };
const target = path.join(dir, 'search-index.json');
fs.writeFileSync(target, JSON.stringify(out), 'utf8');
const kb = (fs.statSync(target).size / 1024).toFixed(1);
console.log('已生成', target);
console.log('条目', entries.length, JSON.stringify(stats), kb + 'KB');
