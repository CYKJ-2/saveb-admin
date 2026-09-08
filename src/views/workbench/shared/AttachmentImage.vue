<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watch, onBeforeUnmount } from 'vue'
import { workbench } from '@/api/workbench'

const { t } = useI18n()
const props = defineProps<{ id?: number | null; thumbnail?: boolean }>()
const url = ref('')
const errorKey = ref('')
let revision = 0

async function load() {
  const current = ++revision
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
  errorKey.value = ''
  if (!props.id) return
  try {
    const blob = await workbench.blob(`/attachments/${props.id}`, undefined, true)
    if (current === revision) url.value = URL.createObjectURL(blob)
  } catch (error: any) {
    if (current !== revision) return
    errorKey.value = error.response?.status === 404 ? 'attachmentFileMissing'
      : error.response?.status === 403 ? 'attachmentAccessDenied'
        : error.response?.status === 409 ? 'attachmentIntegrityFailed' : 'attachmentUnavailable'
  }
}

watch(() => props.id, load, { immediate: true })
onBeforeUnmount(() => { revision++; if (url.value) URL.revokeObjectURL(url.value) })
</script>

<template>
  <a v-if="url && !errorKey" :href="url" target="_blank" rel="noopener">
    <img :src="url" :alt="t('pages.invoiceAttachmentPreview')" class="attachment-image" :class="{ thumbnail }" @error="errorKey = 'attachmentUnavailable'" />
  </a>
  <div v-else class="muted" role="status">
    <p>{{ errorKey ? t(`pages.${errorKey}`) : (id ? t('pages.loadingImage') : t('pages.notUploaded')) }}</p>
    <button v-if="errorKey" type="button" @click="load">{{ t('pages.retryImage') }}</button>
  </div>
</template>

<style scoped>
.attachment-image { max-width: 100%; max-height: 280px; border-radius: 8px; }
.attachment-image.thumbnail { width: 104px; height: 104px; object-fit: contain; border: 1px solid var(--line); background: var(--panel-2); cursor: zoom-in; }
</style>
