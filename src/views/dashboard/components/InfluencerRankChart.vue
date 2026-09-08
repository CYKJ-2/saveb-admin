<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="header-title">
        <span class="title-text">{{ t('dashboard.influencerRank.title') }}</span>
        <el-tag size="small" type="info" effect="plain">TOP 10</el-tag>
      </div>
      <span class="total-sales">{{ t('dashboard.influencerRank.totalSales') }}: ${{ formatMoney(totalSales, locale) }}</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { useEcharts } from '../composables/useChart'
import { useChartTheme } from '../composables/useChartTheme'
import { influencerRanking } from '../data/mockData'

const { t, locale } = useI18n()
const chartRef = ref<HTMLElement>()
const { renderEcharts } = useEcharts(chartRef)
const { isDark, axisLineColor, splitLineColor, axisLabelColor, tooltipStyle } = useChartTheme()

const totalSales = computed(() =>
  influencerRanking.reduce((sum, item) => sum + item.sales, 0),
)

const renderChart = () => {
  const data = [...influencerRanking].sort((a, b) => a.sales - b.sales)

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = data[params[0].dataIndex]
        return `<div style="padding:8px 12px;${tooltipStyle.value}">
          <div style="font-weight:600;margin-bottom:6px">${item.name}</div>
          <div>${t('dashboard.categoryPie.tooltip.orders')}: <b>${item.orders}</b></div>
          <div>${t('dashboard.categoryPie.tooltip.items')}: <b>${item.items}</b></div>
          <div>${t('dashboard.categoryPie.tooltip.sales')}: <b>$${formatMoney(item.sales, locale.value)}</b></div>
        </div>`
      },
    },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: splitLineColor.value, type: 'dashed' } },
      axisLabel: {
        color: axisLabelColor.value,
        fontSize: 11,
        formatter: (val: number) => '$' + (val / 1000).toFixed(0) + 'K',
      },
    },
    yAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      axisLine: { lineStyle: { color: axisLineColor.value } },
      axisTick: { show: false },
      axisLabel: { color: axisLabelColor.value, fontSize: 11 },
    },
    series: [
      {
        name: t('dashboard.salesTrend.salesTitle'),
        type: 'bar',
        data: data.map((item) => item.sales),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#5AD8A6' },
              { offset: 1, color: '#5B8FF9' },
            ],
          },
        },
        label: {
          show: true,
          position: 'right',
          color: axisLabelColor.value,
          fontSize: 11,
          formatter: (params: any) => '$' + formatMoney(params.value / 1000, locale.value) + 'K',
        },
      },
    ],
  })
}

onMounted(async () => {
  await nextTick()
  renderChart()
})
watch(locale, renderChart)
watch(isDark, renderChart)
</script>

<style lang="scss" scoped>
.chart-card {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
  height: 380px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s, border-color 0.2s;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }

    .total-sales {
      font-size: 12px;
      color: hsl(var(--success));
      font-weight: 500;
    }
  }

  .chart-container {
    flex: 1;
    width: 100%;
  }
}
</style>
