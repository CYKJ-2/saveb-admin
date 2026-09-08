/**
 * 将后端 permissions 树映射为 Vue Router 异步路由配置 + 同步注册到 router。
 *
 * 入口：
 *   generateAsyncRoutes(tree)
 *     ├─ 树形 → 一维 RouteRecordRaw[]
 *     └─ router.addRoute() 一条条注册
 *
 * 生成的路由规则：
 *   - 每个 level=1 节点：以 Layout 为根组件，children 包括二级菜单
 *   - 每个 level=2 节点：叶子页（path = 后端 path，component 由 menu-mapper 解析）
 *   - level=3+ 的 action 不生成路由（按钮级权限）
 *   - hidden=true 的菜单：不进入侧边栏，但仍生成路由（用户直接 URL 可达时 403 guard 兜底）
 *   - 顶级根：'/' 重定向到第一个菜单的 path 或 /dashboard
 */
import type { RouteRecordRaw } from 'vue-router'
import router from './index'
import Layout from '@/layout/index.vue'
import type { PermissionNode } from '@/utils/auth'
import { resolveComponent } from './menu-mapper'

interface BuildResult {
  routes: RouteRecordRaw[]
  dynamicAdded: RouteRecordRaw[]
}

/**
 * 把后端 permissions 树 → 一组 vue-router 路由记录。
 *
 * @param tree  后端 AuthController::collectPermissions 的输出
 * @param defaults 顶层 catch-all redirect 的兜底目标
 */
export function buildAsyncRoutesFromTree(
  tree: PermissionNode[],
  defaults: string = '/dashboard',
): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const rootNode of tree) {
    if (rootNode.type !== 'menu' || rootNode.status !== 1) continue

    const moduleRoute: RouteRecordRaw = {
      // 后端 path 是 /system 这种顶层前缀；router 需要绝对路径
      path: rootNode.path || `/${rootNode.code}`,
      component: Layout,
      // 让 vben/Sidebar 找到这块 Layout 的多语言 key
      meta: {
        title: rootNode.code,
        icon: rootNode.icon || undefined,
        hidden: rootNode.hidden === true,
        requiresPermission: rootNode.code,
        // 把后端的多语言字段也透传过来（i18n key 失配时作兜底显示）
        originalName: (rootNode as any).name,
        originalNameZh: (rootNode as any).name_zh,
        name: (rootNode as any).name,
        name_zh: (rootNode as any).name_zh,
      },
      redirect: undefined,
      children: [],
    }

    // 递归挂载子节点
    if (rootNode.children?.length) {
      attachChildren(moduleRoute, rootNode.children)
    }

    // 如果 children 为空（极端情况：菜单节点没有子页），给个 redirect 占位
    if (!moduleRoute.children || moduleRoute.children.length === 0) {
      if (rootNode.component && rootNode.component !== 'Layout') {
        moduleRoute.children = [{ path: '', name: `rbac_page_${rootNode.id}`, component: resolveComponent(rootNode.component), meta: { requiresPermission: rootNode.code } }]
      } else {
        continue
      }
    } else if (!moduleRoute.redirect) {
      // 默认重定向到第一个 child（element-ui 风格）。first.path 已经是相对路径。
      const first = moduleRoute.children.find((c) => !c.meta?.hidden)
      if (first?.path) {
        moduleRoute.redirect = first.path.startsWith('/')
          ? first.path
          : `${moduleRoute.path}/${first.path}`
      }
    }

    result.push(moduleRoute)
  }

  return result
}

/**
 * 递归挂载 menu 节点到 moduleRoute.children。
 * type='action' 不进路由；'menu' 进。
 */
function attachChildren(
  parent: RouteRecordRaw,
  nodes: PermissionNode[],
): void {
  for (const n of nodes) {
    if (n.type === 'action' || n.status !== 1) continue // 按钮级权限不进路由

    if (n.type === 'menu') {
      // 子路由 path 优先用相对路径（这样父级 redirect 才能正常工作）
      // 后端给的 path 是绝对路径（/system/users），需要去掉父前缀
      const rawPath = n.path || `/${n.code}`
      let relativePath = rawPath
      const parentPath = parent.path
      if (parentPath && parentPath !== '/' && rawPath.startsWith(parentPath + '/')) {
        relativePath = rawPath.slice(parentPath.length).replace(/^\/+/, '')
      } else if (rawPath.startsWith('/')) {
        relativePath = rawPath
      }

      const child: RouteRecordRaw = {
        path: relativePath,
        name: n.code.replace(/\./g, '_'), // Dashboard_overview 这种命名（路由 name 不能含点）
        component: resolveComponent(n.component),
        meta: {
          title: n.code,
          icon: n.icon || undefined,
          hidden: n.hidden === true,
          requiresPermission: n.code,
          // 把后端的多语言字段也透传过来（i18n key 失配时作兜底显示）
          originalName: (n as any).name,
          originalNameZh: (n as any).name_zh,
          name: (n as any).name,
          name_zh: (n as any).name_zh,
        },
      }

      // 如果还有更深的 menu 子项，继续挂
      if (n.children?.length) {
        const before = (child.children?.length ?? 0)
        child.children = []
        attachChildren(child, n.children)
        // 只有过滤后还真的有 menu 子项，才把 component 设为 undefined
        // 否则即使原始 children 不为空（里面全是 action），也不能丢 component
        if ((child.children?.length ?? 0) === 0) {
          child.children = undefined as any
        } else if (before === 0) {
          // 防御：原本就没有 children（仅 menu 自带 path + component），不要乱清
        }
      }

      parent.children!.push(child)
    }
  }
}

/**
 * 注册动态路由到 router（原子操作，原有同 name 路由会被覆盖）。
 * 返回注册的路由列表（供 permission guard 缓存）。
 *
 * 注意：本项目的业务模块路由（dashboard / system / business）全部在
 * src/router/index.ts 里静态注册（asyncRoutes）。本函数仍然保留，
 * 但目前主要是为侧边栏菜单节点生成的"软路由"，
 * 当后端 permission 树出现静态路由表里没声明的新模块时（后续扩展用）。
 *
 * 已存在的同名 path 会跳过 addRoute，避免 vue-router 警告。
 */
export function generateAsyncRoutes(
  tree: PermissionNode[],
  defaults: string = '/dashboard',
): BuildResult {
  // 先清理已有动态路由
  cleanupDynamicRoutes()

  const routes = buildAsyncRoutesFromTree(tree, defaults)

  const dynamicAdded: RouteRecordRaw[] = []
  for (const r of routes) {
    try {
      // 跳过静态路由表里已经存在的 path，避免 vue-router 警告。
      // 静态路由的 children path 是相对的（比如 'users'），需要拼成绝对 path 比较。
      const existing = router.getRoutes().some((existing) => {
        if (existing.path === r.path) return true
        if (existing.path === r.path + '/:pathMatch(.*)*') return true
        // 父路由已存在且 path 匹配也算
        if (r.path.startsWith(existing.path + '/') && existing.children?.some((c) => c.path === r.path.slice(existing.path.length + 1).replace(/^\/+/, ''))) {
          return true
        }
        return false
      })

      if (existing) {
        console.log('[generate-async-routes] skip (static exists):', r.path)
        continue
      }

      dynamicRemovers.push(router.addRoute(r))
      dynamicAdded.push(r)
      trackDynamicName(r.name as string)
      if (r.children?.length) {
        for (const c of r.children) {
          trackDynamicName(c.name as string)
          if (c.children?.length) {
            for (const g of c.children) trackDynamicName(g.name as string)
          }
        }
      }
    } catch (err) {
      console.error('[generate-async-routes] addRoute failed for', r.path, err)
    }
  }

  try {
    registerCatchAll()
  } catch (err) {
    console.error('[generate-async-routes] registerCatchAll failed', err)
  }

  return { routes: dynamicAdded, dynamicAdded }
}

/**
 * 注册兜底 404 路由（放在所有动态路由之后）。
 */
function registerCatchAll() {
  if (router.hasRoute('NotFoundDynamic')) return
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: 'NotFoundDynamic',
    redirect: '/404',
    meta: { hidden: true },
  })
}

/**
 * 清理之前注册的动态路由。
 * 通过标记 dynamicAdded 的 name 来识别。
 */
const dynamicRemovers: Array<() => void> = []
const dynamicNames = new Set<string>()

/** 加一个 name 后标记为动态，便于清理。 */
function trackDynamicName(name: string | undefined) {
  if (name) dynamicNames.add(name)
}

/** 清理由 generateAsyncRoutes 注册的路由。 */
export function cleanupDynamicRoutes() {
  for (const remove of dynamicRemovers.splice(0)) remove()
  for (const name of dynamicNames) {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  }
  dynamicNames.clear()
  // catch-all 也清掉（如果存在）
  if (router.hasRoute('NotFoundDynamic')) {
    router.removeRoute('NotFoundDynamic')
  }
}
