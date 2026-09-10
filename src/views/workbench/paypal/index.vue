<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench, money } from '../shared/useWorkbench'
import { useDebouncedReload } from '../shared/useDebouncedReload'
import AccountDialog from './AccountDialog.vue'
import ReceivedOrders from './ReceivedOrders.vue'
import WithdrawalRecords from './WithdrawalRecords.vue'
import WithdrawalChart from './WithdrawalChart.vue'
import PaypalOperationLogs from './PaypalOperationLogs.vue'
import { accountName, suggestedThreshold } from './account'
import { useBalanceNotifications } from './useBalanceNotifications'
import '../shared/legacy.css'
import './paypal.css'

const { t } = useI18n()
const { can, loading, error, run } = useWorkbench('paypal')
const notifications = useBalanceNotifications()
const rows = ref<Row[]>([])
const total = ref(0)
const summary = ref({ accounts: 0, balance: 0, aboveThreshold: 0 })
let loadVersion = 0
const keyword = ref('')
const sort = ref('latestIncomingAt')
const page = ref(1)
const pageSize = ref(20)
const threshold = ref(5000)
const editor = ref<{ action: string; account?: Row } | null>(null)
const selectedAccount = ref<Row | null>(null)
const revision = ref(0)
const savingReview = ref(false)
const showLogs = ref(false)

const sorts = [
  ['latestIncomingAt', 'sortRecentIncoming'], ['received', 'sortTotalReceived'],
  ['balance', 'sortBalance'], ['reviews', 'sortReviews'], ['withdrawn', 'sortTotalWithdrew'],
]
const visible = computed(() => rows.value)
const totalBalance = computed(() => summary.value.balance)
const dangerCount = computed(() => summary.value.aboveThreshold)
const searchReload = useDebouncedReload(() => { page.value = 1; load() })
watch([keyword, threshold], () => { page.value = 1; loadVersion++; searchReload.schedule() })
watch(sort, () => { page.value = 1; load() })
onBeforeUnmount(() => { loadVersion++ })

async function load() {
  searchReload.cancel()
  if (!can('list') || savingReview.value) return
  const version = ++loadVersion
  await run(() => workbench.get('/paypal', { keyword: keyword.value, sort: sort.value, threshold: Math.max(0, Number(threshold.value) || 0), page: page.value, per_page: pageSize.value }), data => {
    if (version !== loadVersion) return
    rows.value = data.list
    total.value = data.total
    summary.value = data.summary
    page.value = data.page
    notifications.check(data.list)
  })
}
async function saved() {
  editor.value = null
  await load()
  revision.value++
}
async function changeReviews(row: Row, event: Event) {
  const input = event.target as HTMLInputElement
  const previous = row.reviews
  const next = Number(input.value)
  input.value = String(previous)
  if (savingReview.value || !Number.isInteger(next) || next < 0 || next > 1000000 || next === previous) return
  savingReview.value = true
  try {
    await ElMessageBox.confirm(t('paypal.confirmReviewChange', { count: next }), t('paypal.numberOfReviews'), {
      confirmButtonText: t('paypal.withdrawlAmountConfirm'), cancelButtonText: t('pages.cancel'),
    })
    await workbench.post(`/paypal/${row.id}/review`, { version: row.version, value: next })
    error.value = ''
  } catch (failure: any) {
    if (failure !== 'cancel' && failure !== 'close') error.value = failure.message || t('pages.loadFailedPleaseTryAgain')
  } finally {
    savingReview.value = false
  }
  const saveError = error.value
  await load()
  if (saveError) error.value = saveError
}
onMounted(() => { load(); notifications.refresh() })
</script>

<template>
  <main class="legacy-workbench paypal-monitor">
    <header><div><h1>{{ t('paypal.paypalMonitorTitle') }}</h1><p class="muted">{{ t('paypal.paypalMonitorHint') }}</p></div></header>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <p v-if="notifications.notice.value" class="error" role="alert">{{ localizePageMessage(notifications.notice.value) }}</p>
    <template v-if="can('list')">
      <div class="cards">
        <div class="card">{{ t('pages.accounts') }}<b>{{ total }}</b></div>
        <div class="card">{{ t('pages.totalBalanceUsd') }}<b>{{ money(totalBalance) }}</b></div>
        <div class="card">{{ t('pages.accountsAtAlertThreshold') }}<b>{{ dangerCount }}</b></div>
      </div>
      <section class="panel">
        <div class="toolbar account-toolbar">
          <label class="account-search">{{ t('paypal.paypalSearchPlaceholder') }}<input v-model="keyword" type="search" maxlength="255" /></label>
          <button @click="keyword = ''">{{ t('paypal.clearForm') }}</button>
          <button v-if="can('create')" class="primary" :disabled="loading" @click="editor = { action: 'create' }">{{ t('paypal.addPaypalAccount') }}</button>
          <button :disabled="notifications.enabled.value" @click="notifications.enable()">{{ t(notifications.enabled.value ? 'paypal.desktopNotificationsEnabled' : 'paypal.enableDesktopNotifications') }}</button>
          <button v-if="can('logs')" @click="showLogs = true">{{ t('pages.operationLogs') }}</button>
          <label>{{ t('paypal.sortBy') }}<select v-model="sort"><option v-for="[value, key] in sorts" :key="value" :value="value">{{ t(`paypal.${key}`) }}</option></select></label>
          <label class="threshold-input">{{ t('pages.balanceAlertThresholdUsd') }}<input v-model.number="threshold" type="number" min="0" step="100" /></label>
          <button :disabled="loading || savingReview" @click="load(); revision++">{{ t('pages.refresh') }}</button>
        </div>
        <p v-if="can('balance') || can('withdrawal')" class="muted balance-help">{{ t('paypal.balanceHelp') }}</p>
        <LoadingRegion :loading="loading"><div class="table-wrap"><table class="accounts-table" :aria-busy="loading">
          <colgroup><col style="width: 9%" /><col style="width: 24%" /><col style="width: 25%" /><col span="4" style="width: 10.5%" /></colgroup>
          <thead><tr><th v-for="key in ['addedDate', 'paypalAccountName', 'email', 'numberOfReviews', 'balance', 'totalReceived', 'totalWithdrawed']" :key="key">{{ t(`paypal.${key}`) }}</th></tr></thead>
          <tbody>
            <tr v-for="row in visible" :key="row.id">
              <td>{{ row.addedDate || '—' }}</td><td :title="row.accountName">{{ accountName(row.accountName) || '—' }}</td><td>{{ row.email }}</td>
              <td class="numeric"><input :value="row.reviews" :disabled="!can('review') || savingReview || loading" type="number" min="0" max="1000000" step="1" :aria-label="`${t('paypal.numberOfReviews')} ${row.email}`" :title="`${t('paypal.suggestedWithdrawlAmount')}: ${money(suggestedThreshold(row))} USD`" @change="changeReviews(row, $event)" @keydown.enter="($event.target as HTMLInputElement).blur()" @focus="($event.target as HTMLInputElement).select()" /></td>
              <td class="numeric"><input :value="money(row.balance)" readonly :aria-label="`${t('paypal.balance')} ${row.email}`" :class="{ 'above-threshold': row.balance >= threshold }" :disabled="!can('balance') && !can('withdrawal')" @dblclick="editor = { action: 'choose', account: row }" @keydown.enter.prevent="editor = { action: 'choose', account: row }" /></td>
              <td class="numeric"><button v-if="can('orders')" class="received-link" @click="selectedAccount = row">{{ money(row.received) }}</button><span v-else>{{ money(row.received) }}</span></td>
              <td class="numeric">{{ money(row.withdrawn) }}</td>
            </tr>
            <tr v-if="!visible.length"><td colspan="7" class="empty">{{ loading ? t('paypal.loadingPaypalAccounts') : t('pages.noMatchingAccounts') }}</td></tr>
          </tbody>
        </table></div>
        <ApiPagination v-model:page="page" v-model:size="pageSize" :total="total" :loading="loading" @change="load" /></LoadingRegion>
      </section>
    </template>
    <p v-else class="empty">{{ t('paypal.noPermission') }}</p>
    <ReceivedOrders v-if="can('orders') && can('list')" :account="selectedAccount" :revision="revision" />
    <WithdrawalRecords v-if="can('withdrawals')" :revision="revision" />
    <WithdrawalChart v-if="can('statistics')" :revision="revision" />
    <AccountDialog v-if="editor" :action="editor.action" :account="editor.account" @close="editor = null" @saved="saved" />
    <PaypalOperationLogs v-if="showLogs && can('logs')" @close="showLogs = false" />
  </main>
</template>
