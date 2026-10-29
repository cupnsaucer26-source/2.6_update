import { numberToIndianWords } from '../utils/numberToWords.js'

/**
 * Calculates items subtotal from a list of bill items.
 *
 * @param {Array} items List of bill line items
 * @returns {number} Sum of item amounts (unrounded raw sum matching Dashboard.jsx)
 */
export function calculateItemsSubtotal(items = []) {
  if (!Array.isArray(items)) return 0
  const sum = items.reduce((total, item) => {
    const amount = Number(item?.amount)
    return total + (Number.isFinite(amount) ? amount : 0)
  }, 0)
  return +(sum.toFixed(2))
}

/**
 * Calculates manual discount amount from subtotal and percentage.
 * Clamps percentage between 0 and 100.
 *
 * @param {number} itemsSubtotal
 * @param {number} globalDiscountPercent
 * @returns {number} Rounded integer discount amount
 */
export function calculateManualDiscount(itemsSubtotal = 0, globalDiscountPercent = 0) {
  const subtotal = Number(itemsSubtotal) || 0
  const safePercent = Math.min(100, Math.max(0, Number(globalDiscountPercent) || 0))
  return Math.round(subtotal * (safePercent / 100))
}

/**
 * Calculates taxable subtotal after applying total discount.
 * Ensures the result is never negative.
 *
 * @param {number} itemsSubtotal
 * @param {number} totalDiscount
 * @returns {number}
 */
export function calculateTaxableSubtotal(itemsSubtotal = 0, totalDiscount = 0) {
  const subtotal = Number(itemsSubtotal) || 0
  const discount = Math.max(0, Number(totalDiscount) || 0)
  return +(Math.max(0, subtotal - discount).toFixed(2))
}

/**
 * Calculates proportional GST tax breakdown (CGST, SGST, total GST) across bill items.
 * Shares total discount proportionally across lines by item amount.
 *
 * @param {Array} items List of bill line items
 * @param {number} itemsSubtotal
 * @param {number} totalDiscount
 * @returns {{ totalCgst: number, totalSgst: number, totalGst: number }}
 */
export function calculateTaxBreakdown(items = [], itemsSubtotal = 0, totalDiscount = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return { totalCgst: 0, totalSgst: 0, totalGst: 0 }
  }

  const subtotal = Number(itemsSubtotal) || 0
  const discount = Math.max(0, Number(totalDiscount) || 0)

  let totalCgst = 0
  let totalSgst = 0

  items.forEach(item => {
    const itemAmount = Number(item?.amount) || 0
    const ratio = subtotal > 0 ? itemAmount / subtotal : 0
    const lineTaxable = Math.max(0, itemAmount - discount * ratio)

    const rawGst = Number(item?.gstRate)
    const effectiveGst = Number.isFinite(rawGst) ? rawGst : 18

    const cgstRate = Number.isFinite(Number(item?.cgstRate))
      ? Number(item.cgstRate)
      : +(effectiveGst / 2).toFixed(2)
    const sgstRate = Number.isFinite(Number(item?.sgstRate))
      ? Number(item.sgstRate)
      : +(effectiveGst / 2).toFixed(2)

    totalCgst += lineTaxable * (cgstRate / 100)
    totalSgst += lineTaxable * (sgstRate / 100)
  })

  totalCgst = +(totalCgst.toFixed(2))
  totalSgst = +(totalSgst.toFixed(2))
  const totalGst = +(totalCgst + totalSgst).toFixed(2)

  return { totalCgst, totalSgst, totalGst }
}

/**
 * Calculates raw grand total, rounded grand total, and round-off adjustment.
 *
 * @param {number} taxableSubtotal
 * @param {number} totalGst
 * @returns {{ rawGrandTotal: number, roundedGrandTotal: number, roundOff: number }}
 */
export function calculateRoundOff(taxableSubtotal = 0, totalGst = 0) {
  const rawGrandTotal = (Number(taxableSubtotal) || 0) + (Number(totalGst) || 0)
  const roundedGrandTotal = Math.round(rawGrandTotal)
  const roundOff = +(roundedGrandTotal - rawGrandTotal).toFixed(2)

  return {
    rawGrandTotal: +(rawGrandTotal.toFixed(2)),
    roundedGrandTotal,
    roundOff
  }
}

/**
 * Computes full billing summary calculations for POS billing.
 * Replicates exact calculation order and rounding semantics from Dashboard.jsx.
 *
 * @param {Object} params
 * @param {Array} params.items
 * @param {number} params.globalDiscountPercent
 * @param {number} params.couponDiscountAmount
 * @returns {Object} Full financial summary object
 */
export function calculateBillingSummary({
  items = [],
  globalDiscountPercent = 0,
  couponDiscountAmount = 0
} = {}) {
  const safeItems = Array.isArray(items) ? items : []
  const itemsSubtotal = calculateItemsSubtotal(safeItems)
  const manualDiscAmt = calculateManualDiscount(itemsSubtotal, globalDiscountPercent)
  const safeCouponDiscount = Math.max(0, Number(couponDiscountAmount) || 0)
  const totalDiscount = manualDiscAmt + safeCouponDiscount
  const taxableSubtotal = calculateTaxableSubtotal(itemsSubtotal, totalDiscount)

  const { totalCgst, totalSgst, totalGst } = calculateTaxBreakdown(safeItems, itemsSubtotal, totalDiscount)
  const { rawGrandTotal, roundedGrandTotal, roundOff } = calculateRoundOff(taxableSubtotal, totalGst)

  const grandTotalWords = numberToIndianWords(roundedGrandTotal)
  const taxWords = numberToIndianWords(totalGst)

  return {
    itemsSubtotal,
    manualDiscAmt,
    couponDiscountAmount: safeCouponDiscount,
    totalDiscount,
    taxableSubtotal,
    totalCgst,
    totalSgst,
    totalGst,
    rawGrandTotal,
    roundedGrandTotal,
    roundOff,
    grandTotalWords,
    taxWords
  }
}

/**
 * Formats billing summary numeric fields into standard Indian currency strings for display.
 *
 * @param {Object} summary Summary object from calculateBillingSummary
 * @returns {Object} Formatted display strings
 */
export function formatBillingSummary(summary = {}) {
  const s = summary || {}
  const toNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0
  const subtotal = toNum(s.itemsSubtotal)
  const manualDisc = toNum(s.manualDiscAmt)
  const couponDisc = toNum(s.couponDiscountAmount)
  const taxable = toNum(s.taxableSubtotal)
  const cgst = toNum(s.totalCgst)
  const sgst = toNum(s.totalSgst)
  const roundOff = toNum(s.roundOff)
  const grandTotal = toNum(s.roundedGrandTotal)

  return {
    subtotalFormatted: `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    manualDiscAmtFormatted: `-₹${manualDisc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    couponDiscountFormatted: `-₹${couponDisc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    taxableSubtotalFormatted: `₹${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    totalCgstFormatted: `+₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    totalSgstFormatted: `+₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    roundOffFormatted: roundOff !== 0
      ? (roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`)
      : '₹0.00',
    grandTotalFormatted: `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }
}
