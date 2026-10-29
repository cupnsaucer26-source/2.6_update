import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  rupees,
  formatNumber,
  formatDate,
  formatShortDate,
  formatDateTime,
  toISODate,
} from '../../src/utils/formatters.js';

test('Formatters: Currency formatting', () => {
  assert.equal(formatCurrency(0), '₹0');
  assert.equal(formatCurrency(null), '₹0');
  assert.equal(formatCurrency(undefined), '₹0');
  assert.equal(formatCurrency(NaN), '₹0');
  assert.equal(formatCurrency(1500), '₹1,500');
  assert.equal(formatCurrency('1500'), '₹1,500');
  assert.equal(formatCurrency(150000), '₹1,50,000');
  assert.equal(formatCurrency(12.5), '₹12.50');
  assert.equal(formatCurrency(1500, { showSymbol: false }), '1,500');
  assert.equal(rupees(2500), '₹2,500');

  // Negative currency formatting tests (Task 6.1)
  assert.equal(formatCurrency(-50), '-₹50');
  assert.equal(formatCurrency(-50, { showSymbol: false }), '-50');
  assert.equal(formatCurrency(-1500), '-₹1,500');
  assert.equal(formatCurrency(-1500.5), '-₹1,500.50');
  assert.equal(rupees(-100), '-₹100');
});

test('Formatters: Number formatting', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(null), '0');
  assert.equal(formatNumber(undefined), '0');
  assert.equal(formatNumber(1000000), '10,00,000');
  assert.equal(formatNumber('54321'), '54,321');
});

test('Formatters: Date formatting', () => {
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate(undefined), '—');
  assert.equal(formatDate('invalid-date'), '—');
  assert.equal(formatDate('invalid-date', {}, 'N/A'), 'N/A');

  const fixedDate = new Date('2026-10-28T12:00:00Z');
  const formatted = formatDate(fixedDate);
  assert.match(formatted, /28/);
  assert.match(formatted, /Oct/i);
  assert.match(formatted, /2026/);

  const short = formatShortDate(fixedDate);
  assert.match(short, /28/);
  assert.match(short, /Oct/i);
  assert.doesNotMatch(short, /2026/);

  // Timezone test: UTC 19:00 on Oct 28 is 00:30 on Oct 29 in Asia/Kolkata (IST)
  const midnightTransition = new Date('2026-10-28T19:00:00Z');
  const istDate = formatDate(midnightTransition);
  assert.match(istDate, /29/);
  assert.match(istDate, /Oct/i);

  // Date-only string test (YYYY-MM-DD): safe parsing in IST
  const dateOnly = formatDate('2026-10-28');
  assert.match(dateOnly, /28/);
  assert.match(dateOnly, /Oct/i);
  assert.match(dateOnly, /2026/);
  const shortDateOnly = formatShortDate('2026-10-28');
  assert.match(shortDateOnly, /28/);
  assert.match(shortDateOnly, /Oct/i);
  assert.doesNotMatch(shortDateOnly, /2026/);

  // Numeric timestamp test
  const timestampDate = formatDate(fixedDate.getTime());
  assert.match(timestampDate, /28/);
  assert.match(timestampDate, /Oct/i);
  assert.match(timestampDate, /2026/);

  // DateTime formatting test (IST timezone: 12:00 UTC -> 17:30 IST)
  assert.equal(formatDateTime(null), '—');
  assert.equal(formatDateTime('invalid-date'), '—');
  assert.equal(formatDateTime('invalid-date', 'N/A'), 'N/A');
  const dt = formatDateTime(fixedDate);
  assert.match(dt, /28/);
  assert.match(dt, /Oct/i);
  assert.match(dt, /2026/);
  assert.match(dt, /5:30|05:30/);

  const customDt = formatDateTime(fixedDate, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  assert.match(customDt, /28/);
  assert.match(customDt, /Oct/i);

  const iso = toISODate('2026-10-28T15:30:00.000Z');
  assert.equal(iso, '2026-10-28');
  assert.equal(toISODate(null), '');
  assert.equal(toISODate('invalid'), '');
});
