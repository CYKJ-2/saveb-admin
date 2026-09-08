import type { RouteMeta } from 'vue-router'
import type { PermissionNode } from './auth'

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function findMenu(nodes: PermissionNode[], code: string): PermissionNode | undefined {
  for (const node of nodes) {
    if (node.status !== 1) continue
    if (node.type === 'menu' && node.code === code) return node
    const child = findMenu(node.children || [], code)
    if (child) return child
  }
}

/**
 * 所有导航标题共用同一规则：当前语言的后台名称 → 本地翻译 → 另一语言名称 → 标题标识。
 * 按权限 code 查询最新授权树，让静态路由和已打开的标签也能响应菜单改名。
 * 本函数仅解析展示文字，不参与路由注册或权限判断。
 */
export function resolveNavigationTitle(
  meta: RouteMeta | undefined,
  permissions: PermissionNode[],
  locale: string,
  translate: (key: string) => string,
): string {
  const code = text(meta?.menuCode) || text(meta?.requiresPermission)
  const menu = code ? findMenu(permissions, code) : undefined
  // 找到最新节点时不再使用旧路由中的名称快照，清空名称也应及时生效。
  const english = text(menu ? menu.name : meta?.originalName || meta?.name)
  const chinese = text(menu ? menu.name_zh : meta?.originalNameZh || meta?.name_zh)
  const isEnglish = locale.toLowerCase().startsWith('en')
  const name = isEnglish ? english : chinese
  if (name) return name

  const title = text(meta?.title)
  if (title) {
    const key = `route.${title}`
    const translated = translate(key)
    if (translated && translated !== key) return translated
  }
  return (isEnglish ? chinese : english) || title || code
}
