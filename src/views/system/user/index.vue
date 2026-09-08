<template>
  <div class="user-page">
    <div class="page-header">
      <div>
        <h2>{{ t('system.user.title') }}</h2>
        <p class="text-muted">{{ t('system.pageSubtitle') }}</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-if="can('system.user.create')">
          {{ t('system.user.add') }}
        </el-button>
        <el-button :icon="Refresh" @click="loadData">{{ t('common.refresh') }}</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item :label="t('system.user.search.username')">
          <el-input
            v-model="searchForm.username"
            :placeholder="t('system.user.search.usernamePh')"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('system.user.search.displayName')">
          <el-input
            v-model="searchForm.display_name"
            :placeholder="t('system.user.search.displayNamePh')"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('system.user.search.status')">
          <el-select v-model="searchForm.active" :placeholder="t('common.viewAll')" clearable style="width: 140px">
            <el-option :label="t('system.user.field.activeText')" :value="true" />
            <el-option :label="t('system.user.field.inactiveText')" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" stripe border>
      <el-table-column prop="id" :label="t('system.user.field.id')" width="80" />
      <el-table-column prop="username" :label="t('system.user.field.username')" min-width="160" />
      <el-table-column prop="display_name" :label="t('system.user.field.displayName')" min-width="160">
        <template #default="{ row }">
          <span>{{ row.display_name || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="staff_code" :label="t('system.user.field.staffCode')" width="140">
        <template #default="{ row }">
          <span>{{ row.staff_code || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.user.field.primaryRole')" width="160">
        <template #default="{ row }">
          <el-tag v-if="row.role" size="small" type="primary">
            {{ row.role.name_zh || row.role.name || row.role.code }}
          </el-tag>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.user.field.roles')" min-width="200">
        <template #default="{ row }">
          <template v-if="row.roles?.length">
            <el-tag
              v-for="r in row.roles"
              :key="r.id"
              size="small"
              type="info"
              effect="plain"
              style="margin-right: 4px"
            >
              {{ r.name_zh || r.name || r.code }}
            </el-tag>
          </template>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.user.field.active')" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="!!row.active"
            :loading="statusLoading[row.id]"
            :disabled="!can('system.user.update')"
            inline-prompt
            :active-text="t('system.user.field.activeText')"
            :inactive-text="t('system.user.field.inactiveText')"
            @change="(val: any) => toggleActive(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="created_at" :label="t('system.user.field.createdAt')" width="180">
        <template #default="{ row }">
          <span>{{ formatDate(row.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.operation')" width="260" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="can('system.user.update')"
            type="primary"
            link
            size="small"
            @click="openEdit(row)"
          >
            {{ t('common.edit') }}
          </el-button>
          <el-button
            v-if="can('system.user.update')"
            type="primary"
            link
            size="small"
            @click="openPassword(row)"
          >
            {{ t('system.user.field.password') }}
          </el-button>
          <el-button v-if="can('system.user.assign_role')" type="primary" link size="small" @click="openRoles(row)">分配角色</el-button>
          <el-popconfirm
            :title="t('system.user.confirmDelete', { name: row.username })"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                v-if="can('system.user.delete')"
                type="danger"
                link
                size="small"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <ApiPagination v-model:page="pagination.page" v-model:size="pagination.per_page" :total="pagination.total" :loading="loading" @change="loadData" />
    </div>

    <!-- 新增 / 编辑抽屉 -->
    <el-drawer
      v-model="formDrawer.visible"
      :title="formDrawer.id ? t('system.user.edit') : t('system.user.add')"
      size="480px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item :label="t('system.user.field.username')" prop="username">
          <el-input v-model="form.username" :disabled="!!formDrawer.id" />
        </el-form-item>
        <el-form-item
          v-if="!formDrawer.id"
          :label="t('system.user.field.password')"
          prop="password"
        >
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item
          v-if="!formDrawer.id"
          :label="t('system.user.field.confirmPassword')"
          prop="confirmPassword"
        >
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('system.user.field.displayName')">
          <el-input v-model="form.display_name" />
        </el-form-item>
        <el-form-item :label="t('system.user.field.staffCode')">
          <el-input v-model="form.staff_code" />
        </el-form-item>
        <el-form-item v-if="can('system.user.assign_role')" :label="t('system.user.field.roles')">
          <el-select v-model="form.role_ids" multiple style="width: 100%">
            <el-option
              v-for="r in allRoles"
              :key="r.id"
              :label="r.name_zh || r.name || r.code"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('system.user.field.active')">
          <el-switch v-model="form.active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="formDrawer.saving" @click="submitForm">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="roleDrawer.visible" title="分配角色" size="480px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item :label="t('system.user.field.username')">{{ roleDrawer.user?.username }}</el-form-item>
        <el-form-item :label="t('system.user.field.roles')">
          <el-select v-model="roleDrawer.ids" multiple style="width: 100%">
            <el-option v-for="role in allRoles" :key="role.id" :value="role.id" :label="role.name_zh || role.name || role.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="roleDrawer.saving" @click="saveRoles">{{ t('common.save') }}</el-button>
      </template>
    </el-drawer>

    <!-- 修改密码抽屉 -->
    <el-drawer
      v-model="passwordDrawer.visible"
      :title="t('system.user.field.password')"
      size="380px"
      destroy-on-close
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item :label="t('system.user.field.username')">
          <span>{{ passwordDrawer.user?.username }}</span>
        </el-form-item>
        <el-form-item :label="t('system.user.field.password')" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="passwordDrawer.saving" @click="submitPassword">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { request } from '@/utils/request'
import { useUserStore } from '@/store/user'

const { t } = useI18n()
const userStore = useUserStore()

/** 当前登录用户是否有指定权限 code。super_admin 直接通过。 */
function can(code: string): boolean {
  return userStore.isSuperAdmin || userStore.hasPermission(code)
}

const loading = ref(false)
const tableData = ref<any[]>([])
const allRoles = ref<any[]>([])
/** 每行 status 切换时的 loading 标记，避免重复点击 */
const statusLoading = reactive<Record<number, boolean>>({})

const searchForm = reactive({
  username: '',
  display_name: '',
  active: undefined as boolean | undefined,
})

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
})

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      per_page: pagination.per_page,
    }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.display_name) params.display_name = searchForm.display_name
    if (searchForm.active !== undefined) params.active = searchForm.active

    const data: any = await request.get('/users', params)
    // 后端返回：{ data: [...], meta: { current_page, per_page, total, last_page } }
    tableData.value = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    pagination.total = data?.total ?? data?.meta?.total ?? 0
    const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.per_page))
    if (pagination.page > lastPage) { pagination.page = lastPage; await loadData() }
  } catch (e) {
    console.error('load users failed', e)
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    const data: any = await request.get('/roles/all')
    allRoles.value = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  } catch (e) {
    console.error('load roles failed', e)
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.username = ''
  searchForm.display_name = ''
  searchForm.active = undefined
  handleSearch()
}

function formatDate(s: string | number) {
  if (!s) return '—'
  const d = new Date(typeof s === 'number' ? s * 1000 : s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ===== 新增 / 编辑 ===== */
const formDrawer = reactive({
  visible: false,
  id: 0 as number | null,
  saving: false,
})

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  display_name: '',
  staff_code: '',
  role_ids: [] as number[],
  active: true,
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '至少 6 位', trigger: 'blur' }],
  confirmPassword: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== form.password) callback(new Error('两次输入不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.confirmPassword = ''
  form.display_name = ''
  form.staff_code = ''
  form.role_ids = []
  form.active = true
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  formDrawer.id = null
  formDrawer.visible = true
}

async function openEdit(row: any) {
  resetForm()
  formDrawer.id = row.id
  formDrawer.visible = true
  try {
    const data: any = await request.get(`/users/${row.id}`)
    const u = data?.data ?? data
    form.username = u.username || ''
    form.display_name = u.display_name || ''
    form.staff_code = u.staff_code || ''
    form.active = !!u.active
    form.role_ids = [...new Set<number>([...(u.roles || []).map((r: any) => r.id), ...(u.role ? [u.role.id] : [])])]
  } catch (e) {
    console.error('load user failed', e)
  }
}

async function submitForm() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  formDrawer.saving = true
  try {
    if (formDrawer.id) {
      const payload: any = {
        display_name: form.display_name || null,
        staff_code: form.staff_code || null,
        active: form.active,
        ...(can('system.user.assign_role') ? { role_ids: form.role_ids } : {}),
      }
      await request.put(`/users/${formDrawer.id}`, payload)
      ElMessage.success(t('system.user.updated'))
    } else {
      const payload: any = {
        username: form.username,
        password: form.password,
        display_name: form.display_name || null,
        staff_code: form.staff_code || null,
        active: form.active,
        ...(can('system.user.assign_role') ? { role_ids: form.role_ids } : {}),
      }
      await request.post('/users', payload)
      ElMessage.success(t('system.user.created'))
    }
    formDrawer.visible = false
    await userStore.fetchUserInfo()
    loadData()
  } catch (e) {
    // request 拦截器已 toast 业务错误
    console.error(e)
  } finally {
    formDrawer.saving = false
  }
}

const roleDrawer = reactive({ visible: false, saving: false, user: null as any, ids: [] as number[] })
async function openRoles(row: any) {
  try {
    const data = await request.get(`/users/${row.id}/roles`)
    await loadRoles()
    roleDrawer.user = row
    roleDrawer.ids = [...new Set<number>([...(data.roles || []).map((r: any) => r.id), ...(data.primary_role ? [data.primary_role.id] : [])])]
    roleDrawer.visible = true
  } catch (error) { console.error(error) }
}
async function saveRoles() {
  roleDrawer.saving = true
  try {
    await request.put(`/users/${roleDrawer.user.id}/roles`, { role_ids: roleDrawer.ids })
    roleDrawer.visible = false
    await userStore.fetchUserInfo()
    await loadData()
    ElMessage.success(t('system.user.updated'))
  } finally { roleDrawer.saving = false }
}

/* ===== 修改密码 ===== */
const passwordDrawer = reactive({
  visible: false,
  user: null as any,
  saving: false,
})
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({ password: '' })
const passwordRules: FormRules = {
  password: [{ required: true, min: 6, message: '至少 6 位', trigger: 'blur' }],
}

function openPassword(row: any) {
  passwordDrawer.user = row
  passwordForm.password = ''
  passwordDrawer.visible = true
}

async function submitPassword() {
  try {
    await passwordFormRef.value?.validate()
  } catch {
    return
  }
  passwordDrawer.saving = true
  try {
    await request.post(`/users/${passwordDrawer.user.id}/password`, {
      password: passwordForm.password,
    })
    ElMessage.success(t('system.user.passwordChanged'))
    passwordDrawer.visible = false
  } catch (e) {
    console.error(e)
  } finally {
    passwordDrawer.saving = false
  }
}

/* ===== 删除 ===== */
async function handleDelete(row: any) {
  try {
    await request.delete(`/users/${row.id}`)
    ElMessage.success(t('system.user.deleted'))
    loadData()
  } catch (e) {
    console.error(e)
  }
}

/* ===== 切换用户 active ===== */
async function toggleActive(row: any, val: boolean | string | number) {
  if (!row?.id) return
  const next = !!val
  if (next === !!row.active) return
  statusLoading[row.id] = true
  try {
    await request.put(`/users/${row.id}`, { active: next })
    row.active = next
    ElMessage.success(t('system.user.updated'))
  } catch (e) {
    console.error(e)
    // 失败时回滚 UI：拿老值（已在响应拦截器 toast）
  } finally {
    delete statusLoading[row.id]
  }
}

onMounted(() => {
  if (can('system.user.assign_role')) loadRoles()
  loadData()
})
</script>

<style lang="scss" scoped>
.user-page {
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
}

.page-header {
  @include flex-between;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    color: hsl(var(--foreground));
    font-size: 18px;
    font-weight: 600;
  }

  .text-muted {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
    margin: 4px 0 0;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: hsl(var(--accent) / 0.4);
  border: 1px solid hsl(var(--border));
  border-radius: 6px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.pagination-wrapper {
  @include flex-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid hsl(var(--border));
}

.text-muted {
  color: hsl(var(--muted-foreground));
}
</style>
