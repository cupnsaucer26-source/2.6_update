import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, generateDeterministicFallback } from '../chatAssistant.js';

test('1. Agronomy Safety Protocol: buildSystemPrompt contains strict safety rules', () => {
  const prompt = buildSystemPrompt({
    profile: { name: 'Ravi', crop: 'Paddy', acreage: 3 },
    recentPurchases: [],
    relevantProducts: [{ id: 'sb-01', name: 'Test Product', dosage: '250ml/acre' }]
  });

  assert.ok(prompt.includes('MANDATORY AGRONOMIC SAFETY & EVIDENCE PROTOCOL'), 'Prompt must define agronomic safety protocol');
  assert.ok(prompt.includes('Soil Alkalinity & Gypsum'), 'Prompt must restrict unscientific flat gypsum dosages');
  assert.ok(prompt.includes('Pesticide Tank Mixing'), 'Prompt must restrict unverified tank mixing claims');
  assert.ok(prompt.includes('Pre-Harvest Intervals (PHI)'), 'Prompt must enforce Pre-Harvest Intervals');
  assert.ok(prompt.includes('Spray Scorch / Phytotoxicity'), 'Prompt must prescribe water washing for phytotoxicity');
  assert.ok(prompt.includes('Organic Slurry / Manures'), 'Prompt must require fermented/diluted slurry');
});

test('2. Consultation Action Label: Never promises immediate auto-callback or live chat takeover', () => {
  const prompt = buildSystemPrompt({ profile: null, recentPurchases: [], relevantProducts: [] });
  assert.ok(prompt.includes('Schedule Agronomist Consultation'), 'Must use scheduled consultation terminology');
  assert.ok(!prompt.includes('Book Expert Callback'), 'Must not use misleading immediate callback wording');
});

test('3. Deterministic Fallback: Recommends scheduled consultation and catalog-grounded remedies', () => {
  const fallback = generateDeterministicFallback({
    message: 'My entire field has severe blight and sudden wilting collapse',
    profile: { crop: 'Tomato' },
    recentPurchases: [],
    relevantProducts: [{ id: 'sb-p1', name: 'Pseudomonas Bio', dosage: '500g/acre' }]
  });

  assert.equal(fallback.offerExpert, true, 'Severe outbreak must offer expert consultation');
  assert.ok(Array.isArray(fallback.suggestions), 'Suggestions must be an array');
});
