/** 金额统一显示两位小数；缺失值不当作零，订单数、比例和汇率使用各自的格式。 */
export function formatMoney(value: unknown, locale: string = 'en-US'): string {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return '—'
  if (typeof value !== 'number' && typeof value !== 'string') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount) < 0.005 ? 0 : amount)
}
