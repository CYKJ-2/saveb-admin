<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { money } from '../shared/useWorkbench'
import type { InfluencerSales } from './types'
const props = defineProps<{ rows: InfluencerSales[]; page: number; size: number }>()
const { t } = useI18n()
const visible = computed(() => props.rows)
const currency = (value: number | string | null) => value == null ? '—' : `$${money(value)}`
</script>
<template>
  <div class="table-wrap">
    <table>
      <thead><tr><th>{{ t('influencer.creatorSalesRank') }}</th><th>{{ t('influencer.creatorSalesInfluencer') }}</th><th v-for="key in ['creatorSalesAmount', 'creatorSalesOrders', 'creatorSalesItems', 'creatorSampleQuantity', 'creatorSampleValue', 'creatorCommissionAmount']" :key="key" class="numeric">{{ t(`influencer.${key}`) }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, index) in visible" :key="row.name">
          <td>#{{ (page - 1) * size + index + 1 }}</td><td>{{ row.name }}</td><td class="numeric">{{ currency(row.amountUsd) }}</td><td class="numeric">{{ row.orders }}</td><td class="numeric">{{ row.items }}</td>
          <td class="numeric" :title="row.sampleQuantity == null ? t('influencer.creatorMetricNotRecorded') : ''">{{ row.sampleQuantity ?? '—' }}</td>
          <td class="numeric" :title="row.sampleValue == null ? t('influencer.creatorMetricNotRecorded') : ''">{{ currency(row.sampleValue) }}</td>
          <td class="numeric" :title="row.commissionAmount == null ? t('influencer.creatorMetricNotRecorded') : ''">{{ currency(row.commissionAmount) }}</td>
        </tr>
        <tr v-if="!visible.length"><td colspan="8" class="empty">{{ t('influencer.creatorSalesNoData') }}</td></tr>
      </tbody>
    </table>
  </div>

</template>
