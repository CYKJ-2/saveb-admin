<template>
  <div class="navbar">
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <div class="navbar-left">
      <hamburger
        :is-active="sidebar.opened"
        class="hamburger"
        @toggle-click="handleToggleSidebar"
      />
      <breadcrumb class="breadcrumb-container" />
    </div>

    <!-- 右侧：图标按钮组 + 用户 -->
    <div class="navbar-right">
      <!-- 字号切换 -->
      <size-select class="navbar-item" />

      <!-- 全屏 -->
      <screenfull class="navbar-item" />

      <!-- 主题切换 (太阳/月亮图标) -->
      <theme-toggle class="navbar-item" />

      <!-- 语言切换 -->
      <lang-select class="navbar-item" />

      <!-- 刷新当前页 -->
      <el-tooltip :content="t('layout.navbar.refresh')" placement="bottom">
        <div class="navbar-item navbar-icon-btn" @click="handleRefresh">
          <el-icon :size="18"><Refresh /></el-icon>
        </div>
      </el-tooltip>

      <!-- 用户信息 -->
      <el-dropdown class="navbar-item user-dropdown" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="28" :src="userStore.avatar || defaultAvatar">
            {{ userStore.username?.charAt(0).toUpperCase() || 'U' }}
          </el-avatar>
          <span class="username">{{ userStore.username }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" disabled>
              <el-icon><User /></el-icon>
              {{ userStore.username }}
              <span class="user-role-tag">{{ userStore.roles[0] || '' }}</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              {{ t('layout.navbar.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  User,
  SwitchButton,
  ArrowDown,
  Refresh,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import Hamburger from './Navbar/Hamburger.vue'
import Breadcrumb from './Navbar/Breadcrumb.vue'
import SizeSelect from './Navbar/SizeSelect.vue'
import Screenfull from './Navbar/Screenfull.vue'
import ThemeToggle from './Navbar/ThemeToggle.vue'
import LangSelect from './Navbar/LangSelect.vue'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { t } = useI18n()

const sidebar = computed(() => appStore.sidebar)

const defaultAvatar =
  'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

function handleToggleSidebar() {
  appStore.toggleSidebar()
}

function handleRefresh() {
  router.go(0)
}

async function handleCommand(command: string) {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm(
          t('layout.logoutConfirm.body'),
          t('layout.logoutConfirm.title'),
          {
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel'),
            type: 'warning',
          },
        )
        await userStore.logout()
        router.push('/login')
      } catch {
        // 取消
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $navbarHeight;
  padding: 0 16px;
  background-color: hsl(var(--header));
  border-bottom: 1px solid hsl(var(--border));
  position: relative;
  z-index: $navbar-z-index;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;

  .navbar-left {
    display: flex;
    align-items: center;
    height: 100%;
    flex: 1;
    min-width: 0;

    .hamburger {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 8px;
      margin-right: 12px;
      cursor: pointer;
      border-radius: 6px;
      color: hsl(var(--foreground));
      transition: all 0.2s;

      &:hover {
        background: hsl(var(--primary) / 0.1);
        color: hsl(var(--primary));
      }
    }

    .breadcrumb-container {
      flex: 1;
      min-width: 0;
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 2px;
    flex-shrink: 0;

    .navbar-item {
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
    }

    .navbar-icon-btn .icon {
      width: 18px;
      height: 18px;
    }

    .user-dropdown {
      padding: 0 8px 0 12px;

      .user-info {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 100%;

        .username {
          color: hsl(var(--foreground));
          font-size: 14px;
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .el-avatar {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)));
          color: #fff;
          font-weight: 600;
        }
      }
    }
  }

  :deep(.user-role-tag) {
    margin-left: 8px;
    padding: 1px 6px;
    font-size: 11px;
    border-radius: 3px;
    background: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
  }
}
</style>
