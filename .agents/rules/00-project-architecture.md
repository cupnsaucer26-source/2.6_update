# Project Architecture & Stack Standards
## Sathyam Agro Mart / Sathyam Bio Codebase

### 1. Technology Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React icons, Axios, React Router 6.
- **Backend**: Express 4, Node.js (ESM native modules via `"type": "module"` in `package.json`), Mongoose 8 (MongoDB ODM).
- **Database**: MongoDB Atlas (`sathyambio` cluster), permissive Mongoose models (`strict: false`) with human-readable string IDs (`newId('...')` format, e.g. `sb-XXXX`, `SAM-ORD-XXXX`).
- **Payments**: Razorpay Standard Web Checkout (`https://checkout.razorpay.com/v1/checkout.js`) with backend order creation (`/api/payments/create-order`), HMAC-SHA256 timing-safe signature verification (`/api/payments/verify`), and webhook handling (`/api/payments/webhook`).
- **Messaging**: WaSender API for WhatsApp OTPs, order updates, and staff alerts with multi-session key distribution and anti-ban throttling.
- **AI Crop Doctor**: Google Gemini API via official `@google/genai` with multi-model fallback (`gemini-2.5-flash` -> `gemini-1.5-flash`).
- **Static Hosting**: Served from `dist/` by Express in Node.js production environments (Hostinger / VPS) or via Vercel serverless integration.

### 2. Architecture Principles
- **No Unnecessary Rewrites**: Preserve existing working endpoints and models.
- **ESM Native**: All backend files use `import`/`export`. Never mix with CommonJS `require()` unless strictly inside a `.cjs` script.
- **Dual-Hosting Compatibility**: Express dynamically detects whether it is running on a serverless platform (Vercel) or a persistent Linux server (Hostinger PM2). Static file serving (`dist/`) and `/uploads/` are handled transparently.
- **Single Source of Truth**: Data models, pricing algorithms, and discount logic reside on the backend. Frontend computes preview estimates, but the backend strictly re-prices the cart during checkout.
