<template>
  <div
    class="app-wrapper"
    :class="{
      mobile: isMobile,
      openSidebar: sidebar.opened,
      'sidebar-collapsed': !isMobile && !sidebar.opened,
      'without-animation': sidebar.withoutAnimation,
    }"
    @keydown.esc="isMobile && handleCloseSidebar()"
  >
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && sidebar.opened"
      class="drawer-bg"
      @click="handleCloseSidebar"
    />

    <!-- 侧边栏 -->
    <div
      id="app-sidebar"
      class="sidebar-container"
      :class="{ opened: sidebar.opened }"
      :inert="(isMobile && !sidebar.opened) || undefined"
      :aria-hidden="isMobile && !sidebar.opened"
    >
      <sidebar />
    </div>

    <!-- 主内容区 -->
    <div class="main-container" :class="{ 'has-tags-view': showTagsView }">
      <!-- 顶部导航 + 标签栏 -->
      <div class="fixed-header">
        <navbar />
        <tags-view v-if="showTagsView" />
      </div>

      <!-- 页面内容 -->
      <app-main class="app-main" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView/index.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()
const route = useRoute()
const mobileQuery = window.matchMedia('(max-width: 767px)')
let desktopSidebarOpened = appStore.sidebar.opened

const isMobile = computed(() => appStore.device === 'mobile')
const sidebar = computed(() => appStore.sidebar)
const showTagsView = true

function handleCloseSidebar() {
  appStore.closeSidebar({ withoutAnimation: false })
}

// 窄屏使用抽屉；回到桌面时恢复原来的展开状态。
function syncDevice() {
  if (mobileQuery.matches) {
    if (!isMobile.value) desktopSidebarOpened = sidebar.value.opened
    appStore.toggleDevice('mobile')
    appStore.closeSidebar({ withoutAnimation: true })
  } else {
    const wasMobile = isMobile.value
    appStore.toggleDevice('desktop')
    if (wasMobile && sidebar.value.opened !== desktopSidebarOpened) appStore.toggleSidebar()
  }
}

onMounted(() => {
  syncDevice()
  mobileQuery.addEventListener('change', syncDevice)
})
onBeforeUnmount(() => mobileQuery.removeEventListener('change', syncDevice))
watch(() => route.path, () => {
  if (isMobile.value && sidebar.value.opened) handleCloseSidebar()
})
</script>

<style lang="scss" scoped>
.app-wrapper {
  --layout-sidebar-width: #{$sideBarWidth};
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;
  background-color: hsl(var(--background));

  &.sidebar-collapsed {
    --layout-sidebar-width: #{$sideBarCollapsedWidth};
  }

  &.without-animation {
    .sidebar-container, .main-container, .fixed-header {
      transition: none;
    }
  }

  &.mobile {
    &.openSidebar {
      position: fixed;
      top: 0;
    }
  }
}

.drawer-bg {
  background: hsl(0 0% 0% / 0.5);
  opacity: 1;
  width: 100%;
  top: 0;
  height: 100%;
  position: fixed;
  z-index: $sidebar-z-index;
}

.main-container {
  min-height: 100%;
  transition: margin-left $transition-duration;
  margin-left: var(--layout-sidebar-width);
  background-color: hsl(var(--background));

  &.has-tags-view {
    padding-top: $navbarHeight + $tagsViewHeight;
  }
}

.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--layout-sidebar-width);
  background-color: hsl(var(--sidebar));
  border-right: 1px solid hsl(var(--border));
  overflow: hidden;
  transition: width $transition-duration;
  z-index: $sidebar-z-index;

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: $navbar-z-index;
  width: calc(100% - var(--layout-sidebar-width));
  transition: width $transition-duration;
}

.app-main {
  min-height: calc(100vh - #{$navbarHeight} - #{$tagsViewHeight});
  padding: 16px;
  background: var(--workbench-page-background);
}

.mobile {
  .main-container {
    margin-left: 0;
  }

  .sidebar-container {
    width: $sideBarWidth !important;
    z-index: $sidebar-z-index + 1;
    transition: transform $transition-duration;
    transform: translateX(-$sideBarWidth);
    pointer-events: none;

    &.opened {
      transform: translateX(0);
      pointer-events: auto;
    }
  }

  .fixed-header {
    width: 100%;
  }
}
</style>
