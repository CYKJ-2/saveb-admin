<template>
  <div class="placeholder-page">
    <el-result icon="info" :title="title" :sub-title="t('common.comingSoon')">
      <template #extra>
        <el-button type="primary" @click="$router.push('/dashboard')">
          {{ t('common.backHome') }}
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ title: string }>()
const { t } = useI18n()
</script>

<style lang="scss" scoped>
.placeholder-page {
  @include flex-center;
  min-height: 400px;
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 40px;
}
</style>
