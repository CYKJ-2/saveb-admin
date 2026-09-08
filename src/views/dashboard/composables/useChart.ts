/**
 * ECharts 封装
 * 参考 vue-vben-admin 的 useEcharts 实现
 *
 * 注意：ECharts 6 在实例 dispose 之后，浏览器仍可能在同一帧触发 window 'resize'，
 *      此时调用 chart.resize() 会抛 "Cannot read properties of undefined (reading 'isUnmounted')"。
 *      因此：
 *      1) 全局 resize 监听只在真正 init 之后才注册，避免卸载后回调泄漏
 *      2) resize 内先检查 isDisposed()
 *      3) dispose 中先 removeEventListener 再 dispose
 */
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue'
import { useChartTheme } from './useChartTheme'

export function useEcharts(chartRef: Ref<HTMLElement | undefined>) {
  const theme = useChartTheme()
  const chartInstance = shallowRef<echarts.ECharts | null>(null)
  const isInitialized = ref(false)
  let resizeHandler: (() => void) | null = null

  const isUsable = (): boolean => {
    if (!chartInstance.value) return false
    // ECharts 5+/6 都提供 isDisposed()；若没有则按 truthy 兜底
    const inst: any = chartInstance.value
    if (typeof inst.isDisposed === 'function') {
      return !inst.isDisposed()
    }
    return !!inst
  }

  /** 初始化 */
  const initChart = () => {
    if (!chartRef.value) return
    if (isUsable()) return
    chartInstance.value = echarts.init(chartRef.value)
    isInitialized.value = true

    // 仅在初始化之后才注册 resize，避免卸载后回调触发已 dispose 的实例
    if (!resizeHandler) {
      resizeHandler = () => {
        if (isUsable()) {
          try {
            chartInstance.value!.resize()
          } catch (_) {
            // 忽略 resize 期间抛出的 ECharts 内部状态异常（通常发生在 HMR / 路由快速切换）
          }
        }
      }
      window.addEventListener('resize', resizeHandler)
    }
  }

  /** 渲染配置 */
  const renderEcharts = (option: EChartsOption) => {
    if (!isUsable()) {
      initChart()
    }
    if (isUsable()) {
      // 为所有图表补齐浮层配色；各图表仍可覆盖自己的格式、内容和样式。
      const tooltipDefaults = {
        backgroundColor: theme.tooltipBg.value,
        borderColor: theme.axisLineColor.value,
        textStyle: { color: theme.tooltipTextColor.value },
      }
      const tooltip = Array.isArray(option.tooltip)
        ? option.tooltip.map(item => ({ ...tooltipDefaults, ...item }))
        : option.tooltip ? { ...tooltipDefaults, ...option.tooltip } : undefined
      chartInstance.value!.setOption({ ...option, ...(tooltip ? { tooltip } : {}) }, true)
    }
  }

  /** 手动自适应（外部触发） */
  const resize = () => {
    if (isUsable()) {
      try {
        chartInstance.value!.resize()
      } catch (_) {
        // ignore
      }
    }
  }

  /** 销毁 */
  const dispose = () => {
    // 先解绑监听，再 dispose 实例，避免最后一帧 resize 命中已 dispose 的图表
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    if (isUsable()) {
      try {
        chartInstance.value!.dispose()
      } catch (_) {
        // ignore
      }
    }
    chartInstance.value = null
    isInitialized.value = false
  }

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    chartInstance,
    isInitialized,
    initChart,
    renderEcharts,
    resize,
    dispose,
  }
}
