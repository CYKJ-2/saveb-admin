<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { workbench } from '@/api/workbench'
import { useWorkbench } from '../shared/useWorkbench'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import AnalysisChart from './AnalysisChart.vue'
import AnalysisDistribution from './AnalysisDistribution.vue'
import AnalysisCross from './AnalysisCross.vue'
import AnalysisDetails from './AnalysisDetails.vue'
import AnalysisSection from './AnalysisSection.vue'
import AnalysisHistory from './AnalysisHistory.vue'
import ImportDialog from './ImportDialog.vue'
import '../shared/legacy.css'

type Row = Record<string, any>
const { t, locale } = useI18n()
const { can } = useWorkbench('analysis')
const selectedMonth = ref(dayjs().format('YYYY-MM'))
const monthRange = (month: string) => ({ startDate: dayjs(month + '-01').startOf('month').format('YYYY-MM-DD'), endDate: dayjs(month + '-01').endOf('month').format('YYYY-MM-DD') })
const defaults = () => ({ ...monthRange(selectedMonth.value), category_id: '', brand_id: '', supplier_id: '', customer_type: '', keyword: '', purchase_method: '', price_band: '' })
const draft = reactive<Row>(defaults())
const applied = ref<Row>({})
const options = ref<Row>({ categories: [], brands: [], suppliers: [], periods: [], imports: [], columns: [], can_initialize: false, current_month: '' })
const report = ref<Row>()
const grain = ref('month')
const loading = ref(false)
const error = ref('')
const importOpen = ref(false)
const historyOpen = ref(false)
let revision = 0
let optionsRevision = 0
let disposed = false
const dimensions = ['brand', 'category', 'price_band', 'purchase_method']
const bands = ['negative', '0-99.99', '100-299.99', '300-499.99', '500-999.99', '1000-2999.99', '3000+']
const fmt = (value: unknown, digits = 2) => value === null || value === undefined ? '—' : Number(value).toLocaleString(locale.value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
const name = (item: Row) => locale.value === 'en-US' ? item.name_en : item.name_zh
const coverage = computed(() => options.value.periods.length ? options.value.periods[0] + ' — ' + options.value.periods.at(-1) : t('analysis.empty'))
const monthLabel = computed(() => dayjs(selectedMonth.value + '-01').format(locale.value === 'en-US' ? 'YYYY-MM' : 'YYYY 年 M 月'))
async function loadOptions() {
  const current = ++optionsRevision
  const data = await workbench.get('/analysis/options', { locale: locale.value })
  if (current === optionsRevision && !disposed) options.value = data
}
async function fetchReport(filters: Row) {
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const statistics = await workbench.get('/analysis/report', { ...filters, grain: grain.value })
    if (current !== revision || disposed) return
    report.value = statistics
    applied.value = { ...filters }
    if (filters.startDate || filters.endDate) selectedMonth.value = (filters.startDate || filters.endDate).slice(0, 7)
  } catch (e: any) { if (current === revision) error.value = e.message || t('analysis.failed') }
  finally { if (current === revision) loading.value = false }
}
function query() { return fetchReport(Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== ''))) }
function reset() { Object.assign(draft, defaults(), { startDate: '', endDate: '' }); void query() }
function selectMonth(month: string) {
  selectedMonth.value = month
  Object.assign(draft, monthRange(month))
  void query()
}
function shiftMonth(offset: number) { selectMonth(dayjs(selectedMonth.value + '-01').add(offset, 'month').format('YYYY-MM')) }
async function refresh() {
  try { await loadOptions(); await query() }
  catch (e: any) { error.value = e.message || t('analysis.failed') }
}
function changeGrain(value: string) {
  if (grain.value === value) return
  grain.value = value
  void fetchReport(applied.value)
}
const trendSeries = computed(() => {
  if (!report.value) return []
  const points = new Map<string, Row>(report.value.trend.points.map((point: Row) => [point.period, point]))
  return [{
    name: t('analysis.amount') + ' · CNY',
    data: report.value.trend.periods.map((period: string) => points.has(period) ? Number(points.get(period)!.amount) : options.value.periods.includes(period.slice(0, 7)) ? 0 : null),
  }]
})
function groups(dimension: string) {
  const result = [...(report.value?.distributions[dimension] || [])]
  return dimension === 'price_band' ? result.sort((a, b) => bands.indexOf(a.key) - bands.indexOf(b.key)) : result
}
watch(locale, () => { void loadOptions().catch(e => { error.value = e.message || t('analysis.failed') }) })
onMounted(async () => {
  try {
    await loadOptions()
    selectedMonth.value = options.value.current_month || selectedMonth.value
    Object.assign(draft, monthRange(selectedMonth.value))
    await query()
  } catch (e: any) { error.value = e.message || t('analysis.failed') }
})
onBeforeUnmount(() => { disposed = true; revision++; optionsRevision++ })
</script>

<template>
  <main class="legacy-workbench analysis-page">
    <header class="analysis-heading">
      <div><span class="eyebrow">{{ t('analysis.procurementIntelligence') }}</span><h1>Analysis <small>{{ t('analysis.title') }}</small></h1><p class="muted">{{ t('analysis.subtitle') }}</p></div>
      <div class="actions">
        <button v-if="can('import')" @click="historyOpen = true">{{ t('analysis.history') }}</button>
        <button v-if="can('import')" class="primary" @click="importOpen = true">{{ t('analysis.import') }}</button>
      </div>
    </header>
    <section class="panel">
      <div class="section-heading"><h2>{{ t('analysis.filters') }}</h2><span class="muted">{{ t('analysis.coverage') }}：{{ coverage }} · CNY</span></div>
      <div class="actions month-navigation" :aria-label="t('analysis.analysisMonth')">
        <button type="button" :disabled="loading" @click="shiftMonth(-1)">{{ t('analysis.previousMonth') }}</button>
        <strong aria-live="polite">{{ monthLabel }}</strong>
        <button type="button" :disabled="loading" @click="shiftMonth(1)">{{ t('analysis.nextMonth') }}</button>
        <button type="button" :disabled="loading" @click="selectMonth(options.current_month || dayjs().format('YYYY-MM'))">{{ t('analysis.thisMonth') }}</button>
      </div>
      <form @submit.prevent="query">
        <div class="analysis-filters">
          <label>{{ t('analysis.start') }}<input v-model="draft.startDate" type="date" :max="draft.endDate" /></label>
          <label>{{ t('analysis.end') }}<input v-model="draft.endDate" type="date" :min="draft.startDate" /></label>
          <label>{{ t('analysis.brand') }}<el-select v-model="draft.brand_id" clearable filterable :placeholder="t('analysis.all')"><el-option v-for="item in options.brands" :key="item.id" :value="item.id" :label="name(item)" /></el-select></label>
          <label>{{ t('analysis.category') }}<el-select v-model="draft.category_id" clearable :placeholder="t('analysis.all')"><el-option v-for="item in options.categories" :key="item.id" :value="item.id" :label="name(item)" /></el-select></label>
          <label>{{ t('analysis.supplier') }}<el-select v-model="draft.supplier_id" clearable filterable :placeholder="t('analysis.all')"><el-option v-for="item in options.suppliers" :key="item.id" :value="item.id" :label="item.name" /></el-select></label>
          <label>{{ t('analysis.purchase_method') }}<select v-model="draft.purchase_method"><option value="">{{ t('analysis.all') }}</option><option v-for="value in ['ws', 'pl', 'invoice', 'after_sale', 'influencer', 'accessory', 'unknown']" :key="value" :value="value">{{ t('analysis.' + value) }}</option></select></label>
          <label>{{ t('analysis.price_band') }}<select v-model="draft.price_band"><option value="">{{ t('analysis.all') }}</option><option v-for="value in bands" :key="value" :value="value">{{ value === 'negative' ? t('analysis.negative') : value }}</option></select></label>
          <label>{{ t('analysis.customer_type') }}<select v-model="draft.customer_type"><option value="">{{ t('analysis.all') }}</option><option v-for="value in ['first', 'returning', 'unknown']" :key="value" :value="value">{{ t('analysis.' + value) }}</option></select></label>
          <label class="keyword">{{ t('analysis.keyword') }}<input v-model.trim="draft.keyword" maxlength="255" /></label>
        </div>
        <div class="actions filter-actions"><span class="muted">{{ t('analysis.queryHelp') }}</span><button type="button" :disabled="loading" @click="reset">{{ t('analysis.reset') }}</button><button class="primary" :disabled="loading">{{ t('analysis.query') }}</button></div>
      </form>
    </section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <LoadingRegion :loading="loading">
      <template v-if="report">
        <div class="analysis-metrics">
          <section class="panel"><span>{{ t('analysis.amountTitle') }}</span><strong><small>CNY</small> {{ fmt(report.summary.amount) }}</strong><small>{{ t('analysis.fixedBasis') }}</small></section>
          <section class="panel"><span>{{ t('analysis.eligibleRows') }}</span><strong>{{ fmt(report.summary.eligible_rows, 0) }}</strong><small>{{ t('analysis.allRecords', { count: fmt(report.summary.rows, 0) }) }}</small></section>
          <section class="panel"><span>{{ t('analysis.customers') }}</span><strong>{{ fmt(report.summary.customers, 0) }}</strong><small>{{ t('analysis.customerMetricHelp') }}</small></section>
          <section class="panel"><span>{{ t('analysis.average') }}</span><strong><small>CNY</small> {{ fmt(report.summary.average_amount) }}</strong><small>{{ t('analysis.averageHelp') }}</small></section>
        </div>
        <section class="panel analysis-notes">
          <p>{{ t('analysis.metricHelp') }}</p><p>{{ t('analysis.historyHelp') }}</p>
          <div class="quality-summary">
            <span>{{ t('analysis.missingPrice') }} <b>{{ report.summary.missing_price }}</b></span>
            <span>{{ t('analysis.missingDate') }} <b>{{ report.summary.missing_date }}</b></span>
            <span>{{ t('analysis.missingCustomer') }} <b>{{ report.summary.missing_customer }}</b></span>
            <span>{{ t('analysis.unclassifiedBrand') }} <b>{{ report.summary.unclassified_brand }}</b></span>
            <span>{{ t('analysis.unclassifiedCategory') }} <b>{{ report.summary.unclassified_category }}</b></span>
          </div>
          <p v-if="Number(report.summary.undated_amount) !== 0">{{ t('analysis.undatedHelp', { amount: fmt(report.summary.undated_amount) }) }}</p>
        </section>
        <section class="panel">
          <div class="section-heading"><h2>{{ t('analysis.trend') }}</h2><div class="actions"><button :class="{ selected: grain === 'day' }" @click="changeGrain('day')">{{ t('analysis.day') }}</button><button :class="{ selected: grain === 'month' }" @click="changeGrain('month')">{{ t('analysis.month') }}</button></div></div>
          <p class="muted">{{ t('analysis.trendRange', { start: report.trend.startDate, end: report.trend.endDate }) }} · {{ t('analysis.trendHelp') }}</p>
          <AnalysisChart :title="t('analysis.trend')" :labels="report.trend.periods" :series="trendSeries" :amount="true" :locale="locale" line />
        </section>
        <div class="analysis-distributions">
          <AnalysisDistribution v-for="dimension in dimensions" :key="dimension" :title="t('analysis.title_' + dimension)" :dimension="dimension" :groups="groups(dimension)" />
        </div>
        <AnalysisCross id="analysis-category-price" :title="t('analysis.categoryPrice')" :cells="report.crosses.category_price" price
          :row-totals="report.distributions.category" :column-totals="report.distributions.price_band"
          :total="{ rows: report.summary.eligible_rows, amount: report.summary.amount }" />
        <AnalysisCross id="analysis-customer-brand" :title="t('analysis.customerBrand')" :cells="report.crosses.customer_brand" customer
          :row-totals="report.distributions.customer_type" :column-totals="report.distributions.brand"
          :total="{ rows: report.summary.eligible_rows, amount: report.summary.amount }" />
        <AnalysisCross id="analysis-customer-category" :title="t('analysis.customerCategory')" :cells="report.crosses.customer_category" customer
          :row-totals="report.distributions.customer_type" :column-totals="report.distributions.category"
          :total="{ rows: report.summary.eligible_rows, amount: report.summary.amount }" />
      </template>
      <section v-else-if="!loading" class="panel empty">{{ t('analysis.empty') }}</section>
    </LoadingRegion>
    <AnalysisSection v-if="report" id="analysis-details" :title="t('analysis.details')" v-slot="{ active }">
      <AnalysisDetails :active="active" :filters="applied" :columns="options.columns" :can-export="can('export')" />
    </AnalysisSection>
    <ImportDialog v-model="importOpen" :can-initialize="options.can_initialize" :current-month="options.current_month" @imported="refresh" />
    <AnalysisHistory v-model="historyOpen" />
  </main>
</template>

<style scoped>
.analysis-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.analysis-heading { margin-bottom: 22px; }
.eyebrow { font-size: 11px; letter-spacing: .1em; color: var(--workbench-blue, #409eff); }
.analysis-page h1 { margin: 8px 0; font-size: 30px; font-weight: 700; }
.analysis-page h1 small { font-size: 17px; font-weight: 400; color: var(--workbench-muted, var(--el-text-color-secondary)); margin-left: 10px; }
.analysis-page :deep(h2) { margin: 0 0 14px; font-size: 17px; font-weight: 600; }
.analysis-page :deep(.panel) { padding: 22px; margin-bottom: 18px; min-width: 0; }
.analysis-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.analysis-filters label { display: grid; gap: 7px; color: var(--workbench-muted, var(--el-text-color-secondary)); }
.analysis-filters input, .analysis-filters select { width: 100%; min-height: 36px; }
.analysis-filters :deep(.el-select__wrapper) { min-height: 36px; }
.analysis-filters :deep(.el-select__input) { min-height: 0; height: auto; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.keyword { grid-column: span 2; }
.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.month-navigation { margin: 4px 0 20px; }
.month-navigation strong { min-width: 125px; text-align: center; font-variant-numeric: tabular-nums; }
.month-navigation button { min-height: 36px; }
.filter-actions { justify-content: flex-end; margin-top: 16px; }
.filter-actions span { margin-right: auto; }
.selected { border-color: var(--workbench-blue, #409eff); color: var(--workbench-blue, #409eff); }
.analysis-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.analysis-metrics strong { display: block; margin: 14px 0; font-size: 28px; font-variant-numeric: tabular-nums; }
.analysis-metrics strong small { font-size: 14px; font-weight: 500; }
.analysis-metrics small, .analysis-notes p { color: var(--workbench-muted, var(--el-text-color-secondary)); }
.analysis-notes p { margin: 4px 0; line-height: 1.7; }
.quality-summary { display: flex; flex-wrap: wrap; gap: 10px 24px; padding: 16px 0 6px; color: var(--workbench-muted, var(--el-text-color-secondary)); }
.quality-summary b { color: var(--workbench-text, var(--el-text-color-primary)); padding-left: 5px; }
.analysis-distributions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
@media (max-width: 1400px) { .analysis-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1100px) { .analysis-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) { .analysis-metrics { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .analysis-distributions, .analysis-metrics, .analysis-filters { grid-template-columns: 1fr; } .keyword { grid-column: auto; } }
</style>
