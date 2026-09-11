<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ value: string | number }>()
const { t, locale } = useI18n()
const percent = computed(() => Number.isFinite(Number(props.value)) ? Number(props.value) : 0)
const label = computed(() => percent.value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%')
const width = computed(() => Math.min(100, Math.abs(percent.value)) + '%')
</script>

<template>
  <div class="analysis-share" :class="{ negative: percent < 0 }" role="img" :aria-label="t('analysis.share') + ' ' + label" :title="t('analysis.shareGraphicHelp')">
    <span class="share-label" aria-hidden="true">{{ label }}</span>
    <div class="share-track" aria-hidden="true"><span class="share-fill" :style="{ width }" /></div>
  </div>
</template>

<style scoped>
.analysis-share { min-width: 96px; max-width: 170px; margin-top: 6px; font-variant-numeric: tabular-nums; }
.share-label { display: block; font-size: 12px; line-height: 1.5; color: var(--workbench-muted, var(--el-text-color-secondary)); }
.share-track { height: 6px; margin-top: 5px; background: color-mix(in srgb, var(--workbench-blue, #409eff) 12%, var(--workbench-panel, var(--el-bg-color))); border-radius: 4px; overflow: hidden; }
.share-fill { display: block; height: 100%; border-radius: inherit; background: var(--workbench-blue, #409eff); }
.negative .share-fill { background: var(--workbench-red, var(--el-color-danger)); }
.negative .share-label { color: var(--workbench-red, var(--el-color-danger)); }
</style>
