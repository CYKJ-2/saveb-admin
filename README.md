# SAVEB ERP Admin

当前服务器部署采用 **本地 push → 服务器 git pull → 服务器构建镜像并启动 Docker Compose**，无需 GHCR 或 runner。完整命令见 [服务器启动说明](../saveb-api/APPLICATION-START.md)；自动发布文档留作后续启用时参考。

服务器自动发布见 [AUTODEPLOY.md](AUTODEPLOY.md)：本地 push main → GitHub 云端测试/构建 → GHCR → 内网 runner 拉镜像部署和健康检查。首次数据迁移及固定端口见 [SERVER-DEPLOY.md](SERVER-DEPLOY.md)。真实 .env、nginx.conf 和业务数据由服务器独立维护。

上传 GitHub 时提交源码和依赖锁文件；`node_modules/`、`dist/`、IDE 配置、日志和私有环境文件已由 `.gitignore` 排除。克隆后执行 `npm ci` 安装依赖，`npm run dev` 启动本地开发，`npm run build` 重新生成部署文件。页面入口为项目根目录 `index.html`。

> 基于 Vue 3 + Element Plus + Vite + TypeScript 的现代化企业管理系统

## 🎯 项目简介

SAVEB ERP Admin 是一个融合了 vue-element-admin 简洁结构与 vue-vben-admin 现代风格的后台管理系统模板。

### 核心特性

- 🎨 **现代 UI** - 深色侧边栏 + 渐变登录页，参考 vben-admin 配色
- 📦 **简洁结构** - 扁平化目录，易于理解和维护
- ⚡ **最新技术** - Vue 3 + Vite + TypeScript + Element Plus
- 🔐 **权限管理** - 基于角色的访问控制 (RBAC)
- 🏷️ **标签页导航** - 支持多标签页、右键操作
- 📱 **响应式** - 自适应移动端设备
- 🌐 **国际化** - 中英文双语切换（vue-i18n 9.x）

## 📁 项目结构

```
saveb-admin/
├── src/
│   ├── assets/               # 资源文件
│   │   └── custom-theme/     # 自定义主题
│   │
│   ├── components/           # 公共组件
│   │   └── SvgIcon/         # SVG 图标组件
│   │
│   ├── icons/                # SVG 图标管理
│   │
│   ├── lang/                 # 国际化语言包 ⭐
│   │   ├── index.ts         # vue-i18n 入口
│   │   └── modules/
│   │       ├── zh-CN/       # 中文
│   │       │   ├── common.ts    # 通用
│   │       │   ├── login.ts     # 登录页
│   │       │   ├── layout.ts    # 布局
│   │       │   ├── dashboard.ts # 仪表盘
│   │       │   ├── business.ts  # 业务
│   │       │   ├── system.ts    # 系统
│   │       │   ├── error.ts     # 错误页
│   │       │   └── route.ts     # 路由
│   │       └── en-US/       # 英文（与 zh-CN 同结构）
│   │
│   ├── layout/               # 布局组件
│   │   ├── index.vue
│   │   └── components/
│   │       ├── AppMain.vue
│   │       ├── Navbar/         # 顶部导航
│   │       ├── Sidebar/        # 侧边栏
│   │       └── TagsView/       # 标签页
│   │
│   ├── router/               # 路由
│   │   ├── index.ts         # 路由定义（meta.title 用 i18n key）
│   │   └── permission.ts    # 路由守卫
│   │
│   ├── store/               # Pinia 状态管理
│   │   ├── index.ts
│   │   ├── user.ts
│   │   └── app.ts           # 包含 currentLocale / setLocale
│   │
│   ├── styles/              # 样式文件
│   │   ├── variables.scss   # SCSS 变量（用于 @use）
│   │   ├── variables.module.scss # CSS Module 变量（用于 JS 导入）
│   │   ├── mixin.scss
│   │   └── index.scss
│   │
│   ├── utils/               # 工具函数
│   │   ├── request.ts       # Axios 封装
│   │   ├── auth.ts
│   │   └── permission.ts
│   │
│   ├── views/               # 页面视图
│   │   ├── login/
│   │   ├── dashboard/       # 仪表盘（含多个卡片组件）
│   │   ├── business/        # 业务模块
│   │   ├── system/          # 系统模块
│   │   ├── components/      # 通用占位组件
│   │   └── error/           # 403 / 404
│   │
│   ├── App.vue
│   ├── main.ts              # 入口（已注册 i18n）
│   └── env.d.ts
│
├── vite.config.ts           # Vite 配置（已配置 sass modern-compiler）
├── package.json             # vue-i18n@9 已纳入依赖
└── tsconfig.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装 & 运行

```bash
cd saveb-admin
npm install
npm run dev
```

访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
npm run preview   # 预览构建结果
```

## 🌐 国际化（i18n）

### 切换语言

点击顶部导航栏右侧的 **语言切换按钮**（🌐 图标），在下拉菜单中选择：

- 🇨🇳 中文
- 🇺🇸 English

选择自动保存到 `localStorage`，刷新后保持。

### 语言优先级

1. Pinia store（当前会话）
2. `localStorage` 的 `saveb-locale`
3. 浏览器语言偏好（`navigator.language`）

### 添加新文案

#### 步骤 1：在语言包中添加 key

在 `src/lang/modules/zh-CN/{模块}.ts` 和 `en-US/{模块}.ts` 中添加：

```ts
// src/lang/modules/zh-CN/business.ts
export default {
  order: {
    title: '订单列表',
    // 新增：
    newFeature: '新功能测试',
  },
}

// src/lang/modules/en-US/business.ts
export default {
  order: {
    title: 'Order List',
    // 同位置添加：
    newFeature: 'New Feature Test',
  },
}
```

#### 步骤 2：在组件中使用

```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <span>{{ t('business.order.title') }}</span>
  <span>{{ t('business.order.newFeature') }}</span>
</template>
```

#### 步骤 3：支持插值

```ts
// zh-CN
deleteConfirm: { body: '确定要删除订单 {{ no }} 吗？' }

// en-US
deleteConfirm: { body: 'Are you sure to delete order {{ no }}?' }
```

```vue
<span>{{ t('business.order.deleteConfirm.body', { no: 'SO20260301' }) }}</span>
<!-- 输出: 确定要删除订单 SO20260301 吗？ -->
<!-- 或: Are you sure to delete order SO20260301? -->
```

### 路由标题国际化

路由 `meta.title` 使用 i18n key，存放在 `route.ts` 中：

```ts
// src/lang/modules/zh-CN/route.ts
export default {
  home: '首页',
  'business-order': '订单管理',
  // ...
}
```

**不需要在 Vue 组件中额外处理**，路由守卫会自动解析。

## 📦 技术栈

| 技术 | 说明 | 版本 |
|------|------|------|
| Vue 3 | 渐进式 JavaScript 框架 | ^3.4 |
| Vite | 前端构建工具 | ^5.1 |
| TypeScript | 类型安全 | ^5.3 |
| Element Plus | Vue 3 UI 组件库 | ^2.5 |
| Pinia | 状态管理 | ^2.1 |
| Vue Router | 路由 | ^4.3 |
| vue-i18n | 国际化 | ^9.13 |
| Axios | HTTP 客户端 | ^1.6 |

## 🎨 样式系统

### 变量文件（两个）

- **`variables.scss`** — SCSS 变量（`$primary-color` 等），通过 Vite `additionalData` 自动注入到每个 SCSS 文件，无需手动 `@use`
- **`variables.module.scss`** — CSS Module 变量（`:export {}` 块），供 JS/TS 读取颜色值等

### Mixins

```scss
@include flex-center;   // 居中
@include flex-between;  // 两端对齐
@include text-ellipsis($lines); // 文字省略
@include scrollbar;     // 自定义滚动条
```

## 🔐 权限控制

路由守卫在 `src/router/permission.ts` 中实现，支持 Token 验证和动态路由生成。

## 📱 移动端适配

响应式断点定义在 `src/styles/variables.scss`：

```scss
$device-xs: 480px;
$device-sm: 768px;
$device-md: 992px;
$device-lg: 1200px;
```

## 📝 开发日志

### v1.1.0 (2026-09-04)

- ✅ 升级 sass 到 modern-compiler API，消除 legacy-js-api 弃用警告
- ✅ 重构 SCSS 变量为 `variables.scss`（SCSS）+ `variables.module.scss`（CSS Module）
- ✅ 接入 vue-i18n@9，全量翻译所有页面（中 / 英双语）
- ✅ 顶部导航栏新增语言切换下拉框
- ✅ 路由 meta.title 全面使用 i18n key，切换语言自动更新菜单/标签页/标题
- ✅ 创建 `src/views/components/Placeholder.vue` 共享占位组件，6 个占位页复用

### v1.0.0 (2026-03-03)

- 🎉 初始版本发布

## 📄 License

[MIT](LICENSE)
