/**
 * 生成全局人物索引（跨朝代打通）
 * ==========================================================
 * 遍历 frontend/public/data/dynasty_*.json：
 *  1) 收集所有人物的 name -> { id, dynastyId }
 *  2) 扫描每个事件 person_groups(领导者/参与者/对手/受影响) 引用的人物名
 *  3) 若某个名字在「当前朝代之外」的其它朝代也有对应人物实体，
 *     则判定为跨朝代引用，写入 name -> personId 映射
 * 输出：frontend/src/data/globalPersonIndex.ts（自动生成，勿手动编辑）
 *
 * 用法: node scripts/build-global-index.js
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'frontend', 'public', 'data')
const OUT = path.join(__dirname, '..', 'frontend', 'src', 'data', 'globalPersonIndex.ts')

const files = fs.readdirSync(DATA_DIR).filter(f => /^dynasty_\d+\.json$/.test(f))

/** name -> { id, dynastyId }[] */
const byName = {}
for (const f of files) {
  const dynastyId = Number(f.match(/dynasty_(\d+)/)[1])
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))
  for (const p of data.persons || []) {
    ;(byName[p.name] = byName[p.name] || []).push({ id: p.id, dynastyId })
  }
}

/** name -> { id, dynastyId }[] （仅跨朝代引用的名字） */
const cross = {}
for (const f of files) {
  const dynastyId = Number(f.match(/dynasty_(\d+)/)[1])
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))
  for (const e of data.events || []) {
    const g = e.person_groups || {}
    const members = [
      ...(g.leaders || []),
      ...(g.participants || []),
      ...(g.opponents || []),
      ...(g.affected || []),
    ]
    for (const m of members) {
      const loc = (byName[m && m.name] || []).filter(l => l.dynastyId !== dynastyId)
      if (loc.length) cross[m.name] = loc
    }
  }
}

// 构建 name -> 单一 personId（同一名字多朝实体取最小 id，保证确定性）
const map = {}
for (const n of Object.keys(cross)) {
  const uniq = [...new Map(cross[n].map(l => [l.id, l])).values()].sort((a, b) => a.id - b.id)
  map[n] = uniq[0].id
}

const lines = [
  `/**`,
  ` * 全局人物索引（跨朝代打通）—— 自动生成，请勿手动编辑。`,
  ` * 由 scripts/build-global-index.js 生成，覆盖 ${Object.keys(map).length} 个跨朝代引用人物。`,
  ` */`,
  ``,
  `/** name -> 该人物实际所属朝代的 person id */`,
  `export const GLOBAL_PERSON_INDEX: Record<string, number> = {`,
  ...Object.keys(map).sort().map(n => `  ${JSON.stringify(n)}: ${map[n]},`),
  `}`,
  ``,
  `/** 根据跨朝代引用名解析出的 person id */`,
  `export function resolvePersonIdByName(name: string): number | undefined {`,
  `  return GLOBAL_PERSON_INDEX[name]`,
  `}`,
  ``,
]

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, lines.join('\n'), 'utf-8')
console.log(`[global-index] 已生成 ${OUT} (${Object.keys(map).length} 条跨朝代引用)`)