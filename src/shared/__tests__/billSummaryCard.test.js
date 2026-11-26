// Unit and regression tests for BillSummaryCard contract and model
// Batch 26: BillSummaryCard UI Extraction — Phase 4

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBillingSummary } from '../billingSummary.js'
import { formatCurrency } from '../../utils/formatters.js'

test('BillSummaryCard view model resolves summary props with resilient fallbacks', () => {
  // 1. Fully populated summary object
  const fullSummary = {
    itemsSubtotal: 1500,
    manualDiscAmt: 150,
    couponDiscountAmount: 50,
    taxableSubtotal: 1300,
    totalCgst: 117,
    totalSgst: 117,
    roundOff: -0.35,
    roundedGrandTotal: 1534,
    grandTotalWords: 'Indian Rupee One Thousand Five Hundred Thirty Four Only'
  }

  const formatted = formatBillingSummary(fullSummary)
  assert.equal(formatted.subtotalFormatted, '₹1,500.00')
  assert.equal(formatted.manualDiscAmtFormatted, '-₹150.00')
  assert.equal(formatted.couponDiscountFormatted, '-₹50.00')
  assert.equal(formatted.taxableSubtotalFormatted, '₹1,300.00')
  assert.equal(formatted.totalCgstFormatted, '+₹117.00')
  assert.equal(formatted.totalSgstFormatted, '+₹117.00')
  assert.equal(formatted.roundOffFormatted, '-₹0.35')
  assert.equal(formatted.grandTotalFormatted, '₹1,534.00')

  // 2. Safe fallbacks for empty/null summary
  const emptyFormatted = formatBillingSummary(null)
  assert.equal(emptyFormatted.subtotalFormatted, '₹0.00')
  assert.equal(emptyFormatted.manualDiscAmtFormatted, '-₹0.00')
  assert.equal(emptyFormatted.couponDiscountFormatted, '-₹0.00')
  assert.equal(emptyFormatted.taxableSubtotalFormatted, '₹0.00')
  assert.equal(emptyFormatted.totalCgstFormatted, '+₹0.00')
  assert.equal(emptyFormatted.totalSgstFormatted, '+₹0.00')
  assert.equal(emptyFormatted.roundOffFormatted, '₹0.00')
  assert.equal(emptyFormatted.grandTotalFormatted, '₹0.00')
})

test('BillSummaryCard disabled button contract verifies empty bill guards', () => {
  function computeButtonState(items, itemsCount) {
    const count = Number.isFinite(itemsCount)
      ? itemsCount
      : (Array.isArray(items) ? items.length : 0)
    return {
      count,
      isBillEmpty: count === 0,
      buttonsDisabled: count === 0
    }
  }

  // Empty bill
  assert.deepEqual(computeButtonState([], 0), { count: 0, isBillEmpty: true, buttonsDisabled: true })
  assert.deepEqual(computeButtonState([], undefined), { count: 0, isBillEmpty: true, buttonsDisabled: true })
  assert.deepEqual(computeButtonState(null, 0), { count: 0, isBillEmpty: true, buttonsDisabled: true })

  // Non-empty bill
  assert.deepEqual(computeButtonState([{ id: 'itm_1' }], 1), { count: 1, isBillEmpty: false, buttonsDisabled: false })
  assert.deepEqual(computeButtonState([{ id: 'itm_1' }, { id: 'itm_2' }], undefined), { count: 2, isBillEmpty: false, buttonsDisabled: false })
})

test('BillSummaryCard coupon view model contracts: applied vs unapplied vs validating', () => {
  function getCouponViewModel({ appliedCoupon, couponDiscountAmount, validatingCoupon, couponCodeInput }) {
    if (appliedCoupon) {
      return {
        mode: 'applied',
        code: appliedCoupon.code,
        savedText: `Saved ${formatCurrency(couponDiscountAmount)}`,
        canRemove: true
      }
    }
    return {
      mode: 'input',
      inputCode: (couponCodeInput || '').toUpperCase(),
      applyButtonLabel: validatingCoupon ? '…' : 'Apply',
      applyDisabled: Boolean(validatingCoupon)
    }
  }

  // 1. Unapplied, ready for input
  const unapplied = getCouponViewModel({
    appliedCoupon: null,
    couponDiscountAmount: 0,
    validatingCoupon: false,
    couponCodeInput: 'save10'
  })
  assert.equal(unapplied.mode, 'input')
  assert.equal(unapplied.inputCode, 'SAVE10')
  assert.equal(unapplied.applyButtonLabel, 'Apply')
  assert.equal(unapplied.applyDisabled, false)

  // 2. Validating in progress
  const validating = getCouponViewModel({
    appliedCoupon: null,
    couponDiscountAmount: 0,
    validatingCoupon: true,
    couponCodeInput: 'KVK50'
  })
  assert.equal(validating.mode, 'input')
  assert.equal(validating.applyButtonLabel, '…')
  assert.equal(validating.applyDisabled, true)

  // 3. Coupon applied
  const applied = getCouponViewModel({
    appliedCoupon: { code: 'SAMFARM50', discount: 250 },
    couponDiscountAmount: 250,
    validatingCoupon: false,
    couponCodeInput: ''
  })
  assert.equal(applied.mode, 'applied')
  assert.equal(applied.code, 'SAMFARM50')
  assert.equal(applied.savedText, 'Saved ₹250')
  assert.equal(applied.canRemove, true)
})

test('BillSummaryCard manual discount bounds handling enforces 0 to 100 range', () => {
  const clampDiscount = (val) => Math.min(100, Math.max(0, Number(val) || 0))

  assert.equal(clampDiscount(0), 0)
  assert.equal(clampDiscount(15), 15)
  assert.equal(clampDiscount(100), 100)

  // Below 0 clamped to 0
  assert.equal(clampDiscount(-10), 0)
  assert.equal(clampDiscount(-0.5), 0)

  // Above 100 clamped to 100
  assert.equal(clampDiscount(105), 100)
  assert.equal(clampDiscount(250), 100)

  // Non-numeric fallback to 0
  assert.equal(clampDiscount('abc'), 0)
  assert.equal(clampDiscount(null), 0)
})

test('BillSummaryCard action dispatch contract simulation', () => {
  const dispatchedEvents = []

  const props = {
    handleSaveAndPrintInvoice: () => dispatchedEvents.push('save_and_print'),
    handlePreviewCurrentBill: () => dispatchedEvents.push('preview_bill'),
    applyCoupon: () => dispatchedEvents.push('apply_coupon'),
    removeCoupon: () => dispatchedEvents.push('remove_coupon'),
    setGlobalDiscountPercent: (val) => dispatchedEvents.push(`discount_${val}`)
  }

  // Simulate user actions
  props.applyCoupon()
  props.removeCoupon()
  props.setGlobalDiscountPercent(10)
  props.handlePreviewCurrentBill()
  props.handleSaveAndPrintInvoice()

  assert.deepEqual(dispatchedEvents, [
    'apply_coupon',
    'remove_coupon',
    'discount_10',
    'preview_bill',
    'save_and_print'
  ])
})
