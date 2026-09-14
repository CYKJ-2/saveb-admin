import { request } from '@/utils/request'

export interface CollectorStatus {
  state: 'unknown' | 'running' | 'failed' | 'stale' | 'success'
  lastSuccessAt: string | null
  lastSuccessJobId: string | null
  lastError: string | null
  nextAttemptAt: string | null
  currentDate: string
  schedulerHealthy: boolean
  activeJobId: string | null
  jobStatus: string | null
  canTrigger: boolean
  intervalMinutes: number
  completedChunks: number
  totalChunks: number
  lastProgressAt: string | null
}
export const getCollectorStatus = () => request.get<CollectorStatus>('/collector/status')
export const collectToday = (requestId: string) => request.post<{jobId: string; status: string; date: string}>('/collector/today', { requestId })

export interface CollectionSchedule { intervalMinutes: number; nextRunAt: string | null; updatedAt: string | null; updatedBy: string | null }
export interface CollectionJob {
  jobId: string; mode: string; status: string; actor: string; error: string | null
  publication: string; createdAt: string; completedAt: string | null; completed: number; total: number
  params: { start?: string; end?: string; source_job_id?: string; dry_run?: boolean; task_kind?: string; background_job_id?: string }
}
export interface CollectionChunk { id: number; scope: {day?: string; order_id?: string}; status: string; attempts: number; error: string | null; counts: Record<string, number>; committed_at: string | null }
export interface CollectionPage<T> { items: T[]; total: number; page: number; pageSize: number }
export interface CollectionRequest { requestId: string; mode: 'history' | 'missing' | 'reprocess'; start: string; end: string; dryRun: boolean; sourceJobId?: string }
export const getCollectionSchedule = () => request.get<CollectionSchedule>('/collector/settings')
export const saveCollectionSchedule = (intervalMinutes: number) => request.put<CollectionSchedule>('/collector/settings', { intervalMinutes })
export const getCollectionJobs = (page = 1, per_page = 20) => request.get<CollectionPage<CollectionJob>>('/collector/jobs', { page, per_page })
export const getCollectionJob = (id: string, page = 1, per_page = 20) => request.get<CollectionJob & {chunks: CollectionPage<CollectionChunk>}>(`/collector/jobs/${encodeURIComponent(id)}`, { page, per_page })
export const submitCollection = (data: CollectionRequest) => request.post<CollectionJob>(data.mode === 'reprocess' ? '/collector/reprocess' : '/collector/jobs', data)

export function collectionRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
