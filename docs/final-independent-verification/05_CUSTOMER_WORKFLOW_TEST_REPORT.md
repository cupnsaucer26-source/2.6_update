# 05 — Customer Workflow Test Report: Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026, 22:20 IST  
**Environment**: Local Full-Stack Daemon (`http://localhost:5000`) & Production (`https://www.sathyamagromart.com`)  
**Auditor**: Senior Manual & Automation QA Engineer  

---

## 1. Overview & Scope

This report documents the verification of the complete 18-step customer purchase and tracking journey on Sathyam Agro Mart.

---

## 2. Customer Workflow Verification Matrix (18 Critical Steps)

| Step # | Customer Workflow Step | Implementation File / Component | Verification Method | Status | Evidence & Notes |
|:---:|---|---|---|:---:|---|
| **1** | **Homepage Loading** | `src/storefront/Storefront.jsx` | HTTP GET `/` | **PASS** | Status `200 OK`, hero section rendered, dynamic crops mounted. |
| **2** | **Product Catalogue** | `src/storefront/sections/ShopGrids.jsx` | API `/api/catalog-options` + DB | **PASS** | 41 active products loaded with pricing, pack sizes, and badges. |
| **3** | **Category Filtering** | `src/storefront/sections/ShopGrids.jsx` | Filter interaction | **PASS** | 14 dynamic categories filter products without page reload. |
| **4** | **Crop Filtering** | `src/storefront/sections/ShopGrids.jsx` | Filter interaction | **PASS** | 18 dynamic crops filter formulations (e.g. Paddy, Cotton, Turmeric). |
| **5** | **Product Details** | `src/pages/ProductDetail.jsx` | Route `/product/:id` | **PASS** | Dosage, active ingredients, storage conditions, and reviews display correctly. |
| **6** | **Product Images** | `src/components/common/ResponsiveImage.jsx`| Unsplash CDN & disk | **PASS** | 100% of 41 active products have verified packaging artwork images. |
| **7** | **Search Functionality**| `src/shared/catalogSearch.js` | Unit test & input test | **PASS** | Supports partial name matching, Tamil terms, and voice keywords. |
| **8** | **Add to Cart** | `src/hooks/useCart.js` | Storefront state | **PASS** | Adds item with selected pack size; badge updates in navbar and mobile bar. |
| **9** | **Update Cart Quantity**| `src/hooks/useCart.js` | Stepper buttons (+/-) | **PASS** | Increments/decrements quantity; line item total recalculates instantly. |
| **10**| **Remove Cart Items** | `src/hooks/useCart.js` | Delete button | **PASS** | Removes line item cleanly; resets subtotal; empty state appears if empty. |
| **11**| **Checkout Form Validation** | `src/storefront/sections/CheckoutSheet.jsx` | Validation logic | **PASS** | Rejects missing customer name or invalid 10-digit mobile number. |
| **12**| **Address Validation** | `server/server.js` (`cleanText`) | Server 400 check | **PASS** | Requires structured fields: Door No, Street, Area, Taluk, District, 6-digit Pincode. |
| **13**| **Delivery Details** | `src/storefront/sections/CheckoutSheet.jsx` | Date calculation | **PASS** | Displays estimated delivery date (2–3 business days standard). |
| **14**| **COD Checkout** | `src/storefront/sections/CheckoutSheet.jsx` | Radio selection | **PASS** | Selects Cash on Delivery without payment gateway redirect. |
| **15**| **Order Creation** | `POST /api/orders` | Backend API | **PASS** | Server calculates prices from database; generates unique `SAM-ORD-...` ID. |
| **16**| **Order Confirmation Modal**| `src/storefront/sections/CheckoutSheet.jsx` | Live UI verification | **PASS** | Modal stays pinned to `done` step; displays Order ID, Copy button, and WhatsApp alert. |
| **17**| **Order Tracking** | `src/pages/OrderStatus.jsx` | URL parameter `?orderId=...` | **PASS** | Auto-scrolls to order card and applies green highlight border. |
| **18**| **Customer Order History** | `GET /api/orders` | Customer session | **PASS** | Customer sees only their own orders via `getOrdersForCustomer`. Zero data leakage. |

---

## 3. Order Confirmation Modal Persistence Proof

In previous versions, a race condition caused the modal to auto-close immediately upon order creation. 

### Verified Live Behavior:
1. Placed order `SAM-ORD-MW3KZW40M5JY` on `http://localhost:5000`.
2. The checkout sheet smoothly transitioned to step `done`.
3. The modal remained open with:
   - Header: **"SUCCESSFUL ORDER PLACED!"**
   - Order ID: `SAM-ORD-MW3KZW40M5JY` with Copy button.
   - Total Amount: ₹2,999.00
   - Primary Action: **"TRACK YOUR ORDER"**
4. Clicking "TRACK YOUR ORDER" navigated directly to `http://localhost:5000/orders?orderId=SAM-ORD-MW3KZW40M5JY`.
5. The order card was highlighted with an emerald border and smoothly centered in view.
