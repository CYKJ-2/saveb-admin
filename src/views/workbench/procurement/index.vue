<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { useBusinessLocale } from '@/composables/useBusinessLocale'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench, money } from '../shared/useWorkbench'
import '../shared/legacy.css'

const { t } = useI18n()
const { businessLabel } = useBusinessLocale()
const { can, loading, error, run } = useWorkbench('procurement')
const { loading: sourceLoading, error: sourceError, run: runSource } = useWorkbench('procurement')
const { loading: logsLoading, error: logsError, run: runLogs } = useWorkbench('procurement')
const labels = computed<Row>(() => ({
  pending_purchase: t('pages.pendingPurchase'),
  supplier_shipping_pending: t('pages.waitingSupplierShipment'),
  warehouse_arrived: t('pages.arrivedWarehouse'),
  exchange_in_progress: t('pages.exchanging'),
  return_in_progress: t('pages.returning'),
  customer_confirm_pending: t('pages.awaitingCustomerConfirmation'),
  shipped: t('pages.shipped'),
}))

const filters = reactive({ keyword: '', status: '', startDate: '', endDate: '', page: 1, per_page: 20 })
const appliedFilters = reactive({ ...filters })
const rows = ref<Row[]>([])
const total = ref(0)
const statistics = ref<Row>({ total: 0, statuses: {} })
const editing = ref<Row | null>(null)
const logs = ref<Row[] | null>(null)
const logPage = ref(1), logSize = ref(20), logTotal = ref(0)
const selectingOrder = ref(false)
const sourceFilters = reactive({ keyword: '', page: 1, per_page: 20, available_only: 1 })
const sourceKeyword = ref('')
const sourceRows = ref<Row[]>([])
const sourceTotal = ref(0)
const availableOrders = computed(() => sourceRows.value)
const logistics = ref<Row | null>(null)
const logisticsError = ref('')
const logisticsSubmitting = ref(false)
const logisticsJobId = ref('')
const logisticsBusy = computed(() => logisticsSubmitting.value || ['queued', 'running', 'retrying'].includes(logistics.value?.job?.status))
const trackingStates = computed<Row>(() => ({
  pending: t('pages.logisticsPending'), in_transit: t('pages.logisticsInTransit'),
  out_for_delivery: t('pages.logisticsOutForDelivery'), delivered: t('pages.logisticsDelivered'),
  exception: t('pages.logisticsException'), expired: t('pages.logisticsExpired'), unknown: t('pages.logisticsUnknown'),
}))
let logisticsTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let lastFinishedJob = ''
let requestId = ''
let requestTarget = ''

async function loadLogistics() {
  if (!can('list') || disposed) return
  try {
    const result = await workbench.get('/procurement/logistics/status', logisticsJobId.value ? { jobId: logisticsJobId.value } : undefined)
    if (disposed) return
    logistics.value = result
    logisticsError.value = ''
    const job = result.job
    if (job && ['succeeded', 'failed', 'partial_failed', 'cancelled'].includes(job.status) && lastFinishedJob !== job.jobId) {
      lastFinishedJob = job.jobId
      logisticsJobId.value = ''
      await load()
    }
  } catch (failure: any) {
    if (!disposed) logisticsError.value = failure.message || t('pages.logisticsUnavailable')
  }
}

function pollLogistics() {
  if (disposed) return
  logisticsTimer = setTimeout(async () => { await loadLogistics(); pollLogistics() }, logisticsBusy.value ? 5000 : 30000)
}

async function refreshLogistics(row?: Row) {
  if (logisticsBusy.value) return
  const target = row?.id ? String(row.id) : 'all'
  if (!requestId || requestTarget !== target) { requestId = crypto.randomUUID(); requestTarget = target }
  logisticsSubmitting.value = true
  logisticsError.value = ''
  try {
    const job = await workbench.post('/procurement/logistics/refresh', { requestId, taskId: row?.id || null, provider: 'auto' })
    logisticsJobId.value = job.jobId
    requestId = ''
    if (logistics.value) logistics.value = { ...logistics.value, job }
    await loadLogistics()
  } catch (failure: any) {
    logisticsError.value = failure.message || t('pages.logisticsUnavailable')
  } finally { logisticsSubmitting.value = false }
}

function load() {
  return run(
    () => Promise.all([
      can('list') ? workbench.get('/procurement', { ...appliedFilters, page: filters.page, per_page: filters.per_page }) : { list: [], total: 0, page: 1 },
      can('statistics') ? workbench.get('/procurement/statistics', appliedFilters) : { total: 0, statuses: {} },
    ]),
    ([result, stats]) => {
      rows.value = result.list
      filters.page = result.page
      total.value = result.total
      statistics.value = stats
    },
  )
}

function search() {
  Object.assign(appliedFilters, filters)
  filters.page = 1
  load()
}

function createDraft(row?: Row): Row {
  const products = row?.products?.length
    ? row.products
    : row?.productName ? [{ name: row.productName, quantity: row.quantity || 1 }] : []
  return {
    id: null,
    version: 0,
    sourceKey: '',
    purchaseStatus: 'pending_purchase',
    supplier: '',
    cost: null,
    eta: '',
    trackingNumber: '',
    trackingCarrier: '',
    trackingPhone: '',
    notes: '',
    ...row,
    products: products.map((product: Row) => ({ name: product.name, quantity: product.quantity })),
  }
}

function edit(row: Row) {
  selectingOrder.value = false
  error.value = ''
  editing.value = createDraft(row)
}

function createTask() {
  selectingOrder.value = true
  editing.value = createDraft()
  sourceRows.value = []
  sourceTotal.value = 0
  sourceFilters.keyword = ''
  sourceKeyword.value = ''
  sourceFilters.page = 1
  loadSourceOrders()
}

function loadSourceOrders() {
  return runSource(() => workbench.get('/procurement', { ...sourceFilters, keyword: sourceKeyword.value }), (result) => {
    sourceRows.value = result.list
    sourceFilters.page = result.page
    sourceTotal.value = result.total
  })
}

function searchSourceOrders() {
  sourceKeyword.value = sourceFilters.keyword
  sourceFilters.page = 1
  loadSourceOrders()
}

function selectSourceOrder(event: Event) {
  const sourceKey = (event.target as HTMLSelectElement).value
  editing.value = createDraft(availableOrders.value.find(row => row.sourceKey === sourceKey))
}

async function save() {
  const row = editing.value
  if (!row?.products.length) return
  row.productName = row.products.map((product: Row) => product.name).join(' / ')
  row.quantity = row.products.reduce((sum: number, product: Row) => sum + Number(product.quantity), 0)
  await run(
    () => row.id ? workbench.put('/procurement/' + row.id, row) : workbench.post('/procurement', row),
    () => { editing.value = null },
  )
  if (!error.value) load()
}

async function remove(row: Row) {
  if (!window.confirm(t('pages.removeProcurementTask', { p0: row.orderId }))) return
  await run(
    () => row.id
      ? workbench.remove('/procurement/' + row.id, row.version)
      : workbench.remove('/procurement/source', 0, { sourceKey: row.sourceKey }),
    () => {},
  )
  if (!error.value) load()
}

function loadLogs() {
  runLogs(() => workbench.get('/procurement/logs', { page: logPage.value, per_page: logSize.value }), data => { logs.value = data.data; logTotal.value = data.total })
}
function showLogs() {
  logPage.value = 1
  loadLogs()
}

onMounted(() => { load(); loadLogistics().finally(pollLogistics) })
onUnmounted(() => { disposed = true; if (logisticsTimer) clearTimeout(logisticsTimer) })
</script>
<template>
  <main class="legacy-workbench">
    <header>
      <div>
        <h1>{{ t('pages.purchasingWorkbench') }}</h1>
        <p class="muted">{{ t('pages.procurementFollowUpForCompletedOrdersManualEntriesAnd') }}</p>
      </div>
      <div class="toolbar">
        <button v-if="can('create') && can('list')" class="primary" @click="createTask">{{ t('pages.createPurchaseTask') }}</button>
        <button @click="load">{{ t('pages.refresh') }}</button>
        <button v-if="can('logistics') && can('list')" :disabled="logisticsBusy || !logistics?.configured" @click="refreshLogistics()">{{ logisticsBusy ? t('pages.logisticsRefreshing') : t('pages.logisticsRefresh') }}</button>
        <button v-if="can('logs')" @click="showLogs">{{ t('pages.operationLogs') }}</button>
        <button v-if="can('export') && can('list')" @click="workbench.download('/procurement/export', t('pages.procurementOrdersCsv'), appliedFilters)">{{ t('pages.exportOrders') }}</button>
      </div>
    </header>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <p v-if="logisticsError" class="error" role="alert">{{ logisticsError }}</p>
    <section v-if="can('list') && logistics" class="panel" aria-live="polite">
      <p v-if="!logistics.configured" class="muted">{{ t('pages.logisticsNotConfigured') }}</p>
      <template v-else>
        <p class="muted">{{ logistics.provider === 'aftership' ? 'AfterShip' : t('pages.logisticsKuaidi100') }} · {{ logistics.autoEnabled ? t('pages.logisticsAutoInterval', { minutes: logistics.intervalMinutes, batch: logistics.batchSize }) : t('pages.logisticsAutoDisabled') }}</p>
        <p v-if="logistics.job">
          {{ logisticsBusy ? t('pages.logisticsRefreshing') : logistics.job.status === 'succeeded' ? t('pages.logisticsSuccess') : t('pages.logisticsFailure') }}
          · {{ t('pages.logisticsProgress', { completed: Number(logistics.job.completed) + Number(logistics.job.failed), total: logistics.job.total, updated: logistics.job.updated, failed: logistics.job.failed, skipped: logistics.job.skipped }) }}
        </p>
      </template>
    </section>
    <div v-if="can('statistics')" class="cards">
      <button class="card" :class="{ active: !filters.status }" @click="filters.status = ''; search()">
        {{ t('pages.validOrders') }}
        <b>{{ statistics.total }}</b>
      </button>
      <button v-for="(label, status) in labels" :key="status" class="card" :class="{ active: filters.status === status }" @click="filters.status = status; search()">
        {{ label }}
        <b>{{ statistics.statuses[status] || 0 }}</b>
      </button>
    </div>
    <section class="panel">
      <form class="toolbar" @submit.prevent="search">
        <label>
          {{ t('pages.search') }}
          <input v-model="filters.keyword" type="search" :placeholder="t('pages.orderCustomerProductOrSupplier')" />
        </label>
        <label>
          {{ t('pages.purchaseStatus') }}
          <select v-model="filters.status">
            <option value="">{{ t('pages.allStatuses') }}</option>
            <option v-for="(label, status) in labels" :key="status" :value="status">{{ label }}</option>
          </select>
        </label>
        <label>
          {{ t('pages.startDate') }}
          <input v-model="filters.startDate" type="date" />
        </label>
        <label>
          {{ t('pages.endDate') }}
          <input v-model="filters.endDate" type="date" />
        </label>
        <button class="primary" :disabled="loading">{{ t('pages.search2') }}</button>
        <button type="button" @click="Object.assign(filters, { keyword: '', status: '', startDate: '', endDate: '' }); search()">{{ t('pages.clear') }}</button>
      </form>
      <LoadingRegion :loading="loading"><div v-if="can('list')" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t('pages.dateOrdered2') }}</th>
              <th>{{ t('pages.orderNumber') }}</th>
              <th>{{ t('pages.customerSource') }}</th>
              <th>{{ t('pages.salesUsd2') }}</th>
              <th>{{ t('pages.item') }}</th>
              <th>{{ t('pages.supplier') }}</th>
              <th>{{ t('pages.cost') }}</th>
              <th>{{ t('pages.expectedArrival') }}</th>
              <th>{{ t('pages.trackingNumber') }}</th>
              <th>{{ t('pages.status') }}</th>
              <th>{{ t('pages.additionalNotes') }}</th>
              <th>{{ t('pages.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.sourceKey">
              <td>{{ row.date }}</td>
              <td>{{ row.orderId }}</td>
              <td>
                {{ row.customer }}
                <p class="muted">{{ row.site }}</p>
              </td>
              <td>{{ money(row.amount) }}</td>
              <td>{{ row.productName }}</td>
              <td>{{ row.supplier || '—' }}</td>
              <td>{{ money(row.cost) }}</td>
              <td>{{ row.eta || '—' }}</td>
              <td>
                {{ row.trackingNumber || '—' }}
                <template v-if="row.trackingNumber">
                  <p>{{ trackingStates[row.deliveryStatus] || t('pages.logisticsUnknown') }}</p>
                  <p v-if="row.trackingCheckpoint" class="muted">{{ row.trackingCheckpoint }}</p>
                  <p v-if="row.trackingLastCheckedAt" class="muted">{{ t('pages.logisticsLastChecked') }} {{ new Date(row.trackingLastCheckedAt).toLocaleString() }}</p>
                  <p v-if="row.trackingError" class="error">{{ t('pages.logisticsQueryError') }}：{{ row.trackingError }}</p>
                  <button v-if="row.id && can('logistics')" :disabled="logisticsBusy || !logistics?.configured" @click="refreshLogistics(row)">{{ t('pages.logisticsQueryOne') }}</button>
                </template>
              </td>
              <td>
                <span class="badge">{{ labels[row.purchaseStatus] }}</span>
              </td>
              <td>{{ row.notes }}</td>
              <td>
                <div class="inline-actions">
                  <button v-if="row.id ? can('update') : can('create')" :disabled="loading" @click="edit(row)">{{ t('pages.edit') }}</button>
                  <button v-if="can('delete')" class="danger" :disabled="loading" @click="remove(row)">{{ t('pages.remove') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length" class="empty">{{ loading ? t('pages.loading2') : t('pages.noMatchingProcurementTasks') }}</p>
      </div>
      <ApiPagination v-model:page="filters.page" v-model:size="filters.per_page" :total="total" :loading="loading" @change="load" /></LoadingRegion>
    </section>
    <div v-if="editing" class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.procurementTask')">
      <form class="editor-content" @submit.prevent="save">
        <header>
          <h2>{{ editing.id ? t('pages.editProcurementTask') : t('pages.createPurchaseTask') }}</h2>
          <button type="button" @click="editing = null">{{ t('pages.close') }}</button>
        </header>
        <p v-if="error" class="error">{{ localizePageMessage(error) }}</p>
        <p class="muted">{{ t('pages.orderNumber2', { p0: (editing.orderId || t('pages.generatedAfterSaving')) }) }}</p>
        <div class="form-grid">
          <section v-if="selectingOrder" class="wide panel">
            <h3>{{ t('pages.procurementSelectOrder') }}</h3>
            <p class="muted">{{ t('pages.procurementSelectOrderHint') }}</p>
            <div class="toolbar">
              <label>
                {{ t('pages.search') }}
                <input v-model="sourceFilters.keyword" type="search" :placeholder="t('pages.orderCustomerProductOrSupplier')" @keydown.enter.prevent="searchSourceOrders" />
              </label>
              <button type="button" :disabled="sourceLoading" @click="searchSourceOrders">{{ t('pages.search2') }}</button>
            </div>
            <p v-if="sourceError" class="error" role="alert">{{ localizePageMessage(sourceError) }}</p><LoadingRegion :loading="sourceLoading"><label>
              {{ t('pages.procurementSelectOrder') }}
              <select :value="editing.sourceKey" required :disabled="sourceLoading" @change="selectSourceOrder">
                <option value="">{{ t('pages.procurementSelectOrder') }}</option>
                <option v-for="order in availableOrders" :key="order.sourceKey" :value="order.sourceKey">{{ order.orderId }} · {{ order.productName }}</option>
              </select>
            </label>
            <p v-if="!availableOrders.length && !sourceLoading" class="muted">{{ t('pages.noMatchingProcurementTasks') }}</p>
            <ApiPagination v-model:page="sourceFilters.page" v-model:size="sourceFilters.per_page" :total="sourceTotal" :loading="sourceLoading" @change="loadSourceOrders" /></LoadingRegion>
          </section>
          <section class="wide panel procurement-products" :aria-label="t('pages.procurementItems')">
            <h3>{{ t('pages.procurementItems') }}</h3>
            <p class="muted">{{ t('pages.procurementItemsReadonly') }}</p>
            <div v-if="editing.products.length" class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{{ t('pages.productName') }}</th>
                    <th class="numeric">{{ t('pages.quantity') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in editing.products" :key="index">
                    <td>{{ product.name }}</td>
                    <td class="numeric">{{ product.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="muted">{{ t('pages.procurementSelectOrderHint') }}</p>
          </section>
          <label>
            {{ t('pages.purchaseStatus') }}
            <select v-model="editing.purchaseStatus" :disabled="!!editing.warehouseId">
              <option v-for="(label, key) in labels" :key="key" :value="key" :disabled="key === 'shipped' && !editing.warehouseId">{{ label }}</option>
            </select>
          </label>
          <label>
            {{ t('pages.supplier') }}
            <input v-model="editing.supplier" />
          </label>
          <label>
            {{ t('pages.purchaseCost') }}
            <input v-model="editing.cost" type="number" min="0" step="0.01" />
          </label>
          <label>
            {{ t('pages.expectedArrival') }}
            <input v-model="editing.eta" type="date" />
          </label>
          <label>
            {{ t('pages.carrier') }}
            <input v-model="editing.trackingCarrier" />
          </label>
          <label>
            {{ t('pages.trackingNumber') }}
            <input v-model="editing.trackingNumber" />
          </label>
          <label>
            {{ t('pages.carrierPhone') }}
            <input v-model="editing.trackingPhone" />
          </label>
          <label class="wide">
            {{ t('pages.additionalNotes') }}
            <textarea v-model="editing.notes" rows="3" />
          </label>
        </div>
        <p class="muted">{{ t('pages.savingAsArrivedAtWarehouseSendsTheTaskTo') }}</p>
        <button class="primary" :disabled="loading || !editing.products.length">{{ t('pages.saveTask') }}</button>
      </form>
    </div>
    <div v-if="logs" class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.procurementOperationLogs')">
      <section class="editor-content">
        <header>
          <h2>{{ t('pages.recentOperationLogs') }}</h2>
          <button @click="logs = null">{{ t('pages.close') }}</button>
        </header>
        <button v-if="can('export')" @click="workbench.download('/procurement/logs/export', t('pages.procurementLogsCsv'))">{{ t('pages.exportAllLogs') }}</button>
        <p v-if="logsError" class="error" role="alert">{{ localizePageMessage(logsError) }}</p><LoadingRegion :loading="logsLoading"><div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('pages.time') }}</th>
                <th>{{ t('pages.action2') }}</th>
                <th>{{ t('pages.record') }}</th>
                <th>{{ t('pages.operator') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td>{{ log.created_at }}</td>
                <td>{{ businessLabel(log.action) }}</td>
                <td>{{ log.entity_id }}</td>
                <td>{{ log.operator || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      <ApiPagination v-model:page="logPage" v-model:size="logSize" :total="logTotal" :loading="logsLoading" @change="loadLogs" /></LoadingRegion>
      </section>
    </div>
  </main>
</template>
