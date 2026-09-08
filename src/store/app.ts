/**
 * 应用状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type LocaleType = 'zh-CN' | 'en-US'
export type ThemeType = 'light' | 'dark'

export interface TagsView {
  path: string
  name: string
  title: string
  fullPath: string
  query?: Record<string, any>
  meta?: Record<string, any>
}

export const useAppStore = defineStore('app', () => {
  // ========================= State =========================
  const sidebar = ref({
    opened: true,
    withoutAnimation: false,
  })

  const device = ref<'desktop' | 'mobile'>('desktop')

  const tagsView = ref<TagsView[]>([])

  const cachedViews = ref<string[]>([])

  // 国际化语言
  const currentLocale = ref<LocaleType>(loadLocale())

  // 字号大小（Default/Medium/Small/Mini）
  const size = ref<'default' | 'large' | 'small'>('default')

  // 主题：浅色 / 深色
  const theme = ref<ThemeType>(loadTheme())

  // ========================= Getters =========================
  const isMobile = computed(() => device.value === 'mobile')
  const isSidebarOpened = computed(() => sidebar.value.opened)
  const isDark = computed(() => theme.value === 'dark')

  // ========================= Actions =========================
  function toggleSidebar() {
    sidebar.value.opened = !sidebar.value.opened
    sidebar.value.withoutAnimation = false
  }

  function closeSidebar(config?: { withoutAnimation?: boolean }) {
    sidebar.value.opened = false
    sidebar.value.withoutAnimation = config?.withoutAnimation ?? false
  }

  function toggleDevice(deviceType: 'desktop' | 'mobile') {
    device.value = deviceType
  }

  function addTagsView(view: TagsView) {
    const existingIndex = tagsView.value.findIndex((v) => v.path === view.path)

    if (existingIndex > -1) {
      // 更新已有标签
      tagsView.value[existingIndex] = { ...tagsView.value[existingIndex], ...view }
    } else {
      // 添加新标签
      tagsView.value.push({ ...view })
    }

    // 维护缓存
    if (view.name && !cachedViews.value.includes(view.name)) {
      cachedViews.value.push(view.name)
    }
  }

  function removeTagsView(target: string | string[]) {
    const targets = Array.isArray(target) ? target : [target]

    tagsView.value = tagsView.value.filter((v) => !targets.includes(v.path))
    // 根据剩余标签重建缓存名单，避免已关闭页面继续留在缓存中。
    cachedViews.value = [...new Set(tagsView.value.map((view) => view.name).filter(Boolean))]
  }

  function clearTagsView() {
    tagsView.value = []
    cachedViews.value = []
    localStorage.removeItem('tagsView')
  }

  // ========================= 国际化 / 字号 / 主题 =========================
  function loadLocale(): LocaleType {
    const saved = localStorage.getItem('saveb-locale')
    if (saved === 'zh-CN' || saved === 'en-US') return saved
    const browser = (navigator.language || '').toLowerCase()
    if (browser.startsWith('zh')) return 'zh-CN'
    if (browser.startsWith('en')) return 'en-US'
    return 'zh-CN'
  }

  function setLocale(locale: LocaleType) {
    currentLocale.value = locale
    localStorage.setItem('saveb-locale', locale)
    document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en'
  }

  function setSize(s: 'default' | 'large' | 'small') {
    size.value = s
    localStorage.setItem('saveb-size', s)
  }

  function loadSize() {
    const saved = localStorage.getItem('saveb-size')
    if (saved === 'default' || saved === 'large' || saved === 'small') {
      size.value = saved
    }
  }

  function loadTheme(): ThemeType {
    const saved = localStorage.getItem('saveb-theme') as ThemeType | null
    if (saved === 'dark' || saved === 'light') return saved
    // 默认 = 深色（vben 风格黑灰色）
    return 'dark'
  }

  function setTheme(t: ThemeType) {
    theme.value = t
    localStorage.setItem('saveb-theme', t)
    applyTheme(t)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function applyTheme(t: ThemeType) {
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.classList.toggle('light', t === 'light')
  }

  // 标签仅保留在当前页面会话中。浏览器刷新时清除旧版保存的历史标签。
  clearTagsView()
  loadSize()
  applyTheme(theme.value)

  return {
    // State
    sidebar,
    device,
    tagsView,
    cachedViews,
    currentLocale,
    size,
    theme,

    // Getters
    isMobile,
    isSidebarOpened,
    isDark,

    // Actions
    toggleSidebar,
    closeSidebar,
    toggleDevice,
    addTagsView,
    removeTagsView,
    clearTagsView,
    setLocale,
    setSize,
    setTheme,
    toggleTheme,
  }
})
