<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import type { Metric } from '@/api/order-management'
import { useEcharts } from '@/views/dashboard/composables/useChart'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'

const props = withDefaults(defineProps<{ rows: Metric[]; metric?: 'sales' | 'orders'; appearance?: 'auto' | 'workbench' }>(), { metric: 'sales', appearance: 'auto' })
const emit = defineEmits<{ select: [date: string, category: string] }>()
const { t, locale } = useI18n()
const element = ref<HTMLElement>()
const scroller = ref<HTMLElement>()
const { chartInstance, renderEcharts, resize } = useEcharts(element)
const theme = useChartTheme()
const hiddenCategories = ref<string[]>([])
const categories = computed(() => [
  { key: 'official', name: t('pages.officialSites'), color: '#3b82f6' },
  { key: 'top_influencer', name: t('pages.topInfluencer'), color: '#8b5cf6' },
  { key: 'mid_influencer', name: t('pages.midTierInfluencers'), color: '#a78bfa' },
  { key: 'offline', name: t('pages.paymentLinkOrders'), color: '#10b981' },
  { key: 'invoice', name: t('pages.invoiceOrders'), color: '#f59e0b' },
  { key: 'unmatched', name: t('pages.unmatched'), color: '#94a3b8' },
])
const chartWidth = computed(() => `${Math.max(720, props.rows.length * 82)}px`)
let observer: ResizeObserver | undefined

function toggleCategory(key: string) {
  hiddenCategories.value = hiddenCategories.value.includes(key)
    ? hiddenCategories.value.filter(category => category !== key)
    : [...hiddenCategories.value, key]
}

function render() {
  const visibleCategories = categories.value.filter(category => !hiddenCategories.value.includes(category.key))
  // 工作台有独立配色；坐标轴读取所在页面的主题，避免全局切换浅色后文字变暗。
  const workbenchStyle = props.appearance === 'workbench' && element.value ? getComputedStyle(element.value) : null
  const textColor = workbenchStyle?.getPropertyValue('--text').trim() || theme.textColor.value
  const axisColor = workbenchStyle?.getPropertyValue('--muted').trim() || theme.axisLabelColor.value
  const splitColor = workbenchStyle?.getPropertyValue('--line').trim() || theme.splitLineColor.value
  renderEcharts({
    textStyle: { color: textColor },
    tooltip: {
      trigger: 'axis',
      renderMode: 'richText',
      axisPointer: { type: 'shadow' },
      ...(workbenchStyle ? {
        backgroundColor: workbenchStyle.getPropertyValue('--panel-2').trim(),
        borderColor: splitColor,
        textStyle: { color: textColor },
      } : {}),
      valueFormatter: value => props.metric === 'orders'
        ? Number(value).toLocaleString(locale.value, { maximumFractionDigits: 0 })
        : formatMoney(value, locale.value),
    },
    grid: { top: 35, left: 65, right: 20, bottom: 45 },
    xAxis: {
      type: 'category',
      data: props.rows.map(row => row.key),
      axisLabel: { interval: 0, color: axisColor, formatter: (value: string) => value.length === 10 ? value.slice(5) : value.slice(0, 7) },
    },
    yAxis: {
      type: 'value',
      name: props.metric === 'orders' ? t('pages.orderCount') : 'USD',
      minInterval: props.metric === 'orders' ? 1 : undefined,
      axisLabel: { color: axisColor },
      splitLine: { lineStyle: { color: splitColor } },
    },
    // 每个分类独立占一根柱子；不设置 stack，避免叠加金额造成误读。
    series: visibleCategories.map(category => ({
      id: category.key,
      name: category.name,
      type: 'bar',
      barMaxWidth: 14,
      barGap: '12%',
      itemStyle: { color: category.color },
      data: props.rows.map(row => (props.metric === 'orders' ? row.orderSeries : row.series)?.[category.key] ?? 0),
    })),
  })
  resize()
}

onMounted(() => {
  render()
  chartInstance.value?.on('click', event => {
    const category = categories.value.find(item => item.name === event.seriesName)
    if (category) emit('select', event.name, category.key)
  })
  observer = new ResizeObserver(resize)
  if (scroller.value) observer.observe(scroller.value)
})
watch(() => [props.rows, props.metric, props.appearance, locale.value, theme.isDark.value, hiddenCategories.value], async () => {
  await nextTick()
  render()
}, { deep: true })
watch(() => props.rows[0]?.key, () => { if (scroller.value) scroller.value.scrollLeft = 0 })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="sales-trend">
    <div class="legend">
      <button v-for="category in categories" :key="category.key" type="button" :aria-pressed="!hiddenCategories.includes(category.key)" :class="{ muted: hiddenCategories.includes(category.key) }" @click="toggleCategory(category.key)">
        <i :style="{ backgroundColor: category.color }" />{{ category.name }}
      </button>
    </div>
    <div ref="scroller" class="chart-scroll" tabindex="0" :aria-label="t('pages.salesTrendForTheSelectedDates')">
      <div ref="element" class="chart" :style="{ minWidth: chartWidth }" role="img" :aria-label="t('pages.salesTrendForTheSelectedDates')" />
    </div>
  </div>
</template>

<style scoped>
.sales-trend { min-width: 0; }
.legend { display: flex; gap: 8px 18px; flex-wrap: wrap; margin-bottom: 12px; }
.legend button { display: inline-flex; align-items: center; gap: 6px; padding: 4px 0; border: 0; background: transparent; color: hsl(var(--foreground)); font-size: 12px; cursor: pointer; }
.legend i { width: 10px; height: 10px; border-radius: 2px; }
.legend .muted { opacity: .4; }
.chart-scroll { overflow-x: auto; overscroll-behavior-x: contain; }
.chart { width: 100%; height: 330px; }
</style>
