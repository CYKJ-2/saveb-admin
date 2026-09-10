<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { businessDate } from '@/api/dashboard'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench } from '../shared/useWorkbench'
import InvoiceImage from './InvoiceImage.vue'
import InvoiceItems from './InvoiceItems.vue'
import { applyInvoiceOcr, convertInvoiceCurrency } from './ocr-form'

const props = defineProps<{ invoice?: Row | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { can, loading, error, run } = useWorkbench('invoice')
const uploading = ref(false)
const parsing = ref(false)
const ocr = ref<Row | null>(null)
const appliedCount = ref(0)
const pasteText = ref('')
const currencyText = ref('')
const currencyError = ref(false)
const options = ref<Row>({ staffCodes: [], ratesToUsd: { USD: 1 } })
const nextNumber = ref('')
const paymentStatuses = ['Paid', 'Pending', 'Overdue', 'Unpaid', 'Refunded', 'Failed']
const busy = computed(() => uploading.value || loading.value || parsing.value)
let pasteTimer: ReturnType<typeof setTimeout> | undefined
let pasteRevision = 0
let formRevision = 0
const uploadPreviewUrls = new Set<string>()

function emptyItem() {
  return { product_name: '', description: '', quantity: 1, price: '', notes: '', image_attachment_id: null, image: null }
}

function initialForm(): Row {
  const today = businessDate()
  const data: Row = {
    invoice_date: today, order_date: today, invoice_status: '',
    customer_full_name: '', customer_email: '', phone_number: '', country: '', address: '',
    invoice_link: '', recipient_paypal: '', amount_usd: '', expedited_shipping: false,
    gift_box: 'Has', fixed_discount: null, percentage_discount: null,
    invoice_screenshot_attachment_id: null, invoice_screenshot_image: null, items: [emptyItem()],
    allocations: [{ staff_code: '', percent: 100, commission_percent: 0 }],
    ...JSON.parse(JSON.stringify(props.invoice || {})),
  }
  if (props.invoice) {
    data.allocations = props.invoice.allocations.map((allocation: Row) => ({
      staff_code: allocation.staff_code,
      percent: Math.round(Number(allocation.share_ratio) * 10000) / 100,
      commission_percent: Number(allocation.commission_percent) || 0,
    }))
    data.expedited_shipping = !!props.invoice.expedited_shipping
  }
  return data
}

const form = reactive<Row>(initialForm())
const staffCodes = computed<string[]>(() => [...new Set<string>([
  ...options.value.staffCodes, ...form.allocations.map((allocation: Row) => allocation.staff_code).filter(Boolean),
])].sort())

function convertCurrency() {
  const amount = convertInvoiceCurrency(currencyText.value, options.value.ratesToUsd)
  currencyError.value = !!currencyText.value.trim() && amount === null
  if (amount !== null) form.amount_usd = amount
}

function applyRecognition(result: Row, before: Row) {
  ocr.value = result
  appliedCount.value = applyInvoiceOcr(form, result, before)
  if (result.currency && result.currency !== 'USD' && result.sourceAmount && form.amount_usd === before.amount_usd) {
    currencyText.value = `${result.sourceAmount} ${result.currency}`
    convertCurrency()
  }
}

async function upload(file: File, item?: Row) {
  if (busy.value) return
  uploading.value = true
  error.value = ''
  try {
    const result = await workbench.upload(file)
    const previewUrl = URL.createObjectURL(file)
    uploadPreviewUrls.add(previewUrl)
    const image = { id: result.id, src: previewUrl, status: 'ready' }
    if (item) {
      item.image_attachment_id = result.id
      item.image = image
    }
    else {
      form.invoice_screenshot_attachment_id = result.id
      form.invoice_screenshot_image = image
      ocr.value = null
      if (can('ocr')) await recognize()
    }
  } catch (exception: any) {
    error.value = exception.message || t('pages.uploadFailed')
  } finally {
    uploading.value = false
  }
}

function chooseScreenshot(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) void upload(input.files[0])
  input.value = ''
}

function dropScreenshot(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file) void upload(file)
}

async function recognize() {
  const attachmentId = form.invoice_screenshot_attachment_id
  const revision = formRevision
  const before = JSON.parse(JSON.stringify(form))
  ocr.value = null
  appliedCount.value = 0
  await run(() => workbench.post('/invoice-ocr', { attachmentId }, 120000), result => {
    if (revision === formRevision && attachmentId === form.invoice_screenshot_attachment_id) applyRecognition(result, before)
  })
}

// 输入结束后自动识别；新一轮粘贴、清空或关闭表单都会使旧响应失效。
function schedulePaste() {
  clearTimeout(pasteTimer)
  const revision = ++pasteRevision
  parsing.value = false
  if (!pasteText.value.trim()) return
  parsing.value = true
  pasteTimer = setTimeout(() => { void recognizePaste(revision) }, 450)
}

async function recognizePaste(revision: number) {
  const text = pasteText.value.trim()
  const before = JSON.parse(JSON.stringify(form))
  error.value = ''
  try {
    const result = await workbench.post('/invoices/parse-text', { text })
    if (revision === pasteRevision) applyRecognition(result, before)
  } catch (exception: any) {
    if (revision === pasteRevision) error.value = exception.message || t('pages.loadFailedPleaseTryAgain')
  } finally {
    if (revision === pasteRevision) parsing.value = false
  }
}

function clearForm() {
  formRevision++
  pasteRevision++
  clearTimeout(pasteTimer)
  Object.assign(form, initialForm())
  pasteText.value = ''
  currencyText.value = ''
  currencyError.value = false
  ocr.value = null
  appliedCount.value = 0
  parsing.value = false
  error.value = ''
}

function pick(row: Row, keys: string[]) {
  return Object.fromEntries(keys.map(key => [key, row[key] === '' ? null : row[key]]))
}

async function save() {
  if (busy.value) return
  if (form.invoice_status !== 'Paid') {
    error.value = t('pages.invoiceForm.notPaid')
    return
  }
  const total = form.allocations.reduce((sum: number, allocation: Row) => sum + Number(allocation.percent), 0)
  if (Math.abs(total - 100) > 0.001) {
    error.value = t('pages.salesAssociateAllocationMustTotal100')
    return
  }
  const data = pick(form, [
    'version', 'invoice_date', 'order_date', 'invoice_status', 'customer_full_name', 'customer_email',
    'phone_number', 'country', 'address', 'invoice_link', 'recipient_paypal', 'amount_usd',
    'expedited_shipping', 'gift_box', 'fixed_discount', 'percentage_discount', 'invoice_screenshot_attachment_id',
  ])
  if (!props.invoice) delete data.version
  data.items = form.items.map((item: Row) => pick(item, ['product_name', 'description', 'quantity', 'price', 'notes', 'image_attachment_id']))
  data.allocations = form.allocations.map((allocation: Row) => pick(allocation, ['staff_code', 'percent', 'commission_percent']))
  await run(() => props.invoice ? workbench.put(`/invoices/${props.invoice.id}`, data) : workbench.post('/invoices', data), () => emit('saved'))
}

onMounted(async () => {
  try {
    options.value = await workbench.get('/invoices/form-options')
    if (!props.invoice && can('create')) nextNumber.value = (await workbench.get('/invoices/next-number')).number
  } catch (exception: any) {
    error.value = exception.message || t('pages.loadFailedPleaseTryAgain')
  }
})

onBeforeUnmount(() => {
  uploadPreviewUrls.forEach(url => URL.revokeObjectURL(url))
  formRevision++
  pasteRevision++
  clearTimeout(pasteTimer)
})
</script>

<template>
  <div class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.invoiceRegistration')">
    <form class="editor-content invoice-editor" @submit.prevent="save">
      <header>
        <h2>{{ invoice ? t('pages.editInvoice') : t('pages.registerInvoice') }}</h2>
        <button type="button" @click="emit('close')">{{ t('pages.close') }}</button>
      </header>
      <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
      <section class="panel">
        <h3>{{ t('pages.orderInformation') }}</h3>
        <div class="form-grid">
          <label>{{ t('pages.invoiceForm.dateAdded') }}<input v-model="form.invoice_date" type="date" readonly required /></label>
          <label>{{ t('pages.invoiceForm.orderDate') }}<input v-model="form.order_date" type="date" /></label>
          <label>{{ t('pages.invoiceForm.orderNumber') }}<input :value="invoice?.order_number || nextNumber" :placeholder="t('pages.assignedOnSave')" readonly /></label>
        </div>
        <p v-if="invoice" class="muted">{{ t('pages.invoiceForm.editingHint') }}</p>
        <div v-for="(allocation, index) in form.allocations" :key="index" class="toolbar">
          <label>{{ t('pages.invoiceForm.salesAssociate') }}
            <select v-model="allocation.staff_code" required>
              <option value="" disabled>{{ t('pages.invoiceForm.select') }}</option>
              <option v-for="code in staffCodes" :key="code" :value="code">{{ code }}</option>
            </select>
          </label>
          <label>{{ t('pages.invoiceForm.commissionPercent') }}<input v-model.number="allocation.percent" type="number" min="0.01" max="100" step="0.01" required /></label>
          <button type="button" class="danger" :disabled="form.allocations.length === 1" @click="form.allocations.splice(index, 1)">{{ t('pages.remove') }}</button>
        </div>
        <button type="button" @click="form.allocations.push({ staff_code: '', percent: 0, commission_percent: 0 })">{{ t('pages.addSalesAssociate') }}</button>
      </section>
      <section class="panel">
        <label class="paste-label">{{ t('pages.invoiceForm.pasteTitle') }}
          <textarea v-model="pasteText" rows="5" maxlength="30000" :placeholder="t('pages.invoiceForm.pastePlaceholder')" :disabled="uploading || loading" @input="schedulePaste" />
        </label>
        <p v-if="parsing" class="muted" role="status">{{ t('pages.recognizing') }}</p>
      </section>
      <section class="panel" @dragover.prevent @drop.prevent="dropScreenshot">
        <h3>{{ t('pages.invoiceForm.invoiceScreenshot') }}</h3>
        <div class="grid2">
          <div>
            <label>{{ t('pages.invoiceForm.invoiceScreenshot') }}<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="chooseScreenshot" /></label>
            <p class="muted">{{ t('pages.invoiceForm.screenshotHelp') }}</p>
            <button v-if="can('ocr')" type="button" :disabled="!form.invoice_screenshot_attachment_id || busy" @click="recognize">{{ loading ? t('pages.recognizing') : t('pages.recognizeScreenshotText') }}</button>
            <p v-if="uploading" class="muted">{{ t('pages.uploading') }}</p>
          </div>
          <InvoiceImage :image="form.invoice_screenshot_image" :id="form.invoice_screenshot_attachment_id" />
        </div>
        <template v-if="ocr">
          <p role="status">{{ appliedCount ? t('pages.invoiceOcrApplied', { count: appliedCount }) : t('pages.invoiceOcrNoFields') }}</p>
          <p v-if="form.invoice_status && form.invoice_status !== 'Paid'" class="error">{{ t('pages.invoiceForm.notPaid') }}</p>
          <p class="muted">{{ t('pages.reviewTheRecognizedTextAndVerifyTheCustomerPayment') }}</p>
          <details><summary>{{ t('pages.ocrResults') }}</summary><textarea :value="ocr.text" readonly rows="8" class="ocr-text" :aria-label="t('pages.ocrResults')" /></details>
        </template>
      </section>
      <section class="panel">
        <div class="form-grid">
          <label>{{ t('pages.invoiceForm.recipientName') }}<input v-model="form.customer_full_name" required /></label>
          <label>{{ t('pages.invoiceForm.phoneNumber') }}<input v-model="form.phone_number" /></label>
          <label>{{ t('pages.invoiceForm.country') }}<input v-model="form.country" /></label>
          <label class="wide">{{ t('pages.invoiceForm.address') }}<textarea v-model="form.address" rows="2" /></label>
          <label>{{ t('pages.invoiceForm.status') }}
            <select v-model="form.invoice_status" required>
              <option value="" disabled>{{ t('pages.invoiceForm.select') }}</option>
              <option v-for="status in paymentStatuses" :key="status" :value="status">{{ t(`pages.invoiceForm.status${status}`) }}</option>
            </select>
          </label>
          <label>{{ t('pages.invoiceForm.invoiceLink') }}<input v-model="form.invoice_link" type="url" required /></label>
          <label>{{ t('pages.invoiceForm.orderAmount') }}<input v-model="form.amount_usd" type="number" min="0.01" max="10000000" step="0.01" required /></label>
          <label>{{ t('pages.invoiceForm.currencyConverter') }}<input v-model="currencyText" placeholder="100 EUR" @input="convertCurrency" />
            <span :class="currencyError ? 'error' : 'muted'">{{ t(currencyError ? 'pages.invoiceForm.currencyUnavailable' : 'pages.invoiceForm.currencyHelp') }}</span>
          </label>
          <label>{{ t('pages.invoiceForm.customerEmail') }}<input v-model="form.customer_email" type="email" required /></label>
          <label>{{ t('pages.invoiceForm.receivingPaypal') }}<input v-model="form.recipient_paypal" type="email" required /></label>
          <label>{{ t('pages.invoiceForm.fixedDiscount') }}<input v-model="form.fixed_discount" type="number" min="0" step="0.01" /></label>
          <label>{{ t('pages.invoiceForm.percentageDiscount') }}<input v-model="form.percentage_discount" type="number" min="0" max="100" step="0.01" /></label>
          <label>{{ t('pages.invoiceForm.giftBox') }}<select v-model="form.gift_box"><option value="Has">{{ t('pages.invoiceForm.has') }}</option><option value="None">{{ t('pages.invoiceForm.none') }}</option></select></label>
          <label>{{ t('pages.invoiceForm.expeditedShipping') }}<select v-model="form.expedited_shipping"><option :value="false">{{ t('pages.no') }}</option><option :value="true">{{ t('pages.yes') }}</option></select></label>
        </div>
      </section>
      <InvoiceItems :items="form.items" :busy="busy" @add="form.items.push(emptyItem())" @remove="form.items.splice($event, 1)" @upload="upload" />
      <div class="toolbar">
        <button class="primary" :disabled="busy || !form.invoice_screenshot_attachment_id">{{ t(invoice ? 'pages.invoiceForm.saveChanges' : 'pages.invoiceForm.save') }}</button>
        <button type="button" :disabled="busy" @click="clearForm">{{ t(invoice ? 'pages.invoiceForm.reset' : 'pages.clear') }}</button>
        <button type="button" @click="emit('close')">{{ t('pages.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.editor-content.invoice-editor { width: min(1240px, 100%); }
.editor-content.invoice-editor .form-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.invoice-editor input[readonly] { color: var(--muted); cursor: default; }
.paste-label { font-size: 14px; }
.ocr-text { width: 100%; margin-top: 12px; }
@media (max-width: 800px) { .editor-content.invoice-editor .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .editor-content.invoice-editor .form-grid { grid-template-columns: 1fr; } }
</style>
