<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'

const open = defineModel<boolean>({ required: true })
const props = defineProps<{ canInitialize: boolean; currentMonth: string }>()
const emit = defineEmits<{ imported: [] }>()
const { t } = useI18n()
const source = ref('procurement')
const mode = ref('current_month')
const file = ref<File>()
const loading = ref(false)
const error = ref('')
const result = ref<any>()
watch(open, value => { if (value) { error.value = ''; result.value = undefined; mode.value = 'current_month' } })
function choose(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
  result.value = undefined
  error.value = ''
}
async function submit() {
  if (!file.value || loading.value) return
  if (file.value.size > 256 * 1024 * 1024) { error.value = t('analysis.fileLimit'); return }
  loading.value = true
  error.value = ''
  result.value = undefined
  const form = new FormData()
  form.append('file', file.value)
  form.append('source_type', source.value)
  form.append('mode', mode.value)
  try {
    result.value = await workbench.post('/analysis/imports', form, 360000)
    emit('imported')
  } catch (e: any) { error.value = e.message || t('analysis.failed') }
  finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="open" :title="t('analysis.importTitle')" width="min(640px, 94vw)" :close-on-click-modal="!loading" :close-on-press-escape="!loading" :show-close="!loading">
    <div class="legacy-workbench analysis-import">
      <p class="muted">{{ t('analysis.importHelp') }}</p>
      <form class="import-form" @submit.prevent="submit">
        <label>{{ t('analysis.source') }}<select v-model="source" :disabled="loading"><option value="procurement">{{ t('analysis.procurement') }}</option><option value="suppliers">{{ t('analysis.suppliers') }}</option></select></label>
        <label v-if="source === 'procurement'">{{ t('analysis.importMode') }}
          <select v-model="mode" :disabled="loading">
            <option value="current_month">{{ t('analysis.currentMonthOnly', { month: currentMonth }) }}</option>
            <option v-if="canInitialize" value="initialize">{{ t('analysis.initialize') }}</option>
          </select>
        </label>
        <p class="import-note">{{ source === 'suppliers' ? t('analysis.supplierUpdateHelp') : mode === 'initialize' ? t('analysis.initializeHelp') : t('analysis.monthUpdateHelp', { month: currentMonth }) }}</p>
        <label>{{ t('analysis.workbook') }}<input type="file" accept=".xlsx" :disabled="loading" @change="choose" /></label>
        <p class="muted">{{ t('analysis.fileLimit') }} · {{ t('analysis.fixedBasis') }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="primary" :disabled="!file || loading">{{ loading ? t('analysis.importing') : t('analysis.import') }}</button>
        <p v-if="loading" role="status" class="muted">{{ t('analysis.importWait') }}</p>
      </form>
      <div v-if="result" class="import-result" role="status">
        <b>{{ result.reused ? t('analysis.reused') : t('analysis.imported') }}</b>
        <p>{{ t('analysis.importCount', { count: result.summary.rows }) }}</p>
        <ul><li v-for="sheet in result.summary.sheets" :key="sheet.name">{{ sheet.name }} · {{ sheet.rows }}</li></ul>
      </div>
    </div>
  </el-dialog>
</template>
<style scoped>
.analysis-import { padding: 0; min-height: 0; background: transparent; }
.import-form { display: grid; gap: 14px; }
.import-form label { display: grid; gap: 6px; }
.import-form select, .import-form input { width: 100%; min-height: 36px; }
.import-note, .import-result { padding: 14px; border: 1px solid var(--el-border-color); border-radius: 8px; line-height: 1.7; }
.import-result { margin-top: 20px; }
</style>
