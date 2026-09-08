<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench, money } from '../shared/useWorkbench'

const props = defineProps<{ account: Row | null; revision: number }>()
const { t, te, locale } = useI18n()
const { can, loading, error, run } = useWorkbench('paypal')
const rows = ref<Row[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
let requestVersion = 0
const visible = computed(() => rows.value)
const label = (value: string) => te(`paypal.${value}`) ? t(`paypal.${value}`) : value || '—'

watch(() => [props.account?.email, props.revision], () => {
  rows.value = []
  page.value = 1
  total.value = 0
  load()
}, { immediate: true })

function load() {
  const version = ++requestVersion
  if (props.account && can('orders')) run(() => workbench.get('/paypal/orders', { email: props.account!.email, page: page.value, per_page: pageSize.value }), data => {
    if (version !== requestVersion) return
    rows.value = data.list; total.value = data.total; page.value = data.page
  })
}
function download() {
  if (props.account) run(() => workbench.download('/paypal/orders/export', 'paypal-received-orders.csv', { email: props.account!.email, locale: locale.value }), () => {})
}
</script>

<template>
  <section class="panel" aria-labelledby="paypal-received-title">
    <div class="section-head">
      <h2 id="paypal-received-title">{{ t('paypal.sourceOrderList') }}</h2>
      <button v-if="can('orders_export')" :disabled="!rows.length || loading" @click="download">{{ t('paypal.downloadOrders') }}</button>
    </div>
    <p class="muted">{{ account ? t('paypal.receivedFor', { account: account.email }) : t('paypal.paypalReceivedPrompt') }}</p>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <div class="table-wrap"><table>
      <thead><tr><th v-for="key in ['orderTime', 'orderId', 'customer', 'website', 'classification', 'orderStatus', 'amount']" :key="key">{{ t(`paypal.${key}`) }}</th></tr></thead>
      <tbody>
        <tr v-for="row in visible" :key="row.id">
          <td>{{ row.createTime ? dayjs(row.createTime).format('YY-MM-DD HH:mm') : '—' }}</td>
          <td>{{ row.orderId }}<small v-if="row.paypalOrderId" class="muted">{{ row.paypalOrderId }}</small></td>
          <td>{{ row.customerFullName || '—' }}</td><td>{{ row.clientSite || '—' }}</td>
          <td><span class="badge">{{ label(row.classification) }}</span></td><td>{{ label(row.paymentStatus) }}</td>
          <td class="numeric">{{ money(row.amountUsd) }} USD</td>
        </tr>
        <tr v-if="!visible.length"><td colspan="7" class="empty">{{ loading ? t('pages.loading2') : account ? t('pages.noData') : t('paypal.paypalReceivedPrompt') }}</td></tr>
      </tbody>
    </table></div>
    <ApiPagination v-if="account" v-model:page="page" v-model:size="pageSize" :total="total" :loading="loading" @change="load" />
  </section>
</template>

<style scoped>small { display: block; margin-top: 3px; } td:first-child { white-space: nowrap; }</style>
