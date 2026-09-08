<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { localizePageMessage } from '@/lang/page-message'
import { useBusinessLocale } from '@/composables/useBusinessLocale'
const { businessLabel } = useBusinessLocale()
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { ref, reactive, onMounted } from 'vue'
import { workbench, type Row } from '@/api/workbench'
import { useWorkbench } from '../shared/useWorkbench'
import InvoiceEditorDialog from './InvoiceEditorDialog.vue'
import InvoiceTable from './InvoiceTable.vue'
import InvoiceDetails from './InvoiceDetails.vue'
import '../shared/legacy.css'
const { can, loading, error, run } = useWorkbench('invoice'); const rows = ref<Row[]>([]); const total = ref(0); const filters = reactive({ keyword: '', startDate: '', endDate: '', page: 1, per_page: 20 }); const editor = ref(false); const editingId = ref<number | null>(null); const detailId = ref<number | null>(null); const logs = ref<Row[] | null>(null)
const logPage = ref(1), logSize = ref(20), logTotal = ref(0)
function load() { if (can('list')) run(() => workbench.get('/invoices', filters), result => { rows.value = result.list; total.value = result.total; filters.page = result.page }) }
function search() { filters.page = 1; load() }
function edit(row?: Row) { editingId.value = row ? Number(row.id) : null; editor.value = true }
function saved() { editor.value = false; load() }
async function remove(row: Row) { if (!window.confirm(t('pages.deleteInvoice', { p0: (row.order_number) }))) return; await run(() => workbench.remove(`/invoices/${row.id}`, row.version), () => {}); if (!error.value) load() }
function showLogs() { logPage.value = 1; loadLogs() }
function loadLogs() { run(() => workbench.get('/invoices/logs', { page: logPage.value, per_page: logSize.value }), result => { logs.value = result.data; logTotal.value = result.total }) }
onMounted(load)
</script>
<template><main class="legacy-workbench"><header><div><h1>{{ t('pages.invoiceOrderRegistering') }}</h1><p class="muted">{{ t('pages.screenshotRecognitionPaidOrderEntryProductImagesAndSales') }}</p></div><div class="toolbar"><button v-if="can('create')" class="primary" @click="edit()">{{ t('pages.registerInvoice') }}</button><button @click="load">{{ t('pages.refresh') }}</button><button v-if="can('logs')" @click="showLogs">{{ t('pages.operationLogs') }}</button></div></header><p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p><section v-if="can('list')" class="panel"><form class="toolbar" @submit.prevent="search"><label>{{ t('pages.orderNumberCustomerEmail') }}<input v-model="filters.keyword" type="search" /></label><label>{{ t('pages.startDate') }}<input v-model="filters.startDate" type="date" /></label><label>{{ t('pages.endDate') }}<input v-model="filters.endDate" type="date" /></label><button class="primary" :disabled="loading">{{ t('pages.search') }}</button><button type="button" @click="Object.assign(filters, { keyword: '', startDate: '', endDate: '' }); search()">{{ t('pages.clear') }}</button></form><InvoiceTable :rows="rows" :loading="loading" :can-update="can('update')" :can-delete="can('delete')" @view="detailId = Number($event.id)" @edit="edit" @remove="remove" /><ApiPagination v-model:page="filters.page" v-model:size="filters.per_page" :total="total" :loading="loading" @change="load" /></section><InvoiceEditorDialog v-if="editor" :key="editingId ?? 'new'" :invoice-id="editingId" @close="editor = false" @saved="saved" /><InvoiceDetails v-if="detailId !== null" :key="detailId" :id="detailId" @close="detailId = null" /><div v-if="logs" class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.invoiceOperationLogs')"><section class="editor-content"><header><h2>{{ t('pages.recentOperationLogs') }}</h2><button @click="logs = null">{{ t('pages.close') }}</button></header><button v-if="can('export')" @click="workbench.download('/invoices/logs/export', t('pages.invoiceOperationLogsCsv'))">{{ t('pages.exportAllLogs') }}</button><div class="table-wrap"><table><thead><tr><th>{{ t('pages.time') }}</th><th>{{ t('pages.action2') }}</th><th>{{ t('pages.recordId') }}</th><th>{{ t('pages.operator') }}</th></tr></thead><tbody><tr v-for="log in logs" :key="log.id"><td>{{ log.created_at }}</td><td>{{ businessLabel(log.action) }}</td><td>{{ log.entity_id }}</td><td>{{ log.actor_user_id }}</td></tr></tbody></table></div><ApiPagination v-model:page="logPage" v-model:size="logSize" :total="logTotal" :loading="loading" @change="loadLogs" /></section></div></main></template>
