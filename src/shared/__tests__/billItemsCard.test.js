// Unit and regression tests for Billing Items Card logic and model
// Batch 22: Billing POS Modularization — Phase 2: Bill Items Card

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatItemRate,
  canDecrementQty,
  calculateItemAmount,
  normalizeBillItem
} from '../billingItems.js'
import { formatCurrency } from '../../utils/formatters.js'

test('formatItemRate standardizes monetary rates to Indian currency format with 2 decimals', () => {
  assert.equal(formatItemRate(450), '₹450.00')
  assert.equal(formatItemRate(1234.5), '₹1,234.50')
  assert.equal(formatItemRate('780'), '₹780.00')
  assert.equal(formatItemRate(0), '₹0.00')

  // Fallbacks for missing/invalid input
  assert.equal(formatItemRate(null), '₹0.00')
  assert.equal(formatItemRate(undefined), '₹0.00')
  assert.equal(formatItemRate('invalid'), '₹0.00')
})

test('canDecrementQty allows decrement only when current quantity is strictly greater than 1', () => {
  assert.equal(canDecrementQty(2), true)
  assert.equal(canDecrementQty(10), true)
  assert.equal(canDecrementQty('5'), true)

  // Disallowed decrement (boundary at 1)
  assert.equal(canDecrementQty(1), false)
  assert.equal(canDecrementQty('1'), false)
  assert.equal(canDecrementQty(0), false)
  assert.equal(canDecrementQty(-1), false)
  assert.equal(canDecrementQty(null), false)
})

test('calculateItemAmount accurately computes line totals and handles discount bounds', () => {
  // Standard calculation: 2 * 500 = 1000
  assert.equal(calculateItemAmount(2, 500), 1000)

  // With 10% discount: 2 * 500 * 0.9 = 900
  assert.equal(calculateItemAmount(2, 500, 10), 900)

  // With 50% discount: 4 * 100 * 0.5 = 200
  assert.equal(calculateItemAmount(4, 100, 50), 200)

  // Bounds: discount cannot exceed 100%
  assert.equal(calculateItemAmount(1, 200, 150), 0)

  // Bounds: negative discount clamped to 0%
  assert.equal(calculateItemAmount(1, 200, -20), 200)

  // Bounds: qty minimum of 1
  assert.equal(calculateItemAmount(0, 100), 100)
})

test('normalizeBillItem applies safe fallbacks for missing/partial fields', () => {
  const completeItem = {
    id: 'line_101',
    name: 'Bio-NPK Fertilizer 1L',
    batch: 'BATCH-2026A',
    unit: 'Bottle',
    hsnCode: '31010099',
    rate: 650,
    qty: 3,
    discPercent: 5,
    gstRate: 12,
    amount: 1852.5
  }

  const normalized = normalizeBillItem(completeItem, 0)
  assert.equal(normalized.id, 'line_101')
  assert.equal(normalized.name, 'Bio-NPK Fertilizer 1L')
  assert.equal(normalized.batch, 'BATCH-2026A')
  assert.equal(normalized.unit, 'Bottle')
  assert.equal(normalized.hsnCode, '31010099')
  assert.equal(normalized.rate, 650)
  assert.equal(normalized.rateFormatted, '₹650.00')
  assert.equal(normalized.qty, 3)
  assert.equal(normalized.canDecrement, true)
  assert.equal(normalized.discPercent, 5)
  assert.equal(normalized.gstRate, 12)
  assert.equal(normalized.amount, 1852.5)
  assert.equal(normalized.index, 1)

  // Empty object fallbacks
  const emptyItem = normalizeBillItem({}, 2)
  assert.equal(emptyItem.id, 'item-3')
  assert.equal(emptyItem.name, 'Product')
  assert.equal(emptyItem.batch, 'Primary Batch')
  assert.equal(emptyItem.unit, 'Nos')
  assert.equal(emptyItem.hsnCode, '31010099')
  assert.equal(emptyItem.rate, 0)
  assert.equal(emptyItem.qty, 1)
  assert.equal(emptyItem.canDecrement, false)
  assert.equal(emptyItem.gstRate, 18)
  assert.equal(emptyItem.amount, 0)
  assert.equal(emptyItem.index, 3)
})

test('BillItemsCard action dispatch simulation: decrement, increment, remove, and clear', () => {
  const mockItems = [
    { id: 'item_1', name: 'Neem Oil 500ml', rate: 300, qty: 2, amount: 600 },
    { id: 'item_2', name: 'Vermicompost 5kg', rate: 150, qty: 1, amount: 150 }
  ]

  let updatedPayload = null
  let removedId = null
  let cleared = false

  const onUpdateQty = (id, newQty) => {
    updatedPayload = { id, newQty }
  }
  const onRemoveItem = (id) => {
    removedId = id
  }
  const onClearBill = () => {
    cleared = true
  }

  // Simulate decrementing item_1 (from 2 to 1)
  onUpdateQty(mockItems[0].id, mockItems[0].qty - 1)
  assert.deepEqual(updatedPayload, { id: 'item_1', newQty: 1 })

  // Simulate incrementing item_2 (from 1 to 2)
  onUpdateQty(mockItems[1].id, mockItems[1].qty + 1)
  assert.deepEqual(updatedPayload, { id: 'item_2', newQty: 2 })

  // Simulate removing item_1
  onRemoveItem(mockItems[0].id)
  assert.equal(removedId, 'item_1')

  // Simulate clearing the entire bill
  onClearBill()
  assert.equal(cleared, true)
})
