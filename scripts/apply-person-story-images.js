/**
 * 关键人物故事定制配图落库
 * ================================
 * 扫描 frontend/public/images/story/person/ 下的 <人物ID>.jpg，
 * 把对应二级人物的 story.image_url 指到该本地图片；其余人物继续使用主题图。
 *
 * 用法：node scripts/apply-person-story-images.js
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '../frontend/public/data')
const PERSON_IMG_DIR = path.resolve(__dirname, '../frontend/public/images/story/person')

const custom = new Map()
for (const file of fs.readdirSync(PERSON_IMG_DIR)) {
  const m = file.match(/^(\d+)\.jpg$/)
  if (m) custom.set(Number(m[1]), `/images/story/person/${m[1]}.jpg`)
}

let updated = 0
let matched = 0

for (const file of fs.readdirSync(DATA_DIR).filter(f => /^dynasty_\d+\.json$/.test(f))) {
  const full = path.join(DATA_DIR, file)
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  let changed = false
  for (const p of data.persons || []) {
    if (p.level !== 2 || !p.story) continue
    const url = custom.get(p.id)
    if (!url) continue
    matched++
    if (p.story.image_url !== url) {
      p.story.image_url = url
      changed = true
      updated++
    }
  }
  if (changed) fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

console.log(`定制配图：${custom.size} 张，命中二级人物 ${matched} 位，更新 ${updated} 条`)
