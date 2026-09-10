import { onBeforeUnmount } from 'vue'

/** 合并连续输入触发的查询；分页、手动刷新和保存成功时可取消等待并立即加载。 */
export function useDebouncedReload(reload: () => void, delay = 350) {
  let timer: ReturnType<typeof setTimeout> | undefined
  function cancel() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  function schedule() {
    cancel()
    timer = setTimeout(() => { timer = undefined; reload() }, delay)
  }
  onBeforeUnmount(cancel)
  return { schedule, cancel }
}
