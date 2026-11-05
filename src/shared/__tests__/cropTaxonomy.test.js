import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CANONICAL_CROPS, findCanonicalCrop, resolveCropCards } from '../cropTaxonomy.js'

test('findCanonicalCrop resolves all known crop aliases to their canonical definition', () => {
  // Paddy aliases
  assert.equal(findCanonicalCrop('Paddy').id, 'paddy-rice')
  assert.equal(findCanonicalCrop('Rice').id, 'paddy-rice')
  assert.equal(findCanonicalCrop('Paddy / Rice').id, 'paddy-rice')
  assert.equal(findCanonicalCrop('Paddy/Rice').id, 'paddy-rice')

  // Corn aliases
  assert.equal(findCanonicalCrop('Corn').id, 'corn-maize')
  assert.equal(findCanonicalCrop('Maize').id, 'corn-maize')
  assert.equal(findCanonicalCrop('Corn / Maize').id, 'corn-maize')
  assert.equal(findCanonicalCrop('Maize / Corn').id, 'corn-maize')

  // Citrus aliases
  assert.equal(findCanonicalCrop('Citrus').id, 'citrus-fruits')
  assert.equal(findCanonicalCrop('Citrus / Fruits').id, 'citrus-fruits')

  // Grapes aliases
  assert.equal(findCanonicalCrop('Grapes').id, 'grapes-fruits')
  assert.equal(findCanonicalCrop('Grapes / Fruits').id, 'grapes-fruits')

  // Plantation and specialty crops
  assert.equal(findCanonicalCrop('Coconut').id, 'coconut')
  assert.equal(findCanonicalCrop('Arecanut').id, 'arecanut')
  assert.equal(findCanonicalCrop('Tapioca').id, 'tapioca')
  assert.equal(findCanonicalCrop('Tubers').id, 'tubers')
  assert.equal(findCanonicalCrop('Banana').id, 'banana')
})

test('findCanonicalCrop excludes meta filter labels', () => {
  assert.equal(findCanonicalCrop('All Crops'), null)
  assert.equal(findCanonicalCrop('all'), null)
  assert.equal(findCanonicalCrop(''), null)
  assert.equal(findCanonicalCrop(null), null)
})

test('resolveCropCards deduplicates live catalog options into unique canonical cards', () => {
  const liveCatalogCrops = [
    'Paddy / Rice',
    'Wheat',
    'Cotton',
    'Tomato',
    'Corn / Maize',
    'Sugarcane',
    'Citrus / Fruits',
    'Grapes / Fruits',
    'Potato',
    'All Crops',
    'Corn',
    'Citrus',
    'Grapes',
    'Coconut',
    'Arecanut',
    'Tapioca',
    'Tubers',
    'Banana'
  ]

  const cards = resolveCropCards(liveCatalogCrops)

  // Exactly 14 unique crops (18 raw - 3 duplicates - 1 'All Crops' = 14)
  assert.equal(cards.length, 14, `Expected 14 cards, got ${cards.length}`)

  // Verify uniqueness of IDs and Titles
  const ids = cards.map(c => c.id)
  const titles = cards.map(c => c.title)
  assert.equal(new Set(ids).size, 14, 'All crop IDs must be unique')
  assert.equal(new Set(titles).size, 14, 'All crop titles must be unique')

  // Verify 'All Crops' is not present
  assert.ok(!titles.includes('All Crops'), 'All Crops must not be rendered as a crop card')

  // Verify Paddy and Corn appear only once
  assert.equal(titles.filter(t => t.includes('Paddy')).length, 1)
  assert.equal(titles.filter(t => t.includes('Corn') || t.includes('Maize')).length, 1)
  assert.equal(titles.filter(t => t.includes('Citrus')).length, 1)
  assert.equal(titles.filter(t => t.includes('Grapes')).length, 1)

  // Verify badges are specific and NOT generic 'Crop Protection'
  const tags = cards.map(c => c.tag)
  assert.ok(!tags.includes('Crop Protection'), 'No crop should have the generic "Crop Protection" badge')

  // Check specific badges
  assert.equal(cards.find(c => c.id === 'paddy-rice').tag, 'Blast Defense')
  assert.equal(cards.find(c => c.id === 'cotton').tag, 'Whitefly Shield')
  assert.equal(cards.find(c => c.id === 'coconut').tag, 'Nut & Palm Vigor')
  assert.equal(cards.find(c => c.id === 'arecanut').tag, 'Nut Rot Defense')
  assert.equal(cards.find(c => c.id === 'tapioca').tag, 'Tuber Bulking & Mite Care')
  assert.equal(cards.find(c => c.id === 'banana').tag, 'Sigatoka & Bunch Vigor')

  // Verify images are distinct and not all using the sunset image (photo-1500382017468-9049fed747ef)
  const images = cards.map(c => c.image)
  const sunsetImages = images.filter(img => img === 'photo-1500382017468-9049fed747ef')
  assert.equal(sunsetImages.length, 0, 'No canonical crop should use the generic sunset image')
})
