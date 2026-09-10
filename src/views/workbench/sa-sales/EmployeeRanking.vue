<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Row } from '@/api/workbench'
import { number, usd } from './format'

defineProps<{ rows: Row[]; title: string; label: (value: string) => string }>()
const { t, locale } = useI18n()
</script>

<template>
  <section class="panel" :aria-label="title">
    <header><h2>{{ title }}</h2><span class="muted">{{ t('pages.saEmployeeCount', { count: rows.length }) }}</span></header>
    <div class="table-wrap"><table class="employee-table">
      <thead><tr><th>{{ t('pages.rank') }}</th><th>{{ t('pages.saEmployee') }}</th><th class="numeric">{{ t('pages.saOrders') }}</th><th class="numeric">{{ t('pages.saRefundAmount') }}</th><th class="numeric">{{ t('pages.saNetSales') }}</th><th class="numeric">{{ t('pages.saCommissionAmount') }}</th><th class="numeric">{{ t('pages.saDailyAverage') }}</th><th>{{ t('pages.saRelative') }}</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.name">
        <td class="rank">{{ row.rank }}</td><td>{{ label(row.name) }}</td><td class="numeric">{{ number(row.orders, locale) }}</td>
        <td class="numeric">{{ usd(row.refunds, locale) }}</td><td class="numeric">{{ usd(row.netSales, locale) }}</td>
        <td class="numeric commission">{{ usd(row.commission, locale) }}</td><td class="numeric">{{ usd(row.dailyAverage, locale) }}</td>
        <td><div class="bar" :title="`${number(row.relativePercent, locale)}%`"><i :style="{ width: `${Math.max(0, Math.min(100, row.relativePercent))}%` }" /></div></td>
      </tr></tbody>
    </table><p v-if="!rows.length" class="empty">{{ t('pages.saNoData') }}</p></div>
  </section>
</template>

<style scoped>
.employee-table { min-width: 820px; }
.rank { color: var(--amber); font-weight: 700; }
.commission { color: var(--green); font-weight: 600; }
.bar { min-width: 90px; }
</style>
