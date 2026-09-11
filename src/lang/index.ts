/**
 * i18n 入口
 * 装配所有语言模块，合并并导出 createI18n
 */
import { createI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'
import zhCN_pages from './modules/zh-CN/pages'
import enUS_pages from './modules/en-US/pages'
import zhCN_influencer from './modules/zh-CN/influencer'
import enUS_influencer from './modules/en-US/influencer'
import zhCN_paypal from './modules/zh-CN/paypal'
import enUS_paypal from './modules/en-US/paypal'
import zhCN_operations from './modules/zh-CN/operations'
import enUS_operations from './modules/en-US/operations'
import zhCN_analysis from './modules/zh-CN/analysis'
import enUS_analysis from './modules/en-US/analysis'
import zhCN_personalPerformance from './modules/zh-CN/personal-performance'
import enUS_personalPerformance from './modules/en-US/personal-performance'

import zhCN_common from './modules/zh-CN/common'
import zhCN_login from './modules/zh-CN/login'
import zhCN_layout from './modules/zh-CN/layout'
import zhCN_dashboard from './modules/zh-CN/dashboard'
import zhCN_error from './modules/zh-CN/error'
import zhCN_business from './modules/zh-CN/business'
import zhCN_system from './modules/zh-CN/system'
import zhCN_route from './modules/zh-CN/route'

import enUS_common from './modules/en-US/common'
import enUS_login from './modules/en-US/login'
import enUS_layout from './modules/en-US/layout'
import enUS_dashboard from './modules/en-US/dashboard'
import enUS_error from './modules/en-US/error'
import enUS_business from './modules/en-US/business'
import enUS_system from './modules/en-US/system'
import enUS_route from './modules/en-US/route'

const zhCN = {
  personalPerformance: zhCN_personalPerformance,
  analysis: zhCN_analysis,
  operations: zhCN_operations,
  paypal: zhCN_paypal,
  influencer: zhCN_influencer,
  pages: zhCN_pages,
  common: zhCN_common,
  login: zhCN_login,
  layout: zhCN_layout,
  dashboard: zhCN_dashboard,
  error: zhCN_error,
  business: zhCN_business,
  system: zhCN_system,
  route: zhCN_route,
}

const enUS = {
  personalPerformance: enUS_personalPerformance,
  analysis: enUS_analysis,
  operations: enUS_operations,
  paypal: enUS_paypal,
  influencer: enUS_influencer,
  pages: enUS_pages,
  common: enUS_common,
  login: enUS_login,
  layout: enUS_layout,
  dashboard: enUS_dashboard,
  error: enUS_error,
  business: enUS_business,
  system: enUS_system,
  route: enUS_route,
}

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}


// 解析初始语言：Pinia store > localStorage > 浏览器语言
export function resolveLocale(): 'zh-CN' | 'en-US' {
  try {
    const fromStore = useAppStore().currentLocale
    if (fromStore === 'zh-CN' || fromStore === 'en-US') return fromStore
  } catch {
    // 在 main.ts 安装 i18n 之前调用会是空，这里 ignore
  }
  const saved = localStorage.getItem('saveb-locale')
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  const browser = (navigator.language || '').toLowerCase()
  if (browser.startsWith('zh')) return 'zh-CN'
  if (browser.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,                 // Composition API 风格
  globalInjection: true,
  locale: resolveLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  // 关闭未使用警告（如果用到 fallback）
  silentFallbackWarn: true,
  silentTranslationWarn: process.env.NODE_ENV === 'production',
})

export default i18n

/**
 * 切换语言 - 全局 helper
 * 同时更新 vue-i18n + Pinia store + localStorage + Element Plus locale
 * 不刷新页面 — 通过响应式 locale 让组件自动更新
 */
export function setLocale(locale: 'zh-CN' | 'en-US') {
  ;(i18n.global.locale as any).value = locale
  try {
    useAppStore().setLocale(locale)
  } catch {}
  localStorage.setItem('saveb-locale', locale)
  document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en'
  // Element Plus is synchronized by the reactive ElConfigProvider in App.vue.
}
