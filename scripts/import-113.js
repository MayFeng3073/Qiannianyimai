// 宋朝数据导入脚本 v1：从 Excel 生成 frontend/public/data/dynasty_113.json
// 结构对齐 import-112.js（唐朝），只改朝代配置/ID前缀/二级分类/别名
// 宋事件表列名与唐相同：简介（100字）→ 事件简介；历史影响描述（约35个字）→ 历史影响描述
// 用法：node scripts/import-113.js
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
  id: 113, name: '宋', english_name: 'Song Dynasty',
  start_year: 960, end_year: 1279,
  summary: '公元960年赵匡胤陈桥兵变代周建宋，定都汴京，结束五代十国分裂。宋初杯酒释兵权、重文轻武，经济文化空前繁荣，活字印刷、火药、罗盘等科技成就斐然。靖康之变后赵构南渡建南宋，偏安江南，与金、蒙古长期对峙。岳飞抗金、崖山殉国悲壮沉痛，1279年南宋亡。两宋文化昌盛、艺术精绝，是中国古代文明高度发展的黄金时代，对世界历史影响深远。',
  capital: '汴京（东京开封）、临安（杭州）', population: '约一亿（鼎盛）', duration: '约319年',
  representative_buildings: ['开封汴京宫城', '临安皇宫', '应天府崇圣殿', '景德镇官窑'],
  characteristics: { politics: 85, culture: 98, military: 70, technology: 92, openness: 88 }
};

// ---- 读取并过滤宋朝数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('宋'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('宋'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('宋'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('宋'));
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

// ---- 庙号/称号别名归并（人事关系表/人物关系表里用庙号引用本朝人物时归并到真名） ----
const ALIAS_MAP_113 = {
  '宋太祖': '赵匡胤', '宋太宗': '赵光义', '宋真宗': '赵恒', '宋仁宗': '赵祯', '宋神宗': '赵顼',
  '宋哲宗': '赵煦', '宋徽宗': '赵佶', '宋钦宗': '赵桓', '宋高宗': '赵构', '宋孝宗': '赵昚',
  '宋理宗': '赵昀'
};
// 金/元/跨代人物（属外朝/乱世，本轮跨朝代索引暂缓，事件关键人物组保留占位标记，不接入关系网）
const SONG_CROSS = new Set(['金兀术', '完颜宗弼', '忽必烈', '蒙古', '金太宗', '金熙宗', '金世宗', '陈东',
  '曾巩', '范纯仁', '范成大', '杨万里', '刘过', '程门弟子', '蔡沈', '赵昰', '赵昺', '邵宏渊']);

// ---- 生成人物 (一级 1130xx, 二级 1131xx) ----
const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '君主/改革家': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };
// 二级人物分类（Excel 无类型列，依身份/事迹归入标准 6 类）
const L2_CAT_MAP_113 = {
  // —— 统治者 ——
  '李继迁': '统治者', '赵桓': '统治者', '赵昀': '统治者',
  // —— 科技人物 ——
  '燕肃': '科技人物', '李诫': '科技人物',
  // —— 文化人物 ——
  '苏舜钦': '文化人物', '苏洵': '文化人物', '苏辙': '文化人物', '柳永': '文化人物', '秦观': '文化人物',
  '晁补之': '文化人物', '张耒': '文化人物', '晏殊': '文化人物', '晏几道': '文化人物', '米芾': '文化人物',
  '蔡襄': '文化人物', '李公麟': '文化人物', '王诜': '文化人物', '郭熙': '文化人物', '李成': '文化人物',
  '赵明诚': '文化人物', '黄庭坚': '文化人物',
  // —— 思想人物 ——
  '石介': '思想人物', '邵雍': '思想人物', '真德秀': '思想人物', '魏了翁': '思想人物', '陈亮': '思想人物',
  '叶适': '思想人物', '陆九渊': '思想人物', '吕祖谦': '思想人物', '张栻': '思想人物', '陆九龄': '思想人物',
  '杨简': '思想人物', '袁燮': '思想人物', '蔡元定': '思想人物', '黄干': '思想人物',
  // —— 政治人物 ——
  '王旦': '政治人物', '吕端': '政治人物', '吕蒙正': '政治人物', '李沆': '政治人物', '王钦若': '政治人物',
  '丁谓': '政治人物', '张齐贤': '政治人物', '吕夷简': '政治人物', '夏竦': '政治人物', '曾公亮': '政治人物',
  '余靖': '政治人物', '张方平': '政治人物', '吕惠卿': '政治人物', '曾布': '政治人物', '章惇': '政治人物',
  '蔡确': '政治人物', '吕嘉问': '政治人物', '曾孝宽': '政治人物', '吕大防': '政治人物', '刘挚': '政治人物',
  '孙傅': '政治人物', '何栗': '政治人物', '胡铨': '政治人物', '史弥远': '政治人物', '韩侂胄': '政治人物',
  '贾似道': '政治人物', '陆秀夫': '政治人物', '谢枋得': '政治人物', '陈宜中': '政治人物',
  // —— 军事人物（其余未列入者默认军事人物） ——
  '石守信': '军事人物', '王审琦': '军事人物', '潘美': '军事人物', '李继隆': '军事人物', '党进': '军事人物',
  '曹玮': '军事人物', '狄青': '军事人物', '王韶': '军事人物', '种师道': '军事人物', '种师中': '军事人物',
  '张叔夜': '军事人物', '宗泽': '军事人物', '姚平仲': '军事人物', '张浚': '军事人物', '刘光世': '军事人物',
  '张俊': '军事人物', '刘锜': '军事人物', '杨沂中': '军事人物', '李显忠': '军事人物', '曲端': '军事人物',
  '王彦': '军事人物', '傅选': '军事人物', '杨政': '军事人物', '魏胜': '军事人物', '张世杰': '军事人物',
  '姜才': '军事人物', '李庭芝': '军事人物', '张珏': '军事人物', '刘整': '军事人物', '王立': '军事人物'
};
const DEFAULT_L2_CAT = '军事人物';
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
  nameToId[name] = 113000 + i1;
  const id = 113000 + i1++;
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
    id, name, dynasty: '宋',
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
// 归并庙号/称号别名（如 宋太祖→赵匡胤）到别名表
Object.entries(ALIAS_MAP_113).forEach(([a, c]) => { if (nameToId[c]) addAlias(a, c); });

// --- 二级人物 ---
const l2Persons = [];
for (const r of l2) {
  const name = String(col(r, '姓名'));
  if (EXCLUDE_NAMES.has(name)) continue; // 跳过跨朝代重复人物
  if (nameToId[name]) continue; // 与一级重名或重复行则跳过
  const id = 113100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是宋朝时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是宋朝时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const cat = L2_CAT_MAP_113[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '宋',
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

// ---- 事件 (id 1133xx) ----
const events = [];
let e1 = 1;
const evNameToId = {};
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 113300 + e1++;
  const name = String(col(r, '事件名称'));
  evNameToId[name] = id;
  const y = parseYear(String(col(r, '发生时间') || '')) || 960;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  // 宋表「历史影响」列实为「历史影响描述（约35个字）」文本（列序在前命中），用作影响描述
  const significance = String(col(r, '历史影响') || '').trim();
  const rawType = String(col(r, '类型') || '').trim();
  const etype = TYPE_MAP[rawType] || '政治事件';
  const impacts = [];
  // 4维影响分数：精确匹配列名，避免「历史影响」命中「历史影响描述」文本列导致分数读不到
  for (const [colKey, nameKey] of [['政治影响', '政治影响'], ['社会影响', '社会影响'], ['文化影响', '文化影响'], ['历史影响', '历史影响']]) {
    const fk = Object.keys(r).find(kk => String(kk).trim() === colKey);
    const v = fk ? r[fk] : null;
    if (v != null && !isNaN(Number(v))) impacts.push({ name: nameKey, score: Number(v) });
  }
  const summaryText = String(col(r, '简介') || '').trim(); // 宋表「简介（100字）」
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为宋朝时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '宋',
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
  if (!pa || !pb) continue; // 跨朝代人物（金/元等）不接入关系网
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
  // 解析不到本朝人物（金/元群雄→待接入）：
  // 在事件关键人物组留占位标记，不写入本朝人物的 related_events，避免关系网孤点
  const unresolved = p ? null : '待接入';
  if (!e.person_groups[g].find(x => x.name === name)) e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: unresolved });
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

// ---- 事件经过（分阶段叙述初版：句切分，后续由 enrich_113 手写补全关键事件） ----
function buildNarratives(evObj) {
  const summary = evObj.summary;
  if (!summary) return [];
  const sents = summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (sents.length === 0) return [];
  const y = evObj.start_year;
  const tags = ['因起', '经过', '转折', '结果'];
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
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是宋朝时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_113.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_113.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  二级分类覆盖: ' + persons.filter(p => p.level === 2).length + ' 人, 未覆盖默认类 ' + l2Persons.filter(p => p.category === DEFAULT_L2_CAT).length + ' 人');
console.log('  事件有影响文本: ' + events.filter(e => e.significance).length + ', 有4维影响: ' + events.filter(e => e.impacts.length === 4).length + ', 有经过: ' + events.filter(e => e.narratives.length > 0).length + ', 有脉络: ' + events.filter(e => e.chain.length > 0).length);
console.log('  一级有称号: ' + l1Persons.filter(p => p.achievement).length + ', 有历史地位: ' + l1Persons.filter(p => p.historical_position).length + ', 有后世评价: ' + l1Persons.filter(p => p.later_quotes.length).length + ', 有影响力描述: ' + l1Persons.filter(p => p.impact_list.length).length);

if (fs.existsSync(path.join(__dirname, 'fix_113_content.js'))) {
  console.log('\n--- 运行内容精修 fix_113_content.js ---');
  require('./fix_113_content.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_113_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_113_relations.js ---');
  require('./enrich_113_relations.js');
}