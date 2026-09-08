<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { money, useWorkbench } from '../shared/useWorkbench'

const props = defineProps<{ revision: number }>()
const { t } = useI18n()
const { loading, error, run } = useWorkbench('paypal')
const startDate = ref('')
const endDate = ref('')
const mode = ref<'daily' | 'monthly'>('daily')
const rows = ref<Row[]>([])
const maximum = computed(() => Math.max(1, ...rows.value.map(row => row.amount)))

function load() {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    error.value = t('paypal.invalidDateRange')
    return
  }
  run(() => workbench.get<Row[]>('/paypal/statistics', { startDate: startDate.value, endDate: endDate.value, mode: mode.value }), data => rows.value = data)
}
function clear() { startDate.value = ''; endDate.value = '' }
watch([startDate, endDate, mode, () => props.revision], load)
onMounted(load)
</script>

<template>
  <section class="panel">
    <div class="section-head">
      <h2>{{ t('paypal.withdrawalsPanelTitle') }}</h2>
      <div class="toolbar">
        <label>{{ t('paypal.filterStartDate') }}<input v-model="startDate" type="date" /></label>
        <label>{{ t('paypal.filterEndDate') }}<input v-model="endDate" type="date" :min="startDate || undefined" /></label>
        <button @click="clear">{{ t('paypal.clearForm') }}</button>
        <div class="mode-buttons">
          <button :class="{ primary: mode === 'daily' }" :aria-pressed="mode === 'daily'" @click="mode = 'daily'">{{ t('paypal.dailyWithdrew') }}</button>
          <button :class="{ primary: mode === 'monthly' }" :aria-pressed="mode === 'monthly'" @click="mode = 'monthly'">{{ t('paypal.monthlyWithdrew') }}</button>
        </div>
      </div>
    </div>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <p v-if="!rows.length" class="empty">{{ loading ? t('pages.loading2') : t('paypal.noWithdrawalsData') }}</p>
    <div v-else class="withdrawal-chart-scroll" :aria-busy="loading">
      <div class="withdrawal-chart" :style="{ minWidth: `${Math.max(760, rows.length * 68)}px` }" :aria-label="t('paypal.withdrawalsPanelTitle')">
        <div v-for="row in rows" :key="row.period" class="bar-group">
          <div class="bar-space"><div class="withdrawal-bar" tabindex="0" :style="{ height: `${Math.max(2, row.amount / maximum * 220)}px` }" :aria-label="`${row.period}: ${money(row.amount)} USD`">
            <span class="chart-tooltip">{{ row.period }}<br />{{ money(row.amount) }} USD</span>
          </div></div>
          <span class="bar-label">{{ mode === 'monthly' ? row.period : row.period.slice(5) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mode-buttons { display: flex; gap: 4px; }
.withdrawal-chart-scroll { overflow-x: auto; padding-top: 24px; }
.withdrawal-chart { display: flex; gap: 16px; padding: 30px 24px 8px; }
.bar-group { flex: 1; min-width: 42px; text-align: center; }
.bar-space { height: 220px; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid var(--line); }
.withdrawal-bar { width: 28px; background: linear-gradient(180deg, #c5a3ff, #9566e9); border-radius: 5px 5px 0 0; position: relative; }
.bar-label { display: block; margin-top: 12px; color: var(--muted); font-size: 11px; white-space: nowrap; }
.chart-tooltip { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--panel-2); color: var(--text); border: 1px solid var(--line); padding: 6px 10px; border-radius: 6px; white-space: nowrap; z-index: 2; font-size: 12px; }
.withdrawal-bar:hover .chart-tooltip, .withdrawal-bar:focus .chart-tooltip { display: block; }
.bar-group:first-child .chart-tooltip { left: 0; transform: none; }
.bar-group:last-child .chart-tooltip { left: auto; right: 0; transform: none; }
</style>
