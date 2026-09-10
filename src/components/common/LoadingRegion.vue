<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ loading: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div
    v-loading="loading"
    class="loading-region"
    :aria-busy="loading"
    :element-loading-text="t('pages.loading2')"
  >
    <div :inert="loading || undefined"><slot /></div>
  </div>
</template>

<style scoped>
.loading-region { position: relative; min-height: 100px; }
.loading-region :deep(.el-loading-mask) {
  background: color-mix(in srgb, var(--workbench-panel, var(--el-bg-color)) 78%, transparent);
  border-radius: 6px;
}
</style>
