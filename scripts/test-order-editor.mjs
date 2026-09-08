import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/views/workbench/order-management/order-editor.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } })
const module = { exports: {} }
new Function('exports', 'module', outputText)(module.exports, module)
const { allocationTotal, equalAllocations, initialAllocations, replacePrimaryAllocation, validAllocations, adjustmentPayload } = module.exports
const order = (paymentStatus = 'completed', staffAllocations = []) => ({ id: 10, version: 3, paymentStatus, staffAllocations })

test('equal split keeps two decimals and exactly 100 percent for 3, 6 and 20 staff', () => {
  for (const count of [3, 6, 20]) {
    const rows = equalAllocations(Array.from({ length: count }, (_, i) => `SA${i}`))
    assert.equal(allocationTotal(rows), 100)
    assert.equal(validAllocations('SA0', rows), true)
  }
  assert.deepEqual(equalAllocations(['AA', 'BB', 'CC']).map(row => row.percent), [33.33, 33.33, 33.34])
})

test('existing allocations survive opening; round-off is corrected and blank orders stay blank', () => {
  assert.deepEqual(initialAllocations(order('completed', [{ staffCode: 'AA', shareRatio: .25 }, { staffCode: 'BB', shareRatio: .75 }]), 'AA').map(row => row.percent), [25, 75])
  const thirds = ['AA', 'BB', 'CC'].map(staffCode => ({ staffCode, shareRatio: 1 / 3 }))
  assert.equal(allocationTotal(initialAllocations(order('completed', thirds), 'AA')), 100)
  assert.deepEqual(initialAllocations(order(), ''), [])
  assert.equal(validAllocations('', []), false)
})

test('saving requires primary participation, positive percentages and unique staff', () => {
  assert.equal(validAllocations('AA', [{ staffCode: 'BB', percent: 100 }]), false)
  assert.equal(validAllocations('AA', [{ staffCode: 'AA', percent: 0 }, { staffCode: 'BB', percent: 100 }]), false)
  assert.equal(validAllocations('AA', [{ staffCode: 'AA', percent: 50 }, { staffCode: 'AA', percent: 50 }]), false)
  assert.equal(validAllocations('AA', [{ staffCode: 'AA', percent: undefined }]), false)
  assert.equal(validAllocations('AA', [{ staffCode: 'AA', percent: 99.99 }]), false)
})

test('only pending edits complete the order; other states and version are preserved', () => {
  const rows = [{ staffCode: 'BB', percent: 100 }]
  for (const status of ['completed', 'failed']) {
    const payload = adjustmentPayload(order(status), 'BB', rows)
    assert.equal(Object.hasOwn(payload, 'targetStatus'), false)
    assert.equal(payload.primaryStaffCode, 'BB')
    assert.equal(payload.version, 3)
  }
  assert.equal(adjustmentPayload(order('pending'), 'BB', rows).targetStatus, 'completed')
})

test('replacing a primary removes their allocation and transfers it without changing other shares', () => {
  const original = Object.freeze([
    Object.freeze({ staffCode: 'AA', percent: 40 }),
    Object.freeze({ staffCode: 'BB', percent: 60 }),
  ])
  const replaced = replacePrimaryAllocation(original, 'AA', 'CC')
  assert.deepEqual(replaced, [{ staffCode: 'CC', percent: 40 }, { staffCode: 'BB', percent: 60 }])
  assert.equal(validAllocations('CC', replaced), true)
  assert.deepEqual(adjustmentPayload(order(), 'CC', replaced).staffAllocations, replaced)
  assert.deepEqual(replacePrimaryAllocation([{ staffCode: 'AA', percent: 100 }], 'AA', 'BB'), [{ staffCode: 'BB', percent: 100 }])
  assert.deepEqual(replacePrimaryAllocation([], '', 'AA'), [{ staffCode: 'AA', percent: 100 }])
})

test('promoting an existing collaborator merges shares to two decimals without duplicates', () => {
  const rows = equalAllocations(['AA', 'BB', 'CC'])
  const replaced = replacePrimaryAllocation(rows, 'AA', 'BB')
  assert.deepEqual(replaced, [{ staffCode: 'BB', percent: 66.66 }, { staffCode: 'CC', percent: 33.34 }])
  assert.equal(validAllocations('BB', replaced), true)
  assert.deepEqual(replacePrimaryAllocation(replaced, 'BB', 'DD'), [{ staffCode: 'DD', percent: 66.66 }, { staffCode: 'CC', percent: 33.34 }])
  assert.deepEqual(replacePrimaryAllocation(replaced, 'BB', 'BB'), replaced)
})

test('replacing a primary still works at the allocation limit and retains incomplete share validation', () => {
  const replaced = replacePrimaryAllocation(equalAllocations(Array.from({ length: 20 }, (_, i) => `SA${i}`)), 'SA0', 'NEW')
  assert.equal(replaced.length, 20)
  assert.equal(replaced.some(row => row.staffCode === 'SA0'), false)
  assert.equal(validAllocations('NEW', replaced), true)
  const incomplete = [{ staffCode: 'AA', percent: undefined }, { staffCode: 'BB', percent: 60 }]
  for (const next of ['BB', 'CC']) {
    const rows = replacePrimaryAllocation(incomplete, 'AA', next)
    assert.equal(rows[0].percent, undefined)
    assert.equal(validAllocations(next, rows), false)
  }
})
