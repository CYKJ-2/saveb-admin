import type { Row } from '@/api/workbench'

const formKeys = [
  'order_date', 'customer_full_name', 'customer_email', 'recipient_paypal',
  'phone_number', 'country', 'address', 'invoice_link', 'amount_usd',
  'fixed_discount', 'percentage_discount', 'expedited_shipping', 'gift_box',
  'invoice_status',
] as const

/** 只回填实际识别出的字段，并保留用户在识别等待期间修改的内容。 */
export function applyInvoiceOcr(form: Row, result: Row, before: Row): number {
  const fields = { ...result.fields, invoice_status: result.fields?.invoice_status || result.paymentStatus }
  let count = 0
  for (const key of formKeys) {
    const value = fields[key]
    if (value === undefined || value === null || value === '' || form[key] !== before[key]) continue
    form[key] = value
    count++
  }
  if (Array.isArray(fields.items) && fields.items.length && form.items.length === before.items.length) {
    const remaining = [...before.items]
    form.items = fields.items.map((item: Row, index: number) => {
      let match = remaining.findIndex(previous =>
        (previous.description && previous.description === item.description)
        || (previous.product_name && previous.product_name === item.product_name))
      // 手工预填的空识别行按原版顺序对应，已经识别过的商品则按名称匹配。
      if (match < 0 && before.items[index] && (!before.items[index].product_name || before.items[index].description === '')) {
        match = remaining.indexOf(before.items[index])
      }
      const previous = match >= 0 ? remaining.splice(match, 1)[0] : undefined
      const mapped: Row = {
        product_name: previous?.product_name || item.product_name || '', description: item.description || '',
        quantity: item.quantity ?? 1, price: item.price ?? '',
        notes: previous?.notes || '',
        image_attachment_id: previous?.image_attachment_id || null,
      }
      if (previous) {
        const current = form.items[before.items.indexOf(previous)]
        for (const key of Object.keys(mapped)) {
          if (current[key] !== previous[key]) mapped[key] = current[key]
        }
        // 图片由上传或订单详情提供，OCR 重建商品行时必须连同当前附件一起保留。
        mapped.image = mapped.image_attachment_id ? current.image ?? null : null
      }
      return mapped
    })
    count += fields.items.length
  }
  return count
}

/** 汇率表 rate_to_usd 是一单位原币兑换的美元金额。 */
export function convertInvoiceCurrency(text: string, ratesToUsd: Row): string | null {
  const match = text.trim().match(/^(?:([\d,]+(?:\.\d+)?)\s*([a-z]{3})|([a-z]{3})\s*([\d,]+(?:\.\d+)?))$/i)
  if (!match) return null
  const amount = Number((match[1] || match[4]).replaceAll(',', ''))
  const currency = (match[2] || match[3]).toUpperCase()
  const rate = currency === 'USD' ? 1 : Number(ratesToUsd[currency])
  return Number.isFinite(amount) && amount > 0 && Number.isFinite(rate) && rate > 0
    ? (amount * rate).toFixed(2) : null
}
