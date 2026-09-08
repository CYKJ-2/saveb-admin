<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { money, useWorkbench } from '../shared/useWorkbench'
import { accountName } from './account'

const props = defineProps<{ revision: number }>()
const { t } = useI18n()
const { can, loading, error, run } = useWorkbench('paypal')
const filters = ref({ keyword: '', startDate: '', endDate: '' })
let appliedFilters = { ...filters.value }
const result = ref<{ rows: Row[]; count: number; amount: number }>({ rows: [], count: 0, amount: 0 })
const page = ref(1)
const pageSize = ref(20)
const visible = computed(() => result.value.rows)

function load() {
  run(() => workbench.get('/paypal/withdrawals', { ...appliedFilters, page: page.value, per_page: pageSize.value }), data => {
    result.value = { ...data, rows: data.list }
    page.value = data.page
  })
}
function search() {
  if (filters.value.startDate && filters.value.endDate && filters.value.startDate > filters.value.endDate) {
    error.value = t('paypal.invalidDateRange')
    return
  }
  page.value = 1
  appliedFilters = { ...filters.value }
  load()
}
function clear() { filters.value = { keyword: '', startDate: '', endDate: '' }; search() }
watch(() => props.revision, load)
onMounted(load)
</script>

<template>
  <section class="panel">
    <div class="section-head"><h2>{{ t('paypal.withdrawalRecordSearchTitle') }}</h2>
      <button v-if="can('export')" :disabled="loading || !result.count" @click="workbench.download('/paypal/withdrawals/export', 'paypal-withdrawals.csv', appliedFilters)">{{ t('pages.exportAllResults') }}</button>
    </div>
    <form class="toolbar" @submit.prevent="search">
      <label class="account-search">{{ t('paypal.withdrawalRecordSearchPlaceholder') }}<input v-model="filters.keyword" type="search" maxlength="255" /></label>
      <label>{{ t('paypal.filterStartDate') }}<input v-model="filters.startDate" type="date" /></label>
      <label>{{ t('paypal.filterEndDate') }}<input v-model="filters.endDate" type="date" :min="filters.startDate || undefined" /></label>
      <button class="primary" :disabled="loading">{{ t('paypal.query') }}</button>
      <button type="button" @click="clear">{{ t('paypal.clearForm') }}</button>
    </form>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <p class="muted">{{ t('paypal.withdrawalRecordSummary', { count: result.count, amount: `${money(result.amount)} USD` }) }}</p>
    <div class="table-wrap"><table>
      <thead><tr><th v-for="key in ['withdrawalDate', 'paypalAccountName', 'email', 'withdrawalAmount', 'recordSource']" :key="key">{{ t(`paypal.${key}`) }}</th></tr></thead>
      <tbody><tr v-for="row in visible" :key="row.id">
        <td>{{ row.imported ? t('paypal.importedCumulativeWithdrawal') : row.date || '—' }}</td><td :title="row.accountName">{{ accountName(row.accountName) }}</td><td>{{ row.email }}</td>
        <td class="numeric">{{ money(row.amount) }}</td><td>{{ row.imported ? t('paypal.importedCumulativeWithdrawal') : String(row.source || '').startsWith('Imported Withdrawal Sheet ') ? `${t('paypal.importedWithdrawalRecords')} ${row.source.slice(26)}` : row.source || t('paypal.manualWithdrawal') }}</td>
      </tr><tr v-if="!visible.length"><td colspan="5" class="empty">{{ loading ? t('pages.loading2') : t('paypal.noWithdrawalsData') }}</td></tr></tbody>
    </table></div>
    <ApiPagination v-model:page="page" v-model:size="pageSize" :total="result.count" :loading="loading" @change="load" />
  </section>
</template>

<style scoped>.account-search { flex: 1; min-width: 220px; } td:first-child { white-space: nowrap; }</style>
