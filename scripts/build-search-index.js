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

/** 事件历史影响平均分（0-100），用于估算知名度 */
function impactAvg(impacts) {
  const list = Array.isArray(impacts) ? impacts : []
  if (!list.length) return 0
  const sum = list.reduce((s, i) => s + (Number(i && i.score) || 0), 0)
  return sum / list.length
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
    const pYearText = yearSpan(p.birth_year, p.death_year) || '生卒不详';
    const parts = [p.dynasty || dynName, p.category || '', pYearText].filter(Boolean);
    entries.push({
      t: 'p',
      i: p.id,
      n: name,
      s: parts.join(' · '),
      l: p.level === 2 ? 2 : 1,
      d: dynId,
      // 结构化年代：供家族模块做「人生年代重叠」推荐，避免解析展示文本
      y: [p.birth_year ?? null, p.death_year ?? null],
      yt: pYearText,
      // 知名度权重：供首页「热门人物」按影响力挑选
      w: Number(p.influence) || (p.dimension_scores && p.dimension_scores.historical_influence) || 60
    });
  }

  for (const e of d.events || []) {
    const name = String(e.name || '').trim();
    if (!name) continue;
    stats.events++;
    const eYearText = yearSpan(e.start_year, e.end_year);
    entries.push({
      t: 'e',
      i: e.id,
      n: name,
      s: `${eYearText} · ${e.dynasty || dynName}`,
      o: String(e.one_sentence || e.summary || '').slice(0, 80),
      // 所属朝代按文件归属，避免 201 等朝代的事件 id 前缀（204）与朝代 id 不一致
      d: dynId,
      // 结构化年代：供家族模块做「人生年代重叠」推荐
      y: [e.start_year ?? null, e.end_year ?? null],
      yt: eYearText,
      // 知名度权重：相关人物、完整叙事、影响与背景越齐全，越适合作为「今日历史」
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
