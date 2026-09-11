<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AnalysisCrossValue from './AnalysisCrossValue.vue'
import AnalysisSection from './AnalysisSection.vue'

type Metric = { rows: number; amount: string; share: string }
type Cell = Metric & { x: string; x_zh: string; x_en: string; y: string; y_zh: string; y_en: string }
type Total = Metric & { key: string | number }
const props = defineProps<{
  title: string
  id: string
  cells: Cell[]
  customer?: boolean
  price?: boolean
  rowTotals?: Total[]
  columnTotals?: Total[]
  total?: { rows: number; amount: string }
}>()
const { t, locale } = useI18n()
const dimensions = computed(() => {
  const x = [...new Map(props.cells.map(cell => [cell.x, { key: cell.x, zh: cell.x_zh, en: cell.x_en }])).values()]
  const y = [...new Map(props.cells.map(cell => [cell.y, { key: cell.y, zh: cell.y_zh, en: cell.y_en }])).values()]
  if (props.customer) {
    const order = ['first', 'returning', 'unknown']
    x.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }
  if (props.price) {
    const order = ['negative', '0-99.99', '100-299.99', '300-499.99', '500-999.99', '1000-2999.99', '3000+']
    y.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }
  return { x, y }
})
const values = computed(() => new Map(props.cells.map(cell => [JSON.stringify([cell.x, cell.y]), cell])))
// 复用同一次接口返回的完整维度汇总，避免前端浮点求和或按可见列截断总额。
const rowTotals = computed(() => new Map((props.rowTotals ?? []).map(row => [String(row.key), row])))
const columnTotals = computed(() => new Map((props.columnTotals ?? []).map(column => [String(column.key), column])))
const grandTotal = computed(() => props.total ? { ...props.total, share: Number(props.total.amount) === 0 ? '0.00' : '100.00' } : undefined)
const maximum = computed(() => Math.max(1, ...props.cells.map(cell => Math.abs(Number(cell.amount)))))
const get = (x: string, y: string) => values.value.get(JSON.stringify([x, y]))
const money = (value: string) => Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const color = (x: string, y: string) => {
  const cell = get(x, y)
  return cell ? { backgroundColor: 'color-mix(in srgb, var(--workbench-blue, #409eff) ' + (8 + Math.abs(Number(cell.amount)) / maximum.value * 30) + '%, var(--workbench-panel, var(--el-bg-color)))' } : {}
}
</script>
<template>
  <AnalysisSection :id="id" :title="title" :summary="total ? t('analysis.grandTotal') + ' · CNY ' + money(total.amount) : undefined">
    <p v-if="customer" class="muted">{{ t('analysis.historyHelp') }}</p>
    <p class="muted">{{ t('analysis.crossHelp') }}</p>
    <p v-if="total" class="muted">{{ t('analysis.crossTotalsHelp') }}</p>
    <div class="cross-scroll">
      <table :aria-label="title">
        <thead><tr>
          <th scope="col">{{ t('analysis.dimension') }}</th>
          <th v-for="column in dimensions.y" :key="column.key" scope="col">{{ column.key === 'negative' ? t('analysis.negative') : locale === 'en-US' ? column.en : column.zh }}</th>
          <th v-if="total" scope="col" class="row-total">{{ t('analysis.rowTotal') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in dimensions.x" :key="row.key">
            <th scope="row">{{ customer ? t('analysis.' + row.key) : locale === 'en-US' ? row.en : row.zh }}</th>
            <td v-for="column in dimensions.y" :key="column.key" :style="color(row.key, column.key)">
              <AnalysisCrossValue v-if="get(row.key, column.key)" :value="get(row.key, column.key)!" :show-share="!!total" />
              <span v-else class="muted">—</span>
            </td>
            <td v-if="total" class="row-total">
              <AnalysisCrossValue v-if="rowTotals.get(String(row.key))" :value="rowTotals.get(String(row.key))!" show-share />
            </td>
          </tr>
          <tr v-if="!cells.length"><td :colspan="dimensions.y.length + (total ? 2 : 1)" class="empty">{{ t('analysis.noRows') }}</td></tr>
        </tbody>
        <tfoot v-if="grandTotal"><tr>
          <th scope="row">{{ t('analysis.columnTotal') }}</th>
          <td v-for="column in dimensions.y" :key="column.key">
            <AnalysisCrossValue v-if="columnTotals.get(String(column.key))" :value="columnTotals.get(String(column.key))!" show-share />
          </td>
          <td class="row-total"><AnalysisCrossValue :value="grandTotal" show-share /></td>
        </tr></tfoot>
      </table>
    </div>
  </AnalysisSection>
</template>
<style scoped>
.cross-scroll { overflow: auto; max-height: 520px; border: 1px solid var(--el-border-color); border-radius: 8px; }
.cross-scroll table { width: max-content; min-width: 100%; }
.cross-scroll th, .cross-scroll td { text-align: left; white-space: nowrap; min-width: 145px; }
.cross-scroll thead th { position: sticky; top: 0; z-index: 2; }
.cross-scroll tbody th { position: sticky; left: 0; z-index: 1; background: var(--workbench-panel, var(--el-bg-color)); }
.cross-scroll .row-total { position: sticky; right: 0; z-index: 1; min-width: 168px; box-shadow: -1px 0 var(--el-border-color); }
.cross-scroll .row-total, .cross-scroll tfoot th, .cross-scroll tfoot td { background: var(--workbench-header-background, var(--el-fill-color-light)); }
.cross-scroll tfoot th, .cross-scroll tfoot td { position: sticky; bottom: 0; z-index: 2; border-top: 2px solid var(--el-border-color); }
.cross-scroll tfoot th { left: 0; }
.cross-scroll thead th:first-child { left: 0; }
.cross-scroll thead th:first-child, .cross-scroll thead .row-total, .cross-scroll tfoot th, .cross-scroll tfoot .row-total { z-index: 3; }

/* 深色主题下独立强调列合计；内侧分隔线在吸底滚动时仍保持可见。 */
:root:not(.light) .cross-scroll tfoot {
  --workbench-muted: var(--el-text-color-regular);
  --workbench-panel: var(--el-fill-color-extra-light);
}
:root:not(.light) .cross-scroll tfoot th,
:root:not(.light) .cross-scroll tfoot td {
  background: var(--el-fill-color-darker);
  color: var(--el-text-color-primary);
  border-top-color: var(--el-color-primary);
  box-shadow: inset 0 2px 0 var(--el-color-primary);
}
:root:not(.light) .cross-scroll tfoot th {
  color: var(--el-color-primary-light-3);
}
:root:not(.light) .cross-scroll tfoot .row-total {
  background: var(--el-color-primary-light-7);
  box-shadow: inset 1px 0 0 var(--el-color-primary-light-5), inset 0 2px 0 var(--el-color-primary);
}
</style>
