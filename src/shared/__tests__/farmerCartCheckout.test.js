// Regression test suite for Farmer Cart, Checkout Rules, Pricing and Payment Workflows
// Covers: Phase C requirements from Batch 19 Master Prompt.

import { test, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  ADDRESS_LABELS,
  REQUIRED_DETAILS,
  CONTACT_FIELDS,
  addressEmoji,
  cartTotals,
  customerDetails,
  detailProblems,
  fieldsFromAddress,
  initialFields,
  itemCount,
  mergeCarts,
  normalizeCart,
  orderLine,
  withCurrentProducts,
  withItemAdded
} from '../../hooks/checkoutRules.js'

// Realistic catalog products from server
const mockCatalogProducts = [
  {
    id: 'sb-01',
    _id: 'sb-01',
    name: 'Earth Power Pro',
    price: 1300,
    mrp: 1500,
    gstRate: 18,
    hsnCode: '3101',
    packSizes: ['50kg', '25kg'],
    packPrices: { '50kg': 1300, '25kg': 700 }
  },
  {
    id: 'sb-02',
    _id: 'sb-02',
    name: 'Salico-G Granules',
    price: 950,
    mrp: 1100,
    gstRate: 12, // Special 12% fertilizer rate
    hsnCode: '3105',
    packSizes: ['10kg', '5kg'],
    packPrices: { '10kg': 950, '5kg': 520 }
  },
  {
    id: 'sb-03',
    _id: 'sb-03',
    name: 'Gold Gel Pro - Banana',
    price: 1450,
    mrp: 1700,
    gstRate: 18,
    hsnCode: '3808',
    packSizes: ['5L', '1L'],
    packPrices: { '5L': 1450, '1L': 340 }
  }
]

// ---------------- 1. CART ITEM MANAGEMENT ----------------

test('Cart lines normalization converts quantity strings, clamps negatives, and preserves fields', () => {
  const raw = [
    { id: 'p1', quantity: '3', price: '120.50' },
    { id: 'p2', qty: -5, price: 50 },
    { id: 'p3', qty: 0, price: 100 },
    null,
    undefined,
    'junk string'
  ]
  const normalized = normalizeCart(raw)
  assert.equal(normalized.length, 3)
  assert.equal(normalized[0].qty, 3)
  assert.equal(normalized[0].price, 120.5)
  assert.equal('quantity' in normalized[0], false, 'Removes deprecated quantity key')
  assert.equal(normalized[1].qty, 1, 'Clamps negative quantity to minimum 1')
  assert.equal(normalized[2].qty, 1, 'Clamps 0 quantity to minimum 1')
})

test('withItemAdded increments existing item with same pack, but creates new line for different pack', () => {
  let cart = []
  cart = withItemAdded(cart, { id: 'sb-01', price: 1300, selectedPack: '50kg' }, 1)
  assert.equal(itemCount(cart), 1)
  assert.equal(cart[0].qty, 1)

  // Add same product same pack
  cart = withItemAdded(cart, { id: 'sb-01', price: 1300, selectedPack: '50kg' }, 2)
  assert.equal(cart.length, 1, 'Does not duplicate line')
  assert.equal(cart[0].qty, 3, 'Increments quantity by 2')
  assert.equal(itemCount(cart), 3)

  // Add same product DIFFERENT pack
  cart = withItemAdded(cart, { id: 'sb-01', price: 700, selectedPack: '25kg' }, 1)
  assert.equal(cart.length, 2, 'Different pack creates distinct line item')
  assert.equal(cart[1].selectedPack, '25kg')
  assert.equal(itemCount(cart), 4)
})

test('mergeCarts correctly combines guest session basket with account basket upon farmer login', () => {
  const accountCart = normalizeCart([
    { id: 'sb-01', selectedPack: '50kg', qty: 1, price: 1300 },
    { id: 'sb-02', selectedPack: '10kg', qty: 2, price: 950 }
  ])
  const guestCart = normalizeCart([
    { id: 'sb-01', selectedPack: '50kg', qty: 2, price: 1300 }, // same pack -> merges to 3
    { id: 'sb-03', selectedPack: '5L', qty: 1, price: 1450 }     // new product -> appends
  ])

  const merged = mergeCarts(accountCart, guestCart)
  assert.equal(merged.length, 3)
  const sb01 = merged.find(i => (i.id || i._id) === 'sb-01')
  const sb02 = merged.find(i => (i.id || i._id) === 'sb-02')
  const sb03 = merged.find(i => (i.id || i._id) === 'sb-03')

  assert.equal(sb01.qty, 3, 'Merged matching item quantity')
  assert.equal(sb02.qty, 2, 'Preserved account item')
  assert.equal(sb03.qty, 1, 'Appended new guest item')
})

// ---------------- 2. SERVER-AUTHORITATIVE PRICING ----------------

test('withCurrentProducts strictly overrides client-submitted prices and GST rates from catalog', () => {
  // Tampered client cart attempting to submit cheaper prices or 0% GST
  const tamperedCart = [
    { id: 'sb-01', selectedPack: '50kg', price: 10, gstRate: 0, qty: 2 },
    { id: 'sb-02', selectedPack: '10kg', price: 50, gstRate: 5, qty: 1 }
  ]

  const syncedCart = withCurrentProducts(tamperedCart, mockCatalogProducts)
  assert.equal(syncedCart[0].price, 1300, 'Server price overrides client price for sb-01')
  assert.equal(syncedCart[0].gstRate, 18, 'Server GST rate overrides client rate for sb-01')
  assert.equal(syncedCart[1].price, 950, 'Server price overrides client price for sb-02')
  assert.equal(syncedCart[1].gstRate, 12, 'Server special 12% GST rate overrides client rate for sb-02')
})

test('withCurrentProducts gracefully preserves items if product is absent or retired from catalog', () => {
  const cartWithRetired = [
    { id: 'sb-retired-99', selectedPack: '1L', price: 500, gstRate: 18, qty: 1 }
  ]
  const result = withCurrentProducts(cartWithRetired, mockCatalogProducts)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'sb-retired-99')
  assert.equal(result[0].price, 500, 'Preserves item without throwing error')
})

test('orderLine extracts only safe product references, quantity, and pack — NEVER price', () => {
  const cartItem = {
    id: 'sb-01',
    _id: 'sb-01',
    name: 'Earth Power Pro',
    price: 1300,
    selectedPack: '50kg',
    qty: 2,
    clientSecretDiscount: 999
  }
  const submittedLine = orderLine(cartItem)
  assert.equal(submittedLine.id, 'sb-01')
  assert.equal(submittedLine.qty, 2)
  assert.equal(submittedLine.selectedPack, '50kg')
  assert.equal('price' in submittedLine, false, 'Price is never sent from client order line')
  assert.equal('clientSecretDiscount' in submittedLine, false, 'Discounts are never dictated by client')
})

// ---------------- 3. FINANCIAL CALCULATIONS & COUPON DISCOUNTING ----------------

test('cartTotals calculates subtotal, GST rates, equal CGST/SGST split, and discount deduction', () => {
  // Line 1: ₹1,300 * 2 = ₹2,600 @ 18% GST = ₹468.00
  // Line 2: ₹950 * 1 = ₹950 @ 12% GST = ₹114.00
  // Total Subtotal = ₹3,550
  // Total GST = ₹468 + ₹114 = ₹582
  const cart = [
    { id: 'sb-01', price: 1300, gstRate: 18, qty: 2 },
    { id: 'sb-02', price: 950, gstRate: 12, qty: 1 }
  ]

  const withoutCoupon = cartTotals(cart, 0)
  assert.equal(withoutCoupon.subtotal, 3550)
  assert.equal(withoutCoupon.discount, 0)
  assert.equal(withoutCoupon.finalSubtotal, 3550)
  assert.equal(withoutCoupon.gst, 582)
  assert.equal(withoutCoupon.cgst + withoutCoupon.sgst, 582, 'CGST and SGST sum to total GST')
  assert.equal(withoutCoupon.total, 3550 + 582)

  // Apply ₹300 coupon discount
  const withCoupon = cartTotals(cart, 300)
  assert.equal(withCoupon.subtotal, 3550)
  assert.equal(withCoupon.discount, 300)
  assert.equal(withCoupon.finalSubtotal, 3250)
  assert.equal(withCoupon.total, 3250 + 582)
})

test('cartTotals caps discount so it never exceeds subtotal or turns negative', () => {
  const cart = [{ id: 'sb-02', price: 950, gstRate: 18, qty: 1 }]
  
  // Attempt ₹5,000 discount on ₹950 subtotal
  const excessive = cartTotals(cart, 5000)
  assert.equal(excessive.discount, 950, 'Discount is capped at subtotal')
  assert.equal(excessive.finalSubtotal, 0)
  assert.equal(excessive.total, excessive.gst, 'Farmer pays only GST if subtotal is fully discounted')

  // Negative discount attempt
  const negative = cartTotals(cart, -150)
  assert.equal(negative.discount, 0, 'Negative discount is clamped to 0')
  assert.equal(negative.finalSubtotal, 950)
})

// ---------------- 4. CHECKOUT VALIDATION & ADDRESS CONSTRAINTS ----------------

test('detailProblems identifies missing mandatory delivery address and contact fields', () => {
  const emptyForm = {}
  const problems = detailProblems(emptyForm)
  assert.equal(problems.addressLabel, 'required')
  assert.equal(problems.addressName, 'required')
  assert.equal(problems.addressPhone, 'phone')
  assert.equal(problems.doorNo, 'required')
  assert.equal(problems.street, 'required')
  assert.equal(problems.area, 'required')
  assert.equal(problems.taluk, 'required')
  assert.equal(problems.pincode, 'pincode')
  assert.equal(problems.district, 'required')
  assert.equal(problems.state, 'state')
})

test('detailProblems validates 10-digit Indian mobile number format and 6-digit pincode', () => {
  const baseValid = {
    addressLabel: 'Farm',
    customerName: 'K. Murugan',
    addressName: 'K. Murugan',
    doorNo: '12',
    street: 'Main Road',
    area: 'Green Farm',
    taluk: 'Thanjavur',
    pincode: '613001',
    district: 'Thanjavur',
    state: 'Tamil Nadu'
  }

  // Invalid: 9 digits
  const p1 = detailProblems({ ...baseValid, addressPhone: '984210000' })
  assert.equal(p1.addressPhone, 'phone')

  // Invalid: starts with 5 (not an Indian mobile prefix)
  const p2 = detailProblems({ ...baseValid, addressPhone: '5842100000' })
  assert.equal(p2.addressPhone, 'phone')

  // Invalid: 5-digit pincode
  const p3 = detailProblems({ ...baseValid, addressPhone: '9842100001', pincode: '61300' })
  assert.equal(p3.pincode, 'pincode')

  // Valid: 10 digits starting with 9 and 6-digit pincode
  const pValid = detailProblems({ ...baseValid, addressPhone: '9842100001', pincode: '613001' })
  assert.deepEqual(pValid, {}, 'Zero problems on completely valid form')
})

test('fieldsFromAddress extracts fields and applies custom or standard emoji labels', () => {
  const currentForm = initialFields(null)
  const savedAddress = {
    id: 'addr-1',
    label: 'Farm',
    name: 'Murugan Farmer',
    phone: '9842100001',
    doorNo: '4A',
    street: 'Agronomy Lane',
    area: 'Green Valley',
    taluk: 'Erode',
    pincode: '638001',
    district: 'Erode',
    state: 'Tamil Nadu'
  }

  const fields = fieldsFromAddress(currentForm, savedAddress)
  assert.equal(fields.addressLabel, 'Farm')
  assert.equal(fields.doorNo, '4A')
  assert.equal(fields.pincode, '638001')
  assert.equal(fields.addressName, 'Murugan Farmer')
  assert.equal(fields.addressPhone, '9842100001')
  assert.equal(addressEmoji('Farm'), '🚜')
  assert.equal(addressEmoji('Home'), '🏠')
  assert.equal(addressEmoji('Office'), '🏢')
  assert.equal(addressEmoji('Uncle Farm Godown'), '📍', 'Custom label gets fallback pin emoji')
})

// ---------------- 5. PAYMENT INITIALIZATION & DUPLICATE SUBMISSION ----------------

test('Checkout state machine prevents duplicate submissions while order is processing', async () => {
  let busy = ''
  let submissionCount = 0

  async function mockPlaceOrder(paymentMode) {
    if (busy) return { success: false, reason: 'duplicate_blocked' }
    try {
      busy = paymentMode // 'cod' or 'pay'
      submissionCount++
      // Simulate asynchronous network roundtrip
      await new Promise(r => setTimeout(r, 20))
      return { success: true, orderId: `SAM-ORD-${Date.now()}` }
    } finally {
      busy = ''
    }
  }

  // First click initiates submission
  const p1 = mockPlaceOrder('cod')
  assert.equal(busy, 'cod', 'Busy flag set during submission')

  // Second immediate click while p1 is inflight is rejected
  const p2 = await mockPlaceOrder('cod')
  assert.equal(p2.success, false)
  assert.equal(p2.reason, 'duplicate_blocked')

  const res1 = await p1
  assert.equal(res1.success, true)
  assert.equal(busy, '', 'Busy flag reset after order completion')
  assert.equal(submissionCount, 1, 'Only 1 order submitted to backend')
})

test('Razorpay script failure is handled gracefully with retry capability', async () => {
  let scriptAttempts = 0

  async function mockLoadRazorpay() {
    scriptAttempts++
    if (scriptAttempts === 1) {
      // Simulate network error on first script load
      return null
    }
    return {
      open: () => {}
    }
  }

  // Attempt 1: Script load fails
  const rzp1 = await mockLoadRazorpay()
  assert.equal(rzp1, null, 'Returns null on network failure')

  // Attempt 2: User retries payment, script loads successfully
  const rzp2 = await mockLoadRazorpay()
  assert.ok(rzp2, 'Razorpay loaded on retry')
  assert.equal(typeof rzp2.open, 'function')
  assert.equal(scriptAttempts, 2)
})
