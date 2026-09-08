<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { useWorkbench } from '../shared/useWorkbench'
import SpreadsheetCard from './SpreadsheetCard.vue'
import '../shared/legacy.css'
import './operations.css'

interface Department { code: string; name_zh: string; name_en: string; count: number }
interface Directory { rows: Row[]; departments: Department[]; total: number; matched: number }
const { t, locale } = useI18n()
const { can, loading, error, run } = useWorkbench('operations')
const directory = ref<Directory>({ rows: [], departments: [], total: 0, matched: 0 })
const keyword = ref('')
const department = ref('')
const departmentName = (code: string) => {
  const item = directory.value.departments.find(item => item.code === code)
  return item ? locale.value === 'en-US' ? item.name_en : item.name_zh : code
}
const filtered = computed(() => {
  const query = keyword.value.trim().toLocaleLowerCase()
  return directory.value.rows.filter(row => {
    if (department.value && department.value !== row.department) return false
    const haystack = [row.title_zh, row.title_en, row.description_zh, row.description_en, row.provider, departmentName(row.department)].join(' ').toLocaleLowerCase()
    return !query || haystack.includes(query)
  })
})
const groups = computed(() => {
  const departments = new Map<string, Row[]>()
  for (const row of filtered.value) {
    const code = row.department || 'operations'
    if (!departments.has(code)) departments.set(code, [])
    departments.get(code)!.push(row)
  }
  return [...departments].map(([code, rows]) => ({ code, rows }))
})
function load() {
  if (can('list')) run(() => workbench.get<Directory>('/operations/directory'), data => directory.value = data)
}
onMounted(load)
</script>

<template>
  <main class="legacy-workbench operations-workbench">
    <header class="spreadsheet-directory-header">
      <div class="spreadsheet-directory-heading">
        <h1>{{ t('operations.spreadsheetDirectoryTitle') }}</h1>
        <nav class="spreadsheet-department-tabs" :aria-label="t('operations.spreadsheetDepartment')">
          <button class="spreadsheet-department-tab" :class="{ 'is-active': !department }" :aria-pressed="!department" @click="department = ''">{{ t('operations.spreadsheetAllDepartments') }} ({{ directory.total }})</button>
          <button v-for="item in directory.departments" :key="item.code" class="spreadsheet-department-tab" :class="{ 'is-active': department === item.code }" :aria-pressed="department === item.code" @click="department = item.code">{{ departmentName(item.code) }} ({{ item.count }})</button>
        </nav>
        <p>{{ t('operations.spreadsheetDirectoryHint') }}</p>
      </div>
      <div class="spreadsheet-directory-count" aria-live="polite"><b>{{ filtered.length }}</b><span>{{ t('operations.spreadsheetCountLabel') }}</span></div>
    </header>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }} <button @click="load">{{ t('pages.refresh') }}</button></p>
    <div class="spreadsheet-directory-toolbar">
      <label class="spreadsheet-directory-search"><input v-model="keyword" type="search" autocomplete="off" maxlength="255" :aria-label="t('operations.spreadsheetSearchPlaceholder')" :placeholder="t('operations.spreadsheetSearchPlaceholder')" /></label>
    </div>
    <p v-if="!can('list')" class="spreadsheet-directory-empty" role="status">{{ t('operations.accessDenied') }}</p>
    <p v-else-if="loading" class="spreadsheet-directory-empty" role="status">{{ t('pages.loading2') }}</p>
    <div v-else-if="groups.length" class="spreadsheet-directory-sections" aria-live="polite">
      <section v-for="group in groups" :key="group.code" class="spreadsheet-department-section" :aria-label="departmentName(group.code)">
        <div class="spreadsheet-department-heading"><h2>{{ departmentName(group.code) }}</h2><span>{{ group.rows.length }} {{ t('operations.spreadsheetCountLabel') }}</span></div>
        <div class="spreadsheet-card-grid"><SpreadsheetCard v-for="row in group.rows" :key="row.id" :row="row" :department="departmentName(group.code)" /></div>
      </section>
    </div>
    <p v-else class="spreadsheet-directory-empty" role="status">{{ t('operations.spreadsheetNoResults') }}</p>
  </main>
</template>
