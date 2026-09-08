/**
 * Axios 请求封装
 *
 * 后端基础地址: http://localhost:8080 (开发环境通过 vite proxy /api 转发)
 * 业务接口前缀: /api/* (例: /api/auth/login)
 *
 * 兼容多种后端响应格式：
 *   1) 包装格式: { code: 0|200, message: 'ok', data: any }
 *   2) 直接数据: { accessToken: 'xxx', user: {...} }
 *   3) 嵌套 data: { code: 0, data: { token: 'xxx' } }
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/store/user'
import { getToken } from '@/utils/auth'
import i18n from '@/lang'
import { localizePageMessage } from '@/lang/page-message'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 附件预览等组件自行展示失败原因，认证失效仍统一处理。 */
    silentError?: boolean
  }
}

/** 防止 logout 过程中重复触发（多个请求同时 401 时） */
let isLoggingOut = false

/** 标记为正在登出中（由 userStore.logout 同步调用） */
export function setLoggingOut() {
  isLoggingOut = true
}

/**
 * 生成请求 Trace-Id（32 位 hex，与后端 TraceId middleware 格式保持一致）。
 * 后端会再 md5() 一次，但前端先给一个稳定且可读的字符串，便于排错。
 */
function generateTraceId(): string {
  // crypto.randomUUID 在现代浏览器可用；老浏览器降级
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  // 截/补到 32 位 hex
  const hex = uuid.replace(/[^a-f0-9]/g, '').padEnd(32, '0').slice(0, 32)
  return `web-${hex}`
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 1) Token - 优先 store，再读 localStorage。
    //    双保险保证：登录后跨页面/刷新后请求都带 Authorization。
    const storeToken = (() => {
      try {
        return useUserStore().token
      } catch (_) {
        return ''
      }
    })()
    const token = storeToken || getToken()
    if (token) {
      const raw = String(token)
      config.headers.Authorization = raw.startsWith('Bearer ')
        ? raw
        : `Bearer ${raw}`
    }

    // 2) Trace-Id - 每个请求一个唯一字符串，便于日志链路追踪
    config.headers['X-Trace-Id'] = generateTraceId()

    // 3) 语言头 - 跟随 i18n 当前语言。
    //    直接透传前端 i18n key（zh-CN / en-US），后端约定同步使用这两值。
    const locale = (i18n.global.locale as any).value || 'zh-CN'
    config.headers['Accept-Language'] = String(locale)

    return config
  },
  (error) => {
    console.error('Request error:', error)
    if (error.response?.data?.message) error.message = error.response.data.message
    return Promise.reject(error)
  },
)

// 提取业务数据 (兼容多种结构)
function unwrapResponse(payload: any): any {
  if (payload === null || payload === undefined) return payload

  // 如果不是对象，直接返回
  if (typeof payload !== 'object') return payload

  // 包装格式 { code, message, data }
  if ('code' in payload || 'status' in payload) {
    const code = payload.code ?? payload.status
    // 成功: 0 / 200 / undefined
    if (code === 0 || code === 200 || code === undefined || code === null) {
      if (Array.isArray(payload.data) && 'total' in payload) return { data: payload.data, total: payload.total }
      return payload.data !== undefined ? payload.data : payload
    }
    // 业务失败
    throw {
      code,
      message: localizePageMessage(payload.message || payload.msg || i18n.global.t('common.requestFailed')),
      raw: payload,
      isBusinessError: true,
    }
  }

  // 直接数据格式 (没有 code 字段)，原样返回
  return payload
}

// 统一处理 401 登出逻辑（业务错误和网络错误共用）
function handleUnauthorized(message?: string) {
  // 已经在 logout 过程中，跳过
  if (isLoggingOut) return
  isLoggingOut = true

  const isInitializing =
    typeof window !== 'undefined' && (window as any).__SAVEB_INIT__ === true
  if (!isInitializing) {
    ElMessage.error(message || i18n.global.t('login.sessionExpired'))
  }

  // Invalid credentials must be cleared locally; do not call logout with an invalid token.
  Promise.resolve().then(async () => {
    try {
      useUserStore().resetStore()
      if (router.currentRoute.value.path !== '/login') await router.replace('/login')
    } finally {
      isLoggingOut = false
    }
  })
}

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      return unwrapResponse(response.data)
    } catch (err: any) {
      if (err?.isBusinessError) {
        // Token 过期/未授权 - 静默处理，由调用方（permission guard / login）决定
        // 是否跳转，避免在路由切换过程中同步触发 toast 与 redirect 造成组件树崩溃
        if (err.code === 401 || err.code === -1005 || err.code === 40001 || err.code === 4001) {
          handleUnauthorized(err.message)
        } else {
          ElMessage.error(err.message)
        }
        return Promise.reject(err)
      }
      return Promise.reject(err)
    }
  },
  async (error) => {
    // 文件接口的失败响应也是 JSON，Axios 在 blob 模式下不会自动解码。
    const errorBody = error.response?.data
    if (errorBody instanceof Blob && errorBody.type.includes('json')) {
      try { error.response.data = JSON.parse(await errorBody.text()) } catch { /* 保留原始失败响应 */ }
    }
    if (error.config?.silentError && error.response?.status !== 401 && error.response?.data?.code !== -1101) return Promise.reject(error)
    console.error('Response error:', error)
    if (error.response?.data?.message) error.message = localizePageMessage(error.response.data.message)

    // 初始化阶段（permission guard 触发的 /user/info）的网络错误静默处理，
    // 避免冷启动时同时触发 ElMessage / ElForm / ElTable 多组件渲染竞争
    if (error.response) {
      switch (error.response.status) {
        case 401:
          if (error.config?.url !== '/auth/login') handleUnauthorized(error.response.data?.message)
          break
        case 403:
          ElMessage.error(i18n.global.t('login.noPermission'))
          if (error.response.data?.code === -1101) handleUnauthorized(error.response.data?.message)
          break
        case 404:
          ElMessage.error(i18n.global.t('common.notFound'))
          break
        case 500:
          ElMessage.error(i18n.global.t('common.serverError'))
          break
        default:
          ElMessage.error(error.message || i18n.global.t('common.requestFailed'))
      }
    } else if (error.request) {
      // 网络错误（后端未启动） - 初始化阶段静默
      if (!isLoggingOut) {
        const isInitializing =
          typeof window !== 'undefined' && (window as any).__SAVEB_INIT__ === true
        if (!isInitializing) {
          ElMessage.error(i18n.global.t('common.networkError'))
        }
      }
    } else {
      ElMessage.error(error.message || i18n.global.t('common.requestConfigError'))
    }

    if (error.response?.data?.message) error.message = localizePageMessage(error.response.data.message)
    return Promise.reject(error)
  },
)

export default service

// 封装的请求方法
export const request = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, { params, ...config })
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config)
  },

  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, { params, ...config })
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.patch(url, data, config)
  },
}
