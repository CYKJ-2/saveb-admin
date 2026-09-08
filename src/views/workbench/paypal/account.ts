import type { Row } from '@/api/workbench'

// Match the original page: retain the Chinese account name without duplicate English suffixes.
export function accountName(value: unknown): string {
  const text = String(value || '').trim()
  if (!/[\u3400-\u9fff]/.test(text)) return text
  const company = text.match(/^([\s\S]*?[\u3400-\u9fff](?:有限公司|有限责任公司|商贸行（个体工商户）|商贸行\(个体工商户\)|商贸行))(?=\s+\d+\s*[-–—]\s*[A-Za-z]|\s+[A-Za-z]|$)/)
  return company?.[1]?.trim() || text
    .replace(/\s+\d+\s*[-–—]\s*[A-Za-z][\s\S]*$/u, '')
    .replace(/\s+[A-Z][A-Za-zÀ-ž]+(?:\s+[A-Z][A-Za-zÀ-ž]+)*\s*[-–—]\s*[A-Z][\s\S]*$/u, '')
    .replace(/\s+[A-Za-zÀ-ž][A-Za-zÀ-ž\s.,&'-]*$/u, '').trim()
}

export function suggestedThreshold(row: Row): number {
  const identity = String(row.accountName || '').replace(/[–—]/g, '-').replace(/\s+/g, '')
  if (identity === '364-王宝财-贵州浦垚贸易有限公司' || accountName(row.accountName) === '王宝财') return 5000
  return Math.min(5000, 2000 + Number(row.reviews || 0) * 1000)
}
