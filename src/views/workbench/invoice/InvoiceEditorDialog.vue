<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import InvoiceEditor from './InvoiceEditor.vue'

const props = defineProps<{ invoiceId: number | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const invoice = ref<Row | null>(null)
const ready = ref(props.invoiceId === null)
const loading = ref(false)
const error = ref('')
let revision = 0

async function load() {
  if (props.invoiceId === null) return
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    // 取得最新版本、商品及附件绑定后才初始化表单，不将分页行当作完整编辑数据。
    const detail = await workbench.get<Row>(`/invoices/${props.invoiceId}`)
    if (current !== revision) return
    invoice.value = detail
    ready.value = true
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
  <InvoiceEditor v-if="ready" :invoice="invoice" @close="emit('close')" @saved="emit('saved')" />
  <div v-else class="editor" role="dialog" aria-modal="true" :aria-label="t('pages.editInvoice')">
    <section class="editor-content" :aria-busy="loading">
      <header>
        <h2>{{ t('pages.editInvoice') }}</h2>
        <button type="button" @click="emit('close')">{{ t('pages.close') }}</button>
      </header>
      <p v-if="loading" class="muted" role="status">{{ t('pages.invoiceDetailLoading') }}</p>
      <div v-else-if="error" class="error" role="alert">
        <p>{{ localizePageMessage(error) }}</p>
        <button type="button" @click="load">{{ t('pages.invoiceDetailRetry') }}</button>
      </div>
    </section>
  </div>
</template>
