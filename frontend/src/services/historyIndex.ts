/**
 * 统一历史索引 —— 大历史 + 上古只读快照
 * ================================================
 * 数据来源：
 *   1. /data/search-index.json   —— 14 个朝代 JSON 生成的大历史索引
 *   2. /data/ancient-index.json  —— 从 mock/data.ts 只读生成的上古快照
 *
 * 合并规则：按 `类型:id` 去重，大历史优先。
 * （例如「伯益 201035」同时存在于上古 mock 与夏商西周 JSON，最终取朝代 JSON 版本。）
 *
 * 本模块只负责读取与合并，不写入任何历史数据；上古模块的页面/逻辑不引用本模块。
 */
import type { HistoryTargetType } from '@/types/family'

export interface HistoryEntry {
  type: HistoryTargetType
  id: number
  name: string
  /** 所属朝代名称（由索引的朝代元数据映射得到） */
  dynasty: string
  /** 所属朝代 id（上古为 100） */
  dynastyId: number
  /** 展示年代，如「701年—762年」「前2717年—前2599年」「生卒不详」 */
  year: string
  /** 结构化年代区间，供「人生年代重叠」推荐使用 */
  years: [number | null, number | null]
  /** 知名度权重（影响力 / 资料完整度） */
  weight: number
}

interface RawEntry {
  t: string
  i?: number
  n: string
  s?: string
  d?: number
  w?: number
  y?: [number | null, number | null]
  yt?: string
}

interface RawIndexFile {
  dynasties?: { id: number; name: string }[]
  dynasty?: { id: number; name: string }
  entries?: RawEntry[]
}

const BASE = '/'

const entries: HistoryEntry[] = []
const byKey = new Map<string, HistoryEntry>()
const dynastyNames = new Map<number, string>()

let state: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
let pending: Promise<void> | null = null
let errorText = ''
let version = 0

export function historyIndexReady(): boolean {
  return state === 'ready'
}

export function historyIndexError(): string {
  return errorText
}

/** 索引版本号：加载完成后自增，供上层缓存失效判断 */
export function historyIndexVersion(): number {
  return version
}

export function getHistoryEntries(): HistoryEntry[] {
  return entries
}

function addRaw(raw: RawEntry, fallbackDynastyId: number) {
  if (raw.t !== 'p' && raw.t !== 'e') return
  if (raw.i === undefined || raw.i === null) return
  const id = Number(raw.i)
  const type: HistoryTargetType = raw.t === 'p' ? 'person' : 'event'
  const key = `${type}:${id}`
  // 大历史先写入，上古快照后写入 → 冲突时自然保留大历史版本
  if (byKey.has(key)) return
  const entry: HistoryEntry = {
    type,
    id,
    name: String(raw.n || '').trim(),
    dynasty: dynastyNames.get(Number(raw.d ?? fallbackDynastyId)) || '',
    dynastyId: Number(raw.d ?? fallbackDynastyId),
    year: String(raw.yt || '').trim(),
    years: Array.isArray(raw.y) ? [raw.y[0] ?? null, raw.y[1] ?? null] : [null, null],
    weight: Number(raw.w) || 0
  }
  if (!entry.name) return
  entries.push(entry)
  byKey.set(key, entry)
}

async function fetchIndex(file: string): Promise<RawIndexFile | null> {
  try {
    const res = await fetch(`${BASE}data/${file}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as RawIndexFile
  } catch (err) {
    errorText = `${file} 加载失败：${(err as Error).message}`
    return null
  }
}

async function load() {
  // 两个文件互不阻塞：任意一个成功即可提供部分索引
  const [big, ancient] = await Promise.all([
    fetchIndex('search-index.json'),
    fetchIndex('ancient-index.json')
  ])

  for (const item of big?.dynasties || []) dynastyNames.set(Number(item.id), String(item.name || ''))
  if (ancient?.dynasty) dynastyNames.set(Number(ancient.dynasty.id), String(ancient.dynasty.name || ''))

  for (const raw of big?.entries || []) addRaw(raw, 0)
  for (const raw of ancient?.entries || []) addRaw(raw, ancient?.dynasty?.id ?? 100)

  state = entries.length ? 'ready' : 'error'
  if (!entries.length && !errorText) errorText = '历史索引为空'
  version++
}

/**
 * 预加载统一历史索引（幂等）。
 * 永不 reject：即使网络失败也放行页面，家族页会用链接快照兜底展示。
 */
export function ensureHistoryIndex(): Promise<void> {
  if (state === 'ready' || state === 'error') return Promise.resolve()
  if (pending) return pending
  state = 'loading'
  pending = load()
    .catch((err) => {
      errorText = (err as Error).message || '历史索引加载失败'
      state = 'error'
      version++
    })
    .finally(() => {
      pending = null
    })
  return pending
}

/** 解析单个历史目标（同步，需先 ensureHistoryIndex） */
export function resolveHistoryEntry(type: HistoryTargetType, id: number): HistoryEntry | null {
  return byKey.get(`${type}:${id}`) || null
}

/** 关键词检索人物/事件 */
export function searchHistoryEntries(keyword: string, limit = 20): HistoryEntry[] {
  const q = keyword.trim()
  if (!q) return []
  const lower = q.toLowerCase()
  return entries
    .filter(e => e.name.includes(q) || e.name.toLowerCase().includes(lower) || e.dynasty.includes(q))
    .slice(0, limit)
}
