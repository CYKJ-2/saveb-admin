<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ imported: [] }>()
const { t } = useI18n()
const source = ref('suppliers')
const currency = ref('')
const basis = ref('unknown')
const file = ref<File>()
const loading = ref(false)
const error = ref('')
const result = ref<any>()

function choose(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
  result.value = undefined
  error.value = ''
}
async function submit() {
  if (!file.value || loading.value) return
  if (file.value.size > 64 * 1024 * 1024) { error.value = t('analysis.fileLimit'); return }
  loading.value = true
  error.value = ''
  const form = new FormData()
  form.append('file', file.value)
  form.append('source_type', source.value)
  form.append('price_basis', source.value === 'suppliers' ? 'unknown' : basis.value)
  if (source.value === 'procurement' && currency.value) form.append('currency', currency.value)
  try {
    result.value = await workbench.post('/analysis/imports', form, 360000)
    emit('imported')
  } catch (e: any) { error.value = e.message || t('analysis.failed') }
  finally { loading.value = false }
}
</script>

<template>
  <el-dialog v-model="open" :title="t('analysis.importTitle')" width="640px" :close-on-click-modal="!loading" :close-on-press-escape="!loading" :show-close="!loading">
    <div class="legacy-workbench analysis-import">
      <p class="muted">{{ t('analysis.importHelp') }}</p>
      <form class="import-form" @submit.prevent="submit">
        <label>{{ t('analysis.source') }}<select v-model="source" :disabled="loading"><option value="suppliers">{{ t('analysis.suppliers') }}</option><option value="procurement">{{ t('analysis.procurement') }}</option></select></label>
        <label>{{ t('analysis.workbook') }}<input type="file" accept=".xlsx" :disabled="loading" @change="choose" /></label>
        <template v-if="source === 'procurement'">
          <label>{{ t('analysis.currency') }}<select v-model="currency" :disabled="loading"><option value="">{{ t('analysis.unconfirmed') }}</option><option v-for="code in ['CNY', 'USD', 'CAD', 'EUR', 'GBP', 'AUD']" :key="code" :value="code">{{ code }}</option></select></label>
          <label>{{ t('analysis.priceBasis') }}<select v-model="basis" :disabled="loading"><option value="unknown">{{ t('analysis.unconfirmed') }}</option><option value="row_total">{{ t('analysis.rowTotal') }}</option><option value="unit">{{ t('analysis.unit') }}</option></select></label>
          <p class="muted">{{ t('analysis.basisHelp') }}</p>
        </template>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="primary" :disabled="!file || loading">{{ loading ? t('analysis.importing') : t('analysis.import') }}</button>
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
.import-result { margin-top: 20px; padding: 16px; border: 1px solid var(--el-border-color); border-radius: 8px; }
</style>
