<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dynasties, persons } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'

const route = useRoute()
const router = useRouter()
const isLoaded = ref(false)
const filterCategory = ref('all')
const jsonData = ref<DynastyData | null>(null)

const dynastyId = Number(route.params.id) || 100
const dynasty = computed(() => dynasties.find(d => d.id === dynastyId))

const dynastyPersons = computed(() => {
  if (jsonData.value) {
    return jsonData.value.persons
  }
  if (!dynasty.value) return []
  return persons.filter(p => p.dynasty === dynasty.value!.name)
})

const categories = computed(() => {
  const cats = new Set(dynastyPersons.value.map(p => p.category))
  return ['all', ...Array.from(cats)]
})

const filteredPersons = computed(() => {
  if (filterCategory.value === 'all') return dynastyPersons.value
  return dynastyPersons.value.filter(p => p.category === filterCategory.value)
})

const formattedYear = (year: number) => {
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

const getLifeSpan = (person: typeof persons[0]) => {
  if (!person.birth_year && !person.death_year) return '生卒年不详'
  if (!person.death_year) return `${formattedYear(person.birth_year || 0)}出生`
  if (!person.birth_year) return `${formattedYear(person.death_year || 0)}去世`
  return `${formattedYear(person.birth_year)} — ${formattedYear(person.death_year)}`
}

onMounted(async () => {
  // 尝试加载 JSON 数据
  if (dynastyId !== 100 && dynastyId >= 200) {
    const data = await loadDynastyData(dynastyId)
    if (data) {
      jsonData.value = data
    }
  }

  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const navigateToPerson = (id: number) => {
  const allPersons = jsonData.value?.persons || persons
  const person = allPersons.find(p => p.id === id)
  if (person?.level === 2) {
    router.push(`/person/${id}/story`)
  } else {
    router.push(`/person/${id}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative overflow-x-hidden pb-24">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
      <div class="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
            <div class="w-8 h-8 rounded-full bg-[#C34739] flex items-center justify-center">
              <span class="font-calligraphy text-white text-lg">千</span>
            </div>
            <span class="font-calligraphy text-xl text-[#2C2C2C]">千年一脉</span>
          </div>
          <div class="h-5 w-px bg-[#D8B26A]/30"></div>
          <div class="text-sm text-[#4A4A3A]/60" v-if="dynasty">
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/')">首页</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/timeline')">中国历史</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/dynasty/' + dynastyId)">{{ dynasty.name }}</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">代表人物</span>
          </div>
        </div>
        
      </div>
    </nav>

    

    <section class="pt-20 pb-12 px-8">
      <div class="max-w-6xl mx-auto">
        <div 
          class="mb-12"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
        >
          <h1 class="font-serif text-4xl md:text-5xl text-ink-black mb-4">
            {{ dynasty?.name }} · 历史人物
          </h1>
          <p class="text-ink-black/60">
            共 {{ dynastyPersons.length }} 位历史人物，在{{ dynasty?.name }}的历史长河中留下了浓墨重彩的一笔
          </p>
        </div>

        <div 
          class="flex flex-wrap gap-3 mb-10"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
        >
          <button 
            v-for="cat in categories" 
            :key="cat"
            @click="filterCategory = cat"
            :class="filterCategory === cat ? 'bg-dai-blue text-white' : 'bg-white/50 text-ink-black/70 hover:bg-white/80'"
            class="px-4 py-2 rounded-full text-sm transition-all duration-300"
          >
            {{ cat === 'all' ? '全部' : cat }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="(person, index) in filteredPersons" 
            :key="person.id"
            @click="navigateToPerson(person.id)"
            class="glass-card rounded-2xl overflow-hidden hover-card cursor-pointer group"
            :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
            :style="{ animationDelay: `${index * 0.08}s` }"
          >
            <div class="relative h-48 bg-gradient-to-br from-dai-blue/10 to-light-gold/10 overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <img 
                    :src="person.image_url" 
                    :alt="person.name" 
                    class="w-full h-full object-cover absolute inset-0"
                    @error="(e: any) => { e.target.style.display = 'none'; const s = e.target.nextElementSibling; if (s) s.style.display = 'flex'; }"
                  />
                  <span class="font-serif text-4xl text-dai-blue" style="display:none;">{{ person.name.charAt(0) }}</span>
                </div>
              </div>
              <div class="absolute top-4 right-4">
                <span class="tag-pill text-xs bg-white/80 backdrop-blur-sm">{{ person.category }}</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            <div class="p-6">
              <h3 class="font-serif text-xl text-ink-black mb-2 group-hover:text-dai-blue transition-colors">{{ person.name }}</h3>
              <p v-if="person.courtesy_name" class="text-sm text-ink-black/50 mb-3">字 {{ person.courtesy_name }}<span v-if="person.art_name">，号 {{ person.art_name }}</span></p>
              <p class="text-xs text-ink-black/40 mb-4">{{ getLifeSpan(person) }}</p>
              <p class="text-sm text-ink-black/70 line-clamp-2 mb-4">{{ person.summary }}</p>
              
              <div v-if="person.occupations?.length" class="flex flex-wrap gap-1.5">
                <span 
                  v-for="occ in person.occupations.slice(0, 3)" 
                  :key="occ"
                  class="text-xs px-2 py-0.5 rounded-full bg-dai-blue/10 text-dai-blue/80"
                >
                  {{ occ }}
                </span>
                <span v-if="person.occupations.length > 3" class="text-xs px-2 py-0.5 rounded-full bg-ink-black/5 text-ink-black/50">
                  +{{ person.occupations.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredPersons.length === 0" class="text-center py-24">
          <svg class="w-16 h-16 mx-auto mb-4 text-ink-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="text-ink-black/40">暂无历史人物数据</p>
        </div>
      </div>
    </section>
  </div>
</template>
