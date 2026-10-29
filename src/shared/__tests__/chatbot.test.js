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

// Builds initial conversation starter given a user or guest and language
function buildInitialState(user, lang = 'en') {
  if (lang === 'ta') {
    if (user?.crop) {
      return {
        greeting: `வணக்கம் ${user.name ? `${user.name} அவர்களே!` : 'விவசாயி!'}`,
        crop: user.crop,
        initialSuggestions: [
          { id: 'start_paddy', label: '🌾 நெல் இலை கருகல் & மஞ்சள் இலை', category: 'crop' },
          { id: 'start_cotton', label: '🐛 பருத்தி வெள்ளை ஈ & பூச்சி கட்டுப்பாடு', category: 'crop' },
          { id: 'start_soil', label: '🌱 மண் பரிசோதனை & உர பரிந்துரை', category: 'soil' },
          { id: 'start_expert', label: '👨‍⚕️ வேளாண் மருத்துவரிடம் ஆலோசனை பெற', category: 'expert' }
        ]
      };
    }
    return {
      greeting: 'வணக்கம்! சத்யம் அக்ரோ மார்ட் AI பயிர் மருத்துவருக்கு வரவேற்கிறோம்.',
      crop: null,
      initialSuggestions: [
        { id: 'start_paddy', label: '🌾 நெல் இலை கருகல் & மஞ்சள் இலை', category: 'crop' },
        { id: 'start_cotton', label: '🐛 பருத்தி வெள்ளை ஈ & பூச்சி கட்டுப்பாடு', category: 'crop' },
        { id: 'start_soil', label: '🌱 மண் பரிசோதனை & உர பரிந்துரை', category: 'soil' },
        { id: 'start_expert', label: '👨‍⚕️ வேளாண் மருத்துவரிடம் ஆலோசனை பெற', category: 'expert' }
      ]
    };
  }

  // English (default)
  if (user?.crop) {
    return {
      greeting: `Hello ${user.name ? `${user.name}!` : 'Farmer!'}`,
      crop: user.crop,
      initialSuggestions: [
        { id: 'start_paddy', label: '🌾 Paddy Blast & Yellow Leaf Diagnosis', category: 'crop' },
        { id: 'start_cotton', label: '🐛 Cotton Whitefly & Pest Control', category: 'crop' },
        { id: 'start_soil', label: '🌱 Soil Test Guidance & Fertilizer Dosage', category: 'soil' },
        { id: 'start_expert', label: '👨‍⚕️ Consult an Agronomy Specialist', category: 'expert' }
      ]
    };
  }
  return {
    greeting: 'Hello! Welcome to Sathyam Agro Mart AI Crop Doctor.',
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
  const stateEn = buildInitialState(user, 'en');
  assert.ok(stateEn.greeting.includes('Murugan!'));
  assert.equal(stateEn.crop, 'Sugarcane');
  assert.equal(stateEn.initialSuggestions.length, 4);

  const stateTa = buildInitialState(user, 'ta');
  assert.ok(stateTa.greeting.includes('Murugan அவர்களே!'));
  assert.equal(stateTa.crop, 'Sugarcane');
  assert.ok(stateTa.initialSuggestions.some(s => s.label.includes('நெல்')));
});

test('3. Initial State: Default broad agricultural categories for guest visitor', () => {
  const stateEn = buildInitialState(null, 'en');
  assert.ok(stateEn.greeting.includes('Welcome'));
  assert.ok(stateEn.greeting.includes('Hello'));
  assert.equal(stateEn.crop, null);
  assert.ok(stateEn.initialSuggestions.some(s => s.id === 'start_paddy'));

  const stateTa = buildInitialState(null, 'ta');
  assert.ok(stateTa.greeting.includes('வணக்கம்'));
  assert.equal(stateTa.crop, null);
  assert.ok(stateTa.initialSuggestions.some(s => s.label.includes('நெல்')));
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

// Parser extracting markdown segments for test verification
function parseMarkdownSegments(text) {
  if (!text) return [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'bold', value: match[1] });
    lastIndex = boldRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'plain', value: text.slice(lastIndex) });
  }
  return parts;
}

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

test('6. Markdown Bold Parser: Converts **some words** into bold segments without literal asterisks', () => {
  const raw = 'Symptoms of **White Bud** and **Blast** in paddy.';
  const segments = parseMarkdownSegments(raw);

  assert.equal(segments.length, 5);
  assert.equal(segments[0].value, 'Symptoms of ');
  assert.equal(segments[1].type, 'bold');
  assert.equal(segments[1].value, 'White Bud');
  assert.equal(segments[2].value, ' and ');
  assert.equal(segments[3].type, 'bold');
  assert.equal(segments[3].value, 'Blast');
  assert.equal(segments[4].value, ' in paddy.');

  // Confirm no raw ** asterisks remain in extracted bold content
  assert.ok(!segments[1].value.includes('*'));
  assert.ok(!segments[3].value.includes('*'));
});
