import { request } from '@/utils/request'
export interface OrderProduct {
  name: string;
  url?: string;
  quantity?: number;
}
export interface OrderRow {
  id: number | string; kind: string; orderId: string; paypalOrderId: string; customerFullName: string;
  clientSite: string; classification: string; topInfluencer: string; recipientPaypal: string;
  paymentStatus: string; amount: number; amountUsd: number | null; currency: string; items: number;
  productName: string; products?: OrderProduct[]; createTime: string; date: string; staff: string; primaryStaffCode?: string; version: number;
  staffAllocations: { staffCode: string; shareRatio: number }[];
}
export interface Metric { key: string; orders: number; items: number; amountUsd: number; amountOriginal?: number; share: number; series?: Record<string, number>; orderSeries?: Record<string, number> }
export interface Totals { orders: number; items: number; amountUsd: number; missingRates: number }
export const orderManagementApi = {
  editorOptions: () => request.get<{ staff: string[] }>('/order-management/editor-options'),
  list: (params: Record<string, unknown>) => request.get<{ list: OrderRow[]; total: number; page: number; per_page: number; last_page: number }>('/order-management/orders', params),
  statistics: <T>(module: string, params: Record<string, unknown>) => request.get<T>(`/order-management/statistics/${module}`, params),
  export: (params: Record<string, unknown>) => request.get<Blob>('/order-management/export', params, { responseType: 'blob' }),
  adjust: (id: number | string, data: unknown) => request.put(`/order-management/orders/${id}/staff`, data),
}
