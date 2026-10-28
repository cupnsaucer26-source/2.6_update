# Sathyam Agro Mart — Project Context & Architecture

**Last Updated**: October 28, 2026  
**Environment**: Node.js v20+ ESM, Express 4, React 18, Vite 6.4.5, Tailwind CSS, MongoDB Atlas (Mongoose 8/9).  
**Git Tracking Remote**: `rensog/main` (`https://github.com/Rensog878/testcase.git`)  
**Upstream Protected Remote**: `origin/main` (`https://github.com/cupnsaucer26-source/2.6_update.git`)  

---

## 1. Verified Architecture

### Frontend (`src/`)
- **Framework**: React 18 SPA built with Vite 6.4.5, Tailwind CSS, Lucide React, Axios, React Router v7 (`react-router-dom`).
- **Entry Points**: `src/main.jsx`, `src/App.jsx`.
- **State & Contexts**:
  - `AuthContext.jsx`: Session state, JWT stored in `localStorage('sathya_token')`. Axios interceptor attaches `Authorization: Bearer <token>` to requests.
  - `CmsContext.jsx`: Content management values, banners, and theme configuration.
  - `useCheckout.js`: Shopping cart state, pricing synchronization with catalog, guest cart fallback.
  - `LanguageContext.jsx`: Multilingual translation and locale management (Tamil, English, Hindi, Telugu).
- **Portals & Layouts**:
  - Storefront (`/`, `/products`, `/product/:id`, `/orders`): `StoreLayout.jsx`.
  - Super Admin (`/superadmin/*`): `SuperAdminLayout.jsx`.
  - Store Admin (`/admin/*`): `AdminLayout.jsx`.
  - Employee (`/employee/*`): `EmployeeLayout.jsx`.
  - Delivery (`/delivery/*`): `DeliveryLayout.jsx`.
  - Billing POS (`/billing/*`): `BillingLayout.jsx`.

### Backend (`server/`)
- **Framework**: Express 4 running native Node.js ESM (`"type": "module"`).
- **Deployment**: Dual-hosting design: standalone on Hostinger Linux VPS or serverless on Vercel (`api/[...all].js` forwarding to `server/server.js`).
- **Entry Point**: `server/server.js`.
- **Route Modules**:
  - `server/server.js`: Core public API, authentication, product catalog, orders, payments, delivery dispatch, billing, and webhooks.
  - `server/adminRoutes.js`: Admin-scoped operations (`/api/admin/*`) guarded by `requireModule` and `guardSuperadmin`.
  - `server/superadminRoutes.js`: Platform-wide store creation, staff hierarchy, role assignment, work logs, system analytics.
- **Database Layer**: MongoDB Atlas replica set (`sathyambio`) via Mongoose. Schema strategy uses string IDs (`SAM-ORD-XXXX`, `USR-XXXX`, `sb-XX`) with `strict: false`. 26 models defined in `server/db.js`.
- **Authentication & Security**:
  - HMAC-SHA256 tokens (`signToken`/`verifyToken` with session fingerprint in `server/security.js`).
  - Scrypt password hashing.
  - Rate limiting via sliding-window counter in `server/http.js`.
  - Razorpay webhook verification using `crypto.timingSafeEqual` with `RAZORPAY_WEBHOOK_SECRET`.

---

## 2. Key Security Boundaries & Invariants

1. **Multi-Store Isolation**:
   - Store Admins can only view and manage staff, tickets, and bookings belonging to their own `storeId`.
   - Store Admins cannot create `admin` or `superadmin` accounts (`guardSuperadmin` returns 403 Forbidden).
   - Staff created by a Store Admin automatically inherit the admin's `storeId`, `storeName`, `storeLocation`, and `assignedAdminId`.
2. **Authoritative Server Pricing**:
   - Cart totals and order line items are strictly recalculated from database catalog prices (`withCurrentProducts`). Client-submitted amounts are never trusted.
   - Counter POS billing in `POST /api/billing/invoice` computes GST rates and tax subtotals based on catalog data.
3. **Delivery Transitions & OTP**:
   - Transitioning an order to `Delivered` requires a valid 4-digit OTP verified by the server.
   - Orders already `Delivered` cannot be cancelled or re-assigned.
4. **Inactive Store Protections**:
   - Inactive stores cannot issue counter billing invoices (400 Bad Request).
   - Delivery agents belonging to inactive stores cannot be assigned to orders.
5. **Support Ticket Privacy**:
   - Internal staff notes are strictly scrubbed (`t.notes = undefined`) before responses are returned to farmer accounts.

---

## 3. Explicit Deferred Scope
- **Leave Management**: Explicitly **DEFERRED pending client confirmation**. No leave models, routes, migrations, or UI views may be implemented until client decision is confirmed.
