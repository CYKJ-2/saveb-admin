<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/views/dashboard/composables/useChartTheme'
import AnalysisShare from './AnalysisShare.vue'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])
type Group = { key: string; name_zh: string; name_en: string; rows: number; amount: string; share: string }
const props = defineProps<{ title: string; groups: Group[]; dimension: string }>()
const { t, locale } = useI18n()
const theme = useChartTheme()
const element = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let resize: ResizeObserver | undefined
const money = (value: string) => Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const name = (group: Group) => ['customer_type', 'purchase_method'].includes(props.dimension) || group.key === 'negative'
  ? t('analysis.' + group.key) : (locale.value === 'en-US' ? group.name_en : group.name_zh)
function render() {
  chart?.setOption({
    color: ['#5b9cff', '#26b99a', '#a48afa', '#e7ac4d', '#e37c98', '#5cb9cf', '#7886cd', '#96ad63', '#bb8c64'],
    tooltip: {
      trigger: 'item', renderMode: 'richText', backgroundColor: theme.tooltipBg.value,
      borderColor: theme.axisLineColor.value, textStyle: { color: theme.tooltipTextColor.value },
      formatter: (item: any) => item.name + '\nCNY ' + money(item.value) + ' · ' + Number(item.percent).toFixed(2) + '%',
    },
    legend: { type: 'scroll', bottom: 0, textStyle: { color: theme.axisLabelColor.value } },
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'],
      label: { show: false }, emphasis: { label: { show: true, color: theme.textColor.value } },
      data: props.groups.filter(row => Number(row.amount) > 0).map(row => ({ name: name(row), value: Number(row.amount) })),
    }],
  }, true)
}
onMounted(() => {
  chart = echarts.init(element.value!)
  render()
  resize = new ResizeObserver(() => chart?.resize())
  resize.observe(element.value!)
})
watch(() => [props.groups, locale.value, theme.isDark.value], render, { deep: true })
onBeforeUnmount(() => { resize?.disconnect(); chart?.dispose() })
</script>

<template>
  <section class="panel distribution-panel">
    <h2>{{ title }}</h2>
    <div ref="element" class="distribution-chart" role="img" :aria-label="title" />
    <p v-if="groups.some(row => Number(row.amount) < 0)" class="muted">{{ t('analysis.positivePie') }}</p>
    <div class="ranking-scroll">
      <table>
        <thead><tr><th>{{ t('analysis.rank') }}</th><th>{{ t('analysis.' + dimension) }}</th><th>{{ t('analysis.rows') }}</th><th>{{ t('analysis.amount') }} · CNY</th><th>{{ t('analysis.share') }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in groups" :key="row.key">
            <td>{{ index + 1 }}</td><td>{{ name(row) }}</td><td>{{ row.rows }}</td>
            <td><b>{{ money(row.amount) }}</b></td>
            <td><AnalysisShare :value="row.share" /></td>
          </tr>
          <tr v-if="!groups.length"><td colspan="5" class="empty">{{ t('analysis.noRows') }}</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<style scoped>
.distribution-chart { width: 100%; height: 250px; }
.ranking-scroll { max-height: 330px; overflow: auto; border: 1px solid var(--workbench-line, var(--el-border-color)); border-radius: 8px; }
.ranking-scroll th { position: sticky; top: 0; z-index: 1; }
.ranking-scroll td, .ranking-scroll th { text-align: left; white-space: nowrap; }
</style>
