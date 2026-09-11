<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'

defineProps<{ id: string; title: string; summary?: string }>()
const { t } = useI18n()
const expanded = ref(false)
const visited = ref(false)
function toggle() {
  expanded.value = !expanded.value
  if (expanded.value) visited.value = true
}
</script>

<template>
  <section class="panel analysis-section" :class="{ expanded }">
    <h2 class="section-title">
      <button :id="id + '-toggle'" class="section-toggle" type="button" :aria-expanded="expanded" :aria-controls="id + '-content'" @click="toggle">
        <el-icon class="section-arrow" aria-hidden="true"><ArrowRight /></el-icon>
        <span class="section-name">{{ title }}</span>
        <span v-if="summary" class="section-summary">{{ summary }}</span>
        <span class="section-action">{{ t(expanded ? 'analysis.collapse' : 'analysis.expand') }}</span>
      </button>
    </h2>
    <div :id="id + '-content'" v-show="expanded" class="section-content" role="region" :aria-labelledby="id + '-toggle'">
      <slot v-if="visited" :active="expanded" />
    </div>
  </section>
</template>

<style scoped>
section.analysis-section.panel { padding: 0; overflow: hidden; }
.analysis-section .section-title { margin: 0; }
.analysis-section .section-toggle { width: 100%; display: flex; align-items: center; gap: 12px; padding: 20px 22px; border: 0; border-radius: 0; background: transparent; color: var(--workbench-text, var(--el-text-color-primary)); text-align: left; white-space: normal; cursor: pointer; }
.analysis-section .section-toggle:hover { background: var(--workbench-hover, var(--el-fill-color-light)); }
.analysis-section .section-toggle:focus-visible { outline-offset: -3px; }
.section-name { flex: 1; font-size: 17px; font-weight: 600; }
.section-summary { font-size: 13px; color: var(--workbench-muted, var(--el-text-color-secondary)); font-weight: 400; font-variant-numeric: tabular-nums; }
.section-action { flex-shrink: 0; font-size: 13px; color: var(--workbench-blue, var(--el-color-primary)); font-weight: 400; }
.section-arrow { flex-shrink: 0; transition: transform .16s ease; }
.expanded .section-arrow { transform: rotate(90deg); }
.section-content { padding: 0 22px 22px; }
.expanded .section-title { border-bottom: 1px solid var(--workbench-line, var(--el-border-color)); margin-bottom: 16px; }
@media (max-width: 700px) { .section-summary { display: none; } .analysis-section .section-toggle { padding: 18px 14px; } .section-content { padding: 0 14px 14px; } }
@media (prefers-reduced-motion: reduce) { .section-arrow { transition: none; } }
</style>
