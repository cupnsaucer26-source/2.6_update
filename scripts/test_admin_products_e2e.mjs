import assert from 'node:assert/strict';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const BASE = 'http://localhost:5000';

async function runAdminProductTests() {
  console.log('🧪 Starting Part 3: Admin Product Creation & Management Comprehensive Test Suite...');

  // 1. Authenticate / Sign Token as Admin
  const { db } = await import('../server/db.js');
  const { signToken } = await import('../server/security.js');

  const adminUser = await db.getUserByIdentifier('admin', { roles: ['admin', 'superadmin'] }) 
    || (await db.getUsers({ role: 'admin' }))[0];

  assert.ok(adminUser, 'Admin user must exist in DB');
  console.log(`👤 Using Admin User: ${adminUser.name} (${adminUser.id})`);

  // Ensure user has session and generate token
  const sessionId = adminUser.sessionId || 'admin-test-session';
  await db.setUserSessionId(adminUser.id, sessionId);
  const stored = await db.getUserById(adminUser.id, { includePassword: true });
  const token = signToken(adminUser.id, stored.password, sessionId);
  assert.ok(token, 'Admin token generated successfully');

  const authHeader = { Authorization: `Bearer ${token}` };
  console.log('✔ 1. Admin authenticated successfully with signed token');

  // 2. Empty Form Submission
  try {
    await axios.post(`${BASE}/api/products`, {}, { headers: authHeader });
    assert.fail('Empty product submission must be rejected');
  } catch (err) {
    assert.equal(err.response.status, 400, 'Empty product should return 400');
    console.log('✔ 2. Empty form rejected with 400:', err.response.data.message);
  }

  // 3. Missing Required Fields (Missing name, category, or price)
  try {
    await axios.post(`${BASE}/api/products`, { name: 'Incomplete Agro Chem' }, { headers: authHeader });
    assert.fail('Product with missing category and price must be rejected');
  } catch (err) {
    assert.equal(err.response.status, 400);
    console.log('✔ 3. Missing required fields rejected with 400:', err.response.data.message);
  }

  // 4. Invalid / Negative Price
  try {
    await axios.post(`${BASE}/api/products`, {
      name: 'Negative Price Chemical',
      category: 'Fungicide',
      price: -150,
      stock: 10
    }, { headers: authHeader });
    assert.fail('Negative price must be rejected');
  } catch (err) {
    assert.equal(err.response.status, 400);
    console.log('✔ 4. Negative price rejected with 400:', err.response.data.message);
  }

  // 5. Valid Product Creation (All fields)
  const testProductName = `QA Automated Test Formulation ${Date.now()}`;
  const validPayload = {
    name: testProductName,
    category: 'Fungicide',
    form: 'Liquid',
    price: 499,
    originalPrice: 699,
    mrp: 699,
    stock: 50,
    hsnCode: '38089910',
    gstRate: 18,
    badge: 'Bio-Tested',
    crops: 'Paddy / Rice, Cotton, Tomato',
    diseases: 'Blast, Blight',
    description: 'Advanced bio-formulated systemic fungicide for rice blast control.',
    visibility: 'both',
    online: true,
    activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
    dosage: '200ml per Acre',
    packSizes: '250ml, 500ml, 1L',
    images: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0',
    howToUse: 'Mix 1.5ml per liter of water and spray during early vegetative stage.',
    whenToUse: 'Apply at the first appearance of blast lesions on leaf.',
    reviewsEnabled: true,
    emoji: '🌾'
  };

  const createRes = await axios.post(`${BASE}/api/products`, validPayload, { headers: authHeader });
  assert.equal(createRes.status, 200);
  assert.equal(createRes.data.success, true);
  const createdProduct = createRes.data.data;
  assert.ok(createdProduct.id, 'Created product must have an ID');
  assert.equal(createdProduct.name, testProductName);
  assert.equal(createdProduct.price, 499);
  assert.equal(createdProduct.originalPrice || createdProduct.mrp, 699);
  assert.equal(createdProduct.category, 'Fungicide');
  console.log(`✔ 5. Valid product created with ID: ${createdProduct.id}`);

  // 6. Duplicate Product Submission
  try {
    await axios.post(`${BASE}/api/products`, validPayload, { headers: authHeader });
    assert.fail('Duplicate product name should be rejected');
  } catch (err) {
    assert.equal(err.response.status, 409, 'Duplicate product should return 409 Conflict');
    console.log('✔ 6. Duplicate product creation rejected with 409 Conflict');
  }

  // 7. Verify Product in Public API (/api/products)
  const publicRes = await axios.get(`${BASE}/api/products`);
  assert.equal(publicRes.data.success, true);
  const inPublicCatalog = publicRes.data.data.find(p => p.id === createdProduct.id);
  assert.ok(inPublicCatalog, 'Newly created product must be instantly visible in public /api/products');
  assert.equal(inPublicCatalog.name, testProductName);
  assert.equal(inPublicCatalog.price, 499);
  assert.equal(inPublicCatalog.stock, 50);
  console.log('✔ 7. Product verified visible in public catalog');

  // 8. Update Product
  const updateRes = await axios.put(`${BASE}/api/products/${createdProduct.id}`, {
    ...validPayload,
    price: 549,
    originalPrice: 749,
    mrp: 749,
    stock: 45,
    badge: 'Top Pick 2026'
  }, { headers: authHeader });
  assert.equal(updateRes.data.success, true);
  assert.equal(updateRes.data.data.price, 549);
  assert.equal(updateRes.data.data.badge, 'Top Pick 2026');
  console.log('✔ 8. Product successfully updated with new price and badge');

  // 9. Re-verify Public API reflection of update
  const updatedPublicRes = await axios.get(`${BASE}/api/products`);
  const updatedInCatalog = updatedPublicRes.data.data.find(p => p.id === createdProduct.id);
  assert.equal(updatedInCatalog.price, 549);
  assert.equal(updatedInCatalog.badge, 'Top Pick 2026');
  console.log('✔ 9. Product update verified reflected in public catalog');

  // 10. Clean up / Delete Test Product
  const deleteRes = await axios.delete(`${BASE}/api/products/${createdProduct.id}`, { headers: authHeader });
  assert.equal(deleteRes.data.success, true);
  console.log(`✔ 10. Product deleted cleanly with ID: ${createdProduct.id}`);

  // 11. Confirm deleted product is gone from public API
  const finalPublicRes = await axios.get(`${BASE}/api/products`);
  const stillExists = finalPublicRes.data.data.find(p => p.id === createdProduct.id);
  assert.equal(stillExists, undefined, 'Deleted product must not be in public catalog');
  console.log('✔ 11. Deleted product confirmed removed from public catalog');

  console.log('🎉 ALL ADMIN PRODUCT CREATION & MANAGEMENT TESTS PASSED!');
  process.exit(0);
}

runAdminProductTests().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
