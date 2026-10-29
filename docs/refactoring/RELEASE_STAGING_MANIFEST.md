# SATHYAM AGRO MART — OFFICIAL MACHINE-VERIFIED RELEASE STAGING MANIFEST

**Document ID:** `RELEASE_STAGING_MANIFEST.md`  
**Date:** October 29, 2026  
**Auditor / Release Manager:** Antigravity Senior Engineering, QA & Git Specialist  
**Repository Path:** `C:\Users\step1\OneDrive\Desktop\2.6-test_cases\2.6_update`  
**Target Remote & Branch:** `rensog/main` (`https://github.com/Rensog878/testcase.git`)  
**Current Git Baseline:** `main` tracking `rensog/main` at commit `737bf8c125a3a85a018c074c56c926e3ef89df2f`  
**Current Git Status:** Zero files staged. 37 modified files, 88 untracked files on disk (125 total files with changes).

---

## 1. Machine-Verifiable File Count Reconciliation

A script executed against the working directory scanned all modified tracked files and untracked entries on disk:

| Category | Individual Files on Disk | Staged for Release | Excluded from Release | Verification Status |
| :--- | :---: | :---: | :---: | :---: |
| **Tracked Modifications (`[M]`)** | **37** | **37** | 0 | 100% accounted for |
| **Untracked Additions (`[??]`)** | **88** | **47** | **41** | 100% accounted for |
| **Total Workspace Files** | **125** | **84** | **41** | **Exact 1:1 match ($84 + 41 = 125$)** |

### Reconciliation of the "83 vs 84" Files:
In the initial report draft, Section 2 listed **83 files** (Group A: 3, Group B: 5, Group C: 6, Group D: 55, Group E: 14).  
When `docs/refactoring/RELEASE_STAGING_MANIFEST.md` was created in the repository documentation directory, Group E increased by **+1 file** (from 14 to 15 files).  
The machine-verified exact count for the release commit is **84 files**.

- **Total Proposed Files**: **84 files** (37 modified + 47 untracked).
- **Disk Existence Check**: All 84 paths verified via `fs.existsSync` (0 missing).
- **Import Resolution Check**: All relative imports across the 84 files resolve cleanly (0 unresolved).
- **Duplicates**: 0 duplicates across Groups A–E (unique count = 84).

---

## 2. Remote Target & Destination Verification

| Remote | URL | Current Remote SHA | Status & How It Differs |
| :--- | :--- | :--- | :--- |
| **`rensog`** | `https://github.com/Rensog878/testcase.git` | `737bf8c125a3a85a018c074c56c926e3ef89df2f` | **INTENDED PUSH DESTINATION.** This is the active development remote configured in Git (`branch.main.remote = rensog`, tracking `refs/heads/main`). Its remote HEAD is in exact 1:1 synchronization with local HEAD `737bf8c`. Per `AGENTS.md` Rule 1 & Checklist Rule 4, all verified commits are pushed to `rensog/main`. |
| **`origin`** | `https://github.com/cupnsaucer26-source/2.6_update.git` | `5a3968af3b7fc5df4033c396e4a383ed53d35883` | **OFFICIAL UPSTREAM CLIENT REPO.** Contains an older/divergent upstream commit history (`5a3968a`). A direct `git push origin main` would be rejected with non-fast-forward conflict. Release to `origin/main` occurs subsequently via pull request / upstream merge from `rensog/main`. |

### Fast-Forward Feasibility:
Because remote `rensog/main` points directly to current local HEAD `737bf8c`, the new release commit will have `737bf8c` as its immediate parent. The push will be a strictly linear, standard fast-forward with zero divergence.

---

## 3. Complete Exact Staging Manifest (84 Files Total)

### Group A: Core Chatbot Feature & Safety Backend (3 Files)
*Justification*: Implements server-side AI processing, 7-point agronomy safety guardrails, catalog dosage grounding, and database persistence.
1. `[??]` `server/chatAssistant.js`
2. `[M]` `server/server.js`
3. `[M]` `server/db.js`

### Group B: Chatbot Frontend & Responsive UI (5 Files)
*Justification*: Provides the farmer-facing AI assistant drawer, suggestion chips, consultation referral cards, and mobile viewport constraints.
4. `[M]` `src/storefront/sections/Chatbot.jsx`
5. `[M]` `src/storefront/storefront.css`
6. `[M]` `src/pages/AgronomyExperts.jsx`
7. `[M]` `src/pages/shared/ChatRecords.jsx`
8. `[??]` `src/shared/__tests__/chatbot.test.js`

### Group C: Backend Regression, Security & Financial Parity Tests (6 Files)
*Justification*: Guarantees SEC-01 multi-store isolation, OTP authentication, server-authoritative GST calculations, and agronomy safety rules.
9. `[??]` `server/tests/agronomy-safety.test.mjs`
10. `[??]` `server/tests/chat-assistant.test.mjs`
11. `[??]` `server/tests/financial-parity.test.mjs`
12. `[M]` `server/tests/staff-store-isolation.test.mjs`
13. `[M]` `server/tests/otp-auth.test.mjs`
14. `[M]` `server/tests/formatters.test.mjs`

### Group D: Refactored Admin, POS Billing & Shared Modules (55 Files)
*Justification*: Modularizes monolithic components from Batches 6–29, ensures accessibility, fixes modern build bundling, and provides full unit test coverage.

**Extracted Subcomponents & Shared Utilities (21 Files):**
15. `[??]` `src/components/tickets/TicketAttachmentPreview.jsx`
16. `[??]` `src/components/tickets/TicketMessageThread.jsx`
17. `[??]` `src/components/tickets/TicketStatusBadge.jsx`
18. `[??]` `src/pages/admin/analytics/AnalyticsOrdersTable.jsx`
19. `[??]` `src/pages/admin/products/AdvancedSection.jsx`
20. `[??]` `src/pages/admin/products/MediaSection.jsx`
21. `[??]` `src/pages/admin/products/VideosSection.jsx`
22. `[??]` `src/pages/admin/products/VisibilitySection.jsx`
23. `[??]` `src/pages/admin/users/CreateUserModal.jsx`
24. `[??]` `src/pages/admin/users/EditUserModal.jsx`
25. `[??]` `src/pages/admin/users/UserFilters.jsx`
26. `[??]` `src/pages/billing/components/BillItemsCard.jsx`
27. `[??]` `src/pages/billing/components/BillSummaryCard.jsx`
28. `[??]` `src/pages/billing/components/BillingStatsCard.jsx`
29. `[??]` `src/pages/billing/components/BuyerConsigneeCard.jsx`
30. `[??]` `src/pages/billing/components/DocumentMetaCard.jsx`
31. `[??]` `src/pages/billing/components/RecentInvoicesCard.jsx`
32. `[??]` `src/pages/billing/components/TransportDetailsCard.jsx`
33. `[??]` `src/shared/billingInvoices.js`
34. `[??]` `src/shared/billingItems.js`
35. `[??]` `src/shared/billingSummary.js`

**Frontend Regression Test Suites (9 Files):**
36. `[??]` `src/shared/__tests__/billItemsCard.test.js`
37. `[??]` `src/shared/__tests__/billSummaryCard.test.js`
38. `[??]` `src/shared/__tests__/billingIntegration.test.js`
39. `[??]` `src/shared/__tests__/billingRecentInvoices.test.js`
40. `[??]` `src/shared/__tests__/billingStatsCard.test.js`
41. `[??]` `src/shared/__tests__/billingSummary.test.js`
42. `[??]` `src/shared/__tests__/deliveryOtpHandoff.test.js`
43. `[??]` `src/shared/__tests__/farmerCartCheckout.test.js`
44. `[??]` `src/shared/__tests__/shopAnalyticsExport.test.js`

**Modified Application Pages (25 Files):**
45. `[M]` `src/components/common/Modal.jsx`
46. `[M]` `src/components/common/StatusBadge.jsx`
47. `[M]` `src/pages/SupportTicketsCustomer.jsx`
48. `[M]` `src/pages/admin/AgronomyBookings.jsx`
49. `[M]` `src/pages/admin/Analytics.jsx`
50. `[M]` `src/pages/admin/Blogs.jsx`
51. `[M]` `src/pages/admin/Coupons.jsx`
52. `[M]` `src/pages/admin/Employees.jsx`
53. `[M]` `src/pages/admin/Enquiries.jsx`
54. `[M]` `src/pages/admin/Orders.jsx`
55. `[M]` `src/pages/admin/Products.jsx`
56. `[M]` `src/pages/admin/Referrals.jsx`
57. `[M]` `src/pages/admin/SoilReports.jsx`
58. `[M]` `src/pages/admin/Subscribers.jsx`
59. `[M]` `src/pages/admin/SupportTickets.jsx`
60. `[M]` `src/pages/admin/Users.jsx`
61. `[M]` `src/pages/admin/Videos.jsx`
62. `[M]` `src/pages/billing/Dashboard.jsx`
63. `[M]` `src/pages/delivery/Dashboard.jsx`
64. `[M]` `src/pages/shared/Tickets.jsx`
65. `[M]` `src/pages/superadmin/ShopAnalytics.jsx`
66. `[M]` `src/pages/superadmin/Stores.jsx`
67. `[M]` `src/pages/superadmin/SupportTicketSystem.jsx`
68. `[M]` `src/utils/formatters.js`
69. `vite.config.js`

### Group E: Official Release Documentation & Visual Verification Assets (15 Files)
*Justification*: Maintains the architectural record, evidence-backed QA documentation, and visual viewport validation assets.
70. `[M]` `docs/refactoring/DECISIONS.md`
71. `[M]` `docs/refactoring/REFACTORING_BACKLOG.md`
72. `[M]` `docs/refactoring/REFACTORING_PROGRESS.md`
73. `[??]` `docs/refactoring/PERSONALIZED_AI_CHATBOT_IMPLEMENTATION.md`
74. `[??]` `docs/refactoring/CHATBOT_PRODUCTION_QA_REPORT.md`
75. `[??]` `docs/refactoring/CHATBOT_FINAL_EVIDENCE_AUDIT.md`
76. `[??]` `docs/refactoring/FINAL_RELEASE_GATE_REPORT.md`
77. `[??]` `docs/refactoring/RELEASE_STAGING_MANIFEST.md`
78. `[??]` `docs/refactoring/screenshots/agronomy_experts_referral_banner.png`
79. `[??]` `docs/refactoring/screenshots/chatbot_active_conversation_with_expert_card.png`
80. `[??]` `docs/refactoring/screenshots/chatbot_desktop_1440x900.png`
81. `[??]` `docs/refactoring/screenshots/chatbot_laptop_1366x768.png`
82. `[??]` `docs/refactoring/screenshots/chatbot_tablet_768x1024.png`
83. `[??]` `docs/refactoring/screenshots/chatbot_mobile_390x844.png`
84. `[??]` `docs/refactoring/screenshots/chatbot_mobile_320x700.png`

---

## 4. Explicitly Excluded Files (41 Files Total)

These 41 files are confirmed excluded and will remain untracked:

| Excluded Category | Count | Individual Paths | Exclusion Rationale |
| :--- | :---: | :--- | :--- |
| **Temporary Diagnostic Scripts (`scratch/`)** | 11 | `scratch/apply_refinements.mjs`<br>`scratch/check_css.mjs`<br>`scratch/check_imports.mjs`<br>`scratch/scenario_results.json`<br>`scratch/test_15_scenarios.mjs`<br>`scratch/test_admin_chat_records.mjs`<br>`scratch/test_chat_records_e2e.mjs`<br>`scratch/update_experts.mjs`<br>`scratch/update_history_turns.mjs`<br>`scratch/update_safety_full.mjs`<br>`scratch/verify_s12_s14.mjs` | Temporary execution helpers, diagnostic tests, and verification runners. Not production code or permanent regression tests. |
| **Interim Account-Switch & Batch Reports** | 30 | `docs/planning/POST_REFACTORING_FEATURE_ROADMAP.md`<br>`docs/refactoring/ACCOUNT_SWITCH_BACKUP_MANIFEST.md`<br>`docs/refactoring/ACCOUNT_SWITCH_HANDOFF.md`<br>`docs/refactoring/ACCOUNT_SWITCH_RESUME_PROMPT.md`<br>`docs/refactoring/BATCH_6_...` through `BATCH_29_...` (24 batch reports)<br>`docs/refactoring/MASTER_CONTINUATION_VERIFICATION_REPORT.md`<br>`docs/refactoring/PHASE_2_FEATURE_AUDIT_6_TO_11.md`<br>`docs/refactoring/SECOND_STAGE_VERIFICATION_AUDIT_REPORT.md` | Interim transition manifests and individual historical batch logs. The permanent project record is maintained in `DECISIONS.md`, `REFACTORING_PROGRESS.md`, and the final release audit reports in Group E. |
| **Tracked Production Build (`dist/`)** | — | `dist/*` | Tracked production build artifacts are preserved **untouched** with zero modifications. |
| **Secrets & Local Configuration** | — | `server/.env` | Safely gitignored (`.gitignore`). Excluded from Git tracking. |

---

## 5. Final Staged Diff Summary

- **Modified Tracked Files**: 37 files (2,777 insertions, 2,715 deletions).
- **Untracked Additions Staged**: 47 files (1 backend service, 4 backend test suites, 21 frontend subcomponents, 9 frontend test suites, 5 documentation reports, 7 screenshot PNGs).
- **Core Additions**:
  - `server/chatAssistant.js`: Personalized AI Assistant with dynamic follow-up suggestions, 7-point agronomy safety guardrails, catalog dosage grounding, and deterministic fallback.
  - `server/server.js`: Grounded `/api/chat/assistant`, `/api/chat/history`, and store-scoped `/api/chat/records` endpoints with rate limiting.
  - `server/db.js`: `ChatRecord` Mongoose model with indexed session and store queries.
  - `src/storefront/sections/Chatbot.jsx`: Floating AI Assistant UI with dynamic chips, action tags (`[[PRODUCT:...]]`, `[[PAGE:...]]`), and consultation cards.
  - `src/storefront/storefront.css`: Viewport constraints (`max-width: 100vw; overflow-x: hidden`) and $40\text{px} \times 40\text{px}$ touch targets.
  - Refactored `Users.jsx` (extracted `CreateUserModal`, `EditUserModal`, `UserFilters`) and `Dashboard.jsx` (extracted 7 POS billing cards).
- **Security & Privacy Invariants**:
  - SEC-01 Multi-Store Isolation enforced (13/13 tests pass).
  - PRV-01 Ticket internal-note privacy enforced.
  - VAL-01 Order ownership & server-authoritative GST calculations enforced.
  - Zero secrets or customer PII in git diff.
- **Deferred Work**: Soil Test external-data integration and Leave Management remain strictly deferred.

---

## 6. Test & Build Execution Evidence

Freshly executed in the workspace with exit code 0:

| Test Suite / Build Step | Command Executed | Result | Duration |
| :--- | :--- | :---: | :---: |
| **Backend Syntax Checks** | `node --check server/server.js server/chatAssistant.js server/db.js` | **0 errors (Pass)** | 0.8s |
| **Agronomic Safety Suite** | `node --test server/tests/agronomy-safety.test.mjs` | **3 / 3 Pass** | 119ms |
| **Chat Assistant API & Logic** | `node --test server/tests/chat-assistant.test.mjs` | **14 / 14 Pass** | 1.23s |
| **SEC-01 Multi-Store Isolation** | `node --env-file=server/.env --test server/tests/staff-store-isolation.test.mjs` | **13 / 13 Pass** | 15.7s |
| **OTP Auth & Rate Limiting** | `node --test server/tests/otp-auth.test.mjs` | **21 / 21 Pass** | 1.65s |
| **Financial Parity & GST Authority** | `node --test server/tests/financial-parity.test.mjs` | **14 / 14 Pass** | 1.06s |
| **Billing & POS Invoicing** | `node --test server/tests/billing-invoice.test.mjs` | **8 / 8 Pass** | 1.07s |
| **Formatters Suite** | `node --test server/tests/formatters.test.mjs` | **3 / 3 Pass** | 263ms |
| **Frontend Shared Regression Suite** | `node --test src/shared/__tests__/*.test.js` | **218 / 218 Pass** | 1.76s |
| **Isolated Production Build** | `npx vite build --outDir dist-release-gate-check` | **1,817 modules, 0 errors** | 9.53s |
| **Total Automated Tests** | — | **294 / 294 PASS** | — |

---

## 7. Exact Proposed Commit Message

```
feat(release): personalized AI farming assistant, agronomy safety guardrails & architecture stabilization

- Core Chatbot Backend:
  - Add server/chatAssistant.js implementing context-aware assistant, dynamic follow-up suggestions, 7-point agronomy safety protocol, and deterministic fallback
  - Add grounded /api/chat/assistant, /api/chat/history, and store-scoped /api/chat/records endpoints in server/server.js
  - Add ChatRecord schema and persistence queries in server/db.js
  - Add regression suites: server/tests/agronomy-safety.test.mjs, chat-assistant.test.mjs, financial-parity.test.mjs

- Chatbot Frontend & Responsive UI:
  - Implement Personalized AI Farming Assistant in src/storefront/sections/Chatbot.jsx with suggestion chips, catalog product tags, and agronomist consultation navigation
  - Enforce mobile viewport constraints (max-width: 100vw; overflow-x: hidden) and 40px touch targets in src/storefront/storefront.css
  - Propagate consultation context and referral notice banner in src/pages/AgronomyExperts.jsx
  - Add store-scoped admin chat history viewer in src/pages/shared/ChatRecords.jsx
  - Add unit test suite in src/shared/__tests__/chatbot.test.js

- Architecture Stabilization & Refactoring (Batches 6–29):
  - Modularize admin Users (CreateUserModal, EditUserModal, UserFilters) and POS billing Dashboard (7 subcomponent cards)
  - Extract reusable ticket thread components (TicketAttachmentPreview, TicketMessageThread, TicketStatusBadge)
  - Extract product form sections (AdvancedSection, MediaSection, VideosSection, VisibilitySection)
  - Enforce server-side 0% GST and tax authority parity across 218 frontend tests
  - Update vite.config.js to target es2022

- Quality Assurance & Release Audit:
  - Add comprehensive QA documentation and evidence audit reports in docs/refactoring/
  - Add responsive layout verification PNG assets in docs/refactoring/screenshots/
```
