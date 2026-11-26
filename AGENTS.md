# Sathyam Agro Mart — Core Repository Rules & Architecture
## Permanent Workspace Operating Instructions

### 1. Verified Architecture & Boundaries
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React, FontAwesome 6, Axios, React Router 6.
- **Backend**: Express 4 running on native Node.js ESM (`"type": "module"` in `package.json`). Dual-hosting design: standalone on Hostinger Linux VPS (serving API and static `dist/`) or serverless on Vercel.
- **Database**: MongoDB Atlas (`sathyambio` replica set) via Mongoose 8. Permissive schemas (`strict: false`) with human-readable string IDs (`sb-XXXX`, `rcpt-XXXX`, etc.).
- **Payment Gateway**: Razorpay Standard Web Checkout. Live mode active for **SATHYAM AGRO CLINIC** (`rzp_live_TrKx8Jv1RFFOOx`). Webhook enabled at `https://www.sathyamagromart.com/api/payments/webhook`.
- **Git Remote & Release**: Active development tracks `rensog/main` (`https://github.com/Rensog878/testcase.git`). Official upstream release remote is `origin/main` (`https://github.com/cupnsaucer26-source/2.6_update.git`).

### 2. Master UI/UX Design System & Frontend Quality Rules
Follow `docs/design-system/SATHYAM_AGROMART_DESIGN_SYSTEM.md` and `.agents/rules/01-ui-and-design-quality.md`:
- **Core Philosophy**: Visual hierarchy before decoration, consistency before creativity, usability before unnecessary animations.
- **Color Tokens**: Agricultural green theme (`#15803d` / `green-700`), high-contrast rural mobile readability (`#0f172a` text on `#ffffff` / `#f8fafc`).
- **Strict 4px Spacing**: Use `space-1` (4px) to `space-16` (64px) tokens. No arbitrary or random margins/paddings.
- **Touch Targets**: Minimum 44px height for interactive targets on mobile devices.
- **Dialog & Modal Standards**:
  - Balanced width (440-520px for confirmation modals).
  - Proper padding (20-24px desktop, bottom sheet on mobile with safe-area insets).
  - No clipped buttons or awkward text wraps.
  - No duplicate notifications (never show modal + toast simultaneously).
- **Responsive Verification**: Verified across small mobile (320px–390px), tablet (768px), and desktop (1280px–1440px). Prevent cumulative layout shifts (CLS).

### 3. API & Security Contracts
- Server-side pricing enforcement: Line items and totals are strictly re-calculated from catalog database prices during order creation. Never trust client-submitted amounts.
- Minimum Razorpay charge: 100 paise (₹1.00).
- Payment verification: Timing-safe HMAC-SHA256 signature verification (`safeEqual`) in `POST /api/payments/verify`.
- Secrets: Keep `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `MONGODB_URI`, `AUTH_TOKEN_SECRET` strictly on the server (`server/.env`). Never expose them to client bundles or git.

### 4. Mandatory Verification Checklist
Before completing any task:
1. `node --check server/server.js` (backend syntax check passes).
2. `npm run build` (Vite build passes with zero errors).
3. Live/test verification using real requests or Chrome DevTools (mobile, tablet, desktop).
4. Clean commit pushed to `rensog/main`.

### 5. Permanent ChatGPT Co-Worker & Evidence-Proof Protocol
- **Pre-Execution Peer Review (`https://chatgpt.com/`)**: Before executing major architecture, VPS/infrastructure setup, deployment, database, or multi-module plans, deeply inspect the codebase/runtime first, share complete sanitized project context with ChatGPT in the built-in browser (authorized autonomously — never paste raw `.env` secrets, API keys, or customer PII), and discuss step-by-step like senior co-workers.
- **Conflict Resolution Over Blind Agreement**: Actively flag codebase/runtime conflicts before execution. Verify every ChatGPT suggestion against actual code/configs/versions; if ChatGPT proposes something conflicting or inaccurate, push back immediately with verified code evidence until both agree on a zero-conflict, 100%-confidence plan.
- **Evidence-Proof Delivery**: Verify every step with real command outputs, builds, tests, HTTP/DB checks, and inspected screenshots. Never claim success without observed proof.
