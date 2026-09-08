<template>
  <div class="status-card">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.refreshStatus.title') }}</span>
      <el-tag :type="statusTagType" size="small" effect="dark">
        {{ statusText }}
      </el-tag>
    </div>

    <div class="status-icon-block" :class="stateClass">
      <el-icon :size="32">
        <CircleCheckFilled v-if="status.state === 'ok'" />
        <Loading v-else-if="status.state === 'running'" />
        <WarningFilled v-else />
      </el-icon>
      <span class="state-text">{{ stateLabel }}</span>
    </div>

    <el-descriptions :column="1" size="small" class="status-details">
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.interval')">
        {{ t('dashboard.refreshStatus.everyMin', { min: status.intervalMinutes }) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.next')">
        {{ status.nextAttemptAt }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.lastOk')">
        {{ status.lastSuccessAt }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.lastFail')">
        {{ status.lastFailureAt }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.reason')">
        <span class="error-text">{{ status.lastError }}</span>
      </el-descriptions-item>
      <el-descriptions-item :label="t('dashboard.refreshStatus.label.scrape')">
        {{ status.lastOrders }}{{ t('common.unitOrder') }} / {{ status.lastItems }}{{ t('common.unitItem') }} / ${{ formatMoney(status.lastUsdSales, locale) }}
      </el-descriptions-item>
    </el-descriptions>

    <div class="actions">
      <el-button type="primary" size="small" @click="triggerRefresh">
        <el-icon><Refresh /></el-icon>
        {{ t('dashboard.refreshStatus.btnNow') }}
      </el-button>
      <el-button size="small" @click="viewLogs">
        {{ t('dashboard.refreshStatus.btnLogs') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheckFilled, Loading, WarningFilled, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '@/utils/money'
import { refreshStatus } from '../data/mockData'

const { t, locale } = useI18n()
const status = refreshStatus

const statusTagType = computed(() => {
  switch (status.state) {
    case 'ok': return 'success'
    case 'running': return 'primary'
    case 'failed': return 'danger'
    default: return 'warning'
  }
})

const statusText = computed(() => {
  switch (status.state) {
    case 'ok': return t('dashboard.refreshStatus.status.normal')
    case 'running': return t('dashboard.refreshStatus.status.running')
    case 'failed': return t('dashboard.refreshStatus.status.failed')
    default: return t('dashboard.refreshStatus.status.abnormal')
  }
})

const stateClass = computed(() => {
  switch (status.state) {
    case 'ok': return 'state-ok'
    case 'running': return 'state-running'
    case 'failed': return 'state-failed'
    default: return 'state-warn'
  }
})

const stateLabel = computed(() => {
  switch (status.state) {
    case 'ok': return t('dashboard.refreshStatus.state.ok')
    case 'running': return t('dashboard.refreshStatus.state.running')
    case 'failed': return t('dashboard.refreshStatus.state.failed')
    default: return t('dashboard.refreshStatus.state.unknown')
  }
})

function triggerRefresh() {
  console.log(t('common.refresh'))
}

function viewLogs() {
  console.log(t('dashboard.refreshStatus.btnLogs'))
}
</script>

<style lang="scss" scoped>
.status-card {
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

  .status-icon-block {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;

    &.state-ok {
      background: hsl(144 57% 58% / 0.12);
      color: hsl(144 57% 58%);
      border: 1px solid hsl(144 57% 58% / 0.3);
    }

    &.state-running {
      background: hsl(212 100% 50% / 0.12);
      color: hsl(212 100% 60%);
      border: 1px solid hsl(212 100% 50% / 0.3);
    }

    &.state-failed {
      background: hsl(359 68% 56% / 0.12);
      color: hsl(359 68% 60%);
      border: 1px solid hsl(359 68% 56% / 0.3);
    }

    &.state-warn {
      background: hsl(42 84% 61% / 0.12);
      color: hsl(42 84% 65%);
      border: 1px solid hsl(42 84% 61% / 0.3);
    }

    .state-text {
      font-size: 13px;
      font-weight: 500;
    }
  }

  .status-details {
    margin-bottom: 16px;

    .error-text {
      color: hsl(359 68% 60%);
      font-size: 12px;
    }
  }

  .actions {
    display: flex;
    gap: 8px;

    .el-button {
      flex: 1;
    }
  }
}
</style>
