/**
 * 历史关联目标解析 —— 只读引用大历史数据
 * ================================================
 * 家族数据仅保存 HistoryLink.targetType / targetId（大历史人物/事件 ID）。
 * 本服务负责把 ID 解析成可展示的名称/年代/跳转路径，供家族页面展示与跳转。
 * 只 import 读取，绝不写入或修改大历史数据。
 */
import { persons, events } from '@/mock/data'
import type { HistoryTargetType } from '@/types/family'

export interface HistoryTargetInfo {
  /** 大历史人物/事件名称 */
  name: string
  /** 所属朝代 */
  dynasty: string
  /** 展示年代：事件为起止年，人物为生卒年 */
  year: string
  /** 跳转路径 */
  path: string
}

/** 大历史人物/事件 → 搜索索引 */
export interface HistorySearchItem {
  type: HistoryTargetType
  id: number
  name: string
  dynasty: string
  year: string
}

export function resolveHistoryTarget(type: HistoryTargetType, id: number): HistoryTargetInfo | null {
  if (type === 'person') {
    const p = persons.find(x => x.id === id)
    if (!p) return null
    const y = (p.birth_year || p.death_year)
      ? `${p.birth_year ?? '?'}—${p.death_year ?? '今'}`
      : '生卒不详'
    return { name: p.name, dynasty: p.dynasty, year: y, path: `/person/${p.id}` }
  }
  const e = events.find(x => x.id === id)
  if (!e) return null
  const y = `${e.start_year}—${e.end_year}`
  return { name: e.name, dynasty: e.dynasty, year: y, path: `/event/${e.id}` }
}

/** 构建大历史人物/事件搜索索引（惰性，仅首次调用） */
let _searchIndex: HistorySearchItem[] | null = null
export function getHistorySearchIndex(): HistorySearchItem[] {
  if (_searchIndex) return _searchIndex
  const items: HistorySearchItem[] = []
  for (const p of persons) {
    items.push({
      type: 'person', id: p.id, name: p.name, dynasty: p.dynasty,
      year: (p.birth_year || p.death_year) ? `${p.birth_year ?? '?'}—${p.death_year ?? '今'}` : '生卒不详'
    })
  }
  for (const e of events) {
    items.push({ type: 'event', id: e.id, name: e.name, dynasty: e.dynasty, year: `${e.start_year}—${e.end_year}` })
  }
  _searchIndex = items
  return items
}

/** 按关键词搜索大历史人物/事件（上限 limit 条） */
export function searchHistory(kw: string, limit = 20): HistorySearchItem[] {
  const q = kw.trim()
  if (!q) return []
  const lower = q.toLowerCase()
  return getHistorySearchIndex()
    .filter(i => i.name.includes(q) || i.name.toLowerCase().includes(lower) || i.dynasty.includes(q))
    .slice(0, limit)
}

/* ================================================================
 * 历史关联 · 系统推荐
 * 依据家族成员的出生年 / 去世年 / 人生经历年份，自动检索大历史中
 * 年代重叠的人物与事件，生成推荐列表（"系统推荐 + 用户确认"机制）。
 * 大历史库当前仅收录上古至明清内容，近现代事件待补；无匹配时返回空。
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
 * 系统推荐：检索大历史中与该成员时代重叠的人物/事件。
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

  // 事件：与成员人生阶段重叠
  for (const e of events) {
    if (excludedKey.has(`event:${e.id}`)) continue
    const evStart = e.start_year
    const evEnd = e.end_year ?? evStart
    const ov = overlap(span, [evStart, evEnd])
    if (!ov) continue
    results.push({
      type: 'event', id: e.id, name: e.name, dynasty: e.dynasty,
      year: `${evStart}—${evEnd}`, reason: overlapReason(ov, span), overlap: ov
    })
  }

  // 人物：生平年代与成员人生重叠（去世年未知时按出生年 + 120 估算，避免古人与近现代误匹配）
  for (const p of persons) {
    if (excludedKey.has(`person:${p.id}`)) continue
    if (p.birth_year == null && p.death_year == null) continue
    const pStart = p.birth_year ?? (p.death_year ?? 0) - 120
    const pEnd = p.death_year ?? (p.birth_year ?? 0) + 120
    const ov = overlap(span, [pStart, pEnd])
    if (!ov) continue
    results.push({
      type: 'person', id: p.id, name: p.name, dynasty: p.dynasty,
      year: p.birth_year && p.death_year ? `${p.birth_year}—${p.death_year}` : '生卒不详',
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

/** 解析展示年代字符串，提取起始年份（如 "1937—1945" → 1937）；无法解析返回 null */
export function extractYear(yearText: string): number | null {
  const m = yearText.match(/-?\d+/)
  return m ? parseInt(m[0], 10) : null
}
