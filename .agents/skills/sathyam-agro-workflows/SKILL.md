---
name: sathyam-agro-workflows
description: >-
  Workflows, domain logic, and end-to-end execution paths specific to Sathyam Agro Mart.
  Use when modifying crop filters, agronomy expert bookings, admin operations, CMS synchronization,
  WhatsApp order notifications, GST invoicing, or Razorpay payment checkout.
---

# Sathyam Agro Mart Workflows & Domain Procedures

Operational guide for the Sathyam Agro Mart / Sathyam Bio e-commerce and agronomy clinic platform.

---

## 1. Domain Entities & Real Data Contracts

### 1.1 Crop Taxonomies & Filtering
- **Confirmed Crop Identifiers**:
  `Paddy/Rice`, `Cotton`, `Sugarcane`, `Banana`, `Vegetables`, `Pulses`, `Spices`, `Flowers`, `Plantation`, `All Crops`.
- **Filtering Logic**:
  Products have a `crops` string array in MongoDB. In `AllProducts.jsx` and `Home.jsx`, products filter by matching against the selected crop. Items tagged with `'All Crops'` are universal and appear in all crop filters.
- **Problem & Disease Taxonomies**:
  `Blast`, `Rust`, `Downy Mildew`, `Bollworm`, `Stem Borer`, `Sucking Pests`, `General Health`.

### 1.2 Certified Agronomy Consultation
- **Directory**: `/agronomy-experts` lists certified doctors (`Dr. K. Senthil`, `Dr. R. Malathi`, `Er. M. Praveen`, `Dr. A. Rajendran`, `Employee 1`).
- **Booking Flow**: Farmers submit Name, Phone, Crop, and Problem Description. Stored in MongoDB `AgronomyBooking` collection.
- **Admin Assignment System**: `/admin/agronomy-bookings` allows managers to assign or reassign consultation requests to certified agronomists using the interactive assignment dropdown.

### 1.3 CMS End-to-End Execution Trace
When implementing or debugging CMS content (promotions, banners, notices, trust cards), always trace and verify the **complete lifecycle**:
```
Admin UI Edit (/admin/cms)
  ➔ Save Operation
  ➔ API Request (PUT /api/cms)
  ➔ Backend Validation & Auth Guard (requireAuth('admin'))
  ➔ Database Persistence (MongoDB Settings collection, _id: 'global')
  ➔ Farmer UI Fetch (GET /api/cms via useCMS hook)
  ➔ Rendered Content (Navbar, banner, trust badges)
```
*Never assume editing in the admin panel succeeded without verifying that the farmer UI receives and renders the updated content.*

### 1.4 Checkout & Live Payment Execution Trace (Razorpay)
```
Farmer Cart Checkout (useCheckout.js)
  ➔ Backend Price Re-calculation (POST /api/payments/create-order)
  ➔ Razorpay Order API (POST https://api.razorpay.com/v1/orders)
  ➔ Modal Opened with Theme #15803d and Prefill
  ➔ Payment Captured
  ➔ Cryptographic Signature Verification (POST /api/payments/verify via HMAC-SHA256)
  ➔ Order Finalization in MongoDB (Order collection)
  ➔ WhatsApp Order Confirmation & Staff Alert (WaSender API)
```
- **Live Credentials**: Configured in `server/.env` (`rzp_live_TrKx8Jv1RFFOOx` / `1LKRMaVxVQzVikAoCronC34r`).
- **Webhook**: Handled at `POST /api/payments/webhook` with `RAZORPAY_WEBHOOK_SECRET`.
- **Test Item**: `Demo Product` (`sb-MVKUDT4A3IKK`) priced at **₹1.00** for live end-to-end verification.

---

## 2. Release & Remote Conventions
- **Development & Staging Remote**: `rensog/main` (`https://github.com/Rensog878/testcase.git`).
- **Official Upstream Remote**: `origin/main` (`https://github.com/cupnsaucer26-source/2.6_update.git`).
- **Production Server**: Hostinger Linux VPS running `server/server.js` via PM2, serving both `/api/*` and the static built `dist/`.
