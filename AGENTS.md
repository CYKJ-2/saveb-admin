# 项目约定

- 本项目是 saveb-api 的管理前端。
- 新增页面、组件和交互样式参照 ../vue-vben-admin-main，沿用现有 Vben 风格的主题变量、抽屉、表单和表格。
- 当前工程为 Vue 3 + Vite + Pinia + Element Plus，保持现有依赖体系。
- 菜单与按钮权限独立，权限分配只保存明确选中的节点，不自动展开授权子树。
- 权限状态来自 /api/auth/me，不能把 localStorage 中的权限当作服务端鉴权依据。
- 变更后运行 npm run build，并验证相关页面和后端鉴权行为。
