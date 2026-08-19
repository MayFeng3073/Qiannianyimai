import { defineStore } from 'pinia'
import { ref } from 'vue'

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

export const useFamilyStore = defineStore('family', () => {
  const familyTrees = ref<FamilyTree[]>([])
  const currentFamilyTree = ref<FamilyTree | null>(null)
  const isLoading = ref(false)
  const hasData = ref(false)

  async function loadFamilyTrees() {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      familyTrees.value = []
      hasData.value = false
    } catch (error) {
      console.error('Failed to load family trees:', error)
      familyTrees.value = []
      hasData.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function getFamilyTree(id: number) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const tree = familyTrees.value.find(t => t.id === id)
      currentFamilyTree.value = tree || null
      return currentFamilyTree.value
    } catch (error) {
      console.error('Failed to get family tree:', error)
      currentFamilyTree.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createFamilyTree(name: string) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const newTree: FamilyTree = {
        id: Date.now(),
        name,
        members: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      familyTrees.value.push(newTree)
      currentFamilyTree.value = newTree
      hasData.value = true
      return newTree
    } catch (error) {
      console.error('Failed to create family tree:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function addFamilyMember(treeId: number, member: Omit<FamilyMember, 'id'>) {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      const tree = familyTrees.value.find(t => t.id === treeId)
      if (tree) {
        const newMember: FamilyMember = {
          ...member,
          id: Date.now()
        }
        tree.members.push(newMember)
        tree.updated_at = new Date().toISOString()
        hasData.value = true
        return newMember
      }
      return null
    } catch (error) {
      console.error('Failed to add family member:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    familyTrees,
    currentFamilyTree,
    isLoading,
    hasData,
    loadFamilyTrees,
    getFamilyTree,
    createFamilyTree,
    addFamilyMember
  }
})