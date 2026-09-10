// 隋朝数据导入脚本 v1：从 Excel 生成 frontend/public/data/dynasty_111.json
// 结构对齐 import-110.js（晋南北朝），只改朝代配置/ID前缀/类型映射/二级分类/别名
// 用法：node scripts/import-sui.js
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
  id: 111, name: '隋', english_name: 'Sui Dynasty',
  start_year: 581, end_year: 618,
  summary: '公元581年杨坚代周建隋，589年平陈统一南北，结束自西晋末年以来三百多年分裂割据。文帝厉行开皇之治，创三省六部、确立科举、颁行均田，天下仓廪充实。炀帝即位后开凿大运河、营建东都与大兴城、西征吐谷浑、三伐高句丽，极役伤民致天下大乱。617年李渊晋阳起兵，618年江都兵变炀帝被杀，隋朝灭亡。其制度多被大唐所承，影响深远。',
  capital: '大兴城（长安）、东都洛阳', population: '约五千万（鼎盛）', duration: '约37年',
  representative_buildings: ['大兴城', '东都洛阳', '京杭大运河', '赵州桥'],
  characteristics: { politics: 88, culture: 88, military: 92, technology: 90, openness: 82 }
};

// ---- 读取并过滤隋朝数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('隋'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('隋'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('隋'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('隋'));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

// ---- 年份解析 ----
function parseYear(s) {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  let m = t.match(/约?公元前?(\d{1,4})(?:年|世纪)?/);
  if (m) return t.includes('世纪') ? -parseInt(m[1]) * 100 : -parseInt(m[1]);
  m = t.match(/约?(\d{1,2})世纪(?:初|中叶|前期|后期|末)?/);
  if (m) return parseInt(m[1]) * 100;
  m = t.match(/^约?(\d{1,4})年?/);
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

// ---- 生成人物 (一级 1110xx, 二级 1111xx) ----
const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '君主/改革家': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };
// 二级人物分类（Excel 无类型列，依身份/事迹归入标准 6 类）
const L2_CAT_MAP_111 = {
  // —— 隋宗室（统治者） ——
  '杨谅': '统治者', '杨秀': '统治者', '杨俊': '统治者', '杨爽': '统治者', '杨暕': '统治者',
  '杨昭': '统治者', '杨侑': '统治者', '杨浩': '统治者', '杨侗': '统治者', '杨林': '统治者', '杨雄': '统治者',
  // —— 政治人物 ——
  '杨达': '政治人物', '杨约': '政治人物', '柳述': '政治人物', '赵绰': '政治人物', '张衡': '政治人物',
  '李德林': '政治人物', '李圆通': '政治人物', '苏孝慈': '政治人物', '柳彧': '政治人物', '裴世矩': '政治人物',
  '裴蕴': '政治人物', '卫玄': '政治人物',
  // —— 军事人物 ——
  '窦荣定': '军事人物', '达奚长儒': '军事人物', '梁睿': '军事人物', '长孙览': '军事人物', '元景山': '军事人物',
  '元胄': '军事人物', '杨义臣': '军事人物', '周法尚': '军事人物', '薛世雄': '军事人物', '麦铁杖': '军事人物',
  '陈棱': '军事人物', '裴仁基': '军事人物', '樊子盖': '军事人物', '宇文化及': '军事人物', '宇文智及': '军事人物',
  // —— 新增隋末/乱世二级人物分类 ——
  '司马德戡': '军事人物', '翟让': '军事人物', '单雄信': '军事人物', '王伯当': '军事人物', '裴行俨': '军事人物',
  '罗士信': '军事人物', '李子通': '军事人物', '沈法兴': '军事人物', '林士弘': '军事人物', '朱粲': '军事人物',
  '孟海公': '军事人物', '徐圆朗': '军事人物', '郭子和': '军事人物', '王薄': '军事人物', '刘霸道': '军事人物',
  '刘元进': '军事人物', '魏刀儿': '军事人物', '宋金刚': '军事人物',
  '梁师都': '统治者', '李轨': '统治者', '薛仁杲': '统治者',
  '元文都': '政治人物', '卢楚': '政治人物', '萧皇后': '政治人物',
  '薛道衡': '文化人物', '卢思道': '文化人物', '王胄': '文化人物', '明克让': '文化人物',
  '灌顶': '思想人物', '僧璨': '思想人物', '智威': '思想人物',
};
const DEFAULT_L2_CAT = '政治人物';
// 需跳过的跨朝代重复人物（暂无可排除项）
const EXCLUDE_NAMES = new Set([]);

const persons = [];
let i2 = 1;
const nameToId = {};

// --- 一级人物 ---
const l1Persons = [];
const aliasMap = {};
const addAlias = (a, c) => { if (a && String(a).trim()) aliasMap[String(a).trim()] = c; };
let i1 = 1;
for (const r of l1) {
  const name = String(col(r, '姓名'));
  nameToId[name] = 111000 + i1;
  const id = 111000 + i1++;
  addAlias(name, name);
  const m = name.match(/^(.+?)（(.+?)）$/);
  if (m) { addAlias(m[1], name); addAlias(m[2], name); }
  (String(col(r, '称号') || '') || '').split(/[；;]/).forEach(a => addAlias(a, name));
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物').trim();
  const cat = CAT_MAP[rawCat] || rawCat || '政治人物';
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
    let y = birth || death || 200;
    const storyRaw = col(r, '代表事件');
    const items = storyRaw ? String(storyRaw).split(/[，,；;、]/) : [];
    life = items.filter(Boolean).slice(0, 4).map((t, k) => ({ year: y + k, title: t.trim(), description: name + '人生重要节点：' + t.trim(), importance: 8 }));
  }
  const dimDefaults = {
    '统治者': [95, 88, 92], '政治人物': [88, 85, 80], '军事人物': [88, 82, 75],
    '文化人物': [82, 78, 88], '思想人物': [82, 76, 90], '科技人物': [88, 80, 90]
  };
  const dd = dimDefaults[cat] || [85, 80, 80];
  const tags = col(r, '人物标签') ? String(col(r, '人物标签')).split(/[；;、/\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
  const p = {
    id, name, dynasty: '隋',
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
  if (EXCLUDE_NAMES.has(name)) continue; // 跳过跨朝代重复人物
  if (nameToId[name]) continue; // 与一级重名或重复行则跳过
  const id = 111100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是隋朝时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是隋朝时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const cat = L2_CAT_MAP_111[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '隋',
    summary,
    image_url: imageUrl(name),
    birth_year: null, death_year: null,
    category: cat, level: 2,
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

// ---- 事件 (id 1113xx) ----
const events = [];
let e1 = 1;
const evNameToId = {};
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 111300 + e1++;
  const name = String(col(r, '事件名称'));
  evNameToId[name] = id;
  const y = parseYear(String(col(r, '发生时间') || '')) || 581;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响') || '').trim();
  const rawType = String(col(r, '类型') || '').trim();
  const etype = TYPE_MAP[rawType] || '政治事件';
  const impacts = [];
  // 精确匹配列名，避免「历史影响」命中「历史影响（约35个字）」文本列导致分数读不到
  for (const [colKey, nameKey] of [['政治影响', '政治影响'], ['社会影响', '社会影响'], ['文化影响', '文化影响'], ['历史影响', '历史影响']]) {
    const fk = Object.keys(r).find(kk => String(kk).trim() === colKey);
    const v = fk ? r[fk] : null;
    if (v != null && !isNaN(Number(v))) impacts.push({ name: nameKey, score: Number(v) });
  }
  const summaryText = String(col(r, '简介') || '').trim();
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为隋朝时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '隋',
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

// ---- 关系聚合 ----
const REL_MAP = { '对手': '敌对', '敌对': '敌对', '敌人': '敌对', '政敌': '敌对', '盟友': '盟友', '同盟': '盟友', '合作': '盟友', '君臣': '君臣', '父子': '亲属', '母子': '亲属', '兄弟': '亲属', '兄弟姐妹': '亲属', '夫妻': '亲属', '夫妻/宫廷关系': '亲属', '宗族': '亲属', '叔侄': '亲属', '祖孙': '亲属', '父子/宗族': '亲属', '同僚': '同僚', '朋友': '同僚', '友人': '同僚', '同门': '同僚', '师徒': '师生', '师生': '师生', '下属': '支持', '支持': '支持', '继承': '继承', '宗族/继承': '继承', '宗族/王位世系': '继承', '文化影响': '影响', '影响': '影响', '思想关联': '影响', '交流': '交流', '宗族/君臣': '君臣', '君臣/宗族': '君臣' };
function canon(n) { return aliasMap[n] || n; }
function personByName(n) {
  return persons.find(p => p.name === n) || persons.find(p => p.name === (aliasMap[n] || ''));
}
for (const r of rel) {
  const a = col(r, '起点人物'), b = col(r, '终点人物');
  const pa = personByName(a), pb = personByName(b);
  if (!pa || !pb) continue;
  const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
  if (!pa.related_people.find(x => x.name === pb.name)) pa.related_people.push({ name: pb.name, relation: type, influence: 75 });
  if (!pb.related_people.find(x => x.name === pa.name)) pb.related_people.push({ name: pa.name, relation: type, influence: 75 });
}
persons.forEach(p => { p.related_people = (p.related_people || []).slice(0, 10); });

// ---- 关键人物角色分类 ----
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
  // 本朝解析不到的人（如隋末唐初过渡人物，归唐朝）在事件关键人物组留占位并标记，
  // 供唐朝接入后通过跨朝代索引识别接通；不写入本朝人物的 related_events，避免关系网孤点。
  if (!e.person_groups[g].find(x => x.name === name)) e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: '唐·待接入' });
  if (p) { if (!p.related_events.find(x => x.name === eName)) p.related_events.push({ name: eName, role }); }
}

// ---- event.person_relations ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  // 去重：同一对人物 + 同一关系类型只保留一条
  const seenPair = new Set();
  for (const r of rel) {
    const a = canon(col(r, '起点人物')), b = canon(col(r, '终点人物'));
    if (names.has(a) && names.has(b)) {
      const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
      const key = [a, b].sort().join('|') + '|' + type;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      rels.push({ source: a, target: b, type, desc: String(col(r, '关系说明') || ''), sourceId: findPersonId(a), targetId: findPersonId(b) });
    }
  }
  e.person_relations = rels.slice(0, 6);
}

// ---- 事件经过（分阶段叙述初版：句切分） ----
function buildNarratives(evObj) {
  const summary = evObj.summary;
  if (!summary) return [];
  const sents = summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (sents.length === 0) return [];
  const y = evObj.start_year;
  const tags = ['起因', '经过', '结果', '影响'];
  return sents.map((s, i) => ({
    year: y,
    tag: tags[i % tags.length],
    title: s.slice(0, 10) + (s.length > 10 ? '…' : ''),
    description: s
  }));
}
events.forEach(e => { e.narratives = buildNarratives(e); });

// ---- 历史脉络 ----
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
    chain.forEach(c => { c.title = events.find(x => x.id === c.title)?.name || c.title; });
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
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是隋朝时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_111.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_111.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  二级分类覆盖: ' + persons.filter(p => p.level === 2).length + ' 人, 未覆盖默认类 ' + l2Persons.filter(p => p.category === DEFAULT_L2_CAT).length + ' 人');
console.log('  事件有经过: ' + events.filter(e => e.narratives.length > 0).length + ', 有影响: ' + events.filter(e => e.impacts.length > 0).length + ', 有脉络: ' + events.filter(e => e.chain.length > 0).length);
console.log('  一级有称号: ' + l1Persons.filter(p => p.achievement).length + ', 有历史地位: ' + l1Persons.filter(p => p.historical_position).length + ', 有后世评价: ' + l1Persons.filter(p => p.later_quotes.length).length + ', 有影响力描述: ' + l1Persons.filter(p => p.impact_list.length).length);

if (fs.existsSync(path.join(__dirname, 'fix_111_content.js'))) {
  console.log('\n--- 运行内容精修 fix_111_content.js ---');
  require('./fix_111_content.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_111_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_111_relations.js ---');
  require('./enrich_111_relations.js');
}