# Sathyam Agro Mart — Core Repository Rules & Architecture
## Permanent Workspace Operating Instructions

### 1. Verified Architecture & Boundaries
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React, Axios, React Router 6.
- **Backend**: Express 4 running on native Node.js ESM (`"type": "module"` in `package.json`). Dual-hosting design: standalone on Hostinger Linux VPS (serving API and static `dist/`) or serverless on Vercel.
- **Database**: MongoDB Atlas (`sathyambio` replica set) via Mongoose 8. Permissive schemas (`strict: false`) with human-readable string IDs (`sb-XXXX`, `rcpt-XXXX`, etc.).
- **Payment Gateway**: Razorpay Standard Web Checkout. Live mode active for **SATHYAM AGRO CLINIC** (`rzp_live_TrKx8Jv1RFFOOx`). Webhook enabled at `https://www.sathyamagromart.com/api/payments/webhook`.
- **Git Remote & Release**: Active development tracks `rensog/main` (`https://github.com/Rensog878/testcase.git`). Official upstream release remote is `origin/main` (`https://github.com/cupnsaucer26-source/2.6_update.git`).

### 2. Design & UI Guidelines
- Agricultural green theme (`#15803d` / `green-700`), high-contrast rural mobile readability.
- Touch targets must be at least 40px in height for buttons, inputs, and selects.
- Verify layouts across mobile (360px–414px), tablet, and desktop. Prevent cumulative layout shifts (CLS).

### 3. API & Security Contracts
- Server-side pricing enforcement: Line items and totals are strictly re-calculated from catalog database prices during order creation. Never trust client-submitted amounts.
- Minimum Razorpay charge: 100 paise (₹1.00).
- Payment verification: Timing-safe HMAC-SHA256 signature verification (`safeEqual`) in `POST /api/payments/verify`.
- Secrets: Keep `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `MONGODB_URI`, `AUTH_TOKEN_SECRET` strictly on the server (`server/.env`). Never expose them to client bundles or git.

### 4. Mandatory Verification Checklist
Before completing any task:
1. `node --check server/server.js` (backend syntax check passes).
2. `npm run build` (Vite build passes with zero errors).
3. Live/test verification using real requests or Chrome DevTools.
4. Clean commit pushed to `rensog/main`.
