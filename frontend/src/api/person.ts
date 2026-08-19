import type { Person } from '@/mock/data'
import { persons as mockPersons } from '@/mock/data'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const personApi = {
  async getAll(dynasty?: string): Promise<Person[]> {
    await delay(300)
    if (dynasty) {
      return mockPersons.filter(p => p.dynasty === dynasty)
    }
    return [...mockPersons]
  },

  async getById(id: number): Promise<Person | null> {
    await delay(200)
    return mockPersons.find(p => p.id === id) || null
  },

  async search(query: string): Promise<Person[]> {
    await delay(200)
    return mockPersons.filter(p => 
      p.name.includes(query) ||
      p.summary.includes(query) ||
      p.courtesy_name?.includes(query) ||
      p.art_name?.includes(query)
    )
  },

  async getRelated(id: number): Promise<Person[]> {
    await delay(200)
    const person = mockPersons.find(p => p.id === id)
    if (!person || !person.related_people) return []
    
    return mockPersons.filter(p => 
      person.related_people!.some(rp => rp.name === p.name)
    )
  },

  async getByCategory(category: string): Promise<Person[]> {
    await delay(200)
    return mockPersons.filter(p => p.category === category)
  },

  async getCount(): Promise<number> {
    await delay(100)
    return mockPersons.length
  },

  async getByDynasty(dynasty: string): Promise<Person[]> {
    await delay(200)
    return mockPersons.filter(p => p.dynasty === dynasty)
  }
}