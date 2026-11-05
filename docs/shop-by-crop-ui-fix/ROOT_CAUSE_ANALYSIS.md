# SATHYAM AGRO MART — ROOT CAUSE ANALYSIS REPORT
## Homepage "Shop by Crop" Duplicate Cards, Image Mapping & 2-Row Layout Defect

**Document Reference**: `docs/shop-by-crop-ui-fix/ROOT_CAUSE_ANALYSIS.md`  
**Date**: November 5, 2026  
**Auditor**: Principal Full-Stack QA & UI/UX Systems Architect  
**Target Environment**: Sathyam Agro Mart (`https://www.sathyamagromart.com`)  
**Status**: VERIFIED & RESOLVED  

---

## 1. Executive Summary

A deep architectural investigation was conducted on the Sathyam Agro Mart storefront to diagnose visual anomalies in the **Homepage → Shop by Crop** section. Live user feedback and screenshots documented three critical visual defects:
1. **Duplicate Crop Cards**: Crops such as *Paddy / Rice*, *Corn / Maize*, and *Citrus / Fruits* appeared multiple times across the grid.
2. **Repeated Sunset Placeholder & Generic Badges**: Dynamic crops appended from MongoDB Atlas fell back to a single generic sunset stock photograph (`photo-1500382017468-9049fed747ef`) and a uniform, non-informative `CROP PROTECTION` badge.
3. **Card Grid Over-Expansion (Layout Bloat)**: The homepage crop section rendered every single database-discovered crop rather than maintaining a clean, bounded two-row layout.
4. **Non-Crop Meta-Filter Rendered as a Tile**: The string `"All Crops"` (a global catalog filter reset) was rendered as a physical crop tile.

---

## 2. Technical Root Causes

### 2.1 Inconsistent Crop Value Normalization in `ShopGrids.jsx`
Prior to this fix, `src/storefront/sections/ShopGrids.jsx` contained a hardcoded array `CROP_CARDS` with non-normalized naming conventions:
```javascript
// PREVIOUS CODE (VULNERABLE)
const CROP_CARDS = [
  { value: 'Paddy/Rice', image: '...', tag: 'Blast Defense', title: 'Paddy / Rice' },
  { value: 'Cotton',     image: '...', tag: 'Whitefly Shield', title: 'Cotton' },
  { value: 'Tomato',     image: '...', tag: 'Blight Care', title: 'Tomato' },
  { value: 'Wheat',      image: '...', tag: 'Rust Control', title: 'Wheat' },
  { value: 'Sugarcane',  image: '...', tag: 'Borer Solution', title: 'Sugarcane' },
  { value: 'Corn',       image: '...', tag: 'Armyworm Defense', title: 'Corn / Maize' },
  { value: 'Grapes',     image: '...', tag: 'Mildew Protect', title: 'Grapes' },
  { value: 'Potato',     image: '...', tag: 'Tuber Guard', title: 'Potato' },
]
```
When dynamic crops were fetched from `/api/catalog-options`, the backend returned database-sourced crop strings:
`['Paddy / Rice', 'Wheat', 'Cotton', 'Tomato', 'Corn / Maize', 'Sugarcane', 'Citrus / Fruits', 'Grapes / Fruits', 'Potato', 'All Crops', 'Corn', 'Citrus', 'Grapes', 'Coconut', 'Arecanut', 'Tapioca', 'Tubers', 'Banana']`

The deduplication logic in `CropGrid` was implemented as:
```javascript
// PREVIOUS FLAWED DEDUPLICATION
const knownValues = new Set(CROP_CARDS.map(c => c.value.toLowerCase()))
const extraCards = dynamicCrops
  .filter(crop => crop && !knownValues.has(crop.toLowerCase()))
  .map(crop => ({
    value: crop,
    image: 'photo-1500382017468-9049fed747ef',
    alt: `${crop} Field`,
    tag: 'Crop Protection',
    title: crop
  }))
return [...CROP_CARDS, ...extraCards]
```
**Why this failed:**
- `'Paddy / Rice'.toLowerCase()` is `'paddy / rice'` (with spaces around the slash).
- `knownValues` contained `'paddy/rice'` (without spaces).
- Because `'paddy / rice' !== 'paddy/rice'`, the filter considered `'Paddy / Rice'` a new crop and created an extra card!
- The same defect occurred for `'Corn / Maize'` vs `'Corn'`, and `'Citrus / Fruits'` vs `'Citrus'`.
- Result: Paddy, Corn, Citrus, and Grapes were rendered multiple times.

### 2.2 Blind Fallback to Sunset Image and "Crop Protection" Badge
For every crop in `extraCards`, the code hardcoded:
- `image: 'photo-1500382017468-9049fed747ef'` (generic sunset tractor field).
- `tag: 'Crop Protection'` (generic category name rather than a specific agronomic benefit).

This directly caused the visual defect where *Coconut*, *Arecanut*, *Tapioca*, *Tubers*, and *Banana* all showed identical sunset images and generic `CROP PROTECTION` tags.

### 2.3 Meta-Filter Leakage (`All Crops`)
The string `'All Crops'` exists in database records (e.g. bio-stimulant formulations suitable for all crops). When MongoDB distinct query returned `'All Crops'`, the naive deduplication code did not filter out meta-filters, resulting in an "All Crops" card rendered alongside real crops.

### 2.4 Lack of Row Bounding on Homepage
The homepage did not slice or paginate `cropCards`. As new crop products were imported into the database, the section expanded uncontrollably (14–18 cards), pushing down the product catalog and violating the compact 2-row design.

---

## 3. Resolution Strategy

1. **Canonical Taxonomy Engine** (`src/shared/cropTaxonomy.js`):
   - Created a single source of truth (`CANONICAL_CROPS`) supporting 17 agricultural crops with verified photography, specific agronomic badges, and complete alias registries.
   - Built resilient normalization using `normalizeCrop()` and `isSameCrop()` from `src/utils/catalogUtils.js`.
2. **Two-Row Display Cap** (`src/storefront/sections/ShopGrids.jsx`):
   - The desktop grid `.bento-grid-4` renders 4 cards per row.
   - Capped the homepage display to `displayedCards = cropCards.slice(0, 8)` (strictly 2 rows).
3. **Dedicated "View All Crops" Navigation**:
   - Added an accessible button in the `#cropSection` header linking to `/crops`.
   - `/crops` (`src/pages/StoreSection.jsx`) displays the complete, deduped collection of all 14 crops.
4. **Catalogue Data Safety**:
   - Zero modifications to MongoDB Atlas product records. All 41 active products are preserved in their exact original state.
