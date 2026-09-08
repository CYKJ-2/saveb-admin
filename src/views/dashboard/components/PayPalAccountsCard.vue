<template>
  <div class="paypal-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.paypal.title') }}</span>
      <el-button type="primary" link size="small" @click="viewDetail">
        {{ t('dashboard.paypal.detail') }}
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="total-block">
      <div class="total-label">{{ t('dashboard.paypal.totalBalance') }}</div>
      <div class="total-value">${{ formatNumber(paypal.totalBalance) }}</div>
    </div>

    <div class="stat-grid">
      <div class="stat-item online">
        <div class="stat-label">{{ t('dashboard.paypal.online') }}</div>
        <div class="stat-value">{{ paypal.online }}</div>
      </div>
      <div class="stat-item blocked">
        <div class="stat-label">{{ t('dashboard.paypal.frozen') }}</div>
        <div class="stat-value">{{ paypal.blocked }}</div>
      </div>
      <div class="stat-item offline">
        <div class="stat-label">{{ t('dashboard.paypal.offline') }}</div>
        <div class="stat-value">{{ paypal.offline }}</div>
      </div>
      <div class="stat-item total">
        <div class="stat-label">{{ t('dashboard.paypal.total') }}</div>
        <div class="stat-value">{{ paypal.total }}</div>
      </div>
    </div>

    <el-divider />

    <div class="amount-list">
      <div class="amount-row">
        <span class="amount-label">{{ t('dashboard.paypal.withdrawable') }}</span>
        <span class="amount-value success">${{ formatNumber(paypal.totalWithdrawable) }}</span>
      </div>
      <div class="amount-row">
        <span class="amount-label">{{ t('dashboard.paypal.frozenAmount') }}</span>
        <span class="amount-value warning">${{ formatNumber(paypal.totalFrozen) }}</span>
      </div>
      <div class="amount-row">
        <span class="amount-label">{{ t('dashboard.paypal.totalWithdrawn') }}</span>
        <span class="amount-value primary">${{ formatNumber(paypal.totalWithdrawn) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { paypalOverview } from '../data/mockData'

const { t, locale } = useI18n()
const paypal = paypalOverview

function formatNumber(value: number): string {
  return formatMoney(value, locale.value)
}

function viewDetail() {
  console.log(t('dashboard.paypal.detail'))
}
</script>

<style lang="scss" scoped>
.paypal-card {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
  transition: background-color 0.2s, border-color 0.2s;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
  }

  .total-block {
    text-align: center;
    padding: 16px 0;
    background: linear-gradient(135deg, hsl(212 100% 50% / 0.1), hsl(144 57% 58% / 0.1));
    border-radius: 8px;
    margin-bottom: 12px;

    .total-label {
      font-size: 12px;
      color: hsl(var(--muted-foreground));
      margin-bottom: 4px;
    }

    .total-value {
      font-size: 26px;
      font-weight: 700;
      color: hsl(var(--foreground));
      font-family: 'Courier New', monospace;
    }
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;

    .stat-item {
      text-align: center;
      padding: 8px 4px;
      border-radius: 6px;

      .stat-label {
        font-size: 11px;
        color: hsl(var(--muted-foreground));
        margin-bottom: 2px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
      }

      &.online {
        background: hsl(144 57% 58% / 0.1);
        .stat-value { color: hsl(144 57% 58%); }
      }

      &.blocked {
        background: hsl(359 68% 56% / 0.1);
        .stat-value { color: hsl(359 68% 60%); }
      }

      &.offline {
        background: hsl(42 84% 61% / 0.1);
        .stat-value { color: hsl(42 84% 65%); }
      }

      &.total {
        background: hsl(var(--accent));
        .stat-value { color: hsl(var(--foreground)); }
      }
    }
  }

  .amount-list {
    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;

      .amount-label {
        color: hsl(var(--muted-foreground));
      }

      .amount-value {
        font-weight: 600;
        font-family: 'Courier New', monospace;

        &.success { color: hsl(144 57% 58%); }
        &.warning { color: hsl(42 84% 65%); }
        &.primary { color: hsl(212 100% 60%); }
      }
    }
  }
}
</style>
