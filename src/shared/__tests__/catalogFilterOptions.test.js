// The crop labels the catalogue filters offer (src/utils/catalogUtils.js).
// /api/catalog-options is append-only, so the registry accumulates several
// spellings of one crop; the filter lists must show each crop once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cropHandle, dedupeCropLabels, isSameCrop, matchesCrop, topSelling, sortProducts } from '../../utils/catalogUtils.js';

test('the same crop spelled two ways is offered once, under its fuller name', () => {
  assert.deepEqual(dedupeCropLabels(['Corn / Maize', 'Corn']), ['Corn / Maize']);
  assert.deepEqual(dedupeCropLabels(['Corn', 'Corn / Maize']), ['Corn / Maize']);
  assert.deepEqual(dedupeCropLabels(['Paddy / Rice', 'Paddy/Rice']), ['Paddy / Rice']);
});

test('crops that only share a word stay apart', () => {
  assert.deepEqual(
    dedupeCropLabels(['Citrus / Fruits', 'Grapes / Fruits']),
    ['Citrus / Fruits', 'Grapes / Fruits'],
  );
  assert.deepEqual(
    dedupeCropLabels(['Potato', 'Sweet Potato / Yam']),
    ['Potato', 'Sweet Potato / Yam'],
  );
});

test('blank and repeated entries are dropped, order is kept', () => {
  assert.deepEqual(
    dedupeCropLabels(['Wheat', '', null, 'Cotton', 'Wheat', '   ']),
    ['Wheat', 'Cotton'],
  );
});

test('the label kept still selects the products the dropped one would have', () => {
  const product = { crops: ['Corn'] };
  const [kept] = dedupeCropLabels(['Corn / Maize', 'Corn']);
  assert.equal(kept, 'Corn / Maize');
  assert.ok(matchesCrop(product.crops, kept));
});

test('one crop under two names selects the same products', () => {
  assert.ok(matchesCrop(['Corn'], 'Maize'), 'a Maize filter must find a product tagged Corn');
  assert.ok(matchesCrop(['Maize'], 'Corn'), 'and the other way round');
  assert.ok(matchesCrop(['Rice'], 'Paddy'));
  assert.ok(matchesCrop(['Groundnut'], 'Peanut'));
  assert.ok(matchesCrop(['Lady Finger'], 'Okra'));
});

test('crops that are merely related stay apart', () => {
  assert.equal(matchesCrop(['Corn'], 'Tomato'), false);
  assert.equal(isSameCrop('Potato', 'Sweet Potato / Yam'), false);
  assert.equal(cropHandle('sweet potato'), 'sweet potato');
});

test('the synonyms reach the filter lists too', () => {
  assert.equal(isSameCrop('Corn / Maize', 'Maize'), true);
  assert.deepEqual(dedupeCropLabels(['Maize', 'Corn / Maize']), ['Corn / Maize']);
});

test('best sellers come back most sold first', () => {
  const products = [
    { id: 'a', price: 100, unitsSold: 4 },
    { id: 'b', price: 100, unitsSold: 91 },
    { id: 'c', price: 100, unitsSold: 0 },
    { id: 'd', price: 100, unitsSold: 37 },
  ];
  assert.deepEqual(topSelling(products, 3).map(p => p.id), ['b', 'd', 'a']);
});

test('ties are broken by rating, then reviews, so the order never wobbles', () => {
  const products = [
    { id: 'a', price: 100, unitsSold: 10, rating: 4.1, reviewsCount: 90 },
    { id: 'b', price: 100, unitsSold: 10, rating: 4.9, reviewsCount: 2 },
    { id: 'c', price: 100, unitsSold: 10, rating: 4.1, reviewsCount: 300 },
  ];
  assert.deepEqual(topSelling(products, 3).map(p => p.id), ['b', 'c', 'a']);
});

test('before the shop has sold anything the caller keeps its own rule', () => {
  assert.equal(topSelling([{ id: 'a' }, { id: 'b', unitsSold: 0 }], 4), null);
  assert.equal(topSelling([], 4), null);
  assert.equal(topSelling(undefined, 4), null);
});

test('a broken or negative count never outranks a real one', () => {
  const products = [
    { id: 'junk', price: 100, unitsSold: 'lots' },
    { id: 'negative', price: 100, unitsSold: -50 },
    { id: 'real', price: 100, unitsSold: 3 },
  ];
  assert.deepEqual(topSelling(products, 1).map(p => p.id), ['real']);
});

test('a product not priced yet is never a best seller', () => {
  const products = [
    { id: 'a', price: 100, unitsSold: 4 },
    { id: 'soon', price: 0, unitsSold: 50 },
    { id: 'none', unitsSold: 60 },
  ];
  assert.deepEqual(topSelling(products, 3).map(p => p.id), ['a']);
});

test('sortProducts: recommended preserves original array order and never mutates input', () => {
  const original = [
    { id: 'prod-2', name: 'Zebra Tonic', price: 50 },
    { id: 'prod-1', name: 'Apple Fertilizer', price: 150 },
  ];
  const inputCopy = [...original];
  const result = sortProducts(original, 'recommended');
  assert.deepEqual(result.map(p => p.id), ['prod-2', 'prod-1']);
  assert.deepEqual(original, inputCopy);
  assert.notEqual(result, original, 'Must return a fresh array copy');
});

test('sortProducts: name-asc performs case-insensitive alphabetical sort with id tie-breaker', () => {
  const products = [
    { id: 'p3', name: 'zinc chelate' },
    { id: 'p1', name: 'Apple Growth' },
    { id: 'p2', name: 'apple booster' },
    { id: 'p4', name: 'Zinc Chelate' },
  ];
  const result = sortProducts(products, 'name-asc');
  assert.deepEqual(result.map(p => p.id), ['p2', 'p1', 'p3', 'p4']);
});

test('sortProducts: price-low sorts ascending and puts unpriced items at the bottom', () => {
  const products = [
    { id: 'p-unpriced', name: 'Upcoming Seed', price: 0 },
    { id: 'p-mid', name: 'Bio Fungicide', price: 250 },
    { id: 'p-low', name: 'Neem Oil', price: 120 },
    { id: 'p-null', name: 'Unlisted Item', price: null },
    { id: 'p-high', name: 'Sprayer Pump', price: 1500 },
  ];
  const result = sortProducts(products, 'price-low');
  assert.deepEqual(result.map(p => p.id), ['p-low', 'p-mid', 'p-high', 'p-null', 'p-unpriced']);
});

test('sortProducts: price-high sorts descending and puts unpriced items at the bottom', () => {
  const products = [
    { id: 'p-unpriced', name: 'Upcoming Seed', price: 0 },
    { id: 'p-mid', name: 'Bio Fungicide', price: 250 },
    { id: 'p-low', name: 'Neem Oil', price: 120 },
    { id: 'p-null', name: 'Unlisted Item', price: null },
    { id: 'p-high', name: 'Sprayer Pump', price: 1500 },
  ];
  const result = sortProducts(products, 'price-high');
  assert.deepEqual(result.map(p => p.id), ['p-high', 'p-mid', 'p-low', 'p-null', 'p-unpriced']);
});

test('sortProducts: popular sorts by unitsSold and falls back cleanly if no sales exist', () => {
  const withSales = [
    { id: 'p1', name: 'Pest Guard', price: 200, unitsSold: 12 },
    { id: 'p2', name: 'Root Booster', price: 300, unitsSold: 85 },
    { id: 'p3', name: 'Coming Soon', price: 0, unitsSold: 100 },
    { id: 'p4', name: 'Crop Tonic', price: 150, unitsSold: 12, rating: 4.8 },
  ];
  const resultSales = sortProducts(withSales, 'popular');
  assert.deepEqual(resultSales.map(p => p.id), ['p2', 'p4', 'p1', 'p3']);

  const noSales = [
    { id: 'a', name: 'Item A', price: 100, unitsSold: 0 },
    { id: 'b', name: 'Item B', price: 200, unitsSold: 0 },
  ];
  const resultNoSales = sortProducts(noSales, 'popular');
  assert.deepEqual(resultNoSales.map(p => p.id), ['a', 'b']);
});
