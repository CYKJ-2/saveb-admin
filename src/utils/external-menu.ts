/** HTTP(S) 菜单在新标签页打开，不参与站内路由或登录首页选择。 */
export function isExternalMenu(path: unknown): path is string {
  return typeof path === 'string' && /^https?:\/\//i.test(path)
}
