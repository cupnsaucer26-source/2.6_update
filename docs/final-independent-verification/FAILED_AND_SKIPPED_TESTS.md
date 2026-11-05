# Failed and Skipped Tests Analysis — Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026  
**Auditor**: Independent Principal Software Quality Auditor  

---

## 1. Failed Tests

| Test Suite | Test Name | File Path | Failure Message | Root Cause |
|---|---|---|---|---|
| **Shared Unit Tests** | None | `src/shared/__tests__/*.test.js` | None | N/A (238/238 Passed) |
| **Server Integration Tests** | None | `server/tests/*.test.mjs` | None | N/A (222/222 Passed) |
| **Admin Product E2E** | None | `scripts/test_admin_products_e2e.mjs` | None | N/A (11/11 Passed) |
| **Payment Security E2E** | None | `scripts/test_payment_security_e2e.mjs` | None | N/A (6/6 Passed) |
| **Master E2E Suite** | None | `tests/e2e-master-suite.mjs` | None | N/A (20/20 Passed) |

**Total Test Failures Across Entire Repository**: **0**

---

## 2. Skipped Tests

| Test Suite | Skipped Test Name | File Reference | Reason / Skip Condition | Safety Assessment |
|---|---|---|---|---|
| **Server Integration Tests** | `Staff, Store & Multi-Store Isolation Test Suite` | [`server/tests/staff-store-isolation.test.mjs`](file:///c:/Users/step1/OneDrive/Desktop/2.6-test_cases/2.6_update/server/tests/staff-store-isolation.test.mjs#L33) | `Requires staging DB cluster (set RUN_LIVE_ISOLATION_TEST=true)` | **INTENTIONAL & PROTECTIVE**: Prevents automated unit test runners from writing mock stores (`Trichy Hub Test`) to production MongoDB Atlas (`sathyambio`). |

---

## 3. Mocked Services & External Dependency Analysis

### A. WhatsApp Messaging Gateway (`WaSenderAPI`)
- **Observed Log Output**:
  ```
  ❌ Send OTP error: WaSenderAPI request failed via sender 1 (503): upstream down
  ```
- **Context**: During execution of [`server/tests/otp-auth.test.mjs`](file:///c:/Users/step1/OneDrive/Desktop/2.6-test_cases/2.6_update/server/tests/otp-auth.test.mjs), test cases test WhatsApp message dispatch. Because real WhatsApp message credits cost money and external endpoints should not be called in automated CI, requests either mock-fail or return simulated responses.
- **Resilience Verification**: The server properly catches upstream network timeouts and error codes without crashing the process, returning appropriate client responses.

### B. Razorpay Live Gateway
- **Observed Behavior**: Payment tests [`scripts/test_payment_security_e2e.mjs`](file:///c:/Users/step1/OneDrive/Desktop/2.6-test_cases/2.6_update/scripts/test_payment_security_e2e.mjs) evaluate HMAC-SHA256 signature verification and order creation constraints using local cryptographic primitives rather than firing live HTTP transactions to Razorpay's banking servers.
- **Safety Assessment**: This is an essential compliance practice. No real financial debits or credits were executed.

### C. Client Dynamic XLSX Exporter
- **Observed Behavior**: Dynamic import test [`src/shared/__tests__/shopAnalyticsExport.test.js`](file:///c:/Users/step1/OneDrive/Desktop/2.6-test_cases/2.6_update/src/shared/__tests__/shopAnalyticsExport.test.js) verifies dynamic code-splitting and mock failure recovery without loading the full 429 kB SheetJS binary on startup.
- **Safety Assessment**: Confirms lazy-loading resilience.
