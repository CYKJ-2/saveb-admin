<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { orderManagementApi as api, type OrderRow } from '@/api/order-management'
import { localizePageMessage } from '@/lang/page-message'
import { adjustmentPayload, allocationTotal, equalAllocations, initialAllocations, replacePrimaryAllocation, staffCodes, validAllocations } from './order-editor'

const props = defineProps<{ order: OrderRow }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const primary = ref(staffCodes([props.order.primaryStaffCode || props.order.staffAllocations[0]?.staffCode || ''])[0] || '')
const allocations = ref(initialAllocations(props.order, primary.value))
const collaborators = ref(allocations.value.map(row => row.staffCode).filter(code => code !== primary.value))
const availableStaff = ref<string[]>([])
const choosingPrimary = ref(false)
const loading = ref(true)
const loadError = ref(false)
const saveError = ref('')
const saving = ref(false)
let active = true

const mode = computed(() => ['completed', 'failed'].includes(props.order.paymentStatus) ? props.order.paymentStatus : 'pending')
const title = computed(() => t(`pages.orderEditor.${mode.value}Title`))
const total = computed(() => allocationTotal(allocations.value))
const valid = computed(() => validAllocations(primary.value, allocations.value))
const options = computed(() => staffCodes([...availableStaff.value, primary.value, ...collaborators.value]).sort())
const collaboratorOptions = computed(() => options.value.filter(code => code !== primary.value))
const selectedCodes = () => staffCodes([primary.value, ...collaborators.value])

async function loadStaff() {
  loading.value = true
  loadError.value = false
  try {
    const data = await api.editorOptions()
    if (active) availableStaff.value = data.staff
  } catch {
    if (active) loadError.value = true
  } finally {
    if (active) loading.value = false
  }
}

function equalSplit() {
  allocations.value = equalAllocations(selectedCodes())
  saveError.value = ''
}

function updateCollaborators() {
  if (!primary.value && collaborators.value.length) primary.value = collaborators.value.shift()!
  equalSplit()
}

function changePrimary(value: string) {
  allocations.value = replacePrimaryAllocation(allocations.value, primary.value, value)
  primary.value = value
  collaborators.value = allocations.value.map(row => row.staffCode).filter(code => code !== value)
  choosingPrimary.value = false
  saveError.value = ''
}

function close() {
  if (!saving.value) emit('close')
}

async function save() {
  if (!valid.value || loading.value || loadError.value || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await api.adjust(props.order.id, adjustmentPayload(props.order, primary.value, allocations.value))
    ElMessage.success(t('pages.orderUpdated'))
    emit('saved')
  } catch (error: any) {
    saveError.value = localizePageMessage(error.message || t('pages.saveFailedRefreshTheOrderAndTryAgain'))
  } finally {
    saving.value = false
  }
}

onMounted(loadStaff)
onBeforeUnmount(() => { active = false })
</script>

<template>
  <el-drawer
    :model-value="true"
    class="order-workbench-drawer order-editor workbench-theme"
    :title="title"
    size="min(460px, 100vw)"
    :show-close="!saving"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    @close="close"
  >
    <template #header="{ titleId }">
      <div class="editor-heading">
        <h2 :id="titleId">{{ title }}</h2>
        <small :aria-label="t('pages.orderNumber')">{{ order.orderId || order.paypalOrderId || '—' }}</small>
      </div>
    </template>

    <div class="editor-field">
      <label>{{ t('pages.orderEditor.status') }}</label>
      <div class="editor-readonly" role="status">{{ t(`pages.orderEditor.${mode}Status`) }}</div>
    </div>

    <div class="editor-field">
      <label id="order-editor-primary-label">{{ t('pages.orderEditor.primary') }}</label>
      <div class="primary-row">
        <el-select
          v-if="choosingPrimary"
          :model-value="primary"
          :disabled="saving"
          :aria-label="t('pages.orderEditor.primary')"
          popper-class="order-workbench-popper workbench-theme"
          filterable
          @change="changePrimary"
        >
          <el-option v-for="code in options" :key="code" :label="code" :value="code" />
        </el-select>
        <div v-else class="editor-readonly primary-value" aria-labelledby="order-editor-primary-label">{{ primary || '—' }}</div>
        <el-button :disabled="loading || loadError || saving" @click="choosingPrimary = !choosingPrimary">{{ t(choosingPrimary ? 'pages.cancel' : 'pages.orderEditor.changePrimary') }}</el-button>
      </div>
    </div>

    <div class="editor-field">
      <label>{{ t('pages.orderEditor.collaborators') }}</label>
      <div class="staff-list" v-loading="loading">
        <el-checkbox-group v-model="collaborators" :disabled="saving || loadError" :aria-label="t('pages.orderEditor.collaborators')" @change="updateCollaborators">
          <el-checkbox v-for="code in collaboratorOptions" :key="code" :value="code" :disabled="allocations.length >= 20 && !collaborators.includes(code)">{{ code }}</el-checkbox>
        </el-checkbox-group>
        <p v-if="!loading && !loadError && !collaboratorOptions.length" class="empty-staff">{{ t('pages.orderEditor.noCollaborators') }}</p>
        <div v-if="loadError" class="staff-error" role="alert"><p>{{ t('pages.orderEditor.staffLoadFailed') }}</p><el-button @click="loadStaff">{{ t('pages.orderEditor.retry') }}</el-button></div>
      </div>
    </div>

    <div class="editor-field">
      <div class="share-heading"><label>{{ t('pages.orderEditor.salesShare') }}</label><el-button :disabled="saving || !allocations.length" @click="equalSplit">{{ t('pages.orderEditor.equalSplit') }}</el-button></div>
      <div class="share-list">
        <div v-for="allocation in allocations" :key="allocation.staffCode" class="share-row">
          <strong>{{ allocation.staffCode }}</strong>
          <div class="share-input"><el-input-number v-model="allocation.percent" :disabled="saving" :min="0" :max="100" :precision="2" :controls="false" :aria-label="`${allocation.staffCode} ${t('pages.orderEditor.salesShare')}`" /><span>%</span></div>
        </div>
      </div>
      <p v-if="allocations.length && !valid" class="editor-error" role="alert">{{ t('pages.orderEditor.invalidAllocation') }}</p>
    </div>
    <p v-if="saveError" class="editor-error" role="alert">{{ saveError }}</p>

    <template #footer>
      <div class="share-total" :class="{ invalid: !valid }" aria-live="polite">{{ t('pages.orderEditor.total', { total: total.toFixed(2) }) }}</div>
      <div class="editor-actions">
        <el-button :disabled="saving" @click="close">{{ t('pages.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" :disabled="!valid || loading || loadError" @click="save">{{ t(mode === 'pending' ? 'pages.orderEditor.savePending' : 'pages.orderEditor.saveChanges') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.editor-heading h2 { margin: 0 0 3px; font-size: 24px; font-weight: 700; color: var(--text); }
.editor-heading small { font-size: 13px; color: var(--text); overflow-wrap: anywhere; }
.editor-field { display: grid; gap: 7px; margin-bottom: 16px; }
.editor-field > label, .share-heading > label { color: var(--muted); font-size: 13px; font-weight: 700; }
.editor-readonly { padding: 11px 12px; border: 1px solid var(--workbench-control-border); border-radius: 8px; background: var(--panel-2); color: var(--text); min-height: 44px; }
.primary-row { display: flex; gap: 8px; align-items: stretch; }
.primary-value, .primary-row :deep(.el-select) { flex: 1; min-width: 0; }
.primary-row :deep(.el-button) { height: 44px; font-weight: 700; }
.primary-row :deep(.el-select__wrapper) { min-height: 44px; }
.staff-list { min-height: 56px; max-height: min(280px, 35vh); overflow-y: auto; border: 1px solid var(--workbench-control-border); border-radius: 10px; padding: 10px; }
.staff-list :deep(.el-checkbox-group) { display: grid; gap: 8px; }
.staff-list :deep(.el-checkbox) { margin: 0; min-height: 36px; padding: 8px; border-radius: 7px; color: var(--text); }
.staff-list :deep(.el-checkbox:hover) { background: var(--workbench-hover); }
.staff-list :deep(.el-checkbox__label) { font-weight: 700; }
.empty-staff { color: var(--muted); margin: 0; }
.share-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.share-heading :deep(.el-button) { font-weight: 700; }
.share-list { display: grid; gap: 8px; }
.share-row { display: grid; grid-template-columns: minmax(0, 1fr) 118px; align-items: center; gap: 12px; padding: 9px 10px; border: 1px solid var(--workbench-control-border); border-radius: 8px; background: var(--panel-2); }
.share-row strong { overflow-wrap: anywhere; color: var(--text); }
.share-input { display: flex; gap: 6px; align-items: center; }
.share-input :deep(.el-input-number) { width: 88px; }
.share-total { font-size: 13px; font-weight: 700; text-align: right; color: var(--blue); }
.editor-actions { display: flex; justify-content: flex-end; margin-top: 18px; }
.share-total.invalid, .editor-error, .staff-error { color: var(--red); }
.editor-error, .staff-error p { margin: 0; font-size: 13px; line-height: 1.6; }
</style>
