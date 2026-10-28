# Sathyam Agro Mart — Refactoring Backlog

**Last Updated**: October 28, 2026  
**Status Key**: `Not Started` | `In Progress` | `Refactored` | `Verified` | `Deferred`

---

## Batch 1: Safe Cleanup & Core Formatters (Low Risk)
- [x] **Task 1.1**: Remove dead mock exports in `src/context/AuthContext.jsx` (`MOCK_EMPLOYEES`, `getEmployeeList`, `getEmployeeDetails`).
- [x] **Task 1.2**: Standardize raw `res.status(500)` calls in `server/server.js` (lines 722, 847, 931, 1661, 1676, 1911, 2052) to use `sendError()`.
- [x] **Task 1.3**: Create centralized formatting utilities in `src/utils/formatters.js` (`formatCurrency`, `formatDate`, `formatShortDate`, `formatDateTime`).
- [x] **Task 1.4**: Unit test and verify Batch 1 with `npm run build` and core regression suite (84/84 tests passed).

---

## Batch 2: Shared UI Presentation Components (Low-Medium Risk)
- [x] **Task 2.1**: Create `src/components/common/StatusBadge.jsx` for standardized badge colors and labels (Orders, Delivery, Tickets, Users, Payments).
- [x] **Task 2.2**: Create `src/components/common/EmptyState.jsx` to replace duplicated empty list markup.
- [x] **Task 2.3**: Create `src/components/common/TableLoader.jsx` for uniform loading indicators in data tables.
- [x] **Task 2.4**: Refactor `src/pages/admin/Orders.jsx` to use `StatusBadge` and `formatCurrency`.
- [x] **Task 2.5**: Refactor `src/pages/delivery/Dashboard.jsx` to use `StatusBadge` and `formatCurrency`.
- [x] **Task 2.6**: Verify Batch 2 with `npm run build` and regression tests (84/84 tests passed).

---

## Batch 3: Modal & Dialog Consolidation (Medium Risk)
- [x] **Task 3.1**: Create `src/components/common/Modal.jsx` supporting escape-to-dismiss, backdrop click handling, and accessible ARIA attributes.
- [x] **Task 3.2**: Refactor `src/pages/superadmin/Stores.jsx` to use `Modal.jsx`.
- [x] **Task 3.3**: Refactor `src/pages/admin/Coupons.jsx` to use `Modal.jsx`.
- [x] **Task 3.4**: Refactor `src/pages/admin/Videos.jsx` to use `Modal.jsx`.
- [x] **Task 3.5**: Verify Batch 3 with `npm run build` and full regression tests.

---

## Batch 4: Backend Route Organization & Admin Module Alignment (Medium Risk)
- [x] **Task 4.1**: Move coupon routes (`/api/admin/coupons`, `/api/admin/coupon-usages`) from `server/server.js` into `server/adminRoutes.js`.
- [x] **Task 4.2**: Move referral routes (`/api/admin/referrals/*`) from `server/server.js` into `server/adminRoutes.js`.
- [x] **Task 4.3**: Move staff profile routes (`/api/admin/staff-profiles/*`) from `server/server.js` into `server/adminRoutes.js`.
- [x] **Task 4.4**: Verify Batch 4 with `node --check` and full backend test suites.

---

## Batch 5: Large Frontend Page Modularization (Medium Risk)
- [x] **Task 5.1**: Decompose `src/pages/admin/Products.jsx` modal tabs into focused sub-components (`ProductFormRail.jsx`, `PricingSection.jsx`).
- [x] **Task 5.2**: Decompose `src/pages/billing/Dashboard.jsx` POS item entry and payment selectors (`AddItemCard.jsx`, `PaymentModeCard.jsx`).
- [x] **Task 5.3**: Clean up analytics metric formatters across `src/pages/admin/Analytics.jsx` and `src/pages/superadmin/ShopAnalytics.jsx` using `src/utils/formatters.js`.
- [x] **Task 5.4**: Run final regression suite (170/170 tests passed) and production build (built in 9.40s).

---

## Deferred Items
- [x] **Leave Management**: **Deferred pending client confirmation.** (No implementation permitted).
