/**
 * 后端 permissions.component 字段 → 前端 Vue 组件的映射表。
 *
 * 后端 RbacSeeder 写入的 component 是简化的资源名（如 'system/UserList'），
 * 前端实际页面在 src/views/{module}/* 下。我们用两种策略：
 *   1) 显式映射：后端 component → 前端路径
 *   2) 默认推断：component 形如 'system.UserList' → '@/views/system/UserList/index.vue'
 *   3) 兜底找不到：使用通用占位页面 Placeholder.vue
 *
 * 后续业务模块页面建好后，只需在此表里加一行，无需改其它代码。
 */
import type { Component } from 'vue'

// 用变量 lambda 替代 Vite 的 import.meta.glob 避免 HMR 边界问题
const componentsMap: Record<string, () => Promise<Component>> = {
  // ─── Dashboard ───
  'dashboard/index': () => import('@/views/dashboard/index.vue'),
  'workbench/order-management/index': () => import('@/views/workbench/order-management/index.vue'),
  'dashboard/Overview': () => import('@/views/dashboard/index.vue'),

  // ─── System ───
  'system/UserList': () => import('@/views/system/user/index.vue'),
  'system/RoleList': () => import('@/views/system/role/index.vue'),
  'system/PermissionList': () => import('@/views/system/permission/index.vue'),

  // ─── Business ───
  'workbench/analysis/index': () => import('@/views/workbench/analysis/index.vue'),
  'business/OrderList': () => import('@/views/business/order/index.vue'),
  'business/InvoiceList': () => import('@/views/business/invoice/index.vue'),
  'business/ProcurementList': () => import('@/views/business/procurement/index.vue'),
  'business/InfluencerList': () => import('@/views/business/influencer/index.vue'),
}

/**
 * 默认占位：用于未知 component 的页面。它会显示 component 名，
 * 方便管理员识别"这里后端配了 component 但前端还没建对应文件"。
 */
const Placeholder = () => import('@/views/components/Placeholder.vue')

/**
 * 解析一个 component 名字符串 → 异步 import 函数。
 *
 * 接受以下几种形式：
 *   'system/UserList'      → 查映射表
 *   'system.UserList'      → 同上（自动转 /）
 *   'system.UserList.ktv'  → 同上
 *   '/' 或 ''              → 用 Placeholder
 */
export function resolveComponent(component: string | null | undefined): () => Promise<Component> {
  if (!component || component === '/') return Placeholder

  // 统一分隔符：'system/UserList' 或 'system.UserList' 都映射到同一个 key
  const key = component.replace(/\./g, '/').replace(/^\/+/, '')

  return componentsMap[key] ?? Placeholder
}

/**
 * 把后端菜单 component 字段里的最后一个段做 fallback 用。
 * 'dashboard.overview' → 'overview'
 */
export function inferComponentFromCode(code: string): string | undefined {
  const parts = code.split('.')
  return parts.length > 1 ? parts.slice(0, -1).join('/') : undefined
}
