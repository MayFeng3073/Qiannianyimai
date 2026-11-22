/**
 * 将「关键人物·领导者」栏中角色精确为「支持」的人物移到「参与者」栏。
 * 规则：仅 promotion from leaders -> participants。
 *   - 领导者保留「领导」「推动」等；
 *   - 纯「支持」移入参与者（保留角色标签「支持」）；
 *   - 若参与者已存在同名，则不重复，仅从领导者删除。
 * 用法: node scripts/fix_event_role_support.js
 */
const fs = require('fs')
const path = require('path')
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data')

let totalMoved = 0
for (const f of fs.readdirSync(DIR).filter(x => /^dynasty_\d+\.json$/.test(x))) {
  const file = path.join(DIR, f)
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
  let moved = 0
  for (const e of data.events || []) {
    const g = e.person_groups
    if (!g || !Array.isArray(g.leaders)) continue
    const keep = []
    const support = []
    for (const m of g.leaders) {
      if (String(m.role || '').trim() === '支持') support.push(m)
      else keep.push(m)
    }
    if (!support.length) continue
    g.participants = g.participants || []
    const names = new Set(g.participants.map(x => x.name))
    g.leaders = keep
    for (const m of support) {
      if (!names.has(m.name)) {
        g.participants.push(m)
        names.add(m.name)
      }
    }
    moved += support.length
  }
  if (moved > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
    totalMoved += moved
    console.log(`[fix_event_role_support] ${f}: moved ${moved}`)
  }
}
console.log(`[fix_event_role_support] total moved: ${totalMoved}`)