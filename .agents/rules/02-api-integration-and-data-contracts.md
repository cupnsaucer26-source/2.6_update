# API Integration & Data Contracts
## Sathyam Agro Mart Backend & Third-Party Integration Standards

### 1. API Contract Conventions
- **Uniform Response Format**:
  - Success: `{ success: true, data: ..., message?: string }`
  - Failure: `{ success: false, message: string, code?: string }`
- **Error Codes**:
  - `400`: Bad Request (invalid phone, malformed payload, missing fields)
  - `401`: Unauthorized (missing/invalid JWT token)
  - `403`: Forbidden (insufficient role privileges, e.g. non-admin accessing admin modules)
  - `404`: Resource Not Found
  - `409`: Conflict (duplicate phone number, concurrency lock, stock shortfall)
  - `429`: Too Many Requests (rate-limited endpoint)
  - `500`: Internal Server Error (logged with full error context, clean message to client)

### 2. Payment Gateway Contracts (Razorpay)
- **Order Creation (`POST /api/payments/create-order` & `/api/create-order`)**:
  - Prices the basket strictly on the server from current catalog database prices.
  - Amount passed to Razorpay is integer in paise (minimum 100 paise = ₹1.00).
  - Returns `razorpayOrderId`, `amount`, `currency`, `keyId`.
- **Payment Verification (`POST /api/payments/verify` & `/api/verify-payment`)**:
  - Recomputes HMAC-SHA256 signature: `crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')`.
  - Must use timing-safe comparison (`safeEqual`) to prevent timing attacks.
  - Finalizes order idempotently (handles duplicate submissions safely).
- **Webhooks (`POST /api/payments/webhook`)**:
  - Validates `x-razorpay-signature` against raw request body using `RAZORPAY_WEBHOOK_SECRET`.
  - Processes `payment.captured` and `order.paid` asynchronously.

### 3. WhatsApp Messaging (WaSender API)
- **Rate-Limiting & Anti-Ban**: Multi-session key rotation with configurable inter-message delay and random jitter.
- **Fail-Safe Dispatch**: Network failures on WhatsApp dispatch must never roll back a successful database transaction or paid order.
