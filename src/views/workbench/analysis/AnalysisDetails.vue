<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'

type Row = Record<string, any>
const props = defineProps<{ active: boolean; filters: Row; columns: { key: string; label: string }[]; canExport: boolean }>()
const { t, locale } = useI18n()
const tab = ref('eligible')
const listing = ref<Row>({ list: [], total: 0, page: 1, per_page: 20 })
const loading = ref(false)
const error = ref('')
const customerKey = ref('')
const customerName = ref('')
const evidence = ref<Row>()
const evidenceOpen = ref(false)
const evidenceLoading = ref(false)
const exporting = ref(false)
let needsReload = true
let revision = 0
let evidenceRevision = 0
let disposed = false
const tabs = ['eligible', 'customers', 'all', 'missing', 'classification']
const params = computed(() => ({
  ...props.filters, locale: locale.value,
  ...(tab.value === 'all' ? { scope: 'all' } : {}),
  ...(['missing', 'classification'].includes(tab.value) ? { quality: tab.value } : {}),
  ...(customerKey.value ? { customer_key: customerKey.value } : {}),
}))
const money = (value: unknown) => Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
async function load(pagination = { page: 1, per_page: listing.value.per_page }) {
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const data = await workbench.get('/analysis/' + (tab.value === 'customers' ? 'customers' : 'rows'), { ...params.value, ...pagination })
    if (current === revision && !disposed) { listing.value = data; needsReload = false }
  } catch (e: any) { if (current === revision) error.value = e.message || t('analysis.failed') }
  finally { if (current === revision) loading.value = false }
}
function selectTab(value: string) {
  if (tab.value === value) return
  listing.value = { list: [], total: 0, page: 1, per_page: listing.value.per_page }
  tab.value = value
  customerKey.value = ''
  customerName.value = ''
  void load()
}
function customerDetails(row: Row) {
  listing.value = { list: [], total: 0, page: 1, per_page: listing.value.per_page }
  customerKey.value = row.customer_key
  customerName.value = row.customer_name
  tab.value = 'eligible'
  void load()
}
function clearCustomer() { customerKey.value = ''; customerName.value = ''; void load() }
async function showEvidence(id: number) {
  const current = ++evidenceRevision
  evidenceOpen.value = true
  evidenceLoading.value = true
  evidence.value = undefined
  try {
    const data = await workbench.get('/analysis/rows/' + id + '/evidence')
    if (current === evidenceRevision && !disposed) evidence.value = data
  } catch (e: any) { if (current === evidenceRevision) { error.value = e.message || t('analysis.failed'); evidenceOpen.value = false } }
  finally { if (current === evidenceRevision) evidenceLoading.value = false }
}
async function exportRows() {
  exporting.value = true
  try { await workbench.download('/analysis/export', 'Analysis-CNY-' + locale.value + '.csv', params.value) }
  catch (e: any) { error.value = e.message || t('analysis.failed') }
  finally { exporting.value = false }
}
watch(() => [props.filters, locale.value], () => {
  customerKey.value = ''
  customerName.value = ''
  needsReload = true
  revision++
  loading.value = false
  if (props.active) void load()
}, { immediate: true, deep: true })
watch(() => props.active, active => { if (active && needsReload) void load() })
onBeforeUnmount(() => { disposed = true; revision++; evidenceRevision++ })
</script>

<template>
  <div class="detail-section">
    <div class="detail-heading">
      <button v-if="canExport && tab !== 'customers'" :disabled="loading || exporting || !listing.total" @click="exportRows">{{ exporting ? t('analysis.exporting') : t('analysis.export') }}</button>
    </div>
    <div class="detail-tabs" role="tablist" :aria-label="t('analysis.details')">
      <button v-for="value in tabs" :key="value" role="tab" :aria-selected="tab === value" :class="{ active: tab === value }" @click="selectTab(value)">{{ t('analysis.tab_' + value) }}</button>
    </div>
    <p class="muted">{{ t('analysis.tabHelp_' + tab) }}</p>
    <p v-if="customerKey" class="customer-filter">{{ t('analysis.customer') }}：{{ customerName }} <button @click="clearCustomer">{{ t('analysis.clearCustomer') }}</button></p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <LoadingRegion :loading="loading">
      <div class="detail-scroll">
        <table v-if="tab === 'customers'">
          <thead><tr><th v-for="field in ['customer', 'amount', 'rows', 'first_date', 'last_date', 'brands', 'categories', 'first_amount', 'returning_amount']" :key="field">{{ t('analysis.' + field) }}</th><th>{{ t('analysis.view') }}</th></tr></thead>
          <tbody>
            <tr v-for="row in listing.list" :key="row.customer_key">
              <td>{{ row.customer_name }}</td><td>CNY {{ money(row.amount) }}</td><td>{{ row.rows }}</td><td>{{ row.first_date || '—' }}</td><td>{{ row.last_date || '—' }}</td>
              <td>{{ row.brands }}</td><td>{{ row.categories }}</td><td>CNY {{ money(row.first_amount) }}</td><td>CNY {{ money(row.returning_amount) }}</td>
              <td><button @click="customerDetails(row)">{{ t('analysis.viewDetails') }}</button></td>
            </tr>
            <tr v-if="!listing.list.length"><td colspan="10" class="empty">{{ t('analysis.noRows') }}</td></tr>
          </tbody>
        </table>
        <table v-else>
          <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th><th>{{ t('analysis.evidence') }}</th></tr></thead>
          <tbody>
            <tr v-for="row in listing.list" :key="row.id">
              <td v-for="column in columns" :key="column.key">{{ row.display?.[column.key] ?? '—' }}</td>
              <td><button @click="showEvidence(row.id)">{{ t('analysis.view') }}</button></td>
            </tr>
            <tr v-if="!listing.list.length"><td :colspan="columns.length + 1" class="empty">{{ t('analysis.noRows') }}</td></tr>
          </tbody>
        </table>
      </div>
      <ApiPagination :page="listing.page" :size="listing.per_page" :total="listing.total" :loading="loading" @change="load" />
    </LoadingRegion>
  </div>
  <el-dialog v-model="evidenceOpen" :title="t('analysis.evidence')" width="min(760px, 94vw)">
    <LoadingRegion :loading="evidenceLoading">
      <div v-if="evidence" class="evidence">
        <p>{{ evidence.filename }} · {{ evidence.sheet_name }} · {{ t('analysis.rowNumber') }} {{ evidence.row_number }}</p>
        <h3>{{ t('analysis.original') }}</h3>
        <dl><template v-for="(value, key) in evidence.raw.cells" :key="key"><dt>{{ key }}</dt><dd>{{ value }}</dd></template></dl>
        <h3>{{ t('analysis.matchEvidence') }}</h3>
        <p>{{ t('analysis.matchedCategory') }}：{{ locale === 'en-US' ? evidence.category_name_en : evidence.category_name }}</p>
        <p>{{ t('analysis.matchedBrand') }}：{{ locale === 'en-US' ? evidence.brand_name_en : evidence.brand_name }}</p>
        <p>{{ t('analysis.rulePositions') }}：{{ evidence.classification_evidence.rule_positions.join(' · ') || '—' }}</p>
        <p>{{ t('analysis.candidateCategories') }}：{{ evidence.classification_evidence.category_candidates.map((value: string) => t('analysis.category_' + value)).join(' / ') || '—' }}</p>
        <p v-if="evidence.classification_evidence.brand_pending">{{ t('analysis.pendingBrandHelp') }}</p>
        <h3 v-if="Object.keys(evidence.raw.formulas || {}).length">{{ t('analysis.formulas') }}</h3>
        <dl><template v-for="(value, key) in evidence.raw.formulas" :key="key"><dt>{{ key }}</dt><dd>{{ value }}</dd></template></dl>
      </div>
    </LoadingRegion>
  </el-dialog>
</template>
<style scoped>
.detail-heading, .detail-tabs, .customer-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.detail-heading { justify-content: flex-end; }
.detail-tabs { margin: 10px 0 14px; }
.detail-tabs .active { border-color: var(--workbench-blue, #409eff); color: var(--workbench-blue, #409eff); background: color-mix(in srgb, var(--workbench-blue, #409eff) 12%, transparent); }
.detail-scroll { overflow: auto; max-height: 650px; border: 1px solid var(--el-border-color); border-radius: 8px; }
.detail-scroll table { width: max-content; min-width: 100%; }
.detail-scroll th, .detail-scroll td { text-align: left; white-space: nowrap; min-width: 115px; max-width: none; }
.detail-scroll th { position: sticky; top: 0; z-index: 1; }
.evidence dl { display: grid; grid-template-columns: 40px 1fr; gap: 8px; }
.evidence dd { margin: 0; overflow-wrap: anywhere; }
</style>
