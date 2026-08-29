/**
 * 夏商西周(dynasty_201)事件「推荐事件」(related_events) 补全脚本。
 * 复用 dynasty_202 的方向：
 *   1) 按「共享人物」为每条事件推荐关联事件；
 *   2) 用本朝代历史脉络宏观时间线(dynasty_timeline)补足，保证有内容；
 *   3) 每条事件最多 6 个推荐事件（前端展示取前 4）。
 * 用法: node scripts/enrich_201_related_events.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f201 = path.join(DIR, 'dynasty_201.json');

const d201 = JSON.parse(fs.readFileSync(f201, 'utf-8'));
const events = d201.events || [];
const nameSet = new Set((d201.persons || []).map(p => p.name));

// 事件 -> 参与人名集合（复用 202 的取人逻辑）
function eventPersonNames(ev) {
  return new Set([
    ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
    ...(ev.person_groups?.leaders || []).map(x => x.name),
    ...(ev.person_groups?.participants || []).map(x => x.name),
    ...(ev.person_groups?.opponents || []).map(x => x.name),
    ...(ev.person_groups?.affected || []).map(x => x.name),
  ]);
}

// 宏观时间线：给每条事件补充非本事件的骨干节点，保证推荐事件不为空
const timelineArr = Array.isArray(d201.timelines) ? d201.timelines
  : (d201.timelines && (d201.timelines['夏商西周政治演变'] || []));

let filled = 0;
events.forEach(ev => {
  const mine = eventPersonNames(ev);

  // 1) 共享人物打分排序
  const scored = [];
  events.forEach(o => {
    if (o.id === ev.id) return;
    const share = [...eventPersonNames(o)].filter(n => mine.has(n)).length;
    if (share > 0) scored.push({ id: o.id, name: o.name, share });
  });
  scored.sort((a, b) => b.share - a.share);

  // 2) 时间线骨干补足（按事件ID去匹配事件名，标题兜底）
  const evNameById = new Map(events.map(e => [e.id, e.name]));
  (timelineArr || []).forEach(t => {
    const nm = (t.event_id && evNameById.get(t.event_id)) || t.title;
    if (nm && nm !== ev.name && !scored.some(s => s.name === nm)) {
      scored.push({ id: t.event_id, name: nm, share: 0 });
    }
  });

  ev.related_events = scored.slice(0, 6).map(s => s.name);
  if (ev.related_events.length) filled++;
});

fs.writeFileSync(f201, JSON.stringify(d201, null, 2), 'utf-8');
console.log('dynasty_201 已补全 related_events 事件数:', filled, '/', events.length);