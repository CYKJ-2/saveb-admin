<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import LoadingRegion from '@/components/common/LoadingRegion.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench } from '../shared/useWorkbench'
import { useDebouncedReload } from '../shared/useDebouncedReload'
import AddWebsiteDialog from './AddWebsiteDialog.vue'
import type { InfluencerDirectory } from './types'
const props = defineProps<{ refresh: number }>()
const emit = defineEmits<{ saved: [] }>()
const { t, locale } = useI18n()
const { can } = useWorkbench('influencer')
const directory = ref<InfluencerDirectory[]>([])
const search = ref('')
const page = ref(1), size = ref(20), total = ref(0)
const summary = ref({ influencers: 0, websites: 0, updatedAt: null as string | null })
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const editing = ref(false)
const notice = ref<{ added: boolean; domain: string; influencer_name: string } | null>(null)
let revision = 0
const searchReload = useDebouncedReload(() => { page.value = 1; load() })
const pageRows = computed(() => directory.value)
const domainCount = computed(() => summary.value.websites)
const updatedAt = computed(() => summary.value.updatedAt)
const sourceDate = computed(() => updatedAt.value ? new Date(updatedAt.value).toLocaleString(locale.value, { timeZone: 'Asia/Shanghai' }) : '—')
const tierKey = (tier: string) => tier === 'top' ? 'creatorRelationshipTop' : tier === 'mid' ? 'creatorRelationshipMid' : 'creatorRelationshipUnknown'
async function load() {
  searchReload.cancel()
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const result = await workbench.get('/influencers/directory', { keyword: search.value, page: page.value, per_page: size.value })
    if (current === revision) { directory.value = result.list; page.value = result.page; total.value = result.total; summary.value = result.summary }
  } catch (failure: any) { if (current === revision) error.value = failure.message || t('pages.loadFailedPleaseTryAgain') }
  finally { if (current === revision) loading.value = false }
}
async function download() {
  exporting.value = true
  try { await workbench.download('/influencers/export', 'influencer-domain-map.csv') }
  catch (failure: any) { error.value = failure.message || t('pages.loadFailedPleaseTryAgain') }
  finally { exporting.value = false }
}
function saved(result: { added: boolean; domain: string; influencer_name: string }) {
  editing.value = false
  notice.value = result
  emit('saved')
}
watch(search, () => { page.value = 1; revision++; searchReload.schedule() })
watch(() => props.refresh, load, { immediate: true })
onBeforeUnmount(() => { revision++ })
</script>
<template>
  <section class="panel" :aria-busy="loading">
    <div class="section-head">
      <div><h2>{{ t('influencer.creatorRelationshipTitle') }}</h2><p class="muted">{{ t('influencer.creatorRelationshipHint') }}</p></div>
      <div class="creator-directory-counts"><span><b>{{ summary.influencers }}</b> {{ t('influencer.creatorRelationshipInfluencers') }}</span><span><b>{{ domainCount }}</b> {{ t('influencer.creatorRelationshipWebsites') }}</span></div>
    </div>
    <p class="muted">{{ t('influencer.creatorRelationshipSource', { influencers: summary.influencers, websites: domainCount, date: sourceDate }) }}</p>
    <div class="toolbar creator-directory-toolbar">
      <input v-model="search" type="search" :aria-label="t('influencer.creatorRelationshipSearch')" :placeholder="t('influencer.creatorRelationshipSearch')" />
      <button type="button" @click="search = ''">{{ t('influencer.clear') }}</button>
      <div class="creator-directory-actions"><button v-if="can('create')" :disabled="loading || !!error || !summary.influencers" @click="editing = true">{{ t('influencer.creatorRelationshipAddWebsite') }}</button><button v-if="can('export')" :disabled="exporting" @click="download">{{ t('influencer.creatorRelationshipDownload') }}</button></div>
    </div>
    <p v-if="notice" class="creator-notice" role="status">{{ t(`influencer.${notice.added ? 'creatorRelationshipAdded' : 'creatorRelationshipAlreadyExists'}`, { domain: notice.domain, influencer: notice.influencer_name }) }}</p>
    <div v-if="error" class="error" role="alert">{{ localizePageMessage(error) }} <button @click="load">{{ t('pages.refresh') }}</button></div>
    <LoadingRegion :loading="loading"><div class="table-wrap"><table>
        <thead><tr><th>{{ t('influencer.creatorSalesInfluencer') }}</th><th>{{ t('influencer.creatorRelationshipTier') }}</th><th class="numeric">{{ t('influencer.creatorRelationshipWebsiteCount') }}</th><th>{{ t('influencer.creatorRelationshipWebsiteList') }}</th></tr></thead>
        <tbody><tr v-for="row in pageRows" :key="row.name"><td><strong>{{ row.name }}</strong></td><td><span class="creator-tier" :class="row.tier">{{ t(`influencer.${tierKey(row.tier)}`) }}</span></td><td class="numeric">{{ row.domains.length }}</td><td><div class="creator-websites"><a v-for="item in row.domains" :key="item.domain" :href="`https://${item.domain}`" target="_blank" rel="noopener noreferrer">{{ item.domain }}</a></div></td></tr><tr v-if="!pageRows.length"><td colspan="4" class="empty">{{ t('influencer.creatorRelationshipNoResults') }}</td></tr></tbody>
      </table></div>
      <ApiPagination v-model:page="page" v-model:size="size" :total="total" :loading="loading" @change="load" /></LoadingRegion>
    <AddWebsiteDialog v-if="editing" @close="editing = false" @saved="saved" />
  </section>
</template>
<style scoped>
.creator-directory-counts { display: flex; flex-wrap: wrap; gap: 10px; }
.creator-directory-counts span { padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; }
.creator-directory-toolbar input { width: min(420px, 100%); }
.creator-directory-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-left: auto; }
.creator-websites { display: flex; flex-wrap: wrap; gap: 6px; min-width: 300px; }
.creator-websites a { padding: 3px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel-2); text-decoration: none; }
.creator-tier {
  display: inline-block;
  border-radius: 20px;
  padding: 3px 10px;
  background: var(--creator-tier-background, var(--panel-2));
  color: var(--creator-tier-text, var(--muted));
  box-shadow: inset 0 0 0 1px var(--creator-tier-border, transparent);
  white-space: nowrap;
}
.creator-tier.top {
  background: var(--creator-tier-top-background, var(--workbench-action-background));
  color: var(--creator-tier-top-text, var(--workbench-green));
  box-shadow: inset 0 0 0 1px var(--creator-tier-top-border, transparent);
}
.creator-tier.mid {
  background: var(--creator-tier-mid-background, var(--workbench-button-background));
  color: var(--creator-tier-mid-text, var(--blue));
  box-shadow: inset 0 0 0 1px var(--creator-tier-mid-border, transparent);
}
.creator-notice { color: var(--workbench-green); }
</style>
