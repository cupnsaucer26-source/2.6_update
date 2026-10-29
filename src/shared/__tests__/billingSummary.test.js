import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateItemsSubtotal,
  calculateManualDiscount,
  calculateTaxableSubtotal,
  calculateTaxBreakdown,
  calculateRoundOff,
  calculateBillingSummary,
  formatBillingSummary
} from '../billingSummary.js'
import { numberToIndianWords } from '../../utils/numberToWords.js'

test('calculateItemsSubtotal sums item amounts with safe fallbacks', () => {
  assert.equal(calculateItemsSubtotal([]), 0)
  assert.equal(calculateItemsSubtotal(null), 0)
  assert.equal(calculateItemsSubtotal(undefined), 0)

  const single = [{ amount: 450 }]
  assert.equal(calculateItemsSubtotal(single), 450)

  const multiple = [
    { amount: 150.50 },
    { amount: 249.50 },
    { amount: 100 }
  ]
  assert.equal(calculateItemsSubtotal(multiple), 500)

  // Floating-point sum precision (10.10 + 20.20 = 30.30 rather than 30.299999999999997)
  const floatItems = [{ amount: 10.10 }, { amount: 20.20 }]
  assert.equal(calculateItemsSubtotal(floatItems), 30.30)

  const withMalformed = [
    { amount: 200 },
    null,
    { amount: 'invalid' },
    { amount: 300 }
  ]
  assert.equal(calculateItemsSubtotal(withMalformed), 500)
})

test('calculateManualDiscount handles rates, rounding, and bounds', () => {
  assert.equal(calculateManualDiscount(1000, 0), 0)
  assert.equal(calculateManualDiscount(1000, 10), 100)

  // Math.round rounding check: 350 * 0.03 = 10.5 -> rounds to 11
  assert.equal(calculateManualDiscount(350, 3), 11)

  // 100% discount
  assert.equal(calculateManualDiscount(1500, 100), 1500)

  // Clamping negative to 0
  assert.equal(calculateManualDiscount(1000, -10), 0)

  // Clamping excess percentage to 100
  assert.equal(calculateManualDiscount(1000, 150), 1000)

  // Safe fallback for null/undefined
  assert.equal(calculateManualDiscount(null, 10), 0)
  assert.equal(calculateManualDiscount(1000, null), 0)
})

test('calculateTaxableSubtotal calculates non-negative taxable amount', () => {
  assert.equal(calculateTaxableSubtotal(1000, 0), 1000)
  assert.equal(calculateTaxableSubtotal(1000, 150), 850)
  assert.equal(calculateTaxableSubtotal(1000, 1000), 0)

  // Exceeding discount does not produce negative taxable subtotal
  assert.equal(calculateTaxableSubtotal(500, 750), 0)

  // Safe fallback
  assert.equal(calculateTaxableSubtotal(null, 100), 0)
  assert.equal(calculateTaxableSubtotal(500, null), 500)
})

test('calculateTaxBreakdown handles single, mixed, zero-rated, and missing GST rates', () => {
  // Empty items
  assert.deepEqual(calculateTaxBreakdown([], 0, 0), { totalCgst: 0, totalSgst: 0, totalGst: 0 })

  // Single item with 18% GST (9% CGST, 9% SGST), no discount
  const single = [{ amount: 1000, cgstRate: 9, sgstRate: 9, gstRate: 18 }]
  assert.deepEqual(calculateTaxBreakdown(single, 1000, 0), {
    totalCgst: 90,
    totalSgst: 90,
    totalGst: 180
  })

  // Missing cgstRate / sgstRate falls back to half of gstRate (or 18%)
  const missingCgst = [{ amount: 1000, gstRate: 12 }]
  assert.deepEqual(calculateTaxBreakdown(missingCgst, 1000, 0), {
    totalCgst: 60,
    totalSgst: 60,
    totalGst: 120
  })

  // Zero-rated item
  const zeroRated = [{ amount: 800, cgstRate: 0, sgstRate: 0, gstRate: 0 }]
  assert.deepEqual(calculateTaxBreakdown(zeroRated, 800, 0), {
    totalCgst: 0,
    totalSgst: 0,
    totalGst: 0
  })

  // Zero-rated item without explicit cgstRate/sgstRate falls back to half of 0% gstRate (0)
  const zeroRatedNoSplit = [{ amount: 800, gstRate: 0 }]
  assert.deepEqual(calculateTaxBreakdown(zeroRatedNoSplit, 800, 0), {
    totalCgst: 0,
    totalSgst: 0,
    totalGst: 0
  })

  // Mixed GST rates: Item 1 (5% on 1000), Item 2 (18% on 1000), Item 3 (28% on 1000)
  const mixed = [
    { amount: 1000, cgstRate: 2.5, sgstRate: 2.5, gstRate: 5 },
    { amount: 1000, cgstRate: 9, sgstRate: 9, gstRate: 18 },
    { amount: 1000, cgstRate: 14, sgstRate: 14, gstRate: 28 }
  ]
  // Total CGST: 25 + 90 + 140 = 255. Total SGST: 25 + 90 + 140 = 255. Total GST: 510.
  assert.deepEqual(calculateTaxBreakdown(mixed, 3000, 0), {
    totalCgst: 255,
    totalSgst: 255,
    totalGst: 510
  })

  // Proportional discount attribution: 300 discount on 3000 subtotal (10% across each line)
  // Each line becomes 900 taxable
  // CGST: 900*0.025 (22.5) + 900*0.09 (81) + 900*0.14 (126) = 229.5
  // SGST: 229.5
  // Total GST: 459
  assert.deepEqual(calculateTaxBreakdown(mixed, 3000, 300), {
    totalCgst: 229.5,
    totalSgst: 229.5,
    totalGst: 459
  })
})

test('calculateRoundOff handles exact, upward, and downward rounding boundaries', () => {
  // Exact whole number
  const exact = calculateRoundOff(1000, 180)
  assert.equal(exact.rawGrandTotal, 1180)
  assert.equal(exact.roundedGrandTotal, 1180)
  assert.equal(exact.roundOff, 0)

  // Downward round-off (33.33 + 6.00 = 39.33 -> rounds down to 39, roundOff = -0.33)
  const down = calculateRoundOff(33.33, 6.00)
  assert.equal(down.rawGrandTotal, 39.33)
  assert.equal(down.roundedGrandTotal, 39)
  assert.equal(down.roundOff, -0.33)

  // Upward round-off (33.80 + 6.08 = 39.88 -> rounds up to 40, roundOff = +0.12)
  const up = calculateRoundOff(33.80, 6.08)
  assert.equal(up.rawGrandTotal, 39.88)
  assert.equal(up.roundedGrandTotal, 40)
  assert.equal(up.roundOff, 0.12)
})

test('calculateBillingSummary matches backend billing invoice contract (1000 @ 18% with 100 discount)', () => {
  // Matches server/tests/billing-invoice.test.mjs line 94:
  // "1000 at 18%, ₹100 bill discount: taxable 900, GST 162, total 1062."
  const items = [{ amount: 1000, cgstRate: 9, sgstRate: 9, gstRate: 18 }]
  const summary = calculateBillingSummary({
    items,
    globalDiscountPercent: 10, // 10% of 1000 = 100
    couponDiscountAmount: 0
  })

  assert.equal(summary.itemsSubtotal, 1000)
  assert.equal(summary.manualDiscAmt, 100)
  assert.equal(summary.couponDiscountAmount, 0)
  assert.equal(summary.totalDiscount, 100)
  assert.equal(summary.taxableSubtotal, 900)
  assert.equal(summary.totalCgst, 81)
  assert.equal(summary.totalSgst, 81)
  assert.equal(summary.totalGst, 162)
  assert.equal(summary.rawGrandTotal, 1062)
  assert.equal(summary.roundedGrandTotal, 1062)
  assert.equal(summary.roundOff, 0)
  assert.equal(summary.grandTotalWords, 'Indian Rupee One Thousand Sixty Two Only')
  assert.equal(summary.taxWords, 'Indian Rupee One Hundred Sixty Two Only')
})

test('calculateBillingSummary handles combined manual and coupon discounts', () => {
  const items = [{ amount: 2000, cgstRate: 9, sgstRate: 9, gstRate: 18 }]
  const summary = calculateBillingSummary({
    items,
    globalDiscountPercent: 5,  // 100 manual discount
    couponDiscountAmount: 150  // 150 coupon discount
  })

  assert.equal(summary.itemsSubtotal, 2000)
  assert.equal(summary.manualDiscAmt, 100)
  assert.equal(summary.couponDiscountAmount, 150)
  assert.equal(summary.totalDiscount, 250)
  assert.equal(summary.taxableSubtotal, 1750)
  // 1750 @ 18% = 315 GST (157.50 CGST + 157.50 SGST)
  assert.equal(summary.totalCgst, 157.50)
  assert.equal(summary.totalSgst, 157.50)
  assert.equal(summary.totalGst, 315)
  assert.equal(summary.roundedGrandTotal, 2065)
  assert.equal(summary.roundOff, 0)
})

test('calculateBillingSummary handles large wholesale order with Indian numbering words', () => {
  const items = [
    { amount: 2500000, cgstRate: 9, sgstRate: 9, gstRate: 18 },
    { amount: 2500000, cgstRate: 2.5, sgstRate: 2.5, gstRate: 5 }
  ]
  const summary = calculateBillingSummary({
    items,
    globalDiscountPercent: 2,
    couponDiscountAmount: 0
  })

  assert.equal(summary.itemsSubtotal, 5000000)
  assert.equal(summary.manualDiscAmt, 100000) // 2% of 50 Lakhs = 1 Lakh
  assert.equal(summary.taxableSubtotal, 4900000)
  assert.equal(summary.totalDiscount, 100000)
  assert(summary.grandTotalWords.includes('Lakh'))
})

test('formatBillingSummary formats all monetary fields with Indian currency symbol and fraction digits', () => {
  const summary = {
    itemsSubtotal: 1000,
    manualDiscAmt: 100,
    couponDiscountAmount: 50,
    taxableSubtotal: 850,
    totalCgst: 76.50,
    totalSgst: 76.50,
    roundOff: -0.33,
    roundedGrandTotal: 1003
  }

  const formatted = formatBillingSummary(summary)
  assert.equal(formatted.subtotalFormatted, '₹1,000.00')
  assert.equal(formatted.manualDiscAmtFormatted, '-₹100.00')
  assert.equal(formatted.couponDiscountFormatted, '-₹50.00')
  assert.equal(formatted.taxableSubtotalFormatted, '₹850.00')
  assert.equal(formatted.totalCgstFormatted, '+₹76.50')
  assert.equal(formatted.totalSgstFormatted, '+₹76.50')
  assert.equal(formatted.roundOffFormatted, '-₹0.33')
  assert.equal(formatted.grandTotalFormatted, '₹1,003.00')
})

test('Pre-extraction equivalence test: verify identical outputs with legacy inline Dashboard logic', () => {
  // Legacy inline Dashboard implementation
  function legacyInlineCalc(items, globalDiscountPercent, couponDiscountAmount) {
    const itemsSubtotal = items.reduce((s, i) => s + i.amount, 0)
    const manualDiscAmt = Math.round(itemsSubtotal * (globalDiscountPercent / 100))
    const totalDiscount = manualDiscAmt + couponDiscountAmount
    const taxableSubtotal = Math.max(0, itemsSubtotal - totalDiscount)

    let totalCgst = 0
    let totalSgst = 0
    items.forEach(i => {
      const ratio = itemsSubtotal > 0 ? i.amount / itemsSubtotal : 0
      const lineTaxable = Math.max(0, i.amount - totalDiscount * ratio)
      totalCgst += lineTaxable * (i.cgstRate / 100)
      totalSgst += lineTaxable * (i.sgstRate / 100)
    })

    totalCgst = +(totalCgst.toFixed(2))
    totalSgst = +(totalSgst.toFixed(2))
    const totalGst = +(totalCgst + totalSgst).toFixed(2)

    const rawGrandTotal = taxableSubtotal + totalGst
    const roundedGrandTotal = Math.round(rawGrandTotal)
    const roundOff = +(roundedGrandTotal - rawGrandTotal).toFixed(2)

    const grandTotalWords = numberToIndianWords(roundedGrandTotal)
    const taxWords = numberToIndianWords(totalGst)

    return {
      itemsSubtotal,
      manualDiscAmt,
      totalDiscount,
      taxableSubtotal,
      totalCgst,
      totalSgst,
      totalGst,
      rawGrandTotal: +(rawGrandTotal.toFixed(2)),
      roundedGrandTotal,
      roundOff,
      grandTotalWords,
      taxWords
    }
  }

  const multiItemSample = [
    { amount: 499.99, cgstRate: 9, sgstRate: 9, gstRate: 18 },
    { amount: 250.00, cgstRate: 2.5, sgstRate: 2.5, gstRate: 5 },
    { amount: 125.50, cgstRate: 6, sgstRate: 6, gstRate: 12 }
  ]

  const legacy = legacyInlineCalc(multiItemSample, 7.5, 25)
  const modern = calculateBillingSummary({
    items: multiItemSample,
    globalDiscountPercent: 7.5,
    couponDiscountAmount: 25
  })

  for (const key of Object.keys(legacy)) {
    assert.deepEqual(modern[key], legacy[key], `Mismatch found on key: ${key}`)
  }
})
