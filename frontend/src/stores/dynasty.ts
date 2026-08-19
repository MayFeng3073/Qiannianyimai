import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Dynasty } from '@/mock/data'
import { dynasties as mockDynasties } from '@/mock/data'

export const useDynastyStore = defineStore('dynasty', () => {
  const dynasties = ref<Dynasty[]>([])
  const currentDynasty = ref<Dynasty | null>(null)
  const isLoading = ref(false)

  const sortedDynasties = computed(() => {
    return [...dynasties.value].sort((a, b) => a.start_year - b.start_year)
  })

  const dynastyById = computed(() => {
    return (id: number) => dynasties.value.find(d => d.id === id)
  })

  const dynastyByName = computed(() => {
    return (name: string) => dynasties.value.find(d => d.name === name)
  })

  async function loadDynasties() {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      dynasties.value = [...mockDynasties]
    } catch (error) {
      console.error('Failed to load dynasties:', error)
      dynasties.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getDynasty(id: number) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const dynasty = mockDynasties.find(d => d.id === id)
      currentDynasty.value = dynasty || null
      return currentDynasty.value
    } catch (error) {
      console.error('Failed to get dynasty:', error)
      currentDynasty.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    dynasties,
    currentDynasty,
    isLoading,
    sortedDynasties,
    dynastyById,
    dynastyByName,
    loadDynasties,
    getDynasty
  }
})