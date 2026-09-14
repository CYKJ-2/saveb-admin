import dayjs from 'dayjs'
import type { DashboardRange } from '@/api/dashboard'

/** 首页日趋势展示筛选涉及的完整月份，月趋势展示涉及的完整年份。 */
export function getDashboardTrendPeriod(
  selectedRange: DashboardRange,
  granularity: 'day' | 'month',
): { requestRange: DashboardRange; displayRange: DashboardRange } {
  const unit = granularity === 'month' ? 'year' : 'month'
  return {
    // 后端先校验原筛选区间，再扩展统计周期，避免补齐月份或年份后超过查询长度限制。
    requestRange: { ...selectedRange },
    displayRange: {
      startDate: dayjs(selectedRange.startDate).startOf(unit).format('YYYY-MM-DD'),
      endDate: dayjs(selectedRange.endDate).endOf(unit).format('YYYY-MM-DD'),
    },
  }
}
