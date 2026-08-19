<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { hotPersons, persons, events, dynasties } from '@/mock/data'

const router = useRouter()
const searchQuery = ref('')
const isLoaded = ref(false)
const isScrolled = ref(false)
const visibleSections = ref<Record<string, boolean>>({})
const animatedNumbers = ref<Record<string, number>>({})

const popularSearches = ['李白', '武则天', '大禹治水', '唐朝', '丝绸之路', '辛亥革命']

const animateElements = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('data-animate')
        if (id && entry.isIntersecting) {
          visibleSections.value[id] = true
          observer.unobserve(entry.target)
          
          if (id === 'statistics') {
            animateNumbers()
          }
        }
      })
    },
    { threshold: 0.2, rootMargin: '-30px' }
  )

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el)
  })

  return observer
}

const animateNumbers = () => {
  const stats = [
    { id: 'person_count', target: 12634, duration: 2500 },
    { id: 'event_count', target: 2851, duration: 2200 },
    { id: 'relation_count', target: 6932, duration: 2800 },
    { id: 'family_count', target: 1024, duration: 2000 }
  ]

  stats.forEach(({ id, target, duration }) => {
    const start = 0
    const startTime = performance.now()
    
    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      animatedNumbers.value[id] = Math.floor(start + (target - start) * eased)
      
      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }
    
    requestAnimationFrame(update)
  })
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 50)

  const observer = animateElements()
  onUnmounted(() => {
    observer.disconnect()
    window.removeEventListener('scroll', handleScroll)
  })

  window.addEventListener('scroll', handleScroll)
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    const person = persons.find(p => p.name === searchQuery.value)
    const event = events.find(e => e.name === searchQuery.value)
    const dynasty = dynasties.find(d => d.name === searchQuery.value)
    
    if (person) {
      router.push(`/person/${person.id}`)
    } else if (event) {
      router.push(`/event/${event.id}`)
    } else if (dynasty) {
      router.push(`/dynasty/${dynasty.id}`)
    }
  }
}

const navigateToPerson = (id: number) => {
  router.push(`/person/${id}`)
}

const navigateToTimeline = () => {
  router.push('/timeline')
}

const navigateToFamily = () => {
  router.push('/family')
}
</script>

<template>
  <div class="min-h-screen bg-rice-white relative overflow-x-hidden">
    <div class="absolute inset-0 paper-texture pointer-events-none"></div>

    <header 
      class="fixed top-0 left-0 right-0 z-50 py-4 px-8 transition-all duration-500" 
      :class="[
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
        isScrolled ? 'glass-nav' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          @click="router.push('/')"
          class="flex items-center gap-3 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-md bg-gradient-to-br from-[#355C5A] to-[#C34739] flex items-center justify-center shadow-md border border-white/30">
            <svg viewBox="0 0 40 40" class="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#F8F6F2" stroke-width="1"/>
              <circle cx="20" cy="20" r="15" fill="none" stroke="#F8F6F2" stroke-width="0.5"/>
              <path d="M20 6 L20 34" stroke="#F8F6F2" stroke-width="0.5"/>
              <path d="M6 20 L34 20" stroke="#F8F6F2" stroke-width="0.5"/>
              <circle cx="20" cy="20" r="8" fill="none" stroke="#F8F6F2" stroke-width="0.5"/>
              <text x="20" y="25" text-anchor="middle" fill="#F8F6F2" font-size="16" font-family="'Ma Shan Zheng', cursive">千</text>
            </svg>
          </div>
          <span class="font-calligraphy text-xl text-[#2C2C2C] tracking-widest">千年一脉</span>
        </div>
        <nav class="flex items-center gap-10">
          <span 
            @click="navigateToTimeline"
            class="text-sm text-[#355C5A] cursor-pointer hover:text-[#C34739] transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            中国历史
          </span>
          <span 
            @click="navigateToFamily"
            class="text-sm text-[#355C5A] cursor-pointer hover:text-[#C34739] transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            我的家族
          </span>
        </nav>
      </div>
    </header>

    <section class="relative min-h-screen flex items-center justify-center px-8 overflow-hidden pt-20">
      <div class="absolute inset-0">
        <img 
          src="/hero-bg.png"
          alt="Hero Background"
          class="w-full h-full object-cover opacity-95"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-[#F8F6F2]/10 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#F5F2EC] via-[#F5F2EC]/80 to-transparent"></div>
        <div class="absolute bottom-0 left-1/4 w-32 h-32 bg-[#2C2C2C]/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-1/2 w-24 h-24 bg-[#355C5A]/5 rounded-full blur-2xl"></div>
        <div class="absolute bottom-0 right-1/4 w-20 h-20 bg-[#4A4A3A]/5 rounded-full blur-xl"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto text-center w-full">
        <div 
          class="font-calligraphy text-7xl md:text-9xl mb-6 tracking-wider"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
          style="background: linear-gradient(135deg, #2C2C2C 0%, #355C5A 30%, #4A4A3A 60%, #C34739 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
        >
          千年一脉
        </div>
        
        <div 
          class="text-xl md:text-2xl text-[#355C5A] mb-2 font-light font-serif"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
        >
          在历史中看见家族
        </div>
        
        <div 
          class="text-xl md:text-2xl text-[#355C5A] mb-8 font-light font-serif"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
        >
          在家族中看见历史
        </div>

        <div 
          class="text-lg text-[#4A4A3A] italic font-serif mb-10 max-w-xl mx-auto"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-3' : 'opacity-0'"
        >
          每一个普通人的故事，都是历史的一部分。
        </div>

        <div 
          class="max-w-[800px] mx-auto mb-16"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-4' : 'opacity-0'"
        >
          <div class="bg-white/85 backdrop-blur-sm rounded-lg px-6 py-4 flex items-center gap-4 shadow-lg border border-white/60">
            <svg class="w-5 h-5 text-[#4A4A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text" 
              placeholder="搜索人物 / 事件 / 朝代..."
              class="flex-1 bg-transparent outline-none text-[#2C2C2C] placeholder:text-[#4A4A3A]/50"
            />
          </div>
          
          <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span class="text-xs text-[#4A4A3A]/70">热门搜索：</span>
            <button 
              v-for="term in popularSearches" 
              :key="term"
              @click="searchQuery = term; handleSearch()"
              class="px-3 py-1 text-xs bg-white/60 hover:bg-[#355C5A]/10 hover:text-[#355C5A] rounded-md transition-colors border border-[#355C5A]/10"
            >{{ term }}</button>
          </div>
        </div>

      </div>
    </section>

    <section class="py-16 px-8 bg-[#F5F2EC]/30">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" data-animate="explore-section">
          <div 
            @click="navigateToTimeline"
            class="relative cursor-pointer rounded-lg overflow-hidden h-[280px]"
            :class="visibleSections['explore-section'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="absolute inset-0">
              <img 
                src="/history-card-bg.png"
                alt="中国历史"
                class="w-full h-full object-cover brightness-75 contrast-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#355C5A]/40 via-[#355C5A]/10 to-transparent"></div>
            </div>
            <div class="relative z-10 p-8">
              <h3 class="font-calligraphy text-3xl text-[#E8C882] mb-3">浏览中国历史</h3>
              <p class="text-[#F8F6F2]/90 text-base mb-6">探索五千年的文明演进</p>
              <button class="flex items-center gap-2 px-5 py-2.5 border-2 border-[#E8C882]/60 hover:border-[#E8C882] hover:bg-[#E8C882]/10 text-[#E8C882] text-sm rounded-full transition-colors">
                <span>进入探索</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          <div 
            @click="navigateToFamily"
            class="relative cursor-pointer rounded-lg overflow-hidden h-[280px]"
            :class="visibleSections['explore-section'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="absolute inset-0">
              <img 
                src="/family-card-bg.png"
                alt="我的家族"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#4A4A3A]/20 via-transparent to-transparent"></div>
            </div>
            <div class="relative z-10 p-8">
              <h3 class="font-calligraphy text-3xl text-[#4A4A3A] mb-3">浏览我的家族</h3>
              <p class="text-[#4A4A3A]/80 text-base leading-relaxed mb-6">记录家庭故事<br/>连接历史记忆</p>
              <button class="flex items-center gap-2 px-5 py-2.5 border-2 border-[#8B5A2B]/60 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/10 text-[#8B5A2B] text-sm rounded-full transition-colors">
                <span>进入家族树</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8" data-animate="continue-header">
          <h2 class="font-calligraphy text-3xl text-[#355C5A] mb-2">继续探索</h2>
          <p class="text-sm text-[#4A4A3A]/70">发现更多精彩内容</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-5">
          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#355C5A]/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">今日历史</span>
              </div>
              <button class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="h-36 rounded-md overflow-hidden mb-3">
                <img 
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20revolution%20wuchang%20uprising%201911%20historical%20painting%20style&image_size=landscape_16_9"
                  alt="今日历史"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="text-xs text-[#4A4A3A]/60 mb-1">1911年10月10日</div>
              <h4 class="font-calligraphy text-lg text-[#2C2C2C] mb-1">武昌起义</h4>
              <p class="text-sm text-[#4A4A3A]/80 line-clamp-2 mb-3 flex-1">辛亥革命的开端，打响了推翻清王朝统治的第一枪。</p>
              <button class="w-full py-2 text-sm text-[#355C5A] hover:bg-[#355C5A]/5 rounded-md transition-colors">查看详情</button>
            </div>
          </div>

          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#C34739]/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">热门人物</span>
              </div>
              <button class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div 
                  v-for="person in hotPersons.slice(0, 4)" 
                  :key="person.id"
                  @click="navigateToPerson(person.id)"
                  class="cursor-pointer"
                >
                  <div class="aspect-[3/4] rounded-md overflow-hidden mb-2 bg-[#F5F2EC]">
                    <img :src="person.image_url" :alt="person.name" class="w-full h-full object-cover" />
                  </div>
                  <div class="text-center">
                    <span class="text-xs text-[#2C2C2C] block font-medium">{{ person.name }}</span>
                    <span class="text-xs text-[#4A4A3A]/60">{{ person.dynasty }}</span>
                  </div>
                </div>
              </div>
              <button class="w-full py-2 text-sm text-[#C34739] hover:bg-[#C34739]/5 rounded-md transition-colors mt-auto">全部人物</button>
            </div>
          </div>

          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#D8B26A]/20 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">为你推荐</span>
              </div>
              <button class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="h-36 rounded-md overflow-hidden mb-3">
                <img 
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tang%20dynasty%20chinese%20city%20market%20ancient%20painting%20style%20bustling%20scene&image_size=landscape_16_9"
                  alt="为你推荐"
                  class="w-full h-full object-cover"
                />
              </div>
              <h4 class="font-calligraphy text-lg text-[#2C2C2C] mb-1">盛世大唐：开放与繁荣的时代</h4>
              <p class="text-sm text-[#4A4A3A]/80 line-clamp-2 mb-3 flex-1">了解唐朝如何成为当时世界上最强盛的国家之一。</p>
              <button class="w-full py-2 text-sm text-[#C34739] hover:bg-[#C34739]/5 rounded-md transition-colors">开始探索</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-8 bg-[#F5F2EC]/50">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5" data-animate="statistics">
          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#355C5A]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ animatedNumbers['person_count'] || '12,634' }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史人物</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#C34739]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ animatedNumbers['event_count'] || '2,851' }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史事件</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#D8B26A]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ animatedNumbers['relation_count'] || '6,932' }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史作品</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-3' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#5C7A5E]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#5C7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ animatedNumbers['family_count'] || '1,024+' }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">家族记忆</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">等待你的记录</div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-10 px-8 relative overflow-hidden bg-[#2C2C2C]/5">
      <div class="absolute inset-0 opacity-15">
        <img 
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20ink%20wash%20painting%20mountains%20river%20minimal%20traditional%20style&image_size=landscape_16_9"
          alt="Footer Background"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="relative z-10 max-w-4xl mx-auto text-center">
        <p class="font-calligraphy text-lg text-[#355C5A] mb-1">历史不会停留在书页</p>
        <p class="font-calligraphy text-lg text-[#355C5A] mb-1">它也存在于每一个家庭</p>
        <p class="font-calligraphy text-lg text-[#355C5A] mb-4">它也存于每一脉</p>
        <div class="flex items-center justify-center gap-3">
          <div class="w-10 h-10 rounded-md bg-gradient-to-br from-[#355C5A] to-[#C34739] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 40 40" class="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#F8F6F2" stroke-width="1"/>
              <text x="20" y="25" text-anchor="middle" fill="#F8F6F2" font-size="16" font-family="'Ma Shan Zheng', cursive">千</text>
            </svg>
          </div>
          <span class="font-calligraphy text-xl text-[#2C2C2C] tracking-widest">千年一脉</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.glass-nav {
  background: rgba(248, 246, 242, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(44, 44, 44, 0.08);
}
</style>
