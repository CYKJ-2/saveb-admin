<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Row } from '@/api/workbench'
import { useEcharts } from '@/views/dashboard/composables/useChart'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
import { colors, number, usd } from './format'

type EmployeeMetric = 'netSales' | 'orders' | 'refunds' | 'commission'

const props = defineProps<{ rows: Row[]; label: (value: string) => string }>()
const { t, locale } = useI18n()
const theme = useChartTheme()
const metric = ref<EmployeeMetric>('netSales')
const metrics = computed(() => ({
  netSales: t('pages.saNetSales'),
  orders: t('pages.saOrders'),
  refunds: t('pages.saRefundAmount'),
  commission: t('pages.saComparisonCommission'),
}))
// 沿用 source 的排行榜前 12 名，切换指标时保留员工顺序，方便逐项对比。
const employees = computed(() => props.rows.slice(0, 12))
const element = ref<HTMLElement>()
const { renderEcharts, resize } = useEcharts(element)
let observer: ResizeObserver | undefined

function formatValue(value: unknown, compact = false) {
  return metric.value === 'orders' ? number(value, locale.value) : usd(value, locale.value, compact)
}

function render() {
  if (!employees.value.length) return
  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      renderMode: 'richText',
      valueFormatter: value => formatValue(value),
    },
    grid: { top: 10, bottom: 12, left: 95, right: 95 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: employees.value.map(row => props.label(row.name)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.axisLabelColor.value, width: 82, overflow: 'truncate' },
    },
    series: [{
      name: metrics.value[metric.value],
      type: 'bar',
      barMaxWidth: 16,
      label: {
        show: true,
        position: 'right',
        color: theme.textColor.value,
        fontSize: 11,
        formatter: item => formatValue(item.value, true),
      },
      data: employees.value.map((row, index) => ({
        value: Number(row[metric.value]) || 0,
        itemStyle: { color: colors[index % colors.length], borderRadius: 4 },
      })),
    }],
  })
  resize()
}

onMounted(() => {
  render()
  observer = new ResizeObserver(resize)
  if (element.value) observer.observe(element.value)
})
watch(() => [props.rows, metric.value, locale.value, theme.isDark.value], render, { deep: true, flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="panel" :aria-label="t('pages.saEmployeeComparison')">
    <header>
      <h2>{{ t('pages.saEmployeeComparison') }}</h2>
      <select v-model="metric" :aria-label="t('pages.saEmployeeComparisonMetric')">
        <option v-for="(label, key) in metrics" :key="key" :value="key">{{ label }}</option>
      </select>
    </header>
    <div v-show="employees.length" ref="element" class="employee-comparison-chart" role="img" :aria-label="`${t('pages.saEmployeeComparison')} · ${metrics[metric]}`" />
    <p v-if="!employees.length" class="empty">{{ t('pages.saNoData') }}</p>
  </section>
</template>

<style scoped>
.employee-comparison-chart { height: 320px; width: 100%; }
</style>
