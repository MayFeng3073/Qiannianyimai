<script setup lang="ts">
import { watch, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isTransitioning = ref(false)

watch(
  () => route.path,
  () => {
    isTransitioning.value = true
    setTimeout(() => {
      isTransitioning.value = false
    }, 500)
  }
)
</script>

<template>
  <div class="min-h-screen bg-rice-white">
    <Transition name="page">
      <RouterView :key="route.path" />
    </Transition>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>