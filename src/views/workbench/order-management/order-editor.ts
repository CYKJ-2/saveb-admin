import type { OrderRow } from '@/api/order-management'

export interface Allocation {
  staffCode: string
  percent: number | undefined
}

export function staffCodes(values: string[]): string[] {
  return [...new Set(values.flatMap(value => value.toUpperCase().split(/[,，+\/|;；、]+/)).map(code => code.trim()).filter(Boolean))]
}

/** 用整数百分位分配余数，三人等分等情况也精确合计 100%。 */
export function equalAllocations(codes: string[]): Allocation[] {
  if (!codes.length) return []
  const cents = Math.floor(10000 / codes.length)
  return codes.map((staffCode, index) => ({
    staffCode,
    percent: (index === codes.length - 1 ? 10000 - cents * index : cents) / 100,
  }))
}

export function allocationTotal(rows: Allocation[]): number {
  return rows.reduce((sum, row) => sum + (Number.isFinite(row.percent) ? Math.round(row.percent! * 100) : 0), 0) / 100
}

export function validAllocations(primary: string, rows: Allocation[]): boolean {
  return !!primary && rows.length > 0 && rows.length <= 20
    && new Set(rows.map(row => row.staffCode)).size === rows.length
    && rows.some(row => row.staffCode === primary)
    && rows.every(row => !!row.staffCode && Number.isFinite(row.percent) && row.percent! > 0 && row.percent! <= 100)
    && allocationTotal(rows) === 100
}

/** 优先保留已有比例，只将两位小数的舍入余数补到最后一人。 */
export function initialAllocations(order: OrderRow, primary: string): Allocation[] {
  const codes = staffCodes([primary, ...order.staffAllocations.map(row => row.staffCode)])
  const shares = new Map(order.staffAllocations.map(row => [row.staffCode.toUpperCase().trim(), row.shareRatio]))
  const rows = codes.map(staffCode => ({ staffCode, percent: Math.round((shares.get(staffCode) || 0) * 10000) / 100 }))
  if (rows.length && rows.every(row => row.percent > 0)) {
    rows[rows.length - 1]!.percent = Math.round((rows[rows.length - 1]!.percent + 100 - allocationTotal(rows)) * 100) / 100
    if (validAllocations(primary, rows)) return rows
  }
  return equalAllocations(codes)
}

/** 新主客服接替原主客服的分成；若已参与协同则合并比例，其他客服保持不变。 */
export function replacePrimaryAllocation(rows: Allocation[], previous: string, next: string): Allocation[] {
  if (previous === next) return rows.map(row => ({ ...row }))
  if (!rows.length) return equalAllocations([next])

  const outgoing = rows.find(row => row.staffCode === previous)
  const incoming = rows.find(row => row.staffCode === next)
  let percent = outgoing?.percent ?? incoming?.percent
  if (outgoing && incoming) {
    percent = Number.isFinite(outgoing.percent) && Number.isFinite(incoming.percent)
      ? (Math.round(outgoing.percent! * 100) + Math.round(incoming.percent! * 100)) / 100
      : undefined
  }

  return [
    { staffCode: next, percent },
    ...rows.filter(row => row.staffCode !== previous && row.staffCode !== next).map(row => ({ ...row })),
  ]
}

export function adjustmentPayload(order: OrderRow, primary: string, rows: Allocation[]) {
  return {
    version: order.version,
    primaryStaffCode: primary,
    staffAllocations: rows.map(row => ({ ...row })),
    ...(order.paymentStatus === 'pending' ? { targetStatus: 'completed' } : {}),
  }
}
