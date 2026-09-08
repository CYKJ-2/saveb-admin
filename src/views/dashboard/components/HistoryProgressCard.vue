<template>
  <div class="progress-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.historyProgress.title') }}</span>
      <el-tag :type="progress.running ? 'primary' : 'success'" size="small" effect="dark">
        {{ progress.running ? t('dashboard.historyProgress.running') : t('dashboard.historyProgress.done') }}
      </el-tag>
    </div>

    <div class="progress-info">
      <div class="progress-date">
        {{ progress.startDate }} ~ {{ progress.endDate }}
      </div>
      <div class="progress-percent">
        <span class="percent-value">{{ progress.percent }}%</span>
        <span class="percent-meta">{{ progress.cachedDays }}/{{ progress.totalDays }} {{ t('dashboard.historyProgress.daysSuffix') }}</span>
      </div>
    </div>

    <el-progress
      :percentage="progress.percent"
      :stroke-width="10"
      :show-text="false"
      :color="progress.percent === 100 ? 'hsl(144 57% 58%)' : 'hsl(212 100% 50%)'"
    />

    <div class="meta-list">
      <div class="meta-row">
        <span class="meta-label">{{ t('dashboard.historyProgress.currentDate') }}</span>
        <span class="meta-value">{{ progress.currentDate }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">{{ t('dashboard.historyProgress.updatedAt') }}</span>
        <span class="meta-value">{{ progress.updatedAt }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { historyProgress } from '../data/mockData'

const { t } = useI18n()
const progress = historyProgress
</script>

<style lang="scss" scoped>
.progress-card {
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

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 8px;

    .progress-date {
      font-size: 13px;
      color: hsl(var(--foreground));
      font-weight: 500;
    }

    .progress-percent {
      text-align: right;

      .percent-value {
        font-size: 20px;
        font-weight: 700;
        color: hsl(var(--primary));
        margin-right: 6px;
      }

      .percent-meta {
        font-size: 12px;
        color: hsl(var(--muted-foreground));
      }
    }
  }

  .meta-list {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px dashed hsl(var(--border));

    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;

      .meta-label {
        color: hsl(var(--muted-foreground));
      }

      .meta-value {
        color: hsl(var(--foreground));
      }
    }
  }
}
</style>
