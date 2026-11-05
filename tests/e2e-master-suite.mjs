import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, connectDB } from '../server/db.js';
import { signToken } from '../server/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const API_BASE = 'http://localhost:5000';
const keySecret = process.env.RAZORPAY_KEY_SECRET;

async function runMasterE2ESuite() {
  console.log('================================================================');
  console.log('  SATHYAM AGRO MART — MASTER AUTOMATED E2E & REGRESSION SUITE  ');
  console.log('================================================================\n');

  await connectDB();
  const startTime = Date.now();
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`  ✔ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ---------------------------------------------------------
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ---------------------------------------------------------
  console.log('👉 Section 1: Authentication & Access Control');
  const adminUser = await db.getUserByIdentifier('admin', { roles: ['admin', 'superadmin'] }) 
    || (await db.getUsers({ role: 'admin' }))[0];
  assert(!!adminUser, 'Admin user exists in database');

  const adminSessionId = adminUser.sessionId || 'admin-test-session';
  await db.setUserSessionId(adminUser.id, adminSessionId);
  const storedAdmin = await db.getUserById(adminUser.id, { includePassword: true });
  const adminToken = signToken(adminUser.id, storedAdmin.password, adminSessionId);
  assert(!!adminToken, 'Admin signed JWT generated');

  const adminAuthRes = await axios.get(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminAuthRes.data.success === true && ['admin', 'superadmin'].includes(adminAuthRes.data.data?.role), 'Admin authenticated with admin permissions');

  // Test farmer auth
  const farmers = await db.getUsers({ role: 'farmer' });
  const farmerUser = farmers[0];
  assert(!!farmerUser, 'Farmer user exists in database');
  const farmerSessionId = farmerUser.sessionId || 'farmer-test-session';
  await db.setUserSessionId(farmerUser.id, farmerSessionId);
  const storedFarmer = await db.getUserById(farmerUser.id, { includePassword: true });
  const farmerToken = signToken(farmerUser.id, storedFarmer.password, farmerSessionId);
  assert(!!farmerToken, 'Farmer token generated and valid');

  // ---------------------------------------------------------
  // 2. MASTER DATA & CATALOG OPTIONS SYNCHRONIZATION
  // ---------------------------------------------------------
  console.log('\n👉 Section 2: Master Data & Catalog Dynamic Sync');
  const catalogRes = await axios.get(`${API_BASE}/api/catalog-options`);
  assert(catalogRes.data.success === true, 'GET /api/catalog-options returns success: true');
  const catalogOptions = catalogRes.data.data || {};
  assert(Array.isArray(catalogOptions.crops) && catalogOptions.crops.length > 0, `Dynamic crops loaded (${catalogOptions.crops.length} crops found)`);
  assert(Array.isArray(catalogOptions.categories) && catalogOptions.categories.length > 0, `Dynamic categories loaded (${catalogOptions.categories.length} categories found)`);

  // ---------------------------------------------------------
  // 3. ADMIN PRODUCT CREATION & VALIDATION
  // ---------------------------------------------------------
  console.log('\n👉 Section 3: Admin Product Lifecycle & Validation');
  // 400 on empty
  try {
    await axios.post(`${API_BASE}/api/products`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'Empty product creation rejected');
  } catch (err) {
    assert(err.response?.status === 400, 'Empty product rejected with 400 Bad Request');
  }

  // Valid creation
  const tempSku = 'TEST-E2E-' + Date.now().toString(36).toUpperCase();
  const testProductPayload = {
    name: 'E2E Automated Bio Booster ' + tempSku,
    nameTa: 'தானியங்கி பூஸ்டர்',
    category: 'bio-fertilizers',
    crop: 'Paddy',
    price: 350,
    originalPrice: 499,
    mrp: 499,
    stock: 50,
    sku: tempSku,
    inStock: true,
    rating: 4.8,
    reviews: 12,
    images: ['https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=500'],
    dosage: '2.5 ml per litre of water',
    storageInfo: 'Store in a cool dry place away from sunlight',
    deliveryTime: '2-3 Business Days'
  };

  const createProdRes = await axios.post(`${API_BASE}/api/products`, testProductPayload, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(createProdRes.data.success === true, 'Product created successfully');
  const createdId = createProdRes.data.data.id;
  assert(!!createdId, `Product assigned unique ID: ${createdId}`);

  // Clean deletion
  const delRes = await axios.delete(`${API_BASE}/api/products/${createdId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(delRes.data.success === true, `Product deleted cleanly: ${createdId}`);

  // ---------------------------------------------------------
  // 4. CART & ORDER CREATION (SERVER-SIDE PRICE INTEGRITY)
  // ---------------------------------------------------------
  console.log('\n👉 Section 4: Cart & Order Creation with Server Pricing');
  const products = await db.getProducts({ activeOnly: true });
  const targetProduct = products[0];
  assert(!!targetProduct, `Target catalog product selected: ${targetProduct.name}`);

  const orderPayload = {
    customerName: 'Master QA Tester',
    customerPhone: '9876543210',
    doorNo: '12/4',
    street: 'Agro Farm Lane',
    area: 'Green Field',
    taluk: 'Salem South',
    district: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636001',
    items: [
      {
        id: targetProduct.id,
        productId: targetProduct.id,
        name: targetProduct.name,
        price: targetProduct.price,
        quantity: 1,
        packSize: targetProduct.packSizes?.[0]?.size || '1L'
      }
    ],
    paymentMethod: 'Cash on Delivery'
  };

  const orderRes = await axios.post(`${API_BASE}/api/orders`, orderPayload, {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(orderRes.data.success === true, 'Order created successfully via API');
  const placedOrder = orderRes.data.data || orderRes.data.order;
  assert(!!placedOrder.id, `Order generated with ID: ${placedOrder.id}`);
  assert(placedOrder.paymentStatus === 'Pending', 'COD order marked paymentStatus: Pending');

  // Verify order retrievable for Order Status & Tracking
  const getOrdersRes = await axios.get(`${API_BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(getOrdersRes.data.success === true, 'Farmer orders retrieved via GET /api/orders');
  const matchedOrder = getOrdersRes.data.data.find(o => o.id === placedOrder.id);
  assert(!!matchedOrder, `Placed order ${placedOrder.id} verified in farmer order list for tracking`);

  // ---------------------------------------------------------
  // 5. PAYMENT GATEWAY SECURITY & CRYPTOGRAPHY
  // ---------------------------------------------------------
  console.log('\n👉 Section 5: Payment Gateway Security & HMAC Validation');
  // Min amount check
  try {
    await axios.post(`${API_BASE}/api/create-order`, { amount: 50 });
    assert(false, 'Min amount not enforced');
  } catch (err) {
    assert(err.response?.status === 400, 'Charge < 100 paise rejected with 400');
  }

  // Tampered signature rejection
  try {
    await axios.post(`${API_BASE}/api/payments/verify`, {
      razorpay_order_id: 'order_fake_111',
      razorpay_payment_id: 'pay_fake_222',
      razorpay_signature: 'fake_tampered_signature_hex'
    });
    assert(false, 'Tampered signature was accepted');
  } catch (err) {
    assert(err.response?.status === 400, 'Tampered Razorpay signature rejected with 400 Signature Mismatch');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n================================================================');
  console.log(`  🎉 ALL ${passedCount}/${totalCount} MASTER E2E TESTS PASSED SUCCESSFULLY! (${duration}s)`);
  console.log('================================================================\n');

  process.exit(0);
}

runMasterE2ESuite().catch(err => {
  console.error('\n❌ Master E2E Suite execution failed:', err);
  process.exit(1);
});
