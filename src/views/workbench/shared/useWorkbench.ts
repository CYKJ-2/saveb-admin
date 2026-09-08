import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import i18n from '@/lang'
import { formatMoney } from '@/utils/money'
export function useWorkbench(module: string) {
  const user = useUserStore(); const loading = ref(false); const error = ref(''); let revision = 0
  const can = (action: string) => user.hasPermission(`business.${module}.${action}`)
  async function run<T>(load: () => Promise<T>, apply: (data: T) => void) {
    const current = ++revision; loading.value = true; error.value = ''
    try { const data = await load(); if (current === revision) apply(data) }
    catch (e: any) { if (current === revision) error.value = e.message || i18n.global.t('pages.loadFailedPleaseTryAgain') }
    finally { if (current === revision) loading.value = false }
  }
  return { can, loading, error, run }
}
export const money = (value: unknown) => formatMoney(value, i18n.global.locale.value)
