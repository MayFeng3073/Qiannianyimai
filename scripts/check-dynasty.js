// ============================================================
// 通用朝代数据产物校验脚本（导入后检查 dynasty_<id>.json）
//
// 用法：
//   node scripts/check-dynasty.js          # 检查全部已登记朝代
//   node scripts/check-dynasty.js 201      # 只检查指定朝代
//   node scripts/check-dynasty.js 201 202  # 检查多个
//
// 把「用户历次提出的数据要求」编码为一条条自动断言，任何人无需
// 记忆规则，跑一遍看报告即可。有 [错] 时退出码为 1（便于 CI 接入）。
//
// ---------------- 朝代代号对照表（新增朝代在此登记即可） ----------------
//     id  名称          数据文件
//     100 上古（传说）   内置 mock（无独立 dynasty json）
//     201 夏商西周       frontend/public/data/dynasty_201.json
//     202 春秋           frontend/public/data/dynasty_202.json
//     203 战国           frontend/public/data/dynasty_203.json
//     （未来朝代：1 唐 / 2 汉 / 3 宋 / 4 明 / 5 清 / 秦 / 三国 / 晋南北朝 / 隋 / 元 / 民国）
//  新增朝代时，把 id 加进 DYNASTY_MAP 即可纳入本脚本。
//
// ---------------- 通用必须字段清单（页面读取 / 本脚本校验） ----------------
//   persons[].id / name / dynasty / level(1|2)
//   persons[].category           6 类：统治者/军事人物/政治人物/思想人物/文化人物/科技人物
//   persons[].summary            简介
//   persons[].works[]            {name, description}   description ≤50 字
//   persons[].impact_list[]      历史影响分点，每条完整无断句
//   persons[].later_quotes[]     后人评价，≤2 条
//   persons[].related_people[]   {name, relation}      relation 须为具体关系，禁泛化标签
//   persons[].narrative_relations{nodes[], edges[]}    因缘际会图谱（≥1核心+≥3外围）
//   persons[].story              {title, content}       二级人物故事正文（不得含后台文本）
//   events[].{id,name,type,...}                          事件（允许为空，前端显示 ComingSoon）
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');

// 朝代对照表（新增朝代在此登记）
const DYNASTY_MAP = {
  100: '上古（传说·内置mock，跳过校验）',
  106: '秦',
  107: '汉',
  109: '三国',
  110: '晋南北朝',
  111: '隋',
  112: '唐',
  113: '宋',
  201: '夏商西周',
  202: '春秋',
  203: '战国',
};
const SKIP_NO_FILE = []; // 无独立 json 的朝代（如上古）

// 一级人物标准分类
const CATEGORY_6 = ['统治者', '军事人物', '政治人物', '思想人物', '文化人物', '科技人物'];
// 关系「具体关系」白名单：BAN 会判错；其余未登记的新关系给提示（引导加白名单）
const REL_BAN = new Set(['关联', '因缘', '关系', '未知', '相关', '参与']);
const REL_OK = new Set(['君臣', '敌对', '对手', '盟友', '同盟', '师生', '同僚', '同朝', '影响', '交流',
  '继承', '亲属', '父子', '父女', '兄弟', '兄妹', '姐妹', '祖孙', '叔侄', '舅甥', '宗亲', '宗族', '同族',
  '子嗣', '子孙', '夫妻', '母子', '姻亲', '堂兄弟', '义父', '朋友', '同袍', '政敌', '师友', '支持']);

// 后台/占位文本特征
const BACKEND_PATTERNS = [/辅助节点/, /建议正式数据库/, /核验其标准/, /建议补/, /需要进一步核验/];

function load(id) {
  if (SKIP_NO_FILE.includes(id)) return null;
  const f = path.join(DATA_DIR, `dynasty_${id}.json`);
  if (!fs.existsSync(f)) return null;
  return { id, file: f, data: JSON.parse(fs.readFileSync(f, 'utf-8')) };
}

function run(id) {
  const entry = load(id);
  const name2 = DYNASTY_MAP[id] || id;
  if (!entry) {
    console.log(`[跳过] ${id}（${name2}）：无 dynasty_${id}.json 数据文件`);
    return { err: 0, warn: 0 };
  }
  const d = entry.data;
  const dyn = (d.dynasty || {});
  const persons = d.persons || [];
  const events = d.events || [];
  let err = 0, warn = 0;
  const E = m => { err++; console.log(`    [错] ${m}`); };
  const W = m => { warn++; console.log(`    [警] ${m}`); };
  const H = m => console.log(`    •   ${m}`);

  console.log(`\n==== 检查 ${id}（${dyn.name || name2}） ====`);

  // A. 朝代对象
  H(`朝代 ${dyn.name || '未知'}；${persons.length} 人 / ${events.length} 事件`);
  ['id', 'name', 'start_year', 'end_year'].forEach(k => {
    if (dyn[k] === undefined || dyn[k] === null) W(`朝代对象缺字段「${k}」`);
  });

  // B. 人物 id 唯一、基本字段
  const idSet = new Set();
  persons.forEach(p => { if (idSet.has(p.id)) E(`人物 id 重复：${p.id}`); idSet.add(p.id); });

  const l1 = persons.filter(p => (p.level || 1) === 1);
  const l2 = persons.filter(p => (p.level || 2) === 2);

  // C. 一级人物字段 & works 精简 & 后人评价条数 & 历史影响
  l1.forEach(p => {
    if (!p.name) E('存在空姓名一级人物');
    if (!p.category) W(`一级「${p.name||''}」缺 category`);
    else if (!CATEGORY_6.includes(p.category)) W(`一级「${p.name}」category=${p.category} 非标准6类`);
    if (!p.summary) W(`一级「${p.name}」缺简介 summary`);
    (p.works || []).forEach(w => {
      if (!w.name || !w.description) { W(`一级「${p.name}」works 项缺 name/description：${JSON.stringify(w)}`); return; }
      if (w.description.length > 55) W(`一级「${p.name}」works「${w.name}」${w.description.length}字，建议≤50`);
    });
    if ((p.later_quotes || []).length > 2) H(`一级「${p.name}」后人评价 ${p.later_quotes.length} 条（前端只展示前2）`);
    (p.impact_list || []).forEach(s => {
      if (!s || s.trim().length < 8) E(`一级「${p.name}」历史影响存在断句碎片：「${s}」`);
    });
  });
  H(`一级 ${l1.length} 人、二级 ${l2.length} 人`);

  // D. 二级人物分类（不得全集为泛化“历史人物”）
  const l2Cat = [...new Set(l2.map(p => p.category).filter(Boolean))];
  if (l2.length && (l2Cat.length === 1 && l2Cat[0] === '历史人物')) W(`二级人物 category 全集为「历史人物」（未分类）`);
  H(`二级分类集合：${l2Cat.join('、') || '（空）'}`);

  // E. 关系标签：禁泛化
  let relBan = [];
  persons.forEach(p => (p.related_people || []).forEach(rp => {
    const r = (rp.relation || '').split('·')[0].trim();
    if (!r) { E(`「${p.name}」存在空关系`); return; }
    if (REL_BAN.has(r)) relBan.push(`${p.name}→${rp.name}(${r})`);
    else if (!REL_OK.has(r)) W(`「${p.name}→${rp.name}」关系「${r}」未在白名单，请确认是否加白`);
  }));
  if (relBan.length) E(`关系存在泛化标签：${relBan.slice(0,8).join('；')}${relBan.length>8?'…':''}`);
  else H('关系标签均为具体类型，无泛化标签');

  // F. 因缘际会（二级 narrative_relations）
  let l2Low = [];
  l2.forEach(p => {
    const nr = p.narrative_relations;
    const nodes = (nr && nr.nodes) || [];
    const edges = (nr && nr.edges) || [];
    if (!nr || nodes.length === 0) { E(`二级「${p.name}」因缘际会为空`); return; }
    if (nodes.length < 4) l2Low.push(`${p.name}(${nodes.length}节点)`);
    // 连线端点须在节点集合内
    const nodeNames = new Set(nodes.map(n => n.name));
    let badEdge = 0;
    (edges || []).forEach(ed => {
      if (!nodeNames.has(ed.source) && !nodeNames.has(ed.from)) badEdge++;
      if (!nodeNames.has(ed.target) && !nodeNames.has(ed.to)) badEdge++;
    });
    if (badEdge) W(`二级「${p.name}」因缘际会有 ${badEdge} 条连线端点不在节点集合`);
  });
  if (l2Low.length) W(`因缘际会节点过少(<4)的二级人物：${l2Low.join(', ')}`);
  else if (l2.length) H(`二级因缘际会节点均≥4`);

  // G. 后台文本 / 占位
  let backend = [];
  persons.forEach(p => {
    const c = (p.story && p.story.content) || '';
    if (BACKEND_PATTERNS.some(rx => rx.test(c))) backend.push(p.name);
  });
  if (backend.length) E(`二级故事含后台/占位句（辅助节点/建议核验等）：${backend.join(', ')}`);
  else H('故事正文无后台建议句');

  // H. 广度事件信息（保留 ComingSoon 允许偏少）
  if (events.length === 0) {
    W('事件为空（前端将显示 ComingSoon，属正常待建设状态）');
  } else {
    let noType = 0;
    events.forEach(ev => { if (!ev.event_type && !ev.type && !ev.category) noType++; });
    if (noType) W(`有 ${noType}/${events.length} 个事件缺类型`);
  }

  console.log(`    -- ${id} 结果：错误 ${err}，警告 ${warn}`);
  return { err, warn };
}

const args = process.argv.slice(2);
const targets = args.length ? args.map(Number) : Object.keys(DYNASTY_MAP).map(Number);
let totalErr = 0;
targets.forEach(id => { const r = run(id); if (r) totalErr += r.err; });
console.log(`\n全部完成：错误合计 ${totalErr} 条${totalErr ? '（请处理后在重新构建）' : ''}。`);
process.exit(totalErr ? 1 : 0);