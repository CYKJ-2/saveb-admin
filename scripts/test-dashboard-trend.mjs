import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/views/dashboard/trend-period.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } })
const compiled = { exports: {} }
new Function('require', 'exports', 'module', outputText)(createRequire(import.meta.url), compiled.exports, compiled)
const { getDashboardTrendPeriod } = compiled.exports

test('default today displays the whole month daily and the whole year monthly', () => {
  const today = { startDate: '2026-09-07', endDate: '2026-09-07' }
  const daily = getDashboardTrendPeriod(today, 'day', false)
  assert.deepEqual(daily.requestRange, { startDate: '2026-09-01', endDate: '2026-09-30' })
  assert.deepEqual(daily.displayRange, daily.requestRange)
  assert.deepEqual(getDashboardTrendPeriod(today, 'month', false).displayRange, { startDate: '2026-01-01', endDate: '2026-12-31' })
  assert.deepEqual(today, { startDate: '2026-09-07', endDate: '2026-09-07' })
})

test('selected days are restored after switching to the full-year monthly view and back', () => {
  for (const selected of [
    { startDate: '2026-08-10', endDate: '2026-08-15' },
    { startDate: '2025-03-05', endDate: '2025-05-20' },
  ]) {
    const original = { ...selected }
    assert.deepEqual(getDashboardTrendPeriod(selected, 'day', true).requestRange, original)
    const monthly = getDashboardTrendPeriod(selected, 'month', true)
    assert.deepEqual(monthly.displayRange, { startDate: `${selected.startDate.slice(0, 4)}-01-01`, endDate: `${selected.endDate.slice(0, 4)}-12-31` })
    assert.deepEqual(monthly.requestRange, original)
    assert.deepEqual(getDashboardTrendPeriod(selected, 'day', true).requestRange, original)
    assert.deepEqual(selected, original)
  }
})

test('cross-year filters display both full years while retaining the validated request range', () => {
  const selected = { startDate: '2025-12-24', endDate: '2026-01-04' }
  assert.deepEqual(getDashboardTrendPeriod(selected, 'month', true), {
    requestRange: selected,
    displayRange: { startDate: '2025-01-01', endDate: '2026-12-31' },
  })
  assert.deepEqual(getDashboardTrendPeriod(selected, 'day', true).displayRange, selected)
})

test('leap months and the Today reset retain their default complete-month behavior', () => {
  const today = { startDate: '2024-02-29', endDate: '2024-02-29' }
  assert.deepEqual(getDashboardTrendPeriod(today, 'day', true).requestRange, today)
  assert.deepEqual(getDashboardTrendPeriod(today, 'day', false).requestRange, { startDate: '2024-02-01', endDate: '2024-02-29' })
})
