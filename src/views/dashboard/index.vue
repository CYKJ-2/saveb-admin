<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { ShoppingCart, Money, Box, TrendCharts, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { businessDate, dashboardModules, getDashboardModule, type DashboardModule, type DashboardRange, type DashboardResult } from '@/api/dashboard'
import ModulePanel from './components/ModulePanel.vue'
import OverviewChart from './components/OverviewChart.vue'
import SalesTrendChart from '@/components/business/SalesTrendChart.vue'
import OverviewRanking from './components/OverviewRanking.vue'
import OverviewCards from './components/OverviewCards.vue'
import CollectorStatus from './components/CollectorStatus.vue'
import { getDashboardTrendPeriod } from './trend-period'

const user = useUserStore(), router = useRouter()
const clock = ref(new Date())
const selected = ref<[string, string]>([businessDate(), businessDate()])
const applied = ref<DashboardRange>({ startDate: selected.value[0], endDate: selected.value[1] })
const granularity = ref<'day' | 'month'>('day')
const trendPeriod = computed(() => getDashboardTrendPeriod(applied.value, granularity.value))
const metric = ref<'sales' | 'orders'>('sales')
interface State { loading: boolean; error: string; result: DashboardResult | null; revision: number }
const states = reactive(Object.fromEntries(dashboardModules.map(module => [module, { loading: false, error: '', result: null, revision: 0 }])) as Record<DashboardModule, State>)
const can = (module: DashboardModule) => user.hasPermission(`dashboard.overview.${module.replaceAll('-', '_')}`)
const visibleModules = computed(() => dashboardModules.filter(can))
const pending = computed(() => visibleModules.value.some(module => states[module].loading))
const data = (module: DashboardModule) => states[module].result?.data
const rows = (module: DashboardModule) => data(module)?.list || []
const money = (value: number | null | undefined) => value == null ? '—' : Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatTime = (value: string | Date | null | undefined) => value ? new Intl.DateTimeFormat(locale.value, { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(new Date(value)) : t('pages.noRecords')
const currentTime = computed(() => formatTime(clock.value))
const rangeText = computed(() => t('pages.to', { p0: (applied.value.startDate), p1: (applied.value.endDate) }))
const overview = computed(() => data('overview'))
const cards = computed(() => overview.value ? [
  { key: 'orders', title: t('pages.completedOrders2'), icon: ShoppingCart, color: '#5b8ff9' },
  { key: 'amountUsd', title: t('pages.completedSalesUsd'), icon: Money, color: '#10b981', prefix: '$' },
  { key: 'items', title: t('pages.itemsSold2'), icon: Box, color: '#f59e0b' },
  { key: 'averageOrderValue', title: t('pages.averageOrderValueUsd'), icon: TrendCharts, color: '#8b5cf6', prefix: '$' },
].map(card => ({ ...card, value: overview.value.current[card.key], totalValue: overview.value.previous[card.key], totalLabel: t('pages.previousEqualPeriod'), trend: overview.value.changes[card.key] ?? undefined })) : [])
const categoryNames = computed<Record<string, string>>(() => ({ official: t('pages.officialSites'), top_influencer: t('pages.topInfluencer'), mid_influencer: t('pages.midTierInfluencers'), offline: t('pages.paymentLinkOrders'), invoice: 'Invoice', unmatched: t('pages.unmatched') }))
const statusNames = computed<Record<string, string>>(() => ({ completed: t('pages.completed'), pending: t('pages.awaitingPayment'), failed: t('pages.failed2'), refunded: t('pages.refunded'), reversed: t('pages.reversed'), chargeback: t('pages.chargeback'), cancelled: t('pages.cancelled'), unknown: t('pages.unknownStatus') }))
const shortcuts = computed(() => ([
  { text: t('pages.today'), value: () => { const day = dayjs(businessDate()).toDate(); return [day, day] } },
  { text: t('pages.yesterday'), value: () => { const day = dayjs(businessDate()).subtract(1, 'day').toDate(); return [day, day] } },
  { text: t('pages.last7Days'), value: () => [dayjs(businessDate()).subtract(6, 'day').toDate(), dayjs(businessDate()).toDate()] },
  { text: t('pages.thisMonth'), value: () => [dayjs(businessDate()).startOf('month').toDate(), dayjs(businessDate()).toDate()] },
]))
async function loadModule(module: DashboardModule) {
  const state = states[module], revision = ++state.revision
  state.result = null; state.error = ''
  if (!can(module)) { state.loading = false; return }
  state.loading = true
  const range = module === 'sales-trend' ? trendPeriod.value.requestRange : applied.value
  try { const result = await getDashboardModule(module, { ...range }, granularity.value); if (revision === state.revision) state.result = result }
  catch (error: any) { if (revision === state.revision) state.error = error.message || t('pages.loadFailedPleaseTryAgain') }
  finally { if (revision === state.revision) state.loading = false }
}
function loadAll() { return Promise.allSettled(dashboardModules.map(loadModule)) }
function apply() {
  if (!selected.value?.[0] || !selected.value?.[1]) { ElMessage.warning(t('pages.selectADateRange')); return }
  if (dayjs(selected.value[1]).diff(dayjs(selected.value[0]), 'day') > 365) { ElMessage.warning(t('pages.theDateRangeCannotExceed366Days')); return }
  applied.value = { startDate: selected.value[0], endDate: selected.value[1] }; loadAll()
}
function today() { selected.value = [businessDate(), businessDate()]; apply() }
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => clock.value = new Date(), 1000); loadAll() })
onBeforeUnmount(() => { clearInterval(timer); dashboardModules.forEach(module => states[module].revision++) })
</script>

<template>
  <main class="overview-page">
    <CollectorStatus @collected="loadAll" />
    <section class="date-toolbar" :aria-label="t('pages.overviewDateFilter')">
      <div class="date-control">
        <span>{{ t('pages.dateRange') }}</span>
        <el-date-picker v-model="selected" type="daterange" value-format="YYYY-MM-DD" format="YYYY-MM-DD" :start-placeholder="t('pages.startDate')" :end-placeholder="t('pages.endDate')" :clearable="false" :shortcuts="shortcuts" :range-separator="t('pages.to2')" @change="apply()" />
      </div>
      <el-button type="primary" :icon="Refresh" :loading="pending" @click="apply()">{{ t('pages.applyRefresh') }}</el-button>
      <el-button @click="today">{{ t('pages.today') }}</el-button>
      <span class="range-note">{{ t('pages.currentDataRange', { p0: (rangeText) }) }}</span>
      <div class="toolbar-clock"><span>{{ t('pages.beijingTimeAsiaShanghai') }}</span><time>{{ currentTime }}</time></div>
    </section>
    <el-alert v-if="!visibleModules.length" :title="t('pages.noAccessToOverviewDataAssignOverviewStatisticsPermissions')" type="info" :closable="false" />
    <template v-if="can('overview')">
      <ModulePanel v-if="states.overview.loading || states.overview.error" :title="t('pages.keyMetrics')" :loading="states.overview.loading" :error="states.overview.error" @retry="loadModule('overview')" />
      <template v-else-if="overview"><OverviewCards :cards="cards" /><div class="scope-note">{{ t('pages.keyMetricsCoverCompletedNonInvoiceOrdersInvoiceIs', { p0: (overview.previousRange.startDate), p1: (overview.previousRange.endDate) }) }}</div><el-alert v-if="overview.current.missingRates" :title="t('pages.ordersLackExchangeRatesAndAreExcludedFromSales', { p0: (overview.current.missingRates) })" type="warning" :closable="false" /><div class="payment-strip"><strong>{{ t('pages.paymentStatusIncludingInvoice') }}</strong><span v-for="(count, status) in overview.statuses" :key="status">{{ statusNames[status] || status }} <b>{{ count }}</b></span><span v-if="!overview.allOrders">{{ t('pages.noOrdersForTheSelectedDates') }}</span></div></template>
    </template>
    <div class="overview-grid">
      <ModulePanel v-if="can('sales-trend')" class="full" :title="t('pages.salesTrend')" :subtitle="t('pages.trendPeriodHint', trendPeriod.displayRange)" :loading="states['sales-trend'].loading" :error="states['sales-trend'].error" @retry="loadModule('sales-trend')">
        <template #actions>
          <div class="chart-actions">
            <el-radio-group v-model="granularity" size="small" @change="loadModule('sales-trend')">
              <el-radio-button value="day">{{ t('pages.daily') }}</el-radio-button>
              <el-radio-button value="month">{{ t('pages.monthly') }}</el-radio-button>
            </el-radio-group>
            <el-radio-group v-model="metric" size="small">
              <el-radio-button value="sales">{{ t('pages.sales') }}</el-radio-button>
              <el-radio-button value="orders">{{ t('pages.orderCount') }}</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <SalesTrendChart :rows="rows('sales-trend')" :metric="metric" />
      </ModulePanel>
      <ModulePanel v-if="can('categories')" :title="t('pages.orderCategories')" :subtitle="t('pages.shareOfCompletedSalesInUsd')" :loading="states.categories.loading" :error="states.categories.error" @retry="loadModule('categories')"><OverviewChart v-if="rows('categories').some((row: any) => row.amountUsd > 0)" :rows="rows('categories')" kind="categories" /><el-empty v-else :description="t('pages.noSalesForTheSelectedDates')" :image-size="80" /><div v-for="row in rows('categories')" :key="row.key" class="category-line"><span>{{ t('pages.orders', { p0: (categoryNames[row.key] || row.key), p1: (row.orders) }) }}</span><strong>${{ money(row.amountUsd) }}</strong></div></ModulePanel>
      <ModulePanel v-if="can('staff')" :title="t('pages.offlineSalesAssociatePerformance')" :subtitle="t('pages.sharedOrdersAllocateOrderCountsItemsAndAmountsBy')" :loading="states.staff.loading" :error="states.staff.error" @retry="loadModule('staff')"><OverviewRanking :rows="rows('staff')" :label="t('pages.salesAssociate')" /></ModulePanel>
      <ModulePanel v-if="can('influencers')" :title="t('pages.influencerSalesRanking')" :subtitle="t('pages.topAndMidTierInfluencersSelectedDates')" :loading="states.influencers.loading" :error="states.influencers.error" @retry="loadModule('influencers')"><OverviewRanking :rows="rows('influencers').slice(0, 10)" :label="t('pages.top10Influencers')" /></ModulePanel>
      <ModulePanel v-if="can('recent-orders')" class="full" :title="t('pages.recentOrders')" :subtitle="t('pages.latest10OrdersInTheSelectedRangeIncludingInvoice')" :loading="states['recent-orders'].loading" :error="states['recent-orders'].error" @retry="loadModule('recent-orders')"><template #actions><el-button v-if="user.hasPermission('dashboard.order_management')" link type="primary" @click="router.push('/workbench/order-management')">{{ t('pages.openOrderManagement') }}</el-button></template><el-table :data="rows('recent-orders')" size="small" :empty-text="t('pages.noOrdersForTheSelectedDates')"><el-table-column prop="orderId" :label="t('pages.orderNumber')" min-width="160" /><el-table-column :label="t('pages.beijingTime')" min-width="165"><template #default="{row}">{{ formatTime(row.createTime) }}</template></el-table-column><el-table-column prop="customerFullName" :label="t('pages.customer')" min-width="140" show-overflow-tooltip /><el-table-column :label="t('pages.category')" min-width="110"><template #default="{row}">{{ categoryNames[row.classification] || row.classification }}</template></el-table-column><el-table-column prop="staff" :label="t('pages.salesAssociate')" min-width="100" /><el-table-column :label="t('pages.salesUsd2')" min-width="115" align="right"><template #default="{row}">{{ money(row.amountUsd) }}</template></el-table-column><el-table-column prop="items" :label="t('pages.items')" width="65" align="right" /><el-table-column :label="t('pages.paymentStatus')" width="110"><template #default="{row}"><el-tag size="small" :type="row.paymentStatus === 'completed' ? 'success' : 'info'">{{ statusNames[row.paymentStatus] || row.paymentStatus }}</el-tag></template></el-table-column></el-table></ModulePanel>
    </div>
  </main>
</template>

<style scoped>
.overview-page { color: hsl(var(--foreground)); }
.date-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; background: hsl(var(--card)); padding: 16px; border: 1px solid hsl(var(--border)); border-radius: var(--radius); margin-bottom: 16px; }
.date-control { display: flex; align-items: center; gap: 12px; min-width: 0; }
.date-control > span { font-size: 13px; white-space: nowrap; }
.toolbar-clock { display: grid; gap: 4px; margin-left: auto; text-align: right; font-size: 12px; color: hsl(var(--muted-foreground)); }
.toolbar-clock time { color: hsl(var(--foreground)); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.range-note, .scope-note { font-size: 12px; color: hsl(var(--muted-foreground)); }
.scope-note { margin: 0 0 16px; line-height: 1.8; }
.overview-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.full { grid-column: 1 / -1; }
.payment-strip { display: flex; flex-wrap: wrap; gap: 24px; padding: 16px; margin-bottom: 16px; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); font-size: 13px; }
.payment-strip b { margin-left: 8px; }
.category-line { display: flex; justify-content: space-between; font-size: 12px; gap: 12px; margin: 8px 0; }
.chart-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.overview-page > .el-alert { margin-bottom: 16px; }
@media (max-width: 1250px) {
  .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .overview-grid { grid-template-columns: 1fr; }
  .date-control { width: 100%; flex-direction: column; align-items: start; }
  .date-control :deep(.el-date-editor) { width: 100%; max-width: 100%; }
  .range-note { width: 100%; }
  .toolbar-clock { margin-left: 0; text-align: left; }
}
</style>
