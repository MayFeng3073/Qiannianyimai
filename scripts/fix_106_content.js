/**
 * 秦(dynasty_106)内容精修脚本：
 *   #1 修复历史影响力描述（impact_list）断句问题：短碎片并入前一句，避免「皇帝制/燕/法术势/收买」等孤立碎片
 *     影响描述来自 Excel 影响力描述列以【、；；\n】切分，遇到「赵、燕、楚」「法、术、势」类列举时会被拆散。
 *   #2 works（主要奉献）description 精简：如超过 50 字则裁剪。
 * 用法: node scripts/fix_106_content.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_106.json');

function load() { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function save(o) { fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf-8'); }

/* 合并短碎片：某段过短(≤6字)且不完整时，作为列举项并入前一段（以「、」连接），并适当补顿号衔接 */
function mergeFragments(items) {
  const out = [];
  for (let s of items) {
    s = (s || '').trim();
    if (!s) continue;
    // 短碎片：多半是「、」列举断裂出来的，并入前一段
    if (s.length <= 6 && out.length > 0) {
      const prev = out[out.length - 1];
      out[out.length - 1] = prev.endsWith('、') || prev.endsWith('。') ? prev + s : prev + '、' + s;
      continue;
    }
    out.push(s);
  }
  return out;
}

function trimWorksDesc(desc, max) {
  if (!desc) return desc;
  const s = desc.trim();
  if (s.length <= max) return s;
  // 在标点处截断，避免硬切
  const cut = s.slice(0, max);
  const idx = Math.max(cut.lastIndexOf('，'), cut.lastIndexOf('、'), cut.lastIndexOf('。'), cut.lastIndexOf('；'));
  return (idx > max * 0.5 ? cut.slice(0, idx + 1) : cut) + '……';
}

// 断句仍不理想的人物：直接用可读的整句覆盖（避免「、」列举断裂成孤立碎片）
const IMPACT_OVERRIDE = {
  '秦始皇（嬴政）': ['结束长期诸侯割据，建立统一帝国与皇帝制度，郡县制和统一制度成为后世中央集权国家的重要制度基础。'],
  '王翦': ['以稳健战略和大规模军事动员完成灭赵、灭燕、灭楚等关键战争，为秦统一天下提供决定性军事保障。'],
  '王贲': ['完成灭魏、灭齐等关键战争，使秦统一战争进入最后阶段，是秦完成统一不可缺少的军事人物。'],
  '蒙恬': ['北击匈奴、经营河套并建设北方防御体系，对秦帝国边疆安全产生重要影响；其死亡又成为秦朝政治崩坏的象征。'],
  '韩非': ['法家思想的重要集大成者，其“法、术、势”理论成为秦朝中央集权政治的重要思想资源，并长期影响中国政治思想。'],
  '尉缭': ['从战略层面分析六国力量并提出离间、收买等策略，为秦统一战争提供重要谋略支持；《尉缭子》又成为中国古代军事思想的重要文献。'],
};

function main() {
  const d = load();
  const persons = d.persons || [];

  console.log('===== #1 历史影响力断句修复 =====');
  let total = 0;
  persons.forEach(p => {
    if (!Array.isArray(p.impact_list)) return;
    if (IMPACT_OVERRIDE[p.name]) { p.impact_list = IMPACT_OVERRIDE[p.name]; total++; return; }
    const merged = mergeFragments(p.impact_list);
    if (merged.join('') !== (p.impact_list || []).join('')) total++;
    p.impact_list = merged;
  });
  console.log('  修复影响描述段落的（一级）人物:', total);

  console.log('\n===== #2 主要奉献 description 精简 =====');
  let over = 0;
  persons.filter(p => p.level === 1).forEach(p => {
    (p.works || []).forEach(w => {
      if (w && w.description && w.description.length > 50) { w.description = trimWorksDesc(w.description, 50); over++; }
    });
  });
  console.log('  超 50 字已精简的贡献项:', over);

  console.log('\n===== #3 后人评价统一裁剪为 2 条 =====');
  let trimmed = 0;
  persons.filter(p => p.level === 1).forEach(p => {
    if (Array.isArray(p.later_quotes) && p.later_quotes.length > 2) { p.later_quotes = p.later_quotes.slice(0, 2); trimmed++; }
  });
  console.log('  裁剪后人评价的人物:', trimmed);

  save(d);
  console.log('\n完成。');
}
main();
module.exports = {};