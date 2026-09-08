<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
const { t, locale } = useI18n()
const theme = useChartTheme()
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
const props = withDefaults(defineProps<{ rows: Record<string, any>[]; type?: 'bar' | 'line' | 'pie'; label?: string; value?: string }>(), { type: 'bar', label: 'name', value: 'netSales' })
const element = ref<HTMLDivElement>(); let chart: echarts.ECharts | undefined; let observer: ResizeObserver | undefined
function render() {
  const names = props.rows.map(r => r[props.label]); const values = props.rows.map(r => r[props.value] || 0)
  chart?.setOption({ color: ['#5aa9ff', '#2ed4a4', '#f6c85f', '#aa8cff', '#62d3ef', '#ff7685'], tooltip: { backgroundColor: theme.tooltipBg.value, borderColor: theme.axisLineColor.value, textStyle: { color: theme.tooltipTextColor.value }, trigger: props.type === 'pie' ? 'item' : 'axis' }, grid: { top: 20, bottom: 60, left: 70, right: 20 }, ...(props.type !== 'pie' ? { xAxis: { type: 'category', data: names, axisLabel: { color: theme.axisLabelColor.value, rotate: 30 } }, yAxis: { type: 'value', axisLabel: { color: theme.axisLabelColor.value }, splitLine: { lineStyle: { color: theme.splitLineColor.value } } } } : {}), series: [{ type: props.type, smooth: true, ...(props.type === 'pie' ? { radius: ['40%', '70%'], data: props.rows.filter(r => r[props.value] > 0).map(r => ({ name: r[props.label], value: r[props.value] })), label: { color: theme.axisLabelColor.value } } : { data: values }) }] }, true)
}
onMounted(() => { chart = echarts.init(element.value!); render(); observer = new ResizeObserver(() => chart?.resize()); observer.observe(element.value!) })
watch(() => [props.rows, props.type, props.label, props.value, locale.value, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<template><div ref="element" style="height:290px;width:100%" role="img" :aria-label="t('pages.salesStatisticsChart')" /></template>
