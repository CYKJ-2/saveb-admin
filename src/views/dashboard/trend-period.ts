import dayjs from 'dayjs'
import type { DashboardRange } from '@/api/dashboard'

/** 首页日趋势默认展示整月，手动筛选后展示原区间；月趋势始终展示涉及的完整年份。 */
export function getDashboardTrendPeriod(
  selectedRange: DashboardRange,
  granularity: 'day' | 'month',
  hasCustomRange: boolean,
): { requestRange: DashboardRange; displayRange: DashboardRange } {
  if (granularity === 'month') {
    return {
      // 后端先校验原筛选区间，再按自然年统计，跨年筛选也不会触发区间过长错误。
      requestRange: { ...selectedRange },
      displayRange: {
        startDate: dayjs(selectedRange.startDate).startOf('year').format('YYYY-MM-DD'),
        endDate: dayjs(selectedRange.endDate).endOf('year').format('YYYY-MM-DD'),
      },
    }
  }

  const range = hasCustomRange ? { ...selectedRange } : {
    startDate: dayjs(selectedRange.startDate).startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs(selectedRange.startDate).endOf('month').format('YYYY-MM-DD'),
  }
  return { requestRange: range, displayRange: { ...range } }
}
