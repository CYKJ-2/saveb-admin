import { request } from '@/utils/request'
export const dashboardModules = ['overview', 'sales-trend', 'categories', 'influencers', 'staff', 'recent-orders'] as const
export type DashboardModule = typeof dashboardModules[number]
export interface DashboardRange { startDate: string; endDate: string }
export interface DashboardResult { range: DashboardRange; timezone: string; generatedAt: string; data: any }
export function getDashboardModule(module: DashboardModule, range: DashboardRange, granularity = 'day') {
  return request.get<DashboardResult>(`/dashboard/${module}`, { ...range, granularity })
}
export function businessDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
