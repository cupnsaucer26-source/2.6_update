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
  assert.match(short, /2026/);

  const iso = toISODate('2026-10-28T15:30:00.000Z');
  assert.equal(iso, '2026-10-28');
  assert.equal(toISODate(null), '');
  assert.equal(toISODate('invalid'), '');
});
