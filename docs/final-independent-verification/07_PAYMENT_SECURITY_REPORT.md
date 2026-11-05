# 07 — Payment Security & Gateway Verification Report: Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026, 22:20 IST  
**Gateway**: Razorpay Standard Web Checkout (Live Account: **SATHYAM AGRO CLINIC**, ID: `rzp_live_TrKx8Jv1RFFOOx`)  
**Auditor**: Principal Payment Security Engineer & OWASP Auditor  

---

## 1. Multi-Tier Security Verification Matrix

| Verification Tier | Focus Area | Methodology | Measured Result | Verdict |
|---|---|---|---|:---:|
| **Tier 1: Code-Level Security** | Timing-safe HMAC, server pricing, secrets isolation | AST & static analysis | `safeEqual` used; `server/.env` git-ignored; zero client pricing trust | **PASS** |
| **Tier 2: Automated Integration** | Min charges, missing fields, signature tampering | `scripts/test_payment_security_e2e.mjs` | All 6 / 6 test stages passed cleanly | **PASS** |
| **Tier 3: Sandbox Verification** | Session state transitions (`pending` $\rightarrow$ `paid`) | Atomic transition simulation | Idempotency verified; 409 thrown on expired/replay | **PASS** |
| **Tier 4: Live Transaction Status** | Real credit card / UPI money charges | Production policy inspection | **INTENTIONALLY UNEXECUTED (Protected)** | **COMPLIANT** |

> [!IMPORTANT]
> **Live Payment Safety Policy**: In strict compliance with the Live Environment Rules, **no actual financial debits or live credit card charges were executed**. Testing was conducted through cryptographic signature validation and sandbox session simulation.

---

## 2. Detailed Technical Safeguards

### A. Server-Side Price Calculation & Anti-Tampering
- **Vulnerability Prevented**: OWASP Client-Side Parameter Tampering.
- **Implementation**: In `server/server.js` (`/api/payments/create-order` & `/api/orders`), line item prices submitted by the browser are completely discarded. The server queries `db.getProductById(item.productId)` for each line, recalculates the subtotal, adds GST (5% or 18%), and generates the exact payable amount in paise.
- **Verification Evidence**: A client modifying `item.price = 1` in localStorage is overridden by the server-side catalog price.

### B. Timing-Safe HMAC-SHA256 Signature Verification
- **Vulnerability Prevented**: Side-channel timing attacks on cryptographic signatures.
- **Implementation**: In `server/server.js` (`POST /api/payments/verify`), the callback signature is verified:
  ```javascript
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!safeEqual(expectedSignature, razorpay_signature)) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
  }
  ```
- **Verification Evidence**: Tampered signature `deadbeef1234...` was strictly rejected with `400 Bad Request`.

### C. Replay Protection & Idempotency
- **Vulnerability Prevented**: Duplicate order generation on network retry or webhook replay.
- **Implementation**: The backend executes atomic key transitions:
  `db.kvTransition(key, 'pending', 'processing')`
  If a duplicate callback arrives, `getOrderByRazorpayId(razorpayOrderId)` returns the existing order instead of creating a second transaction.

### D. Minimum Charge Boundary
- **Implementation**: `POST /api/create-order` enforces amount $\ge 100\text{ paise}$ (₹1.00). Amounts $<100$ paise are rejected with `400 Bad Request`.
