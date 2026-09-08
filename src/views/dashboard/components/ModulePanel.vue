<script setup lang="ts">
import { localizePageMessage } from '@/lang/page-message'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
defineProps<{ title: string; subtitle?: string; loading?: boolean; error?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <section class="module-panel" :aria-label="title" :aria-busy="loading">
    <header><div><h2>{{ title }}</h2><p v-if="subtitle">{{ subtitle }}</p></div><slot name="actions" /></header>
    <el-skeleton v-if="loading" :rows="4" animated />
    <div v-else-if="error" class="module-error" role="alert"><p>{{ localizePageMessage(error) }}</p><el-button size="small" @click="$emit('retry')">{{ t('pages.retryModule') }}</el-button></div>
    <slot v-else />
  </section>
</template>
<style scoped>
.module-panel{min-width:0;background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:var(--radius);padding:20px;color:hsl(var(--card-foreground));height:100%}header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}h2{font-size:16px;font-weight:600;margin:0}p{font-size:12px;color:hsl(var(--muted-foreground));margin:6px 0 0}.module-error{min-height:100px}.module-error p{color:var(--el-color-danger);margin-bottom:12px}
</style>
