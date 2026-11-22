<script setup lang="ts">
defineProps<{
  title?: string
  show: boolean
  width?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="show" class="fixed inset-0 z-[80]">
        <div class="absolute inset-0 bg-ink-black/25 backdrop-blur-sm" @click="emit('close')"></div>
        <aside
          class="absolute right-0 top-0 h-full bg-[#F8F6F2] shadow-2xl flex flex-col"
          :style="{ width: width || '500px' }"
        >
          <header class="flex items-center justify-between px-6 h-16 shrink-0 border-b border-ink-black/10">
            <div class="flex items-center gap-3">
              <button
                class="flex items-center gap-1.5 text-sm text-dai-blue hover:text-vermillion transition-colors"
                @click="emit('close')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                返回
              </button>
              <span v-if="title" class="font-serif text-lg text-ink-black">{{ title }}</span>
            </div>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-ink-black/40 hover:text-ink-black hover:bg-ink-black/5 transition-colors"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </header>
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
