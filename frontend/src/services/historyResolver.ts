/**
 * 历史关联目标解析 —— 只读引用统一历史索引
 * ================================================
 * 家族数据仅保存 HistoryLink.targetType / targetId（历史人物/事件 ID）。
 * 本服务负责把 ID 解析成可展示的名称/年代/跳转路径，供家族页面展示与跳转。
 *
 * 数据源：services/historyIndex（search-index.json + ancient-index.json）
 * 不再直接读取 mock/data.ts，确保家族关联的是真实历史库而不是演示数据。
 */
import type { HistoryTargetType } from '@/types/family'
import {
  ensureHistoryIndex,
  getHistoryEntries,
  resolveHistoryEntry,
  searchHistoryEntries,
  historyIndexVersion
} from '@/services/historyIndex'

export interface HistoryTargetInfo {
  /** 历史人物/事件名称 */
  name: string
  /** 所属朝代 */
  dynasty: string
  /** 展示年代：事件为起止年，人物为生卒年 */
  year: string
  /** 跳转路径 */
  path: string
}

/** 历史人物/事件 → 搜索索引 */
export interface HistorySearchItem {
  type: HistoryTargetType
  id: number
  name: string
  dynasty: string
  year: string
}

/**
 * 旧版占位数据 id → 真实历史条目 id。
 * 旧版本曾用 1–12 作为演示人物/事件，历史家族数据里可能仍保存着这些 id，
 * 这里做一次透明重定向，避免升级后旧关联变成「人物 #12」。
 */
const LEGACY_PERSON_IDS: Record<number, number> = {
  1: 112042, // 李白
  2: 112043, // 杜甫
  3: 112019, // 武则天
  4: 112002, // 李世民
  5: 113016, // 苏轼
  6: 202014, // 孔子
  7: 107005, // 汉武帝
  8: 109009, // 诸葛亮
  9: 109001, // 赵云
  10: 113014, // 王安石
  11: 113023, // 岳飞
  12: 115001 // 朱元璋
}

const LEGACY_EVENT_IDS: Record<number, number> = {
  1: 112305, // 贞观之治
  2: 112315, // 安史之乱
  3: 112303, // 玄武门之变
  4: 112312, // 开元盛世
  6: 113310, // 王安石变法
  7: 107311, // 张骞出使西域
  9: 113319, // 靖康之变
  10: 115301 // 明朝建立
}

/** 兼容旧 id 的条目查找 */
function lookup(type: HistoryTargetType, id: number) {
  const direct = resolveHistoryEntry(type, id)
  if (direct) return direct
  const legacy = type === 'person' ? LEGACY_PERSON_IDS[id] : LEGACY_EVENT_IDS[id]
  return legacy ? resolveHistoryEntry(type, legacy) : null
}

function entryPath(type: HistoryTargetType, id: number): string {
  return type === 'person' ? `/person/${id}` : `/event/${id}`
}

export function resolveHistoryTarget(type: HistoryTargetType, id: number): HistoryTargetInfo | null {
  const entry = lookup(type, id)
  if (!entry) return null
  return {
    name: entry.name,
    dynasty: entry.dynasty,
    year: entry.year || (type === 'person' ? '生卒不详' : '年代不详'),
    path: entryPath(type, entry.id)
  }
}

/**
 * 解析家族历史关联：优先查真实索引，查不到时回退到链接保存的快照。
 * 快照只用于展示，不会掩盖数据源的真实性。
 */
export function resolveHistoryLink(link: {
  targetType: HistoryTargetType
  targetId: number
  targetName?: string
  targetDynasty?: string
  targetYear?: string
}): HistoryTargetInfo | null {
  const info = resolveHistoryTarget(link.targetType, link.targetId)
  if (info) return info
  if (!link.targetName) return null
  return {
    name: link.targetName,
    dynasty: link.targetDynasty || '',
    year: link.targetYear || '年代不详',
    path: entryPath(link.targetType, link.targetId)
  }
}

/** 构建历史人物/事件搜索索引（随统一索引版本缓存） */
let _searchIndex: HistorySearchItem[] = []
let _searchVersion = -1
export function getHistorySearchIndex(): HistorySearchItem[] {
  const v = historyIndexVersion()
  if (_searchVersion === v && _searchIndex.length) return _searchIndex
  _searchIndex = getHistoryEntries().map(e => ({
    type: e.type,
    id: e.id,
    name: e.name,
    dynasty: e.dynasty,
    year: e.year || (e.type === 'person' ? '生卒不详' : '年代不详')
  }))
  _searchVersion = v
  return _searchIndex
}

/** 按关键词搜索历史人物/事件（上限 limit 条） */
export function searchHistory(kw: string, limit = 20): HistorySearchItem[] {
  return searchHistoryEntries(kw, limit).map(e => ({
    type: e.type,
    id: e.id,
    name: e.name,
    dynasty: e.dynasty,
    year: e.year || (e.type === 'person' ? '生卒不详' : '年代不详')
  }))
}

/* ================================================================
 * 历史关联 · 系统推荐
 * 依据家族成员的出生年 / 去世年 / 人生经历年份，自动检索历史中
 * 年代重叠的人物与事件，生成推荐列表（"系统推荐 + 用户确认"机制）。
 * ================================================================ */

export interface HistoryRecommendation {
  type: HistoryTargetType
  id: number
  name: string
  dynasty: string
  year: string
  /** 推荐原因（如：覆盖这位家人的出生年代） */
  reason: string
  /** 与成员人生的重叠年代区间，用于排序 */
  overlap: [number, number]
}

/** 由生卒年 / 人生经历年份推算成员人生年代区间；无法推算时返回 null */
export function memberLifeSpan(
  birthYear?: number,
  deathYear?: number,
  lifeYears: number[] = []
): [number, number] | null {
  const ys = lifeYears.filter(y => !isNaN(y))
  let start = birthYear ?? (ys.length ? Math.min(...ys) : null)
  if (start == null) return null
  let end = deathYear ?? (ys.length ? Math.max(...ys) : null)
  if (end == null) end = new Date().getFullYear()
  return [start, end]
}

function overlap(a: [number, number], b: [number, number]): [number, number] | null {
  const s = Math.max(a[0], b[0])
  const e = Math.min(a[1], b[1])
  return e >= s ? [s, e] : null
}

function overlapReason(ov: [number, number], span: [number, number]): string {
  if (ov[0] === ov[1]) return `与这位家人${ov[0]}年的时代重叠`
  if (ov[0] === span[0]) return `覆盖这位家人${ov[0]}年起的年代`
  return `与这位家人${ov[0]}—${ov[1]}年的时代重叠`
}

/**
 * 系统推荐：检索历史中与该成员时代重叠的人物/事件。
 * @param opts.birthYear / deathYear / lifeYears  —— 成员人生信息
 * @param opts.exclude —— 已建立关联的目标（避免重复推荐）
 * @param opts.limit —— 最多返回条数
 */
export function recommendHistory(opts: {
  birthYear?: number
  deathYear?: number
  lifeYears?: number[]
  exclude?: { type: HistoryTargetType; id: number }[]
  limit?: number
}): HistoryRecommendation[] {
  const { birthYear, deathYear, lifeYears = [], exclude = [], limit = 6 } = opts
  const span = memberLifeSpan(birthYear, deathYear, lifeYears)
  if (!span) return []
  const excludedKey = new Set(exclude.map(e => `${e.type}:${e.id}`))
  const results: HistoryRecommendation[] = []

  for (const entry of getHistoryEntries()) {
    if (excludedKey.has(`${entry.type}:${entry.id}`)) continue
    const [rawStart, rawEnd] = entry.years

    if (entry.type === 'event') {
      if (rawStart == null) continue
      const evStart = rawStart
      const evEnd = rawEnd ?? evStart
      const ov = overlap(span, [evStart, evEnd])
      if (!ov) continue
      results.push({
        type: 'event', id: entry.id, name: entry.name, dynasty: entry.dynasty,
        year: entry.year || `${evStart}—${evEnd}`,
        reason: overlapReason(ov, span), overlap: ov
      })
      continue
    }

    // 人物：去世年未知时按出生年 + 120 估算，避免古人与近现代误匹配
    if (rawStart == null && rawEnd == null) continue
    const pStart = rawStart ?? (rawEnd ?? 0) - 120
    const pEnd = rawEnd ?? (rawStart ?? 0) + 120
    const ov = overlap(span, [pStart, pEnd])
    if (!ov) continue
    results.push({
      type: 'person', id: entry.id, name: entry.name, dynasty: entry.dynasty,
      year: entry.year || '生卒不详',
      reason: overlapReason(ov, span), overlap: ov
    })
  }

  // 排序：重叠年代越久越靠前；同等重叠优先事件
  results.sort((a, b) => {
    const da = a.overlap[1] - a.overlap[0]
    const db = b.overlap[1] - b.overlap[0]
    if (db !== da) return db - da
    return (a.type === 'event' ? 0 : 1) - (b.type === 'event' ? 0 : 1)
  })
  return results.slice(0, limit)
}

/**
 * 解析展示年代字符串，提取起始年份。
 * 支持「1937—1945」「前2717年—前2599年」（公元前返回负数）。
 */
export function extractYear(yearText: string): number | null {
  if (!yearText) return null
  const bce = yearText.match(/前\s*(\d+)/)
  if (bce) return -parseInt(bce[1], 10)
  const m = yearText.match(/-?\d+/)
  return m ? parseInt(m[0], 10) : null
}

/** 供页面提前触发索引加载（路由守卫内部使用） */
export { ensureHistoryIndex }
