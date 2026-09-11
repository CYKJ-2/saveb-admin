<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AnalysisShare from './AnalysisShare.vue'

defineProps<{ value: { amount: string; rows: number; share?: string }; showShare?: boolean }>()
const { t, locale } = useI18n()
const decimal = (value: string) => Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div class="cross-value">
    <b>{{ decimal(value.amount) }}</b>
    <AnalysisShare v-if="showShare" :value="value.share ?? '0'" />
    <small>{{ t('analysis.recordCount', { count: value.rows }) }}</small>
  </div>
</template>

<style scoped>
.cross-value { font-variant-numeric: tabular-nums; }
.cross-value small { display: block; margin-top: 6px; color: var(--workbench-muted, var(--el-text-color-secondary)); }
</style>
