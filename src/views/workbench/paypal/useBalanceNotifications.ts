import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { workbench, type Row } from '@/api/workbench'
import { accountName, suggestedThreshold } from './account'
import { money } from '../shared/useWorkbench'

export function useBalanceNotifications() {
  const { t } = useI18n()
  const supported = typeof Notification !== 'undefined'
  const enabled = ref(supported && Notification.permission === 'granted' && localStorage.getItem('paypalDesktopNotificationsEnabled') === '1')
  const notice = ref('')
  const aboveThreshold = new Map<number, boolean>()
  let scanning = false

  /** 通知也逐页读取，避免翻页后遗漏其他账号或恢复全量列表请求。 */
  async function refresh(includeExisting = false) {
    if (!enabled.value || scanning) return
    scanning = true
    try {
      let page = 1
      let lastPage = 1
      do {
        const result = await workbench.get('/paypal', { page, per_page: 100, sort: 'balance' })
        check(result.list, includeExisting)
        lastPage = result.last_page
        page++
      } while (page <= lastPage && enabled.value)
    } catch { notice.value = t('pages.loadFailedPleaseTryAgain') }
    finally { scanning = false }
  }

  function check(rows: Row[], includeExisting = false) {
    for (const row of rows) {
      const threshold = suggestedThreshold(row)
      const exceeded = Number(row.balance) >= threshold
      const previous = aboveThreshold.get(row.id)
      aboveThreshold.set(row.id, exceeded)
      if (!enabled.value || Notification.permission !== 'granted' || !exceeded || (!includeExisting && previous !== false)) continue
      try {
        new Notification(t('paypal.withdrawalThresholdAlertTitle'), {
          body: t('paypal.withdrawalThresholdAlertBody', { account: accountName(row.accountName) || row.email, balance: money(row.balance), threshold: money(threshold) }),
          tag: `paypal-balance-${row.id}`,
        })
      } catch { notice.value = t('paypal.desktopNotificationsDenied') }
    }
  }

  async function enable() {
    notice.value = ''
    if (!supported) { notice.value = t('paypal.desktopNotificationsDenied'); return }
    try {
      const permission = await Notification.requestPermission()
      enabled.value = permission === 'granted'
      if (!enabled.value) { notice.value = t('paypal.desktopNotificationsDenied'); return }
      localStorage.setItem('paypalDesktopNotificationsEnabled', '1')
      await refresh(true)
    } catch { notice.value = t('paypal.desktopNotificationsDenied') }
  }
  return { enabled, notice, check, enable, refresh }
}
