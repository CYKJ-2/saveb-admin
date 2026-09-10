<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Metric } from '@/api/order-management'
import { localizePageMessage } from '@/lang/page-message'

const props = defineProps<{ rows: Metric[]; loading: boolean; error?: string; canSearch: boolean }>()
const mode = defineModel<'day' | 'month'>('mode', { required: true })
const date = defineModel<string>('date', { required: true })
const month = defineModel<string>('month', { required: true })
const emit = defineEmits<{ change: []; select: [staff: string] }>()
const { t, locale } = useI18n()
const maximumSales = computed(() => Math.max(1, ...props.rows.map(row => row.amountUsd)))
const number = (value: number) => value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// 与原模块一致：最高销售额占满，小额销售保留可见条形。
const salesWidth = (value: number) => value > 0 ? Math.max(3, Math.round(value / maximumSales.value * 100)) : 0
// 日历固定向下展开；仅允许水平方向避让视口边缘。
const datePopperOptions = { modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { altAxis: false } }] }
</script>

<template>
  <section class="panel offline-orders" v-loading="loading">
    <div class="offline-heading">
      <div><h2>{{ t('pages.orderOffline.title') }}</h2><p class="muted">{{ t('pages.sharedOrdersAreWeightedByAllocationRatiosOrderAnd') }}</p></div>
      <div class="offline-filters">
        <el-radio-group v-model="mode" size="small" @change="emit('change')">
          <el-radio-button value="day">{{ t('pages.orderOffline.daily') }}</el-radio-button>
          <el-radio-button value="month">{{ t('pages.orderOffline.monthly') }}</el-radio-button>
        </el-radio-group>
        <el-date-picker v-if="mode === 'day'" v-model="date" type="date" value-format="YYYY-MM-DD" :aria-label="t('pages.orderOffline.date')" :clearable="false" size="small" placement="bottom-end" :popper-options="datePopperOptions" popper-class="order-workbench-popper workbench-theme" @change="emit('change')" />
        <el-date-picker v-else v-model="month" type="month" value-format="YYYY-MM" :aria-label="t('pages.orderOffline.month')" :clearable="false" size="small" placement="bottom-end" :popper-options="datePopperOptions" popper-class="order-workbench-popper workbench-theme" @change="emit('change')" />
      </div>
    </div>
    <el-alert v-if="error" :title="localizePageMessage(error)" type="error" :closable="false" />
    <el-table :data="rows" :row-class-name="canSearch ? 'clickable-staff-row' : ''" @row-click="row => canSearch && emit('select', row.key)">
      <el-table-column prop="key" :label="t('pages.orderOffline.staff')" min-width="60" />
      <el-table-column :label="t('pages.orderOffline.orders')" min-width="70" align="right"><template #default="{ row }">{{ number(row.orders) }}</template></el-table-column>
      <el-table-column :label="t('pages.orderOffline.items')" min-width="70" align="right"><template #default="{ row }">{{ number(row.items) }}</template></el-table-column>
      <el-table-column label="USD" min-width="110" align="right"><template #default="{ row }">{{ number(row.amountUsd) }}</template></el-table-column>
      <el-table-column :label="t('pages.orderOffline.sales')" min-width="100">
        <template #default="{ row }"><div class="staff-sales-bar" :title="`US$ ${number(row.amountUsd)}`" role="img" :aria-label="`${row.key} · ${t('pages.orderOffline.sales')} US$ ${number(row.amountUsd)}`"><i :style="{ width: `${salesWidth(row.amountUsd)}%` }" /></div></template>
      </el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.offline-heading { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.offline-heading h2 { font-size: 18px; font-weight: 600; margin: 0 0 6px; }
.offline-heading p { margin: 0; }
.muted { color: var(--muted); font-size: 12px; }
.offline-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.offline-filters :deep(.el-date-editor) { width: 145px; height: 36px; }
.offline-filters :deep(.el-radio-group) { height: 36px; flex-wrap: nowrap; }
.offline-filters :deep(.el-radio-button__inner) { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 12px; }
:deep(.clickable-staff-row) { cursor: pointer; }
.staff-sales-bar { height: 9px; margin-top: 5px; overflow: hidden; border-radius: 999px; background: var(--panel-2); border: 1px solid color-mix(in srgb, #fbbf24 25%, var(--line)); }
.staff-sales-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(135deg, #fde68a, #f59e0b); }
</style>
