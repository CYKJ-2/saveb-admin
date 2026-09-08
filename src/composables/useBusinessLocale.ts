import { useI18n } from 'vue-i18n'

// API values stay unchanged. Only known business codes are translated for display.
export function useBusinessLocale() {
  const { t, locale } = useI18n()
  const keys: Record<string, string> = {
    completed: 'completed', pending: 'awaitingPayment', failed: 'failed2',
    refunded: 'refunded', reversed: 'reversed', chargeback: 'chargeback',
    cancelled: 'cancelled', unknown: 'unknownStatus', Unknown: 'unknown', Unassigned: 'unassigned',
    paid: 'paid', Paid: 'paid', unpaid: 'unpaid', Unpaid: 'unpaid',
    official: 'officialSites', top_influencer: 'topInfluencer',
    mid_influencer: 'midTierInfluencers', offline: 'paymentLinkOrders',
    invoice: 'invoiceOrders', unmatched: 'unmatched',
    create: 'create', update: 'edit', delete: 'delete',
  }
  function businessLabel(value: string) {
    return keys[value] ? t(`pages.${keys[value]}`) : value
  }
  function localizedField(row: Record<string, any>, field: 'title' | 'description') {
    const suffix = locale.value === 'en-US' ? 'en' : 'zh'
    return row[`${field}_${suffix}`] || row[`${field}_${suffix === 'en' ? 'zh' : 'en'}`] || ''
  }
  return { businessLabel, localizedField }
}
