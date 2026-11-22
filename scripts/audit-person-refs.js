/**
 * 事件人物引用审计（只读）
 * ==========================================================
 * 统计每个朝代事件里引用到的人物名，有多少能在本朝人物库里找到，
 * 缺失的名字再分为「群体 / 方国 / 身份词」与「具体历史人物」，
 * 并给出同朝内可复用的别名候选。
 *
 * 用法: node scripts/audit-person-refs.js
 * 输出: scripts/reports/person-refs.md
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const OUT_DIR = path.join(ROOT, 'scripts', 'reports')
const OUT = path.join(OUT_DIR, 'person-refs.md')

const GROUPS = ['leaders', 'participants', 'opponents', 'affected']

const GROUP_EXACT = new Set([
  '商王', '周王', '夏王', '方国', '诸侯', '百姓', '平民', '国人', '贵族',
  '旧贵族', '功臣', '殷民', '商军', '周军', '夏王族', '周族', '商王族',
  '西周贵族', '商朝贵族', '商朝百姓', '商朝遗民', '商朝奴隶', '商朝俘虏',
  '姬姓宗室', '古圣王后裔', '后世儒家', '中国社会', '韦顾昆吾',
  '诸部', '联军', '大军', '朝臣', '群臣', '民众', '众人'
])
const GROUP_WORDS = [
  '氏', '族', '军', '民', '百姓', '贵族', '奴隶', '俘虏', '宗室',
  '国人', '功臣', '后裔', '诸侯', '部落', '联盟', '集团', '势力',
  '王朝', '社会', '方国', '王族'
]

function isGroupRef(name) {
  const n = (name || '').trim()
  if (!n) return false
  if (GROUP_EXACT.has(n)) return true
  if (n.endsWith('方')) return true
  return GROUP_WORDS.some(w => n.includes(w))
}

const files = fs
  .readdirSync(DATA_DIR)
  .filter(f => /^dynasty_\d+\.json$/.test(f))

const lines = ['# 事件人物引用审计', '', `生成时间：${new Date().toISOString()}`, '']
let totalRefs = 0
let totalMissing = 0
let totalClickable = 0

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
  const dynastyName = data.dynasty?.name || file
  const local = new Set((data.persons || []).map(p => p.name))

  const counts = new Map()
  for (const e of data.events || []) {
    const g = e.person_groups || {}
    for (const k of GROUPS) {
      for (const m of g[k] || []) counts.set(m.name, (counts.get(m.name) || 0) + 1)
    }
    for (const n of e.related_persons || []) counts.set(n, (counts.get(n) || 0) + 1)
  }

  const names = [...counts.keys()]
  const missing = names.filter(n => !local.has(n))
  const groupNames = missing.filter(isGroupRef)
  const personNames = missing.filter(n => !isGroupRef(n))

  totalRefs += names.length
  totalMissing += missing.length
  totalClickable += names.length - missing.length

  lines.push(`## ${dynastyName}（${file}）`)
  lines.push('')
  lines.push(`- 事件数：${(data.events || []).length}`)
  lines.push(`- 去重引用人物：${names.length}`)
  lines.push(`- 在人物库内：${names.length - missing.length}`)
  lines.push(`- 缺失：${missing.length}（${((missing.length / Math.max(names.length, 1)) * 100).toFixed(0)}%）`)
  lines.push(`- 其中群体/方国/身份词：${groupNames.length}`)
  lines.push(`- 其中具体人物：${personNames.length}`)

  if (personNames.length) {
    lines.push('')
    lines.push('**缺少详情页的具体人物：**')
    lines.push('')
    lines.push(personNames.map(n => `${n}(${counts.get(n)})`).join('、'))
  }
  if (groupNames.length) {
    lines.push('')
    lines.push('**群体/方国/身份词：**')
    lines.push('')
    lines.push(groupNames.map(n => `${n}(${counts.get(n)})`).join('、'))
  }
  lines.push('')
}

lines.unshift(
  '> 说明：缺失 = 事件引用到但本朝人物库中不存在的名字。',
  '> 群体/方国/身份词会降级为不可点标签；具体人物在尽力别名匹配后仍无法解析时同样降级。',
  ''
)
lines.splice(1, 0,
  `合计：去重引用 ${totalRefs}，在库 ${totalClickable}，缺失 ${totalMissing}（${((totalMissing / Math.max(totalRefs, 1)) * 100).toFixed(0)}%）`
)

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT, lines.join('\n'))
console.log(`[person-refs] 合计引用 ${totalRefs}，在库 ${totalClickable}，缺失 ${totalMissing}`)
console.log(`[person-refs] 报告写入 ${OUT}`)
