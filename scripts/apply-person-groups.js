/**
 * 合并人工审校后的事件人物分组（角色词 + 四组结构）
 * ==========================================================
 * 用法: node scripts/apply-person-groups.js 106
 * 输入: scripts/data/person-groups-<dynastyId>.json
 * 输出: frontend/public/data/dynasty_<dynastyId>.json
 *
 * 映射结构：
 *   { "<eventId>": { "leaders": [["姓名","角色"], ...], ... } }
 * 只使用已有人物；脚本会校验姓名是否在本朝人物库中。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const dynastyId = process.argv[2]
if (!dynastyId) {
  console.error('用法: node scripts/apply-person-groups.js <dynastyId>')
  process.exit(1)
}

const MAP_FILE = path.join(ROOT, 'scripts', 'data', `person-groups-${dynastyId}.json`)
const DATA_FILE = path.join(ROOT, 'frontend', 'public', 'data', `dynasty_${dynastyId}.json`)
const GROUPS = ['leaders', 'participants', 'opponents', 'affected']
const GENERIC = ['领导', '推动', '参与', '支持', '完成', '反对', '见证', '失败方', '胜利方', '受影响']

const mapping = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'))
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
const personNames = new Set((data.persons || []).map(p => p.name))

function genericCount(groups) {
  let n = 0
  for (const k of GROUPS) for (const p of groups[k] || []) {
    const role = (p.role || '').trim()
    if (!role || GENERIC.includes(role) || role.includes('参与')) n++
  }
  return n
}

function coverage(groups) {
  return GROUPS.filter(k => (groups[k] || []).length > 0).length
}

let updated = 0
let roleChanges = 0
let genericBefore = 0
let genericAfter = 0
let coverBefore = 0
let coverAfter = 0
const unknown = []
const missingEvents = []

for (const event of data.events || []) {
  const target = mapping[String(event.id)]
  if (!target) continue
  const before = event.person_groups || {}
  genericBefore += genericCount(before)
  coverBefore += coverage(before)

  const next = {}
  for (const k of GROUPS) {
    const arr = target[k] || []
    next[k] = arr.map(([name, role]) => {
      if (!personNames.has(name)) unknown.push(`${event.name}: ${name}`)
      return { name, role }
    })
  }
  const beforeRoles = new Map()
  for (const k of GROUPS) for (const p of before[k] || []) beforeRoles.set(p.name, p.role)
  for (const k of GROUPS) {
    for (const p of next[k]) {
      if (beforeRoles.has(p.name) && beforeRoles.get(p.name) !== p.role) roleChanges++
    }
  }

  event.person_groups = next
  genericAfter += genericCount(next)
  coverAfter += coverage(next)
  updated++
}

for (const id of Object.keys(mapping)) {
  if (!(data.events || []).some(e => String(e.id) === String(id))) missingEvents.push(id)
}

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n')

console.log(`[person-groups] 朝代 ${dynastyId}：更新事件 ${updated} / 映射 ${Object.keys(mapping).length}`)
console.log(`[person-groups] 角色改写 ${roleChanges} 条，泛化角色 ${genericBefore} → ${genericAfter}`)
console.log(`[person-groups] 四组平均覆盖 ${(coverBefore / Math.max(updated, 1)).toFixed(2)} → ${(coverAfter / Math.max(updated, 1)).toFixed(2)}`)
if (unknown.length) {
  console.log(`[person-groups] 警告：${unknown.length} 个姓名不在本朝人物库：`)
  for (const u of unknown) console.log('  -', u)
}
if (missingEvents.length) console.log(`[person-groups] 警告：映射里的事件 id 不存在：${missingEvents.join(', ')}`)
