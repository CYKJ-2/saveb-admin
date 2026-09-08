<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/app'
import { useNavigationTitle } from '@/hooks/useNavigationTitle'
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const appStore = useAppStore()
const { locale } = useI18n()
const navigationTitle = useNavigationTitle()
const route = useRoute()
const elementLocale = computed(() => locale.value === 'en-US' ? en : zhCn)
watchEffect(() => {
  document.documentElement.lang = locale.value === 'en-US' ? 'en' : 'zh-CN'
  const title = navigationTitle(route.meta)
  document.title = title ? `${title} - SAVEB ERP` : 'SAVEB ERP'
})
// 主题在 store 初始化时已经从 localStorage 恢复并应用，
// 这里不再做强制重置，避免覆盖用户已选择的主题。
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
