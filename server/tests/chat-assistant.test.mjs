import { test } from 'node:test';
import assert from 'node:assert/strict';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: '',
  OTP_HASH_SECRET: 'test-secret',
  AUTH_TOKEN_SECRET: 'test-secret',
  ORDER_WHATSAPP_MESSAGES: 'off',
  GEMINI_API_KEY: '',
});

const { db } = await import('../db.js');
const { default: app } = await import('../server.js');
const { signToken } = await import('../security.js');
const {
  assembleFarmerContext,
  buildSystemPrompt,
  generateDeterministicFallback
} = await import('../chatAssistant.js');

console.warn = () => {};

// Sample test users
const users = [
  { id: 'U-SUPER', name: 'Super Admin', role: 'superadmin', status: 'active', password: 'h' },
  { id: 'U-ADMIN-A', name: 'Store Admin A', role: 'admin', storeId: 'STR-A', storeName: 'Store A', status: 'active', password: 'h' },
  { id: 'U-FARMER-1', name: 'Muthuvel K', role: 'farmer', crop: 'Paddy/Rice', acreage: 4, district: 'Thanjavur', state: 'Tamil Nadu', phone: '9876543210', status: 'active', password: 'h' },
  { id: 'U-FARMER-2', name: 'Rameshwar Patel', role: 'farmer', crop: 'Cotton', acreage: 6, district: 'Kurnool', state: 'Andhra Pradesh', phone: '9123456789', status: 'active', password: 'h' }
];

const products = [
  { id: 'sb-01', name: 'BlastShield 75 WP', category: 'Fungicide', price: 650, dosage: '150g/acre', crops: ['Paddy', 'Rice'], diseases: ['Blast', 'Spindle Spot', 'Leaf Blight'], online: true },
  { id: 'sb-02', name: 'FlyKill Ultra', category: 'Insecticide', price: 840, dosage: '250g/acre', crops: ['Cotton', 'Vegetables'], diseases: ['Whitefly', 'Aphids', 'Jassids'], online: true },
  { id: 'sb-04', name: 'RootVigor Gold', category: 'Bio-stimulant', price: 990, dosage: '1L/acre', crops: ['All Crops'], diseases: ['Root Stunting', 'Nutrient Deficiency'], online: true }
];

const sampleOrders = [
  {
    id: 'ORD-101',
    userId: 'U-FARMER-1',
    customerPhone: '9876543210',
    items: [{ id: 'sb-01', name: 'BlastShield 75 WP', qty: 2, packSize: '250g' }],
    deliveryStatus: 'Delivered',
    createdAt: '2026-10-25T10:00:00.000Z'
  }
];

const byId = new Map(users.map(u => [u.id, u]));
const chatRecords = new Map();
const clone = x => (x ? JSON.parse(JSON.stringify(x)) : null);

// Stub test db methods
Object.assign(db, {
  kvGet: async () => null,
  kvSet: async (k, v) => v,
  kvGetMany: async () => new Map(),
  kvClaimSlot: async () => 0,
  kvIncrement: async () => 1,
  getUserById: async id => byId.get(id) ?? null,
  getProducts: async () => products.map(clone),
  getOrdersForCustomer: async u => {
    return sampleOrders.filter(o => o.userId === u.id || o.customerPhone === u.phone).map(clone);
  },
  getChatRecords: async (filter = {}) => {
    return [...chatRecords.values()].filter(r => {
      if (filter.storeId && r.storeId && r.storeId !== filter.storeId) return false;
      if (filter.userId && r.userId !== filter.userId) return false;
      return true;
    }).map(clone);
  },
  getChatRecordBySessionId: async sid => clone(chatRecords.get(sid)),
  addChatRecord: async r => {
    const id = r.sessionId || r.id;
    const existing = chatRecords.get(id);
    if (existing) {
      const merged = { ...existing, ...r, updatedAt: new Date().toISOString() };
      chatRecords.set(id, merged);
      return clone(merged);
    }
    const created = { ...r, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    chatRecords.set(id, created);
    return clone(created);
  }
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
  server = app.listen(0);
  await new Promise(r => server.once('listening', r));
});

test('1. Context Assembly: Authenticated farmer context includes profile and purchase history', async () => {
  const farmer = users.find(u => u.id === 'U-FARMER-1');
  const context = await assembleFarmerContext({
    user: farmer,
    message: 'My leaves have spots',
    history: [],
    db
  });

  assert.equal(context.profile?.name, 'Muthuvel K');
  assert.equal(context.profile?.crop, 'Paddy/Rice');
  assert.equal(context.recentPurchases.length, 1);
  assert.equal(context.recentPurchases[0].productName, 'BlastShield 75 WP');
  assert.ok(context.relevantProducts.length > 0);
  assert.equal(context.relevantProducts[0].id, 'sb-01');
});

test('2. Context Assembly: Guest user has null profile and empty purchase history', async () => {
  const context = await assembleFarmerContext({
    user: null,
    message: 'What fertilizer for vegetables?',
    history: [],
    db
  });

  assert.equal(context.profile, null);
  assert.equal(context.recentPurchases.length, 0);
  assert.ok(context.relevantProducts.length > 0);
});

test('3. Privacy Boundary: Authenticated user cannot access another user order history', async () => {
  const farmer2 = users.find(u => u.id === 'U-FARMER-2');
  const context = await assembleFarmerContext({
    user: farmer2,
    message: 'How to use my order?',
    history: [],
    db
  });

  assert.equal(context.recentPurchases.length, 0);
  assert.equal(context.profile?.crop, 'Cotton');
});

test('4. System Prompt: Strictly grounds catalog items and enforces non-hallucination rules', () => {
  const prompt = buildSystemPrompt({
    profile: { name: 'Muthuvel K', crop: 'Paddy/Rice', acreage: 4, district: 'Thanjavur' },
    recentPurchases: [{ productName: 'BlastShield 75 WP', productId: 'sb-01', packSize: '250g', orderDate: '2026-10-25', deliveryStatus: 'Delivered' }],
    relevantProducts: products
  });

  assert.ok(prompt.includes('Sathyam Agro Mart'));
  assert.ok(prompt.includes('Muthuvel K'));
  assert.ok(prompt.includes('BlastShield 75 WP'));
  assert.ok(prompt.includes('OUTPUT FORMAT'));
  assert.ok(prompt.includes('suggestions'));
  assert.ok(prompt.includes('NEVER fabricate chemical brands'));
});

test('5. Deterministic Fallback: Generates contextual clarifying question and symptom chips for paddy yellowing', () => {
  const fallback = generateDeterministicFallback({
    message: 'My paddy leaves are turning yellow',
    profile: { crop: 'Paddy/Rice' },
    recentPurchases: [],
    relevantProducts: products
  });

  assert.ok(fallback.reply.includes('Paddy Leaf Yellowing'));
  assert.ok(fallback.followUp.length > 0);
  assert.ok(Array.isArray(fallback.suggestions));
  assert.ok(fallback.suggestions.length >= 3);
  assert.equal(fallback.detectedCrop, 'Paddy/Rice');
  assert.equal(fallback.offerExpert, true);
});

test('6. Deterministic Fallback: Generates cotton pest management with severity options', () => {
  const fallback = generateDeterministicFallback({
    message: 'How to control cotton whitefly and curling?',
    profile: { crop: 'Cotton' },
    recentPurchases: [],
    relevantProducts: products
  });

  assert.ok(fallback.reply.includes('Cotton Pest Management'));
  assert.ok(fallback.reply.includes('FlyKill Ultra'));
  assert.ok(fallback.followUp.toLowerCase().includes('severe'));
  assert.ok(fallback.suggestions.some(s => s.id.includes('cotton')));
  assert.equal(fallback.detectedCrop, 'Cotton');
});

test('7. Deterministic Fallback: Purchased product inquiry provides application guidance', () => {
  const fallback = generateDeterministicFallback({
    message: 'How to spray the product I bought?',
    profile: { crop: 'Paddy/Rice' },
    recentPurchases: [{ productName: 'BlastShield 75 WP', packSize: '250g' }],
    relevantProducts: products
  });

  assert.ok(fallback.reply.includes('Guidance for Your Purchased Product'));
  assert.ok(fallback.reply.includes('BlastShield 75 WP'));
  assert.ok(fallback.suggestions.some(s => s.id === 'prod_mixing' || s.id === 'prod_timing'));
});

test('8. POST /api/chat/assistant: Successful response with dynamic suggestions and persistence', async () => {
  const res = await call('U-FARMER-1', 'POST', '/api/chat/assistant', {
    message: 'My paddy crop has brown spots and blast',
    sessionId: 'SES-TEST-001'
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.sessionId, 'SES-TEST-001');
  assert.ok(res.body.reply.length > 0);
  assert.ok(Array.isArray(res.body.suggestions));
  assert.ok(res.body.suggestions.length > 0);

  // Check persistence in chatRecords
  const saved = chatRecords.get('SES-TEST-001');
  assert.ok(saved);
  assert.equal(saved.userId, 'U-FARMER-1');
  assert.equal(saved.user, 'Muthuvel K');
});

test('9. POST /api/chat/assistant: Multi-turn session updates existing record without duplicate error', async () => {
  const res = await call('U-FARMER-1', 'POST', '/api/chat/assistant', {
    message: 'Spindle-shaped brown spots on leaves',
    sessionId: 'SES-TEST-001',
    selectedOption: { id: 'paddy_brown_spots', label: 'Spindle-shaped brown spots on leaves (Blast)' },
    history: [
      { sender: 'user', text: 'My paddy leaves have spots' },
      { sender: 'bot', text: 'Which symptom best describes what you are seeing?' }
    ]
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const updated = chatRecords.get('SES-TEST-001');
  assert.ok(updated);
  assert.equal(updated.messages, 4); // incremented turns
});

test('10. GET /api/chat/records: Requires admin or staff authorization', async () => {
  // Unauthenticated
  const anon = await call(null, 'GET', '/api/chat/records');
  assert.equal(anon.status, 401);

  // Farmer cannot view admin chat records
  const farmer = await call('U-FARMER-1', 'GET', '/api/chat/records');
  assert.equal(farmer.status, 403);

  // Store Admin can view
  const admin = await call('U-ADMIN-A', 'GET', '/api/chat/records');
  assert.equal(admin.status, 200);
  assert.equal(admin.body.success, true);
  assert.ok(Array.isArray(admin.body.data));
  assert.ok(admin.body.data.some(r => r.sessionId === 'SES-TEST-001'));
});

test('11. GET /api/chat/history: Enforces ownership boundaries', async () => {
  // Farmer 1 can access their own session
  const f1 = await call('U-FARMER-1', 'GET', '/api/chat/history?sessionId=SES-TEST-001');
  assert.equal(f1.status, 200);
  assert.equal(f1.body.success, true);

  // Farmer 2 cannot access Farmer 1 session
  const f2 = await call('U-FARMER-2', 'GET', '/api/chat/history?sessionId=SES-TEST-001');
  assert.equal(f2.status, 403);
});

test('12. Validation: Empty message is refused with 400', async () => {
  const res = await call(null, 'POST', '/api/chat/assistant', {
    message: '   ',
    sessionId: 'SES-EMPTY'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('13. Language Directives: buildSystemPrompt strictly enforces English when lang is en', () => {
  const promptEn = buildSystemPrompt({
    profile: { name: 'John Doe', crop: 'Paddy/Rice' },
    recentPurchases: [],
    relevantProducts: products,
    lang: 'en'
  });
  assert.ok(promptEn.includes('The website is currently set to ENGLISH'));
  assert.ok(promptEn.includes('You MUST respond ONLY in clear, natural, professional ENGLISH'));
  assert.ok(promptEn.includes('NEVER use Tamil'));

  const promptTa = buildSystemPrompt({
    profile: { name: 'Muthuvel K', crop: 'Paddy/Rice' },
    recentPurchases: [],
    relevantProducts: products,
    lang: 'ta'
  });
  assert.ok(promptTa.includes('The website is currently set to TAMIL (தமிழ்)'));
  assert.ok(promptTa.includes('வணக்கம் விவசாயி!'));
});

test('14. Language Fallback: generateDeterministicFallback returns English for en and Tamil for ta', () => {
  const fbEn = generateDeterministicFallback({
    message: 'paddy yellow leaves',
    profile: null,
    recentPurchases: [],
    relevantProducts: products,
    lang: 'en'
  });
  assert.ok(fbEn.reply.includes('Paddy Leaf Yellowing & Health Diagnosis'));
  assert.ok(!fbEn.reply.includes('வணக்கம்'));

  const fbTa = generateDeterministicFallback({
    message: 'நெல் மஞ்சள் இலை',
    profile: null,
    recentPurchases: [],
    relevantProducts: products,
    lang: 'ta'
  });
  assert.ok(fbTa.reply.includes('நெல் இலை மஞ்சள் & கருகல் நோய்'));
  assert.ok(fbTa.suggestions.some(s => s.label.includes('மஞ்சள்')));
});

test('15. POST /api/chat/assistant: Accepts lang parameter and passes cleanly', async () => {
  const resTa = await call(null, 'POST', '/api/chat/assistant', {
    message: 'நெல் இலை கருகல்',
    sessionId: 'SES-LANG-TA',
    lang: 'ta'
  });
  assert.equal(resTa.status, 200);
  assert.equal(resTa.body.success, true);
  assert.ok(resTa.body.reply.includes('நெல்'));

  const resEn = await call(null, 'POST', '/api/chat/assistant', {
    message: 'paddy blast disease',
    sessionId: 'SES-LANG-EN',
    lang: 'en'
  });
  assert.equal(resEn.status, 200);
  assert.equal(resEn.body.success, true);
  assert.ok(resEn.body.reply.includes('Paddy'));
});

test('teardown test server', async () => {
  await new Promise(r => server.close(r));
});
