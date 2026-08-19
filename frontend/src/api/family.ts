export interface FamilyMember {
  id: number
  name: string
  relation: string
  generation: number
  birth_year?: number
  death_year?: number
  avatar?: string
}

export interface FamilyTree {
  id: number
  name: string
  members: FamilyMember[]
  created_at: string
  updated_at: string
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const familyApi = {
  async getAll(): Promise<FamilyTree[]> {
    await delay(300)
    return []
  },

  async getById(_id: number): Promise<FamilyTree | null> {
    await delay(200)
    return null
  },

  async create(name: string): Promise<FamilyTree> {
    await delay(300)
    return {
      id: Date.now(),
      name,
      members: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },

  async update(_id: number, _data: Partial<FamilyTree>): Promise<FamilyTree | null> {
    await delay(200)
    return null
  },

  async delete(_id: number): Promise<boolean> {
    await delay(200)
    return false
  },

  async addMember(_treeId: number, _member: Omit<FamilyMember, 'id'>): Promise<FamilyMember | null> {
    await delay(200)
    return null
  },

  async updateMember(_treeId: number, _memberId: number, _data: Partial<FamilyMember>): Promise<FamilyMember | null> {
    await delay(200)
    return null
  },

  async deleteMember(_treeId: number, _memberId: number): Promise<boolean> {
    await delay(200)
    return false
  }
}