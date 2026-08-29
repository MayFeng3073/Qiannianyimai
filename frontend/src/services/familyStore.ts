/**
 * 家族记忆 —— IndexedDB 数据访问层
 * ================================================
 * 手写原生 IndexedDB 封装，零第三方依赖。
 * 所有家族数据只读写本库（qiannian-family），绝不触碰大历史数据。
 * 删除家族人物时，级联只删除该人物在家族库内的资料，绝不触碰大历史。
 */
import type {
  FamilyMeta, FamilyMember, FamilyRelation, FamilyPhoto,
  LifeEvent, FamilyStory, HistoryLink, RelationKind
} from '@/types/family'

const DB_NAME = 'qiannian-family'
const DB_VERSION = 3

const STORES = ['meta', 'members', 'relations', 'photos', 'lifeEvents', 'stories', 'historyLinks'] as const

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const txn = req.transaction!
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      for (const s of ['members', 'relations', 'photos', 'lifeEvents', 'stories', 'historyLinks'] as const) {
        const store = db.objectStoreNames.contains(s)
          ? txn.objectStore(s)
          : db.createObjectStore(s, { keyPath: 'id' })
        if (s === 'members' && !store.indexNames.contains('by_name')) {
          store.createIndex('by_name', 'name', { unique: false })
        }
        if (s === 'photos') {
          // 照片表按 ownerId 索引（v2 误建成 memberId 导致查询不到，v3 修正）
          if (store.indexNames.contains('by_member')) store.deleteIndex('by_member')
          store.createIndex('by_member', 'ownerId', { unique: false })
        } else if ((s === 'lifeEvents' || s === 'stories' || s === 'historyLinks') && !store.indexNames.contains('by_member')) {
          store.createIndex('by_member', 'memberId', { unique: false })
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

let _dbPromise: Promise<IDBDatabase> | null = null
function db(): Promise<IDBDatabase> {
  if (!_dbPromise) _dbPromise = openDB()
  return _dbPromise
}

/** 通用可读写事务包装 */
async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await db()
  return new Promise<T>((resolve, reject) => {
    const t = d.transaction(store, mode)
    const req = fn(t.objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

function uid(): string {
  return (crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`)
}

function now(): number {
  return Date.now()
}

/* ===================== 家族概览统计 ===================== */
export interface FamilyStats {
  members: number
  lifeEvents: number
  stories: number
  photos: number
  historyLinks: number
}

export async function createAndGetDb(): Promise<IDBDatabase> { return db() }

/* ===================== 家族 meta ===================== */
export async function saveMeta(meta: Omit<FamilyMeta, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }): Promise<void> {
  const d = await db()
  const t = d.transaction('meta', 'readwrite')
  const store = t.objectStore('meta')
  const existing = await new Promise<FamilyMeta | undefined>((res, rej) => {
    const r = store.get('self'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
  })
  store.put({ key: 'self', ...(existing || {}), ...meta, updatedAt: now() })
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

export async function getMeta(): Promise<FamilyMeta | null> {
  const meta = await tx<any>('meta', 'readonly', s => s.get('self'))
  return meta ? { familyName: meta.familyName, treeName: meta.treeName, createdAt: meta.createdAt, updatedAt: meta.updatedAt } : null
}

/* ===================== 成员 ===================== */
export async function getAllMembers(): Promise<FamilyMember[]> {
  return tx<FamilyMember[]>('members', 'readonly', s => (s.getAll as any)())
}

export async function getMember(id: string): Promise<FamilyMember | undefined> {
  return tx<FamilyMember | undefined>('members', 'readonly', s => s.get(id))
}

export async function addMember(m: Omit<FamilyMember, 'id' | 'created_at'>): Promise<FamilyMember> {
  const member: FamilyMember = { ...m, id: uid(), created_at: now() }
  await tx('members', 'readwrite', s => s.put(member))
  return member
}

export async function updateMember(id: string, patch: Partial<Omit<FamilyMember, 'id'>>): Promise<void> {
  const cur = await getMember(id)
  if (!cur) throw new Error('成员不存在')
  await tx('members', 'readwrite', s => s.put({ ...cur, ...patch, updated_at: now() }))
}

/** 在给定事务内级联删除某成员的家族资料（关系/经历/故事/照片/历史关联），纯家族数据 */
async function cascadeDeleteMemberData(t: IDBTransaction, memberId: string): Promise<void> {
  const relStore = t.objectStore('relations')
  const rels = await new Promise<any[]>((res, rej) => {
    const r = relStore.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
  })
  for (const r of rels) if (r.fromId === memberId || r.toId === memberId) relStore.delete(r.id)
  for (const s of ['lifeEvents', 'stories', 'photos', 'historyLinks'] as const) {
    const st = t.objectStore(s)
    const idx = st.index('by_member')
    const items = await new Promise<any[]>((res, rej) => {
      const r = idx.getAll(memberId); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
    })
    for (const it of items) st.delete(it.id)
  }
}

export async function deleteMember(id: string): Promise<void> {
  const d = await db()
  const t = d.transaction(STORES, 'readwrite')
  t.objectStore('members').delete(id)
  await cascadeDeleteMemberData(t, id)
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

/** 只清空某成员的关联数据（不删成员本身），供表单保存时重建关系使用 */
export async function clearMemberExtras(id: string): Promise<void> {
  const d = await db()
  const t = d.transaction(['relations', 'lifeEvents', 'stories', 'photos', 'historyLinks'], 'readwrite')
  await cascadeDeleteMemberData(t, id)
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

/* ===================== 关系 ===================== */
export async function getAllRelations(): Promise<FamilyRelation[]> {
  return tx<FamilyRelation[]>('relations', 'readonly', s => (s.getAll as any)())
}

/** 添加一条关系，并自动生成其反向对称关系 */
export async function addRelation(fromId: string, toId: string, kind: RelationKind, note?: string): Promise<void> {
  const d = await db()
  const t = d.transaction('relations', 'readwrite')
  const store = t.objectStore('relations')
  store.put({ id: uid(), fromId, toId, kind, note })
  const reverseKind: RelationKind = kind === 'parent' ? 'child' : kind === 'child' ? 'parent' : kind
  store.put({ id: uid(), fromId: toId, toId: fromId, kind: reverseKind, note })
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

export async function deleteRelation(id: string): Promise<void> {
  await tx('relations', 'readwrite', s => s.delete(id))
}

export async function clearRelations(): Promise<void> {
  const d = await db()
  const t = d.transaction('relations', 'readwrite')
  const st = t.objectStore('relations')
  const all = await new Promise<any[]>((res, rej) => { const r = st.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  for (const r of all) st.delete(r.id)
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

/* ===================== 照片 ===================== */
export async function addPhoto(p: Omit<FamilyPhoto, 'id' | 'created_at'>): Promise<FamilyPhoto> {
  const photo: FamilyPhoto = { ...p, id: uid(), created_at: now() }
  await tx('photos', 'readwrite', s => s.put(photo))
  return photo
}

export async function getPhoto(id: string): Promise<FamilyPhoto | undefined> {
  return tx<FamilyPhoto | undefined>('photos', 'readonly', s => s.get(id))
}

export async function getPhotosByMember(memberId: string): Promise<FamilyPhoto[]> {
  return tx<FamilyPhoto[]>('photos', 'readonly', s => s.index('by_member').getAll(memberId))
}

/* ===================== 人生经历 ===================== */
export async function getLifeEventsByMember(memberId: string): Promise<LifeEvent[]> {
  return tx<LifeEvent[]>('lifeEvents', 'readonly', s => s.index('by_member').getAll(memberId))
}

export async function addLifeEvent(e: Omit<LifeEvent, 'id' | 'created_at'>): Promise<LifeEvent> {
  const ev: LifeEvent = { ...e, id: uid(), created_at: now() }
  await tx('lifeEvents', 'readwrite', s => s.put(ev))
  return ev
}

export async function updateLifeEvent(id: string, patch: Partial<LifeEvent>): Promise<void> {
  const d = await db()
  const t = d.transaction('lifeEvents', 'readwrite')
  const st = t.objectStore('lifeEvents')
  const cur = await new Promise<any | undefined>((res, rej) => { const r = st.get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  if (cur) st.put({ ...cur, ...patch })
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

export async function deleteLifeEvent(id: string): Promise<void> {
  await tx('lifeEvents', 'readwrite', s => s.delete(id))
}

/* ===================== 家族故事 ===================== */
export async function getStoriesByMember(memberId: string): Promise<FamilyStory[]> {
  return tx<FamilyStory[]>('stories', 'readonly', s => s.index('by_member').getAll(memberId))
}

export async function addStory(s: Omit<FamilyStory, 'id' | 'created_at'>): Promise<FamilyStory> {
  const story: FamilyStory = { ...s, id: uid(), created_at: now() }
  await tx('stories', 'readwrite', st => st.put(story))
  return story
}

export async function deleteStory(id: string): Promise<void> {
  await tx('stories', 'readwrite', s => s.delete(id))
}

/* ===================== 历史关联 ===================== */
export async function getHistoryLinksByMember(memberId: string): Promise<HistoryLink[]> {
  return tx<HistoryLink[]>('historyLinks', 'readonly', s => s.index('by_member').getAll(memberId))
}

export async function getAllHistoryLinks(): Promise<HistoryLink[]> {
  return tx<HistoryLink[]>('historyLinks', 'readonly', s => (s.getAll as any)())
}

export async function addHistoryLink(l: Omit<HistoryLink, 'id' | 'createdAt'>): Promise<HistoryLink> {
  const link: HistoryLink = { ...l, id: uid(), createdAt: now() }
  await tx('historyLinks', 'readwrite', s => s.put(link))
  return link
}

export async function deleteHistoryLink(id: string): Promise<void> {
  await tx('historyLinks', 'readwrite', s => s.delete(id))
}

export async function getHistoryLinksByTarget(targetType: HistoryLink['targetType'], targetId: number): Promise<HistoryLink[]> {
  const all = await getAllHistoryLinks()
  return all.filter(l => l.targetType === targetType && l.targetId === targetId)
}

/* ===================== 统计 ===================== */
export async function getStats(): Promise<FamilyStats> {
  const [members, lifeEvents, stories, photos, historyLinks] = await Promise.all([
    getAllMembers(), getAllRelated<LifeEvent>('lifeEvents'), getAllRelated<FamilyStory>('stories'),
    getAllRelated<FamilyPhoto>('photos'), getAllHistoryLinks()
  ])
  return { members: members.length, lifeEvents: lifeEvents.length, stories: stories.length, photos: photos.length, historyLinks: historyLinks.length }
}

async function getAllRelated<T>(store: string): Promise<T[]> {
  return tx<T[]>(store, 'readonly', s => (s.getAll as any)())
}

/* ===================== 清空（仅清家族库，用于"数据清空"） ===================== */
export async function clearFamilyData(): Promise<void> {
  const d = await db()
  const t = d.transaction(STORES, 'readwrite')
  for (const s of STORES) t.objectStore(s).clear()
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

/* ===================== 一键载入示例数据（便于测试） ===================== */
/**
 * 清空并载入一套示例家庭数据，方便在刷新后直接看到家族树 / 详情页效果。
 * 历史关联指向大历史中真实存在的人物/事件 ID（如 明朝建立 id:10、朱元璋 id:12），
 * 用于演示历史标签与"他所处的时代"对照；大历史近现代内容待收录。
 */
export async function seedDemoFamily(): Promise<void> {
  await clearFamilyData()

  const G = '男', W = '女'
  const greatGrandpa = await addMember({ name: '曾祖父', gender: G, birthYear: 1900, deathYear: 1975, birthPlace: '浙江绍兴', residence: '绍兴', occupation: '耕读传家', relationToSelf: '曾祖父', avatarColor: '#5C7A5E' })
  const grandpa = await addMember({ name: '爷爷', gender: G, birthYear: 1932, deathYear: 2010, birthPlace: '浙江绍兴', residence: '杭州', occupation: '中学教师', relationToSelf: '祖父', avatarColor: '#355C5A' })
  const grandma = await addMember({ name: '奶奶', gender: W, birthYear: 1936, deathYear: 2009, birthPlace: '浙江宁波', residence: '杭州', occupation: '纺织工人', relationToSelf: '祖母', avatarColor: '#8B3A2B' })
  const dad = await addMember({ name: '爸爸', gender: G, birthYear: 1960, birthPlace: '杭州', residence: '杭州', occupation: '工程师', relationToSelf: '父亲', avatarColor: '#4A6F7A' })
  const mom = await addMember({ name: '妈妈', gender: W, birthYear: 1963, birthPlace: '杭州', residence: '杭州', occupation: '医生', relationToSelf: '母亲', avatarColor: '#C34739' })
  const uncle = await addMember({ name: '叔叔', gender: G, birthYear: 1965, birthPlace: '杭州', residence: '上海', occupation: '商人', relationToSelf: '叔叔', avatarColor: '#D8B26A' })
  const me = await addMember({ name: '我', gender: G, birthYear: 1995, birthPlace: '杭州', residence: '杭州', occupation: '学生', relationToSelf: '本人', isSelf: true, avatarColor: '#2E4A48' })

  // 家庭关系
  await addRelation(greatGrandpa.id, grandpa.id, 'parent')
  await addRelation(grandpa.id, grandma.id, 'spouse')
  await addRelation(grandpa.id, dad.id, 'parent')
  await addRelation(grandpa.id, uncle.id, 'parent')
  await addRelation(dad.id, mom.id, 'spouse')
  await addRelation(dad.id, me.id, 'parent')

  // 人生经历
  await addLifeEvent({ memberId: grandpa.id, year: '1945', title: '童年', description: '在绍兴老家的水乡度过童年' })
  await addLifeEvent({ memberId: grandpa.id, year: '1952', title: '参加工作', description: '师范毕业后成为一名中学教师' })
  await addLifeEvent({ memberId: grandpa.id, year: '1978', title: '迎来改革开放', description: '生活与教学环境逐步改善' })
  await addLifeEvent({ memberId: dad.id, year: '1985', title: '参加工作', description: '毕业后进入工厂担任工程师' })
  await addLifeEvent({ memberId: me.id, year: '2013', title: '考上大学', description: '离家赴京求学' })

  // 家族故事
  await addStory({
    memberId: grandpa.id, year: '1960', title: '一盏煤油灯',
    content: '爷爷常说，那个年代夜校的煤油灯下，是他最珍惜的时光。他用这盏灯，批改了一届又一届学生的作业。',
    photoIds: []
  })

  // 历史关联：指向大历史中真实存在的条目，用于演示历史标签与时代对照
  await addHistoryLink({ memberId: grandpa.id, targetType: 'event', targetId: 10, confirmed: true })   // 明朝建立
  await addHistoryLink({ memberId: grandpa.id, targetType: 'person', targetId: 12, confirmed: true })  // 朱元璋
  await addHistoryLink({ memberId: me.id, targetType: 'event', targetId: 1001, confirmed: true })      // 阪泉之战
}

/* ===================== 导出 / 导入 ===================== */
export async function exportFamilyData(): Promise<any> {
  const d = await db()
  const readAll = (s: string) => new Promise<any[]>((res, rej) => {
    const r = d.transaction(s, 'readonly').objectStore(s).getAll()
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
  })
  const data: any = { version: 1, exportedAt: now() }
  for (const s of STORES) data[s] = await readAll(s)
  return data
}

export async function importFamilyData(data: any): Promise<void> {
  if (!data || data.version !== 1) throw new Error('不支持的备份文件')
  const d = await db()
  const t = d.transaction(STORES, 'readwrite')
  for (const s of STORES) {
    const st = t.objectStore(s)
    st.clear()
    const rows = Array.isArray(data[s]) ? data[s] : []
    for (const row of rows) st.put(row)
  }
  await new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}

/* 导出单文件下载 */
export function downloadBackup(data: any, filename = `家族记忆备份-${new Date().toISOString().slice(0, 10)}.json`) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}