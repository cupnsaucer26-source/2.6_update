---
name: sathyam-agro-workflows
description: >-
  Workflows, domain logic, and architectural procedures specific to Sathyam Agro Mart.
  Use when modifying crop filters, agronomy expert booking, admin CRUD, CMS content sync,
  WhatsApp messaging, GST invoicing, or Razorpay payment checkout.
---

# Sathyam Agro Mart Workflows & Domain Runbook

Operational and architectural guide for Sathyam Agro Mart e-commerce, advisory, and clinic platforms.

## 1. Domain Entities & Real Identifiers

### Crop Taxonomies & Filtering
- **Supported Crops**: `Paddy/Rice`, `Cotton`, `Sugarcane`, `Banana`, `Vegetables`, `Pulses`, `Spices`, `Flowers`, `Plantation`, `All Crops`.
- **Filtering Logic**: In `AllProducts.jsx` and `Home.jsx`, products filter by matching their `crops` array against the active filter. Products tagged with `'All Crops'` appear across every crop category.
- **Disease & Problem Tags**: E.g. `Blast`, `Rust`, `Downy Mildew`, `Bollworm`, `Stem Borer`, `Sucking Pests`.

### Agronomy Expert Consultation
- **Directory**: `/agronomy-experts` lists certified doctors (e.g. `Dr. K. Senthil`, `Dr. R. Malathi`, `Er. M. Praveen`, `Dr. A. Rajendran`, `Employee 1`).
- **Booking Flow**: Farmers request consultation via modal (Name, Phone, Crop, Symptoms). Records are stored in `AgronomyBooking` collection in MongoDB.
- **Admin Assignment Workflow**: `/admin/agronomy-bookings` allows store managers and admins to assign or reassign tickets to specific agronomists using the interactive assignment dropdown.

### CMS Synchronization
- **Admin CMS**: `/admin/cms` edits promotional banners, notice bars, trust badges, and home page highlights.
- **Data Flow**: Admin PUTs to `/api/cms` ➔ Stored in MongoDB `Settings` collection under `_id: 'global'` ➔ Farmer frontend fetches `/api/cms` on mount (`useCMS` hook) with instant fallback to `src/shared/cmsDefaults.js`.

### Order & Payment Workflow (Razorpay Live)
- **Basket Pricing**: Client calculates draft subtotal, but `POST /api/payments/create-order` strictly re-prices line items from current database prices and enforces minimum ₹1.00 (100 paise).
- **Checkout Modal**: `useCheckout.js` dynamically loads Razorpay, opens modal with theme `#15803d`, contact prefill (`+91` + phone), and handles dismiss / failure / success.
- **Signature Verification**: `POST /api/payments/verify` computes HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET` with `safeEqual`.
- **Order Finalization**: Records order in MongoDB, marks stock reservation, awards reward points, and triggers WhatsApp confirmation via WaSender API.

## 2. Git & Release Workflow
- **Development Remote**: `rensog` (`https://github.com/Rensog878/testcase.git`) on branch `main`.
- **Official Upstream**: `origin` (`https://github.com/cupnsaucer26-source/2.6_update.git`) on branch `main`.
- **Production Server**: Hostinger VPS with PM2 managing `server/server.js`, serving API and static `dist/`.
