/**
 * 朝代内容关联表 —— 朝代页「相关朝代」与首页「为你推荐」共用。
 * 只描述内容上的联系（制度承袭、盛世并称、民族政权等），不做时间硬凑。
 */
export interface RelatedDynastyRef {
  id: number
  reason: string
}

export const RELATED_DYNASTIES: Record<number, RelatedDynastyRef[]> = {
  100: [{ id: 201, reason: '三皇五帝 → 三代之治' }],
  201: [
    { id: 100, reason: '文明之源' },
    { id: 202, reason: '礼崩乐坏' }
  ],
  202: [
    { id: 203, reason: '诸子争鸣延续' },
    { id: 201, reason: '礼乐之源' }
  ],
  203: [
    { id: 202, reason: '思想争鸣' },
    { id: 106, reason: '秦并六国' }
  ],
  106: [
    { id: 203, reason: '承前' },
    { id: 107, reason: '汉承秦制' },
    { id: 111, reason: '同为短命而制度开创' }
  ],
  107: [
    { id: 106, reason: '汉承秦制' },
    { id: 109, reason: '汉末群雄' },
    { id: 112, reason: '汉唐并称盛世' }
  ],
  109: [
    { id: 107, reason: '承接' },
    { id: 110, reason: '归晋' }
  ],
  110: [
    { id: 109, reason: '承接' },
    { id: 111, reason: '北朝 → 统一' },
    { id: 114, reason: '北方民族政权' }
  ],
  111: [
    { id: 110, reason: '承前' },
    { id: 112, reason: '隋唐一体' },
    { id: 106, reason: '二世而亡的制度王朝' }
  ],
  112: [
    { id: 111, reason: '承前' },
    { id: 107, reason: '汉唐盛世' },
    { id: 113, reason: '唐宋文化高峰' }
  ],
  113: [
    { id: 112, reason: '唐宋' },
    { id: 114, reason: '宋元更替' },
    { id: 115, reason: '市民经济与文人政治' }
  ],
  114: [
    { id: 113, reason: '承前' },
    { id: 115, reason: '后继' },
    { id: 116, reason: '蒙元满清同为非汉民族政权' }
  ],
  115: [
    { id: 114, reason: '承前' },
    { id: 116, reason: '明清鼎革' },
    { id: 113, reason: '市民文化' }
  ],
  116: [
    { id: 115, reason: '明清' },
    { id: 114, reason: '非汉民族政权' },
    { id: 117, reason: '清末民初' }
  ],
  117: [{ id: 116, reason: '帝制终结' }]
}

export function relatedDynastyRefs(id: number): RelatedDynastyRef[] {
  return RELATED_DYNASTIES[id] || []
}
