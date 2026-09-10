<template>
  <div class="tags-view-container">
    <scroll-pane class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :to="{ path: tag.path, query: tag.query }"
        :class="isActive(tag) ? 'active' : ''"
        class="tags-view-item"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <!-- 根据最新权限名称和当前语言渲染，不使用旧标签中的名称快照。 -->
        {{ resolveTagTitle(tag) }}
        <span
          v-if="!isAffix(tag)"
          class="el-icon-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <el-icon :size="12"><Close /></el-icon>
        </span>
      </router-link>
    </scroll-pane>

    <!-- 右键菜单 -->
    <ul
      v-show="visible"
      class="contextmenu"
      :style="{ left: left + 'px', top: top + 'px' }"
    >
      <li @click="refreshSelectedTag(selectedTag)">
        {{ t('layout.tagsView.refresh') }}
      </li>
      <li @click="closeSelectedTag(selectedTag)">
        {{ t('layout.tagsView.close') }}
      </li>
      <li @click="closeOthersTags">
        {{ t('layout.tagsView.closeOthers') }}
      </li>
      <li @click="closeAllTags(selectedTag)">
        {{ t('layout.tagsView.closeAll') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'
import { useNavigationTitle } from '@/hooks/useNavigationTitle'
import ScrollPane from './ScrollPane.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { t } = useI18n()
const navigationTitle = useNavigationTitle()

const visitedViews = computed(() => appStore.tagsView)

const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<any>({})

function isActive(tag: any) {
  return tag.path === route.path
}

function isAffix(tag: any) {
  return tag.meta?.affix
}

/** 后台改名或切换语言后，已打开的标签也同步更新。 */
const tagTitles = computed(() => {
  const map = new Map<string, string>()
  for (const tag of visitedViews.value) {
    const resolved = router.resolve(tag.path)
    const meta = resolved.matched.length ? resolved.meta : tag.meta
    map.set(tag.path, navigationTitle(meta) || tag.title || '')
  }
  return map
})

function resolveTagTitle(tag: any): string {
  return tagTitles.value.get(tag.path) ?? tag?.title ?? ''
}

function refreshSelectedTag(view: any) {
  router.replace({
    path: '/redirect' + view.fullPath,
  })
}

function closeSelectedTag(view: any) {
  appStore.removeTagsView(view.path)
  if (isActive(view)) {
    toLastView(visitedViews.value, view)
  }
}

function closeOthersTags() {
  if (selectedTag.value.path !== route.path) {
    router.push(selectedTag.value.fullPath)
  }
  appStore.removeTagsView(
    visitedViews.value
      .filter((tag) => tag.path !== route.path && !tag.meta?.affix)
      .map((tag) => tag.path),
  )
}

function closeAllTags(view: any) {
  appStore.clearTagsView()
  if (!view.meta?.affix) {
    toLastView(visitedViews.value, view)
  }
}

function toLastView(views: any[], view: any) {
  const latestView = views.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    if (view.name === 'Dashboard') {
      router.replace({ path: '/redirect' + view.fullPath })
    } else {
      router.push('/')
    }
  }
}

function openMenu(tag: any, event: MouseEvent) {
  const menuMinWidth = 105
  const offsetLeft = (event.target as HTMLElement).getBoundingClientRect().left
  const offsetWidth = (event.target as HTMLElement).offsetWidth

  left.value = offsetLeft + offsetWidth / 2 - menuMinWidth / 2
  top.value = event.clientY
  visible.value = true
  selectedTag.value = tag
}

function handleScroll() {
  visible.value = false
}

function closeMenu() {
  visible.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: $tagsViewHeight;
  width: 100%;
  background-color: hsl(var(--header));
  border-bottom: 1px solid hsl(var(--border));
  box-shadow: 0 1px 3px hsl(0 0% 0% / 0.12);
  transition: background-color 0.2s, border-color 0.2s;

  .tags-view-wrapper {
    :deep(.tags-view-item) {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid hsl(var(--border));
      color: hsl(var(--muted-foreground));
      background-color: hsl(var(--background));
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      border-radius: 4px;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;

      &:first-of-type {
        margin-left: 15px;
      }

      &:last-of-type {
        margin-right: 15px;
      }

      &:hover {
        color: hsl(var(--foreground));
      }

      &.active {
        background-color: var(--tag-active-background, hsl(var(--primary)));
        color: var(--tag-active-text, hsl(var(--primary-foreground)));
        border-color: var(--tag-active-border, hsl(var(--primary)));

        &::before {
          content: '';
          background: var(--tag-active-text, hsl(var(--primary-foreground)));
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }

      .el-icon-close {
        margin-left: 4px;
        border-radius: 50%;

        &:hover {
          background-color: hsl(0 0% 100% / 0.2);
          color: var(--tag-active-text, hsl(var(--primary-foreground)));
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    padding: 5px 0;
    background: hsl(var(--card));
    border-radius: 4px;
    border: 1px solid hsl(var(--border));
    box-shadow: 0 2px 12px hsl(0 0% 0% / 0.4);
    position: absolute;
    z-index: 2000;
    list-style-type: none;

    li {
      margin: 0;
      padding: 5px 16px;
      cursor: pointer;
      font-size: 12px;
      color: hsl(var(--foreground));

      &:hover {
        background: hsl(var(--accent));
      }
    }
  }
}
</style>
