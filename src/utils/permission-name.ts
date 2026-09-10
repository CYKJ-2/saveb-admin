/** 菜单、权限列表与授权树使用数据库中的双语名称。 */
export function permissionName(node: { name?: string | null; name_zh?: string | null; code?: string }, locale: string): string {
  return (locale.startsWith('zh') ? node.name_zh || node.name : node.name || node.name_zh) || node.code || ''
}
