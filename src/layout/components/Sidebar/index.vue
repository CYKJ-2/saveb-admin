<template>
  <div class="sidebar" :class="[themeClass, { 'is-collapsed': isCollapse }]">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="3" fill="hsl(var(--primary))"/>
          <rect x="5" y="6" width="6" height="4" rx="1" fill="#fff"/>
          <rect x="13" y="6" width="6" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
          <rect x="5" y="12" width="14" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
        </svg>
      </div>
      <transition name="sidebar-logo-fade">
        <span v-if="!isCollapse" class="logo-text">SAVEB ERP</span>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-scrollbar wrap-class="scrollbar-wrapper" class="sidebar-scrollbar">
      <el-menu
        class="sidebar-menu"
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="menuBg"
        :text-color="menuText"
        :unique-opened="true"
        :active-text-color="menuActiveText"
        :collapse-transition="false"
        :router="true"
        mode="vertical"
        @select="handleMenuSelect"
      >
        <sidebar-item
          v-for="route in menuRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SidebarItem from './SidebarItem.vue'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { useDesign } from '@/hooks/useDesign'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const { locale } = useI18n()

const activeMenu = computed(() => route.path)
const isCollapse = computed(() => appStore.device !== 'mobile' && !appStore.sidebar.opened)

function handleMenuSelect() {
  if (appStore.device === 'mobile') appStore.closeSidebar({ withoutAnimation: false })
}

// 主题响应式：跟随 html.dark / html.light 切换
const { theme } = useDesign()
const themeClass = computed(() => `is-${theme.value}`)

// 菜单颜色：直接读 CSS 变量（深浅色变量已在 styles/index.scss 定义）
// 这里用 hsl(var(...)) 字符串传给 el-menu 的 background-color prop，
// 浏览器自动求值并跟随主题切换
const menuBg = computed(() => 'hsl(var(--sidebar-deep))')
const menuText = computed(() => 'hsl(var(--sidebar-text))')
const menuActiveText = computed(() => 'hsl(var(--sidebar-text-active))')

/**
 * 菜单数据来源：
 *   登录后由 /api/auth/me 返回的 permissions 树派生
 *   → userStore.menus = type=menu && !hidden && status=1 的扁平+树结构
 * 这里把后端的 MenuNode 翻译成 SidebarItem.vue 期望的 RouteRecordRaw-like 形状。
 */
const menuRoutes = computed<any[]>(() => {
  // 引用 locale 以让 Sidebar 在切换语言时整体重渲染（更新菜单文本）
  void locale.value
  return userStore.menus.map((m) => toSidebarItem(m))
})

/**
 * 把单个 MenuNode 翻译为 SidebarItem.vue 认识的形状：
 *   { path, meta, children? }
 *
 *   - path:   菜单自身的路由 path（用后端给的 path；缺失则用 code 推导）
 *   - meta:   { title=code（i18n key 兜底）, icon, name, name_zh }
 *   - children: 递归转换
 */
function toSidebarItem(m: any): any {
  // 首页始终为直达概览的单一入口，权限树中的页面/操作节点不展开为子菜单。
  const isHome = m.code === 'dashboard'
  const titles: Record<string, string> = {
    'dashboard.overview': 'home-overview',
    'dashboard.collector': 'collector-management',
    'dashboard.order_management': 'business-order',
    'business.invoice': 'workbench-invoice',
    'business.sa_sales': 'workbench-sa-sales',
    'business.procurement': 'workbench-procurement',
    'business.warehouse': 'workbench-warehouse',
    'business.influencer': 'workbench-influencer',
    'business.paypal': 'workbench-paypal',
    'business.operations': 'workbench-operations',
  }
  const path = isHome ? '/dashboard/overview' : m.path || `/${m.code.replace(/\./g, '/')}`
  const item: any = {
    path,
    meta: {
      title: isHome ? 'home-overview' : titles[m.code] || m.code,
      icon: m.icon || (isHome ? 'Odometer' : undefined),
      hidden: !!m.hidden,
      requiresPermission: isHome ? 'dashboard.overview' : m.code,
      menuCode: m.code,
      // 展示名称来自后台；首页折叠入口也保留对应菜单的中英文名称。
      name: m.name,
      name_zh: m.name_zh,
      originalName: m.name,
      originalNameZh: m.name_zh,
    },
  }

  if (!isHome && m.children?.length) {
    item.children = m.children.map((c: any) => toSidebarItem(c))
  }

  return item
}
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: hsl(var(--sidebar-deep));
  transition: background-color 0.2s;

  &.is-collapsed .sidebar-logo {
    justify-content: center;
    padding: 0;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  height: $navbarHeight;
  padding: 0 16px;
  /* 用主题 token，跟随深浅切换 */
  background-color: hsl(var(--sidebar-logo));
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  overflow: hidden;
  flex-shrink: 0;
  transition: background-color 0.2s, border-color 0.2s;

  .logo-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .logo-text {
    margin-left: 10px;
    font-size: 15px;
    font-weight: 700;
    /* 跟随主题：深色浅色都给对比度足够的字色 */
    color: hsl(var(--sidebar-text-active));
    letter-spacing: 0.5px;
    white-space: nowrap;
    user-select: none;
    transition: color 0.2s;
  }
}

.sidebar-scrollbar {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-logo-fade-enter-active,
.sidebar-logo-fade-leave-active {
  transition: opacity 0.2s;
}

.sidebar-logo-fade-enter-from,
.sidebar-logo-fade-leave-to {
  opacity: 0;
}

</style>

<style lang="scss">
/* 浮层挂在 body 下，使用专属类让展开菜单和收起浮层共享主题与间距。 */
.sidebar-menu,
.sidebar-menu-popper {
  --el-menu-base-level-padding: 16px;
  --el-menu-level-padding: 16px;
  --el-menu-item-height: 44px;
  --el-menu-sub-item-height: 40px;
  --el-menu-bg-color: hsl(var(--sidebar-deep));
  --el-menu-text-color: hsl(var(--sidebar-text));
  --el-menu-hover-bg-color: hsl(var(--sidebar-hover));
  --el-menu-active-color: hsl(var(--sidebar-text-active));

  .el-menu {
    border-right: 0;
    background-color: hsl(var(--sidebar-submenu));
  }

  .el-menu-item,
  .el-sub-menu__title {
    min-width: 0;
    color: hsl(var(--sidebar-text));
    background-color: transparent;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: hsl(var(--sidebar-hover));
      color: hsl(var(--sidebar-text-active));
    }

    .sidebar-menu-icon {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      margin-right: 10px;
      vertical-align: middle;
    }
  }

  .sidebar-menu-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-menu-item.is-active {
    background-color: hsl(var(--sidebar-active));
    color: hsl(var(--sidebar-text-active));

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: hsl(var(--primary));
      border-radius: 0 2px 2px 0;
    }
  }
}

.sidebar-menu {
  width: 100%;
  border-right: 0;

  &.el-menu--collapse {
    width: $sideBarCollapsedWidth;

    > .el-menu-item,
    > .el-sub-menu > .el-sub-menu__title {
      justify-content: center;
      padding: 0;

      .el-menu-tooltip__trigger {
        justify-content: center;
        padding: 0;
      }

      .sidebar-menu-icon {
        margin: 0;
      }
    }
  }
}
</style>
