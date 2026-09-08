<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEcharts } from '@/views/dashboard/composables/useChart'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
import { number, usd } from './format'
import type { Row } from '@/api/workbench'

const props = defineProps<{ rows: Row[] }>()
const { t, locale } = useI18n()
const theme = useChartTheme()
const metric = ref('netSales')
const metrics = computed(() => ({ sales: t('pages.saSalesAmount'), netSales: t('pages.saNetSales'), refunds: t('pages.saRefundAmount'), orders: t('pages.saOrders') }))
const element = ref<HTMLElement>()
const { renderEcharts, resize } = useEcharts(element)
let observer: ResizeObserver | undefined

function render() {
  const isOrders = metric.value === 'orders'
  const color = metric.value === 'refunds' ? '#ff7685' : isOrders ? '#aa8cff' : '#2ed4a4'
  renderEcharts({
    tooltip: { trigger: 'axis', renderMode: 'richText', backgroundColor: theme.tooltipBg.value, borderColor: theme.axisLineColor.value, textStyle: { color: theme.tooltipTextColor.value }, valueFormatter: value => isOrders ? number(value, locale.value) : usd(value, locale.value) },
    grid: { top: 25, bottom: 45, left: 92, right: 20 },
    xAxis: { type: 'category', data: props.rows.map(row => row.date), axisLabel: { color: theme.axisLabelColor.value, formatter: (value: string) => value.slice(5) } },
    yAxis: { type: 'value', min: value => Math.min(0, value.min), minInterval: isOrders ? 1 : undefined,
      axisLabel: { color: theme.axisLabelColor.value, formatter: (value: number) => isOrders ? number(value, locale.value) : usd(value, locale.value, true) },
      splitLine: { lineStyle: { color: theme.splitLineColor.value } } },
    series: [{ name: metrics.value[metric.value as keyof typeof metrics.value], type: 'line', smooth: false, symbolSize: 6,
      lineStyle: { color, width: 3 }, itemStyle: { color }, areaStyle: { color, opacity: .12 }, data: props.rows.map(row => Number(row[metric.value]) || 0) }],
  })
}
onMounted(() => { render(); observer = new ResizeObserver(resize); if (element.value) observer.observe(element.value) })
watch(() => [props.rows, metric.value, locale.value, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="panel" :aria-label="t('pages.saDailyTrend')">
    <header><h2>{{ t('pages.saDailyTrend') }}</h2><select v-model="metric" :aria-label="t('pages.saTrendMetric')"><option v-for="(label, key) in metrics" :key="key" :value="key">{{ label }}</option></select></header>
    <div v-show="rows.length" ref="element" class="trend-chart" role="img" :aria-label="`${t('pages.saDailyTrend')} · ${metrics[metric as keyof typeof metrics]}`" />
    <p v-if="!rows.length" class="empty">{{ t('pages.saNoData') }}</p>
  </section>
</template>

<style scoped>
.trend-chart { height: 320px; width: 100%; }
</style>
