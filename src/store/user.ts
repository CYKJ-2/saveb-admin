/**
 * 用户状态管理
 *
 * 与后端接口（saveb-api）对接：
 * - POST /api/auth/login   { username, password } -> { token, user, permissions }
 * - GET  /api/auth/me       -> { user, token, permissions }
 * - POST /api/auth/logout
 *
 * 字段约定：后端真实返回结构参考 saveb-api/app/Controllers/AuthController.php
 *   permissions 是包含 menu+action 的混合树，前端必须派生侧边栏菜单。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/utils/request'
import { resetDynamicRoutes } from '@/router/permission'
import { useAppStore } from '@/store/app'
import { isExternalMenu } from '@/utils/external-menu'
import {
  getToken,
  setToken,
  clearAuth,
  getUserInfo,
  setUserInfo,
  type UserInfo,
  type PermissionNode,
  type MenuNode,
  type RoleI18n,
} from '@/utils/auth'

/* ===================== 后端响应 → 前端 UserInfo 适配 ===================== */

interface BackendAuthPayload {
  token?: string
  data?: {
    token?: string
    user?: BackendUser
    permissions?: PermissionNode[]
  }
  user?: BackendUser
  permissions?: PermissionNode[]
}

interface BackendUser {
  id: number
  username: string
  display_name?: string
  displayName?: string
  role_code?: string
  role_codes?: string[]
  staff_code?: string | null
  must_change_password?: boolean
  roles_i18n?: RoleI18n[]
  avatar?: string
  email?: string
  phone?: string
  homePath?: string
}

/**
 * 把后端登录 / me 返回的原始结构压平为前端约定的 UserInfo。
 */
function adaptUser(raw: any): UserInfo | null {
  if (!raw || typeof raw !== 'object') return null

  // unwrap 兼容多种包装结构（已经是 unwrapResponse 的结果，但保险起见还是检查一下）
  const payload = raw.data && typeof raw.data === 'object' ? raw.data : raw

  const userRaw: BackendUser | undefined = payload.user ?? payload.userInfo ?? payload
  if (!userRaw || typeof userRaw !== 'object' || !userRaw.username) return null

  // 角色取自 role_codes（多角色）或 role_code（主角色）
  const roleCodes: string[] = Array.isArray(userRaw.role_codes)
    ? userRaw.role_codes
    : typeof userRaw.role_code === 'string' && userRaw.role_code
      ? [userRaw.role_code]
      : []

  // 权限树：兼容 permissions 顶层 / data.permissions
  const tree: PermissionNode[] = Array.isArray(payload.permissions)
    ? payload.permissions
    : []

  return {
    id: userRaw.id,
    username: userRaw.username,
    realName:
      userRaw.display_name ||
      userRaw.displayName ||
      userRaw.username,
    avatar: userRaw.avatar || '',
    email: userRaw.email || '',
    phone: userRaw.phone || '',
    roles: roleCodes,
    permissions: [], // 由树派生
    permissionsTree: tree,
    menus: deriveMenus(tree),
    rolesI18n: userRaw.roles_i18n || [],
    mustChangePassword: !!userRaw.must_change_password,
    staffCode: userRaw.staff_code || null,
    homePath: userRaw.homePath || '/dashboard',
  }
}

/**
 * 提取 token。支持以下几种返回结构：
 *   { token: 'abc' }           （最常见，unwrapResponse 后）
 *   { accessToken: 'abc' }
 *   { data: { token: 'abc' } } （如果调用方未走 unwrapResponse）
 */
function extractToken(payload: any): string | null {
  if (!payload) return null
  if (typeof payload === 'string') return payload
  const direct =
    payload.token ||
    payload.accessToken ||
    payload.access_token ||
    null
  if (direct) return direct
  const nested = payload.data
  if (nested && typeof nested === 'object') {
    return (
      nested.token ||
      nested.accessToken ||
      nested.access_token ||
      null
    )
  }
  return null
}

/**
 * 把 permissions 树派生出扁平 code 列表与展示菜单数组。
 */
export function derivePermissionsFromTree(tree: PermissionNode[]): string[] {
  const codes = new Set<string>()
  const walk = (nodes: PermissionNode[]) => {
    for (const n of nodes) {
      if (n.status !== 1) continue
      if (n.code) codes.add(n.code)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(tree)
  return [...codes]
}

/**
 * 从 permissions 树中提取可显示的菜单（type=menu && !hidden && status=1）。
 * 返回扁平化的菜单数组（保留父子层级关系，便于侧边栏渲染）。
 */
export function deriveMenus(tree: PermissionNode[]): MenuNode[] {
  const walk = (nodes: PermissionNode[]): MenuNode[] => {
    const out: MenuNode[] = []
    for (const n of nodes) {
      // 后端 hidden 字段是布尔，true=不显示
      const isHiddenInSidebar = n.hidden === true
      // 后端 is_menu_visible 字段：menu 通常为 true，action 通常为 false
      // 但我们这里只看 type === 'menu'
      const isVisibleMenu =
        n.type === 'menu' &&
        n.status === 1 &&
        n.is_menu_visible !== false &&
        !isHiddenInSidebar

      if (isVisibleMenu) {
        const children = n.children?.length ? walk(n.children) : []
        out.push({
          ...n,
          // type 收窄为 'menu'
          type: 'menu' as const,
          path: n.path || `/${n.code.replace(/\./g, '/')}`,
          children: children as PermissionNode[],
        })
      } else if (n.type !== 'menu' && n.status === 1 && n.children?.length) {
        // action 节点不进入菜单，但它的子菜单（如有）需要被提取
        out.push(...walk(n.children))
      }
    }
    return out
  }
  // 后端根节点有 parent_id=0，按 type 全部截取即可
  return walk(tree)
}

/* ===================== Pinia Store ===================== */

export const useUserStore = defineStore('user', () => {
  // ========================= State =========================
  const token = ref<string>(getToken() || '')

  const initialInfo = getUserInfo()
  const userInfo = ref<UserInfo | null>(initialInfo)

  // 扁平权限 codes（纯字符串数组，hasPermission 用）
  const permissions = ref<string[]>(
    initialInfo?.permissions?.length
      ? initialInfo.permissions
      : derivePermissionsFromTree(initialInfo?.permissionsTree || []),
  )

  const roles = ref<string[]>(initialInfo?.roles || [])

  // 菜单树（来自后端 permissions 树，过滤菜单节点）
  const menus = ref<MenuNode[]>(initialInfo?.menus ?? [])

  // ========================= Getters =========================
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(
    () => userInfo.value?.realName || userInfo.value?.username || '',
  )
  const avatar = computed(() => userInfo.value?.avatar || '')
  const homePath = computed(() => {
    const firstPage = (nodes: MenuNode[]): string | undefined => {
      for (const node of nodes) {
        if (isExternalMenu(node.path)) continue
        const child = firstPage((node.children || []) as MenuNode[])
        if (child) return child
        if (node.component && node.component !== 'Layout') return node.path
      }
    }
    return firstPage(menus.value) || '/403'
  })

  /** 是否超级管理员（绕过所有权限检查） */
  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))

  // ========================= Actions =========================

  /** 内部：把后端授权载荷落盘到 store + localStorage */
  function applyAuthPayload(payload: any) {
    const info = adaptUser(payload)
    if (!info) return null

    info.permissions = derivePermissionsFromTree(info.permissionsTree || [])
    info.menus = deriveMenus(info.permissionsTree || [])

    if (JSON.stringify(userInfo.value?.permissionsTree) !== JSON.stringify(info.permissionsTree)) resetDynamicRoutes()
    userInfo.value = info
    permissions.value = info.permissions
    roles.value = info.roles
    menus.value = info.menus || []

    // Token 必须在外层调用方先设置（因为 token 不在 userInfo 内）
    setUserInfo(info)
    return info
  }

  /**
   * 登录
   * 后端真实响应：
   *   { success, code, message, data: { token, expires_at, user, permissions } }
   * request.unwrapResponse 已把 code 拆掉，剩下的就是 data
   */
  async function login(username: string, password: string) {
    try {
      const payload: any = await request.post('/auth/login', {
        username,
        password,
      })

      const tk = extractToken(payload)
      if (!tk) {
        return { success: false, message: '登录响应中未包含 token' }
      }

      token.value = tk
      setToken(tk)

      const info = applyAuthPayload(payload)
      if (!info) {
        resetStore()
        return { success: false, message: '登录响应中未包含用户信息' }
      }

      useAppStore().clearTagsView()
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || '登录失败',
      }
    }
  }

  /**
   * 拉取当前用户信息（含 permissions 树）
   * 后端：GET /api/auth/me
   */
  async function fetchUserInfo() {
    const payload: any = await request.get('/auth/me')
    const info = applyAuthPayload(payload)
    if (!info) {
      throw new Error('登录响应中未包含用户信息')
    }
    return info
  }

  async function logout() {
    // 防止多个请求同时 401 时重复触发 logout
    if (isLoggingOut) return
    isLoggingOut = true

    try {
      await request.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      resetStore()
      // 清理动态路由，避免 logout 后 router 还保留旧路由导致再次 401
      resetDynamicRoutes()
      isLoggingOut = false
    }
  }

  function resetStore() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    roles.value = []
    menus.value = []
    useAppStore().clearTagsView()
    clearAuth()
    resetDynamicRoutes()
  }

  /** 防止重复 logout 的标志（模块级状态） */
  let isLoggingOut = false

  /**
   * 判断是否有指定权限 code。
   *   hasPermission('user.create')         → 精确匹配
   *   hasPermission(['user.create', 'user.update']) → 任一命中
   * super_admin 角色直接返回 true。
   */
  function hasPermission(permission: string | string[]): boolean {
    if (!permission) return true
    if (isSuperAdmin.value) return true

    const required = Array.isArray(permission) ? permission : [permission]
    return required.some((p) => permissions.value.includes(p))
  }

  function hasRole(role: string | string[]): boolean {
    if (!role) return true
    if (isSuperAdmin.value) return true

    const required = Array.isArray(role) ? role : [role]
    return required.some((r) => roles.value.includes(r))
  }

  /**
   * 根据菜单 code 查找对应的菜单节点（含路径、组件、图标等）。
   */
  function findMenuByCode(code: string): MenuNode | undefined {
    const walk = (nodes: MenuNode[]): MenuNode | undefined => {
      for (const n of nodes) {
        if (n.code === code) return n
        if (n.children?.length) {
          const sub = walk(n.children as MenuNode[])
          if (sub) return sub
        }
      }
    }
    return walk(menus.value)
  }

  return {
    // State
    token,
    userInfo,
    permissions,
    roles,
    menus,

    // Getters
    isLoggedIn,
    username,
    avatar,
    homePath,
    isSuperAdmin,

    // Actions
    login,
    logout,
    fetchUserInfo,
    resetStore,
    hasPermission,
    hasRole,
    findMenuByCode,

    // Internal (作为 escape hatch，permission guard 可能用到 applyAuthPayload)
    applyAuthPayload,
  }
})
