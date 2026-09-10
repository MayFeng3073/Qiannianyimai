// 秦数据导入脚本 v1：从 Excel 生成 frontend/public/data/dynasty_106.json
// 结构完全对齐 import-chunqiu.js（春秋），只改朝代配置/ID前缀/类型映射
// 用法：node scripts/import-zhanguo.js
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
  id: 106, name: '秦', english_name: 'Qin Dynasty',
  start_year: -221, end_year: 206,
  summary: '秦灭六国而并天下，首创皇帝制度，废分封行郡县，车同轨、书同文、行同伦，修驰道直道、筑万里长城，却二世而亡，是中国历史上第一个大一统中央集权王朝。',
  capital: '咸阳', population: '约两千万', duration: '约15年',
  representative_buildings: ['万里长城', '阿房宫', '驰道', '灵渠'],
  characteristics: { politics: 96, culture: 82, military: 92, technology: 85, openness: 60 }
};

// ---- 读取并过滤秦数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('秦'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('秦'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('秦'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('秦'));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

// ---- 年份解析（与春秋一致）----
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

// ---- 后人评价解析 ----
function parseLaterQuotes(raw) {
  if (!raw) return [];
  const s = String(raw);
  const out = [];
  const re = /[“「]([^”」]{2,})[”」]\s*(?:——|—|–|-)?\s*(《[^》]{1,40}》)?/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) out.push({ text: m[1].trim(), author: (m[2] || '').trim() });
  }
  return out;
}

// ---- 生成人物 (一级 1060xx, 二级 1061xx) ----
// 人物类型归一化：将 Excel 中五花八门的类型统一为系统标准 6 类（与 Person.vue dimensionConfig 一致）
const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '军事家': '军事人物', '军事家/改革家': '军事人物', '军事家/外交家': '军事人物', '历史人物/刺客': '军事人物', '君主': '统治者', '君主/改革家': '统治者', '外交家': '政治人物', '改革家': '政治人物', '政治家/思想组织者': '政治人物', '工程家': '科技人物', '天文学家': '科技人物', '医学家': '科技人物', '文学家': '文化人物', '文学家/政治家': '文化人物' };
// 二级人物逐人分类（Excel 无类型列，依据身份摘要逐人归类，与一级人物 6 类体系一致）
const L2_CAT_MAP = {
  // 政治人物（秦廷丞相/宗室/朝臣/博士/南海郡守等）
  '王绾': '政治人物', '隗状': '政治人物', '周青臣': '政治人物', '冯毋择': '政治人物', '常頞': '政治人物',
  '赵亥': '政治人物', '成': '政治人物', '王戊': '政治人物', '赵婴': '政治人物', '杨樛': '政治人物',
  '韩谈': '政治人物', '秦零陵令信': '政治人物', '扶苏': '政治人物', '蒙毅': '政治人物', '冯去疾': '政治人物',
  '冯劫': '政治人物', '李由': '政治人物', '公子高': '政治人物', '公子将闾': '政治人物', '赵成': '政治人物',
  '赵佗': '政治人物', '张耳': '政治人物', '陈馀': '政治人物',
  // 军事人物（秦将/南下征将/三秦将/起义统帅）
  '蒙骜': '军事人物', '蒙武': '军事人物', '李信': '军事人物', '内史腾': '军事人物', '杨端和': '军事人物',
  '辛胜': '军事人物', '羌瘣': '军事人物', '杨熊': '军事人物', '王离': '军事人物', '司马欣': '军事人物',
  '董翳': '军事人物', '涉间': '军事人物', '屠睢': '军事人物', '任嚣': '军事人物', '陈胜': '军事人物',
  '吴广': '军事人物', '周文': '军事人物',
  // 思想人物（秦博士/儒家/经学家）
  '淳于越': '思想人物', '叔孙通': '思想人物', '孔鲋': '思想人物', '伏生': '思想人物',
  // 文化人物（文字学家/方士）
  '程邈': '文化人物', '侯生': '文化人物', '卢生': '文化人物',
  // 科技人物（水利工程）
  '史禄': '科技人物'
};
const persons = [];
let i2 = 1;
const nameToId = {};

// --- 一级人物 ---
const l1Persons = [];
let i1 = 1;
for (const r of l1) {
  const id = 106000 + i1++;
  const name = String(col(r, '姓名'));
  nameToId[name] = id;
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物');
  const cat = CAT_MAP[rawCat] || rawCat;
  const influence = Number(col(r, '历史影响力')) || 80;
  const impactRaw = col(r, '影响力描述');
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
    let y = birth || death || -350;
    const storyRaw = col(r, '代表事件');
    const items = storyRaw ? String(storyRaw).split(/[，,；;、]/) : [];
    life = items.filter(Boolean).slice(0, 4).map((t, k) => ({ year: y + k, title: t.trim(), description: name + '人生重要节点：' + t.trim(), importance: 8 }));
  }
  const dimDefaults = {
    '统治者': [95, 88, 92], '政治人物': [88, 85, 80], '军事人物': [88, 82, 75],
    '文化人物': [82, 78, 88], '思想人物': [82, 76, 90], '思想': [82, 76, 90], '外交人物': [82, 90, 78]
  };
  const dd = dimDefaults[cat] || [85, 80, 80];
  const tags = col(r, '人物标签') ? String(col(r, '人物标签')).split(/[；;、/\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
  const p = {
    id, name, dynasty: '秦',
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
  if (nameToId[name]) continue; // 与一级重名则跳过
  const id = 106100 + i2++;
  nameToId[name] = id;
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是${'秦'}时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是${'秦'}时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const p = {
    id, name, dynasty: '秦',
    summary,
    image_url: imageUrl(name),
    birth_year: null, death_year: null,
    category: L2_CAT_MAP[name] || '历史人物', level: 2,
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

// ---- 事件 (id 1063xx) ----
const events = [];
let e1 = 1;
const evNameToId = {};
const TYPE_MAP = { '战争军事': '战争军事', '战争': '战争军事', '会盟外交': '外交', '外交': '外交', '外交交流': '外交', '纵横': '外交', '政治改革': '政治事件', '变法': '政治事件', '政治权力': '政治事件', '政治迁都': '政治事件', '政治制度': '政治事件', '政变': '政治事件', '制度文化': '制度建设', '人物故事': '人物故事', '思想文化': '思想文化', '思想教育': '思想文化', '科技工程': '科技发明', '科技发明': '科技发明', '文化艺术': '文化艺术' };
for (const r of ev) {
  const id = 106300 + e1++;
  const name = String(col(r, '事件名称'));
  evNameToId[name] = id;
  const y = parseYear(String(col(r, '发生时间') || '')) || -350;
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
  const summaryText = String(col(r, '简介') || '').trim();
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为秦时期重要的${etype === '战争军事' ? '征战' : etype}事件，深刻影响了当时的政治格局，是理解秦七雄争雄历史的关键节点。`;
  events.push({
    id, name, dynasty: '秦',
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
const REL_MAP = { '对手': '敌对', '敌对': '敌对', '敌人': '敌对', '政敌': '敌对', '盟友': '盟友', '同盟': '盟友', '合作': '盟友', '君臣': '君臣', '父子': '亲属', '母子': '亲属', '兄弟': '亲属', '兄弟姐妹': '亲属', '夫妻': '亲属', '夫妻/宫廷关系': '亲属', '宗族': '亲属', '叔侄': '亲属', '祖孙': '亲属', '父子/宗族': '亲属', '同僚': '同僚', '朋友': '同僚', '友人': '同僚', '同门': '同僚', '师徒': '师生', '师生': '师生', '下属': '支持', '支持': '支持', '继承': '继承', '宗族/继承': '继承', '宗族/王位世系': '继承', '文化影响': '影响', '影响': '影响', '思想关联': '影响', '交流': '交流', '宗族/君臣': '君臣', '君臣/宗族': '君臣' };
// 人物名别名映射：关系表用名 → 人物表规范名（处理同名异写/括号注释/繁简差异）
const ALIAS = { '嬴政': '秦始皇（嬴政）', '秦始皇': '秦始皇（嬴政）', '胡亥': '秦二世（胡亥）', '秦二世': '秦二世（胡亥）' };
const canon = n => ALIAS[n] || n;
const personByName = n => persons.find(p => p.name === n) || persons.find(p => p.name === (ALIAS[n] || ''));
for (const r of rel) {
  const a = col(r, '起点人物'), b = col(r, '终点人物');
  const pa = personByName(a), pb = personByName(b);
  if (!pa || !pb) continue;
  const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
  if (!pa.related_people.find(x => x.name === pb.name)) pa.related_people.push({ name: pb.name, relation: type, influence: 75 });
  if (!pb.related_people.find(x => x.name === pa.name)) pb.related_people.push({ name: pa.name, relation: type, influence: 75 });
}
persons.forEach(p => { p.related_people = (p.related_people || []).slice(0, 10); });

// ---- 关键人物角色分类（人事关系表）----
function classifyRole(role) {
  const s = role || '';
  const OPPO = ['失败', '对立', '对抗', '反对', '挑战', '复仇对象', '竞争', '被消灭', '对手', '敌对', '敌', '讨伐对象', '征讨对象', '征伐对象', '落败', '竞争者', '叛乱', '被伐', '对抗方', '敌对者'];
  const AFF = ['被杀', '被弑', '被刺', '被俘', '被架空', '被救', '被驱逐', '失势', '末代君主', '逃亡', '受封', '被取代', '前任', '隐士', '被记史', '受害者', '被废', '受影响'];
  const LEAD = ['主导', '胜利', '盟主', '主角', '君主', '统帅', '主将', '主谋', '谋划', '军政谋划', '执行', '推动', '主持', '提出', '复国功臣', '功臣', '中兴', '创立', '组织', '元帅', '国君', '霸主', '变法者', '改革者', '支持', '完成', '联合者', '联盟者', '三家之一', '代表', '领导'];
  if (OPPO.some(k => s.includes(k))) return 'opponents';
  if (AFF.some(k => s.includes(k))) return 'affected';
  if (LEAD.some(k => s.includes(k))) return 'leaders';
  return 'participants';
}
for (const r of pev) {
  const eName = col(r, '事件'), pName = col(r, '人物');
  const e = events.find(x => x.name === eName); if (!e) continue;
  const p = personByName(pName);
  const name = p ? p.name : canon(pName);
  const role = String(col(r, '人事关系类型'));
  const g = classifyRole(role);
  if (!e.person_groups[g].find(x => x.name === name)) e.person_groups[g].push({ name, role });
  if (p) { if (!p.related_events.find(x => x.name === eName)) p.related_events.push({ name: eName, role }); }
}

// ---- event.person_relations ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  for (const r of rel) {
    const a = canon(col(r, '起点人物')), b = canon(col(r, '终点人物'));
    if (names.has(a) && names.has(b)) rels.push({ source: a, target: b, type: REL_MAP[String(col(r, '关系类型'))] || '关联', desc: String(col(r, '关系说明') || ''), sourceId: findPersonId(a), targetId: findPersonId(b) });
  }
  e.person_relations = rels.slice(0, 6);
}

// ---- 事件经过（分阶段叙述）----
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

// ---- 历史脉络：共享人物 + 时间先后 ----
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
    chain.forEach(c => {
      c.title = events.find(x => x.id === c.title)?.name || c.title;
    });
    e.chain = chain;
    if (e.chain.length === 0) e.chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
  }
}

// ---- 贡献富化 ----
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
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era', '战争': 'event', '制度文化': 'civilization', '科技发明': 'civilization', '核心人物': 'person', '文明制度': 'civilization', '文化地理': 'geo' };
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是秦时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_106.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_106.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  事件有经过: ' + events.filter(e => e.narratives.length > 0).length + ', 有影响: ' + events.filter(e => e.impacts.length > 0).length + ', 有脉络: ' + events.filter(e => e.chain.length > 0).length);
console.log('  事件有对手: ' + events.filter(e => e.person_groups.opponents.length > 0).length);
console.log('  一级有称号: ' + l1Persons.filter(p => p.achievement).length + ', 有历史地位: ' + l1Persons.filter(p => p.historical_position).length + ', 有后世评价: ' + l1Persons.filter(p => p.later_quotes.length).length + ', 有影响力描述: ' + l1Persons.filter(p => p.impact_list.length).length);

// ---- 后续处理（防止重新导入时覆盖已修复/已丰富的内容）----
// ① fix_106_content.js：事件经过分阶段 + 一级人物主要贡献描述精简到 50 字左右
console.log('\n--- 运行内容精修 fix_106_content.js ---');
require('./fix_106_content.js');
// ② enrich_106_relations.js：宏观时间线 / 推荐人物事件 / 二级引语 / 二级因缘际会
console.log('\n--- 运行数据丰富 enrich_106_relations.js ---');
require('./enrich_106_relations.js');