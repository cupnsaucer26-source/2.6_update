import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateBillingSummary,
  calculateTaxBreakdown,
  calculateRoundOff
} from '../billingSummary.js'
import {
  computeTodayStats,
  formatBillingStats,
  formatRecentInvoiceRow,
  prepareRecentInvoices
} from '../billingInvoices.js'
import {
  calculateItemAmount,
  normalizeBillItem
} from '../billingItems.js'

test('Integration Audit 1: Mixed GST rates (18% and 12%) with proportional discount distribution', () => {
  // Line 1: Bio-NPK Power Booster, 1 @ 450, 18% GST (9% CGST, 9% SGST)
  const item1 = normalizeBillItem({
    productId: 'prod-001',
    name: 'Bio-NPK Power Booster',
    rate: 450,
    qty: 1,
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    amount: calculateItemAmount(450, 1, 0)
  })

  // Line 2: Neem Shield Pest Control, 1 @ 320, 12% GST (6% CGST, 6% SGST)
  const item2 = normalizeBillItem({
    productId: 'prod-002',
    name: 'Neem Shield Pest Control',
    rate: 320,
    qty: 1,
    gstRate: 12,
    cgstRate: 6,
    sgstRate: 6,
    amount: calculateItemAmount(320, 1, 0)
  })

  // Subtotal = 450 + 320 = 770
  // Manual discount 15%: Math.round(770 * 0.15) = 116
  // Coupon discount: 50
  // Total discount = 116 + 50 = 166
  // Taxable subtotal = 770 - 166 = 604
  const summary = calculateBillingSummary({
    items: [item1, item2],
    globalDiscountPercent: 15,
    couponDiscountAmount: 50
  })

  assert.equal(summary.itemsSubtotal, 770)
  assert.equal(summary.manualDiscAmt, 116)
  assert.equal(summary.couponDiscountAmount, 50)
  assert.equal(summary.totalDiscount, 166)
  assert.equal(summary.taxableSubtotal, 604)

  // Verify proportional tax distribution:
  // Item 1 ratio = 450 / 770. Line 1 taxable = 450 - 166 * (450 / 770) = 352.987...
  // Line 1 CGST = 352.987 * 0.09 = 31.7688...
  // Item 2 ratio = 320 / 770. Line 2 taxable = 320 - 166 * (320 / 770) = 251.0129...
  // Line 2 CGST = 251.0129 * 0.06 = 15.0607...
  // Total CGST = +( (31.7688 + 15.0607).toFixed(2) ) = 46.83
  // Total SGST = 46.83
  // Total GST = 93.66
  assert.equal(summary.totalCgst, 46.83)
  assert.equal(summary.totalSgst, 46.83)
  assert.equal(summary.totalGst, 93.66)

  // Raw Grand Total = 604 + 93.66 = 697.66
  // Round Off = +( (698 - 697.66).toFixed(2) ) = +0.34
  // Rounded Grand Total = 698
  assert.equal(summary.rawGrandTotal, 697.66)
  assert.equal(summary.roundOff, 0.34)
  assert.equal(summary.roundedGrandTotal, 698)
  assert.equal(summary.grandTotalWords, 'Indian Rupee Six Hundred Ninety Eight Only')
})

test('Integration Audit 2: Invoice save payload schema matches server-side expectations', () => {
  const lineItem = normalizeBillItem({
    productId: 'prod-001',
    name: 'Bio-NPK Power Booster',
    batch: 'BAT-2026-01',
    hsnCode: '31010099',
    rate: 450,
    qty: 2,
    discPercent: 0,
    gstRate: 18,
    amount: 900
  })

  const summary = calculateBillingSummary({
    items: [lineItem],
    globalDiscountPercent: 10,
    couponDiscountAmount: 0
  })

  // Replicate constructCurrentInvoicePayload() contract
  const invoicePayload = {
    documentType: 'TAX INVOICE',
    invoiceNo: 'SAM MDU01 0101',
    date: '2026-10-29',
    customerName: 'Kavitha Raman',
    customerPhone: '9876543210',
    buyerDetails: {
      name: 'Kavitha Raman',
      phone: '9876543210',
      line1: 'No 45, North St',
      cityState: 'Madurai-625016, Tamil Nadu',
      pincode: '625016',
      gstin: '33ABCDE1234F1Z5',
      stateName: 'Tamil Nadu',
      stateCode: '33',
      placeOfSupply: 'Tamil Nadu'
    },
    consigneeDetails: {
      name: 'Kavitha Raman',
      line1: 'No 45, North St',
      cityState: 'Madurai-625016, Tamil Nadu',
      pincode: '625016',
      stateCode: '33'
    },
    despatchDetails: {
      despatchedThrough: 'VRL Logistics',
      destination: 'Madurai'
    },
    transportDetails: {
      motorVehicleNo: 'TN58DW0090',
      termsOfDelivery: 'Door Delivery'
    },
    paymentMode: 'Cash',
    paymentTerms: 'Immediate',
    items: [lineItem],
    subtotal: summary.itemsSubtotal,
    discountAmount: summary.totalDiscount,
    couponCode: '',
    roundOff: summary.roundOff,
    grandTotal: summary.roundedGrandTotal,
    amountInWords: summary.grandTotalWords
  }

  // Assert essential backend-verified fields are present and valid
  assert.equal(invoicePayload.items.length, 1)
  assert.equal(invoicePayload.items[0].qty, 2)
  assert.equal(invoicePayload.items[0].rate, 450)
  assert.equal(invoicePayload.subtotal, 900)
  assert.equal(invoicePayload.discountAmount, 90)
  assert.equal(invoicePayload.grandTotal, 956)
  assert.ok(invoicePayload.customerName)
  assert.ok(invoicePayload.buyerDetails.gstin)
  assert.equal(invoicePayload.paymentMode, 'Cash')
})

test('Integration Audit 3: Counter KPI statistics aggregation accurately filters by reference date', () => {
  const referenceDate = new Date('2026-10-29T10:00:00.000Z')

  const sampleInvoices = [
    {
      invoiceNo: 'SAM MDU01 0101',
      date: '2026-10-29T04:15:00.000Z', // Same day
      grandTotal: 1062,
      totalGst: 162
    },
    {
      invoiceNo: 'SAM MDU01 0102',
      date: '2026-10-29T08:30:00.000Z', // Same day
      grandTotal: 531,
      totalGst: 81
    },
    {
      invoiceNo: 'SAM MDU01 0099',
      date: '2026-10-28T14:00:00.000Z', // Previous day
      grandTotal: 2360,
      totalGst: 360
    },
    {
      invoiceNo: 'SAM MDU01 0000',
      date: null, // Malformed/missing date
      grandTotal: 500,
      totalGst: 50
    }
  ]

  const stats = computeTodayStats(sampleInvoices, referenceDate)

  // 1062 + 531 = 1593; total GST = 162 + 81 = 243; 2 transactions
  assert.equal(stats.transactions, 2)
  assert.equal(stats.sales, 1593)
  assert.equal(stats.gst, 243)

  const formatted = formatBillingStats(stats)
  assert.equal(formatted.transactionsFormatted, '2')
  assert.equal(formatted.salesFormatted, '₹1,593')
  assert.equal(formatted.gstFormatted, '₹243')
})

test('Integration Audit 4: Recent invoices formatting safely handles partial or missing record fields', () => {
  const malformedInvoices = [
    { id: 'inv-1', invoiceNo: 'INV-01', date: '2026-10-29', paymentMode: 'UPI', totalGst: 180, grandTotal: 1180 },
    { id: 'inv-2', paymentMode: 'Credit Purchase', totalGst: 'invalid', grandTotal: null },
    null,
    undefined
  ]

  const formattedRows = prepareRecentInvoices(malformedInvoices, 5)

  assert.equal(formattedRows.length, 4)
  assert.equal(formattedRows[0].badgeClass, 'badge-blue')
  assert.equal(formattedRows[0].grandTotal, 1180)

  // Malformed row 2 handles fallback values
  assert.equal(formattedRows[1].badgeClass, 'badge-purple')
  assert.equal(formattedRows[1].totalGst, 0)
  assert.equal(formattedRows[1].grandTotal, 0)
  assert.equal(formattedRows[1].customerName, 'Walk-in')

  // Null/undefined entries handle fallbacks
  assert.equal(formattedRows[2].customerName, 'Walk-in')
  assert.equal(formattedRows[2].badgeClass, 'badge-green')
})
