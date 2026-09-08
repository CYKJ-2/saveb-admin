<template>
  <el-dropdown
    class="lang-select"
    trigger="click"
    @command="handleCommand"
  >
    <div class="lang-trigger">
      <!--
        纯文字图标：
        - 中文态：显示"中"
        - 英文态：显示"EN"
        用字体直接呈现，识别度高，跟随主题色。
      -->
      <span class="lang-text">{{ currentLocale === 'zh-CN' ? '中' : 'EN' }}</span>
    </div>

    <template #dropdown>
      <el-dropdown-menu class="lang-dropdown-menu">
        <el-dropdown-item
          v-for="lang in langs"
          :key="lang.value"
          :command="lang.value"
          :disabled="currentLocale === lang.value"
        >
          <span class="lang-dot" :class="{ active: currentLocale === lang.value }"></span>
          <span class="lang-text">{{ lang.label }}</span>
          <el-icon v-if="currentLocale === lang.value" class="lang-check"><Check /></el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { setLocale } from '@/lang'
import type { LocaleType } from '@/store/app'

const appStore = useAppStore()
const currentLocale = computed(() => appStore.currentLocale)

/**
 * 支持的语言列表：
 * - 中文（简体）
 * - English
 * 后续如果新增语种，直接加一项即可。
 */
const langs: { value: LocaleType; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]

function handleCommand(cmd: LocaleType) {
  if (currentLocale.value === cmd) return
  setLocale(cmd)
}
</script>

<style lang="scss" scoped>
.lang-select {
  display: inline-flex;
}

.lang-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 36px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 6px;
  color: hsl(var(--foreground));
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
  }

  .lang-text {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    line-height: 1;
    transition: transform 0.3s ease;
  }

  &:hover .lang-text {
    transform: scale(1.1);
  }
}

/* 下拉菜单：vben 风格 */
:deep(.lang-dropdown-menu) {
  background-color: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 4px 16px hsl(0 0% 0% / 0.18);
  border-radius: 8px;
  padding: 4px;
  min-width: 160px;

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    color: hsl(var(--foreground));
    font-size: 13px;
    line-height: 1;
    transition: background-color 0.15s;

    &:not(.is-disabled):hover {
      background-color: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
    }

    &.is-disabled {
      cursor: default;
      opacity: 1;
      color: hsl(var(--primary));

      .lang-text {
        font-weight: 600;
      }
    }

    .lang-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: hsl(var(--muted-foreground) / 0.3);
      transition: background 0.2s, transform 0.2s;
      flex-shrink: 0;

      &.active {
        background: hsl(var(--primary));
        box-shadow: 0 0 0 3px hsl(var(--primary) / 0.18);
      }
    }

    .lang-text {
      flex: 1;
    }

    .lang-check {
      color: hsl(var(--primary));
      font-size: 14px;
      margin-left: auto;
    }
  }
}
</style>
