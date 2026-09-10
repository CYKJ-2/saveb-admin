<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useAppStore } from '@/store/app'

defineProps<{ href: string; title: string; icon: Component }>()
const appStore = useAppStore()
const collapsed = computed(() => appStore.device !== 'mobile' && !appStore.sidebar.opened)

function closeMobileSidebar() {
  if (appStore.device === 'mobile') appStore.closeSidebar({ withoutAnimation: false })
}
</script>

<template>
  <li class="sidebar-external-item" role="none">
    <el-tooltip :content="title" :disabled="!collapsed" placement="right">
      <a class="el-menu-item sidebar-external-link" :class="{ 'is-collapsed': collapsed }"
         :href="href" target="_blank" rel="noopener noreferrer" role="menuitem" :aria-label="title"
         @click="closeMobileSidebar">
        <el-icon class="sidebar-menu-icon" :size="20" aria-hidden="true"><component :is="icon" /></el-icon>
        <span v-if="!collapsed" class="sidebar-menu-label" :title="title">{{ title }}</span>
      </a>
    </el-tooltip>
  </li>
</template>

<style scoped>
.sidebar-external-item { list-style: none; }
.sidebar-external-link { width: 100%; text-decoration: none; }
.sidebar-external-link:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: -2px; }
.sidebar-external-link.is-collapsed { justify-content: center; padding: 0; }
.sidebar-external-link.is-collapsed .sidebar-menu-icon { margin: 0; }
</style>
