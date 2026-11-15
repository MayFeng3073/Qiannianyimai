/**
 * 生成书法字体子集（woff2）
 * ==========================================================
 * 目的：原 MaShanZheng-Regular.ttf 约 5.8MB，配合 font-display: swap
 * 会让标题先显示楷体再切换。这里把项目中实际会用到的字符收进子集，
 * 生成体积小得多的 woff2，首屏即呈现书法体。
 *
 * 字符来源：
 *  - frontend/src/**\/*.{vue,ts,css}
 *  - frontend/public/data/*.json（朝代/人物/事件/关键词等动态文案）
 *
 * 用法: node scripts/build-font-subset.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
// 依赖装在 frontend/node_modules 下，这里显式解析，避免根目录无 node_modules 时找不到
const subsetFont = require(path.join(ROOT, 'frontend', 'node_modules', 'subset-font'))

const SRC_DIR = path.join(ROOT, 'frontend', 'src')
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const FONT_SRC = path.join(ROOT, 'frontend', 'fonts-src', 'MaShanZheng-Regular.ttf')
const FONT_OUT = path.join(ROOT, 'frontend', 'public', 'fonts', 'MaShanZheng-subset.woff2')

const EXT = new Set(['.vue', '.ts', '.css', '.html'])
// mock/data.ts 是正文数据（简介/叙事），正文不用书法体；名字类文案由 JSON 白名单覆盖
const SKIP_DIRS = new Set(['mock'])
// 只收录可能以书法体呈现的字段，避免把长篇简介的正文字符也塞进字体
const TEXT_KEYS = new Set([
  'name', 'title', 'display', 'era', 'label', 'role', 'category', 'event_type', 'dynasty'
])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) {
      if (!SKIP_DIRS.has(name.name)) walk(p, out)
    } else if (EXT.has(path.extname(name.name))) out.push(p)
  }
  return out
}

const files = walk(SRC_DIR)
const dataFiles = fs
  .readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => path.join(DATA_DIR, f))

const chars = new Set()
const collect = text => {
  for (const ch of text) {
    const code = ch.codePointAt(0)
    // 跳过控制字符与空白
    if (code < 32 || code === 127) continue
    chars.add(ch)
  }
}

/** 只收集白名单字段里的字符串 */
function collectJson(value, key) {
  if (typeof value === 'string') {
    if (TEXT_KEYS.has(key)) collect(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJson(item, key)
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectJson(v, k)
  }
}

for (const f of files) collect(fs.readFileSync(f, 'utf-8'))
for (const f of dataFiles) collectJson(JSON.parse(fs.readFileSync(f, 'utf-8')), '')

// 基础字符兜底：ASCII 可打印 + 常用中文标点
for (let c = 32; c <= 126; c++) chars.add(String.fromCharCode(c))
for (const ch of '，。、；：？！“”‘’（）《》〈〉【】—…·「」『』％＃＆＊＋－／＝＠｜～￥') chars.add(ch)

const text = [...chars].join('')

async function main() {
  if (!fs.existsSync(FONT_SRC)) {
    throw new Error(`找不到源字体: ${FONT_SRC}`)
  }
  const buf = fs.readFileSync(FONT_SRC)
  const out = await subsetFont(buf, text, { targetFormat: 'woff2' })
  fs.mkdirSync(path.dirname(FONT_OUT), { recursive: true })
  fs.writeFileSync(FONT_OUT, out)

  const srcKB = (buf.length / 1024).toFixed(1)
  const outKB = (out.length / 1024).toFixed(1)
  console.log(`[font-subset] 扫描文件 ${files.length} 个 + 数据文件 ${dataFiles.length} 个`)
  console.log(`[font-subset] 收录字符 ${chars.size} 个`)
  console.log(`[font-subset] 源字体 ${srcKB} KB → 子集 ${outKB} KB`)
  console.log(`[font-subset] 输出 ${FONT_OUT}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
