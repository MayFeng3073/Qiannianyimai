import type { Dynasty } from '@/mock/data'
import { dynasties as mockDynasties } from '@/mock/data'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const dynastyApi = {
  async getAll(): Promise<Dynasty[]> {
    await delay(200)
    return [...mockDynasties]
  },

  async getById(id: number): Promise<Dynasty | null> {
    await delay(200)
    return mockDynasties.find(d => d.id === id) || null
  },

  async getByName(name: string): Promise<Dynasty | null> {
    await delay(200)
    return mockDynasties.find(d => d.name === name) || null
  },

  async getCount(): Promise<number> {
    await delay(100)
    return mockDynasties.length
  },

  async getTimeline(): Promise<{ id: number; name: string; start_year: number; end_year: number; english_name: string }[]> {
    await delay(200)
    return mockDynasties.map(d => ({
      id: d.id,
      name: d.name,
      start_year: d.start_year,
      end_year: d.end_year,
      english_name: d.english_name
    }))
  }
}