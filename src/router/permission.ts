/**
 * 路由守卫
 *
 * 流程：
 *   1) 设置 document.title
 *   2) 白名单放行
 *   3) 未登录 → 跳登录
 *   4) 已登录但 userInfo 缺失 → 拉 /api/auth/me
 *   5) 若侧边栏 / 动态路由未生成 → generateAsyncRoutes() 用 userStore.menus 派生路由
 *   6) meta.requiresPermission 校验（不通过 → 跳 403）
 *
 * 注意：本文件不再 import router 实例，避免与 @/router 形成循环依赖导致
 * TDZ（Cannot access 'router' before initialization）。守卫的实际注册在
 * router/index.ts 末尾通过 setupRouterGuards(router) 完成。
 */
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import i18n from '@/lang'
import { isWhiteList } from '@/utils/permission'
import { resolveNavigationTitle } from '@/utils/navigation-title'
import {
  generateAsyncRoutes,
  cleanupDynamicRoutes,
} from './generate-async-routes'

function resolveTitle(meta: import('vue-router').RouteMeta): string {
  return resolveNavigationTitle(
    meta,
    useUserStore().userInfo?.permissionsTree || [],
    i18n.global.locale.value,
    key => i18n.global.te(key) ? i18n.global.t(key) : key,
  )
}

/** 动态路由生成状态（用对象包装，便于跨模块同步状态） */
export const dynamicRoutesState = { generated: false }

/** 重置路由状态（用于登出） */
export function resetDynamicRoutes() {
  cleanupDynamicRoutes()
  dynamicRoutesState.generated = false
}

/**
 * 安装路由守卫。
 * 由 router/index.ts 在 router 实例创建完毕后调用。
 */
export function setupRouterGuards(router: import('vue-router').Router) {
  router.beforeEach(async (to, _from, next) => {
    // 白名单
    if (isWhiteList(to.path)) {
      next()
      return
    }

    const userStore = useUserStore()

    // 未登录
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // 已登录但 userInfo 缺失（首次 / refresh）
    if (to.path !== '/403' && to.path !== '/404') {
      ;(window as any).__SAVEB_INIT__ = true
      try {
        await userStore.fetchUserInfo()
      } catch (e) {
        console.error('[permission] fetchUserInfo failed', e)
        userStore.resetStore()
        cleanupDynamicRoutes()
        dynamicRoutesState.generated = false
        next({ path: '/login' })
        ;(window as any).__SAVEB_INIT__ = false
        return
      } finally {
        ;(window as any).__SAVEB_INIT__ = false
      }
    }

    if (to.path === '/') {
      next({ path: userStore.homePath, replace: true })
      return
    }

    if (to.path === '/workbench') {
      const firstPage = router.getRoutes().find((route) =>
        route.path.startsWith('/workbench/') &&
        typeof route.meta.requiresPermission === 'string' &&
        userStore.hasPermission(route.meta.requiresPermission),
      )
      next({ path: firstPage?.path || '/403', replace: true })
      return
    }

    // 动态路由生成（仅一次）。从后端 permissions 树派生"软路由"
    // 用于未来扩展。当前业务模块路由已在 src/router/index.ts 静态注册，
    // 即使 generateAsyncRoutes 还没跑，刷新访问也走静态路由表，不会 404。
    if (!dynamicRoutesState.generated) {
      const tree = userStore.userInfo?.permissionsTree || []
      try {
        generateAsyncRoutes(tree, '/dashboard')
        dynamicRoutesState.generated = true
      } catch (err) {
        console.error('[permission] generateAsyncRoutes failed', err)
      }
      ;(window as any).__SAVEB_INIT__ = false
      // 不再 next({...to, replace: true}) —— 静态路由表已能匹配 to.path，
      // 让本次导航直接通过即可。Vue-router 会用最新路由表再次解析。
    }

    const originalPath = to.redirectedFrom?.fullPath
    if (to.path === '/404' && originalPath && router.resolve(originalPath).matched.some((r) => r.name && r.name !== 'NotFoundDynamic')) {
      next({ path: originalPath, replace: true })
      return
    }

    // meta.requiresPermission 校验
    const required =
      (to.meta as any)?.requiresPermission ||
      (to.matched.find((r) => (r.meta as any)?.requiresPermission)?.meta as any)
        ?.requiresPermission
    if (required && !userStore.hasPermission(required)) {
      next({ path: '/403' })
      return
    }

    next()
  })

  router.afterEach((to, _from, failure) => {
    // 取消或失败的导航不能写入标签，也不能覆盖当前页面标题。
    if (failure) return
    const title = resolveTitle(to.meta)
    document.title = title
      ? `${title} - SAVEB ERP`
      : 'SAVEB ERP'

    // meta 保留权限标识，标签渲染时根据最新授权树和语言重新解析名称。
    if (to.matched.length && to.name && !to.meta.hidden) {
      const appStore = useAppStore()
      appStore.addTagsView({
        path: to.path,
        name: to.name as string,
        title,
        fullPath: to.fullPath,
        query: to.query,
        meta: to.meta,
      })
    }
  })
}
