import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

// 不同端口的开发服务分别保存预构建依赖，避免 3000 / 3001 相互覆盖缓存。
const portIndex = process.argv.indexOf('--port')
const portOption = process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1]
const devPort = Number(portOption || (portIndex >= 0 ? process.argv[portIndex + 1] : 3000))

export default defineConfig(({ command, mode }) => {
  // Go 迁移期只切换代理入口，浏览器仍使用 /api；设回 8080 即可回到 PHP。
  const env = loadEnv(mode, __dirname, 'VITE_API_PROXY_TARGET')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
  return ({
  cacheDir: resolve(__dirname, 'node_modules/.vite', command === 'serve' ? `dev-${devPort}` : 'build'),
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true
      }
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    }),
    createSvgIconsPlugin({
      iconDirs: [resolve(__dirname, 'src/icons/svg')],
      symbolId: 'icon-[dir]-[name]'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: devPort,
    strictPort: true,
    proxy: {
      // 后端基础地址 http://localhost:8080
      // 业务接口前缀 /api/*（如 /api/auth/login → http://localhost:8080/api/auth/login）
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        // 不重写路径：/api/* 直接转发到后端 /api/*
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixin.scss" as *;`
      }
    }
  }
  })
})
