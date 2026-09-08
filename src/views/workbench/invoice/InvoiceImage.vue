<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElImage } from 'element-plus'

interface InvoiceImageData { id?: number | null; src?: string | null; status?: string }
const props = defineProps<{ image?: InvoiceImageData | null; id?: number | null; thumbnail?: boolean }>()
const { t } = useI18n()
const failed = ref(false)
// 只显示详情接口返回的内嵌图片或刚上传文件的本地预览，不通过附件 ID 再发请求。
const src = computed(() => /^(data:image\/(png|jpeg|webp|gif);base64,|blob:)/.test(props.image?.src ?? '') ? props.image!.src! : '')
const errorKey = computed(() => {
  if (failed.value) return 'attachmentUnavailable'
  const keys: Record<string, string> = { missing: 'attachmentFileMissing', forbidden: 'attachmentAccessDenied', integrity_failed: 'attachmentIntegrityFailed', unavailable: 'attachmentUnavailable' }
  return keys[props.image?.status ?? ''] || (props.id ? 'attachmentUnavailable' : 'notUploaded')
})
watch(src, () => { failed.value = false })
</script>
<template>
  <ElImage v-if="src && !failed" :src="src" :preview-src-list="[src]" preview-teleported fit="contain" :alt="t('pages.invoiceAttachmentPreview')" class="invoice-image" :class="{ thumbnail }" @error="failed = true" />
  <p v-else class="muted" role="status">{{ t(`pages.${errorKey}`) }}</p>
</template>
<style scoped>
.invoice-image { width: 100%; height: 280px; max-width: 100%; border-radius: 8px; }
.invoice-image.thumbnail { width: 104px; height: 104px; object-fit: contain; border: 1px solid var(--line); background: var(--panel-2); cursor: zoom-in; }
</style>
