/**
 * 路由配置
 * 参考 vue-element-admin 的简洁结构
 *
 * 路由 meta.title 使用 i18n key（不带命名空间前缀，落在 `route.*`）
 * 具体文案从 `src/lang/modules/{locale}/route.ts` 读取
 */
import { createRouter, createWebHistory, type RouteRecordRaw, type RouteRecordNormalized } from 'vue-router'
import Layout from '@/layout/index.vue'
import { setupRouterGuards } from './permission'

// 静态路由（无需权限）
export const constantRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'Root', component: Layout, meta: { hidden: true } },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'login', hidden: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: 'notFound', hidden: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: 'forbidden', hidden: true },
  },
]

// 动态路由（需要权限）
export const asyncRoutes: RouteRecordRaw[] = [
  // ─── 静态业务模块：稳定不变，刷新可直接访问 ───
  // 侧边栏显示哪些菜单由后端 permissions 树决定，但路由表本身固定存在，
  // 避免动态 addRoute 后路径解析与 redirect 产生竞争。
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/overview',
    meta: { title: 'home', icon: 'Odometer', requiresPermission: 'dashboard' },
    children: [
      { path: 'collector', redirect: '/system/collector', meta: { hidden: true } },
      { path: 'order-management', redirect: '/workbench/order-management', meta: { title: 'business-order', hidden: true } },
      {
        path: 'overview',
        name: 'Dashboard_overview',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: 'home-overview', icon: 'HomeOutlined', requiresPermission: 'dashboard.overview' },
      },
    ],
  },
  {
    path: '/workbench',
    component: Layout,
    meta: { title: 'workbench', icon: 'ShoppingCart', requiresPermission: 'business' },
    children: [
      { path: 'order-management', name: 'Workbench_order_management', component: () => import('@/views/workbench/order-management/index.vue'), meta: { title: 'business-order', icon: 'ShoppingCartOutlined', requiresPermission: 'dashboard.order_management' } },
      { path: 'analysis', name: 'Workbench_analysis', component: () => import('@/views/workbench/analysis/index.vue'), meta: { title: 'workbench-analysis', icon: 'DataAnalysis', requiresPermission: 'business.analysis' } },
      { path: 'invoice', name: 'Workbench_invoice', component: () => import('@/views/workbench/invoice/index.vue'), meta: { title: 'workbench-invoice', requiresPermission: 'business.invoice' } },
      { path: 'sa-sales', name: 'Workbench_sa_sales', component: () => import('@/views/workbench/sa-sales/index.vue'), meta: { title: 'workbench-sa-sales', requiresPermission: 'business.sa_sales' } },
      { path: 'procurement', name: 'Workbench_procurement', component: () => import('@/views/workbench/procurement/index.vue'), meta: { title: 'workbench-procurement', requiresPermission: 'business.procurement' } },
      { path: 'warehouse', name: 'Workbench_warehouse', component: () => import('@/views/workbench/warehouse/index.vue'), meta: { title: 'workbench-warehouse', requiresPermission: 'business.warehouse' } },
      { path: 'influencer', name: 'Workbench_influencer', component: () => import('@/views/workbench/influencer/index.vue'), meta: { title: 'workbench-influencer', requiresPermission: 'business.influencer' } },
      { path: 'paypal', name: 'Workbench_paypal', component: () => import('@/views/workbench/paypal/index.vue'), meta: { title: 'workbench-paypal', requiresPermission: 'business.paypal' } },
      { path: 'operations', name: 'Workbench_operations', component: () => import('@/views/workbench/operations/index.vue'), meta: { title: 'workbench-operations', requiresPermission: 'business.operations' } },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/users',
    meta: { title: 'system', icon: 'Setting', requiresPermission: 'system' },
    children: [
      { path: 'collector', name: 'System_collector', component: () => import('@/views/dashboard/collector/index.vue'), meta: { title: 'collector-management', icon: 'Refresh', requiresPermission: 'dashboard.collector' } },
      {
        path: 'users',
        name: 'System_users',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: 'system-user', icon: 'UserOutlined', requiresPermission: 'system.user' },
      },
      {
        path: 'roles',
        name: 'System_roles',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: 'system-role', icon: 'TeamOutlined', requiresPermission: 'system.role' },
      },
      {
        path: 'permissions',
        name: 'System_permissions',
        component: () => import('@/views/system/permission/index.vue'),
        meta: { title: 'system-permission', icon: 'KeyOutlined', requiresPermission: 'system.permission' },
      },
    ],
  },
  // ─── 兜底 catch-all：未匹配的 path 都跳 /404 ───
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, ...asyncRoutes],
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 安装路由守卫（必须在 router 实例创建后调用，避免循环依赖下的 TDZ）
setupRouterGuards(router)

// 路由实例
export default router

// 工具函数
export function resetRouter() {
  const asyncRouteNames = new Set<string>()
  asyncRoutes.forEach((route) => {
    if (route.name) {
      asyncRouteNames.add(route.name as string)
    }
    if (route.children) {
      route.children.forEach((child) => {
        if (child.name) {
          asyncRouteNames.add(child.name as string)
        }
      })
    }
  })

  asyncRouteNames.forEach((name) => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
}

export function getAffixTabs(routes: RouteRecordNormalized[]): RouteRecordNormalized[] {
  return routes.filter((route) => route.meta?.affix)
}
