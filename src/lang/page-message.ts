import i18n from '@/lang'
import zh from './modules/zh-CN/pages'
import en from './modules/en-US/pages'
import paypalZh from './modules/zh-CN/paypal'
import paypalEn from './modules/en-US/paypal'

// Localize known UI/server messages at display time, including errors already on screen.
// Unknown server messages are preserved so useful diagnostics are never hidden.
const messageKeys = new Map<string, string>()
function collectMessages(catalog: Record<string, unknown>, prefix = 'pages') {
  for (const [key, value] of Object.entries(catalog)) {
    if (typeof value === 'string' && !value.includes('{')) messageKeys.set(value, `${prefix}.${key}`)
    else if (value && typeof value === 'object') collectMessages(value as Record<string, unknown>, `${prefix}.${key}`)
  }
}
for (const catalog of [zh, en]) collectMessages(catalog)
for (const catalog of [paypalZh, paypalEn]) collectMessages(catalog, 'paypal')
export function localizePageMessage(message: string) {
  const key = messageKeys.get(message)
  return key ? i18n.global.t(key) : message
}
