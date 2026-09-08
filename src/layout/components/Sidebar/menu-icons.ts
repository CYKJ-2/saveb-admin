import type { Component } from 'vue'
import * as icons from '@element-plus/icons-vue'

// 兼容 permissions 表已有的 Ant Design 图标名称，使用当前项目的本地图标。
const legacyIcons: Record<string, Component> = {
  HomeOutlined: icons.House,
  ShoppingCartOutlined: icons.ShoppingCart,
  SettingOutlined: icons.Setting,
  SyncOutlined: icons.Refresh,
  UserOutlined: icons.User,
  TeamOutlined: icons.UserFilled,
  SafetyOutlined: icons.Lock,
  DashboardOutlined: icons.DataAnalysis,
}

// 未配置图标的内置菜单按权限 code 补全；仅影响展示，不增减授权菜单。
const menuIcons: Record<string, Component> = {
  dashboard: icons.House,
  'dashboard.overview': icons.House,
  'dashboard.collector': icons.Refresh,
  'dashboard.order_management': icons.ShoppingCart,
  business: icons.ShoppingCart,
  'business.invoice': icons.Document,
  'business.sa_sales': icons.DataAnalysis,
  'business.procurement': icons.ShoppingBag,
  'business.warehouse': icons.Box,
  'business.influencer': icons.Star,
  'business.paypal': icons.Wallet,
  'business.operations': icons.List,
  system: icons.Setting,
  'system.user': icons.User,
  'system.role': icons.UserFilled,
  'system.permission': icons.Lock,
}

export function resolveMenuIcon(name: unknown, permissionCode: unknown): Component {
  if (typeof name === 'string') {
    const iconName = name.trim()
    if (Object.hasOwn(icons, iconName)) return icons[iconName as keyof typeof icons]
    if (Object.hasOwn(legacyIcons, iconName)) return legacyIcons[iconName]!
  }
  if (typeof permissionCode === 'string' && Object.hasOwn(menuIcons, permissionCode)) {
    return menuIcons[permissionCode]!
  }
  return icons.Menu
}
