<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoaded = ref(false)

const userStats = {
  exploredPersons: 12,
  exploredEvents: 8,
  exploredDynasties: 3,
  bookmarks: 0,
  familyTrees: 0,
  connections: 0
}

const activityHistory = [
  { type: 'person', name: '李白', time: '2小时前' },
  { type: 'event', name: '安史之乱', time: '5小时前' },
  { type: 'dynasty', name: '唐朝', time: '昨天' },
  { type: 'person', name: '苏轼', time: '昨天' },
  { type: 'event', name: '王安石变法', time: '2天前' }
]

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative">
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
          <div class="text-sm text-[#4A4A3A]/60">
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/')">首页</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">我的</span>
          </div>
        </div>
        
      </div>
    </nav>

    

    <section class="pt-20 pb-16 px-8">
      <div class="max-w-6xl mx-auto">
        <div 
          class="flex flex-col md:flex-row items-center md:items-start gap-8"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
        >
          <div class="w-32 h-32 rounded-2xl bg-dai-blue/10 flex items-center justify-center">
            <svg class="w-16 h-16 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <div class="font-serif text-3xl text-ink-black mb-2">探索者</div>
            <p class="text-ink-black/50 mb-6">在历史中发现自我</p>
            <div class="flex gap-6">
              <button class="px-6 py-2 rounded-full bg-dai-blue text-white text-sm hover:bg-dai-blue/80 transition-colors">编辑资料</button>
              <button class="px-6 py-2 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-ink-black/5 transition-colors">设置</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="px-8 pb-16">
      <div class="max-w-6xl mx-auto">
        <div 
          class="grid grid-cols-2 md:grid-cols-6 gap-4"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
        >
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-dai-blue mb-1">{{ userStats.exploredPersons }}</div>
            <span class="text-xs text-ink-black/50">探索人物</span>
          </div>
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-vermillion mb-1">{{ userStats.exploredEvents }}</div>
            <span class="text-xs text-ink-black/50">探索事件</span>
          </div>
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-light-gold mb-1">{{ userStats.exploredDynasties }}</div>
            <span class="text-xs text-ink-black/50">探索朝代</span>
          </div>
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-dai-blue mb-1">{{ userStats.bookmarks }}</div>
            <span class="text-xs text-ink-black/50">收藏</span>
          </div>
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-vermillion mb-1">{{ userStats.familyTrees }}</div>
            <span class="text-xs text-ink-black/50">家谱</span>
          </div>
          <div class="glass-card rounded-xl p-4 text-center hover-card">
            <div class="font-serif text-2xl text-light-gold mb-1">{{ userStats.connections }}</div>
            <span class="text-xs text-ink-black/50">关联</span>
          </div>
        </div>
      </div>
    </section>

    <section class="px-8 pb-24">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div 
            class="lg:col-span-2 glass-card rounded-2xl p-6"
            :class="isLoaded ? 'animate-slide-left' : 'opacity-0'"
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-serif text-xl text-ink-black">浏览历史</h3>
              <button class="text-sm text-dai-blue hover:text-dai-blue/80 transition-colors">清空历史</button>
            </div>
            <div class="space-y-4">
              <div 
                v-for="(item, index) in activityHistory" 
                :key="index"
                class="flex items-center gap-4 bg-white/50 rounded-xl p-4 hover:bg-white/80 transition-colors cursor-pointer"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="item.type === 'person' ? 'bg-dai-blue/10' : item.type === 'event' ? 'bg-vermillion/10' : 'bg-light-gold/10'"
                >
                  <svg 
                    class="w-5 h-5"
                    :class="item.type === 'person' ? 'text-dai-blue' : item.type === 'event' ? 'text-vermillion' : 'text-light-gold'" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path v-if="item.type === 'person'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    <path v-else-if="item.type === 'event'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="font-medium text-ink-black">{{ item.name }}</span>
                  <span class="tag-pill text-xs ml-2">
                    {{ item.type === 'person' ? '人物' : item.type === 'event' ? '事件' : '朝代' }}
                  </span>
                </div>
                <span class="text-xs text-ink-black/40">{{ item.time }}</span>
              </div>
            </div>
          </div>

          <div 
            class="glass-card rounded-2xl p-6"
            :class="isLoaded ? 'animate-slide-right' : 'opacity-0'"
          >
            <h3 class="font-serif text-xl text-ink-black mb-6">快捷设置</h3>
            <div class="space-y-3">
              <button class="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                <svg class="w-5 h-5 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
                <span class="text-sm text-ink-black">通知设置</span>
              </button>
              <button class="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                <svg class="w-5 h-5 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span class="text-sm text-ink-black">隐私设置</span>
              </button>
              <button class="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                <svg class="w-5 h-5 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                </svg>
                <span class="text-sm text-ink-black">导出数据</span>
              </button>
              <button class="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                <svg class="w-5 h-5 text-vermillion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span class="text-sm text-vermillion">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <nav class="fixed bottom-0 left-0 right-0 glass-card-dark py-4 px-8">
      <div class="max-w-xl mx-auto flex items-center justify-around">
        <div @click="router.push('/')" class="flex flex-col items-center gap-1 cursor-pointer text-white/60 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span class="text-xs">首页</span>
        </div>
        <div @click="router.push('/timeline')" class="flex flex-col items-center gap-1 cursor-pointer text-white/60 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span class="text-xs">中国历史</span>
        </div>
        <div @click="router.push('/family')" class="flex flex-col items-center gap-1 cursor-pointer text-white/60 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span class="text-xs">家族</span>
        </div>
        <div class="flex flex-col items-center gap-1 text-dai-blue">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span class="text-xs">我的</span>
        </div>
      </div>
    </nav>
  </div>
</template>