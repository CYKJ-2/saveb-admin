<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { collectToday, getCollectorStatus, type CollectorStatus } from '@/api/collector'

const emit = defineEmits<{ collected: [] }>()
const user = useUserStore(), { locale } = useI18n()
const zh = computed(() => locale.value.startsWith('zh'))
const canRead = computed(() => user.hasPermission('dashboard.overview.collector_status'))
const canTrigger = computed(() => user.hasPermission('dashboard.overview.collector_trigger'))
const status = ref<CollectorStatus | null>(null), error = ref(false), submitting = ref(false)
// 连接超时后重试复用 UUID，防止后端实际已经受理却重复创建任务。
let requestId: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined, disposed = false, loading = false
let previousSuccess: string | null | undefined
function newRequestId(): string {
  // 内网 HTTP 页面可能没有 randomUUID；getRandomValues 仍可生成请求幂等标识。
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
const format = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(locale.value, { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(new Date(value)) : '—'
const tone = computed(() => error.value ? 'fail' : ({success: 'ok', failed: 'fail', stale: 'warn', running: 'running', unknown: 'warn'}[status.value?.state || 'unknown']))
const message = computed(() => {
  if (error.value) return zh.value ? '无法读取采集状态，请检查 API 连接' : 'Cannot read collector status. Check the API connection.'
  const s = status.value
  if (!s) return zh.value ? '正在读取采集运行状态…' : 'Loading collector status…'
  if (s.state === 'running') return zh.value ? `采集任务${s.jobStatus === 'queued' ? '排队中' : '运行中'}，完成后自动刷新页面数据` : 'Collection queued or running; dashboard data will refresh after completion.'
  if (s.state === 'success') return zh.value ? `采集成功 · 下次计划：${format(s.nextAttemptAt)}` : `Collection succeeded · Next scheduled: ${format(s.nextAttemptAt)}`
  if (s.state === 'failed') return zh.value ? `采集失败：${s.lastError || '未知错误'}` : `Collection failed: ${s.lastError || 'unknown error'}`
  return zh.value ? `采集告警：${s.lastError || '尚无采集记录'}` : `Collector warning: ${!s.schedulerHealthy ? 'Scheduler heartbeat missing or stale' : 'No recent successful collection'}`
})
async function poll() {
  if (disposed || loading || !canRead.value) return
  loading = true
  try {
    const result = await getCollectorStatus()
    if (disposed) return
    status.value = result; error.value = false
    if (previousSuccess !== undefined && result.lastSuccessJobId && result.lastSuccessJobId !== previousSuccess) emit('collected')
    previousSuccess = result.lastSuccessJobId
  } catch { if (!disposed) error.value = true }
  finally {
    loading = false
    if (!disposed) { clearTimeout(timer); timer = setTimeout(poll, error.value ? 30000 : 10000) }
  }
}
async function trigger() {
  if (submitting.value) return
  submitting.value = true
  requestId ||= newRequestId()
  try {
    const result = await collectToday(requestId)
    requestId = null
    if (disposed) return
    ElMessage.success(zh.value ? `已提交 ${result.date} 当天采集任务` : `Collection for ${result.date} submitted`)
    await poll()
  } catch { /* 通用请求层展示错误；下次点击保留同一请求编号。 */ }
  finally { submitting.value = false }
}
onMounted(poll)
onBeforeUnmount(() => { disposed = true; clearTimeout(timer) })
</script>

<template>
  <section v-if="canRead || canTrigger" class="collector-toolbar" :aria-label="zh ? '采集运行监控' : 'Collector monitoring'">
    <span v-if="canRead" id="refreshText" class="refresh-health" :class="tone" role="status" aria-live="polite">
      {{ message }}
      <span v-if="!error && status && status.intervalMinutes > 0">{{ zh ? ` · 自动采集间隔：每 ${status.intervalMinutes} 分钟` : ` · Automatic collection interval: every ${status.intervalMinutes} minutes` }}</span>
      <small v-if="status?.activeJobId && status.totalChunks > 0">{{ zh ? `已完成 ${status.completedChunks} / ${status.totalChunks} 个分片 · 最近进展：${format(status.lastProgressAt)}` : `${status.completedChunks} / ${status.totalChunks} chunks completed · Last progress: ${format(status.lastProgressAt)}` }}</small>
      <small v-if="status?.lastSuccessAt" class="ok">{{ zh ? `最近成功采集：${format(status.lastSuccessAt)}（任务完成时间）` : `Last successful collection: ${format(status.lastSuccessAt)} (task completion time)` }}</small>
      <small v-if="status?.state === 'running' && !status.schedulerHealthy">{{ zh ? '定时调度心跳未确认' : 'Scheduler heartbeat not confirmed' }}</small>
    </span>
    <el-button v-if="canTrigger" type="primary" plain :icon="Refresh" :loading="submitting" :disabled="!!status?.activeJobId || status?.canTrigger === false" @click="trigger">{{ zh ? '采集当天数据' : 'Collect today’s data' }}</el-button>
  </section>
</template>

<style scoped>
.collector-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:14px 16px;margin-bottom:16px;background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:var(--radius)}
.refresh-health{flex:1 1 400px;font-size:13px;line-height:1.7;overflow-wrap:anywhere}.refresh-health::before{content:'●';margin-right:8px}.refresh-health small{display:block}.ok{color:var(--el-color-success)}.fail{color:var(--el-color-danger)}.warn{color:var(--el-color-warning)}.running{color:var(--el-color-primary)}
</style>
