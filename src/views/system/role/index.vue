<template>
  <div class="role-page">
    <div class="page-header">
      <div>
        <h2>{{ t('system.role.title') }}</h2>
        <p class="text-muted">{{ t('system.pageSubtitle') }}</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-if="can('system.role.create')">
          {{ t('system.role.add') }}
        </el-button>
        <el-button :icon="Refresh" @click="loadData">{{ t('common.refresh') }}</el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item :label="t('system.role.search.keyword')">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="t('system.role.search.keywordPh')"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('system.role.search.status')">
          <el-select v-model="searchForm.status" :placeholder="t('common.viewAll')" clearable style="width: 140px">
            <el-option :label="t('system.role.field.enabled')" :value="1" />
            <el-option :label="t('system.role.field.disabled')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table v-loading="loading" :data="tableData" stripe border>
      <el-table-column prop="id" :label="t('system.role.field.id')" width="80" />
      <el-table-column prop="code" :label="t('system.role.field.code')" width="180" />
      <el-table-column :label="t('system.role.field.name')" min-width="180">
        <template #default="{ row }">
          <span>{{ row.name_zh || row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.role.field.nameZh')" min-width="160">
        <template #default="{ row }">
          <span>{{ row.name_zh || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.role.field.description')" min-width="200">
        <template #default="{ row }">
          <span>{{ row.description_zh || row.description || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.role.field.status')" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            :loading="statusLoading[row.id]"
            :disabled="(!can('system.role.update') && !userStore.isSuperAdmin) || !!row.is_system"
            inline-prompt
            :active-text="t('system.role.field.enabled')"
            :inactive-text="t('system.role.field.disabled')"
            @change="(val: any) => toggleStatus(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('system.role.field.isSystem')" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.is_system" size="small" type="warning">内置</el-tag>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" :label="t('system.role.field.sort')" width="80" />
      <el-table-column :label="t('common.operation')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="can('system.role.update') && !row.is_system"
            type="primary"
            link
            size="small"
            @click="openEdit(row)"
          >
            {{ t('common.edit') }}
          </el-button>
          <el-button
            v-if="can('system.role.assign_permission')"
            type="primary"
            link
            size="small"
            @click="openPermissions(row)"
          >
            {{ t('system.role.field.permissions') }}
          </el-button>
          <el-popconfirm
            :title="t('system.role.confirmDelete', { name: row.name_zh || row.name })"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                v-if="can('system.role.delete') && !row.is_system"
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

    <div class="pagination-wrapper">
      <ApiPagination v-model:page="pagination.page" v-model:size="pagination.per_page" :total="pagination.total" :loading="loading" @change="loadData" />
    </div>

    <!-- 新增 / 编辑抽屉 -->
    <el-drawer
      v-model="formDrawer.visible"
      :title="formDrawer.id ? t('system.role.edit') : t('system.role.add')"
      size="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item :label="t('system.role.field.code')" prop="code">
          <el-input v-model="form.code" :disabled="!!formDrawer.id" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.name')" prop="name">
          <el-input v-model="form.name" :disabled="formDrawer.isSystem" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.nameZh')">
          <el-input v-model="form.name_zh" :disabled="formDrawer.isSystem" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" :disabled="formDrawer.isSystem" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.description') + '(zh)'">
          <el-input v-model="form.description_zh" type="textarea" :rows="2" :disabled="formDrawer.isSystem" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.sort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" :disabled="formDrawer.isSystem" />
        </el-form-item>
        <el-form-item :label="t('system.role.field.status')">
          <el-switch
            v-model="form.statusBool"
            :disabled="formDrawer.isSystem"
            :active-text="t('system.role.field.enabled')"
            :inactive-text="t('system.role.field.disabled')"
          />
          <span v-if="formDrawer.isSystem" class="text-muted" style="margin-left: 8px; font-size: 12px;">内置角色不可修改</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="formDrawer.saving" @click="submitForm">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-drawer>

    <!-- 权限分配抽屉 -->
    <el-drawer
      v-model="permDrawer.visible"
      :title="t('system.role.field.permissions')"
      size="420px"
      destroy-on-close
    >
      <div class="perm-drawer-body">
        <p class="text-muted" style="margin: 0 0 12px">
          {{ permDrawer.role ? `${t('system.role.field.name')}: ${permDrawer.role.name_zh || permDrawer.role.name}` : '' }}
        </p>
        <el-input v-model="permFilter" :placeholder="t('common.search')" clearable style="margin-bottom: 12px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-tree
          ref="permTreeRef"
          :data="permissionTree"
          :props="{ label: permissionLabel, children: 'children' }"
          show-checkbox
          node-key="id"
          default-expand-all
          :check-strictly="false"
          :filter-node-method="filterPermissionNode"
        >
          <template #default="{ node, data }">
            <span class="perm-tree-node">
              <el-tag
                size="small"
                :type="data.type === 'menu' ? 'primary' : 'success'"
                effect="plain"
                style="margin-right: 6px"
              >
                {{ data.type === 'menu' ? t('system.permission.field.typeMenu') : t('system.permission.field.typeAction') }}
              </el-tag>
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
        <p class="perm-tree-tip text-muted">
          <el-icon><InfoFilled /></el-icon>
          <span>
            {{ t('system.role.tip.actionIncluded') }}
          </span>
        </p>
      </div>
      <template #footer>
        <el-button @click="permDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="permDrawer.saving" @click="submitPermissions">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { request } from '@/utils/request'
import { useUserStore } from '@/store/user'
import { restorePermissionChecks } from './permission-tree'
import { permissionName } from '@/utils/permission-name'

const { t, locale } = useI18n()
const userStore = useUserStore()

function can(code: string): boolean {
  return userStore.isSuperAdmin || userStore.hasPermission(code)
}

const loading = ref(false)
const tableData = ref<any[]>([])
/** 每行 status 切换时的 loading 标记 */
const statusLoading = reactive<Record<number, boolean>>({})

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined,
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
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status !== undefined) params.status = searchForm.status

    const data: any = await request.get('/roles', params)
    // 后端 RoleController::index 返回 { data: { list, total, page, per_page } }
    const payload = data?.data ?? data
    tableData.value = Array.isArray(payload?.list)
      ? payload.list
      : Array.isArray(payload)
      ? payload
      : []
    pagination.total = payload?.total ?? tableData.value.length
    const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.per_page))
    if (pagination.page > lastPage) { pagination.page = lastPage; await loadData() }
  } catch (e) {
    console.error('load roles failed', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = undefined
  handleSearch()
}

/* ===== 新增 / 编辑 ===== */
const formDrawer = reactive({
  visible: false,
  id: null as number | null,
  saving: false,
  isSystem: false, // 当前编辑的角色是不是 is_system=true（内置角色）
})
const formRef = ref<FormInstance>()
const form = reactive({
  code: '',
  name: '',
  name_zh: '',
  description: '',
  description_zh: '',
  sort: 0,
  statusBool: true,
})

const formRules: FormRules = {
  code: [{ required: true, message: '请输入 code', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

function resetForm() {
  form.code = ''
  form.name = ''
  form.name_zh = ''
  form.description = ''
  form.description_zh = ''
  form.sort = 0
  form.statusBool = true
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  formDrawer.id = null
  formDrawer.isSystem = false
  formDrawer.visible = true
}

function openEdit(row: any) {
  resetForm()
  formDrawer.id = row.id
  formDrawer.isSystem = !!row.is_system
  formDrawer.visible = true
  form.code = row.code || ''
  form.name = row.name || ''
  form.name_zh = row.name_zh || ''
  form.description = row.description || ''
  form.description_zh = row.description_zh || ''
  form.sort = row.sort || 0
  form.statusBool = row.status === 1
}

async function submitForm() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  formDrawer.saving = true
  try {
    const payload: any = {
      name: form.name,
      name_zh: form.name_zh || null,
      description: form.description || null,
      description_zh: form.description_zh || null,
      sort: form.sort,
      status: form.statusBool ? 1 : 0,
    }
    if (formDrawer.id) {
      await request.put(`/roles/${formDrawer.id}`, payload)
      ElMessage.success(t('system.role.updated'))
    } else {
      payload.code = form.code
      await request.post('/roles', payload)
      ElMessage.success(t('system.role.created'))
    }
    formDrawer.visible = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    formDrawer.saving = false
  }
}

/* ===== 权限分配 ===== */
const permDrawer = reactive({ visible: false, role: null as any, saving: false })
const permFilter = ref('')
const permissionTree = ref<any[]>([])
const checkedKeys = ref<number[]>([])
const permTreeRef = ref<any>()

async function loadPermissionTree() {
  try {
    const data: any = await request.get('/permissions/tree')
    const tree = data?.data ?? data
    permissionTree.value = decorate(tree)
  } catch (e) {
    console.error('load permission tree failed', e)
    throw e
  }
}

/**
 * 把后端权限树改造成 el-tree 友好的形状。
 *
 * 同时保留菜单节点（type=menu）和按钮级权限点（type=action）。
 * - 菜单节点保留 children 关系（递归）
 * - action 节点是叶子，附带 type 字段供前端打 label tag 使用
 * - 保留停用节点并提示状态，避免保存角色时静默丢失原有关联。
 */
function decorate(nodes: any[] | undefined): any[] {
  if (!nodes || !nodes.length) return []
  return nodes
    .map((n) => {
      const base: any = {
        id: n.id,
        code: n.code,
        name: n.name,
        name_zh: n.name_zh,
        type: n.type,
        status: n.status,
      }
      if (n.type === 'menu') {
        const kids = decorate(n.children)
        if (kids.length) base.children = kids
      }
      return base
    })
}

function permissionLabel(data: any): string {
  const name = permissionName(data, locale.value)
  return data.status === 1 ? name : `${name} (${t('system.role.field.disabled')})`
}

function filterPermissionNode(value: string, data: any) {
  if (!value) return true
  const v = value.toLowerCase()
  return (
    (data.name || '').toLowerCase().includes(v) ||
    (data.name_zh || '').toLowerCase().includes(v) ||
    (data.code || '').toLowerCase().includes(v)
  )
}

watch(permFilter, (val) => {
  permTreeRef.value?.filter(val)
})

async function openPermissions(row: any) {
  permDrawer.role = row
  permDrawer.visible = false
  checkedKeys.value = []
  permissionTree.value = []
  permFilter.value = ''
  // 拉取角色详情（带 permissions）
  try {
    await loadPermissionTree()
    const data: any = await request.get(`/roles/${row.id}/assignments`)
    const role = data?.data ?? data
    checkedKeys.value = Array.isArray(role.permissions) ? role.permissions : []
    permDrawer.visible = true
    await nextTick()
    if (permTreeRef.value) restorePermissionChecks(permTreeRef.value, permissionTree.value, checkedKeys.value)
  } catch (e) {
    console.error('load role permissions failed', e)
  }
}

async function submitPermissions() {
  if (!permDrawer.role) return
  permDrawer.saving = true
  try {
    const checkedIds: number[] = permTreeRef.value?.getCheckedKeys() ?? []
    await request.put(`/roles/${permDrawer.role.id}/permissions`, {
      permission_ids: checkedIds,
    })
    await userStore.fetchUserInfo()
    ElMessage.success(t('system.role.permissionsAssigned'))
    permDrawer.visible = false
  } catch (e) {
    console.error(e)
  } finally {
    permDrawer.saving = false
  }
}

/* ===== 删除 ===== */
async function handleDelete(row: any) {
  try {
    await request.delete(`/roles/${row.id}`)
    ElMessage.success(t('system.role.deleted'))
    loadData()
  } catch (e) {
    console.error(e)
  }
}

/* ===== 切换角色 status ===== */
async function toggleStatus(row: any, val: boolean | string | number) {
  if (!row?.id || row.is_system) return
  const next = !!val ? 1 : 0
  if (next === row.status) return
  statusLoading[row.id] = true
  try {
    await request.put(`/roles/${row.id}`, { status: next })
    row.status = next
    ElMessage.success(t('system.role.updated'))
  } catch (e) {
    console.error(e)
  } finally {
    delete statusLoading[row.id]
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.role-page {
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

.perm-drawer-body {
  padding: 0 4px;
}

.perm-tree-node {
  display: inline-flex;
  align-items: center;
  line-height: 1.4;
}

.perm-tree-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));

  .el-icon {
    font-size: 14px;
  }
}
</style>
