import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Person } from '@/mock/data'
import { persons as mockPersons } from '@/mock/data'

export const usePersonStore = defineStore('person', () => {
  const persons = ref<Person[]>([])
  const currentPerson = ref<Person | null>(null)
  const isLoading = ref(false)

  const personsByDynasty = computed(() => {
    const map: Record<string, Person[]> = {}
    persons.value.forEach(person => {
      if (!map[person.dynasty]) {
        map[person.dynasty] = []
      }
      map[person.dynasty].push(person)
    })
    return map
  })

  const personById = computed(() => {
    return (id: number) => persons.value.find(p => p.id === id)
  })

  async function loadPersons(dynasty?: string) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (dynasty) {
        persons.value = mockPersons.filter(p => p.dynasty === dynasty)
      } else {
        persons.value = [...mockPersons]
      }
    } catch (error) {
      console.error('Failed to load persons:', error)
      persons.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getPerson(id: number) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const person = mockPersons.find(p => p.id === id)
      currentPerson.value = person || null
      return currentPerson.value
    } catch (error) {
      console.error('Failed to get person:', error)
      currentPerson.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function searchPersons(query: string) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const results = mockPersons.filter(p => 
        p.name.includes(query) || 
        p.summary.includes(query) ||
        p.courtesy_name?.includes(query) ||
        p.art_name?.includes(query)
      )
      return results
    } catch (error) {
      console.error('Failed to search persons:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    persons,
    currentPerson,
    isLoading,
    personsByDynasty,
    personById,
    loadPersons,
    getPerson,
    searchPersons
  }
})