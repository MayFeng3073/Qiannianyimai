/**
 * 生成同人异名映射表 frontend/src/data/personAlias.ts
 * ==========================================================
 * 别名只指向已有人物，不新增人物；目标不存在时页面会按不可点降级。
 *
 * 用法: node scripts/build-person-alias.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'frontend', 'src', 'data', 'personAlias.ts')

// 字 / 号 / 尊称 → 人物库中的正式姓名
const ALIASES = {
  姜太公: '姜子牙',
  太公望: '姜子牙',
  吕尚: '姜子牙',
  孔明: '诸葛亮',
  诸葛孔明: '诸葛亮',
  卧龙: '诸葛亮',
  孟德: '曹操',
  曹孟德: '曹操',
  玄德: '刘备',
  刘玄德: '刘备',
  云长: '关羽',
  关云长: '关羽',
  翼德: '张飞',
  仲谋: '孙权',
  子龙: '赵云',
  伯牙: '俞伯牙',
  太白: '李白',
  李太白: '李白',
  子美: '杜甫',
  东坡: '苏轼',
  苏东坡: '苏轼',
  稼轩: '辛弃疾',
  易安: '李清照',
  阳明: '王阳明'
}

const entries = Object.entries(ALIASES)
  .map(([k, v]) => `  ${k}: '${v}'`)
  .join(',\n')

const content = `/**
 * 同人异名映射（字 / 号 / 尊称 → 人物库中的正式姓名）
 * ==========================================================
 * 事件里偶尔会用别称指代人物，直接查库会查不到、点不开。
 * 这里只做"指向已有人物"的映射，不新增人物；
 * 目标人物不存在时解析仍会失败，页面按不可点降级。
 *
 * 由 scripts/build-person-alias.js 生成，请勿手工修改。
 */
export const PERSON_ALIAS: Record<string, string> = {
${entries}
}

/** 解析别名；没有别名时原样返回 */
export function resolvePersonAlias(name: string): string {
  const n = (name || '').trim()
  if (!n) return n
  return PERSON_ALIAS[n] || n
}
`

fs.writeFileSync(OUT, content)
console.log(`[person-alias] 写入 ${entries.split('\n').length} 条别名 -> ${OUT}`)
