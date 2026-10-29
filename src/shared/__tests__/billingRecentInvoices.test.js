// Unit and regression tests for Billing Recent Invoices logic and RecentInvoicesCard model
// Batch 21: Safe Billing POS Modularization — Phase 1

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getPaymentBadgeClass,
  formatRecentInvoiceRow,
  prepareRecentInvoices
} from '../billingInvoices.js'
import { formatCurrency, formatShortDate } from '../../utils/formatters.js'

test('getPaymentBadgeClass maps payment modes to correct badge CSS classes', () => {
  assert.equal(getPaymentBadgeClass('Credit Purchase'), 'badge-purple')
  assert.equal(getPaymentBadgeClass('UPI'), 'badge-blue')
  assert.equal(getPaymentBadgeClass('Bank Transfer'), 'badge-teal')
  assert.equal(getPaymentBadgeClass('Cash'), 'badge-green')

  // Default / fallback cases
  assert.equal(getPaymentBadgeClass(''), 'badge-green')
  assert.equal(getPaymentBadgeClass(null), 'badge-green')
  assert.equal(getPaymentBadgeClass(undefined), 'badge-green')
  assert.equal(getPaymentBadgeClass('Cheque'), 'badge-green')
})

test('formatRecentInvoiceRow standardizes complete invoice records', () => {
  const raw = {
    id: 'inv_101',
    invoiceNo: 'SAM-ERD-0042',
    date: '2026-10-28T10:30:00.000Z',
    customerName: 'Kavitha Raman',
    paymentMode: 'UPI',
    totalGst: 180,
    grandTotal: 1180,
    storeId: 'store_001'
  }

  const row = formatRecentInvoiceRow(raw)

  assert.equal(row.id, 'inv_101')
  assert.equal(row.invoiceNo, 'SAM-ERD-0042')
  assert.equal(row.customerName, 'Kavitha Raman')
  assert.equal(row.paymentMode, 'UPI')
  assert.equal(row.badgeClass, 'badge-blue')
  assert.equal(row.totalGst, 180)
  assert.equal(row.totalGstFormatted, formatCurrency(180))
  assert.equal(row.grandTotal, 1180)
  assert.equal(row.grandTotalFormatted, formatCurrency(1180))
  assert.equal(row.date, formatShortDate(raw.date))
  assert.equal(row.rawInvoice, raw)
})

test('formatRecentInvoiceRow applies robust fallbacks for missing/partial data', () => {
  // Missing invoiceNo falls back to id, then _id, then N/A
  const withIdOnly = formatRecentInvoiceRow({ id: 'id_99' })
  assert.equal(withIdOnly.invoiceNo, 'id_99')

  const withMongoIdOnly = formatRecentInvoiceRow({ _id: 'mongo_77' })
  assert.equal(withMongoIdOnly.invoiceNo, 'mongo_77')

  const completelyEmpty = formatRecentInvoiceRow({})
  assert.equal(completelyEmpty.invoiceNo, 'N/A')
  assert.equal(completelyEmpty.customerName, 'Walk-in')
  assert.equal(completelyEmpty.paymentMode, 'Cash')
  assert.equal(completelyEmpty.badgeClass, 'badge-green')
  assert.equal(completelyEmpty.totalGst, 0)
  assert.equal(completelyEmpty.grandTotal, 0)
  assert.equal(completelyEmpty.date, 'N/A')

  // Whitespace-only values fall back to defaults
  const withWhitespace = formatRecentInvoiceRow({
    customerName: '   ',
    paymentMode: '   ',
    invoiceNo: ''
  })
  assert.equal(withWhitespace.customerName, 'Walk-in')
  assert.equal(withWhitespace.paymentMode, 'Cash')
})

test('prepareRecentInvoices slices records to the specified limit and formats each item', () => {
  const history = Array.from({ length: 25 }, (_, idx) => ({
    id: `inv_${idx + 1}`,
    invoiceNo: `SAM-${String(idx + 1).padStart(4, '0')}`,
    date: '2026-10-28',
    customerName: `Customer ${idx + 1}`,
    paymentMode: idx % 2 === 0 ? 'Cash' : 'Credit Purchase',
    totalGst: 50 * (idx + 1),
    grandTotal: 300 * (idx + 1)
  }))

  // Default limit is 10
  const defaultList = prepareRecentInvoices(history)
  assert.equal(defaultList.length, 10)
  assert.equal(defaultList[0].invoiceNo, 'SAM-0001')
  assert.equal(defaultList[9].invoiceNo, 'SAM-0010')

  // Custom limit (e.g., 5)
  const fiveList = prepareRecentInvoices(history, 5)
  assert.equal(fiveList.length, 5)
  assert.equal(fiveList[4].invoiceNo, 'SAM-0005')

  // Limit larger than array size returns all elements
  const allList = prepareRecentInvoices(history.slice(0, 3), 10)
  assert.equal(allList.length, 3)

  // Non-array inputs return safe empty array
  assert.deepEqual(prepareRecentInvoices(null), [])
  assert.deepEqual(prepareRecentInvoices(undefined), [])
  assert.deepEqual(prepareRecentInvoices('not an array'), [])
})

test('Card action dispatch contract: simulated onViewInvoice and onRefresh', () => {
  let refreshed = false
  let viewedInvoice = null

  const onRefresh = () => { refreshed = true }
  const onViewInvoice = (inv) => { viewedInvoice = inv }

  const sample = { id: 'inv_view_1', invoiceNo: 'SAM-0999', grandTotal: 2500 }
  const prepared = prepareRecentInvoices([sample])

  // Simulate view click
  onViewInvoice(prepared[0].rawInvoice)
  assert.deepEqual(viewedInvoice, sample)

  // Simulate refresh click
  onRefresh()
  assert.equal(refreshed, true)
})
