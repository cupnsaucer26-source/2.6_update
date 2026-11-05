/**
 * Canonical Crop Taxonomy & Normalization Engine for Sathyam Agro Mart
 *
 * Sourced from verified Indian agronomic data.
 * Maps crop aliases to a canonical identity, provides verified high-resolution photography,
 * specific agronomic benefit badges, and prevents duplicate rendering or category conflation.
 */

import { normalizeCrop, isSameCrop } from '../utils/catalogUtils.js'

export const CANONICAL_CROPS = [
  {
    id: 'paddy-rice',
    title: 'Paddy / Rice',
    filterValue: 'Paddy / Rice',
    image: 'photo-1530507629858-e4977d30e9e0',
    alt: 'Paddy Rice Field',
    tag: 'Blast Defense',
    aliases: ['paddy', 'rice', 'paddy/rice', 'paddy / rice', 'paddy rice', 'nel']
  },
  {
    id: 'cotton',
    title: 'Cotton',
    filterValue: 'Cotton',
    image: 'photo-1634337781106-4c6a12b820a1',
    alt: 'Cotton Crop Field',
    tag: 'Whitefly Shield',
    aliases: ['cotton', 'paruthi']
  },
  {
    id: 'tomato',
    title: 'Tomato',
    filterValue: 'Tomato',
    image: 'photo-1592924357228-91a4daadcfea',
    alt: 'Tomato Farm Harvest',
    tag: 'Blight Care',
    aliases: ['tomato', 'tomatoes', 'thakkali']
  },
  {
    id: 'wheat',
    title: 'Wheat',
    filterValue: 'Wheat',
    image: 'photo-1574323347407-f5e1ad6d020b',
    alt: 'Golden Wheat Field',
    tag: 'Rust Control',
    aliases: ['wheat', 'godhumai', 'gehun']
  },
  {
    id: 'sugarcane',
    title: 'Sugarcane',
    filterValue: 'Sugarcane',
    image: 'photo-1719424668314-a0def541377b',
    alt: 'Sugarcane Plantation',
    tag: 'Borer Solution',
    aliases: ['sugarcane', 'cane', 'karumbu', 'ganna']
  },
  {
    id: 'corn-maize',
    title: 'Corn / Maize',
    filterValue: 'Corn / Maize',
    image: 'photo-1551754655-cd27e38d2076',
    alt: 'Corn Maize Field',
    tag: 'Armyworm Defense',
    aliases: ['corn', 'maize', 'makka', 'corn / maize', 'corn/maize', 'maize / corn', 'makka cholam']
  },
  {
    id: 'citrus-fruits',
    title: 'Citrus / Fruits',
    filterValue: 'Citrus / Fruits',
    image: 'photo-1582979512210-99b6a53386f9',
    alt: 'Citrus Fruit Orchard',
    tag: 'Canker & Mite Shield',
    aliases: ['citrus', 'citrus / fruits', 'citrus/fruits', 'orange', 'lemon', 'lime', 'sweet lime', 'elumichai', 'mosambi']
  },
  {
    id: 'grapes-fruits',
    title: 'Grapes',
    filterValue: 'Grapes / Fruits',
    image: 'photo-1537640538966-79f369143f8f',
    alt: 'Grape clusters on the vine',
    tag: 'Mildew Protect',
    aliases: ['grapes', 'grapes / fruits', 'grapes/fruits', 'grape', 'thiratchai', 'angoor']
  },
  {
    id: 'potato',
    title: 'Potato',
    filterValue: 'Potato',
    image: 'photo-1518977676601-b53f82aba655',
    alt: 'Potato Crop Harvest',
    tag: 'Tuber Guard',
    aliases: ['potato', 'potatoes', 'urulai', 'urulaikizhangu', 'aaloo']
  },
  {
    id: 'coconut',
    title: 'Coconut',
    filterValue: 'Coconut',
    image: 'photo-1544979590-37e9b47eb705',
    alt: 'Coconut Palm Plantation',
    tag: 'Nut & Palm Vigor',
    aliases: ['coconut', 'coconuts', 'thennai', 'thengai', 'nariyal']
  },
  {
    id: 'arecanut',
    title: 'Arecanut',
    filterValue: 'Arecanut',
    image: 'photo-1509316975850-ff9c5deb0cd9',
    alt: 'Arecanut Palm Farm',
    tag: 'Nut Rot Defense',
    aliases: ['arecanut', 'areca nut', 'betel nut', 'supari', 'paaku', 'adike']
  },
  {
    id: 'tapioca',
    title: 'Tapioca',
    filterValue: 'Tapioca',
    image: 'photo-1596040033229-a9821ebd058d',
    alt: 'Tapioca Cassava Crop',
    tag: 'Tuber Bulking & Mite Care',
    aliases: ['tapioca', 'cassava', 'maravalli', 'maravallikizhangu']
  },
  {
    id: 'tubers',
    title: 'Tubers',
    filterValue: 'Tubers',
    image: 'photo-1590165482129-1b8b27698780',
    alt: 'Root Tubers Harvest',
    tag: 'Root Vigor & Tuber Care',
    aliases: ['tubers', 'tuber', 'root crops', 'yam', 'kizhangu', 'kand']
  },
  {
    id: 'banana',
    title: 'Banana',
    filterValue: 'Banana',
    image: 'photo-1571771894821-ce9b6c11b08e',
    alt: 'Banana Plantation',
    tag: 'Sigatoka & Bunch Vigor',
    aliases: ['banana', 'bananas', 'plantain', 'vazhai', 'kela']
  },
  {
    id: 'chilli',
    title: 'Green Chilli',
    filterValue: 'Chilli',
    image: 'photo-1588252303782-cb80119abd6d',
    alt: 'Green Chilli Field',
    tag: 'Thrips & Mites Care',
    aliases: ['chilli', 'chili', 'chillies', 'green chilli', 'mirchi', 'milagai']
  },
  {
    id: 'brinjal',
    title: 'Brinjal',
    filterValue: 'Brinjal',
    image: 'photo-1615484477778-ca3b77940c25',
    alt: 'Brinjal Eggplant Crop',
    tag: 'Shoot Borer Shield',
    aliases: ['brinjal', 'eggplant', 'aubergine', 'kathirikai', 'baingan']
  },
  {
    id: 'vegetables',
    title: 'Vegetables',
    filterValue: 'Vegetables',
    image: 'photo-1540420773420-3366772f4999',
    alt: 'Vegetable Farm Harvest',
    tag: 'Multi-Crop Health',
    aliases: ['vegetables', 'vegetable', 'horticulture', 'kaaikari', 'sabzi']
  }
]

/**
 * Maps any raw crop name/alias to its canonical crop definition.
 * If unrecognized, returns a structured fallback with a neutral badge (never generic 'Crop Protection').
 */
export function findCanonicalCrop(rawCrop) {
  if (!rawCrop) return null
  const cleaned = String(rawCrop).trim()
  const normalized = normalizeCrop(cleaned)
  if (!normalized || normalized === 'all' || normalized === 'all crops') return null

  // 1. Direct alias match
  for (const crop of CANONICAL_CROPS) {
    if (crop.id === normalized || normalizeCrop(crop.title) === normalized || normalizeCrop(crop.filterValue) === normalized) {
      return crop
    }
    if (crop.aliases.some(alias => normalizeCrop(alias) === normalized)) {
      return crop
    }
  }

  // 2. Semantic isSameCrop match
  for (const crop of CANONICAL_CROPS) {
    if (isSameCrop(crop.title, cleaned) || isSameCrop(crop.filterValue, cleaned)) {
      return crop
    }
  }

  // 3. Unrecognized custom crop (safely structured without repeating sunset or generic tag)
  return {
    id: `custom-${normalized.replace(/[^a-z0-9]+/g, '-')}`,
    title: cleaned,
    filterValue: cleaned,
    image: 'photo-1500382017468-9049fed747ef', // Only fallback for completely unknown custom crops
    alt: `${cleaned} Field`,
    tag: 'Specialty Crop Care',
    aliases: [cleaned]
  }
}

/**
 * Resolves a dynamic crop list into a deduped, canonical list of crop card models.
 * Ensures:
 * - Each canonical crop appears exactly ONCE.
 * - 'All Crops' and meta-filters are excluded from the card grid.
 * - Every crop receives its verified photography and specific agronomic badge.
 */
export function resolveCropCards(dynamicCrops = []) {
  const cards = []
  const seenIds = new Set()

  const sourceList = Array.isArray(dynamicCrops) && dynamicCrops.length > 0
    ? dynamicCrops
    : CANONICAL_CROPS.map(c => c.title)

  for (const raw of sourceList) {
    const canonical = findCanonicalCrop(raw)
    if (!canonical) continue
    if (seenIds.has(canonical.id)) continue

    seenIds.add(canonical.id)
    cards.push({
      id: canonical.id,
      value: canonical.filterValue,
      title: canonical.title,
      image: canonical.image,
      alt: canonical.alt,
      tag: canonical.tag
    })
  }

  return cards
}
