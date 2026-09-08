import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { createPinia, setActivePinia } = require('pinia')
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}
globalThis.document = { title: '', documentElement: { classList: { toggle() {} } } }

async function loadSource(path, mocks = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  })
  const compiled = { exports: {} }
  new Function('require', 'exports', 'module', outputText)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    compiled.exports,
    compiled,
  )
  return compiled.exports
}

const appModule = await loadSource('../src/store/app.ts')
const { useAppStore } = appModule
const view = (path, name) => ({ path, fullPath: path, name, title: name, meta: {} })
function newPageSession() {
  setActivePinia(createPinia())
  return useAppStore()
}

test('browser refresh drops legacy and current history while preserving display preferences', () => {
  storage.set('tagsView', JSON.stringify([view('/dashboard', 'OldHome')]))
  storage.set('saveb-locale', 'en-US')
  storage.set('saveb-theme', 'light')
  const app = newPageSession()
  assert.deepEqual(app.tagsView, [])
  assert.equal(storage.has('tagsView'), false)
  app.addTagsView(view('/system/users', 'Users'))
  app.addTagsView(view('/system/permissions', 'Permissions'))
  assert.equal(storage.has('tagsView'), false)

  const refreshed = newPageSession()
  assert.deepEqual(refreshed.tagsView, [])
  assert.deepEqual(refreshed.cachedViews, [])
  refreshed.addTagsView(view('/system/permissions', 'Permissions'))
  assert.deepEqual(refreshed.tagsView.map((tag) => tag.path), ['/system/permissions'])
  assert.equal(refreshed.currentLocale, 'en-US')
  assert.equal(refreshed.theme, 'light')
})

test('closing one or multiple tabs removes their cache entries without deleting retained pages', () => {
  const app = newPageSession()
  app.addTagsView(view('/system/users', 'Users'))
  app.addTagsView(view('/system/roles', 'Roles'))
  app.addTagsView(view('/system/permissions', 'Permissions'))
  app.addTagsView({ ...view('/system/permissions', 'Permissions'), query: { type: 'menu' } })
  assert.equal(app.tagsView.length, 3)
  app.removeTagsView('/system/users')
  assert.deepEqual(app.cachedViews, ['Roles', 'Permissions'])
  app.removeTagsView(['/system/roles', '/system/permissions'])
  assert.deepEqual(app.tagsView, [])
  assert.deepEqual(app.cachedViews, [])
})

let loginId = 1
const { useUserStore } = await loadSource('../src/store/user.ts', {
  '@/store/app': appModule,
  '@/router/permission': { resetDynamicRoutes() {} },
  '@/utils/request': {
    request: {
      async post(url) {
        if (url === '/auth/logout') return {}
        assert.equal(url, '/auth/login')
        return { token: 'test-token', user: { id: loginId++, username: 'reader', role_codes: ['viewer'] }, permissions: [] }
      },
    },
  },
  '@/utils/auth': { getToken: () => null, getUserInfo: () => null, setToken() {}, setUserInfo() {}, clearAuth() {} },
})

test('logout, authentication reset and a new login each clear tabs and page caches', async () => {
  const app = newPageSession()
  const user = useUserStore()
  app.addTagsView(view('/system/roles', 'Roles'))
  await user.logout()
  assert.deepEqual(app.tagsView, [])
  assert.deepEqual(app.cachedViews, [])
  app.addTagsView(view('/system/users', 'Users'))
  assert.equal((await user.login('reader', 'test')).success, true)
  assert.deepEqual(app.tagsView, [])
  assert.deepEqual(app.cachedViews, [])
  app.addTagsView(view('/system/permissions', 'Permissions'))
  user.resetStore()
  assert.deepEqual(app.tagsView, [])
  assert.deepEqual(app.cachedViews, [])
})

const navigationTitleModule = await loadSource('../src/utils/navigation-title.ts')
const { setupRouterGuards } = await loadSource('../src/router/permission.ts', {
  '@/store/app': appModule,
  '@/store/user': { useUserStore },
  '@/lang': { global: { t: (key) => key, te: () => false, locale: { value: 'zh-CN' } } },
  '@/utils/navigation-title': navigationTitleModule,
  '@/utils/permission': { isWhiteList: () => false },
  './generate-async-routes': { generateAsyncRoutes() {}, cleanupDynamicRoutes() {} },
})

test('only successful page navigation adds a tab and changes the document title', () => {
  const app = newPageSession()
  let afterNavigation
  setupRouterGuards({ beforeEach() {}, afterEach(callback) { afterNavigation = callback } })
  const users = { ...view('/system/users', 'Users'), matched: [{}], meta: { title: 'system-user' } }
  const permissions = { ...view('/system/permissions', 'Permissions'), matched: [{}], meta: { title: 'system-permission' } }
  afterNavigation(users, {})
  const originalTitle = document.title
  afterNavigation(permissions, users, new Error('Navigation cancelled'))
  assert.deepEqual(app.tagsView.map((tag) => tag.path), ['/system/users'])
  assert.equal(document.title, originalTitle)
  afterNavigation(permissions, users)
  assert.deepEqual(app.tagsView.map((tag) => tag.path), ['/system/users', '/system/permissions'])
  afterNavigation({ ...view('/login', 'Login'), matched: [{}], meta: { hidden: true } }, permissions)
  assert.equal(app.tagsView.length, 2)
})

test('successful navigation uses refreshed API menu names for browser and saved tag titles', () => {
  const app = newPageSession()
  const user = useUserStore()
  let afterNavigation
  setupRouterGuards({ beforeEach() {}, afterEach(callback) { afterNavigation = callback } })
  const route = { ...view('/system/users', 'Users'), matched: [{}], meta: { title: 'system-user', requiresPermission: 'system.user' } }
  const applyName = name => user.applyAuthPayload({
    user: { id: 1, username: 'reader', role_codes: ['viewer'] },
    permissions: [{ id: 1, code: 'system.user', name: 'Staff Accounts', name_zh: name, type: 'menu', status: 1 }],
  })
  applyName('用户管理')
  afterNavigation(route, {})
  applyName('员工账号')
  afterNavigation(route, {})
  assert.equal(document.title, '员工账号 - SAVEB ERP')
  assert.equal(app.tagsView[0].title, '员工账号')
  assert.equal(app.tagsView.length, 1)
})
