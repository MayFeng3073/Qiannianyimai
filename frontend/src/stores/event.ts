import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Event } from '@/mock/data'
import { events as mockEvents } from '@/mock/data'

export const useEventStore = defineStore('event', () => {
  const events = ref<Event[]>([])
  const currentEvent = ref<Event | null>(null)
  const isLoading = ref(false)

  const eventsByDynasty = computed(() => {
    const map: Record<string, Event[]> = {}
    events.value.forEach(event => {
      if (!map[event.dynasty]) {
        map[event.dynasty] = []
      }
      map[event.dynasty].push(event)
    })
    return map
  })

  const eventById = computed(() => {
    return (id: number) => events.value.find(e => e.id === id)
  })

  async function loadEvents(dynasty?: string) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (dynasty) {
        events.value = mockEvents.filter(e => e.dynasty === dynasty)
      } else {
        events.value = [...mockEvents]
      }
    } catch (error) {
      console.error('Failed to load events:', error)
      events.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getEvent(id: number) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const event = mockEvents.find(e => e.id === id)
      currentEvent.value = event || null
      return currentEvent.value
    } catch (error) {
      console.error('Failed to get event:', error)
      currentEvent.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function searchEvents(query: string) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const results = mockEvents.filter(e => 
        e.name.includes(query) || 
        e.summary.includes(query)
      )
      return results
    } catch (error) {
      console.error('Failed to search events:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    events,
    currentEvent,
    isLoading,
    eventsByDynasty,
    eventById,
    loadEvents,
    getEvent,
    searchEvents
  }
})