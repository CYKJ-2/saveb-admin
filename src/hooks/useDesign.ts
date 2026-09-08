/**
 * 命名空间工具（参考 vben-admin useDesign）
 *
 * 用途：
 * 1. 为组件/样式生成统一前缀，避免类名冲突
 * 2. 暴露当前激活的主题变量名，便于子组件以 reactive 方式读主题
 *
 * 为什么放在 Pinia 之外？
 * - 这是纯工具，不依赖任何 store，避免循环依赖
 * - 主题激活状态以 document.documentElement 上的 class 为准（dark/light），
 *   通过 ref('dark') 在初始化时读一次 + watch documentElement class 变化来保持同步
 */
import { ref, onMounted, onBeforeUnmount, readonly } from 'vue'

const APP_NAMESPACE = 'saveb'

// 单一 ref：跟踪当前激活的主题
const currentTheme = ref<'dark' | 'light'>(readInitialTheme())

function readInitialTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark'
  if (document.documentElement.classList.contains('light')) return 'light'
  return 'dark'
}

function observeTheme() {
  if (typeof document === 'undefined') return () => {}
  const observer = new MutationObserver(() => {
    const cls = document.documentElement.classList
    currentTheme.value = cls.contains('light') ? 'light' : 'dark'
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

export function useDesign(scope?: string) {
  onMounted(() => {
    observeTheme()
  })

  // 组件 class 前缀：saveb + scope（可选）
  function getPrefixCls(block: string, def?: string) {
    const prefix = scope ? `${APP_NAMESPACE}-${scope}` : APP_NAMESPACE
    if (block) return `${prefix}-${block}`
    return def ? `${prefix}-${def}` : prefix
  }

  return {
    prefixCls: getPrefixCls,
    theme: readonly(currentTheme),
  }
}
