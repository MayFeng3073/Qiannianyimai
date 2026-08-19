import type { Event } from '@/mock/data'
import { events as mockEvents } from '@/mock/data'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const eventApi = {
  async getAll(dynasty?: string): Promise<Event[]> {
    await delay(300)
    if (dynasty) {
      return mockEvents.filter(e => e.dynasty === dynasty)
    }
    return [...mockEvents]
  },

  async getById(id: number): Promise<Event | null> {
    await delay(200)
    return mockEvents.find(e => e.id === id) || null
  },

  async search(query: string): Promise<Event[]> {
    await delay(200)
    return mockEvents.filter(e => 
      e.name.includes(query) ||
      e.summary.includes(query)
    )
  },

  async getByType(type: string): Promise<Event[]> {
    await delay(200)
    return mockEvents.filter(e => e.event_type === type)
  },

  async getByDynasty(dynasty: string): Promise<Event[]> {
    await delay(200)
    return mockEvents.filter(e => e.dynasty === dynasty)
  },

  async getCount(): Promise<number> {
    await delay(100)
    return mockEvents.length
  },

  async getRelatedPersons(eventId: number): Promise<string[]> {
    await delay(200)
    const event = mockEvents.find(e => e.id === eventId)
    return event?.related_persons || []
  }
}