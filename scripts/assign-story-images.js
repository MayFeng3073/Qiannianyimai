/**
 * 二级人物故事配图本地化
 * ================================
 * 背景：批次 3 曾把 story.image_url 写成平台文生图接口 URL，但该接口对未生成过的
 * prompt 会长期返回「The image is generating...」占位图，页面上无法呈现真实场景。
 * 现改为使用本地主题插画（frontend/public/images/story/*.jpg），按人物分类分配，
 * 保证所有二级人物故事页打开即可见、主题相符、离线可用。
 *
 * 用法：node scripts/assign-story-images.js
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '../frontend/public/data')
const IMG_DIR = path.resolve(__dirname, '../frontend/public/images/story')
const URL_PREFIX = '/images/story/'

// 人物分类 → 本地主题插画
const CATEGORY_THEME = {
  '统治者': 'ruler',
  '政治人物': 'politics',
  '军事人物': 'military',
  '文化人物': 'culture',
  '思想人物': 'thought',
  '思想家': 'thought',
  '科技人物': 'technology'
}
const FALLBACK_THEME = 'politics'

// 校验主题图是否都存在
const themes = [...new Set(Object.values(CATEGORY_THEME))]
const missing = themes.filter(t => !fs.existsSync(path.join(IMG_DIR, `${t}.jpg`)))
if (missing.length) {
  console.error(`缺少主题图: ${missing.join(', ')}`)
  process.exit(1)
}

// 故事标题关键词 → 主题（在分类之外做少量语义微调，提升贴合度）
const TITLE_RULES = [
  { re: /(禅让|即位|登基|立国|称王|称帝|建国|王位|君位)/, theme: 'ruler' },
  { re: /(出使|会盟|盟约|和亲|外交|游说|结盟)/, theme: 'politics' },
  { re: /(征战|伐|军|兵|战|攻城|守城|围城|击|败敌|阵)/, theme: 'military' },
  { re: /(著|书|诗|赋|文|画|书法|礼乐|讲学|授徒|经学)/, theme: 'culture' },
  { re: /(百家|学派|论道|哲思|思想|学说|立说)/, theme: 'thought' },
  { re: /(造纸|历法|水利|冶铸|农书|医术|器械|营造|算学)/, theme: 'technology' }
]

function pickTheme(person) {
  const categoryTheme = CATEGORY_THEME[person.category] || FALLBACK_THEME
  const title = (person.story && person.story.title) || ''
  if (title) {
    for (const rule of TITLE_RULES) {
      if (rule.re.test(title)) return rule.theme
    }
  }
  return categoryTheme
}

const files = fs.readdirSync(DATA_DIR).filter(f => /^dynasty_\d+\.json$/.test(f))
const dist = {}
let updated = 0
let total = 0

for (const file of files) {
  const full = path.join(DATA_DIR, file)
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  let changed = false

  for (const person of data.persons || []) {
    if (person.level !== 2 || !person.story) continue
    total++
    const theme = pickTheme(person)
    const url = URL_PREFIX + theme + '.jpg'
    dist[theme] = (dist[theme] || 0) + 1
    if (person.story.image_url !== url) {
      person.story.image_url = url
      updated++
      changed = true
    }
  }

  if (changed) fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

console.log(`二级人物故事配图：共 ${total} 位，更新 ${updated} 条`)
console.log('主题分布：')
Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k} : ${v}`))
