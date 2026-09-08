<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEcharts } from '@/views/dashboard/composables/useChart'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
import { breakdownRows, colors, number, usd } from './format'
import type { Row } from '@/api/workbench'

const props = defineProps<{ breakdowns: Record<string, Row[]>; label: (value: string) => string }>()
const { t, locale } = useI18n()
const theme = useChartTheme()
const dimension = ref('channel')
const dimensions = computed(() => ({ channel: t('pages.saByChannel'), employee: t('pages.saByEmployee'), paymentMethod: t('pages.saByPaymentMethod'), paymentAccount: t('pages.saByPaymentAccount') }))
const chartData = computed(() => breakdownRows(props.breakdowns[dimension.value] || []))
const element = ref<HTMLElement>()
const { renderEcharts, resize } = useEcharts(element)
let observer: ResizeObserver | undefined

function render() {
  renderEcharts({
    color: colors,
    tooltip: { trigger: 'item', renderMode: 'richText', backgroundColor: theme.tooltipBg.value, borderColor: theme.axisLineColor.value, textStyle: { color: theme.tooltipTextColor.value }, valueFormatter: value => usd(value, locale.value) },
    graphic: [
      { type: 'text', left: 'center', top: '42%', style: { text: t('pages.saSalesAmount'), fill: theme.subTextColor.value, fontSize: 13 } },
      { type: 'text', left: 'center', top: '51%', style: { text: usd(chartData.value.total, locale.value, true), fill: theme.textColor.value, fontSize: 20, fontWeight: 700 } },
    ],
    series: [{ type: 'pie', radius: ['55%', '77%'], label: { show: false },
      data: chartData.value.rows.map(row => ({ name: props.label(row.name), value: Number(row.sales) })) }],
  })
  resize()
}
onMounted(() => { render(); observer = new ResizeObserver(resize); if (element.value) observer.observe(element.value) })
watch(() => [props.breakdowns, dimension.value, locale.value, theme.isDark.value], async () => { await nextTick(); render() }, { deep: true })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="panel" :aria-label="t('pages.saSalesBreakdown')">
    <header><h2>{{ t('pages.saSalesBreakdown') }}</h2><select v-model="dimension" :aria-label="t('pages.saBreakdownDimension')"><option v-for="(label, key) in dimensions" :key="key" :value="key">{{ label }}</option></select></header>
    <div v-show="chartData.total" ref="element" class="breakdown-chart" role="img" :aria-label="`${t('pages.saSalesBreakdown')} · ${dimensions[dimension as keyof typeof dimensions]}`" />
    <div v-if="chartData.total" class="breakdown-legend"><span v-for="(row, index) in chartData.rows" :key="row.name"><i :style="{ background: colors[index % colors.length] }" />{{ label(row.name) }} {{ number(row.percent, locale) }}%</span></div>
    <p v-else class="empty">{{ t('pages.saNoData') }}</p>
  </section>
</template>

<style scoped>
.breakdown-chart { height: 285px; width: 100%; }
.breakdown-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; color: var(--muted); font-size: 12px; }
.breakdown-legend span { display: flex; gap: 6px; align-items: center; overflow-wrap: anywhere; }
.breakdown-legend i { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
</style>
