/**
 * 图表主题色 - 深色/浅色自适应
 * 颜色取自 vben 风格 CSS 变量，确保与组件外观一致
 */
import { computed } from 'vue'
import { useAppStore } from '@/store/app'

export function useChartTheme() {
  const appStore = useAppStore()
  const isDark = computed(() => appStore.isDark)

  // 深色调色板与全局 deep-blue.css 保持一致；浅色配色沿用原值。
  const darkPalette = {
    text: '#eef4ff',
    subText: '#94a3b8',
    axisLine: '#334155',
    splitLine: '#243044',
    axisLabel: '#94a3b8',
    tooltipBg: 'rgba(13, 18, 27, 0.96)',
    tooltipText: '#eef4ff',
    title: '#eef4ff',
  }
  // 浅色调色板
  const lightPalette = {
    text: '#374151',
    subText: '#6b7280',
    axisLine: '#e0e6ed',
    splitLine: '#f0f2f5',
    axisLabel: '#606266',
    tooltipBg: 'rgba(255, 255, 255, 0.96)',
    tooltipText: '#1f2937',
    title: '#0f172a',
  }

  const palette = computed(() => (isDark.value ? darkPalette : lightPalette))

  /** 通用文本色 */
  const textColor = computed(() => palette.value.text)
  /** 次要文本色 */
  const subTextColor = computed(() => palette.value.subText)
  /** 轴线色 */
  const axisLineColor = computed(() => palette.value.axisLine)
  /** 分割线（虚线）颜色 */
  const splitLineColor = computed(() => palette.value.splitLine)
  /** 轴标签颜色 */
  const axisLabelColor = computed(() => palette.value.axisLabel)
  /** tooltip 背景色 */
  const tooltipBg = computed(() => palette.value.tooltipBg)
  /** tooltip 文字色 */
  const tooltipTextColor = computed(() => palette.value.tooltipText)
  /** 图表标题色 */
  const titleColor = computed(() => palette.value.title)

  /** tooltip 样式字符串（内联 style，用于 formatter 返回的 HTML） */
  const tooltipStyle = computed(
    () =>
      `background:${tooltipBg.value};color:${tooltipTextColor.value};border:1px solid ${palette.value.axisLine};border-radius:6px;`,
  )

  function tooltipFormatter(params: any, makeContent: (p: any) => string) {
    return `<div style="padding:8px 12px;${tooltipStyle.value}">${makeContent(params)}</div>`
  }

  /** grid 共享配置 */
  const gridBase = computed(() => ({
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true,
  }))

  /** xAxis 共享轴样式 */
  const xAxisBase = computed(() => ({
    type: 'category' as const,
    boundaryGap: false,
    axisLine: { lineStyle: { color: axisLineColor.value } },
    axisLabel: { color: axisLabelColor.value, fontSize: 11 },
    splitLine: { show: false },
  }))

  /** yAxis 共享轴样式 */
  const yAxisBase = computed(() => ({
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: splitLineColor.value, type: 'dashed' as const } },
    axisLabel: { color: axisLabelColor.value, fontSize: 11 },
  }))

  return {
    isDark,
    textColor,
    subTextColor,
    axisLineColor,
    splitLineColor,
    axisLabelColor,
    tooltipBg,
    tooltipTextColor,
    titleColor,
    tooltipStyle,
    tooltipFormatter,
    gridBase,
    xAxisBase,
    yAxisBase,
  }
}
