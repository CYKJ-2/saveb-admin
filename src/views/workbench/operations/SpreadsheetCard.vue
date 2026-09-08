<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBusinessLocale } from '@/composables/useBusinessLocale'
import type { Row } from '@/api/workbench'

defineProps<{ row: Row; department: string }>()
const { t } = useI18n()
const { localizedField } = useBusinessLocale()
</script>

<template>
  <article class="spreadsheet-entry-card">
    <div class="spreadsheet-entry-meta">
      <span class="spreadsheet-department-label">{{ department }}</span>
      <span class="spreadsheet-provider">{{ row.provider }}</span>
    </div>
    <h3 class="spreadsheet-directory-title">{{ localizedField(row, 'title') }}</h3>
    <p class="spreadsheet-entry-description">{{ localizedField(row, 'description') }}</p>
    <div class="spreadsheet-entry-actions">
      <a class="spreadsheet-open-link" :href="row.url" target="_blank" rel="noopener noreferrer" :aria-label="`${t('operations.spreadsheetOpen')} ${localizedField(row, 'title')}`">
        {{ t('operations.spreadsheetOpen') }} <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
</template>
