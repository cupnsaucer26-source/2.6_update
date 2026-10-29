/**
 * Formats a monetary unit rate as standard Indian currency with 2 decimal places.
 *
 * @param {number|string} rate
 * @returns {string} e.g. "₹450.00"
 */
export function formatItemRate(rate) {
  const num = Number(rate)
  const valid = Number.isFinite(num) ? num : 0
  return `₹${valid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

/**
 * Checks whether an item quantity can be decremented without dropping below the minimum of 1.
 *
 * @param {number|string} qty
 * @returns {boolean}
 */
export function canDecrementQty(qty) {
  return Number(qty) > 1
}

/**
 * Calculates line amount after percentage discount.
 *
 * @param {number} qty
 * @param {number} rate
 * @param {number} discPercent
 * @returns {number}
 */
export function calculateItemAmount(qty, rate, discPercent = 0) {
  const safeQty = Math.max(1, Number(qty) || 1)
  const safeRate = Math.max(0, Number(rate) || 0)
  const safeDisc = Math.min(100, Math.max(0, Number(discPercent) || 0))
  return +(safeQty * safeRate * (1 - safeDisc / 100)).toFixed(2)
}

/**
 * Normalizes a bill item for safe table rendering with fallbacks for partial/missing fields.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
export function normalizeBillItem(item = {}, index = 0) {
  const id = item.id || `item-${index + 1}`
  const name = (item.name || '').trim() || 'Product'
  const batch = (item.batch || '').trim() || 'Primary Batch'
  const unit = (item.unit || '').trim() || 'Nos'
  const hsnCode = (item.hsnCode || '').trim() || '31010099'
  const rate = Number(item.rate) || 0
  const qty = Math.max(1, Number(item.qty) || 1)
  const discPercent = Math.max(0, Number(item.discPercent) || 0)
  const rawGst = Number(item.gstRate)
  const gstRate = Number.isFinite(rawGst) ? rawGst : 18
  const amount = Number(item.amount ?? (qty * rate * (1 - discPercent / 100)))

  return {
    ...item,
    id,
    name,
    batch,
    unit,
    hsnCode,
    rate,
    rateFormatted: formatItemRate(rate),
    qty,
    canDecrement: canDecrementQty(qty),
    discPercent,
    gstRate,
    amount,
    index: index + 1
  }
}
