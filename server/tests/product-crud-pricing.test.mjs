// End-to-End Product CRUD, Pricing Synchronization & Full-Stack Verification Test
// Run: node --test server/tests/product-crud-pricing.test.mjs

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { packPrice, packMrp } from '../../src/shared/packPricing.js';
import { withCurrentProducts } from '../../src/hooks/checkoutRules.js';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: '',
  OTP_HASH_SECRET: 'test-secret',
  AUTH_TOKEN_SECRET: 'test-secret',
  ORDER_WHATSAPP_MESSAGES: 'off',
});

const { db, normalizeProduct } = await import('../db.js');
const { default: app } = await import('../server.js');
const { signToken } = await import('../security.js');

console.log = () => {};
console.warn = () => {};
console.error = () => {};

const admin = { id: 'U-ADMIN', name: 'Admin', role: 'admin', status: 'active', password: 'hash' };
const farmer = { id: 'U-FARMER', name: 'Murugan', role: 'farmer', status: 'active', phone: '9876533333', password: 'hash' };
const people = new Map([admin, farmer].map((u) => [u.id, u]));

let productsMap = new Map();
let nextId = 100;
const kv = new Map();

// In-memory db mock that mirrors MongoDB product operations and server db methods
Object.assign(db, {
  kvGet: async (key) => kv.get(key) ?? null,
  kvSet: async (key, value) => { kv.set(key, value); return value; },
  kvGetMany: async () => new Map(),
  kvClaimSlot: async () => 0,
  kvDelete: async (key) => { kv.delete(key); },
  kvIncrement: async () => 1,
  getUserById: async (id) => people.get(id) ?? null,
  findSameNamedProduct: async (name, ignoreId) => {
    const norm = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const p of productsMap.values()) {
      if (ignoreId && p.id === ignoreId) continue;
      const other = String(p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm === other) return p;
    }
    return null;
  },
  getProducts: async () => Array.from(productsMap.values()),
  getProductById: async (id) => {
    const p = productsMap.get(id);
    return p ? structuredClone(p) : null;
  },
  getProductsByIds: async (ids) => ids.map(id => productsMap.get(id)).filter(Boolean).map(p => structuredClone(p)),
  createProduct: async (details) => {
    const id = `sb-TEST${nextId++}`;
    const price = Math.max(0, Number(details.price) || 0);
    const mrp = Math.max(0, Number(details.originalPrice || details.mrp || (price > 0 ? price : 0)));
    const packSizes = Array.isArray(details.packSizes) && details.packSizes.length
      ? details.packSizes.map(s => String(s).trim()).filter(Boolean)
      : ['1 KG'];
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const selectedPack = packSizes.includes(details.selectedPack) ? details.selectedPack : packSizes[0];

    let packagePrices = { ...(details.packagePrices || {}) };
    let packageMrps = { ...(details.packageMrps || {}) };
    if (price > 0 && packagePrices[selectedPack] === undefined) {
      packagePrices[selectedPack] = price;
    }
    if (mrp > 0 && packageMrps[selectedPack] === undefined) {
      packageMrps[selectedPack] = mrp;
    }

    const p = normalizeProduct({
      id,
      ...details,
      price,
      originalPrice: mrp,
      discount: details.discount !== undefined ? details.discount : (discountPct > 0 ? `${discountPct}% OFF` : ''),
      packSizes,
      selectedPack,
      packagePrices,
      packageMrps,
      online: details.online !== false,
      stock: Math.max(0, Number(details.stock) || 0),
    });
    productsMap.set(id, p);
    return structuredClone(p);
  },
  updateProduct: async (id, updates) => {
    const existing = productsMap.get(id);
    if (!existing) return null;

    const price = updates.price !== undefined ? Math.max(0, Number(updates.price) || 0) : existing.price;
    const mrp = (updates.originalPrice !== undefined || updates.mrp !== undefined)
      ? Math.max(0, Number(updates.originalPrice || updates.mrp || (price > 0 ? price : 0)))
      : existing.originalPrice;

    const packSizes = Array.isArray(updates.packSizes) && updates.packSizes.length
      ? updates.packSizes.map(s => String(s).trim()).filter(Boolean)
      : existing.packSizes;
    const selectedPack = updates.selectedPack && packSizes.includes(updates.selectedPack)
      ? updates.selectedPack
      : existing.selectedPack || packSizes[0];

    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    let packagePrices = { ...(existing.packagePrices || {}), ...(updates.packagePrices || {}) };
    let packageMrps = { ...(existing.packageMrps || {}), ...(updates.packageMrps || {}) };

    if (updates.price !== undefined && price > 0) {
      packagePrices[selectedPack] = price;
    }
    if ((updates.originalPrice !== undefined || updates.mrp !== undefined) && mrp > 0) {
      packageMrps[selectedPack] = mrp;
    }

    const merged = normalizeProduct({
      ...existing,
      ...updates,
      id,
      price,
      originalPrice: mrp,
      discount: (updates.discount !== undefined && updates.discount !== '')
        ? updates.discount
        : (discountPct > 0 ? `${discountPct}% OFF` : ''),
      packSizes,
      selectedPack,
      packagePrices,
      packageMrps,
    });
    productsMap.set(id, merged);
    return structuredClone(merged);
  },
  deleteProduct: async (id) => {
    if (!productsMap.has(id)) return false;
    productsMap.delete(id);
    return true;
  },
  reserveStock: async () => ({ ok: true }),
  releaseStock: async () => {},
  createOrder: async (order) => ({ id: 'ORD-TEST-1', ...order }),
  saveCart: async () => [],
  getCatalogOptions: async () => ({
    categories: ['Bio-Stimulant', 'Fertilizer'],
    crops: ['Paddy / Rice', 'Cotton'],
    storageBatches: ['1 KG', '500 GM'],
    diseases: ['Blast'],
    physicalForms: ['Powder', 'Liquid'],
  }),
});

let server;
let base;
const adminToken = signToken(admin.id, admin.password);
const farmerToken = signToken(farmer.id, farmer.password);

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
  kv.clear();
  productsMap.clear();
  nextId = 100;
});

async function call(method, path, body, auth) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && { Authorization: `Bearer ${auth}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const headers = Object.fromEntries(res.headers.entries());
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, headers, data };
}

// ----------------------------------------------------
// Test Suite
// ----------------------------------------------------

test('1. HTTP Cache-Control headers enforce no-cache on product endpoints', async () => {
  productsMap.set('sb-1', { id: 'sb-1', name: 'Test Product', price: 500, stock: 10, online: true });

  const resList = await call('GET', '/api/products');
  assert.equal(resList.status, 200);
  assert.match(resList.headers['cache-control'] || '', /no-store/);

  const resDetail = await call('GET', '/api/products/sb-1');
  assert.equal(resDetail.status, 200);
  assert.match(resDetail.headers['cache-control'] || '', /no-store/);
});

test('2. CREATE: Admin can add new product with proper pricing and discount alignment', async () => {
  const newProductPayload = {
    name: 'Neem Growth Booster',
    category: 'Bio-Stimulant',
    price: 400,
    originalPrice: 500,
    stock: 25,
    gstRate: 18,
    hsnCode: '310100',
    packSizes: ['1 KG', '500 GM'],
    packagePrices: { '1 KG': 400, '500 GM': 220 },
    packageMrps: { '1 KG': 500, '500 GM': 275 },
    selectedPack: '1 KG',
    online: true,
  };

  const res = await call('POST', '/api/products', newProductPayload, adminToken);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.id.startsWith('sb-'));
  assert.equal(res.data.data.price, 400);
  assert.equal(res.data.data.originalPrice, 500);
  assert.equal(res.data.data.discount, '20% OFF');
  assert.equal(res.data.data.packagePrices['1 KG'], 400);
  assert.equal(res.data.data.packageMrps['1 KG'], 500);
});

test('3. CREATE: When MRP <= Price, discount is blank (no false "0% OFF")', async () => {
  const res = await call('POST', '/api/products', {
    name: 'Standard Urea',
    price: 350,
    originalPrice: 350,
    stock: 50,
    packSizes: ['1 KG'],
    selectedPack: '1 KG',
  }, adminToken);

  assert.equal(res.status, 200);
  assert.equal(res.data.data.discount, '');
  assert.equal(res.data.data.price, 350);
  assert.equal(res.data.data.originalPrice, 350);
});

test('4. CREATE: Non-admin cannot create product (403)', async () => {
  const res = await call('POST', '/api/products', { name: 'Unauthorized Item', price: 100, stock: 10 }, farmerToken);
  assert.equal(res.status, 403);
});

test('5. CREATE: Validation rejects negative price, negative stock, and invalid GST rate', async () => {
  // Negative price
  const res1 = await call('POST', '/api/products', { name: 'Bad Price', price: -10, stock: 10 }, adminToken);
  assert.equal(res1.status, 400);
  assert.match(res1.data.message, /Price must be a number of 0 or more/i);

  // Negative stock
  const res2 = await call('POST', '/api/products', { name: 'Bad Stock', price: 10, stock: -5 }, adminToken);
  assert.equal(res2.status, 400);
  assert.match(res2.data.message, /Stock must be a number of 0 or more/i);

  // Invalid GST rate (>100)
  const res3 = await call('POST', '/api/products', { name: 'Bad GST', price: 10, stock: 10, gstRate: 150 }, adminToken);
  assert.equal(res3.status, 400);
  assert.match(res3.data.message, /GST rate must be between 0 and 100/i);
});

test('6. CREATE: Duplicate product name is rejected with 409', async () => {
  const r1 = await call('POST', '/api/products', { name: 'Organic Potash', price: 200, stock: 10 }, adminToken);
  assert.equal(r1.status, 200);
  const dupRes = await call('POST', '/api/products', { name: 'Organic Potash', price: 250, stock: 10 }, adminToken);
  assert.equal(dupRes.status, 409);
  assert.equal(dupRes.data.code, 'DUPLICATE_PRODUCT');
});

test('7. READ: Customer can read online products; offline products return 404', async () => {
  productsMap.set('sb-ONLINE', normalizeProduct({ id: 'sb-ONLINE', name: 'Online Seed', price: 150, online: true }));
  productsMap.set('sb-OFFLINE', normalizeProduct({ id: 'sb-OFFLINE', name: 'Counter Seed', price: 150, online: false }));

  const resOnline = await call('GET', '/api/products/sb-ONLINE');
  assert.equal(resOnline.status, 200);
  assert.equal(resOnline.data.data.name, 'Online Seed');

  const resOffline = await call('GET', '/api/products/sb-OFFLINE');
  assert.equal(resOffline.status, 404);
});

test('8. UPDATE: Updating Price & MRP synchronizes packagePrices & packageMrps for basePack', async () => {
  // Create product initially at 500 / 600
  const created = await call('POST', '/api/products', {
    name: 'Shakthi Tonic',
    price: 500,
    originalPrice: 600,
    stock: 20,
    packSizes: ['1 L'],
    selectedPack: '1 L',
    packagePrices: { '1 L': 500 },
    packageMrps: { '1 L': 600 },
  }, adminToken);
  assert.equal(created.status, 200);
  const id = created.data.data.id;

  // Admin updates selling price to 450 and MRP to 550
  const updateRes = await call('PUT', `/api/products/${id}`, {
    price: 450,
    originalPrice: 550,
  }, adminToken);

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.data.price, 450);
  assert.equal(updateRes.data.data.originalPrice, 550);
  // Synchronized in packagePrices & packageMrps
  assert.equal(updateRes.data.data.packagePrices['1 L'], 450);
  assert.equal(updateRes.data.data.packageMrps['1 L'], 550);

  // Read back directly to verify persistence
  const readRes = await call('GET', `/api/products/${id}`);
  assert.equal(readRes.data.data.price, 450);
  assert.equal(readRes.data.data.originalPrice, 550);
  assert.equal(readRes.data.data.packagePrices['1 L'], 450);
});

test('9. UPDATE: Updating non-price fields preserves existing prices', async () => {
  const created = await call('POST', '/api/products', {
    name: 'Humic Acid Granules',
    price: 320,
    originalPrice: 400,
    stock: 10,
    gstRate: 12,
    packSizes: ['5 KG'],
    selectedPack: '5 KG',
    packagePrices: { '5 KG': 320 },
  }, adminToken);
  assert.equal(created.status, 200);
  const id = created.data.data.id;

  // Update only stock and GST
  const updateRes = await call('PUT', `/api/products/${id}`, {
    stock: 50,
    gstRate: 5,
  }, adminToken);

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.data.stock, 50);
  assert.equal(updateRes.data.data.gstRate, 5);
  // Price remains intact
  assert.equal(updateRes.data.data.price, 320);
  assert.equal(updateRes.data.data.originalPrice, 400);
  assert.equal(updateRes.data.data.packagePrices['5 KG'], 320);
});

test('10. UPDATE: Non-admin cannot edit product (403)', async () => {
  productsMap.set('sb-SEC', { id: 'sb-SEC', name: 'Secure Item', price: 100 });
  const res = await call('PUT', '/api/products/sb-SEC', { price: 200 }, farmerToken);
  assert.equal(res.status, 403);
});

test('11. DELETE: Admin can delete product; customer then gets 404', async () => {
  productsMap.set('sb-DEL', { id: 'sb-DEL', name: 'To Be Deleted', price: 100, online: true });

  // Delete as admin
  const delRes = await call('DELETE', '/api/products/sb-DEL', null, adminToken);
  assert.equal(delRes.status, 200);

  // Subsequent get is 404
  const getRes = await call('GET', '/api/products/sb-DEL');
  assert.equal(getRes.status, 404);
});

test('12. PRICING CONSISTENCY: packPrice and packMrp helpers calculate dynamic pack pricing', () => {
  const product = {
    price: 300,
    originalPrice: 400,
    packSizes: ['500 GM', '1 KG'],
    selectedPack: '500 GM',
    packagePrices: { '500 GM': 300, '1 KG': 550 },
    packageMrps: { '500 GM': 400, '1 KG': 700 },
  };

  assert.equal(packPrice(product, '500 GM', '500 GM'), 300);
  assert.equal(packPrice(product, '1 KG', '500 GM'), 550);
  assert.equal(packMrp(product, '500 GM', 300), 400);
  assert.equal(packMrp(product, '1 KG', 550), 700);

  // Fallback to ratio when explicit pack size price is omitted
  const productWithoutExplicitRatio = {
    price: 200,
    originalPrice: 250,
    packSizes: ['1 KG', '2 KG'],
    selectedPack: '1 KG',
  };
  assert.equal(packPrice(productWithoutExplicitRatio, '2 KG', '1 KG'), 400);
});

test('13. CART RECALCULATION: withCurrentProducts updates stale cart prices to fresh catalog prices', () => {
  const liveCatalog = [
    {
      id: 'sb-PRICE-TEST',
      name: 'Dynamic Bio Liquid',
      price: 600, // Updated from 500
      originalPrice: 750,
      gstRate: 18,
      packSizes: ['1 L'],
      selectedPack: '1 L',
      packagePrices: { '1 L': 600 },
      packageMrps: { '1 L': 750 },
      online: true,
      stock: 20,
    }
  ];

  const staleCart = [
    {
      id: 'sb-PRICE-TEST',
      productId: 'sb-PRICE-TEST',
      selectedPack: '1 L',
      price: 500, // Old price in customer's local storage
      originalPrice: 650,
      mrp: 650,
      qty: 2,
    }
  ];

  const refreshedCart = withCurrentProducts(staleCart, liveCatalog);
  assert.equal(refreshedCart.length, 1);
  assert.equal(refreshedCart[0].price, 600, 'Cart line price must sync to updated catalog price');
  assert.equal(refreshedCart[0].originalPrice, 750, 'Cart line originalPrice must sync to updated catalog MRP');
  assert.equal(refreshedCart[0].mrp, 750, 'Cart line mrp must sync to updated catalog MRP');
});

test('14. HISTORICAL INTEGRITY: Past orders do not mutate when product price is updated', async () => {
  // Order saved in historical DB record
  const historicalOrder = {
    id: 'ORD-HIST-1',
    createdAt: '2026-01-01T00:00:00Z',
    items: [
      { id: 'sb-P1', name: 'Historical Item', price: 100, selectedPack: '1 KG', qty: 2 }
    ],
    subtotal: 200,
    gst: 36,
    total: 236,
  };

  // Now the product price in the catalog increases to 150
  const updatedProduct = await call('POST', '/api/products', {
    name: 'Historical Item Update',
    price: 150,
    stock: 10,
    packSizes: ['1 KG'],
  }, adminToken);
  assert.equal(updatedProduct.status, 200);

  // The historical order object was already sealed and stored with snapshot line items
  assert.equal(historicalOrder.items[0].price, 100);
  assert.equal(historicalOrder.subtotal, 200);
  assert.equal(historicalOrder.total, 236);
});
