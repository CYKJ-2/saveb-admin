<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Row } from '@/api/workbench'
import { money } from '../shared/useWorkbench'

defineProps<{ rows: Row[]; loading: boolean; canUpdate: boolean; canDelete: boolean }>()
defineEmits<{ view: [row: Row]; edit: [row: Row]; remove: [row: Row] }>()
const { t } = useI18n()
const validLink = (value: unknown) => typeof value === 'string' && /^https?:\/\//i.test(value)
const sharePercent = (ratio: unknown) => Number((Number(ratio || 0) * 100).toFixed(2))
</script>

<template>
  <div class="table-wrap">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>{{ t('pages.invoiceOrderDate') }}</th>
          <th>{{ t('pages.orderNumber') }}</th>
          <th>{{ t('pages.invoiceRecipient') }}</th>
          <th>{{ t('pages.invoiceCountry') }}</th>
          <th>{{ t('pages.invoiceEmail') }}</th>
          <th>{{ t('pages.invoicePhone') }}</th>
          <th>{{ t('pages.invoiceAddress') }}</th>
          <th>{{ t('pages.invoiceProducts') }}</th>
          <th>{{ t('pages.invoiceOrderLink') }}</th>
          <th class="numeric">{{ t('pages.invoiceAmount') }}</th>
          <th>{{ t('pages.invoiceSalesShare') }}</th>
          <th class="actions">{{ t('pages.action') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td class="date">{{ row.order_date || row.invoice_date || '—' }}</td>
          <td>{{ row.order_number }}</td>
          <td>{{ row.customer_full_name || '—' }}</td>
          <td>{{ row.country || '—' }}</td>
          <td class="contact">{{ row.customer_email || '—' }}</td>
          <td class="contact">{{ row.phone_number || '—' }}</td>
          <td class="address">{{ row.address || '—' }}</td>
          <td class="products"><p v-for="item in row.items" :key="item.id">{{ item.product_name }} × {{ item.quantity }}</p></td>
          <td><a v-if="validLink(row.invoice_link)" :href="row.invoice_link" target="_blank" rel="noopener noreferrer">{{ t('pages.openInvoiceLink') }}</a><span v-else>—</span></td>
          <td class="numeric">{{ money(row.amount_usd) }} USD</td>
          <td><p v-for="allocation in row.allocations" :key="allocation.staff_code" class="share">{{ allocation.staff_code }} · {{ sharePercent(allocation.share_ratio) }}%</p><span v-if="!row.allocations?.length">—</span></td>
          <td class="actions"><div class="inline-actions"><button @click="$emit('view', row)">{{ t('pages.view') }}</button><button v-if="canUpdate" @click="$emit('edit', row)">{{ t('pages.edit') }}</button><button v-if="canDelete" class="danger" @click="$emit('remove', row)">{{ t('pages.delete') }}</button></div></td>
        </tr>
      </tbody>
    </table>
    <p v-if="!rows.length" class="empty">{{ loading ? t('pages.loading2') : t('pages.noMatchingOrders') }}</p>
  </div>
</template>

<style scoped>
.invoice-table { min-width: 1800px; }
.date, .share { white-space: nowrap; }
.contact { min-width: 160px; }
.address, .products { min-width: 230px; white-space: pre-line; }
.invoice-table p { margin: 0 0 6px; }
.actions { position: sticky; right: 0; background: var(--panel); box-shadow: -5px 0 8px #0002; }
th.actions { z-index: 1; }
</style>
