# Security & Production Safety
## Sathyam Agro Mart Operational Security Rules

### 1. Secret Protection & Environment Isolation
- **No Secrets in Git**: Never commit `.env`, private keys, API secrets, or passwords to git.
- **Client vs Server Secrets**:
  - Frontend (`src/`): Only public keys (e.g. `RAZORPAY_KEY_ID`).
  - Server (`server/`): Private secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `AUTH_TOKEN_SECRET`, `OTP_HASH_SECRET`, `MONGODB_URI`).
  - `KEY_SECRET` must never be sent to the browser or bundled by Vite.

### 2. High-Risk Operational Guardrails
- **Destructive Database Actions**: `DROP`, `TRUNCATE`, bulk deletions, or irreversible schema drops on production MongoDB are strictly prohibited without prior explicit confirmation.
- **Production Payment Actions**: Any operation that captures live customer money, issues refunds, or modifies live payment credentials requires verified authorization.
- **Live Deployment Boundary**: Pushes to `rensog/main` represent current development, while releases to `origin/main` represent official upstream release.

### 3. Server Hardening & Input Validation
- **CORS Protection**: Restricted to `sathyamagromart.com`, `www.sathyamagromart.com`, local development, and explicit `CORS_ORIGINS`.
- **Payload Limits**: Strict JSON limits (4MB default, 200MB strictly for authenticated admin video uploads).
- **Authentication**: JWT tokens signed with strong random secrets; passwords hashed with PBKDF2/crypto routines.
- **SQL / NoSQL Injection**: Sanitized inputs and query normalization before MongoDB execution.
