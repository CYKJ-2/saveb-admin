<template>
  <div class="scroll-container" ref="scrollContainer" @wheel.prevent="handleScroll">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const scrollContainer = ref<HTMLElement>()

function handleScroll(e: WheelEvent) {
  const eventDelta = e.deltaY || -e.wheelDelta
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += eventDelta / 4
  }
}

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = 0
  }
})
</script>

<style lang="scss" scoped>
.scroll-container {
  overflow-x: auto;
  white-space: nowrap;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.3) transparent;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.3);
    border-radius: 2px;
  }
}
</style>
