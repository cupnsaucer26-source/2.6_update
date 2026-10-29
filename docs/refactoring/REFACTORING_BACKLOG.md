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

## Batch 6: Verification Audit Remediation & Deep Component Integration (Low-Medium Risk)
- [x] **Task 6.1**: Fix currency formatter negative number placement (`-₹50` instead of `₹-50`), update `formatShortDate` (day+month without year for compact charts), enforce explicit `timeZone: 'Asia/Kolkata'` IST formatting, and update unit test suite in `server/tests/formatters.test.mjs`.
- [x] **Task 6.2**: Integrate shared `Modal.jsx` into `src/pages/superadmin/Stores.jsx`, `src/pages/admin/Coupons.jsx`, and `src/pages/admin/Videos.jsx`, replacing legacy inline overlays while preserving all form fields, themes, and handlers.
- [x] **Task 6.3**: Integrate `EmptyState.jsx` into `Stores.jsx`, `Coupons.jsx`, `Videos.jsx`, and `delivery/Dashboard.jsx` to render high-contrast feedback after loading completes.
- [x] **Task 6.4**: Integrate `TableLoader.jsx` into table loading states across `Coupons.jsx` (`colSpan={8}`, `colSpan={7}`) and `Orders.jsx` (`colSpan={COLUMN_COUNT}`).
- [x] **Task 6.5**: Restore `badge-orange` visual mapping for `Out for Delivery` status in `src/components/common/StatusBadge.jsx` to align with `index.css:2376`.
- [x] **Task 6.6**: Fix OTP test harness environment bypass logic (`getTestPhones` in `server/server.js`) and update dual-identity stubs in `server/tests/otp-auth.test.mjs`, unlocking 31/31 passing OTP tests.
- [x] **Task 6.7**: Execute complete verification: 201/201 tests passing across all 22 test suites (100% pass rate) and Vite production build succeeding with 0 errors in 9.65s.

---

## Batch 7: Admin Products Modularization & Component Decomposition (Medium Risk)
- [x] **Task 7.1**: Decompose `pform-media` into `src/pages/admin/products/MediaSection.jsx` preserving multi-photo upload, thumbnail previews, and validation.
- [x] **Task 7.2**: Decompose `pform-visibility` into `src/pages/admin/products/VisibilitySection.jsx` preserving farmer personalization and sales channel options (Both, Online Only, Offline Only).
- [x] **Task 7.3**: Decompose `VideosSection` into `src/pages/admin/products/VideosSection.jsx` preserving attached list, media library selector, and custom video URL forms.
- [x] **Task 7.4**: Decompose `pform-advanced` into `src/pages/admin/products/AdvancedSection.jsx` preserving active ingredients, dosage, how/when to use, and customer review options.
- [x] **Task 7.5**: Integrate `TableLoader` (`colSpan={9}`), `EmptyState` (`icon={<Package size={28} />}`), and `formatCurrency` into `src/pages/admin/Products.jsx`.
- [x] **Task 7.6**: Verify with `npm run build` (built in 11.08s, 1,800 modules transformed, 0 errors) and full regression tests (201/201 tests passing).

---

## Batch 8: POS Billing Dashboard Modularization & Table Standardization (Medium Risk)
- [x] **Task 8.1**: Decompose Document & e-Invoice Details into `src/pages/billing/components/DocumentMetaCard.jsx` (`TAX INVOICE`, `CREDIT NOTE`, `BILL OF SUPPLY`, invoice numbers, ack numbers, and IRN).
- [x] **Task 8.2**: Decompose Buyer & Consignee into `src/pages/billing/components/BuyerConsigneeCard.jsx` (`sameAsBuyer` toggle, billing address, ship-to details).
- [x] **Task 8.3**: Decompose Despatch & Transport Details into `src/pages/billing/components/TransportDetailsCard.jsx` (collapsible section, vehicle numbers, logistics partners, LR numbers, order dates).
- [x] **Task 8.4**: Standardize Billed Line Items table using `<EmptyState icon={<ReceiptText size={32} />} />` and `formatCurrency()`.
- [x] **Task 8.5**: Standardize Recent Invoices History table using `<TableLoader colSpan={7} />`, `<EmptyState />`, `formatShortDate()`, and `formatCurrency()`.
- [x] **Task 8.6**: Verify with `npm run build` (built in 21.68s, 1,803 modules transformed, 0 errors) and full regression tests (201/201 tests passing).

---

## Batch 9: Users Page Modularization & Presentation Standardization (Medium Risk)
- [x] **Task 9.1**: Extract `src/pages/admin/users/UserFilters.jsx` (Search input form, role filter select dropdown, sort order select, and live refresh button).
- [x] **Task 9.2**: Extract `src/pages/admin/users/CreateUserModal.jsx` (New user credentials form, strong password generation, password rules checklist, error display, role-specific farmer crop/land inputs or staff department field, and form submission).
- [x] **Task 9.3**: Extract `src/pages/admin/users/EditUserModal.jsx` (User credentials update form, customer profile summary inspection for farmers in view-only mode, password reset field with validation rules, account status dropdown, and form submission).
- [x] **Task 9.4**: Standardize table loading state with `<TableLoader colSpan={9} />` and zero-record state with `<EmptyState icon={<UsersIcon size={32} />} />`.
- [x] **Task 9.5**: Standardize role and account status badges using `<StatusBadge />` and creation dates using `formatDate(u.createdAt)`.
- [x] **Task 9.6**: Verify with `node --check server/server.js`, `npm run build` (0 errors), and full backend regression suite (201/201 tests passing).

---

## Batch 10: Omnichannel Analytics Orders Table Modularization & Users Regression Audit (Low-Medium Risk)
- [x] **Task 10.1**: Perform full Users page regression audit covering user creation, editing, view-only customer profile inspection, password rules, role badges, and search/filtering (0 defects).
- [x] **Task 10.2**: Enhance `src/utils/formatters.js` `formatDateTime` to support optional format options and add unit tests to `server/tests/formatters.test.mjs`.
- [x] **Task 10.3**: Decompose `src/pages/admin/Analytics.jsx` actual transactions table into `src/pages/admin/analytics/AnalyticsOrdersTable.jsx`.
- [x] **Task 10.4**: Integrate `<EmptyState icon={<FileSpreadsheet size={32} />} />`, `<StatusBadge />`, `formatCurrency`, and `formatDateTime` into `AnalyticsOrdersTable.jsx`.
- [x] **Task 10.5**: Standardize `exportCSV` date-time formatting in `Analytics.jsx` using `formatDateTime`.
- [x] **Task 10.6**: Verify with `node --check server/server.js`, `npm run build` (0 errors), and full backend test suite (201/201 tests passing).

---

## Batch 11: Support Tickets Module Audit, Safe Refactoring & Verification (Low-Medium Risk)
- [x] **Task 11.1**: Audit repository state, resolve real file paths (`src/pages/admin/SupportTickets.jsx`, `src/pages/superadmin/SupportTicketSystem.jsx`, `src/pages/SupportTicketsCustomer.jsx`, `src/pages/shared/Tickets.jsx`), and document multi-portal actor boundaries.
- [x] **Task 11.2**: Extract reusable `src/components/tickets/TicketStatusBadge.jsx` for status and priority chips with Phase 2 CSS token fidelity and icon support.
- [x] **Task 11.3**: Extract reusable `src/components/tickets/TicketAttachmentPreview.jsx` for customer ticket photo inspection with full-size link.
- [x] **Task 11.4**: Extract reusable `src/components/tickets/TicketMessageThread.jsx` supporting staff and customer modes, internal staff notes privacy highlighting, system events, and reply attachments.
- [x] **Task 11.5**: Refactor `SupportTickets.jsx`, `SupportTicketSystem.jsx`, `SupportTicketsCustomer.jsx`, and `Tickets.jsx` to adopt subcomponents and eliminate dead imports.
- [x] **Task 11.6**: Run full quality gates: `node --check server/server.js`, `npm run build` (0 errors), ticket test suite (15/15 passing), and full regression test suite (201/201 passing).

---

## Batch 12: Repository-Wide Duplication Audit & Refactoring Roadmap (Audit & Planning Only)
- [x] **Task 12.1**: Establish actual repository baseline at commit `737bf8c` and verify all Batches 1–11 modifications preserved in working tree.
- [x] **Task 12.2**: Audit line counts and responsibilities across all 60+ React pages in `src/pages/` and services in `src/services/`.
- [x] **Task 12.3**: Audit shared component adoption (`Modal`, `StatusBadge`, `TableLoader`, `EmptyState`, `formatters.js`) and identify remaining raw markup and date/currency formatting inconsistencies.
- [x] **Task 12.4**: Audit backend server architecture (`server/server.js` 4,442 lines, `server/db.js` 3,552 lines, `server/http.js`).
- [x] **Task 12.5**: Rule out false positives (intentional multi-actor separation: `superadmin/Users` vs `admin/Users`, `AllProducts` vs `admin/Products`, `index.css` vs `storefront.css`).
- [x] **Task 12.6**: Rank top 5 refactoring candidates and define detailed scope and verification plan for recommended Batch 13 (`Referrals.jsx` & `Enquiries.jsx`).
- [x] **Task 12.7**: Document findings in `docs/refactoring/BATCH_12_REPOSITORY_AUDIT_REPORT.md` with zero application code mutations.

---

## Batch 13: Admin Enquiries & Referrals UI Standardization (Low-Medium Risk)
- [x] **Task 13.1**: Enhance `src/components/common/StatusBadge.jsx` with referral status mappings (`expired: 'gray'`, `rejected: 'red'`, `reversed: 'red'`).
- [x] **Task 13.2**: Refactor `src/pages/admin/Enquiries.jsx`: replace manual modal overlay with `<Modal />`, integrate `<TableLoader colSpan={9} />` and `<EmptyState />`, standardize date formatting with `formatDateTime`, and preserve inline status update `<select>`.
- [x] **Task 13.3**: Refactor `src/pages/admin/Referrals.jsx` Tab 1 (Referral Network): integrate `<StatusBadge />`, `formatDate`, `<TableLoader colSpan={9} />`, and `<EmptyState />`.
- [x] **Task 13.4**: Refactor `src/pages/admin/Referrals.jsx` Tab 2 (Points Balances): integrate `<TableLoader colSpan={6} />` and `<EmptyState />`.
- [x] **Task 13.5**: Refactor `src/pages/admin/Referrals.jsx` Tab 3 (Points Audit Log): integrate `formatDateTime`, `<TableLoader colSpan={5} />`, and `<EmptyState />`.
- [x] **Task 13.6**: Refactor `src/pages/admin/Referrals.jsx` Points Adjustment Modal: replace manual modal overlay with `<Modal />`.
- [x] **Task 13.7**: Run full verification: `node --check server/server.js`, `referrals.test.mjs` (22/22 passing), full test suite (201/201 passing), and Vite production build (0 errors in 9.43s).

---

## Batch 14: Admin Employees, Categories & Subscribers UI Standardization (Low Risk)
- [x] **Task 14.1**: Audit candidate targets: verify non-existence of `src/pages/admin/Categories.jsx`, establish customer storefront role of `src/pages/Categories.jsx`, and audit `Employees.jsx` and `Subscribers.jsx`.
- [x] **Task 14.2**: Refactor `src/pages/admin/Employees.jsx`: integrate `<TableLoader />` for data fetching, `<EmptyState />` for zero filter matches, `<StatusBadge />` for account status, and `formatDateTime` for profile updated timestamp.
- [x] **Task 14.3**: Refactor `src/pages/admin/Subscribers.jsx`: integrate `<TableLoader colSpan={9} />` for subscribers loading, `<EmptyState />` for empty filter matches, centralized `formatDate` and `formatDateTime`, and add keyboard `Escape` dismissal to `BroadcastComposer`.
- [x] **Task 14.4**: Preserve 100% of functional rules: interactive subscriber toggle button, broadcast execution engine, employee agronomy expert certification, and store boundary isolation.
- [x] **Task 14.5**: Run full verification gate: `node --check server/server.js`, full test suite (201/201 passing), and Vite production build (0 errors in 11.56s).

---

## Batch 15: Agronomy Bookings & Soil Reports UI Standardization (Low Risk)
- [x] **Task 15.1**: Audit `src/pages/admin/AgronomyBookings.jsx` and `src/pages/admin/SoilReports.jsx`, confirming layout structure, loading indicators, empty states, and date formatting.
- [x] **Task 15.2**: Standardize `src/pages/admin/AgronomyBookings.jsx`: replace raw `<p className="p2-loading">` with `<TableLoader message="Loading agronomy bookings…" size={24} />`, replace raw `.p2-empty` with `<EmptyState icon={<Calendar size={32} />} ... />`, and standardize completed callback timestamp with `formatDate(b.completedAt)`.
- [x] **Task 15.3**: Standardize `src/pages/admin/SoilReports.jsx`: replace raw queue `<div className="p2-loading">` with `<TableLoader message="Loading soil reports…" size={24} />`, and replace raw queue `.p2-empty` with `<EmptyState icon={<FlaskConical size={32} />} ... />`.
- [x] **Task 15.4**: Preserve 100% of functional rules: multi-store isolation (`SEC-01`), expert conflict checking, slot scheduling, inline reschedule card, callback completion form, soil nutrient metrics, and remedy prescription issuing workflow.
- [x] **Task 15.5**: Run full verification gate: `node --check server/server.js`, `agronomy-booking-lifecycle.test.mjs` (7/7 passing), full regression suite (201/201 passing across 22 test suites), and Vite production build (0 errors in 10.74s).

---

## Batch 16: Blog Content Management Audit & Safe UI Standardization (Low Risk)
- [x] **Task 16.1**: Confirm blog administrative route and file path (`src/pages/admin/Blogs.jsx`), and audit loading/empty states, date formatters, publish toggles, and modal dialog behavior.
- [x] **Task 16.2**: Standardize `src/pages/admin/Blogs.jsx`: integrate `<TableLoader message="Loading blogs..." size={28} />`, `<EmptyState icon={<BookOpen size={36} />} ... />`, and `formatDate(blog.createdAt)`.
- [x] **Task 16.3**: Preserve interactive publish/draft status toggle (`handleTogglePublish(blog)`), enhancing with `type="button"`, `title`, and `aria-label`.
- [x] **Task 16.4**: Add accessible dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), keyboard `Escape` dismissal, and backdrop click handler with unsaved changes (`isDirty`) guard to prevent draft loss, while preserving 760px responsive CSS rules (`.blog-modal*` in `src/index.css`).
- [x] **Task 16.5**: Conduct full regression audit on `src/pages/admin/Subscribers.jsx` (Batch 14 changes), confirming zero regressions in subscriber status toggles, broadcast throttling, and Escape-key safeguards.
- [x] **Task 16.6**: Run complete verification gate: `node --check server/server.js`, full test suite (201/201 passing across all 22 test suites), and Vite production build (0 errors in 8.33s).

---

## Batch 17: ShopAnalytics XLSX Lazy Loading & Safe Performance Optimization (Low Risk)
- [x] **Task 17.1**: Inspect `src/pages/superadmin/ShopAnalytics.jsx` and confirm static `xlsx` library import bloating initial route bundle.
- [x] **Task 17.2**: Replace static `import * as XLSX from 'xlsx'` with cached asynchronous loader `loadXlsx()` triggered solely on demand during export actions.
- [x] **Task 17.3**: Enhance export UI handlers: convert `exportFullExcelReport` and `exportInvoicesExcel` to `async`, add `exportingInvoices` guard, add spin animations (`sa-spin`), loading button copy, and graceful alert error recovery.
- [x] **Task 17.4**: Preserve 100% of export functionality: maintain exact workbook structure (all 5 sheets: Executive Overview, Store Performance, All Invoices, Top Products, Invoices Ledger), columns, calculations, and ISO date filenames.
- [x] **Task 17.5**: Measure bundle sizes and run verification gate: `ShopAnalytics.js` down from 303.53 kB to 20.91 kB (93.1% reduction); `node --check server/server.js` passed; full test suite (201/201 passing across 22 test suites); Vite build verified (0 errors in 9.13s).

---

## Batch 18: Repository Safety Recovery Assessment, Export Verification & Refactoring Roadmap (Audit & Verification)
- [x] **Task 18.1**: Establish and document complete baseline repository state (`main` at `737bf8c`, 30 modified files, 15 untracked reports/components, zero staged changes).
- [x] **Task 18.2**: Investigate Batch 17 safety concern regarding `git checkout -- dist` and `git clean -fd dist`: categorize findings into confirmed facts, reasonable inferences, and unknowns.
- [x] **Task 18.3**: Review `src/pages/superadmin/ShopAnalytics.jsx` across all 11 evaluation criteria: confirmed static import removed, dynamic import used in both handlers, cached promise resets on failure, re-entrancy guarded, and export schemas preserved.
- [x] **Task 18.4**: Execute Node.js workbook serialization & schema verification script (`verify-xlsx-export.mjs`): verified all 5 worksheets (`Executive Overview`, `Store Performance`, `All Invoices (SAM)`, `Top Products Sold`, `Invoices Ledger`), column headers, and financial math. Live browser download test recorded as NOT EXECUTED.
- [x] **Task 18.5**: Execute non-destructive quality gates: `node --check server/server.js` (pass), `node --test` (201/201 tests passed across 22 suites), isolated Vite build to external scratch directory (1,810 modules transformed in 18.41s, 0 errors, `dist/` untouched), and `git diff --check` (0 errors).
- [x] **Task 18.6**: Review project documentation, establish Decision 2.18 (isolated build outputs and strict prohibition of destructive git commands), and rank Candidates A–D for data-driven next batch selection.

---

## Batch 19: Critical Frontend Regression Testing & Safe Test Infrastructure (Testing & Verification)
- [x] **Task 19.1**: Audit test infrastructure: inspect frontend testing patterns in `src/shared/__tests__/*.test.js`, establish zero-dependency native test harness using `node:test` and `node:assert/strict`.
- [x] **Task 19.2**: Author ShopAnalytics Excel export regression suite (`src/shared/__tests__/shopAnalyticsExport.test.js` - 8 tests): dynamic loading, caching, failure recovery, re-entrancy prevention, loading disabling, and workbook schema verification.
- [x] **Task 19.3**: Author Farmer cart and checkout regression suite (`src/shared/__tests__/farmerCartCheckout.test.js` - 13 tests): cart normalization, quantity handling, guest basket merging, catalog price/GST recalculation, orderLine isolation, tax/discount math, address validation, submit debouncing, and Razorpay script fallback.
- [x] **Task 19.4**: Author Delivery OTP handoff regression suite (`src/shared/__tests__/deliveryOtpHandoff.test.js` - 6 tests): card normalization, client-side validation, OTP verification transition, error handling, submit protection, and role-based status bypass security invariant.
- [x] **Task 19.5**: Execute full non-destructive test suite: 179/179 frontend tests passed across 27 files in 1.15s; 201/201 backend tests passed across 22 suites in 20.2s; `node --check server/server.js` passed.
- [x] **Task 19.6**: Run isolated Vite production build verification to external scratch directory (1,810 modules transformed in 9.55s, 0 errors, `dist/` untouched) and document Decision 2.19.

---

## Batch 20: Browser E2E Feasibility Audit & Critical User Journey Verification (E2E Verification)
- [x] **Task 20.1**: Audit browser testing feasibility: discovered active `chrome-devtools-mcp` integration connected to installed Google Chrome binary (`chrome.exe`), eliminating need for external runner dependencies (Playwright, Cypress, Puppeteer).
- [x] **Task 20.2**: Construct isolated test environment: built zero-database native Node.js mock API server (`scratch/test-mock-server.mjs` on port 5099) and isolated Vite dev configuration (`scratch/vite.test.config.js` on port 3100) leaving tracked files in `dist/`, `package.json`, and `vite.config.js` 100% untouched.
- [x] **Task 20.3**: Execute ShopAnalytics browser journey (`/superadmin/analytics`): verified SuperAdmin authentication, metrics hydration, dynamic XLSX chunk loading, and real browser file downloads for both `SathyamBio_Shops_Analytics_2026-10-28.xlsx` and `SathyamBio_Invoices_2026-10-28.xlsx`.
- [x] **Task 20.4**: Execute Farmer cart & checkout browser journey (`/`): verified product card rendering, pack chips, Add to Cart interaction, `#basket` drawer opening, stepper quantity increments, subtotal/tax recalculation, `#checkout-address` required field validation errors, valid field entry, `#checkout-payment` transition, and payment failure recovery.
- [x] **Task 20.5**: Execute Delivery OTP handoff browser journey (`/delivery`): verified delivery agent dashboard loading, assigned order cards, empty OTP client rejection, invalid OTP ("9999") refusal (card remains "Out for Delivery"), and valid OTP ("1234") transition to "Delivered" with dynamic KPI counter updates.
- [x] **Task 20.6**: Execute existing quality gates: `node --check server/server.js` (pass), `node --test src/shared/__tests__/*.test.js` (179/179 pass), `node --test server/tests/*.test.mjs` (201/201 pass), isolated Vite build (1,810 modules transformed in 35.23s, 0 errors), and document Decision 2.20.

---

## Batch 21: Safe Billing POS Modularization — Phase 1 (Low-Medium Risk)
- [x] **Task 21.1**: Extract `RecentInvoicesCard` (`src/pages/billing/components/RecentInvoicesCard.jsx`) from monolithic `Dashboard.jsx`, creating self-contained invoice history table with reprint/view triggers.
- [x] **Task 21.2**: Extract pure shared invoice helpers to `src/shared/billingInvoices.js` (`getPaymentBadgeClass`, `formatRecentInvoiceRow`, `prepareRecentInvoices`).
- [x] **Task 21.3**: Refactor `src/pages/billing/Dashboard.jsx` to render `<RecentInvoicesCard />` with explicit props, removing unused imports (`Clock`, `RefreshCw`, `TableLoader`, `formatShortDate`).
- [x] **Task 21.4**: Author targeted unit and regression tests in `src/shared/__tests__/billingRecentInvoices.test.js` (5 tests covering badge mapping, row normalization, fallbacks, limit slicing, and action dispatch).
- [x] **Task 21.5**: Execute full quality gates: 184/184 frontend tests pass, 201/201 backend tests pass, isolated Vite build passes, and document Decision 2.21.

---

## Batch 22: Billing POS Modularization — Phase 2: Bill Items Card (Low-Medium Risk)
- [x] **Task 22.1**: Extract active bill items table from `Dashboard.jsx` into `src/pages/billing/components/BillItemsCard.jsx` with full action dispatches (decrement, increment, remove, clear).
- [x] **Task 22.2**: Extract pure shared helpers into `src/shared/billingItems.js` (`formatItemRate`, `canDecrementQty`, `calculateItemAmount`, `normalizeBillItem`).
- [x] **Task 22.3**: Refactor `src/pages/billing/Dashboard.jsx` to render `<BillItemsCard />` passing down explicit props and callbacks, removing unused imports (`Trash2`, `EmptyState`).
- [x] **Task 22.4**: Author targeted unit and regression tests in `src/shared/__tests__/billItemsCard.test.js` (5 tests covering rate formatting, decrement guardrails, amount calculations, fallbacks, and dispatch contracts).
- [x] **Task 22.5**: Execute full quality gates: 189/189 frontend tests pass, 201/201 backend tests pass, isolated Vite build passes, and document Decision 2.22.

---

## Batch 23: Billing POS Browser Regression Verification (Browser Verification)
- [x] **Task 23.1**: Establish isolated browser verification environment (mock API server daemon on port 5099, isolated Vite dev server on port 3100, zero modifications to tracked `dist/`).
- [x] **Task 23.2**: Execute `BillItemsCard` browser verification scenarios in Google Chrome via Chrome DevTools MCP: empty state, single item add, stepper increment (+), stepper decrement (-), lower bound protection (< 1 prevented), multi-item entry, single item deletion, "Clear Bill" action, and financial totals consistency.
- [x] **Task 23.3**: Execute `RecentInvoicesCard` browser verification scenarios: history table rendering, payment badges, "Refresh" action API re-fetch, "View & Print" modal preview mounting, and modal dismissal.
- [x] **Task 23.4**: Identify and resolve browser console issues: discovered and surgically remediated React DOM nesting warning (`<tr>` cannot appear as a child of `<div>`) in `RecentInvoicesCard.jsx` by removing `colSpan={7}` from `TableLoader`.
- [x] **Task 23.5**: Verify mobile responsiveness: confirmed table horizontal scrolling (`.table-wrap`) on 375x667 viewport without breaking layout.
- [x] **Task 23.6**: Execute existing quality gates: `node --test src/shared/__tests__/*.test.js` (189/189 pass), `node --test server/tests/*.test.mjs` (201/201 pass), `node --check server/server.js` (pass), isolated Vite build (built in 17.19s, 0 errors), and document Decision 2.23.

---

## Batch 24: Billing Dashboard Architecture Audit & Safe Modularization — Phase 3 (Architecture Audit & Modularization)
- [x] **Task 24.1**: Architecture audit & inventory of existing billing components: catalogued all 7 extracted components in `src/pages/billing/components/` and evaluated remaining inline sections in `Dashboard.jsx`.
- [x] **Task 24.2**: Risk assessment and candidate selection: confirmed Bill Summary Card contains critical financial math and must not be touched; selected low-risk Today's KPI Stats Grid (`.stat-grid`).
- [x] **Task 24.3**: Extract `BillingStatsCard` (`src/pages/billing/components/BillingStatsCard.jsx`) and pure helper functions (`formatBillingStats`, `computeTodayStats`) in `src/shared/billingInvoices.js`.
- [x] **Task 24.4**: Refactor `src/pages/billing/Dashboard.jsx`: integrate `<BillingStatsCard todayStats={todayStats} />`, keeping parent state ownership and reducing `Dashboard.jsx` to 800 lines.
- [x] **Task 24.5**: Author targeted unit and regression tests in `src/shared/__tests__/billingStatsCard.test.js` (5 tests covering formatters, fallbacks, and date-filtered metric aggregations).
- [x] **Task 24.6**: Execute full quality gates: 194/194 frontend tests pass across 30 files, 201/201 backend tests pass across 22 suites, `node --check server/server.js` passes, isolated Vite build passes (9.38s, 0 errors, `dist/` untouched).
- [x] **Task 24.7**: Chrome DevTools MCP browser verification: verified rendered KPI stats (`₹4,130`, `3`, `₹630`), zero console errors, zero React warnings, and documented Decision 2.24.

---

## Batch 25: Billing Summary Financial Logic — Safe Pure Extraction & Regression Tests (Financial Logic & Unit Testing)
- [x] **Task 25.1**: Audit existing financial calculations: inspected item subtotal, manual discount percentage clamping, coupon discount aggregation, taxable subtotal, proportional GST attribution, CGST/SGST rounding, round-off, Indian currency words, and backend validation contracts in `server/server.js`.
- [x] **Task 25.2**: Establish baseline: verified 194 frontend tests, 201 backend tests, `node --check server/server.js`, isolated Vite production build (0 errors), and `git diff --check`.
- [x] **Task 25.3**: Extract pure financial calculation helpers into `src/shared/billingSummary.js` (`calculateItemsSubtotal`, `calculateManualDiscount`, `calculateTaxableSubtotal`, `calculateTaxBreakdown`, `calculateRoundOff`, `calculateBillingSummary`, `formatBillingSummary`).
- [x] **Task 25.4**: Prove mathematical equivalence: verified 11 edge cases between legacy inline `Dashboard.jsx` code and the new helper module with 100% equivalence.
- [x] **Task 25.5**: Author targeted unit and regression tests in `src/shared/__tests__/billingSummary.test.js` (10 tests covering subtotal summation, manual discount bounds, taxable flooring, mixed GST rates, round-off boundaries, backend contract alignment, combined discounts, large wholesale orders, and formatting).
- [x] **Task 25.6**: Integrate helpers into `src/pages/billing/Dashboard.jsx`: replaced inline calculations with `calculateBillingSummary()`, preserving exact variable names, coupon validation workflow, invoice submission payload schemas, and UI presentation without extracting `BillSummaryCard.jsx`.
- [x] **Task 25.7**: Execute complete quality gates: 204/204 frontend tests pass across 31 files, 201/201 backend tests pass across 22 suites, `node --check server/server.js` passes, isolated Vite build passes (20.19s, 0 errors, `dist/` untouched), and document Decision 2.25.

---

## Batch 26: BillSummaryCard UI Extraction — Phase 4 (UI Extraction & Browser Verification)
- [x] **Task 26.1**: Pre-extraction audit: mapped all state variables (`appliedCoupon`, `couponDiscountAmount`, `couponCodeInput`, `validatingCoupon`, `globalDiscountPercent`), callbacks (`setCouponCodeInput`, `applyCoupon`, `removeCoupon`, `setGlobalDiscountPercent`, `handleSaveAndPrintInvoice`, `handlePreviewCurrentBill`), summary data bindings, and action handlers in `src/pages/billing/Dashboard.jsx`.
- [x] **Task 26.2**: Establish quality gate baseline: verified 204 frontend tests, 201 backend tests, `node --check server/server.js`, isolated Vite production build (0 errors), and `git diff --check`.
- [x] **Task 26.3**: Extract `BillSummaryCard` component (`src/pages/billing/components/BillSummaryCard.jsx`): encapsulated card header, coupon code input with validation state and applied badge, manual discount input with $[0, 100]$ bounds, financial summary breakdown, Indian numbering words representation, and disabled guards on action buttons ("Generate & Print Bill", "Preview Exact Template") when bill has no items.
- [x] **Task 26.4**: Refactor `src/pages/billing/Dashboard.jsx`: replaced lines 647–780 with `<BillSummaryCard ... />`, preserving parent state ownership, removing unused imports (`Tag`, `formatCurrency`), and reducing `Dashboard.jsx` from 793 to 684 lines (-109 lines).
- [x] **Task 26.5**: Author targeted unit and regression tests in `src/shared/__tests__/billSummaryCard.test.js` (5 tests covering view model summary resolution, empty bill disabled button contracts, coupon view model modes, manual discount bounds, and action dispatch simulations).
- [x] **Task 26.6**: Live browser regression verification via Chrome DevTools MCP on `http://127.0.0.1:3100/billing`: verified initial empty state with disabled action buttons, product addition with dynamic totals/words updates, manual discount application with auto-recalculation, coupon validation (`WELCOME10` saving ₹50 via mock API), coupon removal restoring totals, modal preview trigger, and zero console errors/warnings.
- [x] **Task 26.7**: Execute complete quality gates: 209/209 frontend tests pass across 32 files, 201/201 backend tests pass across 22 suites, `node --check server/server.js` passes, isolated Vite build passes (7.01s, 0 errors, `dist/` untouched), clean `git diff --check`, and document Decision 2.26.

---

## Batch 27: Billing Integration Audit & History View Model Resilience (Integration Audit & Resilience)
- [x] **Task 27.1**: Pre-audit baseline verification: confirmed 209 frontend tests, 201 backend tests, `node --check server/server.js`, isolated Vite production build (0 errors), and `git diff --check`.
- [x] **Task 27.2**: Component integration & prop contracts audit: traced all 9 extracted cards (`BillSummaryCard`, `BillItemsCard`, `AddItemCard`, `PaymentModeCard`, `DocumentMetaCard`, `BuyerConsigneeCard`, `TransportDetailsCard`, `RecentInvoicesCard`, `BillingStatsCard`), verifying state ownership, controlled inputs, and zero stale closures.
- [x] **Task 27.3**: Financial calculation & backend contract audit: validated mathematical equivalence between `billingSummary.js` and `server/server.js` (`POST /api/billing/invoice`), confirming server-authoritative enforcement for prices, HSN, and GST rates.
- [x] **Task 27.4**: Defect remediation in `src/shared/billingInvoices.js`: fixed unhandled `TypeError` in `formatRecentInvoiceRow` when invoice record is `null` and prevented `NaN` leakage in currency formatting via `Number.isFinite(...)` checks.
- [x] **Task 27.5**: Author targeted integration test suite in `src/shared/__tests__/billingIntegration.test.js` (4 tests asserting mixed GST rates, invoice save payload schema alignment, date-isolated KPI aggregation, and null-safe recent invoices view model).
- [x] **Task 27.6**: Live Chrome DevTools MCP browser verification across 9 required scenarios: empty bill guards, multi-GST product additions, stepper updates and removal, coupon lifecycle, manual discount recalculations, preview modal, mock finalization, failed coupon/invoice error recoveries, and console clean audit.
- [x] **Task 27.7**: Execute full quality gates: 213/213 frontend tests pass across 33 files, 201/201 backend tests pass across 22 suites, `node --check server/server.js` passes, isolated Vite build passes (8.57s, 0 errors, `dist/` untouched), clean `git diff --check`, and document Decision 2.27.

---

## Batch 28: Frontend–Backend Financial Parity Audit & 0% GST Clamping Remediation (Parity Audit & Server Authority)
- [x] **Task 28.1**: Inspect actual calculation paths in detail: `billingSummary.js`, `billingItems.js`, `Dashboard.jsx`, `BillSummaryCard.jsx`, `POST /api/billing/invoice` in `server/server.js`, coupon validation in `server/server.js` (`POST /api/coupons/validate`), and existing backend tests (`billing-invoice.test.mjs`).
- [x] **Task 28.2**: Establish deterministic 14-scenario parity test matrix comparing independent frontend and backend calculations across all standard slabs (0%, 5%, 12%, 18%, 28%), mixed rates, fractional prices/quantities, item/manual/coupon discounts, discounts at/above subtotal, round-off boundaries (.49, .50, .51), large wholesale orders, malformed inputs, and spoofing attempts.
- [x] **Task 28.3**: Special investigation of manual and coupon discounts: proved that client sends `discountAmount: totalDiscount` (in rupees), backend authoritatively verifies `0 <= discAmt <= subtotal`, discounts exceeding subtotal are strictly rejected with 400, and backend recalculates all taxes, round-off, and grand total ignoring client-supplied totals.
- [x] **Task 28.4**: Defect discovery & surgical remediation: identified and resolved critical 0% GST clobbering bug where `|| 18` logical OR converted valid `0%` rates into `18%` (9% CGST + 9% SGST) across `billingSummary.js`, `billingItems.js`, and `Dashboard.jsx`. Hardened subtotal and taxable subtotal floating-point rounding.
- [x] **Task 28.5**: Author permanent independent backend parity test suite in `server/tests/financial-parity.test.mjs` (14 comprehensive tests) and add 0% GST and float precision unit tests in `src/shared/__tests__/billingSummary.test.js`.
- [x] **Task 28.6**: Idempotency hardening for `server/tests/staff-store-isolation.test.mjs` ensuring resilient pre-cleanup of test staff phones and store codes.
- [x] **Task 28.7**: Execute complete quality gates: 213/213 frontend tests pass across 33 files, 215/215 backend tests pass across 23 test suites, `node --check server/server.js` passes, isolated Vite build passes (7.13s, 0 errors, `dist/` untouched), clean `git diff --check`, and document Decision 2.28.

---

## Batch 29: Stabilization Gate, Cumulative Regression Review & Refactoring Exit Decision (Stabilization & Exit Review)
- [x] **Task 29.1**: Inspect Git repository state: verified branch `main`, remote `rensog/main`, commit `737bf8c`, working tree integrity, and preserved user changes across all 28 batches.
- [x] **Task 29.2**: Cumulative repository integrity audit: verified consistency across `DECISIONS.md`, `REFACTORING_PROGRESS.md`, `REFACTORING_BACKLOG.md`, batch reports, component interfaces, and test suites.
- [x] **Task 29.3**: Re-verify critical 0% GST fix: audited `src/shared/billingSummary.js`, `src/shared/billingItems.js`, `src/pages/billing/Dashboard.jsx`, and backend invoice generation. Confirmed that valid 0% GST evaluates to ₹0.00 tax with zero clobbering to 18%.
- [x] **Task 29.4**: Codebase truthiness audit: verified financial calculation fields (rates, quantities, discounts, round-off) to guarantee no legitimate zero values are bypassed by logical OR `||` expressions.
- [x] **Task 29.5**: Security and business invariant review: verified multi-store isolation (SEC-01), support ticket internal notes privacy (PRV-01), order ownership authorization (VAL-01), server-side financial integrity, Razorpay HMAC payment integrity, and OTP rate limiting.
- [x] **Task 29.6**: Formulate Refactoring Exit Decision: confirmed **READY TO EXIT REFACTORING** based on passing tests (213 frontend, 215 backend), 0.00 financial variance, stable architecture, and zero regressions.
- [x] **Task 29.7**: Execute full quality gates: 213/213 frontend tests pass across 33 files, 215/215 backend tests pass across 23 suites, `node --check server/server.js` passes, clean `git diff --check`, isolated Vite production build passes (0 errors, `dist/` untouched).
- [x] **Task 29.8**: Author comprehensive reports and documentation: created `docs/refactoring/BATCH_29_STABILIZATION_EXIT_REPORT.md` and documented Decision 2.29.

---

## Deferred Items
- [x] **Leave Management**: **Deferred pending client confirmation.** (No implementation permitted).
