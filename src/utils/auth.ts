/**
 * 认证工具
 * Token 管理 + 用户信息（含 RBAC permissions 树 & 扁平 code 列表）
 */

const TOKEN_KEY = 'saveb_token'
const USER_INFO_KEY = 'saveb_user_info'

/**
 * 后端返回的 permissions 树节点结构（参考 saveb-api/AuthController::presentPermissionNode）
 */
export interface PermissionNode {
  id: number
  parent_id: number
  code: string
  name: string
  name_zh?: string | null
  i18n?: {
    name: { en: string; zh?: string | null }
    description: { en?: string | null; zh?: string | null }
  }
  type: 'menu' | 'action'
  action?: string | null
  path?: string | null
  icon?: string | null
  component?: string | null
  level: number
  sort: number
  status: number
  hidden: boolean
  is_menu_visible: boolean
  children?: PermissionNode[]
}

/**
 * 角色 i18n 字段（来自 roles_i18n）
 */
export interface RoleI18n {
  code: string
  name_en: string
  name_zh?: string | null
  description_en?: string | null
  description_zh?: string | null
}

export interface UserInfo {
  id: number
  username: string
  realName: string
  avatar?: string
  email?: string
  phone?: string
  roles: string[]
  permissions: string[]
  homePath?: string
  /**
   * 后端返回的完整 permissions 树（menu + action）。
   * 用于前端渲染侧边栏菜单与按钮级权限。
   */
  permissionsTree?: PermissionNode[]
  /**
   * 菜单节点（type=menu && !hidden && status=1）。
   * 由 permissionsTree 派生，扁平化为可迭代列表。
   */
  menus?: MenuNode[]
  /** 角色 i18n 信息（来自 user.roles_i18n） */
  rolesI18n?: RoleI18n[]
  mustChangePassword?: boolean
  staffCode?: string | null
}

/**
 * 前端可用的菜单节点（仅 type=menu 的展示菜单）。
 */
export interface MenuNode extends PermissionNode {
  type: 'menu'
  path: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUserInfo(): UserInfo | null {
  const info = localStorage.getItem(USER_INFO_KEY)
  if (!info) return null
  try {
    return JSON.parse(info)
  } catch {
    return null
  }
}

export function setUserInfo(info: UserInfo): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export function removeUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY)
}

export function clearAuth(): void {
  removeToken()
  removeUserInfo()
}
