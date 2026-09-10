import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/views/workbench/invoice/ocr-form.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { applyInvoiceOcr, convertInvoiceCurrency } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

function emptyForm() {
  return {
    invoice_date: '2026-09-08', order_date: '2026-09-08', order_number: '10001',
    customer_full_name: '', customer_email: '', recipient_paypal: '', amount_usd: '',
    expedited_shipping: true, fixed_discount: null, items: [{ product_name: '', price: '', quantity: 1 }],
    allocations: [{ staff_code: 'AA', percent: 100 }],
  }
}

test('recognized fields and multiple products fill their inputs, internal values remain intact', () => {
  const form = emptyForm()
  const fields = {
    order_date: '2026-09-07', customer_full_name: 'Jane Smith', customer_email: 'buyer@example.test',
    recipient_paypal: 'seller@example.test', amount_usd: 225, expedited_shipping: false, fixed_discount: 0,
    invoice_date: '1999-01-01', order_number: 'unsafe', allocations: [],
    items: [{ product_name: 'Bag', quantity: 2, price: 100 }, { product_name: 'Tote', quantity: 1, price: 50 }],
  }
  applyInvoiceOcr(form, { fields }, structuredClone(form))
  assert.equal(form.customer_email, fields.customer_email)
  assert.equal(form.recipient_paypal, fields.recipient_paypal)
  assert.equal(form.amount_usd, 225)
  assert.equal(form.order_date, '2026-09-07')
  assert.equal(form.expedited_shipping, false)
  assert.equal(form.fixed_discount, 0)
  assert.equal(form.invoice_date, '2026-09-08')
  assert.equal(form.order_number, '10001')
  assert.equal(form.allocations.length, 1)
  assert.deepEqual(form.items.map(item => [item.product_name, item.quantity, item.price]), [['Bag', 2, 100], ['Tote', 1, 50]])
})

test('edits made while recognition is running are retained', () => {
  const form = emptyForm()
  const before = structuredClone(form)
  form.customer_full_name = 'Manual Name'
  form.items[0].product_name = 'Manual Product'
  applyInvoiceOcr(form, { fields: { customer_full_name: 'OCR Name', items: [{ product_name: 'OCR Product', quantity: 2 }, { product_name: 'Second Product', quantity: 1, price: 50 }] } }, before)
  assert.equal(form.customer_full_name, 'Manual Name')
  assert.equal(form.items[0].product_name, 'Manual Product')
  assert.equal(form.items[0].quantity, 2)
  assert.equal(form.items[1].product_name, 'Second Product')
})

test('unknown values leave inputs untouched and a new product never inherits a different image', () => {
  const form = emptyForm()
  form.items = [{ product_name: 'Old Product', image_attachment_id: 42, image: { id: 42, src: 'blob:http://localhost/old', status: 'ready' }, notes: 'Old note' }]
  applyInvoiceOcr(form, { fields: { customer_email: '', amount_usd: null, items: [{ product_name: 'New Product', quantity: 1 }] } }, structuredClone(form))
  assert.equal(form.customer_email, '')
  assert.equal(form.amount_usd, '')
  assert.equal(form.items[0].price, '')
  assert.equal(form.items[0].image_attachment_id, null)
  assert.equal(form.items[0].image, undefined)
  assert.equal(form.items[0].notes, '')
})

test('recognition fills payment status but preserves a selection made while waiting', () => {
  const form = { ...emptyForm(), invoice_status: '' }
  applyInvoiceOcr(form, { fields: {}, paymentStatus: 'Pending' }, structuredClone(form))
  assert.equal(form.invoice_status, 'Pending')
  const before = structuredClone(form)
  form.invoice_status = 'Paid'
  applyInvoiceOcr(form, { fields: { invoice_status: 'Failed' } }, before)
  assert.equal(form.invoice_status, 'Paid')
})

test('reordered OCR products retain matching internal names, notes and thumbnails', () => {
  const form = emptyForm()
  const bagImage = { id: 41, src: 'data:image/jpeg;base64,YmFn', status: 'ready' }
  const toteImage = { id: 42, src: 'blob:http://localhost/tote', status: 'ready' }
  form.items = [
    { product_name: 'Internal Bag', description: 'Leather Bag', image_attachment_id: 41, image: bagImage, notes: 'Black' },
    { product_name: 'Internal Tote', description: 'Canvas Tote', image_attachment_id: 42, image: toteImage, notes: 'White' },
  ]
  applyInvoiceOcr(form, { fields: { items: [
    { product_name: 'Canvas Tote', description: 'Canvas Tote', quantity: 1, price: 50 },
    { product_name: 'Leather Bag', description: 'Leather Bag', quantity: 2, price: 100 },
    { product_name: 'Scarf', description: 'Scarf', quantity: 3, price: 20 },
  ] } }, structuredClone(form))
  assert.deepEqual(form.items.map(item => item.image_attachment_id), [42, 41, null])
  assert.deepEqual(form.items.map(item => item.product_name), ['Internal Tote', 'Internal Bag', 'Scarf'])
  assert.equal(form.items[0].notes, 'White')
  assert.deepEqual(form.items.map(item => item.image), [toteImage, bagImage, undefined])
})

test('recognition preserves an uploaded image when expanding the initial product row', () => {
  const form = emptyForm()
  const image = { id: 43, src: 'blob:http://localhost/new-upload', status: 'ready' }
  Object.assign(form.items[0], { image_attachment_id: 43, image })
  applyInvoiceOcr(form, { fields: { items: [
    { product_name: 'Bag', quantity: 1, price: 100 },
    { product_name: 'Tote', quantity: 2, price: 50 },
  ] } }, structuredClone(form))
  assert.equal(form.items[0].image_attachment_id, 43)
  assert.deepEqual(form.items[0].image, image)
  assert.equal(form.items[1].image_attachment_id, null)
  assert.equal(form.items[1].image, undefined)
})

test('recognition retains the current image replacement or removal instead of a stale preview', () => {
  for (const replacement of [{ id: 45, src: 'blob:http://localhost/replacement', status: 'ready' }, null]) {
    const form = emptyForm()
    Object.assign(form.items[0], {
      image_attachment_id: 44, image: { id: 44, src: 'blob:http://localhost/old', status: 'ready' },
    })
    const before = structuredClone(form)
    form.items[0].image_attachment_id = replacement?.id ?? null
    form.items[0].image = replacement
    applyInvoiceOcr(form, { fields: { items: [{ product_name: 'Bag', quantity: 1, price: 100 }] } }, before)
    assert.equal(form.items[0].image_attachment_id, replacement?.id ?? null)
    assert.deepEqual(form.items[0].image, replacement)
  }
})

test('currency conversion uses rates to USD and leaves unknown currencies unconverted', () => {
  assert.equal(convertInvoiceCurrency('100 EUR', { EUR: 1.1 }), '110.00')
  assert.equal(convertInvoiceCurrency('usd 1,200.50', {}), '1200.50')
  assert.equal(convertInvoiceCurrency('100 XYZ', {}), null)
  assert.equal(convertInvoiceCurrency('invalid', {}), null)
})

test('PayPal card response expands the initial row and selects the recognized Paid status', async () => {
  const result = process.env.INVOICE_OCR_SAMPLE_RESULT
    ? JSON.parse(await readFile(process.env.INVOICE_OCR_SAMPLE_RESULT, 'utf8'))
    : { paymentStatus: 'Paid', fields: { invoice_status: 'Paid', amount_usd: 452.86, items: [
      { description: 'fashion clothing Iw1', product_name: 'fashion clothing Iw1', quantity: 1, price: 189 },
      { description: 'fashion clothing gu 2', product_name: 'fashion clothing gu 2', quantity: 1, price: 159 },
      { description: 'fashion clothing pu 3', product_name: 'fashion clothing pu 3', quantity: 1, price: 159 },
    ] } }
  const form = { ...emptyForm(), invoice_status: '' }
  applyInvoiceOcr(form, result, structuredClone(form))
  assert.equal(form.invoice_status, 'Paid')
  assert.equal(form.items.length, 3)
  assert.deepEqual(form.items.map(item => item.quantity), [1, 1, 1])
  assert.deepEqual(form.items.map(item => item.price), [189, 159, 159])
  assert.equal(form.amount_usd, 452.86)
})
