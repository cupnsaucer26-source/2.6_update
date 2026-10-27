// Support Ticket System - Acceptance Test Suite
// Verifies Store Boundary Isolation (SEC-01), Internal Notes Privacy (PRV-01),
// Order Ownership Validation (VAL-01), Ticket Lifecycle Reopening & Closing (FLW-01),
// Priority Escalation, and Single Ticket Fetch (PRF-01).

import { test, before, after } from 'node:test';
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

console.log = () => {};
console.warn = () => {};
console.error = () => {};

const users = [
  { id: 'U-SUPER', name: 'Super Admin', role: 'superadmin', status: 'active', password: 'h' },
  { id: 'U-ADMIN-A', name: 'Admin Store A', role: 'admin', status: 'active', password: 'h', storeId: 'STR-A' },
  { id: 'U-ADMIN-B', name: 'Admin Store B', role: 'admin', status: 'active', password: 'h', storeId: 'STR-B' },
  { id: 'U-EMP-A', name: 'Karthik (Store A Staff)', role: 'employee', status: 'active', password: 'h', storeId: 'STR-A' },
  { id: 'U-EMP-B', name: 'Suresh (Store B Staff)', role: 'employee', status: 'active', password: 'h', storeId: 'STR-B' },
  { id: 'U-FARMER-1', name: 'Farmer Raman', role: 'farmer', status: 'active', password: 'h', phone: '9876543210' },
  { id: 'U-FARMER-2', name: 'Farmer Velu', role: 'farmer', status: 'active', password: 'h', phone: '9876543211' },
];

const byId = new Map(users.map((u) => [u.id, u]));
const token = (id) => signToken(id, 'h');

const tickets = new Map();
const orders = new Map([
  [
    'ORD-RAMAN-101',
    {
      id: 'ORD-RAMAN-101',
      userId: 'U-FARMER-1',
      customerPhone: '9876543210',
      total: 1250,
      status: 'Delivered',
      items: [{ productId: 'PRD-1', name: 'Bio NPK', quantity: 2, price: 500 }],
    },
  ],
]);

const stores = new Map([
  ['STR-A', { id: 'STR-A', name: 'Coimbatore Hub', location: 'Coimbatore', status: 'active' }],
  ['STR-B', { id: 'STR-B', name: 'Madurai Hub', location: 'Madurai', status: 'active' }],
]);

const clone = (x) => (x ? JSON.parse(JSON.stringify(x)) : null);

Object.assign(db, {
  kvGet: async () => null,
  kvSet: async (k, v) => v,
  kvGetMany: async () => new Map(),
  kvClaimSlot: async () => 0,
  kvIncrement: async () => 1,
  getUserById: async (id) => byId.get(id) ?? null,
  getStoreById: async (id) => stores.get(id) ?? null,
  getStores: async () => [...stores.values()].map(clone),
  listStaffProfiles: async () => [...byId.values()].map(clone),
  getOrderById: async (id) => clone(orders.get(id)) ?? null,
  getTickets: async () => [...tickets.values()].map(clone),
  getTicketById: async (id) => clone(tickets.get(id)),
  addTicket: async (t) => { tickets.set(t.id, clone(t)); return clone(t); },
  updateTicket: async (id, u) => {
    const t = tickets.get(id);
    if (!t) return null;
    Object.assign(t, u);
    return clone(t);
  },
  addTicketReply: async (id, r) => {
    const t = tickets.get(id);
    if (!t) return null;
    t.replies.push(r);
    return clone(t);
  },
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

async function call(id, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (id) headers.Authorization = `Bearer ${token(id)}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// -----------------------------------------------------------------------------
// TEST SUITE
// -----------------------------------------------------------------------------

test('VAL-01: Order ownership validation prevents spoofing another customer order', async () => {
  // Farmer 2 attempts to raise a ticket referencing Farmer 1's order
  const spoofAttempt = await call('U-FARMER-2', 'POST', '/api/tickets', {
    orderId: 'ORD-RAMAN-101',
    subject: 'Did not receive goods',
    description: 'Please refund me',
  });
  assert.equal(spoofAttempt.status, 403);
  assert.match(spoofAttempt.body.message, /order does not belong to your account/i);

  // Farmer 1 raises ticket referencing their own order -> succeeds and inherits verified order items
  const validTicket = await call('U-FARMER-1', 'POST', '/api/tickets', {
    orderId: 'ORD-RAMAN-101',
    subject: 'Damaged seal on delivery',
    description: 'Bottle leaked inside carton',
  });
  assert.equal(validTicket.status, 200);
  assert.equal(validTicket.body.data.orderId, 'ORD-RAMAN-101');
  assert.equal(validTicket.body.data.orderItems.length, 1);
  assert.equal(validTicket.body.data.orderItems[0].name, 'Bio NPK');
});

test('SEC-01: Store Boundary Isolation: Employees can only view tickets scoped to their store', async () => {
  // Setup: Ticket 1 assigned to Store A, no employee assigned yet
  const t1 = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Store A crop question',
    description: 'Paddy blast symptoms',
  });
  const ticket1Id = t1.body.data.id;
  await call('U-SUPER', 'PUT', `/api/tickets/${ticket1Id}/assign`, {
    storeId: 'STR-A',
    assignedToId: 'U-ADMIN-A',
  });
  // Unassign employee so it enters Store A's open queue
  const t1StoreA = tickets.get(ticket1Id);
  t1StoreA.assignedToId = null;
  t1StoreA.assignedToName = 'Unassigned';

  // Setup: Ticket 2 assigned to Store B, no employee assigned yet
  const t2 = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Store B crop question',
    description: 'Sugarcane red rot',
  });
  const ticket2Id = t2.body.data.id;
  await call('U-SUPER', 'PUT', `/api/tickets/${ticket2Id}/assign`, {
    storeId: 'STR-B',
    assignedToId: 'U-ADMIN-B',
  });
  const t2StoreB = tickets.get(ticket2Id);
  t2StoreB.assignedToId = null;
  t2StoreB.assignedToName = 'Unassigned';

  // Employee A (Store A) lists tickets
  const empAList = await call('U-EMP-A', 'GET', '/api/tickets');
  assert.equal(empAList.status, 200);
  const empATicketIds = empAList.body.data.map((t) => t.id);
  assert.ok(empATicketIds.includes(ticket1Id), 'Employee A should see unassigned ticket from Store A');
  assert.ok(!empATicketIds.includes(ticket2Id), 'Employee A must NOT see unassigned ticket from Store B (SEC-01)');

  // Employee B (Store B) lists tickets
  const empBList = await call('U-EMP-B', 'GET', '/api/tickets');
  assert.equal(empBList.status, 200);
  const empBTicketIds = empBList.body.data.map((t) => t.id);
  assert.ok(empBTicketIds.includes(ticket2Id), 'Employee B should see unassigned ticket from Store B');
  assert.ok(!empBTicketIds.includes(ticket1Id), 'Employee B must NOT see unassigned ticket from Store A (SEC-01)');
});

test('PRV-01: Internal Staff Notes Privacy: Internal notes are scrubbed for customer', async () => {
  // Setup a ticket for Farmer 1
  const tRes = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Fertilizer dilution ratio',
    description: 'How many ml per litre?',
  });
  const tId = tRes.body.data.id;

  // Staff adds a private internal note
  const internalNote = await call('U-SUPER', 'POST', `/api/tickets/${tId}/replies`, {
    text: 'Staff note: Check batch lab report before replying to farmer',
    isInternal: true,
  });
  assert.equal(internalNote.status, 200);

  // Staff adds a customer-visible public reply
  const publicReply = await call('U-SUPER', 'POST', `/api/tickets/${tId}/replies`, {
    text: 'Dilute 3ml per litre of water and spray during evening hours.',
    isInternal: false,
  });
  assert.equal(publicReply.status, 200);

  // Customer fetches ticket list: internal note must be absent
  const custTickets = await call('U-FARMER-1', 'GET', '/api/tickets');
  const foundTicket = custTickets.body.data.find((t) => t.id === tId);
  assert.ok(foundTicket, 'Farmer should find their ticket');
  assert.equal(
    foundTicket.replies.some((r) => r.text.includes('Check batch lab report')),
    false,
    'Customer list must not contain internal note'
  );
  assert.ok(
    foundTicket.replies.some((r) => r.text.includes('Dilute 3ml')),
    'Customer list must contain public reply'
  );

  // Customer fetches single ticket by ID: internal note must be absent
  const custSingle = await call('U-FARMER-1', 'GET', `/api/tickets/${tId}`);
  assert.equal(custSingle.status, 200);
  assert.equal(
    custSingle.body.data.replies.some((r) => r.text.includes('Check batch lab report')),
    false,
    'Customer single ticket view must not contain internal note'
  );

  // Staff fetches ticket: internal note MUST be visible with isInternal: true
  const staffSingle = await call('U-SUPER', 'GET', `/api/tickets/${tId}`);
  assert.equal(staffSingle.status, 200);
  const noteReply = staffSingle.body.data.replies.find((r) => r.text.includes('Check batch lab report'));
  assert.ok(noteReply, 'Staff must see internal note');
  assert.equal(noteReply.isInternal, true, 'Staff reply must have isInternal: true');
});

test('FLW-01: Lifecycle: Customer reply on Resolved ticket automatically reopens it', async () => {
  const tRes = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Yellow leaf spot query',
    description: 'Leaves turning yellow',
  });
  const tId = tRes.body.data.id;

  // Staff marks ticket as Resolved
  const resolveRes = await call('U-SUPER', 'PUT', `/api/tickets/${tId}/status`, { status: 'Resolved' });
  assert.equal(resolveRes.status, 200);
  assert.equal(resolveRes.body.data.status, 'Resolved');

  // Customer replies to the Resolved ticket
  const custReply = await call('U-FARMER-1', 'POST', `/api/tickets/${tId}/replies`, {
    text: 'The spots have spread to lower leaves too, need more help',
  });
  assert.equal(custReply.status, 200);
  // Status should have been automatically reopened to "In Progress"
  assert.equal(custReply.body.data.status, 'In Progress', 'Customer reply must automatically reopen Resolved ticket');
});

test('FLW-01: Customer Resolution: Farmer can mark Resolved ticket as Closed', async () => {
  const tRes = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Packaging tear',
    description: 'Corner was torn',
  });
  const tId = tRes.body.data.id;

  // Staff marks Resolved
  await call('U-SUPER', 'PUT', `/api/tickets/${tId}/status`, { status: 'Resolved' });

  // Farmer confirms resolution: marks as Closed
  const closeRes = await call('U-FARMER-1', 'PUT', `/api/tickets/${tId}/status`, { status: 'Closed' });
  assert.equal(closeRes.status, 200);
  assert.equal(closeRes.body.data.status, 'Closed');

  // Farmer cannot set arbitrary status like Resolved or Rejected directly
  const invalidStatus = await call('U-FARMER-1', 'PUT', `/api/tickets/${tId}/status`, { status: 'Rejected' });
  assert.equal(invalidStatus.status, 403);
});

test('PUT /api/tickets/:id/priority: Staff can escalate ticket priority', async () => {
  const tRes = await call('U-FARMER-1', 'POST', '/api/tickets', {
    subject: 'Delayed dispatch',
    description: 'Order SAM-ORD-101 not yet shipped',
  });
  const tId = tRes.body.data.id;
  assert.equal(tRes.body.data.priority, 'Medium');

  // Customer cannot change priority
  const custPriority = await call('U-FARMER-1', 'PUT', `/api/tickets/${tId}/priority`, { priority: 'Urgent' });
  assert.equal(custPriority.status, 403);

  // Super Admin can change priority
  const adminPriority = await call('U-SUPER', 'PUT', `/api/tickets/${tId}/priority`, { priority: 'Urgent' });
  assert.equal(adminPriority.status, 200);
  assert.equal(adminPriority.body.data.priority, 'Urgent');
});

test('POST /api/tickets/upload: Authenticated users can upload ticket attachments', async () => {
  // Test authentication requirement
  const unauth = await fetch(`${base}/api/tickets/upload`, { method: 'POST' });
  assert.equal(unauth.status, 401);

  // Authenticated upload with valid 1x1 transparent PNG base64
  const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const uploadRes = await call('U-FARMER-1', 'POST', '/api/tickets/upload', {
    filename: 'damage_photo.png',
    contentType: 'image/png',
    data: png1x1Base64,
  });

  assert.equal(uploadRes.status, 200);
  assert.equal(uploadRes.body.success, true);
  assert.ok(uploadRes.body.data.url.startsWith('/uploads/tkt-'));
  assert.equal(uploadRes.body.data.filename, 'damage_photo.png');
  assert.equal(uploadRes.body.data.mimetype, 'image/png');
});
