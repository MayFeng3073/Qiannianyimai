<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  /** 没有站内来源时（直接打开链接）回退到的页面 */
  fallback: string
  label?: string
}>(), {
  label: '返回'
})

const router = useRouter()

const goBack = () => {
  // 有站内来源（如从家族页跳转过来）时返回上一页；直接打开链接时回到兜底页面
  if (window.history.state?.back) router.back()
  else router.replace(props.fallback)
}
</script>

<template>
  <div class="px-8 pt-4">
    <div>
      <button
        type="button"
        @click="goBack"
        class="inline-flex items-center gap-2 text-sm text-[#4A4A3A]/70 hover:text-[#355C5A] transition-colors group"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span class="font-medium">{{ label }}</span>
      </button>
    </div>
  </div>
</template>
