<template>
  <div class="exchange-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.exchangeRate.title') }}</span>
      <el-tag size="small" type="info" effect="plain">
        {{ t('dashboard.exchangeRate.base', { base }) }}
      </el-tag>
    </div>

    <div class="base-info">
      <div class="base-date">{{ t('dashboard.exchangeRate.updatedAt') }} {{ rates.date }}</div>
      <div class="base-source">{{ rates.source }}</div>
    </div>

    <div class="rates-grid">
      <div
        v-for="rate in displayRates"
        :key="rate.currency"
        class="rate-item"
      >
        <div class="rate-flag">{{ getFlag(rate.currency) }}</div>
        <div class="rate-content">
          <div class="rate-currency">{{ rate.currency }}</div>
          <div class="rate-value">{{ rate.value.toFixed(4) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { exchangeRates } from '../data/mockData'

const { t } = useI18n()
const rates = exchangeRates
const base = rates.base

const displayRates = computed(() =>
  Object.entries(rates.rates)
    .map(([currency, value]) => ({
      currency,
      value,
    }))
    .filter((item) => item.currency !== base),
)

function getFlag(currency: string) {
  const flagMap: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    CNY: '🇨🇳',
    JPY: '🇯🇵',
    KRW: '🇰🇷',
    CAD: '🇨🇦',
    AUD: '🇦🇺',
    HKD: '🇭🇰',
    SGD: '🇸🇬',
    CHF: '🇨🇭',
    MXN: '🇲🇽',
  }
  return flagMap[currency] || '🌐'
}
</script>

<style lang="scss" scoped>
.exchange-card {
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

  .base-info {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: hsl(var(--accent));
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));

    .base-source {
      color: hsl(var(--primary));
    }
  }

  .rates-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .rate-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid hsl(var(--border));
    transition: all 0.2s;

    &:hover {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.08);
    }

    .rate-flag {
      font-size: 18px;
    }

    .rate-content {
      flex: 1;
      min-width: 0;

      .rate-currency {
        font-size: 12px;
        font-weight: 500;
        color: hsl(var(--muted-foreground));
      }

      .rate-value {
        font-size: 13px;
        color: hsl(var(--foreground));
        font-weight: 600;
        font-family: 'Courier New', monospace;
      }
    }
  }
}
</style>
