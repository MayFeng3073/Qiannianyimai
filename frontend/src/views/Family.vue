<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative pb-24">
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
            <span class="text-[#2C2C2C] font-medium">我的家族</span>
          </div>
        </div>
        
      </div>
    </nav>

    

    <section class="pt-20 pb-24 px-8">
      <div class="max-w-6xl mx-auto">
        <div 
          class="text-center mb-16"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
        >
          <div class="font-serif text-4xl md:text-5xl text-ink-black mb-4">我的家族</div>
          <p class="text-ink-black/50">记录家族记忆，连接个人与历史</p>
        </div>

        <div 
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
        >
          <div 
            class="glass-card rounded-2xl p-8 text-center hover-card cursor-pointer group"
            :style="{ animationDelay: '0.1s' }"
          >
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-vermillion/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg class="w-10 h-10 text-vermillion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="font-serif text-xl text-ink-black mb-2">创建家谱</h3>
            <p class="text-sm text-ink-black/50">开始记录您的家族故事</p>
          </div>

          <div 
            class="glass-card rounded-2xl p-8 text-center hover-card cursor-pointer group"
            :style="{ animationDelay: '0.2s' }"
          >
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-dai-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg class="w-10 h-10 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="font-serif text-xl text-ink-black mb-2">导入家族树</h3>
            <p class="text-sm text-ink-black/50">从文件导入已有的家族数据</p>
          </div>

          <div 
            class="glass-card rounded-2xl p-8 text-center hover-card cursor-pointer group"
            :style="{ animationDelay: '0.3s' }"
          >
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-light-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg class="w-10 h-10 text-light-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="font-serif text-xl text-ink-black mb-2">历史关联</h3>
            <p class="text-sm text-ink-black/50">发现您的家族与历史人物的联系</p>
          </div>
        </div>

        <div 
          class="mt-16 glass-card rounded-2xl p-8"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-3' : 'opacity-0'"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-serif text-xl text-ink-black">我的家谱列表</h3>
            <button class="text-sm text-dai-blue hover:text-dai-blue/80 transition-colors">查看全部</button>
          </div>
          <div class="border-2 border-dashed border-ink-black/10 rounded-xl p-12 text-center">
            <svg class="w-12 h-12 mx-auto mb-4 text-ink-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-ink-black/50">暂无家谱数据，点击上方卡片开始创建</p>
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
        <div class="flex flex-col items-center gap-1 text-dai-blue">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span class="text-xs">家族</span>
        </div>
        <div @click="router.push('/profile')" class="flex flex-col items-center gap-1 cursor-pointer text-white/60 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span class="text-xs">我的</span>
        </div>
      </div>
    </nav>
  </div>
</template>