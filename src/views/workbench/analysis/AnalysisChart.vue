<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{
  title: string
  labels: string[]
  series: { name: string; data: (number | null)[] }[]
  line?: boolean
  amount: boolean
  locale: string
}>()
const theme = useChartTheme()
const element = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let resize: ResizeObserver | undefined

function render() {
  chart?.setOption({
    color: ['#4e9cff', '#22b693', '#ac8aff', '#edb34f', '#f07f92'],
    tooltip: {
      trigger: 'axis', renderMode: 'richText',
      backgroundColor: theme.tooltipBg.value, borderColor: theme.axisLineColor.value,
      textStyle: { color: theme.tooltipTextColor.value },
      valueFormatter: (value: unknown) => value === null || value === undefined ? '—' : Number(value).toLocaleString(props.locale, { minimumFractionDigits: props.amount ? 2 : 0, maximumFractionDigits: props.amount ? 2 : 0 }),
    },
    legend: { type: 'scroll', top: 0, textStyle: { color: theme.axisLabelColor.value } },
    grid: { top: 42, left: 20, right: 20, bottom: props.labels.length > 12 ? 70 : 40, containLabel: true },
    xAxis: { type: 'category', data: props.labels, axisLabel: { color: theme.axisLabelColor.value, rotate: props.line ? 0 : 25 }, axisLine: { lineStyle: { color: theme.axisLineColor.value } } },
    yAxis: { type: 'value', axisLabel: { color: theme.axisLabelColor.value }, splitLine: { lineStyle: { color: theme.splitLineColor.value } } },
    dataZoom: props.labels.length > 12 ? [{ type: 'slider', bottom: 5, height: 18, start: 0, end: props.line ? 100 : Math.min(100, 1200 / props.labels.length), textStyle: { color: theme.axisLabelColor.value } }] : [],
    series: props.series.map(series => ({ ...series, type: props.line ? 'line' : 'bar', smooth: false, connectNulls: false, showSymbol: false, barMaxWidth: 32 })),
  }, true)
}
onMounted(() => {
  chart = echarts.init(element.value!)
  render()
  resize = new ResizeObserver(() => chart?.resize())
  resize.observe(element.value!)
})
watch(() => [props.labels, props.series, props.amount, props.locale, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => { resize?.disconnect(); chart?.dispose() })
</script>

<template><div ref="element" class="analysis-chart" role="img" :aria-label="title" /></template>
<style scoped>.analysis-chart { width: 100%; height: 320px; }</style>
