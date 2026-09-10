<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { workbench } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench } from '../shared/useWorkbench'

const fields = ['time', 'field', 'action', 'accountName', 'email', 'previous', 'current', 'delta', 'actor'] as const
type PaypalOperationLog = { id: string } & Record<(typeof fields)[number], string>

const emit = defineEmits<{ close: [] }>()
const { t, locale } = useI18n()
const { can, loading, error, run } = useWorkbench('paypal')
const { loading: exporting, error: exportError, run: runExport } = useWorkbench('paypal')
const rows = ref<PaypalOperationLog[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)
const columns = computed(() => fields.map(key => ({ key, label: t(`paypal.logs.${key}`) })))

function load() {
  if (!can('logs')) return
  run(() => workbench.get('/paypal/logs', { page: page.value, per_page: size.value, locale: locale.value }), result => {
    rows.value = result.list
    total.value = result.total
    page.value = result.page
  })
}

function exportLogs() {
  if (!can('logs') || exporting.value) return
  runExport(() => workbench.download('/paypal/logs/export', 'paypal-change-log.csv'), () => {})
}

watch(locale, load)
onMounted(load)
</script>

<template>
  <div class="editor" role="dialog" aria-modal="true" :aria-label="t('paypal.logs.title')">
    <section class="editor-content paypal-log-panel">
      <header>
        <h2>{{ t('paypal.logs.title') }}</h2>
        <button type="button" @click="emit('close')">{{ t('pages.close') }}</button>
      </header>
      <div class="toolbar">
        <button v-if="can('logs')" type="button" :disabled="exporting || loading || !total" @click="exportLogs">{{ t('pages.exportAllLogs') }}</button>
        <span class="muted">{{ t('paypal.logs.timezoneHint') }}</span>
      </div>
      <p v-if="error || exportError" class="error" role="alert">{{ localizePageMessage(error || exportError) }}</p>
      <LoadingRegion :loading="loading">
        <div class="table-wrap">
          <table class="paypal-log-table">
            <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th></tr></thead>
            <tbody>
              <tr v-for="log in rows" :key="log.id">
                <td v-for="column in columns" :key="column.key" :class="`log-${column.key}`">{{ log[column.key] }}</td>
              </tr>
              <tr v-if="!rows.length && !loading"><td :colspan="columns.length" class="empty">{{ t('paypal.changeLogEmpty') }}</td></tr>
            </tbody>
          </table>
        </div>
        <ApiPagination v-model:page="page" v-model:size="size" :total="total" :loading="loading" @change="load" />
      </LoadingRegion>
    </section>
  </div>
</template>

<style scoped>
.editor-content.paypal-log-panel { width: min(1500px, 100%); }
.paypal-log-table { min-width: 1300px; }
.paypal-log-table .log-time { min-width: 170px; white-space: nowrap; }
.paypal-log-table .log-accountName { min-width: 200px; }
.paypal-log-table .log-email { min-width: 210px; }
.paypal-log-table .log-actor { min-width: 140px; }
.paypal-log-table .log-previous, .paypal-log-table .log-current, .paypal-log-table .log-delta { font-variant-numeric: tabular-nums; }
</style>
