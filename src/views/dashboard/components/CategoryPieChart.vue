<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="header-title">
        <span class="title-text">{{ t('dashboard.categoryPie.title') }}</span>
        <el-tag size="small" type="info" effect="plain">{{ todayDate }}</el-tag>
      </div>
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
import { orderCategories } from '../data/mockData'

const { t, locale } = useI18n()
const chartRef = ref<HTMLElement>()
const { renderEcharts } = useEcharts(chartRef)
const { isDark, axisLabelColor, tooltipStyle } = useChartTheme()

const todayDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const borderColor = computed(() =>
  isDark.value ? '#111722' : '#ffffff',
)

const renderChart = () => {
  renderEcharts({
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = orderCategories.find((c) => c.name === params.name)
        if (!item) return ''
        return `<div style="padding:8px 12px;${tooltipStyle.value}">
          <div style="font-weight:600;margin-bottom:6px">${params.name}</div>
          <div>${t('dashboard.categoryPie.tooltip.orders')}: <b>${item.orders}</b></div>
          <div>${t('dashboard.categoryPie.tooltip.items')}: <b>${item.items}</b></div>
          <div>${t('dashboard.categoryPie.tooltip.sales')}: <b>$${formatMoney(item.usd, locale.value)}</b></div>
          <div>${t('dashboard.categoryPie.tooltip.percent')}: <b>${params.percent}%</b></div>
        </div>`
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: axisLabelColor.value },
    },
    series: [
      {
        name: t('dashboard.categoryPie.seriesName'),
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: borderColor.value, borderWidth: 2 },
        label: {
          show: true,
          position: 'outside',
          formatter: (params: any) => `${params.name}\n$${formatMoney(orderCategories[params.dataIndex]?.usd, locale.value)}`,
          fontSize: 11,
          lineHeight: 16,
          color: axisLabelColor.value,
        },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
          scaleSize: 8,
        },
        data: orderCategories.map((item) => ({
          name: item.name,
          value: item.orders,
          itemStyle: { color: item.color },
        })),
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
  }

  .chart-container {
    flex: 1;
    width: 100%;
  }
}
</style>
