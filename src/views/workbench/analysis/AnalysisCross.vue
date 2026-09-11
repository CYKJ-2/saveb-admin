<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
type Cell = { x: string; x_zh: string; x_en: string; y: string; y_zh: string; y_en: string; rows: number; amount: string }
const props = defineProps<{ title: string; cells: Cell[]; customer?: boolean; price?: boolean }>()
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
const maximum = computed(() => Math.max(1, ...props.cells.map(cell => Math.abs(Number(cell.amount)))))
const get = (x: string, y: string) => values.value.get(JSON.stringify([x, y]))
const money = (value: string) => Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const color = (x: string, y: string) => {
  const cell = get(x, y)
  return cell ? { backgroundColor: 'color-mix(in srgb, var(--workbench-blue, #409eff) ' + (8 + Math.abs(Number(cell.amount)) / maximum.value * 30) + '%, var(--workbench-panel, var(--el-bg-color)))' } : {}
}
</script>
<template>
  <section class="panel">
    <h2>{{ title }}</h2><p class="muted">{{ t('analysis.crossHelp') }}</p>
    <div class="cross-scroll">
      <table>
        <thead><tr><th>{{ t('analysis.dimension') }}</th><th v-for="column in dimensions.y" :key="column.key">{{ column.key === 'negative' ? t('analysis.negative') : locale === 'en-US' ? column.en : column.zh }}</th></tr></thead>
        <tbody>
          <tr v-for="row in dimensions.x" :key="row.key">
            <th>{{ customer ? t('analysis.' + row.key) : locale === 'en-US' ? row.en : row.zh }}</th>
            <td v-for="column in dimensions.y" :key="column.key" :style="color(row.key, column.key)">
              <template v-if="get(row.key, column.key)">
                <b>{{ money(get(row.key, column.key)!.amount) }}</b>
                <small>{{ t('analysis.recordCount', { count: get(row.key, column.key)!.rows }) }}</small>
              </template>
              <span v-else class="muted">—</span>
            </td>
          </tr>
          <tr v-if="!cells.length"><td class="empty">{{ t('analysis.noRows') }}</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<style scoped>
.cross-scroll { overflow: auto; max-height: 520px; border: 1px solid var(--el-border-color); border-radius: 8px; }
.cross-scroll table { width: max-content; min-width: 100%; }
.cross-scroll th, .cross-scroll td { text-align: left; white-space: nowrap; min-width: 145px; }
.cross-scroll small { display: block; margin-top: 6px; color: var(--workbench-muted, var(--el-text-color-secondary)); }
.cross-scroll thead th { position: sticky; top: 0; z-index: 2; }
.cross-scroll tbody th { position: sticky; left: 0; z-index: 1; background: var(--workbench-panel, var(--el-bg-color)); }
</style>
