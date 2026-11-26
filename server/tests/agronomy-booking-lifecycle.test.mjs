import { test } from 'node:test';
import assert from 'node:assert/strict';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: '',
  OTP_HASH_SECRET: 'test-secret',
  AUTH_TOKEN_SECRET: 'test-secret',
  ORDER_WHATSAPP_MESSAGES: 'off',
});

const { db } = await import('../db.js');
const { default: app } = await import('../server.js');
const { signToken } = await import('../security.js');

// console.log = () => {};
console.warn = () => {};
// console.error = () => {};

const users = [
  { id: 'U-SUPER', name: 'Super Admin', role: 'superadmin', status: 'active', password: 'h' },
  { id: 'U-ADMIN-A', name: 'Store Admin A', role: 'admin', storeId: 'STR-A', storeName: 'Store A', status: 'active', password: 'h' },
  { id: 'U-ADMIN-B', name: 'Store Admin B', role: 'admin', storeId: 'STR-B', storeName: 'Store B', status: 'active', password: 'h' },
  { id: 'U-EXPERT-A', name: 'Dr. Expert A', role: 'employee', storeId: 'STR-A', storeName: 'Store A', isAgronomyExpert: true, status: 'active', password: 'h', profile: { specialization: 'Pest Control', isAgronomyExpert: true } },
  { id: 'U-EXPERT-B', name: 'Dr. Expert B', role: 'employee', storeId: 'STR-B', storeName: 'Store B', isAgronomyExpert: true, status: 'active', password: 'h', profile: { specialization: 'Soil Science', isAgronomyExpert: true } },
  { id: 'U-INACTIVE-EXPERT', name: 'Dr. Inactive', role: 'employee', storeId: 'STR-A', isAgronomyExpert: true, status: 'inactive', password: 'h', profile: { isAgronomyExpert: true } },
  { id: 'U-NORMAL-EMP', name: 'Normal Employee', role: 'employee', storeId: 'STR-A', isAgronomyExpert: false, status: 'active', password: 'h' },
  { id: 'U-FARMER', name: 'Farmer Kumar', role: 'farmer', phone: '9876543210', status: 'active', password: 'h' },
  { id: 'U-OTHER-FARMER', name: 'Farmer Ramesh', role: 'farmer', phone: '9876543211', status: 'active', password: 'h' },
];

const byId = new Map(users.map(u => [u.id, u]));
const bookings = new Map();
const clone = x => (x ? JSON.parse(JSON.stringify(x)) : null);

Object.assign(db, {
  kvGet: async () => null,
  kvSet: async (k, v) => v,
  kvGetMany: async () => new Map(),
  kvClaimSlot: async () => 0,
  kvIncrement: async () => 1,
  getUserById: async id => byId.get(id) ?? null,
  getAgronomyExperts: async (filters = {}) => {
    return users
      .filter(u => u.isAgronomyExpert && (!filters.storeId || u.storeId === filters.storeId))
      .map(clone);
  },
  addAgronomyBooking: async b => {
    bookings.set(b.id, clone(b));
    return clone(b);
  },
  getAgronomyBookings: async (f = {}) => {
    return [...bookings.values()].filter(b => {
      if (f.userId && b.userId !== f.userId) return false;
      if (f.expertId && b.expertId !== f.expertId) return false;
      return true;
    }).map(clone);
  },
  getAgronomyBookingById: async id => clone(bookings.get(id)),
  updateAgronomyBooking: async (id, u) => {
    const b = bookings.get(id);
    if (!b) return null;
    Object.assign(b, u);
    return clone(b);
  },
  getStores: async () => [
    { id: 'STR-A', name: 'Store A', location: 'Coimbatore' },
    { id: 'STR-B', name: 'Store B', location: 'Erode' }
  ]
});

let server;
const call = async (userId, method, path, body) => {
  const headers = { 'content-type': 'application/json' };
  if (userId) headers.authorization = `Bearer ${signToken(userId, 'h')}`;
  const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, body: data };
};

test('setup test server', async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
});

test('1. Creation authorization and validation', async () => {
  // Reject unauthenticated
  const unauth = await call(null, 'POST', '/api/agronomy-bookings', { crop: 'Paddy' });
  assert.equal(unauth.status, 401);

  // Reject past date
  const past = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    crop: 'Paddy',
    phone: '9876543210',
    preferredDate: '2020-01-01',
    preferredSlot: '10:00 AM - 12:00 PM'
  });
  assert.equal(past.status, 400);
  assert.match(past.body.message, /past/i);

  // Reject invalid / non-existent expert
  const badExpert = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'NON-EXISTENT',
    crop: 'Paddy',
    phone: '9876543210'
  });
  assert.equal(badExpert.status, 400);

  // Reject inactive expert
  const inactiveExpert = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'U-INACTIVE-EXPERT',
    crop: 'Paddy',
    phone: '9876543210'
  });
  assert.equal(inactiveExpert.status, 400);
  assert.match(inactiveExpert.body.message, /inactive/i);
});

test('2. Successful booking creation with valid future slot', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const futureDate = tomorrow.toISOString().split('T')[0];

  const res = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'U-EXPERT-A',
    crop: 'Cotton',
    acreage: 5,
    preferredDate: futureDate,
    preferredSlot: '02:00 PM - 04:00 PM',
    topic: 'Pest Advisory',
    phone: '9876543210'
  });
  if (res.status !== 200) console.log('Test 2 failed response:', res.status, res.body);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'Scheduled');
  assert.equal(res.body.data.expertId, 'U-EXPERT-A');
  assert.equal(res.body.data.userId, 'U-FARMER');
});

test('3. Double-booking conflict detection for the same expert & slot', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const futureDate = tomorrow.toISOString().split('T')[0];

  // Another farmer attempts to book same expert at same time
  const conflict = await call('U-OTHER-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'U-EXPERT-A',
    crop: 'Turmeric',
    preferredDate: futureDate,
    preferredSlot: '02:00 PM - 04:00 PM',
    phone: '9876543211'
  });

  assert.equal(conflict.status, 409);
  assert.match(conflict.body.message, /already booked/i);
});

test('4. Store-based agronomist assignment validation', async () => {
  // Create an unassigned booking for Store A
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const futureDate = tomorrow.toISOString().split('T')[0];

  const pendingBooking = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    crop: 'Paddy',
    storeId: 'STR-A',
    storeName: 'Store A',
    preferredDate: futureDate,
    preferredSlot: '10:00 AM - 12:00 PM',
    phone: '9876543210'
  });
  assert.equal(pendingBooking.status, 200);
  assert.equal(pendingBooking.body.data.status, 'Pending');
  const bId = pendingBooking.body.data.id;

  // Store Admin A cannot assign expert from Store B (mismatched store)
  const badStoreAssign = await call('U-ADMIN-A', 'PUT', `/api/agronomy-bookings/${bId}/assign`, {
    expertId: 'U-EXPERT-B'
  });
  assert.equal(badStoreAssign.status, 400);
  assert.match(badStoreAssign.body.message, /store/i);

  // Store Admin A successfully assigns expert from Store A
  const goodAssign = await call('U-ADMIN-A', 'PUT', `/api/agronomy-bookings/${bId}/assign`, {
    expertId: 'U-EXPERT-A'
  });
  assert.equal(goodAssign.status, 200);
  assert.equal(goodAssign.body.data.status, 'Scheduled');
  assert.equal(goodAssign.body.data.expertId, 'U-EXPERT-A');
});

test('5. Reschedule, completion, and cancellation lifecycle', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 5);
  const newDate = tomorrow.toISOString().split('T')[0];

  // Create booking
  const b = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'U-EXPERT-B',
    crop: 'Sugarcane',
    phone: '9876543210',
    preferredDate: newDate,
    preferredSlot: '10:00 AM - 12:00 PM'
  });
  const bookingId = b.body.data.id;

  // Reschedule
  const resched = await call('U-FARMER', 'PUT', `/api/agronomy-bookings/${bookingId}/reschedule`, {
    preferredDate: newDate,
    preferredSlot: '04:00 PM - 06:00 PM'
  });
  assert.equal(resched.status, 200);
  assert.equal(resched.body.data.preferredSlot, '04:00 PM - 06:00 PM');

  // Assigned expert completes call
  const comp = await call('U-EXPERT-B', 'PUT', `/api/agronomy-bookings/${bookingId}/complete`, {
    callbackNotes: 'Advised potash application and irrigation control.'
  });
  assert.equal(comp.status, 200);
  assert.equal(comp.body.data.status, 'Completed');
  assert.equal(comp.body.data.callbackCompleted, true);

  // Cancel test
  const b2 = await call('U-FARMER', 'POST', '/api/agronomy-bookings', {
    expertId: 'U-EXPERT-B',
    crop: 'Maize',
    phone: '9876543210',
    preferredDate: newDate,
    preferredSlot: '10:00 AM - 12:00 PM'
  });
  const b2Id = b2.body.data.id;
  const canc = await call('U-FARMER', 'PUT', `/api/agronomy-bookings/${b2Id}/cancel`, {
    reason: 'Issue resolved by local shop visit'
  });
  assert.equal(canc.status, 200);
  assert.equal(canc.body.data.status, 'Cancelled');
});

test('teardown test server', async () => {
  await new Promise(resolve => server.close(resolve));
});
