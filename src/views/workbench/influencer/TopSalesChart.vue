<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { money } from '../shared/useWorkbench'
import type { InfluencerSales } from './types'

const props = defineProps<{ rows: InfluencerSales[] }>()
const { t } = useI18n()
const topRows = computed(() => props.rows.slice(0, 30))
const maximum = computed(() => Math.max(1, ...topRows.value.map(row => row.amountUsd)))
const compactMoney = (amount: number) => Math.abs(amount) < 1000 ? money(amount) : `${(amount / 1000).toFixed(1).replace(/\.0$/, '')}K`
const label = (row: InfluencerSales) => t('influencer.creatorTopSalesChartLabel', { name: row.name, sales: money(row.amountUsd), orders: row.orders })
</script>

<template>
  <section class="creator-chart-panel">
    <h3>{{ t('influencer.creatorTopSalesChartTitle') }}</h3>
    <p class="muted">{{ t('influencer.creatorTopSalesChartHint') }}</p>
    <div v-if="!topRows.length" class="empty">{{ t('influencer.creatorTopSalesChartEmpty') }}</div>
    <div v-else class="creator-chart-scroll">
      <div class="creator-chart" role="img" :aria-label="t('influencer.creatorTopSalesChartTitle')" :style="{ gridTemplateColumns: `repeat(${topRows.length}, minmax(0, 1fr))`, minWidth: `${topRows.length * 52}px` }">
        <div v-for="row in topRows" :key="row.name" class="creator-column" role="group" :aria-label="label(row)" :title="label(row)" tabindex="0">
          <div class="creator-column-amount">${{ compactMoney(row.amountUsd) }}<span>{{ t('influencer.creatorTopSalesOrdersShort', { orders: row.orders }) }}</span></div>
          <div class="creator-column-track"><div class="creator-column-bar" :style="{ height: `${row.amountUsd > 0 ? Math.max(1.5, row.amountUsd / maximum * 100) : 0}%` }" /></div>
          <div class="creator-column-name">{{ row.name }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.creator-chart-panel { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--panel-2); margin-bottom: 18px; }
.creator-chart-panel p { font-size: 12px; margin: 5px 0 14px; }
.creator-chart-scroll { overflow-x: auto; }
.creator-chart { display: grid; gap: clamp(2px,.3vw,6px); height: 280px; }
.creator-column { display: grid; grid-template-rows: 34px 180px 50px; gap: 5px; min-width: 0; }
.creator-column-amount { text-align: center; color: var(--workbench-amber, var(--text)); font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; }
.creator-column-amount span { display: block; color: var(--muted); font-size: 9px; font-weight: 400; }
.creator-column-track { display: flex; align-items: end; justify-content: center; height: 180px; }
.creator-column-bar { width: 72%; border-radius: 8px 8px 2px 2px; background: linear-gradient(180deg,#6ee7b7,#059669); }
.creator-column-name { font-size: 10px; font-weight: 700; text-align: center; overflow-wrap: anywhere; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
</style>
