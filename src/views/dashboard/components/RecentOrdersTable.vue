<template>
  <div class="recent-orders">
    <div class="card-header">
      <div class="header-title">
        <span class="title-text">{{ t('dashboard.recentOrders.title') }}</span>
        <el-tag size="small" type="info" effect="plain">
          {{ t('dashboard.recentOrders.count', { count: orders.length }) }}
        </el-tag>
      </div>
      <el-button type="primary" link @click="viewAll">
        {{ t('common.viewAll') }}
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <el-table :data="orders" stripe style="width: 100%" size="default">
      <el-table-column prop="orderId" :label="t('dashboard.recentOrders.col.orderId')" width="170">
        <template #default="{ row }">
          <span class="order-id">{{ row.orderId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="customer" :label="t('dashboard.recentOrders.col.customer')" width="140" />
      <el-table-column prop="site" :label="t('dashboard.recentOrders.col.site')" width="150">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.site }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" :label="t('dashboard.recentOrders.col.source')" width="130">
        <template #default="{ row }">
          <el-tag size="small" :type="getCategoryType(row.category)" effect="light">
            {{ row.category }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="staff" :label="t('dashboard.recentOrders.col.cs')" width="80">
        <template #default="{ row }">
          <span v-if="row.staff" class="staff-name">{{ row.staff }}</span>
          <span v-else class="staff-empty">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="items" :label="t('dashboard.recentOrders.col.items')" width="70" align="center" />
      <el-table-column prop="amount" :label="t('dashboard.recentOrders.col.amount')" width="120" align="right">
        <template #default="{ row }">
          <span class="amount">${{ formatMoney(row.amount, locale) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="paymentStatus" :label="t('dashboard.recentOrders.col.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.paymentStatus)" size="small" effect="light">
            {{ row.paymentStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" :label="t('dashboard.recentOrders.col.createdAt')" width="130" />
      <el-table-column :label="t('common.operation')" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="viewDetail(row)">
            {{ t('dashboard.recentOrders.detail') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { recentOrders } from '../data/mockData'

const router = useRouter()
const { t, locale } = useI18n()

const orders = recentOrders

function getCategoryType(category: string) {
  const map: Record<string, any> = {
    'Official Sites': 'primary',
    'Top Influencers': 'success',
    'Offline Orders': 'warning',
    'Invoice Orders': 'danger',
  }
  return map[category] || 'info'
}

function getStatusType(status: string) {
  const map: Record<string, any> = {
    Completed: 'success',
    Pending: 'warning',
    Failed: 'danger',
  }
  return map[status] || 'info'
}

function viewAll() {
  router.push('/business/order')
}

function viewDetail(row: any) {
  console.log(t('business.order.toast.viewPrefix', { no: row.orderId }), row)
}
</script>

<style lang="scss" scoped>
.recent-orders {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
  margin-bottom: 16px;
  transition: background-color 0.2s, border-color 0.2s;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
  }

  .order-id {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: hsl(var(--primary));
  }

  .staff-name {
    color: hsl(var(--foreground));
    font-weight: 500;
  }

  .staff-empty {
    color: hsl(var(--muted-foreground) / 0.6);
  }

  .amount {
    font-weight: 600;
    color: hsl(var(--success));
  }
}
</style>
