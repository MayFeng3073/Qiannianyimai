/**
 * 为二级人物的"故事"生成独立的场景配图 URL
 * ==========================================================
 * 现状：1350 位二级人物的 story.image_url 有 1318 条与人物头像完全相同，
 * 导致故事页配图与头像重复。这里为每位人物构造一条固定 prompt 的
 * 场景图 URL（16:9 横幅），与头像区分开。
 *
 * 说明：不实际下载图片，只把固定 URL 写入 JSON；浏览器加载时由图片服务
 * 按该 prompt 出图，因此同一人物每次看到的都是同一张图。
 *
 * 用法: node scripts/gen-story-images.js [--dry]
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image'
const DRY = process.argv.includes('--dry')

function buildPrompt(person) {
  const parts = [
    person.name,
    person.dynasty ? `${person.dynasty}时期` : '',
    person.category || '',
    person.story?.title || '',
    '历史场景插画，人物全身远景，中国水墨画风格，横幅构图，无文字'
  ].filter(Boolean)
  return parts.join('，')
}

function buildUrl(person) {
  const prompt = encodeURIComponent(buildPrompt(person))
  return `${API}?prompt=${prompt}&image_size=landscape_16_9`
}

const files = fs
  .readdirSync(DATA_DIR)
  .filter(f => /^dynasty_\d+\.json$/.test(f))
  .map(f => path.join(DATA_DIR, f))

let total = 0
let already = 0
let generated = 0
let sumLen = 0
let beforeBytes = 0
let afterBytes = 0

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf-8')
  beforeBytes += Buffer.byteLength(raw)
  const data = JSON.parse(raw)

  for (const p of data.persons || []) {
    if (p.level !== 2 || !p.story) continue
    total++
    const current = p.story.image_url
    const isDuplicate = !current || current === p.image_url
    if (!isDuplicate) {
      already++
      sumLen += current.length
      continue
    }
    p.story.image_url = buildUrl(p)
    generated++
    sumLen += p.story.image_url.length
  }

  const next = JSON.stringify(data, null, 2) + '\n'
  afterBytes += Buffer.byteLength(next)
  if (!DRY) fs.writeFileSync(file, next)
}

console.log(`[story-images] 二级人物故事总数: ${total}`)
console.log(`[story-images] 保留已有独立配图: ${already}`)
console.log(`[story-images] 新生成: ${generated}`)
console.log(`[story-images] 平均 URL 长度: ${Math.round(sumLen / Math.max(total, 1))} 字节`)
console.log(`[story-images] JSON 体积: ${(beforeBytes / 1024 / 1024).toFixed(2)}MB → ${(afterBytes / 1024 / 1024).toFixed(2)}MB`)
if (DRY) console.log('[story-images] dry-run，未写入文件')
