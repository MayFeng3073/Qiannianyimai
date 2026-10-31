/**
 * 清朝(dynasty_116)数据丰富脚本（对齐 enrich_115_relations.js 明朝流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（继续探索：推荐人物/推荐事件）
 *   #3 二级 narrative_relations（因缘际会）
 *   #4 一级人物 related_people 扩充 + 二级 related_people 生成
 *   （事件经过由 fix_116_content.js 后续补齐，本脚本不覆盖 narratives）
 * 用法: node scripts/enrich_116_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f116 = path.join(DIR, 'dynasty_116.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 清朝历史脉络宏观时间线（10节点骨干，按事件名解析 event_id） ---------- */
const QING_TIMELINE_KEY = '清祚兴衰';
const QING_TIMELINE = [
  { title: '后金建立（清朝前身）', year: '1616年', desc: '赫图阿拉称汗，八旗初立' },
  { title: '皇太极称帝', year: '1636年', desc: '改国号大清，仿明设官' },
  { title: '清军入关', year: '1644年', desc: '定鼎北京，统一中原' },
  { title: '三藩之乱', year: '1673年', desc: '八年平叛，削除割据' },
  { title: '统一台湾', year: '1683年', desc: '郑克塽降，海疆归一' },
  { title: '尼布楚条约', year: '1689年', desc: '划定东北边界' },
  { title: '军机处设立', year: '1729年', desc: '中枢机要，皇权独揽' },
  { title: '平定准回', year: '1755年', desc: '西北底定，疆域极盛' },
  { title: '鸦片战争', year: '1840年', desc: '国门洞开，条约体系' },
  { title: '武昌起义与清帝退位', year: '1911年', desc: '帝制终结，民国肇建' }
];

/* ---------- #4 一级人物关系补全（仅在不足时补齐） ---------- */
const L1_TOPUP_116 = {
  '努尔哈赤': [['皇太极', '君臣'], ['多尔衮', '亲属'], ['代善', '亲属']],
  '皇太极': [['多尔衮', '君臣'], ['济尔哈朗', '君臣'], ['范文程', '君臣']],
  '多尔衮': [['顺治帝', '君臣'], ['孝庄太后', '亲属']],
  '孝庄太后': [['顺治帝', '母子'], ['康熙帝', '祖孙']],
  '顺治帝': [['多尔衮', '君臣'], ['孝庄太后', '母子'], ['张廷玉', '君臣']],
  '康熙帝': [['明珠', '君臣'], ['索额图', '君臣'], ['张廷玉', '君臣']],
  '雍正帝': [['年羹尧', '君臣'], ['隆科多', '君臣'], ['张廷玉', '君臣'], ['鄂尔泰', '君臣']],
  '乾隆帝': [['和珅', '君臣'], ['纪昀', '君臣'], ['刘墉', '君臣'], ['傅恒', '君臣']],
  '嘉庆帝': [['和珅', '敌对'], ['纪昀', '君臣']],
  '道光帝': [['林则徐', '君臣'], ['邓廷桢', '君臣']],
  '咸丰帝': [['曾国藩', '君臣'], ['胡林翼', '君臣']],
  '慈禧太后': [['恭亲王奕訢', '盟友'], ['李鸿章', '君臣'], ['光绪帝', '亲属']],
  '恭亲王奕訢': [['慈禧太后', '盟友'], ['李鸿章', '同僚'], ['曾国藩', '同僚']],
  '同治帝': [['慈禧太后', '母子'], ['李鸿章', '君臣']],
  '光绪帝': [['慈禧太后', '亲属'], ['康有为', '君臣'], ['梁启超', '君臣'], ['谭嗣同', '君臣']],
  '和珅': [['乾隆帝', '君臣'], ['嘉庆帝', '敌对'], ['纪昀', '敌对']],
  '张廷玉': [['雍正帝', '君臣'], ['乾隆帝', '君臣'], ['鄂尔泰', '同僚']],
  '林则徐': [['道光帝', '君臣'], ['邓廷桢', '同僚'], ['魏源', '影响']],
  '洪秀全': [['杨秀清', '君臣'], ['石达开', '君臣'], ['曾国藩', '敌对']],
  '曾国藩': [['李鸿章', '师生'], ['左宗棠', '同僚'], ['曾国荃', '兄弟'], ['胡林翼', '同僚']],
  '左宗棠': [['曾国藩', '同僚'], ['李鸿章', '敌对']],
  '李鸿章': [['曾国藩', '师生'], ['张之洞', '同僚'], ['左宗棠', '敌对'], ['盛宣怀', '君臣']],
  '张之洞': [['李鸿章', '同僚'], ['康有为', '敌对'], ['张謇', '影响']],
  '冯子材': [['刘永福', '盟友'], ['李鸿章', '同僚']],
  '刘永福': [['冯子材', '盟友']],
  '康有为': [['梁启超', '师生'], ['光绪帝', '君臣'], ['谭嗣同', '同僚']],
  '梁启超': [['康有为', '师生'], ['光绪帝', '君臣'], ['谭嗣同', '同僚']],
  '谭嗣同': [['康有为', '同僚'], ['梁启超', '同僚'], ['光绪帝', '君臣']],
  '严复': [['梁启超', '交流'], ['康有为', '影响']],
  '容闳': [['曾国藩', '君臣'], ['李鸿章', '同僚']],
  '詹天佑': [['张之洞', '影响']],
  '曹雪芹': [['纪昀', '交流']],
  '蒲松龄': [['纪昀', '影响']],
  '吴敬梓': [['纪昀', '交流']],
  '郑燮': [['罗聘', '影响'], ['李鱓', '同僚']]
};

/* ---------- 归一化关系标签 ---------- */
function cleanRel(s) { return String(s || '关系').split('·')[0].trim() || '关系'; }
const REL_SET = {
  '关系': 0, '关联': 0, '因缘': 0, '参与': 0,
  '敌对': 1, '对手': 1, '政敌': 1, '敌人': 1,
  '君臣': 2, '父子': 3, '母子': 3, '兄弟': 3, '夫妻': 3, '亲属': 3, '宗族': 3, '叔侄': 3, '祖孙': 3,
  '盟友': 4, '同盟': 4, '同僚': 5, '同袍': 5, '同朝': 5,
  '师生': 6, '师徒': 6, '影响': 7, '继承': 8, '交流': 9, '支持': 10
};
const REL_PRIORITY = {
  '君臣': 6, '父子': 6, '兄弟': 6, '夫妻': 6, '亲属': 6, '政敌': 6, '敌人': 6, '盟友': 5, '同盟': 5,
  '敌对': 5, '对手': 5, '师生': 4, '师徒': 4, '同僚': 3, '同袍': 3, '同朝': 3,
  '影响': 2, '继承': 2, '交流': 1, '支持': 1, '关联': 0, '关系': 0, '因缘': 0
};
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

/* ---------- #3 二级 narrative_relations（因缘际会）人工补强 ---------- */
const CURATED_116 = {
  '朱彝尊': { persons: [['陈维崧', '同僚'], ['纪昀', '影响'], ['王原祁', '交流']], events: [] },
  '洪昇': { persons: [['孔尚任', '交流'], ['纪昀', '影响']], events: [] },
  '孔尚任': { persons: [['洪昇', '交流'], ['纪昀', '影响']], events: [] },
  '王原祁': { persons: [['郑燮', '影响'], ['李鱓', '影响'], ['郎世宁', '同僚']], events: [] },
  '黄慎': { persons: [['郑燮', '盟友'], ['李鱓', '同僚'], ['罗聘', '同僚'], ['郎世宁', '同僚'], ['王原祁', '影响']], events: [] },
  '罗聘': { persons: [['郑燮', '同僚'], ['黄慎', '同僚'], ['李鱓', '同僚'], ['郎世宁', '同僚'], ['王原祁', '影响']], events: [] },
  '郎世宁': { persons: [['王原祁', '同僚'], ['黄慎', '交流']], events: [] },
  '包世臣': { persons: [['龚自珍', '盟友'], ['魏源', '交流'], ['林则徐', '交流'], ['梁启超', '影响']], events: [] },
  '葛云飞': { persons: [['裕谦', '君臣'], ['陈化成', '同僚'], ['关天培', '同僚']], events: ['鸦片战争'] },
  '龚自珍': { persons: [['魏源', '盟友'], ['包世臣', '盟友'], ['梁启超', '影响']], events: ['鸦片战争'] },
  '祁寯藻': { persons: [['林则徐', '同僚'], ['翁同龢', '同僚'], ['曾国藩', '同僚']], events: ['鸦片战争'] },
  '唐廷枢': { persons: [['盛宣怀', '同僚'], ['李鸿章', '君臣'], ['张謇', '同僚']], events: ['洋务运动'] },
  '张謇': { persons: [['张之洞', '影响'], ['盛宣怀', '同僚'], ['翁同龢', '影响']], events: ['洋务运动'] },
  '铁良': { persons: [['端方', '同僚'], ['岑春煊', '敌对'], ['载漪', '同僚'], ['张之洞', '同僚']], events: ['清末新政与预备立宪'] },
  '秋瑾': { persons: [['徐锡麟', '盟友'], ['邹容', '影响'], ['梁启超', '影响']], events: [] },
  '徐锡麟': { persons: [['秋瑾', '盟友'], ['邹容', '影响'], ['梁启超', '影响']], events: [] },
  '邹容': { persons: [['秋瑾', '影响'], ['徐锡麟', '影响'], ['梁启超', '影响']], events: [] }
};

function sanitizeCurated(raw, CURATED) {
  const personNames = new Set(raw.persons.map(p => p.name));
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => personNames.has(nm));
    const events = (spec.events || []).filter(nm => eventNames.has(nm));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

function main() {
  const d = load(f116);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));
  const l1NameSet = new Set(persons.filter(p => (p.level || 1) === 1).map(p => p.name));
  const personNamesArr = persons.map(p => p.name);

  console.log('===== #1 历史脉络时间线 =====');
  const evIdByName = new Map(events.map(e => [e.name, e.id]));
  const tlNodes = QING_TIMELINE.map(n => {
    const id = evIdByName.get(n.title);
    return id ? { ...n, event_id: id } : { ...n };
  });
  d.timelines = d.timelines || {};
  d.timelines[QING_TIMELINE_KEY] = tlNodes;
  events.forEach(ev => { ev.timeline_id = QING_TIMELINE_KEY; });
  console.log('  timeline节点', tlNodes.length, '（已挂事件', tlNodes.filter(n => n.event_id).length, '个）');

  const evPersonSet = new Map();
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    evPersonSet.set(ev.id, names);
  });

  const adjAll = new Map();
  const linkA = (a, b, rel) => {
    if (!nameSet.has(a) || !nameSet.has(b) || a === b) return;
    if (!adjAll.has(a)) adjAll.set(a, new Map());
    if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel);
  };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  const mentionedInStory = (text) => { if (!text) return []; return personNamesArr.filter(n => n && text.includes(n)); };
  persons.forEach(pp => mentionedInStory(pp.story?.content).forEach(m => { if (nameSet.has(m)) linkA(pp.name, m, '因缘'); }));
  const degA = (nm) => (adjAll.get(nm) || new Map()).size;

  const evByName = new Map();
  events.forEach(ev => {
    const ppl = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
      (ev.person_groups?.[k] || []).forEach(x => { if (nameSet.has(x.name)) ppl.add(x.name); }));
    ppl.forEach(n => { if (!evByName.has(n)) evByName.set(n, new Set()); evByName.get(n).add(ev.name); });
  });
  const evRoleByName = new Map();
  events.forEach(ev => {
    const roleOf = (arr, label) => (arr || []).forEach(x => { if (!x.name) return; if (!evRoleByName.has(x.name)) evRoleByName.set(x.name, new Map()); evRoleByName.get(x.name).set(ev.name, label); });
    roleOf(ev.person_groups?.leaders, '主导');
    roleOf(ev.person_groups?.participants, '参与');
    roleOf(ev.person_groups?.opponents, '对抗');
    roleOf(ev.person_groups?.affected, '受影响');
  });

  function relatedEventNames(ev) {
    const mine = evPersonSet.get(ev.id) || new Set();
    const scored = [];
    events.forEach(o => {
      if (o.id === ev.id) return;
      let share = 0; (evPersonSet.get(o.id) || []).forEach(n => { if (mine.has(n)) share++; });
      if (share > 0) scored.push({ id: o.id, name: o.name, share });
    });
    scored.sort((a, b) => b.share - a.share);
    let result = scored.slice(0, 6).map(s => s.name);

    // 共享人物不足3个时，按同 timeline 邻近 → 同类型 → ±30年 补充
    if (result.length < 3) {
      const have = new Set(result);
      const sameTimeline = events.filter(o => o.id !== ev.id && o.timeline_id === ev.timeline_id);
      sameTimeline.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
      sameTimeline.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      if (result.length < 4) {
        const sameType = events.filter(o => o.id !== ev.id && o.event_type === ev.event_type && !have.has(o.name));
        sameType.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
        sameType.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      }
      if (result.length < 3) {
        const near = events.filter(o => o.id !== ev.id && Math.abs(o.start_year - ev.start_year) <= 30 && !have.has(o.name));
        near.sort((a, b) => Math.abs(a.start_year - ev.start_year) - Math.abs(b.start_year - ev.start_year));
        near.forEach(o => { if (!have.has(o.name) && result.length < 6) { result.push(o.name); have.add(o.name); } });
      }
    }
    return result;
  }

  console.log('\n===== #2 推荐人物 / 推荐事件 =====');
  let rp = 0, re = 0;
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    // 事件页需要展示人事关系表中的全部人名，包括无详情页的未在册人物
    ev.related_persons = [...names].slice(0, 12);
    // 兜底：人物组均不在本朝人物表时，按人物人生经历中同名事件补入
    if (!ev.related_persons.length) {
      ev.related_persons = [...new Set(persons
        .filter(p => (p.life_events || []).some(le => le.title === ev.name))
        .map(p => p.name))].slice(0, 12);
    }
    ev.related_events = relatedEventNames(ev).filter(n => n !== ev.name).slice(0, 6);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 一级人物 related_people 扩充 =====');
  let l1ok = 0;
  persons.filter(p => (p.level || 1) === 1).forEach(p => {
    const originalRelated = (p.related_people || []).slice();
    const merged = new Map();
    (p.related_people || []).forEach(rp2 => { if (rp2 && rp2.name) merged.set(rp2.name, { type: rp2.relation || '关系', count: (merged.get(rp2.name)?.count || 0) + 1 }); });
    events.forEach(ev => (ev.person_relations || []).forEach(r => {
      const other = r.source === p.name ? r.target : (r.target === p.name ? r.source : null);
      if (other && nameSet.has(other)) { const cur = merged.get(other); merged.set(other, { type: r.type || (cur?.type || '关系'), count: (cur?.count || 0) + 1 }); }
    }));
    events.forEach(ev => {
      const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
      const inGroups = groups.some(g => g.some(x => x.name === p.name));
      if (!inGroups) return;
      groups.forEach((g, gi) => {
        g.forEach(x => { if (x.name && x.name !== p.name && nameSet.has(x.name)) { const rel = gi === 2 ? '敌对' : '同盟'; const cur = merged.get(x.name); if (!cur || cur.count === 0) merged.set(x.name, { type: rel, count: (cur?.count || 0) + 1 }); } });
      });
    });
    const list = [...merged.entries()].map(([nm, info]) => ({
      name: nm, relation: cleanRel(info.type),
      influence: Math.min(95, 55 + info.count * 8 + (l1NameSet.has(nm) ? 20 : 0)),
    })).sort((a, b) => b.influence - a.influence);
    if (list.length < 6) {
      const have = new Set(list.map(x => x.name));
      const direct = [], indirect = [], visited = new Set([p.name]), q = [[p.name, 0]];
      while (q.length) {
        const [cur, dep] = q.shift();
        if (dep >= 2 || direct.length >= 8) break;
        for (const [nb, rel] of (adjAll.get(cur) || new Map())) {
          if (visited.has(nb)) continue;
          visited.add(nb);
          if (dep === 0) direct.push([nb, rel]); else indirect.push([nb, rel]);
          q.push([nb, dep + 1]);
          if (direct.length >= 8) break;
        }
      }
      direct.sort((a, b) => {
        const l1a = l1NameSet.has(a[0]) ? 1 : 0, l1b = l1NameSet.has(b[0]) ? 1 : 0;
        if (l1a !== l1b) return l1b - l1a;
        return degA(b[0]) - degA(a[0]);
      }).forEach(([nm, rel]) => { if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '关系', influence: 60 + (l1NameSet.has(nm) ? 15 : 0) }); } });
      indirect.sort((a, b) => {
        const l1a = l1NameSet.has(a[0]) ? 1 : 0, l1b = l1NameSet.has(b[0]) ? 1 : 0;
        if (l1a !== l1b) return l1b - l1a;
        return degA(b[0]) - degA(a[0]);
      }).forEach(([nm]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 + (l1NameSet.has(nm) ? 15 : 0) }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    const topup = L1_TOPUP_116[p.name] || [];
    const haveTop = new Set(list.map(x => x.name));
    topup.forEach(([nm, rel]) => { if (!haveTop.has(nm) && list.length < 6 && nameSet.has(nm)) { haveTop.add(nm); list.push({ name: nm, relation: cleanRel(rel), influence: 55 }); } });
    p.related_people = list.slice(0, 9);
    // 一端不在册的关系仍需保留在在册人物的 related_people 中（前端点击不跳转）
    const haveExt = new Set(p.related_people.map(x => x.name));
    originalRelated.forEach(r => {
      if (r && r.name && !nameSet.has(r.name) && !haveExt.has(r.name)) {
        p.related_people.push({ name: r.name, relation: cleanRel(r.relation), influence: 60 });
        haveExt.add(r.name);
      }
    });
    if (p.related_people.length >= 4) l1ok++;
  });
  persons.forEach(p => { if (p.related_people) p.related_people = p.related_people.filter(r => !['关联', '关系', '因缘', '参与', '未知'].includes(r.relation)); });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p => p.level === 1).length);

  console.log('\n===== #4b 二级人物 related_people 生成 =====');
  let l2relOk = 0, l2relTotal = 0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const originalRelated = (p.related_people || []).slice();
    const merged = new Map();
    (p.related_people || []).forEach(rp2 => {
      if (!rp2 || !rp2.name || !REL_REAL.has(cleanRel(rp2.relation))) return;
      merged.set(rp2.name, { name: rp2.name, relation: cleanRel(rp2.relation), influence: rp2.influence || 70 });
    });
    for (const [nb, rel] of (adjAll.get(p.name) || new Map())) {
      const r = cleanRel(rel);
      if (!REL_REAL.has(r)) continue;
      if (!merged.has(nb)) merged.set(nb, { name: nb, relation: r, influence: 55 + (l1NameSet.has(nb) ? 10 : 0) });
    }
    p.related_people = [...merged.values()]
      .sort((a, b) => (REL_PRIORITY[b.relation] ?? 0) - (REL_PRIORITY[a.relation] ?? 0) || b.influence - a.influence)
      .slice(0, 8);
    const haveExt = new Set(p.related_people.map(x => x.name));
    originalRelated.forEach(r => {
      if (r && r.name && !nameSet.has(r.name) && !haveExt.has(r.name) && REL_REAL.has(cleanRel(r.relation))) {
        p.related_people.push({ name: r.name, relation: cleanRel(r.relation), influence: r.influence || 60 });
        haveExt.add(r.name);
      }
    });
    l2relTotal += p.related_people.length;
    if (p.related_people.length >= 3) l2relOk++;
  });
  console.log('  二级人物 related_people (>=3) 数量:', l2relOk, '/', persons.filter(p => p.level === 2).length,
    '；平均条数:', (l2relTotal / Math.max(1, persons.filter(p => p.level === 2).length)).toFixed(2));

  console.log('\n===== #3 二级 narrative_relations（因缘际会） =====');
  const curated = sanitizeCurated(d, CURATED_116);
  const buildL2Graph = (p) => {
    const center = p.name;
    const N = new Map(), E = new Map();
    const addN = (name, type, size) => { if (!N.has(name)) N.set(name, { name, type, size: size || (type === 'person' ? (name === center ? 'large' : 'medium') : 'small') }); };
    const addE = (s, t, label) => { const k = [s, t].sort().join('|'); if (s !== t && !E.has(k)) E.set(k, { source: s, target: t, label, direction: 'forward' }); };
    addN(center, 'person', 'large');
    const cand = new Map();
    for (const [nb, rel] of (adjAll.get(center) || new Map())) {
      const r = cleanRel(rel);
      if (REL_REAL.has(r)) cand.set(nb, r);
    }
    [...cand.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel], i) => {
      addN(nm, 'person', i < 4 ? 'medium' : 'small');
      addE(center, nm, rel);
    });
    const evRoles = evRoleByName.get(center) || new Map();
    for (const [en, rel] of evRoles) { if (N.size >= 7) break; addN(en, 'event', 'small'); addE(center, en, rel); }
    const personNodes = [...N.keys()].filter(nm => nm !== center && N.get(nm).type === 'person');
    const pairs = [];
    for (let i = 0; i < personNodes.length; i++)
      for (let j = i + 1; j < personNodes.length; j++) {
        const rel = adjAll.get(personNodes[i])?.get(personNodes[j]);
        if (rel && REL_REAL.has(cleanRel(rel))) pairs.push({ a: personNodes[i], b: personNodes[j], rel: cleanRel(rel) });
      }
    pairs.sort((x, y) => (REL_PRIORITY[y.rel] ?? 0) - (REL_PRIORITY[x.rel] ?? 0));
    pairs.slice(0, 2).forEach(({ a, b, rel }) => addE(a, b, rel));
    if (personNodes.length < 3 && N.size < 6) {
      const evNamesForCenter = evByName.get(center) || new Set();
      events.forEach(ev => {
        if (!evNamesForCenter.has(ev.name) || N.size >= 7) return;
        const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
        groups.forEach((g, gi) => {
          if (N.size >= 7) return;
          g.forEach(x => {
            if (!x.name || x.name === center || !nameSet.has(x.name) || N.has(x.name)) return;
            const known = adjAll.get(center)?.get(x.name);
            const rel = known && REL_REAL.has(cleanRel(known)) ? cleanRel(known) : (gi === 2 ? '敌对' : '同朝');
            addN(x.name, 'person', 'medium');
            addE(center, x.name, rel);
          });
        });
      });
    }
    if (N.size < 5 && curated[p.name]) {
      const c = curated[p.name];
      const have = new Set(N.keys());
      c.persons.forEach(([nm, rel]) => { if (!have.has(nm) && N.size < 6) { addN(nm, 'person', 'medium'); addE(center, nm, cleanRel(rel) || '关系'); } });
      c.events.forEach(en => { if (!have.has(en) && N.size < 6) { addN(en, 'event', 'small'); addE(center, en, '参与'); } });
    }
    return { nodes: [...N.values()], edges: [...E.values()] };
  };
  let l2ok = 0, l2low = [];
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
    else l2low.push(p.name + '(' + g.nodes.length + ')');
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p => p.level === 2).length);
  if (l2low.length) console.log('  需人工补充的二级人物:', l2low.join(','));

  save(f116, d);
  console.log('\n完成。');
}
module.exports = {};
main();
