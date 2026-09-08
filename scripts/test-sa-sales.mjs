import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/views/workbench/sa-sales/format.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { usd, breakdownRows } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('sales shares follow gross sales even when refund-adjusted sales differ', () => {
  const result = breakdownRows([
    { name: 'Retail', sales: 100, netSales: 20 },
    { name: 'Wholesale', sales: 100, netSales: 100 },
    { name: 'Refund only', sales: 0, netSales: -50 },
  ])
  assert.equal(result.total, 200)
  assert.deepEqual(result.rows.map(row => row.percent), [50, 50])
  assert.equal(breakdownRows([{ name: 'Refund only', sales: 0, netSales: -50 }]).total, 0)
})

test('all money including refunds and chart scales has a US$ prefix in both languages', () => {
  for (const locale of ['zh-CN', 'en-US']) {
    assert.equal(usd(1200.5, locale), 'US$1,200.50')
    assert.equal(usd(-40, locale), 'US$-40.00')
    assert.equal(usd(0, locale), 'US$0.00')
    assert.match(usd(150000, locale, true), /^US\$/)
  }
})
