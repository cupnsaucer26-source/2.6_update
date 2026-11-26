import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempUploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sathyam-upload-test-'));

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: '',
  OTP_HASH_SECRET: 'test-secret',
  AUTH_TOKEN_SECRET: 'test-secret',
  RAZORPAY_WEBHOOK_SECRET: 'whsec_test_secret_123',
  ORDER_WHATSAPP_MESSAGES: 'off',
  UPLOADS_DIR: tempUploadsDir,
});

const { db } = await import('../db.js');
const { default: app } = await import('../server.js');
const { signToken } = await import('../security.js');

console.log = () => {};
console.warn = () => {};
console.error = () => {};

const admin = { id: 'U-ADMIN', name: 'Admin', role: 'admin', status: 'active', password: 'hash' };
const farmer = { id: 'U-FARMER', name: 'Murugan', role: 'farmer', status: 'active', phone: '9876533333', password: 'hash' };
const people = new Map([admin, farmer].map((u) => [u.id, u]));

let eventsMap;
let kvMap;
let ordersMap;
let finalizeCalls;
let throwOnFinalize;

Object.assign(db, {
  getUserById: async (id) => people.get(id) ?? null,
  kvGet: async (k) => kvMap.get(k) ?? null,
  kvSet: async (k, v) => { kvMap.set(k, v); return v; },
  kvTransition: async (k, fromStatus, toStatus, extra = {}) => {
    const cur = kvMap.get(k);
    if (!cur || cur.status !== fromStatus) return null;
    const next = { ...cur, status: toStatus, ...extra };
    kvMap.set(k, next);
    return next;
  },
  claimWebhookEvent: async (eventId, { eventType = '', payloadHash = '' } = {}) => {
    const existing = eventsMap.get(eventId);
    if (!existing) {
      const rec = { _id: eventId, eventId, eventType, payloadHash, status: 'processing', attempts: 1 };
      eventsMap.set(eventId, rec);
      return { status: 'claimed', record: rec };
    }
    if (existing.status === 'failed') {
      existing.status = 'processing';
      existing.attempts += 1;
      return { status: 'claimed', record: existing };
    }
    if (existing.status === 'processed') {
      return { status: 'duplicate', record: existing };
    }
    return { status: 'in_progress', record: existing };
  },
  completeWebhookEvent: async (eventId, status, { lastError = '' } = {}) => {
    const existing = eventsMap.get(eventId);
    if (!existing) return null;
    existing.status = status;
    existing.lastError = lastError;
    return existing;
  },
  getOrderByRazorpayId: async (rzpId) => {
    if (throwOnFinalize) throw new Error('Transient DB failure');
    return ordersMap.get(rzpId) ?? null;
  },
  reserveStock: async () => ({ ok: true }),
  releaseStock: async () => {},
  createOrder: async (data) => {
    finalizeCalls += 1;
    const order = { id: `ORD-${finalizeCalls}`, ...data };
    ordersMap.set(data.razorpayOrderId, order);
    return order;
  },
  getCMS: async () => ({}),
  claimOrderNotification: async () => false,
  recordOrderNotification: async () => {},
  saveCart: async () => [],
  createUploadMeta: async (meta) => meta,
  recordActivity: async () => {},
});

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempUploadsDir, { recursive: true, force: true });
});

beforeEach(() => {
  eventsMap = new Map();
  kvMap = new Map();
  ordersMap = new Map();
  finalizeCalls = 0;
  throwOnFinalize = false;
  kvMap.set('checkout:order_rzp_1', {
    status: 'pending',
    userId: 'U-FARMER',
    customerName: 'Murugan',
    customerPhone: '9876533333',
    address: 'Salem, TN',
    addressDetails: {},
    lines: [{ id: 'p-1', name: 'Gold Gel', qty: 1, price: 500 }],
    stockLines: [{ id: 'p-1', qty: 1 }],
    subtotal: 500,
    gst: 25,
    total: 525,
  });
});

function signWebhook(rawBody) {
  return crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

test('Webhook rejects invalid HMAC signature cleanly without recording event', async () => {
  const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_rzp_1', id: 'pay_1' } } } });
  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'bad_sig', 'x-razorpay-event-id': 'evt_bad_1' },
    body: payload,
  });
  assert.equal(res.status, 400);
  assert.equal(eventsMap.size, 0);
  assert.equal(finalizeCalls, 0);
});

test('Webhook deduplicates concurrent and repeated deliveries by x-razorpay-event-id', async () => {
  const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_rzp_1', id: 'pay_1' } } } });
  const sig = signWebhook(payload);

  const [r1, r2] = await Promise.all([
    fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_dup_1' },
      body: payload,
    }),
    fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_dup_1' },
      body: payload,
    }),
  ]);

  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  assert.equal(finalizeCalls, 1);

  const b1 = await r1.json();
  const b2 = await r2.json();
  assert.equal([b1.deduplicated, b2.deduplicated].filter(Boolean).length, 1);
  assert.equal(eventsMap.get('evt_dup_1')?.status, 'processed');
});

test('Webhook failed processing allows Razorpay retry recovery with same event ID', async () => {
  const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_rzp_1', id: 'pay_1' } } } });
  const sig = signWebhook(payload);

  throwOnFinalize = true;
  const failRes = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_retry_1' },
    body: payload,
  });
  assert.equal(failRes.status, 500);
  assert.equal(eventsMap.get('evt_retry_1')?.status, 'failed');

  throwOnFinalize = false;
  const okRes = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_retry_1' },
    body: payload,
  });
  assert.equal(okRes.status, 200);
  assert.equal(finalizeCalls, 1);
  assert.equal(eventsMap.get('evt_retry_1')?.status, 'processed');
  assert.equal(eventsMap.get('evt_retry_1')?.attempts, 2);
});

test('Webhook handles omitted x-razorpay-event-id safely using order checkout lock fallback', async () => {
  const payload = JSON.stringify({ event: 'order.paid', payload: { payment: { entity: { order_id: 'order_rzp_1', id: 'pay_1' } } } });
  const sig = signWebhook(payload);

  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig },
    body: payload,
  });
  assert.equal(res.status, 200);
  assert.equal(finalizeCalls, 1);

  // Subsequent webhook delivery with a distinct event ID for the same paid order remains idempotent
  const res2 = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_distinct_2' },
    body: payload,
  });
  assert.equal(res2.status, 200);
  assert.equal(finalizeCalls, 1);
  assert.equal(eventsMap.get('evt_distinct_2')?.status, 'processed');
});

test('POST /api/upload writes atomically without leaving temp files and rejects oversized images', async () => {
  const token = signToken(admin.id, admin.password);
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: 'test.png',
      contentType: 'image/png',
      data: `data:image/png;base64,${tinyPngBase64}`,
    }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.match(body.url, /^\/uploads\/.*\.png$/);

  const tooLargeBuf = Buffer.alloc(10 * 1024 * 1024 + 100, 1);
  const bigRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: 'huge.png',
      contentType: 'image/png',
      data: `data:image/png;base64,${tooLargeBuf.toString('base64')}`,
    }),
  });
  assert.equal(bigRes.status, 413);

  const files = fs.readdirSync(tempUploadsDir);
  assert.equal(files.some((f) => f.startsWith('.tmp-')), false);
  assert.equal(files.length, 1);
});
