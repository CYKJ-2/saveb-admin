// 从实际页面语言包生成权限名称；执行后仍需单独运行 PermissionNameSeeder 更新数据库。
import { readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'

const sources = {
  dashboard: ['Sales Live Dashboard', '销售实况'],
  'dashboard.overview': ['Sales Live Dashboard', '销售实况'],
  business: 'route.business', system: 'route.system',
  'dashboard.order_management': 'pages.orderManagement',
  'dashboard.overview.overview': ['Key Metrics / Payment Status', '核心指标 / 付款状态'],
  'dashboard.overview.sales_trend': 'pages.salesTrend',
  'dashboard.overview.categories': 'pages.orderCategories',
  'dashboard.overview.staff': 'pages.offlineSalesAssociatePerformance',
  'dashboard.overview.influencers': 'pages.influencerSalesRanking',
  'dashboard.overview.recent_orders': 'pages.recentOrders',
  'dashboard.overview.collector_status': ['Collector monitoring', '采集运行监控'],
  'dashboard.overview.collector_trigger': ['Collect today’s data', '采集当天数据'],
  'dashboard.collector': 'route.collector-management',
  'dashboard.collector.settings': ['Save interval', '保存间隔'],
  'dashboard.collector.collect': ['Range update / Missing dates', '范围更新 / 仅补缺'],
  'dashboard.collector.reprocess': ['Archive recalculation preview', '归档重算预览（不入库）'],
  'system.order.list': 'pages.orderSearch',
  'system.order.update': 'pages.edit',
  'system.order.export': 'pages.exportAllResults',
  'system.order.testing': 'pages.testOrders',
  'system.order.statistics.overview': ['Orders / Items / Sales', '成交订单 / 成交件数 / 销售额'],
  'system.order.statistics.currencies': 'pages.salesByCurrency',
  'system.order.statistics.sales-trend': 'pages.salesTrend',
  'system.order.statistics.categories': 'pages.salesCategory',
  'system.order.statistics.staff': 'pages.offlineOrdersSalesAssociateAllocation',
  'business.invoice': 'pages.invoiceOrderRegistering',
  'business.invoice.list': 'pages.search',
  'business.invoice.create': 'pages.registerInvoice',
  'business.invoice.update': 'pages.edit',
  'business.invoice.delete': 'common.delete',
  'business.invoice.ocr': 'pages.recognizeScreenshotText',
  'business.invoice.logs': 'pages.operationLogs',
  'business.invoice.export': 'pages.exportAllLogs',
  'business.sa_sales': 'pages.saTitle',
  'business.sa_sales.list': 'pages.saTitle',
  'business.sa_sales.export': 'pages.exportCsv',
  'business.procurement': 'pages.purchasingWorkbench',
  'business.procurement.list': 'pages.search',
  'business.procurement.statistics': 'pages.validOrders',
  'business.procurement.create': 'pages.createPurchaseTask',
  'business.procurement.update': 'pages.edit',
  'business.procurement.delete': 'pages.remove',
  'business.procurement.logs': 'pages.operationLogs',
  'business.procurement.export': ['Export Orders / Export All Logs', '导出订单 / 导出全部日志'],
  'business.procurement.logistics': 'pages.logisticsRefresh',
  'business.warehouse': 'pages.warehouseWorkbench',
  'business.warehouse.list': 'pages.warehouseOrders',
  'business.warehouse.update': 'pages.inspectShip',
  'business.influencer': 'influencer.creatorSalesTitle',
  'business.influencer.list': 'influencer.creatorRelationshipTitle',
  'business.influencer.statistics': 'influencer.creatorSalesTitle',
  'business.influencer.create': 'influencer.creatorRelationshipAddWebsite',
  'business.influencer.export': 'influencer.creatorRelationshipDownload',
  'business.paypal': 'paypal.paypalMonitorTitle',
  'business.paypal.list': ['PayPal Accounts', 'PayPal 账号'],
  'business.paypal.orders': 'paypal.sourceOrderList',
  'business.paypal.orders_export': 'paypal.downloadOrders',
  'business.paypal.withdrawals': 'paypal.withdrawalRecordSearchTitle',
  'business.paypal.statistics': 'paypal.withdrawalsPanelTitle',
  'business.paypal.logs': 'paypal.downloadChangeLog',
  'business.paypal.create': 'paypal.addPaypalAccount',
  'business.paypal.balance': 'paypal.balanceActionCorrection',
  'business.paypal.review': 'paypal.numberOfReviews',
  'business.paypal.withdrawal': 'paypal.balanceActionWithdrawl',
  'business.paypal.export': 'pages.exportAllResults',
  'business.operations': 'operations.spreadsheetDirectoryTitle',
  'business.operations.list': 'operations.spreadsheetDirectoryTitle',
  'system.user': 'system.user.title',
  'system.user.create': 'system.user.add',
  'system.user.update': 'common.edit',
  'system.user.delete': 'common.delete',
  'system.user.assign_role': ['Assign Roles', '分配角色'],
  'system.role': 'system.role.title',
  'system.role.create': 'system.role.add',
  'system.role.update': 'common.edit',
  'system.role.delete': 'common.delete',
  'system.role.assign_permission': 'system.role.field.permissions',
  'system.permission': 'system.permission.title',
  'system.permission.create': 'system.permission.add',
  'system.permission.update': 'common.edit',
  'system.permission.delete': 'common.delete',
}
const messages = {}
for (const locale of ['en-US', 'zh-CN']) {
  messages[locale] = {}
  for (const name of ['pages', 'paypal', 'influencer', 'operations', 'route', 'system', 'common']) {
    const module = { exports: {} }
    const source = await readFile(new URL(`../src/lang/modules/${locale}/${name}.ts`, import.meta.url), 'utf8')
    new Function('exports', 'module', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module.exports, module)
    messages[locale][name] = module.exports.default
  }
}
const quote = text => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
const entries = Object.entries(sources).map(([code, key]) => {
  const names = Array.isArray(key) ? key : ['en-US', 'zh-CN'].map(locale => key.split('.').reduce((value, part) => value?.[part], messages[locale]))
  if (names.some(name => typeof name !== 'string' || !name.trim())) throw new Error(`Missing page label: ${code} (${key})`)
  return `        ${quote(code)} => [${names.map(quote).join(', ')}],`
})
const target = new URL('../../saveb-api/database/seeders/PermissionNameSeeder.php', import.meta.url)
const php = await readFile(target, 'utf8')
await writeFile(target, php.replace(/(    private const NAMES = \[\n)[\s\S]*?(    \];)/, `$1${entries.join('\n')}\n$2`))
console.log(`Generated ${entries.length} permission names from current page labels.`)
