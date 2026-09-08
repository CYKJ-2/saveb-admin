<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="header-title">
        <span class="title-text">{{ t('dashboard.salesTrend.title') }}</span>
        <el-tag size="small" type="info" effect="plain">2026</el-tag>
      </div>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="orders">{{ t('dashboard.salesTrend.tabOrders') }}</el-radio-button>
        <el-radio-button value="sales">{{ t('dashboard.salesTrend.tabSales') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { useEcharts } from '../composables/useChart'
import { useChartTheme } from '../composables/useChartTheme'
import { monthlySales } from '../data/mockData'

const { t, locale } = useI18n()
const chartRef = ref<HTMLElement>()
const mode = ref<'orders' | 'sales'>('sales')

const { renderEcharts } = useEcharts(chartRef)
const { isDark, axisLineColor, splitLineColor, axisLabelColor, gridBase } = useChartTheme()

const renderChart = () => {
  const months = monthlySales.map((item) => item.key)
  const isOrders = mode.value === 'orders'

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: isDark.value ? '#374151' : '#6a7985' } },
      valueFormatter: (val: number) =>
        isOrders ? `${val}${t('dashboard.salesTrend.unitOrders')}` : `$${formatMoney(val, locale.value)}`,
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
      boundaryGap: false,
      data: months,
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
        formatter: (val: number) => (isOrders ? val : (val / 1000).toFixed(0) + 'K'),
      },
    },
    series: [
      {
        name: t('dashboard.salesTrend.series.official'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: monthlySales.map((item) => (isOrders ? item.main : item.mainSales)),
        itemStyle: { color: '#5B8FF9' },
        lineStyle: { width: 2.5 },
      },
      {
        name: t('dashboard.salesTrend.series.kol'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: monthlySales.map((item) => (isOrders ? item.influencer : item.influencerSales)),
        itemStyle: { color: '#5AD8A6' },
        lineStyle: { width: 2.5 },
      },
      {
        name: t('dashboard.salesTrend.series.offline'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: monthlySales.map((item) => (isOrders ? item.offline : item.offlineSales)),
        itemStyle: { color: '#F6BD16' },
        lineStyle: { width: 2.5 },
      },
      {
        name: t('dashboard.salesTrend.series.invoice'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: monthlySales.map((item) => (isOrders ? item.invoice : item.invoiceSales)),
        itemStyle: { color: '#E86452' },
        lineStyle: { width: 2.5 },
      },
    ],
  })
}

onMounted(async () => {
  // 等一帧以避免 Element Plus 2.5.x 的 slot-prep race
  // （某些 column/radio 子组件会在父组件还未 mount 完毕时评估 props.disabled，
  //   此时 trace 会落回到 SFC 顶层 template 解析位置，看起来像 "DashboardCard.vue:1:6"）
  await nextTick()
  renderChart()
})
watch(mode, renderChart)
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
  }

  .chart-container {
    flex: 1;
    width: 100%;
  }
}
</style>
