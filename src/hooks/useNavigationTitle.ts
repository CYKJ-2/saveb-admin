import type { RouteMeta } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/user'
import { resolveNavigationTitle } from '@/utils/navigation-title'

/** 在渲染或 computed 中调用，权限名称和语言变化时自动重新计算。 */
export function useNavigationTitle() {
  const userStore = useUserStore()
  const { t, te, locale } = useI18n()

  return (meta?: RouteMeta): string => resolveNavigationTitle(
    meta,
    userStore.userInfo?.permissionsTree || [],
    locale.value,
    key => te(key) ? t(key) : key,
  )
}
