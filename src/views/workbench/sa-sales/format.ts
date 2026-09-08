export const colors = ['#5aa9ff', '#2ed4a4', '#f6c85f', '#aa8cff', '#ff7685', '#62d3ef', '#ff9f5a', '#7bc96f', '#ed77c8', '#8ea6ff', '#44c2a8', '#d9b35c']

export function usd(value: unknown, locale: string, compact = false): string {
  return `US$${new Intl.NumberFormat(locale, compact
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

export function number(value: unknown, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value) || 0)
}

/** source 图中只展示销售额为正的前 12 个维度，占比按图中销售总额计算。 */
export function breakdownRows(rows: Record<string, any>[]) {
  const visible = rows.filter(row => Number(row.sales) > 0).slice(0, 12)
  const total = visible.reduce((sum, row) => sum + Number(row.sales), 0)
  return { total, rows: visible.map(row => ({ ...row, percent: total ? Number(row.sales) / total * 100 : 0 })) }
}
