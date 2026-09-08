<template>
  <el-tooltip :content="t('layout.themeToggle')" placement="bottom">
    <div class="theme-toggle" ref="btnRef" @click="toggleTheme">
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
    </div>
  </el-tooltip>

  <!-- 蒙层由 JS 直接 createElement，不走 Vue 模板 -->
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'

const { t } = useI18n()
const appStore = useAppStore()
const btnRef = ref<HTMLElement | null>(null)

const isDark = computed(() => appStore.theme === 'dark')

function maxRadius(x: number, y: number) {
  const w = window.innerWidth
  const h = window.innerHeight
  const dx = Math.max(x, w - x)
  const dy = Math.max(y, h - y)
  return Math.hypot(dx, dy)
}

let animating = false
let maskEl: HTMLDivElement | null = null

/**
 * 主题切换核心 —— vben 风格
 *
 *   关键时序：
 *     T0 (用户在旧主题屏幕点击)
 *     T1 (同步):
 *        - appStore.toggleTheme()      ← 底层主题切换（html.dark 变化）
 *        - createMask(r=0, 新主题色)   ← 直接挂一个 r=0 看不见的 mask
 *     T2 (~16ms 后):
 *        - mask.animate(clipPath: 0 → max)
 *        用户看到：新主题色圆从按钮位置扩散覆盖全屏
 *     T3 (~600ms 后):
 *        - mask 卸载 → 用户看到底层新主题（无缝衔接）
 *
 *   为避免 Vue 异步更新导致的"底层已经变色但 mask 还没挂上"问题，
 *   这里**不**使用 v-if 控制 mask，而是直接 createElement 挂到 body。
 *   这样 mask 的出现和 toggleTheme 在同一个同步流程里。
 */
async function toggleTheme() {
  if (animating) return
  animating = true

  try {
    const el = btnRef.value
    if (!el) {
      appStore.toggleTheme()
      animating = false
      return
    }

    const rect = el.getBoundingClientRect()
    const btnCx = rect.left + rect.width / 2
    const btnCy = rect.top + rect.height / 2
    const r = maxRadius(btnCx, btnCy)

    /* === 步骤 1: 同步切主题 + 挂 mask（顺序很重要）===
     *
     * 先 toggleTheme：底层 DOM 变成新主题（但还没渲染）
     * 再挂 mask：r=0，颜色=新主题色
     *
     * 由于这两个都是同步执行，浏览器在下一个 paint 会一次性看到：
     *  - 底层新主题
     *  - mask r=0（不可见）
     * 用户视觉上：屏幕瞬间变成新主题（这正是想要的起点）
     */
    appStore.toggleTheme()

    // 直接创建 mask DOM，绕开 Vue 异步更新
    const mask = document.createElement('div')
    mask.className = 'theme-mask'
    mask.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      background-color: hsl(var(--background));
      clip-path: circle(0px at ${btnCx}px ${btnCy}px);
      -webkit-clip-path: circle(0px at ${btnCx}px ${btnCy}px);
      will-change: clip-path;
    `
    document.body.appendChild(mask)
    maskEl = mask

    /* === 步骤 2: 强制浏览器先 paint（保证 r=0 那帧真的被画过） ===
     * 然后再启动扩散动画
     */
    await new Promise((resolve) => requestAnimationFrame(() => resolve()))
    await new Promise((resolve) => requestAnimationFrame(() => resolve()))

    if (!maskEl || !document.body.contains(maskEl)) {
      finish()
      return
    }

    /* === 步骤 3: 用 Web Animations API 同步推 mask 到 max ===
     *
     * 用 element.animate() 而不是 CSS transition：
     *  - animate() 在 next paint 帧开始，与底层主题切换无缝衔接
     *  - 不依赖 CSS 变量变化的间接触发
     */
    const anim = maskEl.animate(
      [
        { clipPath: `circle(0px at ${btnCx}px ${btnCy}px)` },
        { clipPath: `circle(${r}px at ${btnCx}px ${btnCy}px)` },
      ],
      {
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )
    anim.onfinish = () => finish()
    // 兜底
    setTimeout(finish, 800)
  } catch (e) {
    console.error('[ThemeToggle]', e)
    finish()
  }
}

function finish() {
  if (maskEl && maskEl.parentNode) {
    maskEl.parentNode.removeChild(maskEl)
  }
  maskEl = null
  animating = false
}

onBeforeUnmount(() => finish())
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
  border-radius: 6px;
  color: hsl(var(--foreground));
  transition: all 0.2s;

  &:hover {
    background: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
  }

  .icon {
    width: 18px;
    height: 18px;
  }
}
</style>
