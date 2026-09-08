<template>
  <div class="staff-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.staffRanking.title') }}</span>
      <el-tag size="small" type="success" effect="plain">
        {{ t('dashboard.staffRanking.todayTop', { count: staff.length }) }}
      </el-tag>
    </div>
    <div class="ranking-list">
      <div
        v-for="(item, index) in staff"
        :key="item.name"
        class="rank-item"
        :class="['rank-' + (index + 1)]"
      >
        <div class="rank-num">{{ index + 1 }}</div>
        <div class="rank-info">
          <div class="rank-name">{{ item.name }}</div>
          <div class="rank-meta">
            {{ t('dashboard.staffRanking.meta', { orders: item.orders, items: item.items }) }}
          </div>
        </div>
        <div class="rank-value">${{ formatMoney(item.amount ?? item.usd ?? 0, locale) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { staffRanking } from '../data/mockData'

const { t, locale } = useI18n()
const staff = staffRanking
</script>

<style lang="scss" scoped>
.staff-card {
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

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rank-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    background: hsl(var(--accent));
    transition: background 0.2s;

    &:hover {
      background: hsl(var(--accent-hover));
    }

    .rank-num {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: hsl(var(--muted));
      color: hsl(var(--muted-foreground));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    &.rank-1 .rank-num { background: hsl(42 84% 50%); color: #fff; }
    &.rank-2 .rank-num { background: hsl(220 14% 65%); color: #fff; }
    &.rank-3 .rank-num { background: hsl(28 75% 50%); color: #fff; }

    .rank-info {
      flex: 1;
      min-width: 0;
    }

    .rank-name {
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--foreground));
      margin-bottom: 2px;
    }

    .rank-meta {
      font-size: 11px;
      color: hsl(var(--muted-foreground));
    }

    .rank-value {
      font-size: 14px;
      font-weight: 700;
      color: hsl(var(--success));
      font-family: 'Courier New', monospace;
    }
  }
}
</style>
