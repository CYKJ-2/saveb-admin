import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/money.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { formatMoney } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('sales chart values and client-side sums never expose floating-point tails', () => {
  for (const locale of ['zh-CN', 'en-US']) {
    assert.equal(formatMoney(8875.400000000001, locale), '8,875.40')
    assert.equal(formatMoney(9846.689999999997, locale), '9,846.69')
    assert.equal(formatMoney(0.1 + 0.2, locale), '0.30')
    assert.equal(formatMoney(100 / 3, locale), '33.33')
    assert.equal(formatMoney('12.345', locale), '12.35')
    assert.equal(formatMoney(-1234.565, locale), '-1,234.57')
  }
})

test('whole amounts and zero show two decimals, missing amounts remain distinct from zero', () => {
  for (const value of [0, '0.00', -0, -0.00000001]) assert.equal(formatMoney(value), '0.00')
  assert.equal(formatMoney(189), '189.00')
  assert.equal(formatMoney('159.0'), '159.00')
  for (const value of [null, undefined, '', ' ', 'not-a-number', NaN, Infinity, -Infinity, false]) {
    assert.equal(formatMoney(value), '—')
  }
})
