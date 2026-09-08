/**
 * 图标注册
 * 使用 vite-plugin-svg-icons 自动加载 src/icons/svg 目录下的 SVG 文件
 * 需在 main.ts 中 import 'virtual:svg-icons-register'
 */
import { createApp } from 'vue'
import SvgIcon from '@/components/SvgIcon/index.vue'

// 注册全局组件
export function registerIcons(app: ReturnType<typeof createApp>) {
  app.component('svg-icon', SvgIcon)
}
