<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { workbench, type Row } from '@/api/workbench'
import { businessDate } from '@/api/dashboard'
import { localizePageMessage } from '@/lang/page-message'
import { useBusinessLocale } from '@/composables/useBusinessLocale'
import { useWorkbench } from '../shared/useWorkbench'
import EmployeeRanking from './EmployeeRanking.vue'
import EmployeeComparison from './EmployeeComparison.vue'
import SalesTrend from './SalesTrend.vue'
import SalesBreakdown from './SalesBreakdown.vue'
import OrderDetails from './OrderDetails.vue'
import { colors, number, usd } from './format'
import '../shared/legacy.css'

const { t, locale } = useI18n()
const { businessLabel } = useBusinessLocale()
const { can, loading, error, run } = useWorkbench('sa_sales')
const start = ref(dayjs(businessDate()).startOf('month').format('YYYY-MM-DD'))
const end = ref(businessDate())
const report = ref<Row | null>(null)
const bounds = ref<Row>({})
const detailInitialRange = ref<{ startDate: string; endDate: string } | null>(null)
const displayMoney = (value: unknown) => usd(value, locale.value)
const sourceLabels: Record<string, string> = { 'Top Influencers': 'top_influencer', 'Mid Influencers': 'mid_influencer', 'Official Sites': 'official', 'Offline Orders': 'offline', 'Unmatched': 'unmatched' }
const label = (value: string) => locale.value === 'en-US' && sourceLabels[value] ? value : businessLabel(sourceLabels[value] || value)
const nextMonthDisabled = computed(() => !!bounds.value.dataThrough && dayjs(start.value).add(1, 'month').startOf('month').format('YYYY-MM-DD') > bounds.value.dataThrough)
const previousMonthDisabled = computed(() => !!bounds.value.firstDate && dayjs(start.value).subtract(1, 'month').endOf('month').format('YYYY-MM-DD') < bounds.value.firstDate)

async function load() {
  if (!can('list')) return
  if (!start.value || !end.value || start.value > end.value) { error.value = t('pages.saInvalidRange'); return }
  report.value = null
  await run(() => workbench.get('/sa-sales/report', { startDate: start.value, endDate: end.value, includeDetails: 0 }), data => { report.value = data })
}
function monthRange(date: dayjs.Dayjs) {
  start.value = [date.startOf('month').format('YYYY-MM-DD'), bounds.value.firstDate || ''].sort().at(-1)!
  end.value = [date.endOf('month').format('YYYY-MM-DD'), bounds.value.dataThrough || '9999-12-31'].sort()[0]
}
function shift(amount: number) { monthRange(dayjs(start.value).add(amount, 'month')); load() }
function quick(type: string) {
  const anchor = dayjs(bounds.value.dataThrough || businessDate())
  if (type === 'all') { start.value = bounds.value.firstDate || start.value; end.value = bounds.value.dataThrough || end.value }
  else if (type === 'week') {
    const monday = anchor.subtract((anchor.day() + 6) % 7, 'day').format('YYYY-MM-DD')
    start.value = [monday, bounds.value.firstDate || ''].sort().at(-1)!
    end.value = anchor.format('YYYY-MM-DD')
  } else monthRange(type === 'last' ? anchor.subtract(1, 'month') : anchor)
  load()
}
onMounted(async () => {
  if (!can('list')) return
  await run(() => workbench.get('/sa-sales/bounds'), data => { bounds.value = data })
  if (bounds.value.dataThrough) monthRange(dayjs(bounds.value.dataThrough))
  detailInitialRange.value = { startDate: start.value, endDate: end.value }
  load()
})
</script>

<template>
  <main class="legacy-workbench sa-sales">
    <header><div><h1>{{ t('pages.saTitle') }}</h1><p class="muted">{{ t('pages.saSubtitle') }}</p></div><span class="badge">{{ t('pages.dataThrough', { p0: bounds.dataThrough || t('pages.noData') }) }}</span></header>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <section v-if="can('list')" class="panel">
      <form class="toolbar" @submit.prevent="load">
        <button type="button" :disabled="loading || previousMonthDisabled" @click="shift(-1)">{{ t('pages.lastMonth') }}</button>
        <button type="button" :disabled="loading || nextMonthDisabled" @click="shift(1)">{{ t('pages.nextMonth') }}</button>
        <button type="button" :disabled="loading" @click="quick('month')">{{ t('pages.saThisMonth') }}</button>
        <button type="button" :disabled="loading" @click="quick('last')">{{ t('pages.lastMonth2') }}</button>
        <button type="button" :disabled="loading" @click="quick('week')">{{ t('pages.thisWeek') }}</button>
        <button type="button" :disabled="loading" @click="quick('all')">{{ t('pages.all') }}</button>
        <label>{{ t('pages.startDate') }}<input v-model="start" type="date" :min="bounds.firstDate" :max="bounds.dataThrough" required /></label>
        <label>{{ t('pages.endDate') }}<input v-model="end" type="date" :min="start" :max="bounds.dataThrough" required /></label>
        <button class="primary" :disabled="loading">{{ t('pages.apply') }}</button>
        <button v-if="can('export')" type="button" :disabled="!report || loading" @click="workbench.download('/sa-sales/export', t('pages.saSalesReportCsv'), report?.range)">{{ t('pages.exportCsv') }}</button>
      </form>
    </section>
    <p v-if="loading" class="muted" role="status">{{ t('pages.calculatingSalesData') }}</p>
    <template v-if="report">
      <div class="cards metrics">
        <div class="card">{{ t('pages.saOrders') }}<b>{{ number(report.metrics.orders, locale) }}</b></div>
        <div class="card">{{ t('pages.saRefundOrders') }}<b>{{ number(report.metrics.refundOrders, locale) }}</b><p class="muted">{{ displayMoney(report.metrics.refundAmount) }}</p></div>
        <div class="card">{{ t('pages.saNetSales') }}<b>{{ displayMoney(report.metrics.netSales) }}</b><p class="muted">{{ t('pages.saSalesAmount') }}: {{ displayMoney(report.metrics.positiveSales) }}</p></div>
        <div class="card">{{ t('pages.saTotalCommission') }}<b>{{ displayMoney(report.metrics.totalCommission) }}</b></div>
        <div class="card">{{ t('pages.saAverageOrder') }}<b>{{ displayMoney(report.metrics.averageOrderValue) }}</b></div>
        <div class="card">{{ t('pages.saActiveDaily') }}<b>{{ displayMoney(report.metrics.dailyAverage) }}</b><p class="muted">{{ t('pages.saActiveDays', { count: report.metrics.activeDays }) }}</p></div>
        <div class="card">{{ t('pages.saTopSeller') }}<b>{{ label(report.metrics.topSeller) }}</b></div>
      </div>
      <p v-if="report.metrics.missingRates" class="error">{{ t('pages.ordersHaveNoExchangeRateAndAreExcludedFrom', { p0: report.metrics.missingRates }) }}</p>
      <div class="ranking-grid">
        <EmployeeRanking :title="t('pages.saEmployeeRanking')" :rows="report.employees" :label="label" />
        <section class="panel" :aria-label="t('pages.saChannels')">
          <header><h2>{{ t('pages.saChannels') }}</h2></header>
          <div class="channel-cards"><article v-for="(row, index) in report.channels" :key="row.name" class="card" :style="{ borderTop: `3px solid ${colors[Number(index) % colors.length]}` }">
            <strong>{{ label(row.name) }}</strong><b>{{ displayMoney(row.netSales) }}</b>
            <p class="muted">{{ number(row.orders, locale) }} {{ t('pages.saOrders') }} · {{ number(row.sharePercent, locale) }}%</p>
          </article></div>
          <p v-if="!report.channels.length" class="empty">{{ t('pages.saNoData') }}</p>
        </section>
      </div>
      <EmployeeRanking :title="t('pages.saInvoiceRanking')" :rows="report.invoiceSales.employees" :label="label" />
      <div class="charts">
        <SalesTrend :rows="report.daily" />
        <EmployeeComparison :rows="report.employees" :label="label" />
        <SalesBreakdown :breakdowns="report.breakdowns" :label="label" />
      </div>
      <section class="panel">
        <details><summary>{{ t('pages.saDailySummary') }} · {{ t('pages.saActiveDays', { count: report.metrics.activeDays }) }}</summary>
          <div class="table-wrap daily-table"><table>
            <thead><tr><th>{{ t('pages.date') }}</th><th>{{ t('pages.saOrders') }}</th><th>{{ t('pages.saRefundOrders') }}</th><th>{{ t('pages.saSalesAmount') }}</th><th>{{ t('pages.saRefundAmount') }}</th><th>{{ t('pages.saNetSales') }}</th></tr></thead>
            <tbody><tr v-for="row in report.daily" :key="row.date"><td>{{ row.date }}</td><td>{{ number(row.orders, locale) }}</td><td>{{ number(row.refundOrders, locale) }}</td><td class="numeric">{{ displayMoney(row.sales) }}</td><td class="numeric refund">{{ displayMoney(-row.refunds) }}</td><td class="numeric">{{ displayMoney(row.netSales) }}</td></tr></tbody>
            <tfoot><tr><th>{{ t('pages.saTotal') }}</th><td>{{ number(report.metrics.orders, locale) }}</td><td>{{ number(report.metrics.refundOrders, locale) }}</td><td class="numeric">{{ displayMoney(report.metrics.positiveSales) }}</td><td class="numeric refund">{{ displayMoney(-report.metrics.refundAmount) }}</td><td class="numeric">{{ displayMoney(report.metrics.netSales) }}</td></tr></tfoot>
          </table></div>
        </details>
        <p class="muted">{{ t('pages.saCommissionRules') }}</p>
      </section>
    </template>
    <OrderDetails v-if="can('list') && detailInitialRange" :initial-range="detailInitialRange" :bounds="bounds" :label="label" />
  </main>
</template>

<style scoped>
.metrics { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.metrics .card b { font-size: 23px; overflow-wrap: anywhere; }
.ranking-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr); gap: 18px; }
.channel-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.channel-cards .card { padding: 13px; min-width: 0; }
.channel-cards strong { display: block; overflow-wrap: anywhere; }
.channel-cards b { font-size: 20px; overflow-wrap: anywhere; }
.daily-table { margin-top: 16px; }
.charts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.refund { color: var(--red); }
summary { cursor: pointer; font-weight: 600; }
@media (max-width: 1450px) { .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); } .ranking-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 1250px) { .charts { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 400px) { .channel-cards { grid-template-columns: minmax(0, 1fr); } }
</style>
