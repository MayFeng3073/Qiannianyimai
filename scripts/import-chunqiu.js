// 春秋数据导入脚本 v2：从 Excel 生成 frontend/public/data/dynasty_202.json
// 新增：二级人物、事件经过/历史影响/历史脉络、人物历史地位/称号/后人评价/影响力描述、
//      关键人物角色分类优化、贡献描述富化
// 用法：node scripts/import-chunqiu.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';

function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}
function col(r, ...ks) {
  for (const k of ks) {
    const fk = Object.keys(r).find(kk => String(kk).includes(k));
    if (fk && r[fk] != null && String(r[fk]) !== '') return r[fk];
  }
  return null;
}

const DYN = {
  id: 202, name: '春秋', english_name: 'Spring and Autumn Period',
  start_year: -770, end_year: -476,
  summary: '春秋时期礼崩乐坏、王权式微，诸侯争霸迭起，齐桓、晋文、楚庄等先后称霸，文化上诸子百家萌发，孔子开儒家之先，是中国古代社会剧烈变革与思想解放的重要时代。',
  capital: '雒邑（周）', population: '约数千万', duration: '约294年',
  representative_buildings: ['孔子故里', '城濮古战场', '吴越故地', '郑国车马坑'],
  characteristics: { politics: 60, culture: 95, military: 90, technology: 70, openness: 75 }
};

// ---- 读取并过滤春秋数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('春秋'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('春秋'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('春秋'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('春秋'));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

// ---- 年份解析 ----
function parseYear(s) {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  let m = t.match(/约?前(\d{3,4})(?:年|世纪)?/);
  if (m) return t.includes('世纪') ? -(parseInt(m[1]) * 100) : -parseInt(m[1]);
  m = t.match(/约?(\d{3,4})年前?/);
  if (m) return -parseInt(m[1]);
  m = t.match(/^(\d{3,4})年?/);
  if (m) return parseInt(m[1]);
  return null;
}
function pbd(b, d) {
  return { birth: (b && b !== '不详') ? parseYear(String(b)) : null, death: (d && d !== '不详') ? parseYear(String(d)) : null };
}
function imageUrl(name, type = 'person') {
  const size = type === 'person' ? 'portrait_3_4' : 'landscape_16_9';
  const phr = type === 'person' ? 'ancient chinese historical figure ' + name + ' traditional ink painting style portrait' : 'ancient chinese historical event ' + name + ' traditional ink painting style';
  return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(phr) + '&image_size=' + size;
}
function fmtYear(y) {
  if (y == null) return '';
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
}

// ---- 后人评价解析： "原文"《出处》；"原文"《出处》 ----
function parseLaterQuotes(raw) {
  if (!raw) return [];
  const s = String(raw);
  const out = [];
  const re = /[“「]([^”」]{2,})[”」]\s*(?:《([^》]{1,40})》)?/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) out.push({ text: m[1].trim(), author: (m[2] || '').trim() });
  }
  return out;
}

// ---- 生成人物 (一级 2020xx, 二级 2021xx) ----
const persons = [];
let i2 = 1;
const nameToId = {};

// --- 一级人物 ---
const l1Persons = [];
let i1 = 1;
for (const r of l1) {
  const id = 202000 + i1++;
  const name = String(col(r, '姓名'));
  nameToId[name] = id;
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const cat = String(col(r, '人物类型') || '政治人物');
  const influence = Number(col(r, '历史影响力')) || 80;
  const tn = r;
  const impactRaw = col(tn, '影响力描述');
  const impactList = impactRaw ? String(impactRaw).split(/[；;、\n]/).map(s => s.trim()).filter(Boolean) : [];
  const works = col(r, '代表成果')
    ? String(col(r, '代表成果')).split(/[，,；;、\n]/).filter(Boolean).map(n => ({ name: n.trim() })).slice(0, 5)
    : [];
  let life = [];
  const lifeRaw = col(r, '人生时间轴');
  if (lifeRaw) {
    try { const arr = JSON.parse(String(lifeRaw).trim()); if (Array.isArray(arr)) life = arr.map(x => ({ year: Number(x.year), title: x.title, description: x.description || '', importance: Number(x.importance) || 5 })); } catch (e) {}
  }
  if (!life.length) {
    let y = birth || death || -650;
    const storyRaw = col(r, '代表事件');
    const items = storyRaw ? String(storyRaw).split(/[，,；;、]/) : [];
    life = items.filter(Boolean).slice(0, 4).map((t, k) => ({ year: y + k, title: t.trim(), description: name + '人生重要节点：' + t.trim(), importance: 8 }));
  }
  const dimDefaults = {
    '统治者': [95, 88, 92], '政治人物': [88, 85, 80], '军事人物': [88, 82, 75],
    '文化人物': [82, 78, 88], '思想人物': [82, 76, 90], '思想': [82, 76, 90]
  };
  const dd = dimDefaults[cat] || [85, 80, 80];
  const tags = col(r, '人物标签') ? String(col(r, '人物标签')).split(/[；;、/\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
  const p = {
    id, name, dynasty: '春秋',
    summary: String(col(r, '人物简介') || '').trim() || String(col(r, '历史地位') || '').trim(),
    historical_position: String(col(r, '历史地位') || '').trim(),
    achievement: (() => { const a = String(col(r, '称号') || '').trim(); return (a && a !== name) ? a : ''; })(),
    impact_list: impactList,
    later_quotes: parseLaterQuotes(col(r, '后人评价')),
    tags,
    image_url: imageUrl(name), birth_year: birth, death_year: death,
    category: cat, level: 1,
    birth_place: col(r, '出生地') ? String(col(r, '出生地')) : null,
    occupations: col(r, '身份') ? String(col(r, '身份')).split(/[，,；;]/).filter(Boolean) : [],
    works, related_people: [], life_events: life, related_events: [],
    influence,
    dimension_scores: { historical_influence: influence, relation_activity: Number(col(r, '关系活跃度')) || dd[1], professional_1: Number(col(r, '专业维度①')) || dd[0], professional_2: Number(col(r, '专业维度②')) || dd[2], professional_3: Number(col(r, '专业维度③')) || dd[2] },
    narrative_relations: { nodes: [], edges: [] }
  };
  l1Persons.push(p);
  persons.push(p);
}

// --- 二级人物 ---
const l2Persons = [];
for (const r of l2) {
  const name = String(col(r, '姓名'));
  if (nameToId[name]) continue; // 与一级重名则跳过（不占用序号）
  const id = 202100 + i2++;
  nameToId[name] = id;
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  // 简介独立于故事正文，避免与下方"人物故事"重复（以故事标题作为定位语）
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是${'春秋'}时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是${'春秋'}时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const p = {
    id, name, dynasty: '春秋',
    summary,
    image_url: imageUrl(name),
    birth_year: null, death_year: null,
    category: '历史人物', level: 2,
    birth_place: null,
    occupations: [],
    works: [], related_people: [], life_events: [], related_events: [],
    influence: 60,
    dimension_scores: { historical_influence: 60, relation_activity: 55, professional_1: 55, professional_2: 55, professional_3: 55 },
    story: { title: storyTitle, content: storyContent, image_url: imageUrl(name) },
    narrative_relations: { nodes: [], edges: [] }
  };
  l2Persons.push(p);
  persons.push(p);
}

// ---- 事件 (id 2023xx) ----
const events = [];
let e1 = 1;
const evNameToId = {};
const TYPE_MAP = { '战争军事': '战争军事', '会盟外交': '外交', '政治改革': '政治事件', '政治权力': '政治事件', '政治迁都': '政治事件', '政治制度': '政治事件', '制度文化': '制度建设', '人物故事': '人物故事', '政变': '政治事件', '外交改革': '外交' };
for (const r of ev) {
  const id = 202300 + e1++;
  const name = String(col(r, '事件名称'));
  evNameToId[name] = id;
  const y = parseYear(String(col(r, '发生时间') || '')) || -600;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响') || '').trim();
  const rawType = String(col(r, '类型') || '');
  const etype = TYPE_MAP[rawType] || '政治事件';
  const impacts = [];
  for (const [colKey, nameKey] of [['政治影响', '政治影响'], ['社会影响', '社会影响'], ['文化影响', '文化影响'], ['历史影响_1', '历史影响']]) {
    const v = col(r, colKey);
    if (v != null && !isNaN(Number(v))) impacts.push({ name: nameKey, score: Number(v) });
  }
  // 一句话导读：优先取历史影响首句，保证与"简介"不同，另兜底一句话定位
  const summaryText = String(col(r, '简介') || '').trim();
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为春秋时期重要的${etype === '战争军事' ? '征战' : etype}事件，深刻影响了当时的政治格局，是理解${rawType.includes('春秋') ? '' : '春秋'}争霸历史的关键节点。`;
  events.push({
    id, name, dynasty: '春秋',
    start_year: y, end_year: y,
    summary: summaryText,
    event_type: etype,
    related_persons: [],
    significance,
    image_url: imageUrl(name, 'event'),
    one_sentence,
    person_groups: { leaders: [], participants: [], opponents: [], affected: [] },
    narratives: [], background: bg, impacts, chain: [], related_events: [], person_relations: []
  });
}

// ---- 关系聚合：人物关系表 -> related_people (双向，含二级) ----
const REL_MAP = { '对手': '敌对', '敌对': '敌对', '敌人': '敌对', '盟友': '盟友', '同盟': '盟友', '君臣': '君臣', '父子': '亲属', '母子': '亲属', '兄弟': '亲属', '兄弟姐妹': '亲属', '夫妻': '亲属', '夫妻/宫廷关系': '亲属', '宗族': '亲属', '叔侄': '亲属', '祖孙': '亲属', '同僚': '同僚', '朋友': '同僚', '师徒': '师生', '师生': '师生', '下属': '支持', '支持': '支持', '继承': '继承', '文化影响': '影响', '影响': '影响', '交流': '交流' };
const personByName = n => persons.find(p => p.name === n);
for (const r of rel) {
  const a = col(r, '起点人物'), b = col(r, '终点人物');
  const pa = personByName(a), pb = personByName(b);
  if (!pa || !pb) continue;
  const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
  if (!pa.related_people.find(x => x.name === b)) pa.related_people.push({ name: b, relation: type, influence: 75 });
  if (!pb.related_people.find(x => x.name === a)) pb.related_people.push({ name: a, relation: type, influence: 75 });
}
// 裁剪 related_people 上限
persons.forEach(p => { p.related_people = (p.related_people || []).slice(0, 10); });

// ---- 关键人物角色分类（人事关系表）----
// 优先级：对手 > 受影响 > 主导 > 参与者
function classifyRole(role) {
  const s = role || '';
  const OPPO = ['失败', '对立', '对抗', '反对', '挑战', '复仇对象', '竞争', '被消灭', '对手', '敌对', '敌', '讨伐对象', '征讨对象', '征伐对象', '落败', '竞争者', '叛乱', '被伐', '对抗方', '敌对者'];
  const AFF = ['被杀', '被弑', '被刺', '被俘', '被架空', '被救', '被驱逐', '失势', '末代君主', '逃亡', '受封', '被取代', '前任', '隐士', '被记史', '受害者', '被废'];
  const LEAD = ['主导', '胜利', '盟主', '主角', '君主', '统帅', '主将', '主谋', '谋划', '军政谋划', '执行', '推动', '主持', '提出', '复国功臣', '功臣', '中兴', '创立', '组织', '元帅', '国君', '霸主'];
  if (OPPO.some(k => s.includes(k))) return 'opponents';
  if (AFF.some(k => s.includes(k))) return 'affected';
  if (LEAD.some(k => s.includes(k))) return 'leaders';
  return 'participants';
}
for (const r of pev) {
  const eName = col(r, '事件'), pName = col(r, '人物');
  const e = events.find(x => x.name === eName); if (!e) continue;
  const p = personByName(pName);
  const role = String(col(r, '人事关系类型'));
  const g = classifyRole(role);
  if (!e.person_groups[g].find(x => x.name === pName)) e.person_groups[g].push({ name: pName, role });
  if (p) { if (!p.related_events.find(x => x.name === eName)) p.related_events.push({ name: eName, role }); }
}

// ---- event.person_relations (事件中人物两两关系) ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  for (const r of rel) {
    const a = col(r, '起点人物'), b = col(r, '终点人物');
    if (names.has(a) && names.has(b)) rels.push({ source: a, target: b, type: REL_MAP[String(col(r, '关系类型'))] || '关联', desc: String(col(r, '关系说明') || ''), sourceId: findPersonId(a), targetId: findPersonId(b) });
  }
  e.person_relations = rels.slice(0, 6);
}

// ---- 事件经过（由简介分句生成阶段性叙述）----
function buildNarratives(evObj) {
  const summary = evObj.summary;
  if (!summary) return [];
  const sents = summary.split(/。/).map(s => s.trim()).filter(Boolean);
  if (sents.length === 0) return [];
  const y = evObj.start_year;
  return sents.map((s, i) => ({
    year: y, tag: '经过', title: s.slice(0, 12) + (s.length > 12 ? '…' : ''), description: s
  })).slice(0, 6);
}
events.forEach(e => { e.narratives = buildNarratives(e); });

// ---- 历史脉络：通过共享人物 + 时间先后构建 cause / consequence ----
{
  const eventPersonMap = new Map();
  for (const e of events) {
    const set = new Set();
    Object.values(e.person_groups).forEach(arr => (arr || []).forEach(x => set.add(x.name)));
    eventPersonMap.set(e.id, set);
  }
  const yearOf = id => events.find(e => e.id === id).start_year;
  const fmt = id => fmtYear(yearOf(id));
  for (const e of events) {
    const myNames = eventPersonMap.get(e.id);
    let causes = [], conses = [];
    for (const other of events) {
      if (other.id === e.id) continue;
      const shared = [...myNames].filter(n => eventPersonMap.get(other.id).has(n)).length;
      if (shared === 0) continue;
      if (other.start_year < e.start_year) causes.push({ id: other.id, shared });
      else if (other.start_year > e.start_year) conses.push({ id: other.id, shared });
    }
    causes.sort((a, b) => b.shared - a.shared || b.id - a.id || 0);
    conses.sort((a, b) => b.shared - a.shared || a.id - b.id || 0);
    let chain = [];
    causes.slice(0, 1).forEach(c => chain.push({ type: 'cause', title: c.id, year: fmt(c.id) }));
    chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
    conses.slice(0, 2).forEach(c => chain.push({ type: 'consequence', title: c.id, year: fmt(c.id) }));
    // 若因共享人物无结果，退化为时间相邻事件
    if (causes.length === 0 || conses.length === 0) {
      const sorted = events.map(x => x.id).filter(id => id !== e.id).sort((a, b) => yearOf(a) - yearOf(b));
      const before = sorted.filter(id => yearOf(id) < e.start_year).pop();
      const after = sorted.filter(id => yearOf(id) > e.start_year)[0];
      chain = [];
      if (before) chain.push({ type: 'cause', title: before, year: fmt(before) });
      chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
      if (after) chain.push({ type: 'consequence', title: after, year: fmt(after) });
      if (sorted.length === 0) chain = [{ type: 'event', title: e.id, year: fmt(e.id) }];
    }
    const tn = {};
    chain.forEach(c => { tn[c.type] = c; });
    chain.forEach(c => {
      c.title = events.find(x => x.id === c.title)?.name || c.title;
    });
    e.chain = chain;
    if (e.chain.length === 0) e.chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
  }
}

// ---- 贡献富化：为一级人物 works 填充 description（匹配相关事件简介 / 兜底描述）----
{
  const evSummaryMap = {};
  events.forEach(e => { evSummaryMap[e.name] = e.summary; });
  for (const p of l1Persons) {
    const relatedEvSummaries = (p.related_events || [])
      .map(re => typeof re === 'string' ? re : re.name)
      .map(n => evSummaryMap[n]).filter(Boolean);
    (p.works || []).forEach(w => {
      const matched = events.find(e => e.name === w.name || e.name.includes(w.name) || (w.name && e.name.includes(w.name.slice(0, 2))));
      if (matched && matched.summary) {
        w.description = matched.summary;
      } else if (relatedEvSummaries.length) {
        w.description = relatedEvSummaries[0];
      } else {
        w.description = `系${p.name}在${p.dynasty}时期的重要建树，深刻影响了当时${p.category === '统治者' ? '的政治格局' : '的历史进程'}。`;
      }
    });
  }
}

// ---- 关键词 ----
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era' };
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是春秋时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_202.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_202.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  事件有经过: ' + events.filter(e => e.narratives.length > 0).length + ', 有影响: ' + events.filter(e => e.impacts.length > 0).length + ', 有脉络: ' + events.filter(e => e.chain.length > 0).length);
console.log('  事件有对手: ' + events.filter(e => e.person_groups.opponents.length > 0).length);
console.log('  一级有称号: ' + l1Persons.filter(p => p.achievement).length + ', 有历史地位: ' + l1Persons.filter(p => p.historical_position).length + ', 有后世评价: ' + l1Persons.filter(p => p.later_quotes.length).length + ', 有影响力描述: ' + l1Persons.filter(p => p.impact_list.length).length);