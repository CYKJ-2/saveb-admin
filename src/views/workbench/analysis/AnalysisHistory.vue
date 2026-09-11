<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'

const open = defineModel<boolean>({ required: true })
const { t, locale } = useI18n()
const data = ref<any>({ list: [], total: 0, page: 1, per_page: 20 })
const loading = ref(false)
const error = ref('')
let revision = 0
async function load(pagination = { page: 1, per_page: 20 }) {
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const result = await workbench.get('/analysis/imports', pagination)
    if (current === revision) data.value = result
  } catch (e: any) { if (current === revision) error.value = e.message || t('analysis.failed') }
  finally { if (current === revision) loading.value = false }
}
watch(open, value => { if (value) void load() })
onBeforeUnmount(() => { revision++ })
</script>
<template>
  <el-dialog v-model="open" :title="t('analysis.history')" width="min(1100px, 94vw)">
    <div class="legacy-workbench history-content">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <LoadingRegion :loading="loading">
        <div class="history-scroll"><table>
          <thead><tr><th>{{ t('analysis.workbook') }}</th><th>{{ t('analysis.source') }}</th><th>{{ t('analysis.importTime') }}</th><th>{{ t('analysis.operator') }}</th><th>{{ t('analysis.activeMonths') }}</th><th>{{ t('analysis.rows') }}</th></tr></thead>
          <tbody>
            <tr v-for="item in data.list" :key="item.id">
              <td>{{ item.filename }}</td><td>{{ t('analysis.' + item.source_type) }}</td>
              <td>{{ new Date(item.created_at).toLocaleString(locale) }}</td><td>{{ item.operator_name || t('analysis.commandImport') }}</td>
              <td>{{ item.source_type === 'suppliers' ? (item.is_active ? t('analysis.currentDictionary') : t('analysis.inactive')) : item.active_periods.join(' / ') || t('analysis.inactive') }}</td>
              <td>{{ item.summary.rows }}</td>
            </tr>
            <tr v-if="!data.list.length"><td colspan="6" class="empty">{{ t('analysis.noRows') }}</td></tr>
          </tbody>
        </table></div>
        <ApiPagination :page="data.page" :size="data.per_page" :total="data.total" :loading="loading" @change="load" />
      </LoadingRegion>
    </div>
  </el-dialog>
</template>
<style scoped>
.history-content { padding: 0; min-height: 0; background: transparent; }
.history-scroll { overflow: auto; }
.history-scroll th, .history-scroll td { text-align: left; white-space: nowrap; }
</style>
