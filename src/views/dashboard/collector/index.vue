<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { businessDate } from '@/api/dashboard'
import { collectionRequestId, getCollectionSchedule, saveCollectionSchedule, getCollectionJobs, getCollectionJob, submitCollection, type CollectionSchedule, type CollectionJob, type CollectionRequest, type CollectionChunk, type CollectionPage } from '@/api/collector'

const user = useUserStore(), { locale } = useI18n()
const zh = computed(() => locale.value.startsWith('zh'))
const text = (cn: string, en: string) => zh.value ? cn : en
const can = (action: string) => user.hasPermission(`dashboard.collector.${action}`)
const schedule = ref<CollectionSchedule | null>(null), interval = ref(30), saving = ref(false)
const jobs = ref<CollectionJob[]>([]), total = ref(0), page = ref(1), loading = ref(false), loadError = ref(false)
const pageSize = ref(20), detailSize = ref(20)
const range = ref<[string, string]>([businessDate(), businessDate()])
const form = reactive({ mode: (can('collect') ? 'history' : 'reprocess') as CollectionRequest['mode'], dryRun: false, sourceJobId: '' })
const submitting = ref(false), pending = ref<CollectionRequest | null>(null)
const drawer = ref(false), detail = ref<(CollectionJob & {chunks: CollectionPage<CollectionChunk>}) | null>(null), detailPage = ref(1)
let timer: ReturnType<typeof setTimeout> | undefined, disposed = false
const format = (value?: string | null) => value ? new Intl.DateTimeFormat(locale.value, { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(new Date(value)) : '—'
const labels = computed<Record<string, string>>(() => ({ queued: text('排队中', 'Queued'), running: text('运行中', 'Running'), retrying: text('重试中', 'Retrying'), succeeded: text('成功', 'Succeeded'), failed: text('失败', 'Failed'), partial_failed: text('部分失败', 'Partially failed'), cancelled: text('已取消', 'Cancelled'), history: text('范围更新', 'Range update'), missing: text('仅补缺', 'Missing dates'), reprocess: text('归档重算', 'Archive recalculation'), refresh: text('字段刷新', 'Field refresh'), today: text('当天采集', 'Today') }))
const label = (value: string) => labels.value[value] || value
const operationDescription = computed(() => form.mode === 'history'
  ? text('重新获取指定范围的订单，按订单号比较后新增或更新，并保留人工调整，不复活人工删除的订单。', 'Fetch orders in the selected range, then insert or update by order number while preserving manual edits and keeping manually deleted orders deleted.')
  : form.mode === 'missing'
    ? text('仅补未成功采集的日期。', 'Only collect dates that have not been successfully collected.')
    : text('使用已有原始归档验证当前规则的计算结果，不访问收单系统、不入库；所选日期必须有归档。', 'Use existing archives to check calculations under current rules, without fetching or publishing. Selected dates must have archived data.'))
const tagType = (value: string) => value === 'succeeded' ? 'success' : ['failed', 'partial_failed'].includes(value) ? 'danger' : 'info'
const disabledDate = (date: Date) => {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return key < '2000-01-01' || key > businessDate()
}
async function load() {
  if (disposed || loading.value) return
  loading.value = true
  try {
    const [result, currentSchedule] = await Promise.all([getCollectionJobs(page.value, pageSize.value), getCollectionSchedule()])
    if (disposed) return
    schedule.value = currentSchedule
    jobs.value = result.items; total.value = result.total; loadError.value = false
    if (drawer.value && detail.value) await showDetail(detail.value.jobId, detailPage.value)
  } catch { if (!disposed) loadError.value = true }
  finally {
    loading.value = false
    if (!disposed) { clearTimeout(timer); timer = setTimeout(load, loadError.value ? 30000 : 10000) }
  }
}
async function save() {
  saving.value = true
  try {
    schedule.value = await saveCollectionSchedule(interval.value)
    ElMessage.success(text('已保存，从现在起按新间隔计时，无需重启', 'Saved. The new interval starts now; no restart needed.'))
  } catch { /* 请求层展示错误 */ }
  finally { saving.value = false }
}
async function submit() {
  if (submitting.value) return
  if (!pending.value) {
    if (!range.value?.[0] || !range.value?.[1]) { ElMessage.warning(text('请选择日期范围', 'Select a date range')); return }
    if (form.mode === 'reprocess' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(form.sourceJobId.trim())) {
      ElMessage.warning(text('请选择归档任务或输入有效任务 UUID', 'Select an archive task or enter a valid UUID')); return
    }
    pending.value = { requestId: collectionRequestId(), mode: form.mode, start: range.value[0], end: range.value[1], dryRun: form.mode === 'reprocess' || form.dryRun,
      ...(form.mode === 'reprocess' ? { sourceJobId: form.sourceJobId.trim() } : {}) }
  }
  submitting.value = true
  try {
    const result = await submitCollection(pending.value)
    pending.value = null
    ElMessage.success(text('任务已受理，请在任务列表查看执行结果', 'Task accepted. Check its progress in the list.'))
    page.value = 1; await load(); await showDetail(result.jobId)
  } catch (error: any) {
    // 明确的校验/权限拒绝可编辑参数；不确定的网络/服务错误保留整个请求以安全重试。
    if ([400, 401, 403, 422].includes(error?.response?.status)) pending.value = null
  } finally { submitting.value = false }
}
async function showDetail(id: string, selectedPage = 1) {
  try {
    const result = await getCollectionJob(id, selectedPage, detailSize.value)
    if (disposed) return
    detail.value = result; detailPage.value = selectedPage; drawer.value = true
  } catch { /* 请求层展示错误 */ }
}
function useArchive(job: CollectionJob) {
  if (pending.value) return
  form.mode = 'reprocess'; form.sourceJobId = job.jobId
  if (job.params.start && job.params.end) range.value = [job.params.start, job.params.end]
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(async () => {
  try { const result = await getCollectionSchedule(); if (!disposed) { schedule.value = result; interval.value = result.intervalMinutes } } catch { /* 请求层展示错误 */ }
  await load()
})
onBeforeUnmount(() => { disposed = true; clearTimeout(timer) })
</script>

<template>
  <main class="collection-page">
    <header><h1>{{ text('采集管理', 'Collection management') }}</h1><p>{{ text('配置自动采集，更新指定日期数据，查看每次任务结果。所有日期均按北京时间。', 'Configure automatic collection, update a date range, and track results. Dates use Asia/Shanghai.') }}</p></header>
    <div class="settings-grid">
      <el-card shadow="never">
        <template #header>{{ text('自动采集间隔', 'Automatic collection interval') }}</template>
        <el-form label-position="top" @submit.prevent="save">
          <el-form-item :label="text('间隔（分钟）', 'Interval (minutes)')"><el-input-number v-model="interval" :min="5" :max="1440" :precision="0" :disabled="!can('settings') || saving" /></el-form-item>
          <p class="muted">{{ text('支持 5–1440 分钟，默认 30 分钟。保存后重新计时，约一分钟内被调度器识别；正在运行的任务继续执行。', '5–1440 minutes; default 30. Saving starts a new interval, checked within about one minute. Running tasks continue.') }}</p>
          <p>{{ text('下次计划：', 'Next scheduled: ') }}{{ format(schedule?.nextRunAt) }}</p>
          <el-button v-if="can('settings')" type="primary" native-type="submit" :loading="saving" :disabled="!schedule">{{ text('保存间隔', 'Save interval') }}</el-button>
        </el-form>
      </el-card>
      <el-card shadow="never">
        <template #header>{{ text('自定义日期采集', 'Custom date collection') }}</template>
        <el-form label-position="top" :disabled="submitting || !!pending" @submit.prevent="submit">
          <el-form-item :label="text('操作', 'Operation')"><div class="operation-row"><el-select v-model="form.mode" aria-describedby="operation-description">
            <el-option v-if="can('collect')" value="history" :label="text('范围更新', 'Range update')" />
            <el-option v-if="can('collect')" value="missing" :label="text('仅补缺', 'Missing dates')" />
            <el-option v-if="can('reprocess')" value="reprocess" :label="text('归档重算预览（不入库）', 'Archive recalculation preview')" />
          </el-select><span id="operation-description" class="muted" aria-live="polite">{{ operationDescription }}</span></div></el-form-item>
          <el-form-item :label="text('日期范围（包含起止日期）', 'Date range (inclusive)')"><el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" :disabled-date="disabledDate" :clearable="false" style="width:100%" /></el-form-item>
          <el-form-item v-if="form.mode === 'reprocess'" :label="text('来源归档任务 UUID', 'Source archive task UUID')"><el-input v-model="form.sourceJobId" :placeholder="text('可点击下方任务的“使用归档”', 'Use an archive task from the list below')" /></el-form-item>
          <el-checkbox v-else v-model="form.dryRun">{{ text('只预览，不发布业务数据', 'Preview only; do not publish') }}</el-checkbox>
        </el-form>
        <el-alert v-if="pending && !submitting" type="warning" :closable="false" :title="text('提交结果尚未确认，可重试同一请求；不会重复创建已受理任务。', 'Submission is unconfirmed. Retry the same request without duplicating an accepted task.')" />
        <el-button v-if="form.mode === 'reprocess' ? can('reprocess') : can('collect')" type="primary" :loading="submitting" @click="submit">{{ pending ? text('重试同一请求', 'Retry same request') : text('提交任务', 'Submit task') }}</el-button>
      </el-card>
    </div>
    <el-card shadow="never">
      <template #header><div class="list-heading"><span>{{ text('采集任务', 'Collection tasks') }}</span><el-button :loading="loading" @click="load">{{ text('刷新', 'Refresh') }}</el-button></div></template>
      <el-alert v-if="loadError" type="error" :closable="false" :title="text('任务列表读取失败，正在重试', 'Unable to load tasks; retrying')" />
      <el-table :data="jobs" stripe>
        <el-table-column :label="text('创建时间', 'Created')" min-width="165"><template #default="{row}">{{ format(row.createdAt) }}</template></el-table-column>
        <el-table-column :label="text('模式', 'Mode')" min-width="110"><template #default="{row}">{{ label(row.mode) }}<small v-if="row.publication === 'preview'">{{ text('预览，不入库', 'Preview only') }}</small></template></el-table-column>
        <el-table-column :label="text('日期范围', 'Date range')" min-width="200"><template #default="{row}">{{ row.params.start || '—' }} ~ {{ row.params.end || '—' }}</template></el-table-column>
        <el-table-column :label="text('状态', 'Status')" min-width="120"><template #default="{row}"><el-tag :type="tagType(row.status)">{{ label(row.status) }}</el-tag></template></el-table-column>
        <el-table-column :label="text('成功分片', 'Completed chunks')" width="115"><template #default="{row}">{{ row.completed }} / {{ row.total }}</template></el-table-column>
        <el-table-column :label="text('完成时间', 'Finished')" min-width="165"><template #default="{row}">{{ format(row.completedAt) }}</template></el-table-column>
        <el-table-column :label="text('操作', 'Actions')" width="170" fixed="right"><template #default="{row}"><el-button link type="primary" @click="showDetail(row.jobId)">{{ text('详情', 'Details') }}</el-button><el-button v-if="can('reprocess')" link type="primary" :disabled="!!pending" @click="useArchive(row)">{{ text('使用归档', 'Use archive') }}</el-button></template></el-table-column>
      </el-table>
      <ApiPagination v-model:page="page" v-model:size="pageSize" :total="total" :loading="loading" @change="load" />
    </el-card>
    <el-drawer v-model="drawer" :title="text('采集任务详情', 'Task details')" size="min(900px, 95vw)">
      <template v-if="detail">
        <p class="job-id">{{ detail.jobId }}</p><p>{{ text('操作者：', 'Actor: ') }}{{ detail.actor }} · {{ label(detail.status) }}</p>
        <el-alert v-if="detail.error" type="error" :closable="false" :title="detail.error" />
        <el-alert v-if="detail.publication === 'preview'" type="info" :closable="false" :title="text('这是预览任务，成功不代表业务数据已更新', 'Preview task: success does not mean business data was updated')" />
        <el-table :data="detail.chunks.items">
          <el-table-column :label="text('日期 / 订单', 'Date / order')" min-width="140"><template #default="{row}">{{ row.scope.day || row.scope.order_id }}</template></el-table-column>
          <el-table-column :label="text('状态', 'Status')" min-width="110"><template #default="{row}">{{ label(row.status) }}</template></el-table-column>
          <el-table-column :label="text('获取 / 选中', 'Fetched / selected')" min-width="120"><template #default="{row}">{{ row.counts.fetched ?? '—' }} / {{ row.counts.selected ?? '—' }}</template></el-table-column>
          <el-table-column :label="text('新增 / 更新 / 未变', 'New / updated / unchanged')" min-width="160"><template #default="{row}">{{ row.counts.inserted ?? '—' }} / {{ row.counts.updated ?? '—' }} / {{ row.counts.unchanged ?? '—' }}</template></el-table-column>
          <el-table-column prop="error" :label="text('错误', 'Error')" min-width="170" />
        </el-table>
        <p class="muted">{{ text('计数反映来源记录比较结果，不等同于新增业务订单行数。', 'Counts describe source comparisons, not necessarily new business rows.') }}</p>
        <ApiPagination v-model:page="detailPage" v-model:size="detailSize" :total="detail.chunks.total" @change="showDetail(detail.jobId, detailPage)" />
      </template>
    </el-drawer>
  </main>
</template>

<style scoped>
.operation-row{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;width:100%}.operation-row .el-select{width:210px;flex:0 0 210px}.operation-row .muted{flex:1 1 220px}
.collection-page{display:flex;flex-direction:column;gap:18px;padding:20px}.collection-page h1{font-size:24px;margin:0 0 8px}.collection-page header p,.muted{color:hsl(var(--muted-foreground));font-size:13px;line-height:1.7}.settings-grid{display:grid;grid-template-columns:1fr 1.5fr;gap:18px}.list-heading{display:flex;justify-content:space-between;align-items:center}.collection-page small{display:block;color:hsl(var(--muted-foreground))}.el-pagination{margin-top:16px}.job-id{overflow-wrap:anywhere}.el-alert{margin-bottom:12px}@media(max-width:900px){.settings-grid{grid-template-columns:1fr}.collection-page{padding:12px}}
</style>
