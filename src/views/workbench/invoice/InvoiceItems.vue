<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Row } from '@/api/workbench'
import InvoiceImage from './InvoiceImage.vue'

defineProps<{ items: Row[]; busy: boolean }>()
const emit = defineEmits<{ add: []; remove: [index: number]; upload: [file: File, item: Row] }>()
const { t } = useI18n()

function chooseImage(event: Event, item: Row) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) emit('upload', input.files[0], item)
  input.value = ''
}

function dropImage(event: DragEvent, item: Row) {
  const file = event.dataTransfer?.files[0]
  if (file) emit('upload', file, item)
}
</script>

<template>
  <section class="panel">
    <header>
      <h3>{{ t('pages.items2') }}</h3>
      <button type="button" :disabled="busy" @click="emit('add')">{{ t('pages.addItem') }}</button>
    </header>
    <article v-for="(item, index) in items" :key="index" class="product-row">
      <header>
        <h3>{{ t('pages.item2', { p0: index + 1 }) }}</h3>
        <button type="button" class="danger" :disabled="busy || items.length === 1" @click="emit('remove', index)">{{ t('pages.remove') }}</button>
      </header>
      <div class="product-fields">
        <label>{{ t('pages.invoiceForm.productName') }}<input v-model="item.product_name" required maxlength="2000" /></label>
        <label>{{ t('pages.invoiceForm.description') }}<input v-model="item.description" maxlength="4000" /></label>
        <label>{{ t('pages.invoiceForm.quantity') }}<input v-model.number="item.quantity" type="number" min="1" max="10000" required /></label>
        <label>{{ t('pages.invoiceForm.price') }}<input v-model="item.price" type="number" min="0" max="10000000" step="0.01" required /></label>
        <label>{{ t('pages.invoiceForm.notes') }}<textarea v-model="item.notes" rows="2" maxlength="4000" /></label>
        <div class="product-image" @dragover.prevent @drop.prevent="!busy && dropImage($event, item)">
          <label>{{ t('pages.invoiceForm.productImage') }}<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="chooseImage($event, item)" /></label>
          <InvoiceImage v-if="item.image_attachment_id" :image="item.image" :id="item.image_attachment_id" thumbnail />
          <p v-else class="muted">{{ t('pages.invoiceForm.imageHelp') }}</p>
          <button v-if="item.image_attachment_id" type="button" :disabled="busy" @click="item.image_attachment_id = null">{{ t('pages.invoiceForm.removeImage') }}</button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.product-row { border-top: 1px solid var(--line); padding-top: 18px; margin-top: 18px; }
.product-row h3 { margin: 0; font-size: 14px; }
.product-fields { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1.3fr 150px; align-items: start; gap: 12px; }
.product-fields input, .product-fields textarea { width: 100%; }
.product-image { display: grid; gap: 10px; justify-items: start; }
.product-image label { width: 100%; }
.product-image button { font-size: 12px; padding: 4px 8px; }
@media (max-width: 1000px) { .product-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .product-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
