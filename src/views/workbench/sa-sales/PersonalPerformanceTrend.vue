<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PerformanceDay } from '@/api/sa-personal-performance'
import { useEcharts } from '@/views/dashboard/composables/useChart'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
import { usd } from './format'

const props = defineProps<{ rows: PerformanceDay[] }>()
const { t, locale } = useI18n()
const theme = useChartTheme()
const element = ref<HTMLElement>()
const { renderEcharts, resize } = useEcharts(element)
let observer: ResizeObserver | undefined

function render() {
  renderEcharts({
    animationDuration: 200,
    color: ['#6099f8', '#f47785'],
    legend: { top: 0, textStyle: { color: theme.axisLabelColor.value } },
    tooltip: { trigger: 'axis', renderMode: 'richText', backgroundColor: theme.tooltipBg.value,
      borderColor: theme.axisLineColor.value, textStyle: { color: theme.tooltipTextColor.value },
      valueFormatter: value => usd(value, locale.value) },
    grid: { top: 42, bottom: props.rows.length > 31 ? 65 : 30, left: 85, right: 20 },
    xAxis: { type: 'category', data: props.rows.map(row => row.date), axisLabel: {
      color: theme.axisLabelColor.value, formatter: (value: string) => value.slice(5),
    } },
    yAxis: { type: 'value', min: 0, axisLabel: { color: theme.axisLabelColor.value,
      formatter: (value: number) => usd(value, locale.value, true) },
      splitLine: { lineStyle: { color: theme.splitLineColor.value } } },
    dataZoom: props.rows.length > 31 ? [{ type: 'slider', bottom: 0, height: 22, startValue: 0, endValue: 30,
      textStyle: { color: theme.axisLabelColor.value }, borderColor: theme.axisLineColor.value }] : [],
    series: [
      { name: t('personalPerformance.salesSeries'), type: 'bar', barMaxWidth: 18, data: props.rows.map(row => row.sales) },
      { name: t('personalPerformance.refundSeries'), type: 'bar', barMaxWidth: 18, data: props.rows.map(row => row.refunds) },
    ],
  })
}

onMounted(() => {
  render()
  observer = new ResizeObserver(resize)
  if (element.value) observer.observe(element.value)
})
watch(() => [props.rows, locale.value, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="element" class="personal-trend" role="img" :aria-label="t('personalPerformance.dailyTrend')" />
</template>

<style scoped>
.personal-trend { width: 100%; height: 360px; }
</style>
