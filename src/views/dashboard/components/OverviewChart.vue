<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '@/utils/money'

import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEcharts } from '../composables/useChart'
import { useChartTheme } from '../composables/useChartTheme'
const props = withDefaults(defineProps<{ rows: any[]; kind: 'trend' | 'categories'; metric?: 'sales' | 'orders' }>(), { metric: 'sales' })
const names = computed<Record<string, string>>(() => ({ official: t('pages.officialSites'), top_influencer: t('pages.topInfluencer'), mid_influencer: t('pages.midTierInfluencers'), offline: t('pages.paymentLinkOrders'), invoice: 'Invoice', unmatched: t('pages.unmatched') }))
const element = ref<HTMLElement>()
const { renderEcharts, resize } = useEcharts(element)
const theme = useChartTheme()
let observer: ResizeObserver | undefined
function render() {
  const common = {
    color: ['#5b8ff9', '#5ad8a6', '#61d9df', '#f6bd16', '#e86452', '#9270ca'],
    textStyle: { color: theme.textColor.value },
    tooltip: {
      renderMode: 'richText' as const,
      valueFormatter: (value: unknown) => props.kind === 'trend' && props.metric === 'orders'
        ? Number(value).toLocaleString(locale.value, { maximumFractionDigits: 0 })
        : formatMoney(value, locale.value),
    },
    legend: { top: 0, textStyle: { color: theme.textColor.value }, type: 'scroll' as const },
  }
  if (props.kind === 'categories') {
    renderEcharts({ ...common, series: [{ type: 'pie', radius: ['42%', '72%'], center: ['50%', '56%'], label: { color: '#fff', formatter: '{d}%', position: 'inside' }, data: props.rows.filter(row => row.amountUsd > 0).map(row => ({ name: names.value[row.key] || row.key, value: row.amountUsd, itemStyle: { color: common.color[Math.max(0, Object.keys(names.value).indexOf(row.key))] } })) }] })
  } else {
    const series = props.metric === 'orders'
      ? [{ name: t('pages.completedOrders2'), type: 'line' as const, data: props.rows.map(row => row.orders), symbolSize: 7 }]
      : Object.entries(names.value).map(([key, name]) => ({ name, type: 'bar' as const, stack: 'sales', data: props.rows.map(row => row.series?.[key] || 0), barMaxWidth: 42 }))
    renderEcharts({ ...common, tooltip: { ...common.tooltip, trigger: 'axis' }, grid: { top: 50, left: 15, right: 20, bottom: 10, containLabel: true }, xAxis: { type: 'category', data: props.rows.map(row => row.key), axisLabel: { color: theme.axisLabelColor.value } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.splitLineColor.value } }, axisLabel: { color: theme.axisLabelColor.value } }, series })
  }
}
onMounted(() => { render(); observer = new ResizeObserver(resize); observer.observe(element.value!) })
watch(() => [props.rows, props.kind, props.metric, locale.value, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => observer?.disconnect())
</script>
<template><div ref="element" style="width:100%;height:300px" role="img" :aria-label="kind === 'trend' ? t('pages.salesTrendForTheSelectedDates') : t('pages.salesShareByCategoryForTheSelectedDates')" /></template>
