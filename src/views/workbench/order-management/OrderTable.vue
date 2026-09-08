<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { OrderRow } from '@/api/order-management'
import { useBusinessLocale } from '@/composables/useBusinessLocale'

defineProps<{
  rows: OrderRow[]
  categories: Record<string, string>
  canEdit: boolean
}>()
const emit = defineEmits<{ edit: [order: OrderRow] }>()
const { t, locale } = useI18n()
const { businessLabel } = useBusinessLocale()
const time = (value: string) => value ? dayjs(value).format('YY-MM-DD HH:mm') : '—'
const money = (value: number | null) => value == null ? '—' : value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <el-table :data="rows" class="order-list-table" stripe>
    <el-table-column :label="t('pages.orderTable.orderTime')" width="145">
      <template #default="{ row }">{{ time(row.createTime) }}</template>
    </el-table-column>
    <el-table-column :label="t('pages.orderTable.orderId')" min-width="165">
      <template #default="{ row }">
        <div class="order-identity">
          <span>{{ row.orderId || '—' }}</span>
          <small v-if="row.paypalOrderId" :aria-label="t('pages.paypalOrderId')">{{ row.paypalOrderId }}</small>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="customerFullName" :label="t('pages.orderTable.customerFullName')" min-width="145" />
    <el-table-column prop="clientSite" :label="t('pages.orderTable.sourceSite')" min-width="170" />
    <el-table-column :label="t('pages.orderTable.classification')" min-width="120">
      <template #default="{ row }">
        <div class="order-classification">
          <el-tag size="small" :class="`category-${row.classification}`">{{ categories[row.classification] || row.classification }}</el-tag>
          <small v-if="row.staff">{{ row.staff }}</small>
        </div>
      </template>
    </el-table-column>
    <el-table-column :label="t('pages.orderTable.orderStatus')" width="105">
      <template #default="{ row }">{{ businessLabel(row.paymentStatus) }}</template>
    </el-table-column>
    <el-table-column prop="recipientPaypal" :label="t('pages.orderTable.recipientPaypal')" min-width="210" />
    <el-table-column :label="t('pages.orderTable.amount')" min-width="135" align="right">
      <template #default="{ row }">{{ money(row.amount) }} {{ row.currency }}</template>
    </el-table-column>
    <el-table-column prop="productName" :label="t('pages.orderTable.productName')" min-width="200" show-overflow-tooltip />
    <el-table-column v-if="canEdit" :label="t('pages.orderTable.actions')" fixed="right" width="95">
      <template #default="{ row }">
        <el-button v-if="row.kind === 'order' && ['pending', 'completed', 'failed'].includes(row.paymentStatus)" class="order-edit-button" @click="emit('edit', row)">{{ t('pages.edit') }}</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.order-identity, .order-classification { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
.order-identity small, .order-classification small { color: var(--muted); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.category-offline { --el-tag-bg-color: color-mix(in srgb, var(--el-color-success) 12%, transparent); --el-tag-border-color: color-mix(in srgb, var(--el-color-success) 25%, transparent); --el-tag-text-color: var(--el-color-success); }
</style>
