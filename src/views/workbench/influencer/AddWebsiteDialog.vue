<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElDialog } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { workbench } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
const directory = ref<{ name: string }[]>([])
onMounted(async () => {
  try { directory.value = await workbench.get('/influencers/options'); influencer.value = directory.value[0]?.name ?? '' }
  catch (failure: any) { error.value = failure.message }
})
const emit = defineEmits<{ close: []; saved: [result: { added: boolean; domain: string; influencer_name: string }] }>()
const { t } = useI18n()
const influencer = ref('')
const domain = ref('')
const error = ref('')
const saving = ref(false)
async function save() {
  const normalized = domain.value.trim().toLowerCase().replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '').replace(/\.$/, '')
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) { error.value = t('influencer.creatorRelationshipInvalidDomain'); return }
  saving.value = true
  error.value = ''
  try { emit('saved', await workbench.post('/influencers/domains', { domain: normalized, influencer: influencer.value })) }
  catch (failure: any) { error.value = failure.message || t('pages.loadFailedPleaseTryAgain') }
  finally { saving.value = false }
}
</script>
<template>
  <ElDialog :model-value="true" :title="t('influencer.creatorRelationshipAddTitle')" width="520px" class="legacy-workbench creator-dialog" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" @update:model-value="emit('close')">
    <form class="creator-website-form" @submit.prevent="save">
      <label>{{ t('influencer.creatorRelationshipSelectInfluencer') }}<select v-model="influencer" required :disabled="saving"><option v-for="row in directory" :key="row.name" :value="row.name">{{ row.name }}</option></select></label>
      <label>{{ t('influencer.creatorRelationshipDomain') }}<input v-model="domain" required inputmode="url" autocomplete="off" :placeholder="t('influencer.creatorRelationshipDomainPlaceholder')" :disabled="saving" /></label>
      <div v-if="error" class="error" role="alert">{{ error === '请输入有效网站域名' ? t('influencer.creatorRelationshipInvalidDomain') : localizePageMessage(error) }}</div>
      <div class="creator-website-actions"><button type="button" :disabled="saving" @click="emit('close')">{{ t('pages.cancel') }}</button><button type="submit" class="primary" :disabled="saving || !influencer">{{ t('influencer.creatorRelationshipSave') }}</button></div>
    </form>
  </ElDialog>
</template>
<style>
.legacy-workbench.creator-dialog { min-height: 0; max-width: calc(100vw - 24px); }
.creator-website-form { display: grid; gap: 18px; }
.creator-website-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>
