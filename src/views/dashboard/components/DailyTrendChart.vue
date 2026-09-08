<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="header-title">
        <span class="title-text">{{ t('dashboard.dailyTrend.title') }}</span>
        <el-tag size="small" type="info" effect="plain">{{ currentYearMonth }}</el-tag>
      </div>
      <span class="monthly-total">{{ t('dashboard.dailyTrend.monthTotal') }}: ${{ formatMoney(monthlyTotal, locale) }}</span>
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
import { dailySales } from '../data/mockData'

const { t, locale } = useI18n()
const chartRef = ref<HTMLElement>()
const { renderEcharts } = useEcharts(chartRef)
const { isDark, axisLineColor, splitLineColor, axisLabelColor, gridBase } = useChartTheme()

const currentYearMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

const monthlyTotal = computed(() =>
  dailySales.reduce(
    (sum, item) => sum + item.mainSales + item.influencerSales + item.offlineSales + item.invoiceSales,
    0,
  ),
)

const renderChart = () => {
  const dates = dailySales.map((item) => item.key.slice(5))

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (val: number) => '$' + formatMoney(val, locale.value),
    },
    legend: {
      data: [
        t('dashboard.salesTrend.series.official'),
        t('dashboard.salesTrend.series.kol'),
        t('dashboard.salesTrend.series.offline'),
        t('dashboard.salesTrend.series.invoice'),
      ],
      top: 8,
      textStyle: { fontSize: 12, color: axisLabelColor.value },
    },
    grid: gridBase.value,
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: axisLineColor.value } },
      axisLabel: { color: axisLabelColor.value, fontSize: 11 },
    },
    yAxis: {
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
    series: [
      {
        name: t('dashboard.salesTrend.series.official'),
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        data: dailySales.map((item) => item.mainSales),
        itemStyle: { color: '#5B8FF9' },
      },
      {
        name: t('dashboard.salesTrend.series.kol'),
        type: 'bar',
        stack: 'total',
        data: dailySales.map((item) => item.influencerSales),
        itemStyle: { color: '#5AD8A6' },
      },
      {
        name: t('dashboard.salesTrend.series.offline'),
        type: 'bar',
        stack: 'total',
        data: dailySales.map((item) => item.offlineSales),
        itemStyle: { color: '#F6BD16' },
      },
      {
        name: t('dashboard.salesTrend.series.invoice'),
        type: 'bar',
        stack: 'total',
        data: dailySales.map((item) => item.invoiceSales),
        itemStyle: { color: '#E86452', borderRadius: [4, 4, 0, 0] },
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

    .monthly-total {
      font-size: 12px;
      color: hsl(var(--primary));
      font-weight: 500;
    }
  }

  .chart-container {
    flex: 1;
    width: 100%;
  }
}
</style>
