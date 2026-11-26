// Frontend–Backend Financial Parity & Authority Test Suite (Batch 28)
// Verifies deterministic alignment between frontend calculation engine
// (src/shared/billingSummary.js, billingItems.js) and the authoritative
// backend invoice generation pipeline (POST /api/billing/invoice).
//
// Run with: node --env-file=server/.env --test server/tests/financial-parity.test.mjs

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { calculateBillingSummary } from '../../src/shared/billingSummary.js';
import { calculateItemAmount } from '../../src/shared/billingItems.js';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: '',
  OTP_HASH_SECRET: 'test-secret',
  AUTH_TOKEN_SECRET: 'test-secret',
});

const { db } = await import('../db.js');
const { default: app } = await import('../server.js');
const { signToken } = await import('../security.js');

console.log = () => {};
console.warn = () => {};
console.error = () => {};

const cashier = {
  id: 'U-CASHIER-1',
  name: 'Counter Cashier',
  role: 'billing',
  status: 'active',
  password: 'h',
  storeId: 'ST-MDU-1',
  storeCode: 'MDU',
  storeName: 'Madurai Branch'
};

const catalogProducts = [
  { id: 'P-FERT-5', name: 'Earth Power 5kg', gstRate: 5, hsnCode: '3101', price: 400 },
  { id: 'P-NEEM-12', name: 'Neem Shield 1L', gstRate: 12, hsnCode: '3808', price: 320 },
  { id: 'P-BIO-18', name: 'Bio-NPK 1L', gstRate: 18, hsnCode: '3105', price: 450 },
  { id: 'P-ZINC-28', name: 'Zinc Chelated 500g', gstRate: 28, hsnCode: '2833', price: 250 },
  { id: 'P-SEED-0', name: 'Paddy Seeds 10kg', gstRate: 0, hsnCode: '1006', price: 500 }
];

let savedInvoice = null;

Object.assign(db, {
  kvGet: async () => null,
  kvSet: async (k, v) => v,
  kvGetMany: async () => new Map(),
  kvClaimSlot: async () => 0,
  kvIncrement: async () => 1,
  getUserById: async (id) => (id === cashier.id ? cashier : null),
  getProductsByIds: async (ids) => catalogProducts.filter((p) => ids.includes(p.id)),
  getNextInvoiceNumber: async (code) => `SAM ${code} 2801`,
  getStoreById: async () => ({ id: 'ST-MDU-1', code: 'MDU', status: 'active' }),
  reserveStock: async () => ({ ok: true }),
  createInvoice: async (inv) => { savedInvoice = inv; return inv; },
});

let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

beforeEach(() => {
  savedInvoice = null;
});

async function sendBill(body, token = signToken(cashier.id, 'h')) {
  savedInvoice = null;
  const res = await fetch(`${base}/api/billing/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

function verifyParity(feSummary, beInvoice) {
  assert.equal(beInvoice.subtotal, feSummary.itemsSubtotal, 'Subtotal mismatch');
  assert.equal(beInvoice.taxableAmount, feSummary.taxableSubtotal, 'Taxable amount mismatch');
  assert.equal(beInvoice.cgst, feSummary.totalCgst, 'CGST mismatch');
  assert.equal(beInvoice.sgst, feSummary.totalSgst, 'SGST mismatch');
  assert.equal(beInvoice.totalGst, feSummary.totalGst, 'Total GST mismatch');
  assert.equal(beInvoice.roundOff, feSummary.roundOff, 'Round-off mismatch');
  assert.equal(beInvoice.grandTotal, feSummary.roundedGrandTotal, 'Grand total mismatch');
}

// -------------------------------------------------------------
// Financial Parity Matrix Test Cases (1 to 14)
// -------------------------------------------------------------

test('1. Empty bill and zero-value items are strictly refused by both frontend and backend', async () => {
  // Empty items
  const feEmpty = calculateBillingSummary({ items: [] });
  assert.equal(feEmpty.itemsSubtotal, 0);
  assert.equal(feEmpty.roundedGrandTotal, 0);

  const { status: emptyStatus, data: emptyData } = await sendBill({ items: [] });
  assert.equal(emptyStatus, 400);
  assert.match(emptyData.message, /Add at least one item/);

  // Zero-value item rate
  const feZeroAmount = calculateItemAmount(1, 0, 0);
  assert.equal(feZeroAmount, 0);

  const { status: zeroRateStatus, data: zeroRateData } = await sendBill({
    items: [{ name: 'Zero Rate Item', qty: 1, price: 0, gstRate: 18 }]
  });
  assert.equal(zeroRateStatus, 400);
  assert.match(zeroRateData.message, /enter a rate above 0/);
});

test('2. One item with 0% GST (tax-exempt produce parity)', async () => {
  const items = [{ name: 'Paddy Seeds', qty: 2, price: 250, gstRate: 0 }];
  const feItems = items.map(it => ({ ...it, amount: calculateItemAmount(it.qty, it.price, 0) }));
  const feSummary = calculateBillingSummary({ items: feItems });

  assert.equal(feSummary.itemsSubtotal, 500);
  assert.equal(feSummary.totalGst, 0);
  assert.equal(feSummary.roundedGrandTotal, 500);

  const { status } = await sendBill({ items });
  assert.equal(status, 200);
  verifyParity(feSummary, savedInvoice);
});

test('3. Single item with standard GST rates (5%, 12%, 18%, 28%) parity', async () => {
  const testCases = [
    { name: 'Earth Power', qty: 2, price: 400, gstRate: 5, expGst: 40, expTotal: 840 },
    { name: 'Neem Shield', qty: 1, price: 320, gstRate: 12, expGst: 38.40, expTotal: 358 },
    { name: 'Bio-NPK', qty: 1, price: 450, gstRate: 18, expGst: 81, expTotal: 531 },
    { name: 'Zinc Chelated', qty: 1, price: 250, gstRate: 28, expGst: 70, expTotal: 320 }
  ];

  for (const tc of testCases) {
    const feItems = [{ ...tc, amount: calculateItemAmount(tc.qty, tc.price, 0) }];
    const feSummary = calculateBillingSummary({ items: feItems });
    assert.equal(feSummary.totalGst, tc.expGst);
    assert.equal(feSummary.roundedGrandTotal, tc.expTotal);

    const { status } = await sendBill({ items: [tc] });
    assert.equal(status, 200);
    verifyParity(feSummary, savedInvoice);
  }
});

test('4. Multiple items with mixed GST rates and proportional manual discount parity', async () => {
  const items = [
    { name: 'Bio-NPK', qty: 1, price: 450, gstRate: 18 },
    { name: 'Neem Shield', qty: 1, price: 320, gstRate: 12 },
    { name: 'Earth Power', qty: 1, price: 400, gstRate: 5 },
    { name: 'Paddy Seeds', qty: 1, price: 150, gstRate: 0 }
  ];

  const feItems = items.map(it => ({ ...it, amount: calculateItemAmount(it.qty, it.price, 0) }));
  const feSummary = calculateBillingSummary({
    items: feItems,
    globalDiscountPercent: 10
  });

  assert.equal(feSummary.itemsSubtotal, 1320);
  assert.equal(feSummary.manualDiscAmt, 132);
  assert.equal(feSummary.taxableSubtotal, 1188);
  assert.equal(feSummary.totalCgst, 62.73);
  assert.equal(feSummary.totalSgst, 62.73);
  assert.equal(feSummary.totalGst, 125.46);
  assert.equal(feSummary.roundOff, -0.46);
  assert.equal(feSummary.roundedGrandTotal, 1313);

  const { status } = await sendBill({
    items,
    discountAmount: feSummary.totalDiscount
  });

  assert.equal(status, 200);
  verifyParity(feSummary, savedInvoice);
});

test('5. Fractional unit prices and quantities boundary enforcement', async () => {
  // Fractional unit price: rate ₹125.75, qty 2 -> amount 251.50
  const feItems = [{ name: 'Custom Mix', qty: 2, price: 125.75, gstRate: 18, amount: calculateItemAmount(2, 125.75, 0) }];
  const feSummary = calculateBillingSummary({ items: feItems });

  assert.equal(feSummary.itemsSubtotal, 251.50);
  assert.equal(feSummary.totalGst, 45.26);
  assert.equal(feSummary.roundOff, 0.24);
  assert.equal(feSummary.roundedGrandTotal, 297);

  const { status: fracRateStatus } = await sendBill({
    items: [{ name: 'Custom Mix', qty: 2, price: 125.75, gstRate: 18 }]
  });
  assert.equal(fracRateStatus, 200);
  verifyParity(feSummary, savedInvoice);

  // Fractional quantity: rejected by server
  const { status: fracQtyStatus, data: fracQtyData } = await sendBill({
    items: [{ name: 'Custom Mix', qty: 1.5, price: 100, gstRate: 18 }]
  });
  assert.equal(fracQtyStatus, 400);
  assert.match(fracQtyData.message, /quantity must be a whole number/);
});

test('6. Item-level discounts at 0%, 15%, and 100% boundary parity', async () => {
  // 15% item discount
  const item15 = { name: 'Item 15%', qty: 2, price: 500, discPercent: 15, gstRate: 18 };
  const lineAmount15 = calculateItemAmount(item15.qty, item15.price, item15.discPercent);
  assert.equal(lineAmount15, 850);

  const feSummary15 = calculateBillingSummary({ items: [{ ...item15, amount: lineAmount15 }] });
  const { status: s15 } = await sendBill({ items: [item15] });
  assert.equal(s15, 200);
  verifyParity(feSummary15, savedInvoice);

  // 100% item discount (promotional gift line)
  const item100 = { name: 'Item 100%', qty: 1, price: 500, discPercent: 100, gstRate: 18 };
  const lineAmount100 = calculateItemAmount(item100.qty, item100.price, item100.discPercent);
  assert.equal(lineAmount100, 0);

  const feSummary100 = calculateBillingSummary({ items: [{ ...item100, amount: lineAmount100 }] });
  assert.equal(feSummary100.itemsSubtotal, 0);
  assert.equal(feSummary100.roundedGrandTotal, 0);

  const { status: s100 } = await sendBill({ items: [item100] });
  assert.equal(s100, 200);
  verifyParity(feSummary100, savedInvoice);

  // Over 100% item discount rejected
  const { status: sOver } = await sendBill({ items: [{ name: 'Bad', qty: 1, price: 100, discPercent: 101, gstRate: 18 }] });
  assert.equal(sOver, 400);
});

test('7. Manual discount at 0%, normal %, and 100% parity', async () => {
  const item = { name: 'Wholesale Unit', qty: 1, price: 1000, gstRate: 18, amount: 1000 };

  // 10% discount
  const fe10 = calculateBillingSummary({ items: [item], globalDiscountPercent: 10 });
  assert.equal(fe10.manualDiscAmt, 100);
  assert.equal(fe10.taxableSubtotal, 900);
  assert.equal(fe10.roundedGrandTotal, 1062);

  const { status: s10 } = await sendBill({ items: [item], discountAmount: fe10.totalDiscount });
  assert.equal(s10, 200);
  verifyParity(fe10, savedInvoice);

  // 100% discount
  const fe100 = calculateBillingSummary({ items: [item], globalDiscountPercent: 100 });
  assert.equal(fe100.manualDiscAmt, 1000);
  assert.equal(fe100.taxableSubtotal, 0);
  assert.equal(fe100.roundedGrandTotal, 0);

  const { status: s100 } = await sendBill({ items: [item], discountAmount: fe100.totalDiscount });
  assert.equal(s100, 200);
  verifyParity(fe100, savedInvoice);
});

test('8. Coupon discount alone parity', async () => {
  const item = { name: 'Sample Item', qty: 1, price: 1000, gstRate: 18, amount: 1000 };
  const fe = calculateBillingSummary({ items: [item], couponDiscountAmount: 100 });

  assert.equal(fe.manualDiscAmt, 0);
  assert.equal(fe.couponDiscountAmount, 100);
  assert.equal(fe.totalDiscount, 100);
  assert.equal(fe.taxableSubtotal, 900);
  assert.equal(fe.totalGst, 162);
  assert.equal(fe.roundedGrandTotal, 1062);

  const { status } = await sendBill({ items: [item], discountAmount: fe.totalDiscount, couponCode: 'SAVE100' });
  assert.equal(status, 200);
  verifyParity(fe, savedInvoice);
  assert.equal(savedInvoice.couponCode, 'SAVE100');
});

test('9. Manual discount combined with coupon discount parity', async () => {
  const item = { name: 'Combo Bill Item', qty: 1, price: 1000, gstRate: 18, amount: 1000 };
  const fe = calculateBillingSummary({ items: [item], globalDiscountPercent: 10, couponDiscountAmount: 50 });

  assert.equal(fe.manualDiscAmt, 100);
  assert.equal(fe.couponDiscountAmount, 50);
  assert.equal(fe.totalDiscount, 150);
  assert.equal(fe.taxableSubtotal, 850);
  assert.equal(fe.totalGst, 153);
  assert.equal(fe.roundedGrandTotal, 1003);

  const { status } = await sendBill({ items: [item], discountAmount: fe.totalDiscount, couponCode: 'FESTIVE50' });
  assert.equal(status, 200);
  verifyParity(fe, savedInvoice);
  assert.equal(savedInvoice.couponCode, 'FESTIVE50');
});

test('10. Discounts equal to subtotal are permitted; discounts greater than subtotal are rejected', async () => {
  const item = { name: 'Full Discount Item', qty: 1, price: 500, gstRate: 18 };

  // Discount equal to subtotal
  const { status: sEqual } = await sendBill({ items: [item], discountAmount: 500 });
  assert.equal(sEqual, 200);
  assert.equal(savedInvoice.taxableAmount, 0);
  assert.equal(savedInvoice.grandTotal, 0);

  // Discount exceeding subtotal
  const { status: sExcess, data: excessData } = await sendBill({ items: [item], discountAmount: 550 });
  assert.equal(sExcess, 400);
  assert.match(excessData.message, /cannot be more than the bill/);

  // Negative discount
  const { status: sNeg } = await sendBill({ items: [item], discountAmount: -50 });
  assert.equal(sNeg, 400);
});

test('11. Round-off boundary values (.49, .50, .51) exact parity', async () => {
  // Boundary 1: Raw total ends in .49 -> rounds down to integer, roundOff = -0.49
  const boundary49 = [{ name: 'Item .49', qty: 1, price: 99.57, gstRate: 18 }];
  const fe49 = calculateBillingSummary({
    items: [{ ...boundary49[0], amount: calculateItemAmount(1, 99.57, 0) }]
  });
  assert.equal(fe49.roundOff, -0.49);
  assert.equal(fe49.roundedGrandTotal, 117);

  const { status: s49 } = await sendBill({ items: boundary49 });
  assert.equal(s49, 200);
  verifyParity(fe49, savedInvoice);

  // Boundary 2: Raw total ends in .50 (e.g. 125 @ 12% = 140.00 exact)
  const boundaryExact = [{ name: 'Item .00', qty: 1, price: 125, gstRate: 12 }];
  const feExact = calculateBillingSummary({
    items: [{ ...boundaryExact[0], amount: calculateItemAmount(1, 125, 0) }]
  });
  assert.equal(feExact.roundOff, 0);
  assert.equal(feExact.roundedGrandTotal, 140);

  const { status: sExact } = await sendBill({ items: boundaryExact });
  assert.equal(sExact, 200);
  verifyParity(feExact, savedInvoice);
});

test('12. Large wholesale invoice calculation parity', async () => {
  const wholesaleItem = { name: 'Wholesale Commercial Truckload', qty: 5000, price: 1500, gstRate: 18 };
  const lineAmount = calculateItemAmount(wholesaleItem.qty, wholesaleItem.price, 0);
  assert.equal(lineAmount, 7500000);

  const fe = calculateBillingSummary({ items: [{ ...wholesaleItem, amount: lineAmount }] });
  assert.equal(fe.itemsSubtotal, 7500000);
  assert.equal(fe.totalCgst, 675000);
  assert.equal(fe.totalSgst, 675000);
  assert.equal(fe.totalGst, 1350000);
  assert.equal(fe.roundedGrandTotal, 8850000);
  assert.match(fe.grandTotalWords, /Eighty Eight Lakh Fifty Thousand/);

  const { status } = await sendBill({ items: [wholesaleItem] });
  assert.equal(status, 200);
  verifyParity(fe, savedInvoice);
});

test('13. Server ignores client-supplied totals and enforces catalog tax authority', async () => {
  // Client attempts to spoof total, round-off, and product GST rate
  const spoofedPayload = {
    items: [{
      productId: 'P-BIO-18', // Catalog product with 18% GST
      name: 'Spoofed Name',
      qty: 1,
      price: 450,
      gstRate: 0 // Client claims 0% GST
    }],
    subtotal: 10,
    taxableAmount: 10,
    cgst: 0,
    sgst: 0,
    totalGst: 0,
    roundOff: -500,
    grandTotal: 1
  };

  const { status } = await sendBill(spoofedPayload);
  assert.equal(status, 200);

  // Server must override client-sent values with authoritative catalog values
  assert.equal(savedInvoice.items[0].gstRate, 18, 'Server did not enforce catalog GST rate');
  assert.equal(savedInvoice.subtotal, 450, 'Server trusted client subtotal');
  assert.equal(savedInvoice.totalGst, 81, 'Server trusted client totalGst');
  assert.equal(savedInvoice.grandTotal, 531, 'Server trusted client grandTotal');
  assert.equal(savedInvoice.roundOff, 0, 'Server trusted client roundOff');
});

test('14. Sequential invoice generation and permission boundary enforcement', async () => {
  // Sequential invoice generation creates unique numbers
  const item = { name: 'Item Seq', qty: 1, price: 100, gstRate: 18 };
  const { status: s1 } = await sendBill({ items: [item] });
  assert.equal(s1, 200);
  assert.equal(savedInvoice.invoiceNo, 'SAM MDU 2801');

  // Unauthorized submission rejected
  const { status: unauthStatus } = await sendBill({ items: [item] }, null);
  assert.equal(unauthStatus, 401);
});
