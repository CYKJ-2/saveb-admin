<template>
  <div class="overview-cards">
    <div
      v-for="card in cards"
      :key="card.title"
      class="overview-card"
      :style="{ '--accent': card.color }"
    >
      <div class="card-icon">
        <el-icon :size="28">
          <component :is="card.icon" />
        </el-icon>
      </div>
      <div class="card-content">
        <div class="card-title">{{ card.title }}</div>
        <div class="card-value">
          {{ card.prefix || '' }}{{ formatValue(card.value, !!card.prefix) }}{{ card.suffix || '' }}
        </div>
        <div class="card-meta">
          <span class="meta-label">{{ card.totalLabel }}:</span>
          <span class="meta-value">
            {{ card.prefix || '' }}{{ formatValue(card.totalValue, !!card.prefix) }}{{ card.suffix || '' }}
          </span>
          <el-tag
            v-if="card.trend !== undefined"
            :type="card.trend >= 0 ? 'success' : 'danger'"
            size="small"
            effect="plain"
            class="trend-tag"
          >
            <el-icon class="trend-icon">
              <CaretTop v-if="card.trend >= 0" />
              <CaretBottom v-else />
            </el-icon>
            {{ Math.abs(card.trend) }}%
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'

interface OverviewCard {
  title: string
  value: number
  totalValue: number
  totalLabel: string
  icon: any
  color: string
  prefix?: string
  suffix?: string
  trend?: number
}

defineProps<{
  cards: OverviewCard[]
}>()

function formatValue(value: number, monetary = false): string {
  return value.toLocaleString(locale.value, { minimumFractionDigits: monetary ? 2 : 0, maximumFractionDigits: 2 })
}
</script>

<style lang="scss" scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.overview-card {
  --accent: hsl(var(--primary));
  background: var(--workbench-card-background);
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--accent);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px hsl(0 0% 0% / 0.25);
    border-color: var(--accent);
  }

  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0.92;
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    margin-bottom: 4px;
    font-weight: 500;
  }

  .card-value {
    font-size: 26px;
    font-weight: 700;
    color: hsl(var(--foreground));
    line-height: 1.3;
    margin-bottom: 6px;
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));

    .meta-label {
      color: hsl(var(--muted-foreground) / 0.7);
      white-space: nowrap;
    }

    .meta-value {
      color: hsl(var(--foreground));
      font-weight: 500;
      white-space: nowrap;
    }

    .trend-tag {
      margin-left: 8px;

      .trend-icon {
        font-size: 10px;
        margin-right: 2px;
      }
    }
  }
}
</style>
