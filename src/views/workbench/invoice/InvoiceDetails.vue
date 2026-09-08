<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import InvoiceImage from './InvoiceImage.vue'
import { money } from '../shared/useWorkbench'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const detail = ref<Row | null>(null)
const loading = ref(true)
const error = ref('')
let revision = 0

async function load() {
  const current = ++revision
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    // 与原版一样按记录 ID 重新读取详情，图片绑定不依赖分页列表中的旧数据。
    const invoice = await workbench.get<Row>(`/invoices/${props.id}`)
    if (current === revision) detail.value = invoice
  } catch (failure: any) {
    if (current === revision) error.value = failure.message || t('pages.loadFailedPleaseTryAgain')
  } finally {
    if (current === revision) loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { revision++ })
</script>

<template>
  <div class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.invoiceDetails')">
    <section class="editor-content" :aria-busy="loading">
      <header>
        <h2>{{ detail ? `Invoice ${detail.order_number}` : t('pages.invoiceDetails') }}</h2>
        <button type="button" @click="emit('close')">{{ t('pages.close') }}</button>
      </header>
      <p v-if="loading" class="muted" role="status">{{ t('pages.invoiceDetailLoading') }}</p>
      <div v-else-if="error" class="error" role="alert">
        <p>{{ localizePageMessage(error) }}</p>
        <button type="button" @click="load">{{ t('pages.invoiceDetailRetry') }}</button>
      </div>
      <template v-else-if="detail">
        <div class="grid2">
          <div>
            <h3>{{ detail.customer_full_name }}</h3>
            <p>{{ detail.customer_email }}</p>
            <p>{{ detail.phone_number }} · {{ detail.country }}</p>
            <p>{{ detail.address }}</p>
            <p>{{ t('pages.paidAmountUsd', { p0: money(detail.amount_usd) }) }}</p>
            <p>{{ t('pages.paymentAccount2', { p0: detail.recipient_paypal }) }}</p>
            <a v-if="/^https?:\/\//i.test(detail.invoice_link || '')" :href="detail.invoice_link" target="_blank" rel="noopener noreferrer">{{ t('pages.openInvoiceLink') }}</a>
          </div>
          <div>
            <h3>{{ t('pages.invoiceForm.invoiceScreenshot') }}</h3>
            <InvoiceImage :image="detail.invoice_screenshot_image" :id="detail.invoice_screenshot_attachment_id" />
          </div>
        </div>
        <section v-for="item in detail.items" :key="item.id" class="panel">
          <h3>{{ item.product_name }}</h3>
          <p>{{ item.quantity }} × {{ money(item.price) }} USD</p>
          <p>{{ item.description }}</p>
          <p>{{ item.notes }}</p>
          <InvoiceImage v-if="item.image_attachment_id" :image="item.image" :id="item.image_attachment_id" />
        </section>
      </template>
    </section>
  </div>
</template>
