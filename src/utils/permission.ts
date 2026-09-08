/**
 * 权限判断工具
 * 参考 vue-element-admin 的简洁实现
 */

import { useUserStore } from '@/store/user'

// 权限白名单
const whiteList = ['/login', '/auth-redirect', '/register', '/forget-password']

/**
 * 检查是否有权限
 * @param permissions 用户权限列表
 * @param requiredPermissions 所需权限
 */
export function hasPermission(
  permissions: string[],
  requiredPermissions: string | string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }
  
  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions]
  
  return permissions.includes('*') || required.some((perm) => permissions.includes(perm))
}

/**
 * 检查是否在白名单
 */
export function isWhiteList(path: string): boolean {
  return whiteList.includes(path)
}

/**
 * 角色权限检查
 */
export function hasRole(roles: string[], requiredRoles: string | string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  
  const required = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles]
  
  return required.some((role) => roles.includes(role))
}

// 权限指令
function updatePermission(el: HTMLElement, binding: any) {
  el.style.display = useUserStore().hasPermission(binding.value) ? '' : 'none'
}
export const permissionDirective = {
  mounted: updatePermission,
  updated: updatePermission,
}
