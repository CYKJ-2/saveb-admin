<template>
  <el-tooltip :content="t('layout.themeToggle')" placement="bottom">
    <button
      type="button"
      class="theme-toggle"
      :aria-label="t('layout.themeToggle')"
      :aria-pressed="isDark"
      @click="appStore.toggleTheme()"
    >
      <svg v-if="!isDark" class="icon icon-moon" viewBox="0 0 24 24" fill="none">
        <path
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        />
      </svg>
      <svg v-else class="icon icon-sun" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
        />
      </svg>
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'

const { t } = useI18n()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === 'dark')
</script>

<style lang="scss" scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 36px;
  padding: 0 8px;
  cursor: pointer;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  .icon {
    width: 18px;
    height: 18px;
  }
}
</style>
