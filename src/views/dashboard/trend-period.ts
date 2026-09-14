import dayjs from 'dayjs'
import type { DashboardRange } from '@/api/dashboard'

/** 首页日趋势展示筛选涉及的完整月份，月趋势展示涉及的完整年份。 */
export function getDashboardTrendPeriod(
  selectedRange: DashboardRange,
  granularity: 'day' | 'month',
): { requestRange: DashboardRange; displayRange: DashboardRange } {
  const unit = granularity === 'month' ? 'year' : 'month'
  const displayRange = {
    startDate: dayjs(selectedRange.startDate).startOf(unit).format('YYYY-MM-DD'),
    endDate: dayjs(selectedRange.endDate).endOf(unit).format('YYYY-MM-DD'),
  }
  // 日趋势直接请求整月数据，兼容尚未自动扩展月份的后端版本。
  // 扩展后超过接口 366 天限制时仍传原筛选区间，由后端校验后补齐月份。
  const requestFullMonths = granularity === 'day'
    && dayjs(displayRange.endDate).diff(dayjs(displayRange.startDate), 'day') <= 365
  return {
    requestRange: { ...(requestFullMonths ? displayRange : selectedRange) },
    displayRange,
  }
}
