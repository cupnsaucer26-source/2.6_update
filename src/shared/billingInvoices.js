import { formatCurrency, formatShortDate } from '../utils/formatters.js'

/**
 * Maps invoice payment mode to appropriate badge CSS class.
 *
 * @param {string} paymentMode
 * @returns {string} badge CSS class
 */
export function getPaymentBadgeClass(paymentMode) {
  if (paymentMode === 'Credit Purchase') return 'badge-purple'
  if (paymentMode === 'UPI') return 'badge-blue'
  if (paymentMode === 'Bank Transfer') return 'badge-teal'
  return 'badge-green'
}

/**
 * Normalizes and formats an invoice record for display in recent invoices table.
 * Ensures consistent fallbacks, formatting, and prevents leaking unneeded sensitive fields.
 *
 * @param {Object} inv Raw invoice object
 * @returns {Object} Normalized invoice row view model
 */
export function formatRecentInvoiceRow(inv = {}) {
  const item = inv || {}
  const invoiceId = item.invoiceNo || item.id || item._id || 'N/A'
  const dateFormatted = item.date ? formatShortDate(item.date) : 'N/A'
  const customerName = (item.customerName || '').trim() || 'Walk-in'
  const paymentMode = (item.paymentMode || '').trim() || 'Cash'
  const badgeClass = getPaymentBadgeClass(paymentMode)
  const totalGst = Number.isFinite(Number(item.totalGst)) ? Number(item.totalGst) : 0
  const grandTotal = Number.isFinite(Number(item.grandTotal)) ? Number(item.grandTotal) : 0

  return {
    id: item.id || item._id || invoiceId,
    invoiceNo: invoiceId,
    date: dateFormatted,
    rawDate: item.date,
    customerName,
    paymentMode,
    badgeClass,
    totalGst,
    totalGstFormatted: formatCurrency(totalGst),
    grandTotal,
    grandTotalFormatted: formatCurrency(grandTotal),
    rawInvoice: item
  }
}

/**
 * Slices and normalizes recent invoice history list.
 *
 * @param {Array} history Raw invoice history array
 * @param {number} limit Maximum records to return (defaults to 10)
 * @returns {Array} Normalized array of invoice rows
 */
export function prepareRecentInvoices(history = [], limit = 10) {
  if (!Array.isArray(history)) return []
  return history.slice(0, Math.max(0, limit)).map(formatRecentInvoiceRow)
}

/**
 * Formats daily billing KPI statistics into display-ready strings.
 *
 * @param {Object} todayStats Object with { sales, transactions, gst }
 * @returns {Object} Formatted stats with numeric values and formatted strings
 */
export function formatBillingStats(todayStats = {}) {
  const stats = todayStats || {}
  const toSafeNum = (val) => {
    const num = Number(val)
    return Number.isFinite(num) ? num : 0
  }
  const sales = toSafeNum(stats.sales)
  const transactions = toSafeNum(stats.transactions)
  const gst = toSafeNum(stats.gst)

  return {
    sales,
    transactions,
    gst,
    salesFormatted: `₹${sales.toLocaleString('en-IN')}`,
    transactionsFormatted: transactions.toLocaleString('en-IN'),
    gstFormatted: `₹${gst.toLocaleString('en-IN')}`
  }
}

/**
 * Computes today's POS KPI aggregates from an invoice list.
 *
 * @param {Array} invoices Raw invoice list
 * @param {Date|string} [referenceDate=new Date()] Reference date to compare against
 * @returns {{ sales: number, transactions: number, gst: number }}
 */
export function computeTodayStats(invoices = [], referenceDate = new Date()) {
  if (!Array.isArray(invoices)) return { sales: 0, transactions: 0, gst: 0 }
  const refDateStr = new Date(referenceDate).toDateString()
  const todayInvoices = invoices.filter(inv => {
    if (!inv || !inv.date) return false
    const parsed = new Date(inv.date)
    return !isNaN(parsed.getTime()) && parsed.toDateString() === refDateStr
  })
  const toSafeNum = (val) => {
    const num = Number(val)
    return Number.isFinite(num) ? num : 0
  }
  const sales = todayInvoices.reduce((s, inv) => s + toSafeNum(inv.grandTotal), 0)
  const gst = todayInvoices.reduce((s, inv) => s + toSafeNum(inv.totalGst), 0)
  return { sales, transactions: todayInvoices.length, gst }
}
