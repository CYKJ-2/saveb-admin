import { reactive, ref } from 'vue'
import type { Row } from '@/api/workbench'

export interface DetailFilters {
  startDate: string
  endDate: string
  classification: string
  customerService: string
  orderStatus: string
  orderId: string
  customerName: string
  paypalAccount: string
  website: string
}

export interface DetailResult {
  list: Row[]
  total: number
  totalAmount: number
  page: number
  per_page: number
}

type FetchOrders = (params: DetailFilters & { page: number; per_page: number }) => Promise<DetailResult>

/** 将编辑中的条件与已查询条件分开，翻页不会提交尚未确认的表单修改。 */
export function useOrderDetails(initialRange: { startDate: string; endDate: string }, fetchOrders: FetchOrders) {
  const defaults = (): DetailFilters => ({
    ...initialRange,
    classification: '', customerService: '', orderStatus: '', orderId: '',
    customerName: '', paypalAccount: '', website: '',
  })
  const filters = reactive(defaults())
  const result = ref<DetailResult | null>(null)
  const pageSize = ref(20)
  const loading = ref(false)
  const error = ref('')
  const queried = ref(false)
  let applied: DetailFilters | null = null
  let revision = 0

  async function loadPage(page: number) {
    if (!applied) return
    const current = ++revision
    loading.value = true
    error.value = ''
    result.value = null
    try {
      const data = await fetchOrders({ ...applied, page, per_page: pageSize.value })
      if (current === revision) result.value = data
    } catch (cause: unknown) {
      if (current === revision) error.value = cause instanceof Error ? cause.message : 'pages.loadFailedPleaseTryAgain'
    } finally {
      if (current === revision) loading.value = false
    }
  }

  async function query() {
    const snapshot = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value.trim()])) as DetailFilters
    if (!!snapshot.startDate !== !!snapshot.endDate || snapshot.startDate > snapshot.endDate) {
      error.value = 'pages.saInvalidRange'
      return
    }
    applied = snapshot
    queried.value = true
    await loadPage(1)
  }

  function invalidate() {
    revision++
    loading.value = false
  }

  function reset() {
    invalidate()
    Object.assign(filters, defaults())
    applied = null
    result.value = null
    error.value = ''
    queried.value = false
  }

  return { filters, result, pageSize, loading, error, queried, query, loadPage, reset, invalidate }
}
