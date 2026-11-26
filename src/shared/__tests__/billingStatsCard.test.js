// Unit and regression tests for Billing Stats Card and calculation logic
// Batch 24: Billing Dashboard Architecture Audit & Safe Modularization — Phase 3

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatBillingStats,
  computeTodayStats
} from '../billingInvoices.js'

test('formatBillingStats standardizes KPI values to Indian currency and count strings', () => {
  const stats = { sales: 4130, transactions: 3, gst: 630 }
  const formatted = formatBillingStats(stats)

  assert.equal(formatted.sales, 4130)
  assert.equal(formatted.transactions, 3)
  assert.equal(formatted.gst, 630)
  assert.equal(formatted.salesFormatted, '₹4,130')
  assert.equal(formatted.transactionsFormatted, '3')
  assert.equal(formatted.gstFormatted, '₹630')

  // Zero values
  const zeroStats = formatBillingStats({ sales: 0, transactions: 0, gst: 0 })
  assert.equal(zeroStats.salesFormatted, '₹0')
  assert.equal(zeroStats.transactionsFormatted, '0')
  assert.equal(zeroStats.gstFormatted, '₹0')

  // Large values with Indian thousand grouping (e.g. 12,50,000)
  const largeStats = formatBillingStats({ sales: 1250000, transactions: 1500, gst: 225000 })
  assert.equal(largeStats.salesFormatted, '₹12,50,000')
  assert.equal(largeStats.transactionsFormatted, '1,500')
  assert.equal(largeStats.gstFormatted, '₹2,25,000')
})

test('formatBillingStats handles missing, undefined, null, or non-numeric inputs safely', () => {
  // Null and undefined fallbacks
  const fromNull = formatBillingStats(null)
  assert.equal(fromNull.sales, 0)
  assert.equal(fromNull.transactions, 0)
  assert.equal(fromNull.gst, 0)
  assert.equal(fromNull.salesFormatted, '₹0')

  const fromUndefined = formatBillingStats(undefined)
  assert.equal(fromUndefined.sales, 0)
  assert.equal(fromUndefined.transactionsFormatted, '0')

  const fromEmpty = formatBillingStats({})
  assert.equal(fromEmpty.sales, 0)
  assert.equal(fromEmpty.gstFormatted, '₹0')

  // String coercion
  const fromStrings = formatBillingStats({ sales: '500', transactions: '4', gst: '90' })
  assert.equal(fromStrings.sales, 500)
  assert.equal(fromStrings.transactions, 4)
  assert.equal(fromStrings.gst, 90)
  assert.equal(fromStrings.salesFormatted, '₹500')

  // Invalid values fallback to 0
  const fromInvalid = formatBillingStats({ sales: 'not-a-number', gst: null })
  assert.equal(fromInvalid.sales, 0)
  assert.equal(fromInvalid.salesFormatted, '₹0')
})

test('computeTodayStats aggregates sales, transactions, and gst for invoices matching reference date', () => {
  const refDate = new Date('2026-10-28T10:00:00.000Z')

  const mockInvoices = [
    {
      id: 'inv-1',
      date: '2026-10-28T09:15:00.000Z',
      grandTotal: 1180,
      totalGst: 180
    },
    {
      id: 'inv-2',
      date: '2026-10-28T11:45:00.000Z',
      grandTotal: 590,
      totalGst: 90
    },
    {
      id: 'inv-3',
      date: '2026-10-28T14:30:00.000Z',
      grandTotal: 2360,
      totalGst: 360
    },
    // Past date (yesterday)
    {
      id: 'inv-4',
      date: '2026-10-27T16:00:00.000Z',
      grandTotal: 5000,
      totalGst: 900
    }
  ]

  const aggregated = computeTodayStats(mockInvoices, refDate)

  assert.equal(aggregated.transactions, 3, 'Counts only invoices matching refDate')
  assert.equal(aggregated.sales, 4130, 'Sums 1180 + 590 + 2360 = 4130')
  assert.equal(aggregated.gst, 630, 'Sums 180 + 90 + 360 = 630')
})

test('computeTodayStats excludes multi-day records and handles partial/empty datasets safely', () => {
  const refDate = new Date('2026-10-28T10:00:00.000Z')

  // Empty list
  assert.deepEqual(computeTodayStats([], refDate), { sales: 0, transactions: 0, gst: 0 })

  // Non-array inputs
  assert.deepEqual(computeTodayStats(null, refDate), { sales: 0, transactions: 0, gst: 0 })
  assert.deepEqual(computeTodayStats(undefined, refDate), { sales: 0, transactions: 0, gst: 0 })
  assert.deepEqual(computeTodayStats('not-an-array', refDate), { sales: 0, transactions: 0, gst: 0 })

  // Partial / malformed invoice records
  const mixedInvoices = [
    null,
    {},
    { id: 'inv-missing-date', grandTotal: 100 },
    { id: 'inv-invalid-date', date: 'not-a-date', grandTotal: 200 },
    { id: 'inv-valid', date: '2026-10-28T08:00:00.000Z', grandTotal: '1500', totalGst: 250 }
  ]

  const result = computeTodayStats(mixedInvoices, refDate)
  assert.equal(result.transactions, 1)
  assert.equal(result.sales, 1500)
  assert.equal(result.gst, 250)
})

test('BillingStatsCard contract and view model simulation', () => {
  // Simulate view model creation from raw todayStats
  const rawStats = { sales: 4130, transactions: 3, gst: 630 }
  const viewModel = formatBillingStats(rawStats)

  // Verify view model contract required by UI cards:
  // Card 1: Today's Sales (green)
  const salesCard = {
    color: 'green',
    label: "Today's Sales",
    value: viewModel.salesFormatted
  }
  assert.equal(salesCard.value, '₹4,130')

  // Card 2: Invoices Today (blue)
  const txCard = {
    color: 'blue',
    label: 'Invoices Today',
    value: viewModel.transactionsFormatted
  }
  assert.equal(txCard.value, '3')

  // Card 3: GST Tax Collected (purple)
  const gstCard = {
    color: 'purple',
    label: 'GST Tax Collected',
    value: viewModel.gstFormatted
  }
  assert.equal(gstCard.value, '₹630')
})
