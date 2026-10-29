import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { db } from '../db.js';
import { signToken, hashPassword } from '../security.js';

const BASE = 'http://localhost:5000';

async function makeUser(role, name, phone, store = {}) {
  const allUsers = await db.getUsers();
  const existing = allUsers.find(u => u.phone === phone);
  if (existing) await db.deleteUser(existing.id);
  const plainPassword = 'SathyamStaff#2026!';
  const user = await db.createUser({
    name,
    phone,
    role,
    password: plainPassword,
    storeId: store.id || '',
    storeName: store.name || '',
    storeLocation: store.location || '',
    department: 'Testing',
    status: 'active',
    createdBy: 'test'
  });
  const sessionId = 'sess-' + Math.random().toString(36).slice(2);
  await db.setUserSessionId(user.id, sessionId);
  const stored = await db.getUserById(user.id, { includePassword: true });
  const token = signToken(user.id, stored.password, sessionId);
  return { ...user, token, password: stored.password };
}

test('Staff, Store & Multi-Store Isolation Test Suite', async (t) => {

  // Create isolated stores A (Trichy) and B (Thanjavur)
  const storeA = await db.createStore({
    name: 'Trichy Hub Test',
    code: 'TRY01',
    location: 'Trichy',
    address: '10 Rockfort Rd',
    phone: '9842000001',
    email: 'trichy@test.com'
  });

  const storeB = await db.createStore({
    name: 'Thanjavur Hub Test',
    code: 'TNJ01',
    location: 'Thanjavur',
    address: '20 Big Temple Rd',
    phone: '9842000002',
    email: 'thanjavur@test.com'
  });

  // Create Store Admins
  const adminA = await makeUser('admin', 'Trichy Admin', '9842011001', storeA);
  const adminB = await makeUser('admin', 'Thanjavur Admin', '9842011002', storeB);

  // Link Store Admins
  await db.updateStore(storeA.id, { adminId: adminA.id, adminName: adminA.name });
  await db.updateStore(storeB.id, { adminId: adminB.id, adminName: adminB.name });

  // Create Delivery Agents
  const deliveryA = await makeUser('delivery', 'Trichy Delivery', '9842022001', storeA);
  const deliveryB = await makeUser('delivery', 'Thanjavur Delivery', '9842022002', storeB);

  // Create Employees
  const employeeA = await makeUser('employee', 'Trichy Employee', '9842033001', storeA);
  const employeeB = await makeUser('employee', 'Thanjavur Employee', '9842033002', storeB);

  // Create Staff Profiles
  await db.upsertStaffProfile(employeeA.id, { storeId: storeA.id, designation: 'Field Tech', department: 'Operations' });
  await db.upsertStaffProfile(employeeB.id, { storeId: storeB.id, designation: 'Crop Specialist', department: 'Agronomy' });

  // Create Billing Staff
  const billingA = await makeUser('billing', 'Trichy Cashier', '9842044001', storeA);

  await t.test('1. Store Admin A cannot view Store B staff profiles', async () => {
    // Admin A requests /api/admin/staff-profiles
    const res = await fetch(`${BASE}/api/admin/staff-profiles?storeId=${storeB.id}`, {
      headers: { Authorization: `Bearer ${adminA.token}` }
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    // Should be strictly scoped to Store A, ignoring the spoofed storeId=storeB.id
    const storeIds = body.data.map(p => p.storeId).filter(Boolean);
    assert.ok(storeIds.every(id => id === storeA.id), 'Store Admin A received profiles outside Store A!');
  });

  await t.test('2. Store Admin A cannot access specific staff profile of Store B employee', async () => {
    const res = await fetch(`${BASE}/api/admin/staff-profiles/${employeeB.id}`, {
      headers: { Authorization: `Bearer ${adminA.token}` }
    });
    assert.equal(res.status, 403, 'Cross-store profile view should be 403 Forbidden');
  });

  await t.test('3. Store Admin A cannot designate Store B employee as agronomy expert', async () => {
    const res = await fetch(`${BASE}/api/admin/employees/${employeeB.id}/agronomy-expert`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ isAgronomyExpert: true, specialization: 'Paddy' })
    });
    assert.equal(res.status, 403, 'Cross-store employee modification should be 403 Forbidden');
  });

  await t.test('4. Store Admin A cannot assign Store B delivery agent to an order', async () => {
    const order = await db.createOrder({
      customerName: 'Test Farmer',
      customerPhone: '9876543210',
      total: 500,
      subtotal: 500
    });

    const res = await fetch(`${BASE}/api/orders/${order.id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ deliveryUserId: deliveryB.id })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /Pick a delivery staff member from your own store/i);
  });

  await t.test('5. Delivery workflow: Agent cannot mark Delivered without OTP, accepts valid OTP', async () => {
    const order = await db.createOrder({
      customerName: 'Farmer Kannan',
      customerPhone: '9876543210',
      total: 1200,
      subtotal: 1200,
      assignedDeliveryBoy: deliveryA.name,
      assignedDeliveryUserId: deliveryA.id
    });

    // Attempt direct transition to Delivered via status endpoint (must be rejected for delivery agent)
    const directRes = await fetch(`${BASE}/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deliveryA.token}`
      },
      body: JSON.stringify({ status: 'Delivered' })
    });
    assert.equal(directRes.status, 403, 'Delivery staff cannot bypass OTP to mark Delivered');

    // Attempt OTP verification with wrong OTP
    const wrongOtpRes = await fetch(`${BASE}/api/delivery/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deliveryA.token}`
      },
      body: JSON.stringify({ orderId: order.id, otp: '0000' })
    });
    assert.equal(wrongOtpRes.status, 400, 'Wrong OTP should be 400 Bad Request');

    // Fetch order from DB to get the generated OTP
    const dbOrder = await db.getOrderById(order.id);
    assert.ok(dbOrder.otp, 'Order must have a generated OTP');

    // Complete delivery with correct OTP
    const validOtpRes = await fetch(`${BASE}/api/delivery/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deliveryA.token}`
      },
      body: JSON.stringify({ orderId: order.id, otp: dbOrder.otp })
    });
    assert.equal(validOtpRes.status, 200);
    const validBody = await validOtpRes.json();
    assert.equal(validBody.order.deliveryStatus, 'Delivered');
  });

  await t.test('6. Billing POS: Invoices strictly scoped by store code & storeId', async () => {
    // Trichy billing staff creates an invoice
    const invRes = await fetch(`${BASE}/api/billing/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${billingA.token}`
      },
      body: JSON.stringify({
        customerName: 'Trichy Walk-in Farmer',
        customerPhone: '9842000099',
        paymentMode: 'Cash',
        items: [
          { name: 'Organic Compost 10kg', qty: 2, price: 250, gstRate: 18 }
        ]
      })
    });
    assert.equal(invRes.status, 200);
    const invBody = await invRes.json();
    assert.ok(invBody.invoice.invoiceNo.includes('TRY01'), `Invoice number should contain store code TRY01, got: ${invBody.invoice.invoiceNo}`);
    assert.equal(invBody.invoice.storeId, storeA.id);

    // Verify invoice history scopes to Store A only
    const historyRes = await fetch(`${BASE}/api/billing/invoices`, {
      headers: { Authorization: `Bearer ${billingA.token}` }
    });
    assert.equal(historyRes.status, 200);
    const historyBody = await historyRes.json();
    assert.ok(historyBody.data.every(inv => inv.storeId === storeA.id), 'Billing staff received invoices from another store!');
  });

  await t.test('7. Store Admin A cannot create an admin account', async () => {
    const res = await fetch(`${BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({
        name: 'Rogue Admin',
        phone: '9842099991',
        role: 'admin',
        password: 'SathyamStaff#2026!'
      })
    });
    assert.equal(res.status, 403, 'Store Admin creating another admin should be 403 Forbidden');
  });

  await t.test('8. Store Admin A creating employee automatically scopes to Store A', async () => {
    const res = await fetch(`${BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({
        name: 'Auto-Scoped Worker',
        phone: '9842099992',
        role: 'employee',
        password: 'SathyamStaff#2026!'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.storeId, storeA.id, 'Created employee must be scoped to Store A');
    assert.equal(body.user.assignedAdminId, adminA.id, 'Created employee must report to Store Admin A');
    await db.deleteUser(body.user.id);
  });

  await t.test('9. Store Admin A cannot modify or delete Store Admin B', async () => {
    const putRes = await fetch(`${BASE}/api/admin/users/${adminB.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ name: 'Tampered Name' })
    });
    assert.equal(putRes.status, 403, 'Store Admin A modifying Admin B should be 403 Forbidden');

    const delRes = await fetch(`${BASE}/api/admin/users/${adminB.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminA.token}` }
    });
    assert.equal(delRes.status, 403, 'Store Admin A deleting Admin B should be 403 Forbidden');
  });

  await t.test('10. Store Admin A cannot reassign an employee to Store B', async () => {
    const putRes = await fetch(`${BASE}/api/admin/users/${employeeA.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ storeId: storeB.id })
    });
    assert.equal(putRes.status, 403, 'Store Admin A reassigning employee to Store B should be 403 Forbidden');
  });

  await t.test('11. Inactive store cannot issue POS billing invoices', async () => {
    const staleStores = (await db.getStores()).filter(s => s.code === 'CLS01');
    for (const s of staleStores) await db.deleteStore(s.id);
    // Create an inactive store
    const inactiveStore = await db.createStore({
      name: 'Closed Store Hub',
      code: 'CLS01',
      location: 'Closed',
      status: 'inactive'
    });
    const inactiveBilling = await makeUser('billing', 'Closed Cashier', '9842099993', inactiveStore);

    const invRes = await fetch(`${BASE}/api/billing/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inactiveBilling.token}`
      },
      body: JSON.stringify({
        customerName: 'Walk-in',
        paymentMode: 'Cash',
        items: [{ name: 'Item', qty: 1, price: 100, gstRate: 18 }]
      })
    });
    assert.equal(invRes.status, 400, 'Inactive store invoice must be rejected 400');
    const invBody = await invRes.json();
    assert.match(invBody.message, /inactive/i);

    await db.deleteStore(inactiveStore.id);
    await db.deleteUser(inactiveBilling.id);
  });

  await t.test('12. Delivered orders cannot be re-assigned or cancelled', async () => {
    const order = await db.createOrder({
      customerName: 'Completed Customer',
      customerPhone: '9876543210',
      total: 300,
      subtotal: 300,
      deliveryStatus: 'Delivered',
      status: 'Delivered'
    });

    const assignRes = await fetch(`${BASE}/api/orders/${order.id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ deliveryUserId: deliveryA.id })
    });
    assert.equal(assignRes.status, 400, 'Re-assigning delivered order should be 400');

    const cancelRes = await fetch(`${BASE}/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminA.token}`
      },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert.equal(cancelRes.status, 400, 'Cancelling delivered order should be 400');
  });

  // Cleanup test entities
  await db.deleteStore(storeA.id);
  await db.deleteStore(storeB.id);
  await db.deleteUser(adminA.id);
  await db.deleteUser(adminB.id);
  await db.deleteUser(deliveryA.id);
  await db.deleteUser(deliveryB.id);
  await db.deleteUser(employeeA.id);
  await db.deleteUser(employeeB.id);
  await db.deleteUser(billingA.id);
  await mongoose.disconnect();
});
