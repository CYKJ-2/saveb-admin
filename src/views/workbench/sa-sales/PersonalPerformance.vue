<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { businessDate } from '@/api/dashboard'
import { personalPerformance, type PerformanceEmployee, type PerformanceRange, type PerformanceReport, type PerformanceSummary } from '@/api/sa-personal-performance'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import PersonalPerformanceTrend from './PersonalPerformanceTrend.vue'
import { number, usd } from './format'

const { t, locale } = useI18n()
const text = (key: string) => t(`personalPerformance.${key}`)
const employees = ref<PerformanceEmployee[]>([])
const optionsLoaded = ref(false)
const mode = ref<'month' | 'date'>('month')
const month = ref(businessDate().slice(0, 7))
const startDate = ref(dayjs(businessDate()).startOf('month').format('YYYY-MM-DD'))
const endDate = ref(businessDate())
const staffCode = ref('')
const scope = ref<PerformanceRange['scope']>('all')
const report = ref<PerformanceReport | null>(null)
// 旧版图表补齐整月，每日表格仅展示有销售或退款金额的日期。
const activeDailyRows = computed(() => report.value?.daily.filter(day => day.sales > 0 || day.refunds > 0) ?? [])
const summaryLoading = ref(false)
const ordersLoading = ref(false)
const error = ref('')
const pageError = ref('')
let revision = 0
let disposed = false

const selectedMonth = computed(() => {
  const date = dayjs(`${month.value}-01`)
  return date.isValid() ? new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }).format(date.toDate()) : '—'
})
const appliedLabel = computed(() => {
  if (!report.value) return ''
  const range = report.value.range
  const employee = employees.value.find(item => item.code === range.staffCode)
  return t('personalPerformance.applied', {
    employee: employeeLabel(employee ?? { code: range.staffCode, name: range.staffCode }),
    start: range.startDate, end: range.endDate, scope: text(range.scope),
  })
})
const summaryRows: { field: keyof PerformanceSummary; label: string; type: 'usd' | 'count' | 'percent'; tone?: string }[] = [
  { field: 'sales', label: 'sales', type: 'usd' },
  { field: 'refunds', label: 'refunds', type: 'usd', tone: 'refund' },
  { field: 'netSales', label: 'netSales', type: 'usd', tone: 'emphasis' },
  { field: 'commissionUsd', label: 'commissionUsd', type: 'usd', tone: 'commission' },
  { field: 'totalOrders', label: 'totalOrders', type: 'count' },
  { field: 'refundOrders', label: 'refundOrders', type: 'count', tone: 'refund' },
  { field: 'refundRateOrders', label: 'refundRateOrders', type: 'percent' },
  { field: 'refundRateAmount', label: 'refundRateAmount', type: 'percent' },
]

function employeeLabel(employee: PerformanceEmployee) {
  return employee.name === employee.code ? employee.code : `${employee.name} (${employee.code})`
}

function percent(value: number) {
  return `${new Intl.NumberFormat(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`
}

function summaryValue(row: typeof summaryRows[number]) {
  const value = report.value?.summary?.[row.field]
  if (value == null) return '—'
  if (row.type === 'usd') return usd(row.field === 'refunds' ? -value : value, locale.value)
  return row.type === 'percent' ? percent(value) : number(value, locale.value)
}

function selectedRange(): PerformanceRange | null {
  const start = mode.value === 'month' ? `${month.value}-01` : startDate.value
  const end = mode.value === 'month' ? dayjs(start).endOf('month').format('YYYY-MM-DD') : endDate.value
  if (!staffCode.value || !start || !end || !dayjs(start).isValid() || !dayjs(end).isValid()
    || end < start || dayjs(end).diff(dayjs(start), 'day') > 365) return null
  return { staffCode: staffCode.value, startDate: start, endDate: end, scope: scope.value }
}

/** 只在主动查询或切换上/下月时应用新条件；翻页始终沿用已查询的条件。 */
async function query() {
  const range = selectedRange()
  if (!range) { error.value = text('invalidRange'); return }
  const current = ++revision
  summaryLoading.value = true
  ordersLoading.value = true
  error.value = ''
  pageError.value = ''
  try {
    const result = await personalPerformance.report(range, 1, report.value?.orders.per_page ?? 20)
    if (!disposed && current === revision) report.value = result
  } catch {
    if (!disposed && current === revision) error.value = text('loadFailed')
  } finally {
    if (!disposed && current === revision) { summaryLoading.value = false; ordersLoading.value = false }
  }
}

async function changePage({ page, per_page }: { page: number; per_page: number }) {
  if (!report.value || ordersLoading.value) return
  const current = ++revision
  ordersLoading.value = true
  pageError.value = ''
  try {
    const result = await personalPerformance.report(report.value.range, page, per_page, false)
    if (!disposed && current === revision && report.value) report.value.orders = result.orders
  } catch {
    if (!disposed && current === revision) pageError.value = text('loadFailed')
  } finally {
    if (!disposed && current === revision) ordersLoading.value = false
  }
}

function changeMonth(offset: number) {
  month.value = dayjs(`${month.value}-01`).add(offset, 'month').format('YYYY-MM')
  query()
}

async function initialize() {
  summaryLoading.value = true
  error.value = ''
  try {
    const options = await personalPerformance.options()
    if (disposed) return
    employees.value = options.employees
    staffCode.value = options.defaultStaffCode
    optionsLoaded.value = true
  } catch {
    if (!disposed) error.value = text('loadFailed')
  } finally {
    if (!disposed) summaryLoading.value = false
  }
  if (!disposed && staffCode.value) await query()
}

onMounted(initialize)
onBeforeUnmount(() => { disposed = true; revision++ })
</script>

<template>
  <section class="panel personal-performance" :aria-label="text('title')">
    <header><h2>{{ text('title') }}</h2><span class="muted">{{ appliedLabel }}</span></header>
    <form class="toolbar personal-filters" @submit.prevent="query">
      <label>{{ text('employee') }}
        <select v-model="staffCode" :disabled="!optionsLoaded || summaryLoading" :aria-label="text('employee')">
          <option v-if="!employees.length" value="">{{ text('noEmployees') }}</option>
          <option v-for="employee in employees" :key="employee.code" :value="employee.code">{{ employeeLabel(employee) }}</option>
        </select>
      </label>
      <label>{{ text('mode') }}<select v-model="mode" :aria-label="text('mode')"><option value="month">{{ text('month') }}</option><option value="date">{{ text('dates') }}</option></select></label>
      <div v-if="mode === 'month'" class="month-control">
        <button type="button" :aria-label="text('previousMonth')" :title="text('previousMonth')" :disabled="summaryLoading || !staffCode || !month" @click="changeMonth(-1)">‹</button>
        <label>{{ selectedMonth }}<input v-model="month" type="month" required :aria-label="text('selectedMonth')" /></label>
        <button type="button" :aria-label="text('nextMonth')" :title="text('nextMonth')" :disabled="summaryLoading || !staffCode || !month" @click="changeMonth(1)">›</button>
      </div>
      <template v-else>
        <label>{{ text('startDate') }}<input v-model="startDate" type="date" required :max="endDate" :aria-label="text('startDate')" /></label>
        <label>{{ text('endDate') }}<input v-model="endDate" type="date" required :min="startDate" :aria-label="text('endDate')" /></label>
      </template>
      <label>{{ text('scope') }}<select v-model="scope" :aria-label="text('scope')"><option value="all">{{ text('all') }}</option><option value="order">{{ text('order') }}</option><option value="invoice">{{ text('invoice') }}</option></select></label>
      <button class="primary" type="submit" :disabled="summaryLoading || !staffCode">{{ text(summaryLoading ? 'querying' : 'query') }}</button>
    </form>
    <div v-if="error" class="error" role="alert">{{ error }} <button v-if="!optionsLoaded" type="button" @click="initialize">{{ text('retry') }}</button></div>
    <p class="muted calculation-note">{{ text('calculationNote') }}</p>
    <LoadingRegion :loading="summaryLoading">
      <template v-if="report?.summary">
        <p v-if="report.summary.missingRates" class="data-warning" role="status">{{ t('personalPerformance.missingRates', { count: report.summary.missingRates }) }}</p>
        <div class="performance-grid">
          <section class="performance-summary" :aria-label="text('total')">
            <h3>{{ text('total') }} <small>USD</small></h3>
            <dl>
              <div v-for="row in summaryRows" :key="row.field" :class="row.tone">
                <dt>{{ text(row.label) }}</dt>
                <dd>{{ summaryValue(row) }}</dd>
              </div>
            </dl>
          </section>
          <div class="performance-visuals">
            <section class="performance-chart" :aria-label="text('dailyTrend')">
              <h3>{{ text('dailyTrend') }}</h3>
              <PersonalPerformanceTrend :rows="report.daily" />
            </section>
            <section :aria-label="text('dailyData')">
              <h3>{{ text('dailyData') }}</h3>
              <div class="table-wrap daily-table">
                <table :aria-label="text('dailyData')">
                  <thead><tr><th>{{ text('date') }}</th><th>{{ text('sales') }}</th><th>{{ text('refunds') }}</th><th>{{ text('netSales') }}</th></tr></thead>
                  <tbody>
                    <tr v-for="day in activeDailyRows" :key="day.date"><td>{{ day.date }}</td><td>{{ usd(day.sales, locale) }}</td><td class="refund">{{ usd(day.refunds, locale) }}</td><td>{{ usd(day.netSales, locale) }}</td></tr>
                    <tr v-if="!activeDailyRows.length"><td colspan="4" class="empty">{{ text('dailyEmpty') }}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </template>
      <p v-else-if="optionsLoaded && !employees.length" class="empty">{{ text('noEmployees') }}</p>
    </LoadingRegion>
    <section v-if="report" class="personal-orders" :aria-label="text('orderDetails')">
      <header><h3>{{ text('orderDetails') }}</h3><span class="muted">{{ t('personalPerformance.count', { count: report.orders.total }) }}</span></header>
      <p v-if="pageError" class="error" role="alert">{{ pageError }}</p>
      <LoadingRegion :loading="ordersLoading">
        <div class="table-wrap">
          <table :aria-label="text('orderDetails')">
            <thead><tr><th v-for="key in ['date', 'orderId', 'customer', 'phone', 'channel', 'payment', 'orderAmount', 'share', 'myAmount']" :key="key">{{ text(key) }}</th></tr></thead>
            <tbody>
              <tr v-for="order in report.orders.list" :key="order.id">
                <td>{{ order.date }}</td><td>{{ order.orderId }}<small>{{ text(order.kind) }}<span v-if="order.refund" class="refund"> · {{ text('refund') }}</span></small></td>
                <td>{{ order.customer || '—' }}</td><td>{{ order.phone || '—' }}</td><td>{{ order.channel || '—' }}</td>
                <td>{{ order.paymentMethod || '—' }}<small>{{ order.account || '—' }}</small></td>
                <td class="amount" :class="{ refund: order.refund }">{{ order.orderAmount === null ? text('missingRate') : usd(order.orderAmount, locale) }}</td>
                <td class="amount">{{ percent(order.sharePercent) }}</td>
                <td class="amount" :class="{ refund: order.refund }"><strong>{{ order.myAmount === null ? text('missingRate') : usd(order.myAmount, locale) }}</strong></td>
              </tr>
              <tr v-if="!report.orders.list.length"><td colspan="9" class="empty">{{ text('noData') }}</td></tr>
            </tbody>
          </table>
        </div>
        <ApiPagination :total="report.orders.total" :page="report.orders.page" :size="report.orders.per_page" :loading="ordersLoading" @change="changePage" />
      </LoadingRegion>
    </section>
  </section>
</template>

<style scoped>
.personal-performance { margin-top: 24px; }
.personal-performance > header > span { font-size: 12px; }
.personal-filters { padding-bottom: 18px; border-bottom: 1px solid var(--line); }
.personal-filters select, .personal-filters input { height: 38px; }
.personal-filters select { min-width: 125px; }
.month-control { display: flex; align-items: flex-end; gap: 8px; }
.month-control button { height: 38px; min-width: 36px; padding: 3px 10px; font-size: 22px; }
.month-control label { text-align: center; }
.calculation-note { font-size: 12px; line-height: 1.8; padding-bottom: 12px; }
.performance-grid { display: grid; grid-template-columns: minmax(270px, .85fr) minmax(0, 2fr); gap: 22px; }
.performance-summary { background: var(--workbench-card-background); border: 1px solid var(--line); border-radius: 10px; padding: 20px; }
.performance-summary h3 { display: flex; align-items: center; justify-content: space-between; }
.performance-summary h3 small { font-size: 12px; color: var(--muted); }
.performance-summary dl { margin: 0; }
.performance-summary dl > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.performance-summary dt { color: var(--muted); font-size: 13px; }
.performance-summary dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.performance-summary .emphasis dd { color: var(--blue); font-size: 18px; }
.performance-summary .commission dd { color: var(--green); }
.performance-visuals { min-width: 0; }
.performance-chart { padding: 16px; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 22px; }
.daily-table { max-height: 285px; }
.daily-table th { position: sticky; top: 0; z-index: 1; }
.daily-table td { font-variant-numeric: tabular-nums; }
.personal-orders { margin-top: 24px; padding-top: 22px; border-top: 1px solid var(--line); }
.personal-orders header { margin-bottom: 12px; }
.personal-orders h3 { margin: 0; }
.personal-orders small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
.personal-orders .amount { white-space: nowrap; font-variant-numeric: tabular-nums; }
.refund { color: var(--red); }
.data-warning { padding: 12px; border: 1px solid var(--el-color-warning); border-radius: 8px; color: var(--el-color-warning); }
@media (max-width: 1100px) { .performance-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .performance-chart, .performance-summary { padding: 12px; } .personal-filters > label { flex: 1 1 145px; } }
</style>
