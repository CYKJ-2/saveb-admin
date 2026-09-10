import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
import TreeStore from '../node_modules/element-plus/es/components/tree/src/model/tree-store.mjs'

const source = await readFile(new URL('../src/views/system/role/permission-tree.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } })
const compiled = { exports: {} }
new Function('exports', 'module', outputText)(compiled.exports, compiled)
const { restorePermissionChecks } = compiled.exports

function fixture() {
  const data = [{ id: 1, children: [{ id: 2, children: [{ id: 3 }, { id: 4 }] }, { id: 5 }] }]
  const tree = new TreeStore({ key: 'id', data, props: { children: 'children' }, checkStrictly: false })
  tree.initialize()
  return { tree, data }
}
const checked = tree => tree.getCheckedKeys().sort((a, b) => a - b)

test('selecting and clearing a parent updates its entire subtree', () => {
  const { tree } = fixture()
  tree.setChecked(1, true, true)
  assert.deepEqual(checked(tree), [1, 2, 3, 4, 5])
  tree.setChecked(1, false, true)
  assert.deepEqual(checked(tree), [])
})

test('all children check ancestors; clearing one child leaves ancestors half checked', () => {
  const { tree } = fixture()
  for (const id of [3, 4, 5]) tree.setChecked(id, true, true)
  assert.deepEqual(checked(tree), [1, 2, 3, 4, 5])
  tree.setChecked(4, false, true)
  assert.deepEqual(checked(tree), [3, 5])
  assert.deepEqual(tree.getHalfCheckedKeys().sort(), [1, 2])
})

test('opening a legacy partial grant never selects unassigned siblings', () => {
  const { tree, data } = fixture()
  restorePermissionChecks(tree, data, [1, 2, 3])
  assert.deepEqual(checked(tree), [3])
  assert.deepEqual(tree.getHalfCheckedKeys().sort(), [1, 2])
  assert.equal(tree.getNode(4).checked, false)
  assert.equal(tree.getNode(5).checked, false)
  restorePermissionChecks(tree, data, [1])
  assert.deepEqual(checked(tree), [1])
})

test('saved selections restore fully checked parents and partial states without widening access', () => {
  const { tree, data } = fixture()
  tree.setChecked(2, true, true)
  const saved = checked(tree)
  assert.deepEqual(saved, [2, 3, 4])
  restorePermissionChecks(tree, data, saved)
  assert.deepEqual(checked(tree), saved)
  assert.deepEqual(tree.getHalfCheckedKeys(), [1])
  restorePermissionChecks(tree, data, [3, 4, 5])
  assert.deepEqual(checked(tree), [1, 2, 3, 4, 5])
  restorePermissionChecks(tree, data, [])
  assert.deepEqual(checked(tree), [])
})
