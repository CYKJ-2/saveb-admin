export interface PermissionTreeNode {
  id: number
  children?: PermissionTreeNode[]
}

interface CheckableTree {
  setCheckedKeys(keys: number[]): void
  setChecked(key: number, checked: boolean, deep: boolean): void
}

/** 回显只恢复已授权节点，避免旧数据中的父菜单被展开为全部操作权限。 */
export function restorePermissionChecks(tree: CheckableTree, nodes: PermissionTreeNode[], assignedIds: number[]) {
  const assigned = new Set(assignedIds)
  tree.setCheckedKeys([])
  function visit(items: PermissionTreeNode[]) {
    for (const node of items) {
      if (assigned.has(node.id)) tree.setChecked(node.id, true, false)
      if (node.children?.length) visit(node.children)
    }
  }
  // 先父后子：子节点恢复时由 el-tree 计算父节点的全选、半选状态。
  visit(nodes)
}
