<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{ total: number; page: number; size?: number; loading?: boolean }>(), { size: 20, loading: false })
const emit = defineEmits<{
  'update:page': [value: number]
  'update:size': [value: number]
  change: [value: { page: number; per_page: number }]
}>()
const { locale } = useI18n()
const zh = computed(() => locale.value.startsWith('zh'))
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const jump = ref(props.page)
watch(() => props.page, value => { jump.value = value })
function change(page: number, size = props.size) {
  if (props.loading || !Number.isFinite(page)) return
  const next = Math.max(1, Math.min(Math.floor(page), Math.max(1, Math.ceil(props.total / size))))
  jump.value = next
  if (next === props.page && size === props.size) return
  emit('update:size', size)
  emit('update:page', next)
  emit('change', { page: next, per_page: size })
}
</script>

<template>
  <nav class="api-pagination" :aria-label="zh ? '列表分页' : 'Table pagination'">
    <label>{{ zh ? '每页条数' : 'Per page' }}
      <select :value="size" :disabled="loading" @change="change(1, Number(($event.target as HTMLSelectElement).value))">
        <option v-for="count in [20, 50, 100]" :key="count" :value="count">{{ count }}</option>
      </select>
    </label>
    <button type="button" :disabled="loading || page <= 1" @click="change(page - 1)">{{ zh ? '上一页' : 'Previous' }}</button>
    <span class="current-page" aria-current="page">{{ page }}</span>
    <span>{{ zh ? `第 ${page} / ${pages} 页，共 ${total} 条` : `Page ${page} / ${pages}, ${total} records` }}</span>
    <button type="button" :disabled="loading || page >= pages" @click="change(page + 1)">{{ zh ? '下一页' : 'Next' }}</button>
    <label>{{ zh ? '跳转页码' : 'Go to page' }}
      <input v-model.number="jump" type="number" min="1" :max="pages" :disabled="loading" @keydown.enter.prevent="change(Number(jump))" />
    </label>
    <button type="button" :disabled="loading" @click="change(Number(jump))">{{ zh ? '跳转' : 'Go' }}</button>
  </nav>
</template>

<style scoped>
.api-pagination { display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:8px; margin-top:16px; font-size:12px; color:var(--workbench-muted, hsl(var(--muted-foreground))); }
.api-pagination label { display:flex; align-items:center; gap:6px; font:inherit; color:inherit; }
.api-pagination button,.api-pagination select,.api-pagination input,.api-pagination .current-page { box-sizing:border-box; height:30px; border:1px solid var(--workbench-control-border,hsl(var(--border))); border-radius:6px; padding:4px 8px; font:inherit; color:var(--workbench-button-text,hsl(var(--foreground))); background:var(--workbench-button-background,hsl(var(--background))); }
.api-pagination input { width:64px; }.api-pagination select { min-width:58px; }
/* 原生下拉弹出层需要不透明背景，避免深色主题的浅色文字叠在系统浅色菜单上。 */
.api-pagination select option {
  color: var(--workbench-text, hsl(var(--foreground)));
  background-color: var(--workbench-input, hsl(var(--background)));
}
.api-pagination select option:checked {
  color: hsl(var(--primary-foreground));
  background-color: hsl(var(--primary));
}
.api-pagination button { cursor:pointer; }.api-pagination button:hover:not(:disabled) { background:var(--workbench-button-hover,hsl(var(--accent))); }
.api-pagination :disabled { opacity:.45; cursor:not-allowed; }.api-pagination .current-page { display:flex; align-items:center; border-color:var(--workbench-blue,#3b82f6); }
.api-pagination :focus-visible { outline:2px solid #3b82f6; outline-offset:2px; }
@media(max-width:640px) { .api-pagination { justify-content:flex-start; } }
</style>
