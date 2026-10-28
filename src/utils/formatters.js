/**
 * Sathyam Agro Mart — Centralized Formatting Utilities
 * Standardizes currency, date, and number representations across all portals.
 * Enforces Indian English (en-IN) locale conventions.
 */

/**
 * Format a number or numeric string as Indian Rupees.
 * @param {number|string|null|undefined} amount - Numeric value to format
 * @param {object} [options]
 * @param {boolean} [options.showSymbol=true] - Whether to prepend the ₹ symbol
 * @param {number} [options.maximumFractionDigits=2] - Maximum decimal digits
 * @returns {string} Formatted currency string (e.g., '₹1,450' or '₹12.50')
 */
export function formatCurrency(amount, { showSymbol = true, maximumFractionDigits = 2 } = {}) {
  const num = Number(amount || 0);
  if (isNaN(num)) return showSymbol ? '₹0' : '0';

  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Alias for formatCurrency that returns formatted string with ₹ symbol.
 */
export const rupees = (amount) => formatCurrency(amount, { showSymbol: true });

/**
 * Format a number with Indian grouping (e.g., 1,23,456).
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  const num = Number(value || 0);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
}

/**
 * Format a Date, timestamp, or ISO string into localized date string.
 * @param {string|number|Date|null|undefined} dateInput - The date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Custom Intl format options
 * @param {string} [fallback='—'] - Fallback text if date is missing or invalid
 * @returns {string} Formatted date (e.g., '28 Oct 2026')
 */
export function formatDate(
  dateInput,
  options = { day: 'numeric', month: 'short', year: 'numeric' },
  fallback = '—'
) {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-IN', options);
  } catch {
    return fallback;
  }
}

/**
 * Format as a short date (e.g., '28 Oct 2026').
 */
export function formatShortDate(dateInput, fallback = '—') {
  return formatDate(dateInput, { day: 'numeric', month: 'short', year: 'numeric' }, fallback);
}

/**
 * Format as date and time (e.g., '28 Oct 2026, 03:45 PM').
 */
export function formatDateTime(dateInput, fallback = '—') {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

/**
 * Extract YYYY-MM-DD ISO date safely.
 */
export function toISODate(dateInput, fallback = '') {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().slice(0, 10);
  } catch {
    return fallback;
  }
}
