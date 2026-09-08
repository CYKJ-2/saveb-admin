<template>
  <div class="spreadsheets-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.spreadsheets.title') }}</span>
      <el-tag size="small" type="info" effect="plain">WPS</el-tag>
    </div>

    <div class="sheet-list">
      <a
        v-for="sheet in sheets"
        :key="sheet.id"
        :href="sheet.url"
        target="_blank"
        class="sheet-item"
      >
        <el-icon class="sheet-icon" :size="18">
          <Document />
        </el-icon>
        <div class="sheet-content">
          <div class="sheet-title">{{ sheet.title }}</div>
          <div class="sheet-meta">{{ sheet.provider }} · {{ t('dashboard.spreadsheets.metaSuffix') }}</div>
        </div>
        <el-icon class="sheet-arrow" :size="14">
          <ArrowRight />
        </el-icon>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, ArrowRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { onlineSpreadsheets } from '../data/mockData'

const { t } = useI18n()
const sheets = onlineSpreadsheets
</script>

<style lang="scss" scoped>
.spreadsheets-card {
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

  .sheet-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sheet-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid hsl(var(--border));
    text-decoration: none;
    color: hsl(var(--foreground));
    background: hsl(var(--accent) / 0.5);
    transition: all 0.2s ease;

    &:hover {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.08);
      transform: translateX(2px);

      .sheet-arrow {
        color: hsl(var(--primary));
        transform: translateX(2px);
      }
    }

    .sheet-icon {
      color: hsl(var(--primary));
      flex-shrink: 0;
    }

    .sheet-content {
      flex: 1;
      min-width: 0;

      .sheet-title {
        font-size: 13px;
        color: hsl(var(--foreground));
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sheet-meta {
        font-size: 11px;
        color: hsl(var(--muted-foreground));
        margin-top: 2px;
      }
    }

    .sheet-arrow {
      color: hsl(var(--muted-foreground));
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
  }
}
</style>
