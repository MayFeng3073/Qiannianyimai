/**
 * 朝代数据懒加载服务
 * ================================
 * 负责从 public/data/ 目录加载各朝代的 JSON 数据。
 * 与 mock/data.ts 共存：JSON 数据优先，mock 数据作为 fallback。
 *
 * 使用方式:
 *   import { dynastyDataService } from '@/services/dynastyDataService';
 *   const data = await dynastyDataService.load(201);
 *   if (data) { /* 使用 data.persons, data.events *\/ }
 *   else { /* fallback 到 mock 数据 *\/ }
 */

import type { Dynasty, Person, Event } from '@/mock/data'

export interface TimelineEntry {
  title: string
  year: string
  desc?: string
  event_id?: number
  type?: string
  color?: string
}

export interface DynastyData {
  dynasty: Dynasty
  persons: Person[]
  events: Event[]
  keywords?: Array<{ name: string; value: number; category: string; desc: string }>
  timelines?: Record<string, TimelineEntry[]>
}

// 内存缓存，避免重复请求
const cache = new Map<number, DynastyData>()

/**
 * 尝试从 JSON 文件加载朝代数据
 * @param dynastyId 朝代 ID (如 201)
 * @returns 数据对象，加载失败返回 null
 */
export async function loadDynastyData(dynastyId: number): Promise<DynastyData | null> {
  // 命中缓存
  if (cache.has(dynastyId)) {
    return cache.get(dynastyId)!
  }

  const url = `/data/dynasty_${dynastyId}.json`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      // 404 或其他错误，说明该朝代没有 JSON 数据
      return null
    }
    
    const raw = await response.json()
    
    // 转换为与 mock/data.ts 兼容的格式
    const data: DynastyData = {
      dynasty: raw.dynasty,
      persons: raw.persons || [],
      events: raw.events || [],
      keywords: raw.keywords || [],
      timelines: raw.timelines || {}
    }
    
    // 写入缓存
    cache.set(dynastyId, data)
    console.log(`[dynastyDataService] 加载成功: dynasty_${dynastyId}.json (${data.persons.length}人, ${data.events.length}事件)`)
    
    return data
  } catch (error) {
    // 网络错误或 JSON 解析失败
    console.warn(`[dynastyDataService] 加载失败: dynasty_${dynastyId}.json`, error)
    return null
  }
}

/**
 * 清除指定朝代的缓存（用于开发时热更新）
 */
export function clearCache(dynastyId?: number) {
  if (dynastyId) {
    cache.delete(dynastyId)
  } else {
    cache.clear()
  }
}

/**
 * 检查某朝代是否有 JSON 数据（同步，不加载内容）
 */
export async function hasDynastyData(dynastyId: number): Promise<boolean> {
  if (cache.has(dynastyId)) return true
  
  try {
    const response = await fetch(`/data/dynasty_${dynastyId}.json`, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}