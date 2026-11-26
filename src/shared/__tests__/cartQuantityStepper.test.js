import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCart,
  withItemAdded,
  mergeCarts,
  cartTotals,
  keyOf
} from '../../hooks/checkoutRules.js';

test('Product card quantity stepper: single product increment and decrement', () => {
  let cart = [];
  const prodA = { id: 'p-shakthi-gold', name: 'Shakthi Gold Gel', price: 2999, selectedPack: '10 KG' };

  // 1. Initial Add to Cart
  cart = withItemAdded(cart, prodA, 1);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 1);

  // 2. Click [+] on stepper
  cart = withItemAdded(cart, prodA, 1);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 2);

  // 3. Click [+] again
  cart = withItemAdded(cart, prodA, 1);
  assert.equal(cart[0].qty, 3);

  // 4. Click [-] on stepper (decrement from 3 to 2)
  const index = cart.findIndex(i => String(keyOf(i)) === 'p-shakthi-gold');
  cart = cart.map((item, i) => i === index ? { ...item, qty: item.qty - 1 } : item);
  assert.equal(cart[0].qty, 2);

  // 5. Decrement to 1
  cart = cart.map((item, i) => i === index ? { ...item, qty: item.qty - 1 } : item);
  assert.equal(cart[0].qty, 1);

  // 6. Decrement when qty is 1 -> removes from cart (restores Add to Cart button)
  cart = cart.filter((_, i) => i !== index);
  assert.equal(cart.length, 0);
});

test('Product card quantity stepper: multiple pack variants maintain independent quantities', () => {
  let cart = [];
  const pack10kg = { id: 'p-gold-gel', name: 'Gold Gel Pro', price: 3599, selectedPack: '10 KG' };
  const pack5kg = { id: 'p-gold-gel', name: 'Gold Gel Pro', price: 1999, selectedPack: '5 KG' };

  // Add 10 KG
  cart = withItemAdded(cart, pack10kg, 2);
  // Add 5 KG
  cart = withItemAdded(cart, pack5kg, 1);

  assert.equal(cart.length, 2, 'Different pack sizes remain separate cart lines');

  const line10 = cart.find(i => i.selectedPack === '10 KG');
  const line5 = cart.find(i => i.selectedPack === '5 KG');

  assert.equal(line10.qty, 2);
  assert.equal(line5.qty, 1);

  // Totals reflect both lines accurately
  const totals = cartTotals(cart);
  assert.equal(totals.subtotal, (3599 * 2) + (1999 * 1));
});

test('Guest cart to user cart merge preserves variant quantities idempotently', () => {
  const guestCart = normalizeCart([
    { id: 'p-neem', name: 'Neem Shield', selectedPack: '1 L', qty: 2, price: 320 },
    { id: 'p-bio', name: 'Bio-NPK', selectedPack: '500 ml', qty: 1, price: 250 }
  ]);

  const userCart = normalizeCart([
    { id: 'p-neem', name: 'Neem Shield', selectedPack: '1 L', qty: 1, price: 320 }
  ]);

  // First merge on login
  const merged = mergeCarts(userCart, guestCart);
  assert.equal(merged.length, 2);
  assert.equal(merged.find(i => i.id === 'p-neem').qty, 3);
  assert.equal(merged.find(i => i.id === 'p-bio').qty, 1);

  // Re-merging with empty guest cart after clearGuestCart returns userCart unchanged
  const reMerged = mergeCarts(merged, []);
  assert.deepEqual(reMerged, merged);
});

test('Quantity selector source files contain only numerical quantity and zero "in Basket" text', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const catalogSrc = fs.readFileSync(path.resolve('src/storefront/sections/Catalog.jsx'), 'utf8');
  const allProdSrc = fs.readFileSync(path.resolve('src/pages/AllProducts.jsx'), 'utf8');
  const cssSrc = fs.readFileSync(path.resolve('src/components/common/inlineFeedback.css'), 'utf8');

  assert.equal(catalogSrc.includes('in Basket'), false, 'Catalog.jsx must not contain "in Basket"');
  assert.equal(allProdSrc.includes('in Basket'), false, 'AllProducts.jsx must not contain "in Basket"');
  assert.equal(catalogSrc.includes('{lineQty}'), true, 'Catalog.jsx must display numerical quantity');
  assert.equal(allProdSrc.includes('{lineQty}'), true, 'AllProducts.jsx must display numerical quantity');

  // Verify design tokens in css
  assert.equal(cssSrc.includes('#E1E8E3'), true, 'CSS must use #E1E8E3 outer border');
  assert.equal(cssSrc.includes('#078447'), true, 'CSS must use #078447 primary green');
  assert.equal(cssSrc.includes('#173D2D'), true, 'CSS must use #173D2D quantity text');
  assert.equal(cssSrc.includes('border-radius: 9px'), true, 'CSS must use 9px border radius');
});
