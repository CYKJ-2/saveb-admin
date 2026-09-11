import { workbench } from './workbench'

export type PerformanceScope = 'all' | 'order' | 'invoice'
export interface PerformanceRange {
  staffCode: string
  startDate: string
  endDate: string
  scope: PerformanceScope
}
export interface PerformanceDay { date: string; sales: number; refunds: number; netSales: number }
export interface PerformanceSummary {
  sales: number
  refunds: number
  netSales: number
  commissionUsd: number
  /** 旧个人详情按日期、客户、订单总金额去重后的非退款单数。 */
  orders: number
  refundOrders: number
  /** 页面“总单数”沿用旧版，只含成交单，等于 orders。 */
  totalOrders: number
  refundRateOrders: number
  refundRateAmount: number
  missingRates: number
}
export interface PerformanceOrder {
  id: string
  kind: 'order' | 'invoice'
  date: string
  orderId: string
  customer: string
  phone: string
  channel: string
  paymentMethod: string
  account: string
  status: string
  refund: boolean
  orderAmount: number | null
  sharePercent: number
  myAmount: number | null
}
export interface PerformancePage {
  list: PerformanceOrder[]
  total: number
  page: number
  per_page: number
  last_page: number
}
export interface PerformanceReport {
  range: PerformanceRange
  summary: PerformanceSummary | null
  daily: PerformanceDay[]
  orders: PerformancePage
}
export interface PerformanceEmployee { code: string; name: string }

export const personalPerformance = {
  options: () => workbench.get<{ employees: PerformanceEmployee[]; defaultStaffCode: string }>('/sa-sales/personal/options'),
  report: (range: PerformanceRange, page = 1, size = 20, includeSummary = true) =>
    workbench.get<PerformanceReport>('/sa-sales/personal/report', { ...range, page, per_page: size, includeSummary: includeSummary ? 1 : 0 }),
}
