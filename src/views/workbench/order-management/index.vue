<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { localizePageMessage } from '@/lang/page-message'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'
import { orderManagementApi as api, type Metric, type OrderRow, type Totals } from '@/api/order-management'
import SalesChart from '@/components/business/SalesTrendChart.vue'
import OrderEditor from './OrderEditor.vue'
import OrderTable from './OrderTable.vue'
import OfflineOrders from './OfflineOrders.vue'
import { businessDate } from '@/api/dashboard'
import { useSalesTrendPeriod } from '@/composables/useSalesTrendPeriod'
import '../shared/workbench-theme.css'
import './appearance.css'

const user = useUserStore()
const can = (code: string) => user.hasPermission(`system.order.${code}`)
const dateRange = ref<[string, string]>([businessDate(), businessDate()])
const { granularity, trendPeriod, trendRange } = useSalesTrendPeriod()
const staffPeriod = ref<'day' | 'month'>('day')
const staffDate = ref(businessDate())
const staffMonth = ref(businessDate().slice(0, 7))
const staffRange = computed(() => period(staffPeriod.value === 'month' ? staffMonth.value : staffDate.value, staffPeriod.value === 'month'))
const totals = ref<Totals>({ orders: 0, items: 0, amountUsd: 0, missingRates: 0 })
const modules = ['overview', 'currencies', 'sales-trend', 'categories', 'staff']
const metrics = reactive<Record<string, Metric[]>>({})
const loading = reactive<Record<string, boolean>>({})
const errors = reactive<Record<string, string>>({})
const versions: Record<string, number> = {}
const categories = computed<Record<string, string>>(() => ({ official: t('pages.officialSites'), top_influencer: t('pages.topInfluencer'), mid_influencer: t('pages.midTierInfluencers'), offline: t('pages.paymentLinkOrders'), invoice: t('pages.invoiceOrders'), unmatched: t('pages.unmatched') }))
const money = (value: number | null | undefined) => value == null ? t('pages.notConverted') : value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function period(value: string, month = false) {
  const date = dayjs(value)
  return { startDate: date.startOf(month ? 'month' : 'day').format('YYYY-MM-DD'), endDate: date.endOf(month ? 'month' : 'day').format('YYYY-MM-DD') }
}
async function loadModule(module: string) {
  if (!can(`statistics.${module}`)) return
  const version = versions[module] = (versions[module] || 0) + 1
  loading[module] = true; errors[module] = ''
  const params = module === 'sales-trend' ? trendRange.value : module === 'staff' ? staffRange.value : { startDate: dateRange.value[0], endDate: dateRange.value[1] }
  try {
    const result = await api.statistics<Totals | { list: Metric[] }>(module, { ...params, granularity: granularity.value })
    if (version !== versions[module]) return
    if (module === 'overview') totals.value = result as Totals
    else metrics[module] = (result as { list: Metric[] }).list
  } catch (e: any) { if (version === versions[module]) { errors[module] = e.message || t('pages.loadFailed'); metrics[module] = []; if (module === 'overview') totals.value = { orders: 0, items: 0, amountUsd: 0, missingRates: 0 } } }
  finally { if (version === versions[module]) loading[module] = false }
}
function refreshStats() { return Promise.all(modules.map(loadModule)) }
type RecentOrderMode = 'completed' | 'pending' | 'testing'
const tab = ref<RecentOrderMode>('completed')
const recentModes = computed<RecentOrderMode[]>(() => can('testing') ? ['completed', 'pending', 'testing'] : ['completed', 'pending'])
const recent = ref<OrderRow[]>([])
const recentTotal = ref(0)
const recentPage = ref(1)
const recentSize = ref(20)
const recentBusy = ref(false)
const recentError = ref('')
let recentVersion = 0
async function loadRecent() {
  if (!can('list')) return
  const version = ++recentVersion; recentBusy.value = true; recentError.value = ''
  try {
    const result = await api.list({ startDate: dateRange.value[0], endDate: dateRange.value[1], orderStatus: tab.value === 'testing' ? '' : tab.value, scope: tab.value === 'testing' ? 'testing' : 'normal', page: recentPage.value, per_page: recentSize.value })
    if (version === recentVersion) { recent.value = result.list; recentTotal.value = result.total; recentPage.value = result.page }
  } catch (e: any) { if (version === recentVersion) { recent.value = []; recentError.value = e.message || t('pages.loadFailed') } }
  finally { if (version === recentVersion) recentBusy.value = false }
}
function selectRecentMode(mode: RecentOrderMode) {
  if (tab.value === mode || recentBusy.value) return
  tab.value = mode
  recentPage.value = 1
  loadRecent()
}
function refresh() { refreshStats(); recentPage.value = 1; loadRecent() }
function shiftDate(days: number) { dateRange.value = dateRange.value.map(d => dayjs(d).add(days, 'day').format('YYYY-MM-DD')) as [string, string]; refresh() }
const filters = reactive<Record<string, string>>({ customerService: '', customerName: '', orderId: '', paypalOrderId: '', paypalAccount: '', website: '', orderStatus: '', classification: '', influencer: '' })
const searchRange = ref<string[]>([businessDate(), businessDate()])
const searchDatePopperOptions = { modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { altAxis: false } }] }
const applied = ref<Record<string, unknown>>({})
const results = ref<OrderRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const busy = ref(false)
const searchError = ref('')
const searched = ref(false)
const exporting = ref(false)
const resultPanel = ref<HTMLElement>()
let searchVersion = 0
async function loadResults() {
  if (!can('list')) return
  const version = ++searchVersion; busy.value = true; searchError.value = ''; searched.value = true
  try {
    const result = await api.list({ ...applied.value, page: page.value, per_page: pageSize.value })
    if (version === searchVersion) { results.value = result.list; total.value = result.total; page.value = result.page }
  } catch (e: any) { if (version === searchVersion) { results.value = []; searchError.value = e.message || t('pages.searchFailed') } }
  finally { if (version === searchVersion) busy.value = false }
}
function search() { applied.value = { ...filters, startDate: searchRange.value?.[0], endDate: searchRange.value?.[1] }; page.value = 1; loadResults() }
function clearSearch() { Object.keys(filters).forEach(k => filters[k] = ''); searchRange.value = [businessDate(), businessDate()]; search() }
function drill(filter: Record<string, string>, range = { startDate: dateRange.value[0], endDate: dateRange.value[1] }) {
  if (!can('list')) return
  Object.keys(filters).forEach(k => filters[k] = ''); Object.assign(filters, { orderStatus: 'completed' }, filter)
  searchRange.value = [range.startDate, range.endDate]
  applied.value = { ...filters, ...range, staffExact: filter.customerService ? 1 : 0, influencerExact: filter.influencer ? 1 : 0 }
  page.value = 1; loadResults(); resultPanel.value?.scrollIntoView({ behavior: 'smooth' })
}
function drillTrend(date: string, classification: string) {
  drill({ classification }, period(date, granularity.value === 'month'))
}
async function download() {
  exporting.value = true
  try {
    const blob = await api.export({ ...applied.value, locale: locale.value })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = t('pages.orderSearchCsv'); anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally { exporting.value = false }
}
const editing = ref<OrderRow | null>(null)
function edit(row: OrderRow) {
  editing.value = row
}
async function saved() {
  editing.value = null
  // 保存后按已应用的条件和当前页重新查询，两处订单列表和统计同步更新。
  await Promise.all([refreshStats(), loadRecent(), ...(searched.value ? [loadResults()] : [])])
}
onMounted(refresh)
</script>

<template>
  <div class="order-dashboard workbench-theme">
    <div class="page-heading"><div><h1>{{ t('pages.orderManagement') }}</h1><p>{{ t('pages.salesStatisticsOrderSearchAndSalesAssociateAllocation') }}</p></div><el-button @click="refresh">{{ t('pages.refresh') }}</el-button></div>
    <section class="panel toolbar"><el-button @click="shiftDate(-1)">{{ t('pages.previousDay') }}</el-button><el-date-picker popper-class="order-workbench-popper workbench-theme" v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :start-placeholder="t('pages.startDate')" :end-placeholder="t('pages.endDate')" /><el-button @click="shiftDate(1)">{{ t('pages.nextDay') }}</el-button><el-button type="primary" @click="refresh">{{ t('pages.applyDates') }}</el-button><span class="muted">{{ t('pages.statisticsUseBeijingTimeHeadlineMetricsExcludeInvoiceAnd') }}</span></section>
    <el-alert v-if="!modules.some(m => can(`statistics.${m}`)) && !can('list')" :title="t('pages.noAccessToStatisticsOrOrderSearchAssignThe')" type="info" :closable="false" />
    <template v-if="can('statistics.overview')">
      <el-alert v-if="errors.overview" :title="localizePageMessage(errors.overview)" type="error" />
      <div class="kpis" v-loading="loading.overview"><section class="panel"><p>{{ t('pages.completedOrders') }}</p><strong>{{ totals.orders.toLocaleString() }}</strong></section><section class="panel"><p>{{ t('pages.itemsSold') }}</p><strong>{{ totals.items.toLocaleString() }}</strong></section><section class="panel"><p>{{ t('pages.salesUsd3') }}</p><strong>{{ money(totals.amountUsd) }}</strong></section></div>
      <el-alert v-if="totals.missingRates" :title="t('pages.ordersLackAnAvailableExchangeRateAndAreExcluded', { p0: (totals.missingRates) })" type="warning" :closable="false" />
    </template>
    <section v-if="can('statistics.currencies')" class="panel" v-loading="loading.currencies"><el-collapse><el-collapse-item :title="t('pages.salesByCurrency')" name="currency"><el-alert v-if="errors.currencies" :title="localizePageMessage(errors.currencies)" type="error" /><el-table :data="metrics.currencies || []"><el-table-column prop="key" :label="t('pages.currency')" /><el-table-column :label="t('pages.originalAmount')"><template #default="{ row }">{{ money(row.amountOriginal) }}</template></el-table-column><el-table-column :label="t('pages.convertedUsd')"><template #default="{ row }">{{ money(row.amountUsd) }}</template></el-table-column><el-table-column :label="t('pages.effectiveConversionRate')"><template #default="{ row }">{{ row.amountOriginal ? (row.amountUsd / row.amountOriginal).toFixed(6) : '—' }}</template></el-table-column></el-table><p class="muted">{{ t('pages.storedUsdAmountsAreUsedWhenAvailableOtherwiseThe') }}</p></el-collapse-item></el-collapse></section>
    <section v-if="can('statistics.sales-trend')" class="panel" v-loading="loading['sales-trend']">
      <div class="section-heading">
        <div><h2>{{ t('pages.salesTrend') }}</h2><p class="muted">{{ t('pages.trendPeriodHint', trendRange) }}</p></div>
        <div class="toolbar">
          <el-radio-group v-model="granularity" @change="loadModule('sales-trend')">
            <el-radio-button value="day">{{ t('pages.daily') }}</el-radio-button>
            <el-radio-button value="month">{{ t('pages.monthly') }}</el-radio-button>
          </el-radio-group>
          <el-date-picker popper-class="order-workbench-popper workbench-theme" :key="granularity" v-model="trendPeriod" :type="granularity === 'day' ? 'month' : 'year'" :value-format="granularity === 'day' ? 'YYYY-MM' : 'YYYY'" :format="granularity === 'day' ? 'YYYY-MM' : 'YYYY'" :aria-label="t(granularity === 'day' ? 'pages.trendMonth' : 'pages.trendYear')" :clearable="false" style="width:140px" @change="loadModule('sales-trend')" />
        </div>
      </div>
      <el-alert v-if="errors['sales-trend']" :title="localizePageMessage(errors['sales-trend'])" type="error" />
      <SalesChart appearance="workbench" :rows="metrics['sales-trend'] || []" @select="drillTrend" />
    </section>
    <div v-if="can('statistics.categories') || can('statistics.staff')" class="stat-grid">
      <section v-if="can('statistics.categories')" class="panel" v-loading="loading.categories"><h2>{{ t('pages.salesCategory') }}</h2><el-alert v-if="errors.categories" :title="localizePageMessage(errors.categories)" type="error" /><el-table :data="metrics.categories || []" @row-click="row => drill({ classification: row.key })"><el-table-column :label="t('pages.category')" min-width="120"><template #default="{ row }"><el-button link :type="can('list') ? 'primary' : 'default'">{{ categories[row.key] || row.key }}</el-button></template></el-table-column><el-table-column prop="orders" :label="t('pages.order')" /><el-table-column prop="items" :label="t('pages.items')" /><el-table-column label="USD" min-width="100"><template #default="{ row }">{{ money(row.amountUsd) }}</template></el-table-column><el-table-column :label="t('pages.share')"><template #default="{ row }">{{ row.share }}%</template></el-table-column></el-table></section>
      <OfflineOrders v-if="can('statistics.staff')" v-model:mode="staffPeriod" v-model:date="staffDate" v-model:month="staffMonth" :rows="metrics.staff || []" :loading="!!loading.staff" :error="errors.staff" :can-search="can('list')" @change="loadModule('staff')" @select="staff => drill({ customerService: staff, classification: 'offline' }, staffRange)" />
    </div>
    <section v-if="can('list')" class="panel" v-loading="recentBusy">
      <h2>{{ t('pages.recentOrders') }}</h2>
      <div class="recent-order-filters" role="group" :aria-label="t('pages.recentOrders')">
        <button
          v-for="mode in recentModes" :key="mode" type="button"
          class="recent-order-filter" :class="{ active: tab === mode }"
          :aria-pressed="tab === mode" :disabled="recentBusy"
          @click="selectRecentMode(mode)"
        >{{ t(`pages.recentOrderFilters.${mode}`) }}</button>
      </div>
      <el-alert v-if="recentError" :title="localizePageMessage(recentError)" type="error" />
      <OrderTable :rows="recent" :categories="categories" :can-edit="can('update')" @edit="edit" />
      <ApiPagination v-model:page="recentPage" v-model:size="recentSize" :total="recentTotal" :loading="recentBusy" @change="loadRecent" />
    </section>
    <section v-if="can('list')" ref="resultPanel" class="panel"><h2>{{ t('pages.orderSearch') }}</h2><el-form label-position="top" @submit.prevent="search"><div class="filters"><el-form-item v-for="(label, key) in { customerService: t('pages.salesAssociate'), customerName: t('pages.customerName'), orderId: t('pages.orderNumber'), paypalOrderId: t('pages.paypalOrderId'), paypalAccount: t('pages.receivingPaypal'), website: t('pages.sourceSite'), influencer: t('pages.influencer') }" :key="key" :label="label"><el-input v-model="filters[key]" clearable @keyup.enter="search" /></el-form-item><el-form-item :label="t('pages.orderStatus')"><el-select popper-class="order-workbench-popper workbench-theme" v-model="filters.orderStatus" clearable><el-option v-for="(label, value) in { completed: t('pages.completed'), pending: t('pages.pending'), reversed: t('pages.reversed'), refunded: t('pages.refunded'), failed: t('pages.failed2'), expired: t('pages.expired') }" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item :label="t('pages.salesCategory')"><el-select popper-class="order-workbench-popper workbench-theme" v-model="filters.classification" clearable><el-option v-for="(label, value) in categories" :key="value" :label="label" :value="value" /></el-select></el-form-item></div>
      <div class="search-actions">
        <el-form-item class="search-date-field" :label="t('pages.orderQueryTimeRange')" :title="t('pages.orderQueryTimeRange')">
          <el-date-picker
            v-model="searchRange" type="daterange" value-format="YYYY-MM-DD"
            :start-placeholder="t('pages.startDateOptional')" :end-placeholder="t('pages.endDateOptional')"
            placement="bottom-start" :popper-options="searchDatePopperOptions"
            popper-class="order-workbench-popper workbench-theme"
          />
        </el-form-item>
        <div class="toolbar search-buttons">
          <el-button type="primary" :loading="busy" @click="search">{{ t('pages.search2') }}</el-button>
          <el-button @click="clearSearch">{{ t('pages.clearFilters') }}</el-button>
          <el-button v-if="can('export')" :disabled="!searched || busy || !!searchError" :loading="exporting" @click="download">{{ t('pages.exportAllResults') }}</el-button>
        </div>
      </div>
    </el-form>
      <el-alert v-if="searchError" :title="localizePageMessage(searchError)" type="error" /><el-empty v-if="!searched" :description="t('pages.enterSearchFiltersOrSelectAStatisticsModuleTo')" />
      <template v-else><OrderTable v-loading="busy" :rows="results" :categories="categories" :can-edit="can('update')" @edit="edit" /><ApiPagination v-model:page="page" v-model:size="pageSize" :total="total" :loading="busy" @change="loadResults" /></template>
    </section>
    <OrderEditor v-if="editing" :key="editing.id" :order="editing" @close="editing = null" @saved="saved" />
  </div>
</template>

<style scoped>
.order-dashboard { padding: 24px; min-height: calc(100vh - 110px); display: flex; flex-direction: column; gap: 18px; font: 14px/1.5 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif; }
.page-heading,.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
h1 { font-size: 26px; margin: 0 0 6px; font-weight: 600; } h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
.page-heading p,.muted { color: var(--muted); font-size: 13px; }
.page-heading p { margin: 8px 0; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 20px; min-width: 0; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }.kpis .panel { background: var(--workbench-card-background); border-radius: 10px; }.kpis p { color: var(--muted); margin: 0 0 10px; }.kpis strong { font-size: 25px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }.stat-grid > :only-child { grid-column: 1 / -1; }.filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 16px; }
.search-actions { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.search-date-field { flex: 0 1 360px; width: 360px; max-width: 100%; min-width: 0; margin-bottom: 0; }
.search-date-field :deep(.el-date-editor) { box-sizing: border-box; flex: none; width: 100%; height: 36px; }
.search-buttons { min-height: 36px; }
.search-buttons :deep(.el-button) { height: 36px; margin-left: 0; }
.recent-order-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.recent-order-filter { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; height: 34px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel-2); color: var(--muted); font: inherit; font-weight: 800; line-height: 1; cursor: pointer; }
.recent-order-filter:hover:not(:disabled) { border-color: var(--workbench-button-border); color: var(--workbench-button-text); }
.recent-order-filter.active { border-color: var(--workbench-blue); background: var(--workbench-button-background); color: var(--workbench-button-text); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--workbench-blue) 22%, transparent); }
.recent-order-filter:focus-visible { outline: 2px solid var(--workbench-blue); outline-offset: 2px; }
.recent-order-filter:disabled { cursor: wait; }
.el-pagination { margin-top: 18px; justify-content: flex-end; }
@media(max-width: 1000px) { .stat-grid { grid-template-columns: 1fr; } .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media(max-width: 640px) { .order-dashboard { padding: 12px; }.kpis,.filters { grid-template-columns: 1fr; }.toolbar :deep(.el-date-editor) { width: 100%; }.panel { padding: 14px; } }
</style>
