<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
defineProps<{ rows: any[]; label: string; currencies?: boolean }>()
const money = (n: number) => n.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>
<template>
  <el-table :data="rows" size="small" max-height="360" :empty-text="t('pages.noDataForTheSelectedDates')">
    <el-table-column prop="key" :label="label" min-width="110" show-overflow-tooltip />
    <el-table-column prop="orders" :label="t('pages.order')" width="75" align="right" />
    <el-table-column prop="items" :label="t('pages.items')" width="75" align="right" />
    <el-table-column v-if="currencies" :label="t('pages.originalAmount')" min-width="105" align="right"><template #default="{row}">{{ money(row.amountOriginal) }}</template></el-table-column>
    <el-table-column :label="t('pages.salesUsd2')" min-width="115" align="right"><template #default="{row}">{{ money(row.amountUsd) }}</template></el-table-column>
  </el-table>
</template>
