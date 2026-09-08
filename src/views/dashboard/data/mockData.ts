/**
 * 仪表盘假数据
 * 数据结构参考 saveb-source/dashboard 下的 JSON 文件
 */

/** 月度销售趋势 */
export const monthlySales = [
  { key: '2026-01', main: 198, influencer: 778, offline: 0, invoice: 0,
    mainSales: 75272.5, influencerSales: 325307.43, offlineSales: 0, invoiceSales: 0 },
  { key: '2026-02', main: 201, influencer: 664, offline: 0, invoice: 0,
    mainSales: 85391.53, influencerSales: 277469.23, offlineSales: 0, invoiceSales: 0 },
  { key: '2026-03', main: 183, influencer: 801, offline: 0, invoice: 0,
    mainSales: 86758.12, influencerSales: 320982.28, offlineSales: 0, invoiceSales: 0 },
  { key: '2026-04', main: 158, influencer: 747, offline: 582, invoice: 0,
    mainSales: 59599.22, influencerSales: 308454.14, offlineSales: 234473.74, invoiceSales: 0 },
  { key: '2026-05', main: 224, influencer: 911, offline: 559, invoice: 0,
    mainSales: 84457.77, influencerSales: 373301.31, offlineSales: 260914.25, invoiceSales: 0 },
  { key: '2026-06', main: 182, influencer: 548, offline: 679, invoice: 0,
    mainSales: 87981.83, influencerSales: 219711.62, offlineSales: 358269.94, invoiceSales: 0 },
  { key: '2026-07', main: 163, influencer: 101, offline: 737, invoice: 298,
    mainSales: 82711.22, influencerSales: 43506.44, offlineSales: 332261.31, invoiceSales: 107547.78 }
]

/** 每日销售趋势 (2026-07) */
export const dailySales = [
  { key: '2026-07-01', main: 3, influencer: 7, offline: 33, invoice: 17,
    mainSales: 1575, influencerSales: 3022.32, offlineSales: 15001.4, invoiceSales: 6515.17 },
  { key: '2026-07-02', main: 1, influencer: 16, offline: 22, invoice: 12,
    mainSales: 715.63, influencerSales: 5771.67, offlineSales: 10247.62, invoiceSales: 3157.2 },
  { key: '2026-07-03', main: 8, influencer: 18, offline: 18, invoice: 8,
    mainSales: 4237.42, influencerSales: 9391.94, offlineSales: 8150.97, invoiceSales: 2408.96 },
  { key: '2026-07-04', main: 13, influencer: 15, offline: 39, invoice: 12,
    mainSales: 8414.69, influencerSales: 6306.1, offlineSales: 17336.29, invoiceSales: 2154.95 },
  { key: '2026-07-05', main: 12, influencer: 12, offline: 33, invoice: 10,
    mainSales: 9411.82, influencerSales: 7429.85, offlineSales: 18274.2, invoiceSales: 4527.9 },
  { key: '2026-07-06', main: 5, influencer: 9, offline: 28, invoice: 11,
    mainSales: 3142.18, influencerSales: 4128.5, offlineSales: 12015.8, invoiceSales: 3284.6 },
  { key: '2026-07-07', main: 7, influencer: 14, offline: 31, invoice: 9,
    mainSales: 5218.42, influencerSales: 6105.32, offlineSales: 14852.7, invoiceSales: 2814.2 }
]

/** 订单来源分类 */
export const orderCategories = [
  { name: 'Official Sites', orders: 3, items: 5, usd: 1835, color: '#5B8FF9' },
  { name: 'Top Influencers', orders: 3, items: 3, usd: 977, color: '#5AD8A6' },
  { name: 'Offline Orders', orders: 17, items: 36, usd: 6833.8, color: '#F6BD16' },
  { name: 'Invoice Orders', orders: 12, items: 18, usd: 4521.5, color: '#E86452' }
]

/** 支付状态 */
export const paymentStatus = {
  Completed: 23,
  Pending: 33,
  Failed: 5
}

/** 员工业绩排行 */
export const staffRanking = [
  { name: 'SJF', orders: 2, items: 3, usd: 1016, rank: 1 },
  { name: 'LMJ', orders: 1, items: 1, usd: 649, rank: 2 },
  { name: 'YJW', orders: 2, items: 6, usd: 554.78, rank: 3 },
  { name: 'SJF', orders: 2, items: 3, usd: 518.1, rank: 4 },
  { name: 'WJL', orders: 1, items: 1, usd: 359, rank: 5 },
  { name: 'LHQ', orders: 1, items: 2, usd: 312.4, rank: 6 },
  { name: 'ZYC', orders: 1, items: 1, usd: 287.2, rank: 7 }
]

/** KOL 月度排行 */
export const influencerRanking = [
  { name: 'David Coey', orders: 323, items: 538, sales: 157185.48 },
  { name: 'Erika Turner', orders: 74, items: 115, sales: 28634.38 },
  { name: 'Lindsey Ambrosino', orders: 41, items: 59, sales: 18306.41 },
  { name: 'Jennifer Yaques', orders: 27, items: 65, sales: 14452.85 },
  { name: 'Stephanie Courchesne', orders: 45, items: 57, sales: 14403.53 },
  { name: 'LaWanda Heard', orders: 38, items: 42, sales: 10025.05 },
  { name: 'Amanda Heinemeyer', orders: 27, items: 38, sales: 8967.43 },
  { name: 'Taylor Brooke', orders: 17, items: 32, sales: 7175.47 },
  { name: 'Alli Mashman', orders: 16, items: 27, sales: 6862.3 },
  { name: 'Sarah Johnson', orders: 14, items: 22, sales: 5821.4 }
]

/** 最近订单 */
export const recentOrders = [
  { orderId: '260718171420532', clientOrderId: '3893', customer: 'Sharis Shirinian',
    site: 'saveb-love.co', category: 'Official Sites', staff: '',
    amount: 1317, currency: 'USD', items: 3,
    createTime: '26-07-18 17:14', paymentStatus: 'Completed' },
  { orderId: '260718160646565', clientOrderId: '5173', customer: 'Loan Nguyen',
    site: 'saveb-link.cc', category: 'Offline Orders', staff: 'SJF',
    amount: 359.1, currency: 'USD', items: 2,
    createTime: '26-07-18 16:07', paymentStatus: 'Completed' },
  { orderId: '260718153022188', clientOrderId: '4298', customer: 'Emily Watson',
    site: 'saveb-style.com', category: 'Top Influencers', staff: 'LMJ',
    amount: 649, currency: 'USD', items: 1,
    createTime: '26-07-18 15:30', paymentStatus: 'Completed' },
  { orderId: '260718141158432', clientOrderId: '3872', customer: 'Michael Chen',
    site: 'saveb-store.net', category: 'Invoice Orders', staff: 'YJW',
    amount: 482.5, currency: 'USD', items: 2,
    createTime: '26-07-18 14:11', paymentStatus: 'Pending' },
  { orderId: '260718130522891', clientOrderId: '4156', customer: 'Jessica Brown',
    site: 'saveb-bag.com', category: 'Offline Orders', staff: 'SJF',
    amount: 518.1, currency: 'USD', items: 3,
    createTime: '26-07-18 13:05', paymentStatus: 'Completed' },
  { orderId: '260718120418765', clientOrderId: '5021', customer: 'Robert Lee',
    site: 'saveb-love.co', category: 'Official Sites', staff: '',
    amount: 287.2, currency: 'USD', items: 1,
    createTime: '26-07-18 12:04', paymentStatus: 'Pending' },
  { orderId: '260718110832456', clientOrderId: '4783', customer: 'Amanda Davis',
    site: 'saveb-link.cc', category: 'Top Influencers', staff: 'WJL',
    amount: 359, currency: 'USD', items: 1,
    createTime: '26-07-18 11:08', paymentStatus: 'Completed' },
  { orderId: '260718100214789', clientOrderId: '3564', customer: 'Thomas Wilson',
    site: 'saveb-style.com', category: 'Invoice Orders', staff: 'ZYC',
    amount: 198.5, currency: 'USD', items: 1,
    createTime: '26-07-18 10:02', paymentStatus: 'Failed' }
]

/** 刷新状态 */
export const refreshStatus = {
  enabled: true,
  intervalMinutes: 30,
  state: 'failed',
  reason: 'DH-Order authentication/session is invalid',
  lastSuccessAt: '2026-07-18 18:19:01',
  lastFailureAt: '2026-07-18 18:47:04',
  lastError: 'DH-Order authentication/session is invalid; protected renewal is required',
  lastOrders: 7,
  lastItems: 9,
  lastUsdSales: 2463.3,
  nextAttemptAt: '2026-07-18 18:52:04'
}

/** 历史回填进度 */
export const historyProgress = {
  running: false,
  startDate: '2026-07-18',
  endDate: '2026-07-18',
  currentDate: '2026-07-18',
  totalDays: 1,
  cachedDays: 1,
  percent: 100,
  updatedAt: '2026-07-18 18:19:00'
}

/** 汇率表 */
export const exchangeRates = {
  base: 'USD',
  date: '2026-06-18',
  source: 'Frankfurter API',
  rates: {
    USD: 1.0, EUR: 0.87252, GBP: 0.75594, CNY: 6.7716,
    JPY: 160.93, KRW: 1538.89, CAD: 1.4125, AUD: 1.4276,
    HKD: 7.8376, SGD: 1.2909, CHF: 0.80429, MXN: 17.3914
  }
}

/** 在线表格链接 */
export const onlineSpreadsheets = [
  { id: 'cs-integrated', title: '产品采购&建单&品控&换货&发货集成表', url: 'https://www.kdocs.cn/l/cjdRBOAyO9dj', provider: 'WPS' },
  { id: 'cs-handover', title: '客服部交接询单跟进表', url: 'https://www.kdocs.cn/l/cprrjVmunh4r', provider: 'WPS' },
  { id: 'cs-script', title: '话术库20250514', url: 'https://www.kdocs.cn/l/cey31GGpK8Df', provider: 'WPS' },
  { id: 'cs-quote', title: '报价参考表20260609', url: 'https://www.kdocs.cn/l/cmwSUonV3HDM', provider: 'WPS' },
  { id: 'cs-refund', title: '售中售后退款表', url: 'https://www.kdocs.cn/l/cbyao3niVJil', provider: 'WPS' },
  { id: 'ops-procurement', title: '采购工作台审计日志', url: '#', provider: 'Internal' }
]

/** PayPal 账号概览 */
export const paypalOverview = {
  total: 261,
  online: 132,
  blocked: 87,
  offline: 42,
  totalBalance: 286450.32,
  totalFrozen: 28450.18,
  totalWithdrawable: 124850.84,
  totalWithdrawn: 5842619.45
}

/** 快捷入口 */
export const quickLinks = [
  { title: '订单管理', icon: 'ShoppingCart', url: '/business/order', color: '#5B8FF9' },
  { title: '发票管理', icon: 'Document', url: '/business/invoice', color: '#5AD8A6' },
  { title: '采购管理', icon: 'Box', url: '/business/procurement', color: '#F6BD16' },
  { title: '网红管理', icon: 'UserFilled', url: '/business/influencer', color: '#E86452' },
  { title: '用户管理', icon: 'User', url: '/system/user', color: '#6DC8EC' },
  { title: '角色权限', icon: 'Lock', url: '/system/role', color: '#945FB9' }
]

/** 今日总览 */
export const todayOverview = {
  date: '2026-07-18',
  totalOrders: 64,
  totalItems: 44,
  totalUSD: 9645.8,
  totalEUR: 0,
  totalGBP: 0
}
