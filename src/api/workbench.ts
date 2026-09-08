import i18n from '@/lang'
import { request } from '@/utils/request'
export type Row = Record<string, any>
const base = '/workbench'
export const workbench = {
  get: <T = any>(path: string, params?: Row) => request.get<T>(base + path, params),
  post: <T = any>(path: string, data?: any, timeout = 30000) => request.post<T>(base + path, data, { timeout }),
  put: <T = any>(path: string, data?: Row) => request.put<T>(base + path, data),
  remove: (path: string, version: number, data?: Row) => request.delete(base + path, { ...data, version }),
  blob: (path: string, params?: Row, silentError = false) => request.get<Blob>(base + path, params, { responseType: 'blob', silentError }),
  async download(path: string, name: string, params?: Row) {
    const blob = await this.blob(path, { ...params, locale: i18n.global.locale.value }); const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = name; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  async upload(file: File) { const form = new FormData(); form.append('file', file); return this.post<{ id: number }>('/attachments', form) },
}
