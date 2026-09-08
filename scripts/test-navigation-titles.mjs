import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { computed, reactive, ref } = require('vue')

async function loadSource(path, mocks = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  })
  const module = { exports: {} }
  new Function('require', 'exports', 'module', outputText)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module.exports, module,
  )
  return module.exports
}

const titles = await loadSource('../src/utils/navigation-title.ts')
const { resolveNavigationTitle } = titles
const meta = { title: 'workbench-sa-sales', requiresPermission: 'business.sa_sales' }
const node = (name = 'Staff Revenue', name_zh = '员工销售统计') => ({
  id: 2, code: 'business.sa_sales', type: 'menu', status: 1, name, name_zh,
})
const tree = (...children) => [{ id: 1, code: 'business', type: 'menu', status: 1, name: 'Business', name_zh: '业务中心', children }]
const translations = { 'route.workbench-sa-sales': 'SA 销售分析', 'route.login': '登录' }
const translate = key => translations[key] || key

test('API names override built-in translations for both languages, including static routes', () => {
  assert.equal(resolveNavigationTitle(meta, tree(node()), 'zh-CN', translate), '员工销售统计')
  assert.equal(resolveNavigationTitle(meta, tree(node()), 'en-US', translate), 'Staff Revenue')
  assert.equal(resolveNavigationTitle({ title: 'business', requiresPermission: 'business' }, tree(node()), 'zh-CN', translate), '业务中心')
})

test('missing names fall back without showing translation keys or stale route names', () => {
  const oldMeta = { ...meta, originalNameZh: '旧菜单' }
  assert.equal(resolveNavigationTitle(oldMeta, tree(node('Sales', null)), 'zh-CN', translate), 'SA 销售分析')
  assert.equal(resolveNavigationTitle({ ...meta, title: 'custom-page' }, tree(node('Custom Sales', '  ')), 'zh-CN', translate), 'Custom Sales')
  assert.equal(resolveNavigationTitle({ title: 'login' }, [], 'zh-CN', translate), '登录')
  assert.equal(resolveNavigationTitle({ title: 'custom-page', originalNameZh: '动态页面' }, [], 'zh-CN', translate), '动态页面')
})

test('the single home entry uses its menu name while keeping overview authorization separate', () => {
  const home = { ...node('Control Center', '运营首页'), code: 'dashboard' }
  assert.equal(resolveNavigationTitle({ title: 'home-overview', menuCode: 'dashboard', requiresPermission: 'dashboard.overview' }, [home], 'zh-CN', translate), '运营首页')
})

test('reactive navigation titles update after auth refresh and language changes', async () => {
  const user = reactive({ userInfo: { permissionsTree: tree(node()) } })
  const locale = ref('zh-CN')
  const { useNavigationTitle } = await loadSource('../src/hooks/useNavigationTitle.ts', {
    '@/store/user': { useUserStore: () => user },
    'vue-i18n': { useI18n: () => ({ locale, t: translate, te: key => Object.hasOwn(translations, key) }) },
    '@/utils/navigation-title': titles,
  })
  const resolve = useNavigationTitle()
  const staticTitle = computed(() => resolve(meta))
  const oldTagTitle = computed(() => resolve({ ...meta, originalNameZh: '旧标题快照' }))
  assert.equal(staticTitle.value, '员工销售统计')
  user.userInfo = { permissionsTree: tree(node('Revenue Reports', '销售报表')) }
  assert.equal(staticTitle.value, '销售报表')
  assert.equal(oldTagTitle.value, '销售报表')
  locale.value = 'en-US'
  assert.equal(staticTitle.value, 'Revenue Reports')
  assert.equal(oldTagTitle.value, 'Revenue Reports')
})
