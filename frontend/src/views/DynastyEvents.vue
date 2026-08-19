<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dynasties, events, type Event } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'

const route = useRoute()
const router = useRouter()
const isLoaded = ref(false)

const dynastyId = Number(route.params.id) || 100
const jsonData = ref<DynastyData | null>(null)

// 优先使用 JSON 中的朝代数据，fallback 到 mock
const dynasty = computed(() => {
  if (jsonData.value) {
    return jsonData.value.dynasty
  }
  return dynasties.find(d => d.id === dynastyId)
})

// 优先使用 JSON 中的事件数据，fallback 到 mock
const dynastyEvents = computed<Event[]>(() => {
  if (jsonData.value && jsonData.value.events.length > 0) {
    return jsonData.value.events
  }
  if (!dynasty.value) return []
  return events.filter(e => e.dynasty === dynasty.value!.name)
})

const formattedYear = (year: number) => {
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

// Wave timeline layout constants
const CARD_HEIGHT = 130
const CARD_GAP = 30
const WAVE_AMPLITUDE = 200

const totalHeight = computed(() => {
  return dynastyEvents.value.length * (CARD_HEIGHT + CARD_GAP) + 120
})

// 蛇形 S 曲线路径：事件在左/右极值点交替，形成 S 形
const wavePath = computed(() => {
  const count = dynastyEvents.value.length
  if (count === 0) return ''
  const h = totalHeight.value
  const period = CARD_HEIGHT + CARD_GAP
  const freq = Math.PI / period
  const firstEventY = 60 + CARD_HEIGHT / 2
  let d = ''
  for (let y = 0; y <= h; y += 2) {
    const x = -Math.cos((y - firstEventY) * freq) * WAVE_AMPLITUDE
    d += (y === 0) ? `M ${x} ${y}` : ` L ${x.toFixed(1)} ${y}`
  }
  return d
})

// Get the y-position for each event card's connection dot
const getEventY = (index: number) => {
  return 60 + index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2
}

// 蛇形 S 曲线 x 偏移：事件在极值点，两事件之间平滑过渡
const getWaveX = (y: number) => {
  const period = CARD_HEIGHT + CARD_GAP
  const freq = Math.PI / period
  const firstEventY = 60 + CARD_HEIGHT / 2
  return -Math.cos((y - firstEventY) * freq) * WAVE_AMPLITUDE
}

onMounted(async () => {
  // 尝试加载 JSON 数据
  const data = await loadDynastyData(dynastyId)
  if (data) {
    jsonData.value = data
  }
  
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const navigateToEvent = (id: number) => {
  router.push(`/event/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative overflow-x-hidden pb-24">
    <!-- Background texture -->
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <!-- Navigation -->
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
            <span class="text-[#2C2C2C] font-medium">重大历史事件</span>
          </div>
        </div>
        </div>
    </nav>

    

    <!-- Header -->
    <section class="pt-20 pb-8 px-8">
      <div class="max-w-5xl mx-auto">
        <div 
          class="mb-6"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
        >
          <h1 class="font-calligraphy text-4xl md:text-5xl text-[#2C2C2C] mb-4">
            {{ dynasty?.name }} · 历史事件
          </h1>
          <p class="text-[#4A4A3A]/60">
            共 {{ dynastyEvents.length }} 个历史事件，见证了{{ dynasty?.name }}时期的兴衰变迁
          </p>
        </div>
      </div>
    </section>

    <!-- Wave Timeline -->
    <section class="px-8 pb-20">
      <div class="max-w-6xl mx-auto relative">
        <!-- Central Wavy Line (SVG) -->
        <div class="absolute left-1/2 top-0 bottom-0" :style="{ width: (WAVE_AMPLITUDE * 2 + 40) + 'px', transform: 'translateX(-50%)' }">
          <svg
            :width="WAVE_AMPLITUDE * 2 + 40"
            :height="totalHeight"
            :viewBox="`${-(WAVE_AMPLITUDE + 20)} 0 ${WAVE_AMPLITUDE * 2 + 40} ${totalHeight}`"
            class="w-full h-full"
            style="overflow: visible;"
          >
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#C34739" stop-opacity="0.15" />
                <stop offset="30%" stop-color="#C34739" stop-opacity="0.5" />
                <stop offset="50%" stop-color="#D8B26A" stop-opacity="0.6" />
                <stop offset="70%" stop-color="#355C5A" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#355C5A" stop-opacity="0.15" />
              </linearGradient>
            </defs>
            <!-- Main wave line -->
            <path
              :d="wavePath"
              fill="none"
              stroke="url(#waveGrad)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <!-- Subtle glow line -->
            <path
              :d="wavePath"
              fill="none"
              stroke="#D8B26A"
              stroke-width="6"
              stroke-linecap="round"
              opacity="0.08"
            />
          </svg>
        </div>

        <!-- Event Cards -->
        <div
          v-for="(evt, index) in dynastyEvents"
          :key="evt.id"
          class="relative flex items-center"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
          :style="{
            height: (CARD_HEIGHT + CARD_GAP) + 'px',
            marginTop: index === 0 ? '30px' : '0',
            animationDelay: isLoaded ? `${index * 0.12}s` : '0s'
          }"
        >
          <!-- Connection dot on wave -->
          <div
            class="absolute left-1/2 z-20"
            :style="{
              top: '50%',
              transform: `translate(-50%, -50%) translateX(${getWaveX(getEventY(index))}px)`,
            }"
          >
            <!-- Dot -->
            <div class="w-4 h-4 rounded-full border-2 border-white shadow-md relative"
              style="background: radial-gradient(circle, #E05A4B 0%, #C34739 65%, #9B2E22 100%);"
            >
              <div class="absolute inset-0 rounded-full bg-[#C34739]/30 animate-ping" style="animation-duration: 3s;"></div>
            </div>
          </div>

          <!-- Left card (even index) -->
          <template v-if="index % 2 === 0">
            <div class="flex-1 pr-20 flex justify-end">
              <div
                @click="navigateToEvent(evt.id)"
                class="glass-card rounded-2xl p-6 hover-card cursor-pointer group w-full max-w-md transition-all duration-300 hover:-translate-y-1"
                style="background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(248,246,242,0.9)); border: 1px solid rgba(216,178,106,0.25);"
              >
                <!-- Connector line from card to dot -->
                <div class="absolute right-0 top-1/2 w-20 h-px bg-gradient-to-l from-[#D8B26A]/40 to-[#D8B26A]/10" style="right: -5rem;"></div>

                <div class="flex items-start justify-between mb-3">
                  <div>
                    <span class="tag-pill-vermillion text-xs px-2.5 py-0.5 rounded-full bg-[#C34739]/10 text-[#C34739] border border-[#C34739]/20">{{ evt.event_type }}</span>
                    <h3 class="font-calligraphy text-xl text-[#2C2C2C] mt-2 group-hover:text-[#C34739] transition-colors">{{ evt.name }}</h3>
                  </div>
                  <svg class="w-5 h-5 text-[#4A4A3A]/20 group-hover:text-[#C34739] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
                
                <p class="text-[#4A4A3A]/70 text-sm leading-relaxed mb-4 line-clamp-2">
                  {{ evt.summary }}
                </p>
                
                <div class="flex items-center gap-4 text-xs text-[#4A4A3A]/50">
                  <span v-if="evt.location" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                    {{ evt.location }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ formattedYear(evt.start_year) }} — {{ formattedYear(evt.end_year) }}
                  </span>
                  <span v-if="evt.related_persons?.length" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {{ evt.related_persons.length }} 位相关人物
                  </span>
                </div>
              </div>
            </div>
            <div class="flex-1 pl-20"></div>
          </template>

          <!-- Right card (odd index) -->
          <template v-else>
            <div class="flex-1 pr-20"></div>
            <div class="flex-1 pl-20 flex justify-start">
              <div
                @click="navigateToEvent(evt.id)"
                class="glass-card rounded-2xl p-6 hover-card cursor-pointer group w-full max-w-md transition-all duration-300 hover:-translate-y-1"
                style="background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(248,246,242,0.9)); border: 1px solid rgba(216,178,106,0.25);"
              >
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <span class="tag-pill-vermillion text-xs px-2.5 py-0.5 rounded-full bg-[#355C5A]/10 text-[#355C5A] border border-[#355C5A]/20">{{ evt.event_type }}</span>
                    <h3 class="font-calligraphy text-xl text-[#2C2C2C] mt-2 group-hover:text-[#355C5A] transition-colors">{{ evt.name }}</h3>
                  </div>
                  <svg class="w-5 h-5 text-[#4A4A3A]/20 group-hover:text-[#355C5A] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
                
                <p class="text-[#4A4A3A]/70 text-sm leading-relaxed mb-4 line-clamp-2">
                  {{ evt.summary }}
                </p>
                
                <div class="flex items-center gap-4 text-xs text-[#4A4A3A]/50">
                  <span v-if="evt.location" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                    {{ evt.location }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ formattedYear(evt.start_year) }} — {{ formattedYear(evt.end_year) }}
                  </span>
                  <span v-if="evt.related_persons?.length" class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {{ evt.related_persons.length }} 位相关人物
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Empty state -->
        <div v-if="dynastyEvents.length === 0" class="text-center py-24">
          <svg class="w-16 h-16 mx-auto mb-4 text-[#4A4A3A]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p class="text-[#4A4A3A]/40">暂无历史事件数据</p>
        </div>
      </div>
    </section>
  </div>
</template>