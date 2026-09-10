<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { workbench } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench } from '../shared/useWorkbench'

interface InvoiceOperationLog {
  id: number;
  operationTime: string;
  operator: string;
  actionLabel: string;
  orderNumber: string;
  customer: string;
  changedFields: string;
  details: string;
  recordId: string;
}

const emit = defineEmits<{ close: [] }>()
const { t, locale } = useI18n()
const { can, loading, error, run } = useWorkbench('invoice')
const { loading: exporting, error: exportError, run: runExport } = useWorkbench('invoice')
const rows = ref<InvoiceOperationLog[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)
const fields = ['operationTime', 'operator', 'actionLabel', 'orderNumber', 'customer', 'changedFields', 'details', 'recordId'] as const
const columns = computed(() => fields.map(key => ({ key, label: t(`pages.invoiceLogs.${key}`) })))

function load() {
  if (!can('logs')) return
  run(() => workbench.get('/invoices/logs', { page: page.value, per_page: size.value, locale: locale.value }), result => {
    rows.value = result.data
    total.value = result.total
    page.value = result.current_page
  })
}

function exportLogs() {
  if (!can('export') || exporting.value) return
  runExport(() => workbench.download('/invoices/logs/export', t('pages.invoiceOperationLogsCsv')), () => {})
}

watch(locale, load)
onMounted(load)
</script>

<template>
  <div class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.invoiceOperationLogs')">
    <section class="editor-content invoice-log-panel">
      <header>
        <h2>{{ t('pages.recentOperationLogs') }}</h2>
        <button type="button" @click="emit('close')">{{ t('pages.close') }}</button>
      </header>
      <div class="toolbar">
        <button v-if="can('export')" type="button" :disabled="exporting || loading" @click="exportLogs">{{ t('pages.exportAllLogs') }}</button>
        <span class="muted">{{ t('pages.invoiceLogs.timezoneHint') }}</span>
      </div>
      <p v-if="error || exportError" class="error" role="alert">{{ localizePageMessage(error || exportError) }}</p>
      <LoadingRegion :loading="loading">
        <div class="table-wrap">
          <table class="invoice-log-table">
            <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th></tr></thead>
            <tbody>
              <tr v-for="log in rows" :key="log.id">
                <td v-for="column in columns" :key="column.key" :class="`log-${column.key}`">{{ log[column.key] }}</td>
              </tr>
              <tr v-if="!rows.length && !loading"><td :colspan="columns.length" class="empty">{{ t('pages.noData') }}</td></tr>
            </tbody>
          </table>
        </div>
        <ApiPagination v-model:page="page" v-model:size="size" :total="total" :loading="loading" @change="load" />
      </LoadingRegion>
    </section>
  </div>
</template>

<style scoped>
.editor-content.invoice-log-panel { width: min(1400px, 100%); }
.invoice-log-table { min-width: 1200px; }
.invoice-log-table .log-operationTime { min-width: 170px; white-space: nowrap; }
.invoice-log-table .log-operator { min-width: 160px; }
.invoice-log-table .log-actionLabel { min-width: 140px; }
.invoice-log-table .log-changedFields, .invoice-log-table .log-details { min-width: 200px; white-space: pre-wrap; }
</style>
