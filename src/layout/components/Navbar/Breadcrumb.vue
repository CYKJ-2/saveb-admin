<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item
        v-for="(item, index) in levelList"
        :key="item.path"
      >
        <span
          v-if="item.redirect === 'noRedirect' || index === levelList.length - 1"
          class="no-redirect"
        >
          {{ getTitle(item) }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ getTitle(item) }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { useNavigationTitle } from '@/hooks/useNavigationTitle'

const route = useRoute()
const router = useRouter()
const navigationTitle = useNavigationTitle()

const levelList = computed(() =>
  route.matched.filter((item) => item.meta?.title && !item.meta?.hidden),
)

// 与侧栏使用同一份后台名称，并跟随权限树和语言变化。
const titles = computed(() => {
  const map = new Map<string, string>()
  for (const item of levelList.value) {
    map.set(item.path, navigationTitle(item.meta))
  }
  return map
})

function getTitle(item: RouteRecordRaw): string {
  return titles.value.get(item.path) ?? ''
}

function handleLink(item: RouteRecordRaw) {
  const { path } = item
  router.push(path)
}
</script>

<style lang="scss" scoped>
.app-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;
  color: hsl(var(--muted-foreground));

  .no-redirect {
    color: hsl(var(--foreground));
    cursor: text;
  }

  :deep(a) {
    color: hsl(var(--muted-foreground));

    &:hover {
      color: hsl(var(--primary));
    }
  }

  :deep(.el-breadcrumb__item) {
    font-weight: normal;
  }
}
</style>
