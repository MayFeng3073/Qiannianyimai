/**
 * 春秋二级人物「因缘际会」叙事关系图谱生成脚本
 * 参考上古女娲/精卫的 narrative_relations 结构，
 * 为缺少叙事关系的二级人物从 existing related_people / related_events 生成图谱。
 *
 * 用法: node scripts/enrich_person_story_202.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_202.json');

function buildNarrativeRelations(person) {
  const mainName = person.name;
  const nodes = [{ id: mainName, name: mainName, type: 'person', size: 'large' }];
  const edges = [];
  const seen = new Set([mainName]);

  // 关联人物
  for (const rp of person.related_people || []) {
    if (typeof rp !== 'object' || !rp.name || seen.has(rp.name)) continue;
    nodes.push({ id: rp.name, name: rp.name, type: 'person', size: 'medium' });
    edges.push({ source: mainName, target: rp.name, label: rp.relation || '关系', direction: 'forward' });
    seen.add(rp.name);
  }

  // 关联事件
  for (const re of person.related_events || []) {
    const name = typeof re === 'string' ? re : re?.name;
    if (!name || seen.has(name)) continue;
    nodes.push({ id: name, name, type: 'event', size: 'medium' });
    const role = typeof re === 'object' ? (re.role || '参与') : '参与';
    edges.push({ source: mainName, target: name, label: role, direction: 'forward' });
    seen.add(name);
  }

  return { nodes, edges };
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到输入文件: ${INPUT_FILE}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const persons = raw.persons || [];

  let generated = 0;
  let empty = 0;

  for (const p of persons) {
    if ((p.level || 2) !== 2) continue;
    const existing = p.narrative_relations;
    const hasNode = existing && Array.isArray(existing.nodes) && existing.nodes.length > 0;
    if (hasNode) continue; // 已有数据的不覆盖

    const built = buildNarrativeRelations(p);
    if (built.nodes.length <= 1) {
      empty++; // 没有可用的关联数据，保持优雅空态
      continue;
    }
    p.narrative_relations = built;
    generated++;
  }

  fs.writeFileSync(INPUT_FILE, JSON.stringify(raw, null, 2), 'utf-8');

  console.log('='.repeat(50));
  console.log('✅ 二级人物叙事关系图谱生成完成');
  console.log(`   生成图谱: ${generated} 人`);
  console.log(`   保持空态: ${empty} 人（无关联数据，显示"暂无关系数据"）`);
  console.log(`   二级人物总数: ${persons.filter(p => (p.level || 2) === 2).length} 人`);
  console.log('='.repeat(50));
}

main();