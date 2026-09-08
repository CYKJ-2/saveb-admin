import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import pinia from './store'
import { registerIcons } from './icons'
import 'virtual:svg-icons-register'
import './styles/index.scss'
import './styles/deep-blue.css'

import i18n from './lang'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册 SVG 图标组件
registerIcons(app)

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus)

app.mount('#app')
