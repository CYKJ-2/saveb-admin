# 新增页面中英文切换

2026-09-06：将首页概览、订单管理，以及 Invoice、SA 销售、采购、仓库、达人、PayPal、工作巡查 7 个工作台接入现有 `vue-i18n` / Pinia 语言切换。

## 实现

- `src/lang/modules/zh-CN/pages.ts`、`en-US/pages.ts`：487 条对应文案，包含字段、按钮、弹窗、说明、状态和已知错误提示。原有术语参考 `saveb-source/dashboard/index.html`、`invoice.html`、`sa-sales.html` 中的中英文词典。
- 页面使用 `useI18n()`；分类、状态、快捷日期、快捷入口等通过 `computed` 更新，图表监听当前语言重新绘制，不需要重新请求业务数据。
- `App.vue` 的 `ElConfigProvider` 根据当前语言同步 Element Plus 日期、分页、空状态等内置文案，替换原先无效的 `ElementPlus.locale()` 调用；页面标题、菜单、面包屑与历史标签页同步翻译。
- 继续使用既有 `saveb-locale` 持久化机制和请求的 `Accept-Language` 头。
- `useBusinessLocale.ts` 仅翻译已知业务状态码及分类码，保留接口参数值；客户、商品、域名、备注等业务原文不自动翻译。
- 在线表格使用原有 `title_zh/title_en` 与 `description_zh/description_en`。首页 Dao 补充返回英文两列，继续通过原有鉴权、Service、Dao、Model 查询，未增加表或修改统计规则。
- `page-message.ts` 在展示时翻译已知错误，未知后端信息原样保留，避免隐藏诊断信息。

## 验证

```powershell
node scripts/check-page-i18n.cjs
npm run build
docker exec saveb-api-app php vendor/bin/phpunit -c phpunit-dashboard.xml
docker exec saveb-api-app php vendor/bin/phpunit -c phpunit-rbac.xml
```

- 487 条双语 key 和插值参数一致，16 个使用新词典的 Vue 页面/组件编译通过，模板无固定中文。
- 生产构建通过。此次本机内存紧张，构建进程使用 `GOMAXPROCS=1`、`NODE_OPTIONS=--max-old-space-size=768` 成功构建；未修改系统内存设置或项目构建配置。
- 首页 API 回归 8 项 / 69 个断言，RBAC 回归 14 项 / 67 个断言通过；仅在测试隔离 schema 中写入测试数据。
- 浏览器核对首页历史数据、英文日期面板、菜单、7 个工作台及 Invoice / 采购 / PayPal 弹窗；仓库状态选项可直接从英文切回中文。

修改前的前端源码备份位于 `E:/wwwroot/i18n-backup-20260906/src`，一次性文案迁移工具及原系统翻译匹配清单位于同目录 `migration-tools`。后续新增文案直接维护两个 `pages.ts` 文件，不应重复运行一次性迁移工具。
