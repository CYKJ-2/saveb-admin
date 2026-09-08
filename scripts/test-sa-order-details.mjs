import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('../src/views/workbench/sa-sales/use-order-details.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
})
const compiled = { exports: {} }
new Function('require', 'exports', 'module', outputText)(require, compiled.exports, compiled)
const { useOrderDetails } = compiled.exports
const range = { startDate: '2026-09-01', endDate: '2026-09-07' }
const response = (params) => ({ list: [{ orderId: params.orderId }], total: 65, totalAmount: 123.45, page: params.page, per_page: params.per_page })

test('draft edits and date shortcuts remain local until Search; default category is empty', async () => {
  const calls = []
  const state = useOrderDetails(range, async (params) => { calls.push(params); return response(params) })
  assert.equal(state.queried.value, false)
  state.filters.orderId = ' ORDER-1 '
  state.filters.customerName = ' Alice '
  state.filters.startDate = '2026-08-01'
  state.filters.endDate = '2026-08-31'
  await state.loadPage(1)
  assert.equal(calls.length, 0)
  await state.query()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].classification, '')
  assert.equal(calls[0].orderId, 'ORDER-1')
  assert.equal(calls[0].customerName, 'Alice')
  assert.equal(calls[0].startDate, '2026-08-01')
})

test('pagination uses submitted filters and Invoice takes effect only on the next Search', async () => {
  const calls = []
  const state = useOrderDetails(range, async (params) => { calls.push(params); return response(params) })
  state.filters.orderId = 'REGULAR'
  await state.query()
  state.filters.classification = 'invoice'
  state.filters.orderId = 'INV-1'
  state.filters.paypalAccount = 'sales@example.test'
  await state.loadPage(2)
  assert.equal(calls[1].page, 2)
  assert.equal(calls[1].classification, '')
  assert.equal(calls[1].orderId, 'REGULAR')
  state.pageSize.value = 50
  await state.loadPage(1)
  assert.equal(calls[2].per_page, 50)
  assert.equal(calls[2].paypalAccount, '')
  await state.query()
  assert.equal(calls[3].classification, 'invoice')
  assert.equal(calls[3].orderId, 'INV-1')
  assert.equal(calls[3].paypalAccount, 'sales@example.test')
})

test('Reset does not request data and prevents an in-flight response from restoring cleared results', async () => {
  let finish
  let calls = 0
  const state = useOrderDetails(range, () => { calls++; return new Promise(resolve => { finish = resolve }) })
  const pending = state.query()
  assert.equal(state.loading.value, true)
  state.reset()
  finish(response({ page: 1, per_page: 20 }))
  await pending
  await state.loadPage(2)
  assert.equal(calls, 1)
  assert.equal(state.result.value, null)
  assert.equal(state.loading.value, false)
  assert.equal(state.queried.value, false)
  assert.equal(state.filters.startDate, range.startDate)
})

test('invalid date ranges never query; clearing both dates queries all dates', async () => {
  let calls = 0
  const state = useOrderDetails(range, async params => { calls++; return response(params) })
  state.filters.startDate = '2026-09-08'
  await state.query()
  assert.equal(calls, 0)
  assert.equal(state.error.value, 'pages.saInvalidRange')
  state.filters.startDate = ''
  await state.query()
  assert.equal(calls, 0)
  state.filters.endDate = ''
  await state.query()
  assert.equal(calls, 1)
  assert.equal(state.error.value, '')
})

test('a failed new query clears old results and allows a retry', async () => {
  let fail = false
  const state = useOrderDetails(range, async params => {
    if (fail) throw new Error('Network error')
    return response(params)
  })
  await state.query()
  fail = true
  await state.query()
  assert.equal(state.result.value, null)
  assert.equal(state.error.value, 'Network error')
  assert.equal(state.loading.value, false)
  fail = false
  await state.query()
  assert.equal(state.error.value, '')
  assert.equal(state.result.value.total, 65)
})
