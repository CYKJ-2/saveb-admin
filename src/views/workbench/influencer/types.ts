export interface InfluencerSales {
  name: string
  amountUsd: number
  orders: number
  items: number
  sampleQuantity: number | null
  sampleValue: number | string | null
  commissionAmount: number | string | null
}

export interface InfluencerDirectory {
  name: string
  tier: 'top' | 'mid' | ''
  domains: { id: number | null; domain: string; confirmed: boolean; updatedAt: string | null }[]
}

export interface InfluencerReport {
  month: string
  list: InfluencerSales[]
  chart: InfluencerSales[]
  total: number
  page: number
  per_page: number
  totals: { amountUsd: number; orders: number; items: number }
  meta: { latestOrderAt: string | null; lastInfluencerOrderAt: string | null; queriedAt: string }
}
