<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { workbench } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { money, useWorkbench } from '../shared/useWorkbench'
import TopSalesChart from './TopSalesChart.vue'
import SalesRanking from './SalesRanking.vue'
import WebsiteDirectory from './WebsiteDirectory.vue'
import type { InfluencerReport } from './types'
import '../shared/legacy.css'

const { t, locale } = useI18n()
const { can } = useWorkbench('influencer')
const month = ref(dayjs().format('YYYY-MM'))
const page = ref(1), size = ref(20)
const report = ref<InfluencerReport | null>(null)
const loading = ref(false)
const error = ref('')
const refresh = ref(0)
let revision = 0
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString(locale.value, { timeZone: 'Asia/Shanghai' }) : '—'

async function loadSales() {
  if (!can('statistics')) return
  const current = ++revision
  error.value = ''
  if (!/^\d{4}-\d{2}$/.test(month.value)) { report.value = null; loading.value = false; return }
  loading.value = true
  try {
    const result = await workbench.get<InfluencerReport>('/influencers/report', { month: month.value, page: page.value, per_page: size.value })
    if (current === revision) { report.value = result; page.value = result.page }
  } catch (failure: any) {
    if (current === revision) {
      report.value = null
      error.value = failure.message || t('influencer.creatorSalesLoadFailed')
    }
  } finally {
    if (current === revision) loading.value = false
  }
}
function reload() { refresh.value++; loadSales() }
watch(month, () => { page.value = 1; loadSales() }, { immediate: true })
onBeforeUnmount(() => { revision++ })
</script>
<template>
  <main class="legacy-workbench creator-workbench">
    <header><div><h1>{{ t('influencer.creatorSalesTitle') }}</h1><p class="muted">{{ t('influencer.creatorSalesHint') }}</p></div><button :disabled="loading" @click="reload">{{ t('pages.refresh') }}</button></header>
    <section v-if="can('statistics')" class="panel" :aria-busy="loading">
      <div class="toolbar"><label>{{ t('influencer.creatorSalesMonth') }}<input v-model="month" type="month" required /></label></div>
      <div v-if="error" class="error" role="alert">{{ localizePageMessage(error) }} <button @click="loadSales">{{ t('pages.refresh') }}</button></div>
      <div v-if="loading && !report" class="empty" role="status">{{ t('influencer.loading') }}</div>
      <template v-if="report">
        <p class="muted creator-freshness" role="status">{{ t('influencer.freshness', { latest: dateTime(report.meta.latestOrderAt), refreshed: dateTime(report.meta.queriedAt), last: dateTime(report.meta.lastInfluencerOrderAt) }) }}</p>
        <div class="cards creator-summary">
          <div class="card"><span class="muted">{{ t('influencer.creatorSalesTotalAmount') }}</span><b>${{ money(report.totals.amountUsd) }}</b></div>
          <div class="card"><span class="muted">{{ t('influencer.creatorSalesTotalOrders') }}</span><b>{{ report.totals.orders }}</b></div>
          <div class="card"><span class="muted">{{ t('influencer.creatorSalesTotalItems') }}</span><b>{{ report.totals.items }}</b></div>
        </div>
        <TopSalesChart :rows="report.chart" />
        <LoadingRegion :loading="loading"><SalesRanking :rows="report.list" :page="page" :size="size" />
        <ApiPagination v-model:page="page" v-model:size="size" :total="report.total" :loading="loading" @change="loadSales" /></LoadingRegion>
      </template>
    </section>
    <WebsiteDirectory v-if="can('list')" :refresh="refresh" @saved="reload" />
  </main>
</template>
<style scoped>
.creator-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.creator-freshness { font-size: 12px; margin-bottom: 16px; }
@media (max-width: 700px) { .creator-summary { grid-template-columns: 1fr; } }
</style>
