<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'
import { useWorkbench } from '../shared/useWorkbench'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import AnalysisChart from './AnalysisChart.vue'
import ImportDialog from './ImportDialog.vue'
import '../shared/legacy.css'

type Row = Record<string, any>
const { t, locale } = useI18n()
const { can } = useWorkbench('analysis')
const defaults = () => ({ startDate: '', endDate: '', category_id: '', brand_id: '', country: '', customer_type: '', currency: '', keyword: '', record_type: '', quality: '', include_cancelled: false, grain: 'month' })
const draft = reactive(defaults())
const applied = ref<Row>({ grain: 'month' })
const options = ref<Row>({ categories: [], brands: [], currencies: [], countries: [], imports: [], columns: [] })
const report = ref<Row>()
const rows = ref<Row[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loading = ref(false)
const pageLoading = ref(false)
const error = ref('')
const importOpen = ref(false)
const evidenceOpen = ref(false)
const evidence = ref<Row>()
const evidenceLoading = ref(false)
const historyOpen = ref(false)
const history = ref<Row>({ list: [], total: 0, page: 1, per_page: 20 })
const historyLoading = ref(false)
const measure = ref<'amount' | 'rows'>('amount')
let revision = 0
let pageRevision = 0
let historyRevision = 0
let disposed = false
const dimensions = ['brand', 'category', 'price_band', 'country', 'customer_type', 'supplier']
const localeParams = () => ({ ...applied.value, locale: locale.value })
const fmt = (value: unknown, digits = 2) => value === null || value === undefined ? '—' : Number(value).toLocaleString(locale.value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
const label = (value: string) => {
  if (['unknown', 'first', 'returning', 'negative'].includes(value)) return t(`analysis.${value}`)
  return options.value.categories.find((category: Row) => category.code === value)?.[locale.value === 'en-US' ? 'name_en' : 'name_zh'] || value
}
const currencyName = (value: string | null) => value || t('analysis.unconfirmed')

async function loadOptions() {
  const data = await workbench.get('/analysis/options', { locale: locale.value })
  if (!disposed) options.value = data
}
async function query() {
  const current = ++revision
  ++pageRevision
  pageLoading.value = false
  loading.value = true
  error.value = ''
  applied.value = Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== '').map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value]))
  page.value = 1
  try {
    const [statistics, listing] = await Promise.all([
      workbench.get('/analysis/report', applied.value),
      workbench.get('/analysis/rows', { ...localeParams(), page: 1, per_page: size.value }),
    ])
    if (current !== revision || disposed) return
    report.value = statistics
    rows.value = listing.list
    total.value = listing.total
  } catch (e: any) { if (current === revision) error.value = e.message || t('analysis.failed') }
  finally { if (current === revision) loading.value = false }
}
async function changePage(pagination: { page: number; per_page: number }) {
  const current = ++pageRevision
  const snapshot = revision
  pageLoading.value = true
  error.value = ''
  try {
    const data = await workbench.get('/analysis/rows', { ...localeParams(), ...pagination })
    if (current !== pageRevision || snapshot !== revision || disposed) return
    rows.value = data.list
    total.value = data.total
    page.value = data.page
    size.value = data.per_page
  } catch (e: any) { if (current === pageRevision) error.value = e.message || t('analysis.failed') }
  finally { if (current === pageRevision) pageLoading.value = false }
}
async function refresh() {
  try { await loadOptions(); await query() }
  catch (e: any) { error.value = e.message || t('analysis.failed') }
}
function reset() { Object.assign(draft, defaults()); void query() }
async function showEvidence(id: number) {
  evidenceOpen.value = true
  evidenceLoading.value = true
  evidence.value = undefined
  try { evidence.value = await workbench.get(`/analysis/rows/${id}/evidence`) }
  catch (e: any) { error.value = e.message || t('analysis.failed'); evidenceOpen.value = false }
  finally { evidenceLoading.value = false }
}
async function loadHistory(pagination = { page: 1, per_page: 20 }) {
  const current = ++historyRevision
  historyOpen.value = true
  historyLoading.value = true
  try {
    const data = await workbench.get('/analysis/imports', pagination)
    if (current === historyRevision && !disposed) history.value = data
  } catch (e: any) { error.value = e.message || t('analysis.failed') }
  finally { if (current === historyRevision) historyLoading.value = false }
}
async function exportRows() {
  try { await workbench.download('/analysis/export', `Analysis-${locale.value}.csv`, localeParams()) }
  catch (e: any) { error.value = e.message || t('analysis.failed') }
}
const trendSeries = computed(() => {
  const trend = report.value?.trend
  if (!trend) return []
  return trend.currencies.map((currency: string | null) => {
    const points = new Map<string, Row>(trend.points.filter((point: Row) => point.currency === currency).map((point: Row) => [point.period, point]))
    return {
      name: `${currencyName(currency)} · ${t('analysis.' + measure.value)}`,
      data: trend.periods.map((period: string) => {
        const point = points.get(period)
        return point && point[measure.value] !== null ? Number(point[measure.value]) : null
      }),
    }
  })
})
function distribution(dimension: string) {
  const groups: Row[] = report.value?.distributions[dimension] || []
  const keys = [...new Set(groups.map(row => row.key))]
  if (dimension === 'price_band') keys.sort((a, b) => ['negative', '0–99.99', '100–299.99', '300–499.99', '500–999.99', '1000–2999.99', '3000+', 'unknown'].indexOf(a) - ['negative', '0–99.99', '100–299.99', '300–499.99', '500–999.99', '1000–2999.99', '3000+', 'unknown'].indexOf(b))
  return {
    labels: keys.map(label),
    series: [...new Set(groups.map(row => row.currency))].map(currency => {
      const values = new Map(groups.filter(row => row.currency === currency).map(row => [row.key, row[measure.value]]))
      return { name: `${currencyName(currency)} · ${t('analysis.' + measure.value)}`, data: keys.map(key => values.get(key) === null || !values.has(key) ? null : Number(values.get(key))) }
    }),
  }
}
watch(locale, async () => {
  try { await loadOptions(); await changePage({ page: page.value, per_page: size.value }) }
  catch (e: any) { error.value = e.message || t('analysis.failed') }
})
onMounted(refresh)
onBeforeUnmount(() => { disposed = true; revision++; pageRevision++; historyRevision++ })
</script>

<template>
  <main class="legacy-workbench analysis-page">
    <header class="analysis-heading"><div><h1>Analysis</h1><p class="muted">{{ t('analysis.subtitle') }}</p></div><div class="actions"><button v-if="can('import')" @click="importOpen = true">{{ t('analysis.import') }}</button><button v-if="can('import')" @click="loadHistory()">{{ t('analysis.history') }}</button></div></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="panel">
      <form @submit.prevent="query">
        <div class="analysis-filters">
          <label>{{ t('analysis.start') }}<input v-model="draft.startDate" type="date" :max="draft.endDate" /></label>
          <label>{{ t('analysis.end') }}<input v-model="draft.endDate" type="date" :min="draft.startDate" /></label>
          <label>{{ t('analysis.category') }}<select v-model="draft.category_id"><option value="">{{ t('analysis.all') }}</option><option v-for="item in options.categories" :key="item.id" :value="item.id">{{ locale === 'en-US' ? item.name_en : item.name_zh }}</option></select></label>
          <label>{{ t('analysis.brand') }}<select v-model="draft.brand_id"><option value="">{{ t('analysis.all') }}</option><option v-for="item in options.brands" :key="item.id" :value="item.id">{{ locale === 'en-US' ? item.name_en : item.name_zh }}</option></select></label>
          <label>{{ t('analysis.country') }}<select v-model="draft.country"><option value="">{{ t('analysis.all') }}</option><option v-for="item in options.countries" :key="item">{{ item }}</option></select></label>
          <label>{{ t('analysis.customer_type') }}<select v-model="draft.customer_type"><option value="">{{ t('analysis.all') }}</option><option v-for="item in ['first', 'returning', 'unknown']" :key="item" :value="item">{{ t('analysis.' + item) }}</option></select></label>
          <label>{{ t('analysis.currency') }}<select v-model="draft.currency"><option value="">{{ t('analysis.all') }}</option><option v-for="item in options.currencies" :key="item">{{ item }}</option></select></label>
          <label>{{ t('analysis.recordType') }}<select v-model="draft.record_type"><option value="">{{ t('analysis.all') }}</option><option v-for="item in ['ordinary', 'invoice', 'after_sale', 'other_procurement']" :key="item" :value="item">{{ t('analysis.' + item) }}</option></select></label>
          <label>{{ t('analysis.quality') }}<select v-model="draft.quality"><option value="">{{ t('analysis.all') }}</option><option value="needs_review">{{ t('analysis.needsReview') }}</option></select></label>
          <label>{{ t('analysis.keyword') }}<input v-model.trim="draft.keyword" maxlength="255" /></label>
          <label>{{ t('analysis.grain') }}<select v-model="draft.grain"><option value="day">{{ t('analysis.day') }}</option><option value="month">{{ t('analysis.month') }}</option></select></label>
        </div>
        <div class="actions filter-actions"><label class="check"><input v-model="draft.include_cancelled" type="checkbox" />{{ t('analysis.includeCancelled') }}</label><button class="primary" :disabled="loading">{{ t('analysis.query') }}</button><button type="button" :disabled="loading" @click="reset">{{ t('analysis.reset') }}</button></div>
      </form>
    </section>
    <section v-if="!options.imports.some((item: Row) => item.source_type === 'procurement')" class="panel empty-state"><h2>{{ t('analysis.empty') }}</h2><p class="muted">{{ t('analysis.emptyHelp') }}</p><button v-if="can('import')" class="primary" @click="importOpen = true">{{ t('analysis.import') }}</button></section>
    <LoadingRegion :loading="loading">
      <template v-if="report && options.imports.some((item: Row) => item.source_type === 'procurement')">
        <div class="analysis-metrics">
          <section class="panel"><span class="muted">{{ t('analysis.amountTitle') }}</span><div v-if="report.totals.length" class="amount-totals"><strong v-for="item in report.totals" :key="item.currency || 'unknown'">{{ currencyName(item.currency) }} {{ fmt(item.amount) }}</strong></div><strong v-else>—</strong><small>{{ t('analysis.amountCoverage', { valid: report.summary.amount_rows, total: report.summary.rows }) }}</small></section>
          <section class="panel"><span class="muted">{{ t('analysis.rows') }}</span><strong>{{ fmt(report.summary.rows, 0) }}</strong><small>{{ t('analysis.linkedOrders', { count: report.summary.linked_orders }) }}</small></section>
          <section class="panel"><span class="muted">{{ t('analysis.categoryCoverage') }}</span><strong>{{ fmt(report.summary.category_rows, 0) }} / {{ fmt(report.summary.rows, 0) }}</strong><small>{{ t('analysis.brandCoverage', { count: report.summary.brand_rows }) }}</small></section>
          <section class="panel"><span class="muted">{{ t('analysis.customerCoverage') }}</span><strong>{{ fmt(report.summary.customer_rows, 0) }} / {{ fmt(report.summary.rows, 0) }}</strong><small>{{ t('analysis.countryCoverage', { count: report.summary.country_rows }) }}</small></section>
        </div>
        <section class="panel analysis-notes"><p>{{ t('analysis.metricHelp') }}</p><p>{{ t('analysis.dateHelp', { count: report.summary.fallback_date_rows }) }}</p><p>{{ t('analysis.historyHelp') }}</p></section>
        <section class="panel"><div class="section-heading"><h2>{{ t('analysis.trend') }}</h2><label>{{ t('analysis.chartMeasure') }}<select v-model="measure"><option value="amount">{{ t('analysis.amount') }}</option><option value="rows">{{ t('analysis.rows') }}</option></select></label></div><p class="muted">{{ t('analysis.chartHelp') }}</p><AnalysisChart :title="t('analysis.trend')" :labels="report.trend.periods" :series="trendSeries" :amount="measure === 'amount'" :locale="locale" line /></section>
        <div class="analysis-distributions"><section v-for="dimension in dimensions" :key="dimension" class="panel"><h2>{{ t('analysis.' + dimension) }}</h2><p v-if="dimension === 'price_band'" class="muted">{{ t('analysis.bandHelp') }}</p><AnalysisChart :title="t('analysis.' + dimension)" v-bind="distribution(dimension)" :amount="measure === 'amount'" :locale="locale" /></section></div>
      </template>
    </LoadingRegion>
    <section class="panel"><div class="section-heading"><h2>{{ t('analysis.details') }}</h2><button v-if="can('export')" :disabled="loading || !total" @click="exportRows">{{ t('analysis.export') }}</button></div><LoadingRegion :loading="loading || pageLoading"><div class="table-scroll"><table><thead><tr><th v-for="column in options.columns" :key="column.key">{{ column.label }}</th><th>{{ t('analysis.evidence') }}</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><td v-for="column in options.columns" :key="column.key">{{ row.display[column.key] }}</td><td><button @click="showEvidence(row.id)">{{ t('analysis.view') }}</button></td></tr><tr v-if="!rows.length"><td :colspan="options.columns.length + 1" class="empty-cell">{{ t('analysis.noRows') }}</td></tr></tbody></table></div><ApiPagination :page="page" :size="size" :total="total" :loading="loading || pageLoading" @change="changePage" /></LoadingRegion></section>
    <ImportDialog v-model="importOpen" @imported="refresh" />
    <el-dialog v-model="evidenceOpen" :title="t('analysis.evidence')" width="760px"><LoadingRegion :loading="evidenceLoading"><div v-if="evidence" class="evidence"><p>{{ evidence.filename }} · {{ evidence.sheet_name }} · {{ t('analysis.rowNumber') }} {{ evidence.row_number }}</p><h3>{{ t('analysis.original') }}</h3><dl><template v-for="(value, key) in evidence.raw.cells" :key="key"><dt>{{ key }}</dt><dd>{{ value }}</dd></template></dl><h3>{{ t('analysis.matchEvidence') }}</h3><pre>{{ JSON.stringify(evidence.classification_evidence, null, 2) }}</pre><h3>{{ t('analysis.issues') }}</h3><pre>{{ JSON.stringify(evidence.issues, null, 2) }}</pre></div></LoadingRegion></el-dialog>
    <el-dialog v-model="historyOpen" :title="t('analysis.history')" width="900px"><LoadingRegion :loading="historyLoading"><div class="legacy-workbench"><div class="table-scroll"><table><thead><tr><th>{{ t('analysis.workbook') }}</th><th>{{ t('analysis.importTime') }}</th><th>{{ t('analysis.current') }}</th><th>{{ t('analysis.currency') }}</th><th>{{ t('analysis.priceBasis') }}</th></tr></thead><tbody><tr v-for="item in history.list" :key="item.id"><td>{{ item.filename }}</td><td>{{ new Date(item.created_at).toLocaleString(locale) }}</td><td>{{ item.is_active ? t('analysis.yes') : t('analysis.no') }}</td><td>{{ currencyName(item.currency) }}</td><td>{{ t('analysis.' + ({ row_total: 'rowTotal', unit: 'unit', unknown: 'unconfirmed' }[item.price_basis as string] || 'unconfirmed')) }}</td></tr></tbody></table></div><ApiPagination :page="history.page" :size="history.per_page" :total="history.total" :loading="historyLoading" @change="loadHistory" /></div></LoadingRegion></el-dialog>
  </main>
</template>

<style scoped>
.analysis-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.analysis-page h1 { margin: 0 0 8px; }
.analysis-page h2 { margin: 0 0 14px; font-size: 18px; }
.analysis-page .panel { padding: 20px; margin-bottom: 18px; min-width: 0; }
.analysis-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
.analysis-filters label, .section-heading label { display: grid; gap: 6px; color: var(--workbench-muted, var(--el-text-color-secondary)); }
.analysis-filters input, .analysis-filters select { width: 100%; min-height: 36px; }
.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.filter-actions { justify-content: flex-end; margin-top: 16px; }
.check { display: flex; gap: 8px; align-items: center; margin-right: auto; }
.analysis-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.analysis-metrics strong { display: block; margin: 14px 0; font-size: 25px; overflow-wrap: anywhere; }
.analysis-metrics small { color: var(--el-text-color-secondary); }
.analysis-notes p { margin: 5px 0; color: var(--el-text-color-secondary); line-height: 1.65; }
.analysis-distributions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.table-scroll { overflow: auto; }
.analysis-page table th, .analysis-page table td { text-align: left; white-space: nowrap; vertical-align: top; }
.empty-cell { padding: 28px !important; text-align: center !important; }
.empty-state { text-align: center; padding: 36px !important; }
.evidence dl { display: grid; grid-template-columns: 40px 1fr; gap: 8px; }
.evidence dd { margin: 0; overflow-wrap: anywhere; }
.evidence pre { white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 1100px) { .analysis-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .analysis-distributions, .analysis-metrics { grid-template-columns: 1fr; } }
</style>
