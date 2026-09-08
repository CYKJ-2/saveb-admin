<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { useBusinessLocale } from '@/composables/useBusinessLocale'
import { localizePageMessage } from '@/lang/page-message'
import { workbench, type Row } from '@/api/workbench'
import { businessDate } from '@/api/dashboard'
import { useOrderDetails, type DetailResult } from './use-order-details'
import { number, usd } from './format'

const props = defineProps<{
  initialRange: { startDate: string; endDate: string }
  bounds: Row
  label: (value: string) => string
}>()
const { t, locale } = useI18n()
const { businessLabel } = useBusinessLocale()
const { filters, result, pageSize, loading, error, queried, query, loadPage, reset, invalidate } = useOrderDetails(
  props.initialRange,
  params => workbench.get<DetailResult>('/sa-sales/orders', params),
)
const employees = ref<string[]>([])
const optionsError = ref('')
const categories = ['official', 'top_influencer', 'mid_influencer', 'offline', 'invoice', 'unmatched']
const statuses = [
  ['completed', 'completed'], ['pending', 'awaitingPayment'], ['failed', 'failed2'],
  ['refunded', 'refunded'], ['reversed', 'reversed'], ['chargeback', 'chargeback'],
  ['returned', 'saReturned'], ['cancelled', 'cancelled'], ['expired', 'expired'],
]
const errorMessage = computed(() => error.value.startsWith('pages.') ? t(error.value) : localizePageMessage(error.value))
const statusLabel = (status: string) => {
  const option = statuses.find(([value]) => value === status)
  return option ? t(`pages.${option[1]}`) : businessLabel(status)
}

// 快捷日期只填写表单；明细始终由“查询”按钮提交。
function quickRange(type: 'all' | 'month' | 'last' | 'week') {
  if (type === 'all') {
    filters.startDate = ''
    filters.endDate = ''
    return
  }
  const anchor = dayjs(props.bounds.dataThrough || businessDate())
  const month = type === 'last' ? anchor.subtract(1, 'month') : anchor
  filters.startDate = type === 'week'
    ? anchor.subtract((anchor.day() + 6) % 7, 'day').format('YYYY-MM-DD')
    : month.startOf('month').format('YYYY-MM-DD')
  filters.endDate = (type === 'last' ? month.endOf('month') : anchor).format('YYYY-MM-DD')
}

async function loadOptions() {
  optionsError.value = ''
  try {
    const options = await workbench.get<{ employees: string[] }>('/sa-sales/order-options')
    employees.value = options.employees
  } catch (cause: unknown) {
    optionsError.value = cause instanceof Error ? cause.message : t('pages.loadFailedPleaseTryAgain')
  }
}
onMounted(loadOptions)
onBeforeUnmount(invalidate)
</script>

<template>
  <section class="panel order-details" :aria-label="t('pages.saOrderDetails')">
    <header>
      <h2>{{ t('pages.saOrderDetails') }}</h2>
      <div class="quick-ranges">
        <button type="button" @click="quickRange('all')">{{ t('pages.all') }}</button>
        <button type="button" @click="quickRange('month')">{{ t('pages.saThisMonth') }}</button>
        <button type="button" @click="quickRange('last')">{{ t('pages.lastMonth2') }}</button>
        <button type="button" @click="quickRange('week')">{{ t('pages.thisWeek') }}</button>
      </div>
    </header>
    <form class="detail-filters" @submit.prevent="query">
      <fieldset class="detail-dates">
        <legend>{{ t('pages.saDetailDate') }}</legend>
        <div>
          <input v-model="filters.startDate" type="date" :aria-label="t('pages.startDate')" />
          <span aria-hidden="true">→</span>
          <input v-model="filters.endDate" type="date" :aria-label="t('pages.endDate')" />
        </div>
      </fieldset>
      <label>{{ t('pages.salesCategory') }}
        <select v-model="filters.classification">
          <option value="">{{ t('pages.saAllCategories') }}</option>
          <option v-for="category in categories" :key="category" :value="category">{{ businessLabel(category) }}</option>
        </select>
      </label>
      <label>{{ t('pages.saSalesperson') }}
        <select v-model="filters.customerService">
          <option value="">{{ t('pages.all') }}</option>
          <option v-for="employee in employees" :key="employee" :value="employee">{{ employee }}</option>
          <option value="Unassigned">{{ label('Unassigned') }}</option>
        </select>
      </label>
      <label>{{ t('pages.orderStatus') }}
        <select v-model="filters.orderStatus">
          <option value="">{{ t('pages.allStatuses') }}</option>
          <option v-for="[value, key] in statuses" :key="value" :value="value">{{ t(`pages.${key}`) }}</option>
        </select>
      </label>
      <label>{{ t('pages.orderNumber') }}<input v-model="filters.orderId" type="search" maxlength="255" /></label>
      <label>{{ t('pages.customerName') }}<input v-model="filters.customerName" type="search" maxlength="255" /></label>
      <label>{{ t('pages.saPaypalAccount') }}<input v-model="filters.paypalAccount" type="search" maxlength="255" /></label>
      <label>{{ t('pages.sourceSite') }}<input v-model="filters.website" type="search" maxlength="255" /></label>
      <div class="filter-actions">
        <button type="submit" class="primary" :disabled="loading">{{ t('pages.search2') }}</button>
        <button type="button" @click="reset">{{ t('common.reset') }}</button>
      </div>
    </form>
    <p v-if="optionsError" class="error" role="alert">{{ localizePageMessage(optionsError) }} <button type="button" @click="loadOptions">{{ t('pages.saRetryOptions') }}</button></p>
    <p v-if="error" class="error" role="alert">{{ errorMessage }}</p>
    <p v-if="result" class="muted">{{ t('pages.saDetailResultTotal', { count: number(result.total, locale), amount: usd(result.totalAmount, locale) }) }}</p>
    <div class="table-wrap" :aria-busy="loading">
      <table class="detail-table">
        <thead><tr>
          <th>{{ t('pages.date') }}</th><th>{{ t('pages.orderNumber') }}</th><th>{{ t('pages.customer') }}</th>
          <th>{{ t('pages.sourceSite') }}</th><th>{{ t('pages.channel') }}</th><th>{{ t('pages.status') }}</th>
          <th>{{ t('pages.saPaypalAccount') }}</th><th>{{ t('pages.saSalesperson') }}</th><th class="numeric">{{ t('pages.saOrderAmount') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in result?.list || []" :key="row.id">
            <td class="date">{{ row.date }}</td><td>{{ row.orderId }}</td><td>{{ row.customer || '—' }}</td>
            <td>{{ label(row.website) || '—' }}</td><td>{{ businessLabel(row.classification) }}</td>
            <td>{{ statusLabel(row.status) }}</td>
            <td>{{ label(row.account) }}</td>
            <td>
              <template v-if="row.staffAllocations?.length">
                <p v-for="staff in row.staffAllocations" :key="staff.staffCode">{{ staff.staffCode }} · {{ number(staff.shareRatio * 100, locale) }}%</p>
              </template>
              <span v-else>{{ label('Unassigned') }}</span>
            </td>
            <td class="numeric" :class="{ refund: row.refund }">{{ row.amountUsd == null ? '—' : usd(row.amountUsd, locale) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="empty" role="status">{{ t('pages.loading') }}</p>
      <p v-else-if="!queried" class="empty">{{ t('pages.saDetailQueryHint') }}</p>
      <p v-else-if="result && !result.list.length" class="empty">{{ t('pages.saNoData') }}</p>
    </div>
    <ApiPagination :page="result?.page || 1" v-model:size="pageSize" :total="result?.total || 0" :loading="loading || !queried" @change="loadPage($event.page)" />
  </section>
</template>

<style scoped>
.quick-ranges { display: flex; flex-wrap: wrap; gap: 6px; }
.quick-ranges button { padding: 5px 10px; font-size: 12px; }
.detail-filters { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 12px 10px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--line); align-items: end; }
.detail-filters label { min-width: 0; }
.detail-filters input, .detail-filters select { width: 100%; }
.detail-dates { grid-column: span 3; min-width: 0; margin: 0; padding: 0; border: 0; }
.detail-dates legend { padding: 0 0 5px; font-size: 12px; color: var(--muted); }
.detail-dates > div { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.detail-dates input { flex: 1; width: 0; }
.filter-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
.detail-table { min-width: 1200px; }
.date { white-space: nowrap; }
.refund { color: var(--red); }
td p { white-space: nowrap; margin: 0 0 4px; }
.pagination { flex-wrap: wrap; }
.pagination label { display: flex; align-items: center; gap: 8px; }
@media (max-width: 1200px) { .detail-filters { grid-template-columns: repeat(4, minmax(0, 1fr)); } .detail-dates { grid-column: span 2; } }
@media (max-width: 700px) { .detail-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 420px) { .detail-filters { grid-template-columns: minmax(0, 1fr); } .detail-dates { grid-column: auto; } }
</style>
