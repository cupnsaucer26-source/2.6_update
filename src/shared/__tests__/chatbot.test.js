import { test } from 'node:test';
import assert from 'node:assert/strict';

// Helper extracting tags from text exactly like Chatbot.jsx
function extractAiTags(text) {
  if (!text) return [];
  const tagRegex = /\[\[(PRODUCT|PAGE|WHATSAPP):([^:]+)(?::([^\]]+))?\]\]/g;
  const tags = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push({
      type: match[1],
      target: match[2],
      label: match[3] || match[2]
    });
  }
  return tags;
}

// Builds initial conversation starter given a user or guest
function buildInitialState(user) {
  if (user?.crop) {
    return {
      greeting: `வணக்கம் ${user.name ? `${user.name} ji` : 'விவசாயி'}!`,
      crop: user.crop,
      initialSuggestions: [
        { id: 'crop_pest', label: `🌾 ${user.crop} Pest & Disease remedies`, category: 'crop' },
        { id: 'crop_fert', label: `🌱 ${user.crop} Fertilizer & Growth Schedule`, category: 'crop' },
        { id: 'crop_soil', label: '🧪 Check Soil Health Card', category: 'action' },
        { id: 'crop_expert', label: '👨‍⚕️ Book Agronomy Doctor Consultation', category: 'action' }
      ]
    };
  }
  return {
    greeting: 'வணக்கம்! Welcome to Sathyam Agro Mart AI Assistant.',
    crop: null,
    initialSuggestions: [
      { id: 'start_paddy', label: '🌾 Paddy Blast & Yellow Leaf Diagnosis', category: 'crop' },
      { id: 'start_cotton', label: '🐛 Cotton Whitefly & Pest Control', category: 'crop' },
      { id: 'start_soil', label: '🌱 Soil Test Guidance & Fertilizer Dosage', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ Consult an Agronomy Specialist', category: 'expert' }
    ]
  };
}

// Builds navigation state for Agronomy Expert booking
function buildExpertBookingReferral(msg, user, sessionId) {
  return {
    state: {
      fromChat: true,
      topic: msg.detectedTopic || 'Crop Pest & Disease Consultation',
      crop: msg.detectedCrop || user?.crop || 'Paddy/Rice',
      notes: `Referral from AI Crop Assistant (Session: ${sessionId}). Discussed ${msg.detectedTopic || 'crop issue'} on ${msg.detectedCrop || 'crop'}.`
    }
  };
}

test('1. Tag Parser: Correctly extracts PRODUCT, PAGE, and WHATSAPP tags', () => {
  const sample = 'Apply [[PRODUCT:sb-01:BlastShield 75 WP]] early morning. Check [[PAGE:/soil-test-report:Soil Health]] or [[WHATSAPP:Chat with Expert]].';
  const tags = extractAiTags(sample);

  assert.equal(tags.length, 3);
  assert.equal(tags[0].type, 'PRODUCT');
  assert.equal(tags[0].target, 'sb-01');
  assert.equal(tags[0].label, 'BlastShield 75 WP');

  assert.equal(tags[1].type, 'PAGE');
  assert.equal(tags[1].target, '/soil-test-report');
  assert.equal(tags[1].label, 'Soil Health');

  assert.equal(tags[2].type, 'WHATSAPP');
  assert.equal(tags[2].label, 'Chat with Expert');
});

test('2. Initial State: Personalized welcome and suggestions for registered Sugarcane farmer', () => {
  const user = { name: 'Murugan', crop: 'Sugarcane', acreage: 5 };
  const state = buildInitialState(user);

  assert.ok(state.greeting.includes('Murugan ji'));
  assert.equal(state.crop, 'Sugarcane');
  assert.equal(state.initialSuggestions.length, 4);
  assert.ok(state.initialSuggestions.some(s => s.label.includes('Sugarcane Pest')));
  assert.ok(state.initialSuggestions.some(s => s.label.includes('Sugarcane Fertilizer')));
});

test('3. Initial State: Default broad agricultural categories for guest visitor', () => {
  const state = buildInitialState(null);

  assert.ok(state.greeting.includes('Welcome'));
  assert.equal(state.crop, null);
  assert.ok(state.initialSuggestions.some(s => s.id === 'start_paddy'));
  assert.ok(state.initialSuggestions.some(s => s.id === 'start_cotton'));
});

test('4. Expert Booking Referral: Generates safe navigation payload without auto-booking', () => {
  const msg = {
    detectedTopic: 'Stem Borer Outbreak',
    detectedCrop: 'Paddy/Rice',
    offerExpert: true
  };
  const user = { name: 'Karthik', crop: 'Paddy/Rice' };
  const sessionId = 'SES-TEST-999';

  const referral = buildExpertBookingReferral(msg, user, sessionId);
  assert.equal(referral.state.fromChat, true);
  assert.equal(referral.state.topic, 'Stem Borer Outbreak');
  assert.equal(referral.state.crop, 'Paddy/Rice');
  assert.ok(referral.state.notes.includes('SES-TEST-999'));
});

test('5. Multi-turn payload: Formats previous turns bounded to latest 6 turns', () => {
  const history = [
    { id: 1, sender: 'user', rawText: 'Turn 1' },
    { id: 2, sender: 'bot', rawText: 'Reply 1' },
    { id: 3, sender: 'user', rawText: 'Turn 2' },
    { id: 4, sender: 'bot', rawText: 'Reply 2' },
    { id: 5, sender: 'user', rawText: 'Turn 3' },
    { id: 6, sender: 'bot', rawText: 'Reply 3' },
    { id: 7, sender: 'user', rawText: 'Turn 4' },
    { id: 8, sender: 'bot', rawText: 'Reply 4' }
  ];

  const payload = history.filter(m => m.rawText).slice(-6).map(m => ({ sender: m.sender, text: m.rawText }));
  assert.equal(payload.length, 6);
  assert.equal(payload[0].text, 'Turn 2');
  assert.equal(payload[5].text, 'Reply 4');
});
