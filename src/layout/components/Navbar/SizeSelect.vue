<template>
  <div class="size-select-component">
    <el-dropdown trigger="click" @command="handleSetSize">
      <div class="size-select">
        <el-icon :size="18"><Setting /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item of sizeOptions"
            :key="item.value"
            :command="item.value"
            :disabled="size === item.value"
          >
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'

const { t } = useI18n()
const appStore = useAppStore()

const size = computed({
  get: () => appStore.size,
  set: (val) => appStore.setSize(val),
})

const sizeOptions = computed(() => [
  { label: t('layout.navbar.size.default'), value: 'default' },
  { label: t('layout.navbar.size.medium'), value: 'large' },
  { label: t('layout.navbar.size.small'), value: 'small' },
])

function handleSetSize(s: 'default' | 'large' | 'small') {
  appStore.setSize(s)
  ElMessage.success(t('layout.sizeSwitched'))
}
</script>

<style lang="scss" scoped>
.size-select-component {
  display: flex;
  align-items: center;
  height: 100%;
}

.size-select {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s;
}

.size-select:hover {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}
</style>
