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
  const today = { startDate: '2026-09-14', endDate: '2026-09-14' }
  const daily = getDashboardTrendPeriod(today, 'day')
  assert.deepEqual(daily.requestRange, today)
  assert.deepEqual(daily.displayRange, { startDate: '2026-09-01', endDate: '2026-09-30' })
  assert.deepEqual(getDashboardTrendPeriod(today, 'month').displayRange, { startDate: '2026-01-01', endDate: '2026-12-31' })
  assert.deepEqual(today, { startDate: '2026-09-14', endDate: '2026-09-14' })
})

test('yesterday and an August date show their complete months when switching day/month/day', () => {
  for (const [selected, displayRange] of [
    [{ startDate: '2026-09-13', endDate: '2026-09-13' }, { startDate: '2026-09-01', endDate: '2026-09-30' }],
    [{ startDate: '2026-08-30', endDate: '2026-08-30' }, { startDate: '2026-08-01', endDate: '2026-08-31' }],
    [{ startDate: '2026-08-10', endDate: '2026-08-15' }, { startDate: '2026-08-01', endDate: '2026-08-31' }],
  ]) {
    const original = { ...selected }
    assert.deepEqual(getDashboardTrendPeriod(selected, 'day'), { requestRange: original, displayRange })
    const monthly = getDashboardTrendPeriod(selected, 'month')
    assert.deepEqual(monthly.displayRange, { startDate: '2026-01-01', endDate: '2026-12-31' })
    assert.deepEqual(monthly.requestRange, original)
    assert.deepEqual(getDashboardTrendPeriod(selected, 'day'), { requestRange: original, displayRange })
    assert.deepEqual(selected, original)
  }
})

test('cross-year filters expand to complete months or years and retain the original request', () => {
  const selected = { startDate: '2025-12-24', endDate: '2026-01-04' }
  assert.deepEqual(getDashboardTrendPeriod(selected, 'month'), {
    requestRange: selected,
    displayRange: { startDate: '2025-01-01', endDate: '2026-12-31' },
  })
  assert.deepEqual(getDashboardTrendPeriod(selected, 'day'), {
    requestRange: selected,
    displayRange: { startDate: '2025-12-01', endDate: '2026-01-31' },
  })
})

test('February uses the correct number of days in leap and ordinary years', () => {
  for (const [year, lastDay] of [['2024', '29'], ['2026', '28']]) {
    const selected = { startDate: `${year}-02-10`, endDate: `${year}-02-10` }
    assert.deepEqual(getDashboardTrendPeriod(selected, 'day'), {
      requestRange: selected,
      displayRange: { startDate: `${year}-02-01`, endDate: `${year}-02-${lastDay}` },
    })
  }
})
