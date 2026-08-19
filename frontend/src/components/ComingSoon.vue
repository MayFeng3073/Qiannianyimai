<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  title?: string
  description?: string
}>()

const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-rice-white relative flex items-center justify-center px-8">
    <div class="absolute inset-0 paper-texture pointer-events-none"></div>
    <div class="absolute inset-0 ink-wash-bg pointer-events-none"></div>
    
    <div 
      class="text-center max-w-xl"
      :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
    >
      <div class="relative w-32 h-32 mx-auto mb-8">
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill="none" 
            stroke="#355C5A" 
            stroke-width="1" 
            stroke-opacity="0.2"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="30" 
            fill="none" 
            stroke="#D8B26A" 
            stroke-width="2" 
            stroke-opacity="0.3"
            class="animate-rotate-slow"
          />
          <path 
            d="M50 25 L50 35 M50 65 L50 75 M25 50 L35 50 M65 50 L75 50" 
            stroke="#355C5A" 
            stroke-width="2"
            stroke-opacity="0.4"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="8" 
            fill="#C34739"
            class="animate-pulse"
          />
        </svg>
      </div>
      
      <div class="font-serif text-4xl text-ink-black mb-4">
        数据正在整理中
      </div>
      
      <div class="text-xl text-light-gold font-serif mb-6">
        Coming Soon
      </div>
      
      <p class="text-ink-black/50 text-sm leading-relaxed">
        {{ description || '我们正在努力整理更多历史数据，敬请期待。' }}
      </p>
      
      <div class="mt-12 flex justify-center gap-8">
        <div class="flex flex-col items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-dai-blue/30"></div>
          <span class="text-xs text-ink-black/40">历史人物</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-vermillion/30"></div>
          <span class="text-xs text-ink-black/40">历史事件</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-light-gold/30"></div>
          <span class="text-xs text-ink-black/40">知识图谱</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-dai-blue/30"></div>
          <span class="text-xs text-ink-black/40">家族记忆</span>
        </div>
      </div>
    </div>
  </div>
</template>