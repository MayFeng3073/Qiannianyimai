import { readFileSync, writeFileSync } from 'fs'

// Read Dynasty.vue
let content = readFileSync('src/views/Dynasty.vue', 'utf-8')

// Create simplified but visually distinct dynasty paths
// All paths use the same viewBox 0 0 500 400 coordinate system as the real China path
// Key features of each dynasty:

// 上古（传说时代）- 黄河流域中下游核心区，面积最小
const ancientPath = 'M 258 92 L 275 88 L 298 86 L 322 90 L 340 96 L 352 108 L 358 125 L 352 142 L 340 158 L 322 170 L 300 178 L 278 180 L 260 176 L 248 168 L 240 155 L 238 140 L 242 122 L 248 108 Z'

// 汉朝（西汉鼎盛）- 含河西走廊、西域、朝鲜北部、越南北部
const hanPath = 'M 215 48 L 240 40 L 270 35 L 302 32 L 335 35 L 360 42 L 385 55 L 405 72 L 415 90 L 418 110 L 412 128 L 400 148 L 388 160 L 375 168 L 365 175 L 358 188 L 352 205 L 348 222 L 352 240 L 348 258 L 355 275 L 348 292 L 342 310 L 330 322 L 315 325 L 300 320 L 288 312 L 278 300 L 268 288 L 258 275 L 248 262 L 238 250 L 228 238 L 218 224 L 208 210 L 198 195 L 190 180 L 185 165 L 180 148 L 178 130 L 175 112 L 172 95 L 165 78 L 158 65 L 162 52 L 175 42 L 195 35 Z'

// 唐朝（唐高宗鼎盛）- 含中亚、蒙古高原、库页岛、朝鲜
const tangPath = 'M 165 15 L 195 10 L 228 8 L 262 8 L 295 12 L 328 18 L 358 26 L 385 32 L 408 38 L 420 45 L 425 62 L 418 82 L 410 102 L 398 122 L 385 142 L 372 155 L 360 162 L 352 172 L 348 185 L 352 202 L 348 220 L 352 238 L 356 255 L 350 272 L 355 290 L 348 308 L 340 322 L 328 330 L 312 328 L 298 322 L 285 312 L 275 300 L 264 288 L 254 275 L 244 262 L 234 250 L 224 238 L 214 222 L 204 208 L 194 192 L 185 175 L 178 158 L 170 140 L 162 122 L 152 105 L 142 88 L 132 72 L 125 55 L 120 40 L 128 25 L 145 18 Z'

// 宋朝（北宋）- 不含燕云十六州、河西走廊，面积最小
const songPath = 'M 288 128 L 308 130 L 328 135 L 348 142 L 365 155 L 378 170 L 388 188 L 392 205 L 385 222 L 375 238 L 368 255 L 360 272 L 355 288 L 358 305 L 348 318 L 338 328 L 325 330 L 312 326 L 300 318 L 292 308 L 282 295 L 275 282 L 268 268 L 260 255 L 252 242 L 245 230 L 238 218 L 232 205 L 228 192 L 232 178 L 240 168 L 252 158 L 268 150 L 285 142 L 298 136 Z'

// 明朝（永乐鼎盛）- 含奴儿干都司、乌思藏都司、哈密卫
const mingPath = 'M 200 40 L 228 35 L 258 32 L 288 30 L 318 30 L 345 32 L 370 38 L 392 45 L 408 55 L 418 70 L 415 88 L 408 105 L 400 120 L 390 138 L 378 150 L 365 158 L 358 168 L 352 182 L 348 198 L 352 215 L 348 232 L 352 250 L 348 268 L 355 285 L 348 302 L 342 318 L 330 325 L 315 322 L 300 318 L 288 310 L 278 298 L 268 285 L 258 272 L 248 260 L 238 248 L 228 235 L 218 220 L 208 205 L 198 190 L 190 175 L 185 158 L 180 140 L 178 122 L 175 105 L 178 88 L 185 72 L 195 58 L 200 48 Z'

// 清朝（乾隆鼎盛）- 含外蒙古、外东北、外西北、西藏、新疆、台湾，最大疆域
const qingPath = 'M 155 8 L 185 5 L 218 3 L 252 3 L 285 5 L 318 8 L 348 12 L 375 18 L 398 22 L 415 25 L 428 32 L 435 45 L 430 62 L 422 82 L 412 102 L 402 122 L 392 140 L 380 152 L 368 162 L 358 170 L 352 182 L 348 198 L 352 215 L 348 232 L 352 250 L 348 268 L 355 285 L 348 302 L 340 318 L 330 328 L 315 325 L 300 320 L 288 312 L 278 300 L 268 288 L 258 275 L 248 262 L 238 250 L 228 238 L 218 224 L 208 210 L 198 195 L 190 180 L 185 165 L 180 148 L 178 130 L 175 112 L 172 95 L 165 78 L 158 62 L 150 48 L 142 35 L 135 22 L 142 12 Z'

// Replace the chinaMapPath computed property
const mapPathRegex = /const chinaMapPath = computed\(\(\) => \{[\s\S]*?return paths\[dynasty\.value\?\.name \|\| ''\] \|\| paths\['上古'\]/

const newMapPath = `const chinaMapPath = computed(() => {
  const paths: Record<string, string> = {
    '上古': '${ancientPath}',
    '汉朝': '${hanPath}',
    '唐朝': '${tangPath}',
    '宋朝': '${songPath}',
    '明朝': '${mingPath}',
    '清朝': '${qingPath}'
  }
  return paths[dynasty.value?.name || ''] || paths['上古']`

content = content.replace(mapPathRegex, newMapPath)

writeFileSync('src/views/Dynasty.vue', content)
console.log('Dynasty.vue updated with distinct dynasty paths!')
console.log('上古 path length:', ancientPath.length)
console.log('汉朝 path length:', hanPath.length)
console.log('唐朝 path length:', tangPath.length)
console.log('宋朝 path length:', songPath.length)
console.log('明朝 path length:', mingPath.length)
console.log('清朝 path length:', qingPath.length)