<template>
  <div class="screenfull-svg" @click="toggle">
    <el-icon :size="20">
      <component :is="isFullscreen ? 'Close' : 'FullScreen'" />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const isFullscreen = ref(false)

function toggle() {
  if (!document.fullscreenEnabled) {
    ElMessage.warning(t('layout.fullscreenUnsupported'))
    return
  }
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

function change() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', change)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', change)
})
</script>

<style lang="scss" scoped>
.screenfull-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s;
}

.screenfull-svg:hover {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}
</style>
