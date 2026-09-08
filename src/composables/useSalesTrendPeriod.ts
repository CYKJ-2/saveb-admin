import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { businessDate } from '@/api/dashboard'

/** 趋势图独立选择月份或年份，不受订单列表的日期筛选限制。 */
export function useSalesTrendPeriod() {
  const today = businessDate()
  const granularity = ref<'day' | 'month'>('day')
  const month = ref(today.slice(0, 7))
  const year = ref(today.slice(0, 4))
  const trendPeriod = computed({
    get: () => granularity.value === 'day' ? month.value : year.value,
    set: (value: string) => {
      if (!value) return
      if (granularity.value === 'day') month.value = value
      else year.value = value
    },
  })
  const trendRange = computed(() => {
    const unit = granularity.value === 'day' ? 'month' : 'year'
    const anchor = dayjs(granularity.value === 'day' ? `${month.value}-01` : `${year.value}-01-01`)
    return {
      startDate: anchor.startOf(unit).format('YYYY-MM-DD'),
      endDate: anchor.endOf(unit).format('YYYY-MM-DD'),
    }
  })

  return { granularity, trendPeriod, trendRange }
}
