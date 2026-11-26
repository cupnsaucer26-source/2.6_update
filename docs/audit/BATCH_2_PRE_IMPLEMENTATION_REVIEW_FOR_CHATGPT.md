# SATHYAM AGRO MART — BATCH 2 PRE-IMPLEMENTATION REVIEW PACKAGE
**Target Audience**: Senior Frontend Architect / Technical Reviewer (ChatGPT) & Product Owner  
**Repository**: Sathyam Agro Mart (`https://www.sathyamagromart.com`)  
**Workspace**: `C:\Users\step1\OneDrive\Desktop\2.6-test_cases\2.6_update`  
**Active Branch**: `main` tracking `rensog/main` (`5fe8d04`)  
**Status**: READ-ONLY AUDIT COMPLETE — ZERO CODE MUTATIONS PERFORMED  
**Date**: October 30, 2026  

---

## 1. System State & Baseline Integrity

### Source Code Boundary
- **Batch 1 Status**: Completed and verified. Exactly 3 source files modified:
  1. `src/layouts/StoreLayout.jsx`: Injected reactive `user`, `cartCount`, and `cartTotal` into `<StoreChrome>` for 1:1 state synchronicity.
  2. `src/index.css`: Aligned desktop breakpoint to `min-width: 769px` and mobile rules to `max-width: 768px`; upgraded admin sidebar active bar to `3.5px`, `font-weight: 600`, `--brand-800`.
  3. `src/storefront/storefront.css`: Added fluid `clamp()` sizing on `.header-search` for tablet widths ($769\text{px} - 1279\text{px}$) to prevent crowding by Indian regional language labels.
- **Git State**: No files staged, committed, pushed, or deployed. Working tree is clean of any unrelated edits.
- **Backend Syntax Check**: `node --check server/server.js` $\rightarrow$ **0 syntax errors** (Exit code 0).
- **Test Suite**: `node --test src/shared/__tests__/*.test.js` $\rightarrow$ **233 / 233 passing** (0 failures).
- **Vite Build**: `npm run build` $\rightarrow$ **Clean build with 0 errors** (1817 modules transformed).
- **Multi-Viewport Matrix**: 14/14 viewports tested via Chrome DevTools MCP with 0px horizontal overflow.

---

## 2. Reconciliation: 4-Batch Plan vs. 9-Batch Log

The user highlighted a structural divergence between the original master plan (4 batches) and the implementation log (9 batches). 

### Root Cause
In `SATHYAM_UI_UX_IMPLEMENTATION_LOG.md`, the remaining tasks were broken down into 9 single-domain micro-batches to create ultra-narrow PR review increments. However, the approved architectural roadmap in `SATHYAM_UI_UX_REDESIGN_PLAN.md` defined 4 macro-batches.

### Scope Reconciliation Mapping

| Original 4-Batch Plan | Tasks in Original Scope | Proposed 9-Batch Mapping | Status & Clarification |
| :--- | :--- | :--- | :--- |
| **Batch 1: Foundation & Header** | Header unification, breakpoint alignment, contrast | **Batch 1** | **Completed & Verified** |
| **Batch 2: Catalogue & Bento** | 1. Catalogue sorting in `AllProducts.jsx`<br>2. Hero bento clamp on tablets<br>3. Tamil word-break on bento descriptions | **Batch 2** (Catalogue & Discovery)<br>+ **Batch 3** (PDP & Trust) | Catalogue sorting is the core priority; PDP was separated to prevent oversized PRs. |
| **Batch 3: Forms & POS** | 1. Billing POS line-item cards<br>2. Checkout density<br>3. Soil test forms | **Batch 4** (Checkout & Razorpay)<br>+ **Batch 6** (Soil/Agronomy)<br>+ **Batch 8** (Billing POS) | Separated to prevent mixing retail customer checkout with in-store GST billing POS. |
| **Batch 4: Polish & Admin** | 1. Voice search & Chatbot<br>2. Order tracking & ticket system<br>3. Admin & staff shells | **Batch 5** (Customer Portal)<br>+ **Batch 7** (Admin Dashboard)<br>+ **Batch 9** (Final A11y & Polish) | Separated into distinct customer vs. staff domains. |

**Scope Invariant**: Zero requirements were lost or added. For Batch 2, we recommend proceeding under the **Original 4-Batch Roadmap**, keeping Batch 2 strictly focused on **Product Catalogue Discovery & Sorting System**.

---

## 3. Read-Only Codebase Inspection: Catalogue Sorting

A comprehensive audit of `src/pages/AllProducts.jsx`, `src/utils/catalogUtils.js`, `server/db.js`, and `src/storefront/sections/Catalog.jsx` answers all critical architectural questions:

### 1. Is Sorting Already Implemented?
- **Partially**. `src/pages/AllProducts.jsx:1353-1366` already has an existing `<select id="catalog-sort-dropdown">` element.
- **Current Bugs in Existing Implementation**:
  - The default option `"popular"` has **no sort logic** in `filteredProducts` (lines 475-484); it leaves products in arbitrary database order.
  - `"Name: A to Z"` is **completely missing**.
  - `"Price: Low to High"` naively executes `list.sort((a, b) => a.price - b.price)`. Products with missing prices or "Price coming soon" (`price: 0`) sort to the very top.
  - `"discount"` naively subtracts strings like `"20% OFF"`, resulting in `NaN` and erratic ordering.
  - The sort state is ephemeral (`useState('popular')`) and does not sync with URL search params.

### 2. Is Catalogue Data Client-Side or Server-Side Paginated?
- **100% Client-Side**. `useCatalogProducts({ onlineOnly: true })` loads the entire catalog SSOT array from MongoDB. Slicing occurs in memory: `filteredProducts.slice(0, visibleCount)` with an `IntersectionObserver` infinite-scroll sentinel incrementing by 24.
- All sorting happens in memory on the client.

### 3. Pipeline Order: Filter $\rightarrow$ Sort $\rightarrow$ Paginate
The pipeline execution order is:
$$\text{dbProducts} \xrightarrow{\text{1. Filter (Category, Crop, Disease, Search)}} \text{list} \xrightarrow{\text{2. Sort (Selected Order)}} \text{filteredProducts} \xrightarrow{\text{3. Slice (visibleCount = 24)}} \text{visibleProducts}$$
Sorting **must occur after filtering and before slicing**. This architecture is already cleanly structured in lines 441-494.

### 4. Authoritative Price and Name Fields
- **Price Authority**: `product.price` (Number). In `src/shared/comingSoon.js:4`, `hasPrice(p) = Number(p?.price) > 0`. Products failing this must be treated as unpriced.
- **Name Authority**: `product.name` (String, e.g. `"Sathyam Tricoderma Viride 1% W.P."`).

### 5. Genuine Popularity Field in Database
- **YES. An authentic, server-backed popularity metric exists: `product.unitsSold`**.
- In `server/db.js:1878-1880`, `db.reserveStock` atomically increments `unitsSold: line.qty` during customer checkout:
  ```javascript
  await Product.updateOne(
      { _id: line.id, stock: { $gte: line.qty } },
      { $inc: { stock: -line.qty, unitsSold: line.qty }, $set: { updatedAt: new Date().toISOString() } }
  );
  ```
- If an order is cancelled, `db.releaseStock` decrements `unitsSold: -line.qty`.
- In `src/utils/catalogUtils.js:203-215`, the repository already has an official, unit-tested sorting function: `topSelling(products)`:
  1. Primary sort: `unitsSold(b) - unitsSold(a)`
  2. Tie-breaker 1: `rating(b) - rating(a)`
  3. Tie-breaker 2: `reviewsCount(b) - reviewsCount(a)`
  4. Fallback: If no products have sales yet, it returns `null` and preserves default catalogue order.

### 6. Rating Availability & Integrity
- Generated dynamically in `server/db.js:251-287` by averaging customer reviews.
- Products without reviews have `rating: null` and `reviewsCount: 0`.
- Rating will NOT be conflated with popularity.

### 7. Translation & Missing Values
- Technical product names are stored in English; alphabetical sort will use locale-aware case-insensitive comparison: `String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })`.
- Missing prices: Products with `!hasPrice(p)` are cleanly sorted to the bottom in both low-to-high and high-to-low views so unpurchasable items never outrank active products.

### 8. Backend & Contract Non-Interference
- All sorting is executed client-side. Zero backend changes, zero database schema mutations, zero API modifications required.

---

## 4. Proposed Batch 2 Specification

### A. The 5 Approved Sort Options
1. **`default`**: `"Recommended"` $\rightarrow$ Preserves the natural database catalogue sequence.
2. **`popular`**: `"Best Selling"` $\rightarrow$ Sorts by authentic `unitsSold` via `topSelling()` logic with rating/review tie-breakers; falls back to default if 0 sales.
3. **`price-low`**: `"Price: Low to High"` $\rightarrow$ Numeric ascending sort on `product.price`; unpriced items sorted to the bottom.
4. **`price-high`**: `"Price: High to Low"` $\rightarrow$ Numeric descending sort on `product.price`; unpriced items sorted to the bottom.
5. **`name-asc`**: `"Name: A to Z"` $\rightarrow$ Alphabetical ascending sort on `product.name`.

*(Legacy option note: `"Top Rated"` and `"Highest Discount"` currently exist in the markup. If preferred, they can be safely retained with null guards or pruned to adhere strictly to the 5 options above).*

### B. URL Query Synchronization
Synchronize `sortBy` with `searchParams.get('sort')`:
- Selecting a sort option updates `?sort=price-low` without refreshing the page.
- Direct links and browser back/forward buttons restore the user's active sort order.

### C. Proposed Minimal File Changes
1. `src/pages/AllProducts.jsx`:
   - Enhance sort branches in `filteredProducts` with `name-asc`, safe price sorting, and `unitsSold` popularity.
   - Bind `<select id="catalog-sort-dropdown">` to URL search params.
2. `src/shared/__tests__/catalogFilterOptions.test.js`:
   - Add unit tests verifying `name-asc` alphabetical sorting, price sorting with unpriced items at the bottom, and popularity fallback.

---

## 5. Verification Plan for Batch 2

1. `node --check server/server.js` (Must pass with 0 syntax errors).
2. `node --test src/shared/__tests__/*.test.js` (Must pass 233 + new sorting unit tests).
3. `npm run build` (Must compile Vite production build with 0 errors).
4. Chrome DevTools live testing across 14 viewports:
   - Verify sort options reorder the grid dynamically.
   - Verify unpriced items never appear at the top of Price: Low to High.
   - Verify sorting works concurrently with active Category, Crop, Disease, and Search filters.
   - Verify infinite scroll resets to 24 items upon changing sort option.

---

## 6. ChatGPT Review Prompt (Copy & Paste)

```markdown
Please review the above Sathyam Agro Mart Batch 2 Pre-Implementation Package:
1. Confirm whether the proposed 5 sort options ("Recommended", "Best Selling", "Price: Low to High", "Price: High to Low", "Name: A to Z") cleanly meet e-commerce standards.
2. Confirm that sorting client-side after filtering and before slicing is architecturally sound.
3. Confirm that using existing `unitsSold` for "Best Selling" with tie-breaking on rating is authentic and safe.
4. Confirm whether you approve proceeding with the implementation of Batch 2 under these exact boundaries.
```
