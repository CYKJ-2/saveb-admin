<template>
  <!-- 菜单项直接挂在 el-menu 下，收起时由 Element Plus 隐藏标题并显示浮层。 -->
  <template v-if="!item.meta?.hidden">
    <external-menu-item v-if="isLeaf && isExternalMenu(singleItem.path)" :href="singleItem.path" :title="singleTitle" :icon="singleIcon" />
    <el-menu-item v-else-if="isLeaf" :index="resolvePath(singleItem.path)" :aria-label="singleTitle">
      <el-icon class="sidebar-menu-icon" :size="20" aria-hidden="true">
        <component :is="singleIcon" />
      </el-icon>
      <template #title>
        <span class="sidebar-menu-label" :title="singleTitle">{{ singleTitle }}</span>
      </template>
    </el-menu-item>

    <el-sub-menu
      v-else
      :index="resolvePath(item.path)"
      :aria-label="groupTitle"
      popper-class="sidebar-menu-popper"
      teleported
    >
      <template #title>
        <el-icon class="sidebar-menu-icon" :size="20" aria-hidden="true">
          <component :is="groupIcon" />
        </el-icon>
        <span class="sidebar-menu-label" :title="groupTitle">{{ groupTitle }}</span>
      </template>

      <sidebar-item
        v-for="child in visibleChildren"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { useNavigationTitle } from '@/hooks/useNavigationTitle'
import { resolveMenuIcon } from './menu-icons'
import { isExternalMenu } from '@/utils/external-menu'
import ExternalMenuItem from './ExternalMenuItem.vue'

const props = defineProps<{
  item: RouteRecordRaw
  basePath: string
}>()
const resolveText = useNavigationTitle()

const visibleChildren = computed(() => props.item.children?.filter(child => !child.meta?.hidden) || [])

// 只有一个可见末级页面时直接展示页面入口，例如首页。
const singleItem = computed(() => visibleChildren.value.length === 1 ? visibleChildren.value[0]! : props.item)
const isLeaf = computed(() => visibleChildren.value.length === 0 || (
  visibleChildren.value.length === 1 && !singleItem.value.children?.some(child => !child.meta?.hidden)
))

const groupTitle = computed(() => resolveText(props.item.meta))
const singleTitle = computed(() => resolveText(singleItem.value.meta))
const groupIcon = computed(() => resolveMenuIcon(props.item.meta?.icon, props.item.meta?.requiresPermission))
const singleIcon = computed(() => resolveMenuIcon(singleItem.value.meta?.icon, singleItem.value.meta?.requiresPermission))

function resolvePath(path: string): string {
  if (path.startsWith('/') || isExternalMenu(path)) return path
  return `${props.basePath}/${path}`.replace(/\/+/g, '/')
}
</script>
