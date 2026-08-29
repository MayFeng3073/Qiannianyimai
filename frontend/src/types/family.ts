/**
 * 家族记忆模块 —— 数据结构类型
 * ================================================
 * 本模块完全独立于大历史（mock/data.ts、public/data/*.json）。
 * 家族数据仅通过 HistoryLink 的 targetId/targetType 引用大历史
 * 人物/事件的数字 ID，绝不复制大历史内容，也绝不写入大历史库。
 */

/** 家族基本信息（单条，key 固定为 'self'） */
export interface FamilyMeta {
  familyName: string
  treeName: string
  createdAt: number
  updatedAt: number
}

/** 与本人关系（供"与我的关系"下拉） */
export type RelationToSelf =
  | '本人'
  | '父亲'
  | '母亲'
  | '爷爷'
  | '奶奶'
  | '外公'
  | '外婆'
  | '哥哥'
  | '姐姐'
  | '弟弟'
  | '妹妹'
  | '丈夫'
  | '妻子'
  | '儿子'
  | '女儿'
  | '叔叔'
  | '姑姑'
  | '舅舅'
  | '阿姨'
  | '曾祖父'
  | '曾祖母'
  | string

/** 性别 */
export type Gender = '男' | '女' | ''

/** 家族成员 */
export interface FamilyMember {
  id: string
  name: string
  gender: Gender
  /** 出生年（可空，普通用户可能不知道） */
  birthYear?: number
  /** 去世年（可空） */
  deathYear?: number
  birthPlace?: string
  residence?: string
  occupation?: string
  bio?: string
  /** 与本人的关系（如 祖父 / 父亲 / 作者本人） */
  relationToSelf?: RelationToSelf
  /** 是否为当前用户自己 */
  isSelf?: boolean
  /** 头像：存 base64 DataURL（阶段一先支持，照片墙阶段二扩展 Blob 相册） */
  avatarDataUrl?: string
  /** 头像占位色 */
  avatarColor: string
  created_at: number
  updated_at?: number
}

/** 亲属关系类型（用于树状连线；custom 为自定义语义关系，仅记录不连线） */
export type RelationKind = 'parent' | 'child' | 'spouse' | 'sibling' | 'custom'

/** 亲属关系（双向对称记录由 store 统一维护） */
export interface FamilyRelation {
  id: string
  fromId: string
  toId: string
  kind: RelationKind
  note?: string
}

/** 人生经历节点（个人时间轴，属家族数据） */
export interface LifeEvent {
  id: string
  memberId: string
  /** 年份或日期字符串，如 1950 */
  year?: string
  title: string
  description?: string
  photoId?: string
  created_at: number
}

/** 家族故事（文字叙事，属家族数据） */
export interface FamilyStory {
  id: string
  memberId: string
  year?: string
  title: string
  content: string
  photoIds: string[]
  created_at: number
}

/** 照片（二进制本地存于 IndexedDB） */
export interface FamilyPhoto {
  id: string
  ownerId: string
  blob: Blob
  title?: string
  takenAt?: string
  note?: string
  created_at: number
}

/** 历史关联目标类型 —— 引用大历史人物或事件 */
export type HistoryTargetType = 'person' | 'event'

/**
 * 历史关联：只保存对大历史资源的引用（targetId）。
 * targetId 对应大历史 mock/data.ts 中 persons/events 的数字 ID，
 * 或 dynasty_*.json 中 persons/events 的 id。由页面跳转 /person/:id、/event/:id 读取。
 */
export interface HistoryLink {
  id: string
  memberId: string
  targetType: HistoryTargetType
  targetId: number
  note?: string
  confirmed: boolean
  createdAt: number
}

/** 阶段二起用：照片上传输入 */
export interface FamilyStoreContract {
  familyMeta: FamilyMeta | null
  members: FamilyMember[]
  relations: FamilyRelation[]
  lifeEvents: LifeEvent[]
  stories: FamilyStory[]
  photos: FamilyPhoto[]
  historyLinks: HistoryLink[]
}