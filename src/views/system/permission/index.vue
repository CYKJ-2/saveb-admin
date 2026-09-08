<template>
  <div class="permission-page">
    <div class="page-header">
      <div>
        <h2>{{ t('system.permission.title') }}</h2>
        <p class="text-muted">{{ t('system.permission.pageSubtitle') }}</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-if="can('system.permission.create')">
          {{ t('system.permission.add') }}
        </el-button>
        <el-button :icon="Refresh" @click="loadData">{{ t('common.refresh') }}</el-button>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item :label="t('system.permission.field.code')">
          <el-input
            v-model="searchForm.code"
            :placeholder="t('system.permission.search.codePh')"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.name')">
          <el-input
            v-model="searchForm.name"
            :placeholder="t('system.permission.search.namePh')"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.type')">
          <el-select v-model="searchForm.type" :placeholder="t('common.viewAll')" clearable style="width: 140px">
            <el-option :label="t('system.permission.field.typeMenu')" value="menu" />
            <el-option :label="t('system.permission.field.typeAction')" value="action" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('system.permission.field.status')">
          <el-select v-model="searchForm.status" :placeholder="t('common.viewAll')" clearable style="width: 130px">
            <el-option :label="t('common.enable')" :value="1" />
            <el-option :label="t('common.disable')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 树形表格 -->
    <el-table
      v-loading="loading"
      :data="filteredTree"
      stripe
      border
      row-key="id"
      :tree-props="{ children: 'children' }"
      default-expand-all
    >
      <el-table-column :label="t('system.permission.field.name')" min-width="240">
        <template #default="{ row }">
          <span>{{ row.name_zh || row.name || row.code }}</span>
          <el-tag v-if="row.type === 'action'" size="small" type="success" style="margin-left: 8px">
            {{ t('system.permission.field.actionNode') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="code" :label="t('system.permission.field.code')" min-width="240" />
      <el-table-column :label="t('system.permission.field.type')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 'menu' ? 'primary' : 'success'">
            {{ row.type === 'menu' ? t('system.permission.field.typeMenu') : t('system.permission.field.typeAction') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.permission.field.action')" width="100">
        <template #default="{ row }">
          <span v-if="row.action">{{ row.action }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.permission.field.path')" min-width="160">
        <template #default="{ row }">
          <span>{{ row.path || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.permission.field.component')" min-width="180">
        <template #default="{ row }">
          <span>{{ row.component || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.permission.field.level')" width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('system.permission.field.status')" width="110">
        <template #default="{ row }">
          <el-switch
            v-model="row.statusBool"
            :loading="statusLoading[row.id]"
            :disabled="!can('system.permission.update')"
            inline-prompt
            :active-text="t('common.enable')"
            :inactive-text="t('common.disable')"
            @change="(val: any) => toggleStatus(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sort" :label="t('system.permission.field.sort')" width="80" />
      <el-table-column :label="t('common.operation')" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="can('system.permission.update')"
            type="primary"
            link
            size="small"
            @click="openEdit(row)"
          >
            {{ t('common.edit') }}
          </el-button>
          <el-button
            v-if="can('system.permission.create')"
            type="primary"
            link
            size="small"
            @click="openCreateChild(row)"
          >
            {{ t('system.permission.addChild') }}
          </el-button>
          <el-popconfirm
            :title="t('system.permission.confirmDelete', { name: row.name_zh || row.name || row.code })"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                v-if="can('system.permission.delete')"
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

    <!-- 新增 / 编辑抽屉 -->
    <el-drawer
      v-model="formDrawer.visible"
      :title="formDrawer.id ? t('system.permission.edit') : t('system.permission.add')"
      size="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item v-if="formDrawer.parentName" :label="t('system.permission.field.parent')">
          <span>{{ formDrawer.parentName }}</span>
        </el-form-item>
        <el-form-item :label="t('system.permission.field.code')" prop="code">
          <el-input v-model="form.code" :disabled="!!formDrawer.id" />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.name')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.nameZh')">
          <el-input v-model="form.name_zh" />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.type')" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="menu">{{ t('system.permission.field.typeMenu') }}</el-radio>
            <el-radio value="action">{{ t('system.permission.field.typeAction') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- menu 类型字段 -->
        <template v-if="form.type === 'menu'">
          <el-form-item :label="t('system.permission.field.path')">
            <el-input v-model="form.path" :placeholder="t('system.permission.placeholder.path')" />
          </el-form-item>
          <el-form-item :label="t('system.permission.field.component')">
            <el-input v-model="form.component" :placeholder="t('system.permission.placeholder.component')" />
          </el-form-item>
        </template>

        <!-- action 类型字段 -->
        <template v-if="form.type === 'action'">
          <el-form-item :label="t('system.permission.field.action')">
            <el-select v-model="form.action" :placeholder="t('common.viewAll')" clearable style="width: 100%">
              <el-option label="list"    value="list" />
              <el-option label="create"  value="create" />
              <el-option label="update"  value="update" />
              <el-option label="delete"  value="delete" />
              <el-option label="export"  value="export" />
              <el-option label="custom"  value="custom" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item :label="t('system.permission.field.sort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="t('system.permission.field.status')">
          <el-switch
            v-model="form.statusBool"
            inline-prompt
            :active-text="t('common.enable')"
            :inactive-text="t('common.disable')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDrawer.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="formDrawer.saving" @click="submitForm">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
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

interface PermissionNode {
  id: number
  parent_id: number
  code: string
  name: string
  name_zh?: string | null
  type: 'menu' | 'action'
  path?: string | null
  component?: string | null
  action?: string | null
  level: number
  sort: number
  status: number
  hidden?: boolean
  children?: PermissionNode[]
  // 非后端字段：UI 层 el-switch 的双向绑定标记。loadData 时由 buildTree
  // 注入，loadData 之后随新 row 一起出现，el-switch 切换时会即时反映。
  statusBool?: boolean
}

const loading = ref(false)
const tree = ref<PermissionNode[]>([])
/** 每行 status 切换的 loading 标记 */
const statusLoading = reactive<Record<number, boolean>>({})

const searchForm = reactive({
  code: '',
  name: '',
  type: '' as '' | 'menu' | 'action',
  status: undefined as number | undefined,
})

/** 把扁平节点列表组装成树。 */
function buildTree(flat: PermissionNode[]): PermissionNode[] {
  const map = new Map<number, PermissionNode>()
  const roots: PermissionNode[] = []
  // 注入 statusBool：el-switch 用 v-model 绑定此字段，切换会即时反映。
  for (const n of flat) {
    map.set(n.id, { ...n, statusBool: n.status === 1, children: [] })
  }
  for (const n of map.values()) {
    if (n.parent_id && map.has(n.parent_id)) {
      map.get(n.parent_id)!.children!.push(n)
    } else {
      roots.push(n)
    }
  }
  return roots
}

/** 在树上递归应用过滤条件（命中节点 + 命中节点的所有祖先都保留）。 */
function filterTree(nodes: PermissionNode[]): PermissionNode[] {
  const code = searchForm.code.trim().toLowerCase()
  const name = searchForm.name.trim().toLowerCase()
  const type = searchForm.type
  const status = searchForm.status

  function pass(n: PermissionNode): boolean {
    if (code && !(n.code || '').toLowerCase().includes(code)) return false
    if (name) {
      const hay = `${n.name || ''} ${n.name_zh || ''}`.toLowerCase()
      if (!hay.includes(name)) return false
    }
    if (type && n.type !== type) return false
    if (status !== undefined && n.status !== status) return false
    return true
  }

  function walk(n: PermissionNode): PermissionNode | null {
    const kids = (n.children || []).map(walk).filter(Boolean) as PermissionNode[]
    if (pass(n) || kids.length > 0) {
      return { ...n, children: kids }
    }
    return null
  }
  return nodes.map(walk).filter(Boolean) as PermissionNode[]
}

const filteredTree = computed(() => filterTree(tree.value))

async function loadData() {
  loading.value = true
  try {
    const list = await request.get<PermissionNode[]>('/permissions')
    tree.value = buildTree(Array.isArray(list) ? list : [])
  } catch (e) {
    console.error('load permissions failed', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 搜索是纯前端过滤（filteredTree 自动响应），无需重新请求
}

function handleReset() {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = undefined
}

/* ===== 切换 status ===== */
/**
 * 启用 / 禁用单个权限节点。
 *
 * 注意：禁用父节点时后端会级联禁用整棵子树（cascadeDisableDescendants）。
 * 前端这里弹一个二次确认，避免误操作；启用父节点不级联，所以不需要确认。
 * 操作完成后整体刷新权限树，让表格反映级联后的真实状态。
 *
 * el-switch 用 v-model="row.statusBool"，用户拖动后 statusBool 已经被组件
 * 内部改成期望值；这里以 statusBool 为准算出 next，避免依赖事件参数。
 */
async function toggleStatus(row: PermissionNode, _val: boolean | string | number) {
  if (!row?.id) return
  const next = row.statusBool ? 1 : 0
  if (next === row.status) {
    // 与当前一致 —— 多半是初始化或重渲产生的重复触发，不处理。
    return
  }

  // 仅对"禁用"操作做二次确认 —— 启用是显式动作，不会级联。
  if (next === 0) {
    try {
      await ElMessageBox.confirm(
        t('system.permission.tip.cascadeDisable'),
        t('common.confirm'),
        { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') }
      )
    } catch {
      // 用户取消 —— loadData() 重拉一次回滚 UI
      await loadData()
      return
    }
  }

  statusLoading[row.id] = true
  try {
    await request.put(`/permissions/${row.id}`, { status: next })
    ElMessage.success(t('system.permission.updated'))
    // 重新拉一次数据，让级联禁用后的子树在表格里同步呈现。
    // 这里一定要同步刷新 filteredTree 依赖的 tree.value（el-table 用的是 filteredTree）
    // —— 否则 el-switch 单向绑定的 :model-value 不会感知后端变更，UI 停留在旧状态。
    await loadData()
  } catch (e) {
    console.error(e)
    // 失败也回滚 —— 重新加载一次恢复服务端真实状态
    await loadData()
  } finally {
    delete statusLoading[row.id]
  }
}

/* ===== 增删改 ===== */
const formDrawer = reactive({
  visible: false,
  id: null as number | null,
  parentId: 0,
  parentName: '',
  saving: false,
})
const formRef = ref<FormInstance>()
const form = reactive({
  code: '',
  name: '',
  name_zh: '',
  type: 'menu' as 'menu' | 'action',
  parent_id: 0,
  path: '',
  component: '',
  action: '' as string,
  sort: 0,
  statusBool: true,
})

const formRules: FormRules = {
  code: [{ required: true, message: 'code required', trigger: 'blur' }],
  name: [{ required: true, message: 'name required', trigger: 'blur' }],
  type: [{ required: true, message: 'type required', trigger: 'change' }],
}

function resetForm() {
  form.code = ''
  form.name = ''
  form.name_zh = ''
  form.type = 'menu'
  form.parent_id = 0
  form.path = ''
  form.component = ''
  form.action = ''
  form.sort = 0
  form.statusBool = true
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  formDrawer.id = null
  formDrawer.parentId = 0
  formDrawer.parentName = ''
  formDrawer.visible = true
}

function openCreateChild(parent: PermissionNode) {
  resetForm()
  formDrawer.id = null
  formDrawer.parentId = parent.id
  formDrawer.parentName = parent.name_zh || parent.name || parent.code
  form.parent_id = parent.id
  // 子节点的 type 默认与父相同
  form.type = parent.type
  formDrawer.visible = true
}

function openEdit(row: PermissionNode) {
  resetForm()
  formDrawer.id = row.id
  formDrawer.parentId = row.parent_id
  formDrawer.parentName = ''
  formDrawer.visible = true
  // 直接用行内数据回填（之前已经载入过列表）
  form.code = row.code || ''
  form.name = row.name || ''
  form.name_zh = row.name_zh || ''
  form.type = row.type || 'menu'
  form.parent_id = row.parent_id || 0
  form.path = row.path || ''
  form.component = row.component || ''
  form.action = row.action || ''
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
    const base: any = {
      code: form.code,
      name: form.name,
      name_zh: form.name_zh || null,
      type: form.type,
      parent_id: form.parent_id,
      sort: form.sort,
      status: form.statusBool ? 1 : 0,
    }
    if (form.type === 'menu') {
      base.path = form.path || null
      base.component = form.component || null
    }
    if (form.type === 'action') {
      base.action = form.action || null
    }

    if (formDrawer.id) {
      // 编辑：code 不可改，剔除
      const payload = { ...base }
      delete payload.code
      await request.put(`/permissions/${formDrawer.id}`, payload)
      ElMessage.success(t('system.permission.updated'))
    } else {
      await request.post('/permissions', base)
      ElMessage.success(t('system.permission.created'))
    }
    formDrawer.visible = false
    await Promise.all([loadData(), userStore.fetchUserInfo()])
  } catch (e) {
    console.error(e)
  } finally {
    formDrawer.saving = false
  }
}

async function handleDelete(row: PermissionNode) {
  if (!row?.id) return
  try {
    await request.delete(`/permissions/${row.id}`)
    ElMessage.success(t('system.permission.deleted'))
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.permission-page {
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

.text-muted {
  color: hsl(var(--muted-foreground));
}
</style>
