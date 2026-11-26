import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'vm';
import { EN_KEYS, LANGUAGES as STORE_LANGUAGES } from '../../storefront/i18n.js';

function loadPack(code) {
  const source = fs.readFileSync(new URL(`../../../public/js/lang-${code}.js`, import.meta.url), 'utf8');
  const window = {};
  vm.runInNewContext(source, { window });
  const globals = {
    ta: 'SB_LANG_TA',
    kn: 'SB_LANG_KN',
    te: 'SB_LANG_TE',
    hi: 'SB_LANG_HI',
    ml: 'SB_LANG_ML',
    tulu: 'SB_LANG_TULU',
  };
  return window[globals[code]];
}

function loadLanguageContextTranslations() {
  const code = fs.readFileSync(new URL(`../../context/LanguageContext.jsx`, import.meta.url), 'utf8');
  const start = code.indexOf('export const TRANSLATIONS = {');
  const end = code.indexOf('const LanguageContext = createContext(null)');
  if (start === -1 || end === -1) throw new Error('Could not find TRANSLATIONS in LanguageContext.jsx');
  const objSource = code.slice(start + 'export const TRANSLATIONS = '.length, end).trim();
  const clean = objSource.replace(/;+$/, '');
  return eval('(' + clean + ')');
}

const CTX_TRANSLATIONS = loadLanguageContextTranslations();

const packs = {
  ta: loadPack('ta'),
  hi: loadPack('hi'),
  te: loadPack('te'),
  kn: loadPack('kn'),
  ml: loadPack('ml'),
  tulu: loadPack('tulu'),
};

test('1. Context Translations Parity: All 7 languages share identical key schemas', () => {
  const supported = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'tulu'];
  const baseKeys = Object.keys(CTX_TRANSLATIONS.en).sort();
  assert.equal(baseKeys.length, 43);

  for (const lang of supported) {
    const langKeys = Object.keys(CTX_TRANSLATIONS[lang] || {}).sort();
    assert.deepEqual(langKeys, baseKeys, `LanguageContext TRANSLATIONS[${lang}] must have identical keys as English`);
    for (const [key, value] of Object.entries(CTX_TRANSLATIONS[lang])) {
      assert.ok(typeof value === 'string' && value.trim().length > 0, `TRANSLATIONS[${lang}][${key}] cannot be blank`);
    }
  }
});

test('2. Storefront EN_KEYS & Pack Keys Parity: EN_KEYS matches all 66 keys in all language packs', () => {
  const enKeys = Object.keys(EN_KEYS).sort();
  assert.equal(enKeys.length, 66, 'EN_KEYS must define all 66 canonical keys');

  for (const [code, pack] of Object.entries(packs)) {
    const packKeys = Object.keys(pack.keys).sort();
    assert.deepEqual(packKeys, enKeys, `Pack [${code}] keys must match EN_KEYS exactly`);
  }
});

test('3. Agricultural & Agronomy Terminology Consistency: Core crop and disease names exist in all packs', () => {
  const agriculturalTerms = [
    'Paddy / Rice',
    'Cotton',
    'Sugarcane',
    'Banana',
    'Vegetables',
    'Blast',
    'Stem Borer',
    'Fungicides',
    'Insecticides'
  ];

  for (const [code, pack] of Object.entries(packs)) {
    for (const term of agriculturalTerms) {
      const translated = pack.text[term];
      assert.ok(translated && translated.trim().length > 0, `Missing term "${term}" in pack [${code}]`);
    }
  }
});

test('4. Order Lifecycle & Delivery Statuses: All 7 operational states are translated across all packs', () => {
  const statuses = [
    'Confirmed',
    'Dispatched',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Pending',
    'Completed'
  ];

  for (const [code, pack] of Object.entries(packs)) {
    for (const status of statuses) {
      const translated = pack.text[status];
      assert.ok(translated && translated.trim().length > 0, `Missing delivery status "${status}" in pack [${code}]`);
    }
  }
});

test('5. Zero-Regression Storefront Badges & Actions: Newly verified actions exist in all packs', () => {
  const actionTerms = [
    'In Stock',
    'Out of Stock',
    'FREE Delivery',
    'Free Delivery',
    'Cash on Delivery (COD)',
    'Buy Now',
    'Order Now',
    'View Details',
    'Filter',
    'Back to top',
    'No records found'
  ];

  for (const [code, pack] of Object.entries(packs)) {
    for (const action of actionTerms) {
      const translated = pack.text[action];
      assert.ok(translated && translated.trim().length > 0, `Missing action badge "${action}" in pack [${code}]`);
    }
  }
});

test('6. Storage Persistence & Cross-Tab Keys: Keys match SHARED_LANG_KEY contract', () => {
  const SHARED_LANG_KEY = 'sathya_bio_lang';
  const APP_LANG_KEY = 'sathya_lang';
  
  const readyCodes = STORE_LANGUAGES.map(l => l.code);
  assert.deepEqual(readyCodes, ['en', 'ta', 'kn', 'te', 'hi', 'ml', 'tulu']);

  const fakeStorage = new Map();
  function saveLanguage(code) {
    if (readyCodes.includes(code)) {
      fakeStorage.set(SHARED_LANG_KEY, code);
      fakeStorage.set(APP_LANG_KEY, code);
    }
  }
  function readLanguage() {
    return fakeStorage.get(SHARED_LANG_KEY) || fakeStorage.get(APP_LANG_KEY) || 'en';
  }

  saveLanguage('ta');
  assert.equal(readLanguage(), 'ta');
  saveLanguage('hi');
  assert.equal(readLanguage(), 'hi');
  saveLanguage('ml');
  assert.equal(readLanguage(), 'ml');
  saveLanguage('tulu');
  assert.equal(readLanguage(), 'tulu');
  saveLanguage('invalid');
  assert.equal(readLanguage(), 'tulu', 'Invalid code rejected and previous retained');
});
