<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">403</h1>
      <p class="error-message">{{ t('error.403.message') }}</p>
      <el-button type="primary" @click="goHome">
        {{ t('common.backHome') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

function goHome() {
  router.push('/dashboard')
}
</script>

<style lang="scss" scoped>
.error-container {
  @include flex-center;
  min-height: 100vh;
  background: var(--workbench-page-background);
  color: hsl(var(--foreground));
}

.error-content {
  text-align: center;

  .error-code {
    font-size: 120px;
    font-weight: 700;
    color: hsl(359 68% 56%);
    line-height: 1;
    margin-bottom: 20px;
  }

  .error-message {
    font-size: 20px;
    color: hsl(var(--muted-foreground));
    margin-bottom: 30px;
  }
}
</style>
