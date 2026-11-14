/**
 * 最近浏览的朝代（本地保存，仅用于首页「为你推荐」）。
 * 只记录访问过的朝代 id，不上传、不改动任何历史数据。
 */
const KEY = 'qny.recentDynasties'
const MAX = 8

export function readRecentDynasties(): number[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      .slice(0, MAX)
  } catch {
    return []
  }
}

export function recordRecentDynasty(id: number) {
  if (!Number.isFinite(id)) return
  try {
    const list = readRecentDynasties().filter(x => x !== id)
    list.unshift(id)
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* 隐私模式等不可写场景忽略 */
  }
}
