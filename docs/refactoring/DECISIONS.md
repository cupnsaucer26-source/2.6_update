# Sathyam Agro Mart — Architecture & Refactoring Decisions

**Last Updated**: October 28, 2026  

---

## 1. Scope Decisions

### Decision 1.1: Leave Management Deferral
- **Date**: October 28, 2026
- **Decision**: Leave Management is explicitly DEFERRED pending client confirmation.
- **Rationale**: Project governance and client confirmation requirements dictate that no leave-related data models, backend API routes, frontend views, or database migrations be implemented until approved.
- **Status**: Recorded in project status as `"Leave Management — Deferred; awaiting client confirmation."`

---

## 2. Technical & Architecture Decisions

### Decision 2.1: Formatting Standardization
- **Problem**: Currency and date formatting are duplicated inline across 35+ components with varying edge-case handling (e.g. missing values, null handling, different parameter styles).
- **Decision**: Introduce a centralized `src/utils/formatters.js` module exporting:
  - `formatCurrency(amount, { showSymbol = true } = {})`: Uses standard `en-IN` numbering (`₹X,XX,XXX`).
  - `formatDate(date, options)`: Formats dates with `en-IN` locale safely, returning fallback for invalid/null dates.
  - `formatShortDate(date)`: Formats as `DD Mon YYYY` (e.g. `12 Jan 2026`).
  - `formatDateTime(date)`: Formats as `DD Mon YYYY, hh:mm A`.
- **Impact**: Zero change to visual output; reduces code duplication; prevents NaN/invalid date crashes.

### Decision 2.2: Reusable Presentation Components in `src/components/common/`
- **Problem**: Modals, status badges, empty states, and table loading spinners are reimplemented independently across administrative dashboards.
- **Decision**: Create lightweight, focused presentation components without over-engineering:
  - `StatusBadge.jsx`: Standardizes background and text colors for Order, Payment, Ticket, and Staff statuses.
  - `EmptyState.jsx`: Standardizes empty list feedback with icon and optional action button.
  - `TableLoader.jsx`: Standardizes loading states for tables.
  - `Modal.jsx`: Encapsulates accessible backdrop and escape-key handling while preserving existing CSS styling.

### Decision 2.3: Backward-Compatible Backend Route Reorganization
- **Problem**: Admin routes for coupons, referrals, and staff profiles were scattered across `server/server.js` rather than inside `server/adminRoutes.js`.
- **Decision**: Reorganize routes under `server/adminRoutes.js` while maintaining exact endpoint URLs (`/api/admin/...`), HTTP methods, authorization middleware (`requireAuth`, `requireModule`), and response contracts.

### Decision 2.4: Mongoose Atomic Persistence
- **Problem**: In schemas configured with `strict: false`, `Object.assign(doc, data); await doc.save()` drops keys not declared in the top-level schema.
- **Decision**: Always use atomic Mongoose operations: `Model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).lean()`.

### Decision 2.5: Negative Currency Representation & Explicit IST Timezone
- **Problem**: `formatCurrency(-50)` produced `₹-50` due to prefix concatenation before formatted output. Furthermore, chart date labels in `Analytics.jsx` overflowed when displaying full years, and system dates rendered in local client timezones rather than standard Indian Standard Time.
- **Decision**: Update `src/utils/formatters.js`:
  - `formatCurrency`: Evaluate `Math.abs(num)` and prepend `-₹` when negative, returning `-₹50` cleanly.
  - `formatShortDate`: Use `{ day: 'numeric', month: 'short' }` (omitting year) for compact chart labels.
  - `formatDate` and `formatDateTime`: Enforce `timeZone: 'Asia/Kolkata'` by default so dates render consistently in IST across both server and client environments.

### Decision 2.6: Dual Identity Test Harness Configuration
- **Problem**: `otp-auth.test.mjs`, `otp-limits-off.test.mjs`, and `otp-resend.test.mjs` failed with 503 because `getTestPhones()` unconditionally appended `'9876543210'` to test phones even when `TEST_PHONE_NUMBERS: ''` was specified in the test harness. This triggered direct login bypass which called unstubbed session methods requiring MongoDB connection.
- **Decision**: Respect explicit `process.env.TEST_PHONE_NUMBERS !== undefined` in `server/server.js`, and align `otp-auth.test.mjs` stubs and assertions with the verified dual-identity architecture (where staff phone verification routes to farmer signup without leaking staff credentials).

### Decision 2.7: Product Catalog Modal Component Decomposition & Table Standardization
- **Problem**: `src/pages/admin/Products.jsx` exceeded 1,500 lines, with massive monolithic sections inside the modal dialog making it difficult to maintain and prone to regressions. Furthermore, the catalog table used raw, unstyled loading table rows and lacked proper zero-result empty state feedback.
- **Decision**: Decompose the product modal into focused sub-components in `src/pages/admin/products/`:
  - `MediaSection.jsx`: Multi-image file upload, preview gallery thumbnails, and description textarea.
  - `VisibilitySection.jsx`: User personalization selector and sales channel availability (Web & POS, Online Only, Offline Only).
  - `VideosSection.jsx`: Attached videos list, media library selector, and custom video addition.
  - `AdvancedSection.jsx`: Active ingredients, dosage, usage guidelines, related blog articles, and reviews toggle.
  - Standardize table loading with `<TableLoader colSpan={9} />` and empty state with `<EmptyState icon={<Package size={28} />} />`.
  - Format catalog prices with `formatCurrency()`.
- **Impact**: Reduced `Products.jsx` complexity by over 320 lines; enhanced maintainability; zero changes to API contracts, database schemas, or visual styles.

### Decision 2.8: Billing POS Dashboard Component Decomposition & Standards Integration
- **Problem**: `src/pages/billing/Dashboard.jsx` was 1,258 lines long, containing deeply nested markup for document meta details, buyer/consignee fields, transport logistics, and inline empty/loading blocks in tables.
- **Decision**: Decompose into modular components in `src/pages/billing/components/`:
  - `DocumentMetaCard.jsx`: Document type toggle, invoice numbering, dates, acknowledgment numbers, and IRN.
  - `BuyerConsigneeCard.jsx`: Buyer billing info, same-as-buyer shipping toggle, and consignee ship-to inputs.
  - `TransportDetailsCard.jsx`: Collapsible vehicle details, logistics providers, LR numbers, and delivery terms.
  - Standardize line items table empty state using `<EmptyState icon={<ReceiptText size={32} />} />`.
  - Standardize invoice history table loading using `<TableLoader colSpan={7} />` and empty state using `<EmptyState />`.
  - Standardize all currency amounts (rate, line amounts, total GST, grand total, and coupon discounts) with `formatCurrency()`.
  - Standardize invoice dates with `formatShortDate()`.
- **Impact**: Reduced `Dashboard.jsx` complexity by over 330 lines, unified presentation with the rest of the application, and preserved exact state contracts, POS calculations, and store scoping.

### Decision 2.9: Admin Users & Credentials Master Modularization & Presentation Standardization
- **Problem**: `src/pages/admin/Users.jsx` was 775 lines long and contained monolithic inline overlays for creating user credentials and editing user records / inspecting farmer profiles. It also used raw table text cells for loading and zero-match states, manual date strings without timezone safety, and inline role badge markup.
- **Decision**: Decompose the page into modular subcomponents under `src/pages/admin/users/`:
  - `UserFilters.jsx`: Search input form, role filter select dropdown, sort order select, and live refresh button.
  - `CreateUserModal.jsx`: New user credentials form, strong password generation, password rules checklist, error display, role-specific farmer crop/land inputs or staff department field, and form submission.
  - `EditUserModal.jsx`: User credentials update form, customer profile summary inspection for farmers (view-only), password reset field with validation rules, account status dropdown, and form submission.
  - Preserved CSS classes (`modal-backdrop admin-user-modal`, `data-view-only`, `modal-content`) to maintain complete fidelity with `src/index.css` rules for light/dark input contrast and view-only interactions.
  - Standardized the database records table with `<TableLoader colSpan={9} />` and `<EmptyState icon={<UsersIcon size={32} />} />`.
  - Standardized role and status badges using `<StatusBadge />`.
  - Standardized user creation date rendering using `formatDate(u.createdAt)`.
- **Impact**: Reduced `Users.jsx` line count from 775 to 500 lines (a 35% reduction in root page complexity while preserving 100% of business logic, validations, and security contracts). Zero regressions across all 201 tests and Vite production build.

### Decision 2.10: Omnichannel Analytics Orders Table Decomposition & Formatting Standardization
- **Problem**: `src/pages/admin/Analytics.jsx` mixed high-level sales KPI calculations, trend bar charts, and donut metrics with a full transaction log table. The orders table included inline search filtering, raw unlocalized date strings, raw empty table cells, and hardcoded inline badge styles.
- **Decision**:
  - Decompose the actual transactions table into `src/pages/admin/analytics/AnalyticsOrdersTable.jsx`.
  - Isolate search input state and filter calculations inside the table subcomponent, preventing expensive array filters from re-running on every chart mode render.
  - Standardize empty table view using `<EmptyState icon={<FileSpreadsheet size={32} />} />`.
  - Standardize payment and fulfillment status tags with design system `<StatusBadge />`.
  - Standardize date-time formatting using `formatDateTime(o.date, ...)` with explicit `Asia/Kolkata` IST timezone formatting and options support.
  - Update `server/tests/formatters.test.mjs` with comprehensive `formatDateTime` unit test assertions.
- **Impact**: Reduced `Analytics.jsx` complexity from 556 to 433 lines (-123 lines, 22% reduction) while preserving all KPI aggregations, channel breakdown, store isolation, and export contracts. Zero regressions across all 201 tests and production build.

### Decision 2.11: Support Tickets Subcomponent Modularization & Multi-Portal Domain Isolation
- **Problem**: Support ticketing is accessed across three separate user portals representing distinct actors and security boundaries:
  1. `src/pages/admin/SupportTickets.jsx` (Store Admin): scoped to own store tickets, reassigning to store staff, posting replies or private internal notes.
  2. `src/pages/superadmin/SupportTicketSystem.jsx` (Super Admin): company-wide surveillance, cross-store assignment, store delegation, triage, and internal notes.
  3. `src/pages/SupportTicketsCustomer.jsx` (Customer): order-linked issue creation, thread replies (reopening tickets), satisfaction confirmation & closing, with server-side privacy scrubbing of staff notes (`PRV-01`).
  Despite distinct actor permissions and workflows, all three pages duplicated:
  - Identical customer attachment preview markup (~20 lines each with thumbnail, filename, and full-image external link).
  - Status and priority chip class logic and icon mappings (`p2-chip`, `p2-chip--green`, `p2-chip--blue`, `p2-chip--amber`, `p2-chip--red`).
  - Discussion thread message stream structures (farmer vs staff message alignment, system notices, private staff note tags, and image attachments).
  - Previous audits also misidentified the paths of `SupportTicketSystem.jsx` and `SupportTicketsCustomer.jsx`.
- **Decision**:
  - Preserve strict role boundaries, routing, and access control: do NOT merge the separate customer, store admin, and super admin pages into a monolithic view.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero models or routes exist in the codebase).
  - Extract reusable, bounded subcomponents into `src/components/tickets/`:
    - `TicketStatusBadge.jsx`: Unified status & priority chip component supporting `.p2-chip` variants, icons (`showIcon`), and semantic colors. Exports `getTicketStatusChipClass` and `getTicketPriorityChipClass` for backwards compatibility.
    - `TicketAttachmentPreview.jsx`: Reusable attachment inspection block with thumbnail, filename label, and secure `_blank` full-size link.
    - `TicketMessageThread.jsx`: Reusable discussion thread component supporting `mode="staff" | "customer"`, `showRole`, system events, staff vs customer message alignment, internal notes privacy styling, and reply attachments.
  - Refactor `SupportTickets.jsx`, `SupportTicketSystem.jsx`, `SupportTicketsCustomer.jsx`, and `Tickets.jsx` to adopt these shared components.
- **Impact**:
  - Completely eliminated ~150 lines of duplicate UI markup across customer and staff ticketing pages.
  - Cleaned up unused imports (e.g. `ExternalLink`).
  - Preserved 100% of functional workflows, store isolation rules (`SEC-01`), internal note privacy scrubbing (`PRV-01`), order ownership validation (`VAL-01`), and ticket lifecycle rules (`FLW-01`).
  - 201/201 tests passing; production build verified with 0 errors.

### Decision 2.13: Admin Enquiries & Referrals UI Standardization
- **Problem**:
  - `src/pages/admin/Enquiries.jsx` (512 lines) and `src/pages/admin/Referrals.jsx` (506 lines) managed customer-facing administrative operations but relied on legacy, unstandardized presentation patterns:
    1. Both pages used unmanaged `.modal-overlay` divs (`zIndex: 999`) lacking keyboard Escape listener, click-outside handling, and ARIA dialog semantics (`aria-modal="true"`).
    2. Both pages used inline `new Date(...).toLocaleString('en-IN', ...)` and `new Date(...).toLocaleDateString('en-IN', ...)`, introducing timezone ambiguity and bypasses of the centralized `src/utils/formatters.js`.
    3. `Enquiries.jsx` and `Referrals.jsx` (across 3 table views: referrals, points balances, and points ledger) implemented raw `<tr><td colSpan="...">` loading text and empty messages rather than using `<TableLoader />` and `<EmptyState />`.
    4. `Referrals.jsx` used custom inline badge CSS classes (`badge-yellow`, `badge-green`, `badge-gray`, `badge-red`) instead of `<StatusBadge />`, and lacked color mappings in `StatusBadge.jsx` for `expired`, `rejected`, and `reversed`.
- **Decision**:
  - Enhanced `src/components/common/StatusBadge.jsx` `STATUS_COLOR_MAP` with `expired: 'gray'`, `rejected: 'red'`, and `reversed: 'red'`.
  - Refactored `src/pages/admin/Enquiries.jsx`:
    - Replaced custom modal overlay with `<Modal isOpen={!!selectedEnquiry} onClose={() => setSelectedEnquiry(null)} title="📝 Farmer Enquiry Details" maxWidth="560px">`.
    - Preserved interactive inline `<select>` inside the table cell allowing admins to change status directly without opening the modal.
    - Standardized date formatting with `formatDateTime(e.createdAt)` in both the table row and the CSV export (`exportToCsv`).
    - Standardized table loading state with `<TableLoader colSpan={9} message="Loading farmer enquiries..." />` and zero-records state with `<EmptyState icon={<MessageSquare size={32} />} ... />`.
  - Refactored `src/pages/admin/Referrals.jsx`:
    - Standardized Tab 1 Referral Network table: integrated `<StatusBadge status={r.status} label={...} title={r.note} />`, `formatDate(r.createdAt)`, `<TableLoader colSpan={9} ... />`, and `<EmptyState icon={<Gift size={32} />} ... />`.
    - Standardized Tab 2 Customer Points table: integrated `<TableLoader colSpan={6} ... />` and `<EmptyState icon={<Users size={32} />} ... />`.
    - Standardized Tab 3 Points Audit Log table: integrated `formatDateTime(l.createdAt)`, `<TableLoader colSpan={5} ... />`, and `<EmptyState icon={<FileSpreadsheet size={32} />} ... />`.
    - Replaced custom points adjustment overlay with `<Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="🌟 Assign / Adjust Reward Points" maxWidth="480px">`.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Eliminated ~120 lines of duplicate modal scaffolding and raw table fallback markup.
  - Full keyboard accessibility (ESC key dismissal) and focus containment in both admin workflows.
  - Zero behavioral regressions: 22/22 referrals tests pass, 201/201 full test suite passes, and Vite production build succeeds with 0 errors in 9.43s.

### Decision 2.14: Admin Employees, Categories & Subscribers UI Standardization
- **Problem**:
  - `src/pages/admin/Employees.jsx` and `src/pages/admin/Subscribers.jsx` contained inconsistent loading spinners, raw empty text fallbacks, ad-hoc inline date formatters (`new Date().toLocaleDateString('en-IN')`), and unmanaged status badge classes.
  - The Batch 14 target list also cited `src/pages/admin/Categories.jsx`, which was found not to exist as an administrative page; `src/pages/Categories.jsx` is the public customer storefront scroll-spy catalogue browsing experience, while category option administration is embedded in `src/pages/admin/Products.jsx` and server option deletion guards (`/api/admin/catalog-options/:type/:value`).
- **Decision**:
  - Audited all three candidate paths:
    1. `src/pages/admin/Employees.jsx`: Standardized loading state with `<TableLoader message="Loading staff profiles..." size={28} />`, standardized empty filter results with `<EmptyState icon={<Search size={32} />} title="No employees found" ... />`, standardized employee status with `<StatusBadge status={emp.status || 'active'} />`, and standardized profile updated timestamp with `formatDateTime(p.updatedAt)`. Preserved split-panel layout, employee store assignments, and agronomy expert toggle workflows.
    2. `src/pages/admin/Subscribers.jsx`: Standardized subscriber table loading with `<TableLoader colSpan={9} message="Loading advisory subscribers..." />`, standardized zero-match state with `<EmptyState icon={<Mail size={32} />} title="No subscribers found" ... />`, eliminated inline `formatDate` helper in favor of `formatDate` and `formatDateTime` from `src/utils/formatters.js`, standardized broadcast history timestamps, and added `Escape` key dismissal to `BroadcastComposer`. Preserved interactive subscriber status toggle button, broadcast execution loop, and batch cancellation protections.
    3. `src/pages/admin/Categories.jsx`: Confirmed non-existence of admin page at this path. Preserved `src/pages/Categories.jsx` as the customer storefront experience without altering shopper navigation or catalog synchronization.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Unified data loading, empty states, and date formatting across employee management and advisory broadcast administration.
  - 201/201 tests passing; production build verified with 0 errors in 11.56s.

### Decision 2.15: Agronomy Bookings & Soil Reports UI Standardization
- **Problem**:
  - `src/pages/admin/AgronomyBookings.jsx` and `src/pages/admin/SoilReports.jsx` used inconsistent raw loading text (`<p className="p2-loading">Loading agronomy bookings…</p>` and `<div className="p2-loading">Loading…</div>`) and unstandardized empty state divs.
  - `AgronomyBookings.jsx` contained an ad-hoc inline date formatter (`new Date(b.completedAt).toLocaleDateString('en-IN')`) instead of the centralized `formatDate` utility.
  - Both pages utilize Phase 2 responsive card and split-queue layouts (`p2-booking`, `p2-queue`, `p2-thread`) with inline forms for callbacks and remedy prescriptions rather than intrusive modal overlays.
- **Decision**:
  - Standardized `src/pages/admin/AgronomyBookings.jsx`:
    - Replaced raw loading paragraph with `<TableLoader message="Loading agronomy bookings…" size={24} />`.
    - Replaced raw empty state div with `<EmptyState icon={<Calendar size={32} />} title="No bookings found" description="No bookings match the selected filters." />`.
    - Standardized completed callback date display using `formatDate(b.completedAt)` (enforcing `Asia/Kolkata` IST timezone formatting and standard fallback).
    - Preserved inline reschedule card and callback completion form to ensure frictionless staff workflows on mobile and tablet.
    - Preserved multi-store isolation (`SEC-01`), expert conflict validation, and slot scheduling logic intact.
  - Standardized `src/pages/admin/SoilReports.jsx`:
    - Replaced raw queue loading div with `<TableLoader message="Loading soil reports…" size={24} />`.
    - Replaced raw queue empty state div with `<EmptyState icon={<FlaskConical size={32} />} title="No soil reports found" description="No soil test submissions match search or filter." />`.
    - Preserved master-detail split layout (`p2-queue` / `p2-thread`), soil nutrient metrics, target crop advisory, and prescription issuing workflow intact.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Unified loading and empty state representations with the rest of the administrative portal.
  - Preserved ergonomic inline workflows without modal disruption.
  - 100% regression suite pass rate (201/201 tests passing across all 22 test files); production build verified with 0 errors in 10.74s.

### Decision 2.16: Blog Content Management Audit & Safe UI Standardization
- **Problem**:
  - `src/pages/admin/Blogs.jsx` used raw loading text (`<div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading blogs...</div>`), raw empty state card with hardcoded emojis, and unstandardized inline date formatting (`new Date(blog.createdAt).toLocaleDateString(...)`).
  - The blog creation and editing modal lacked backdrop dismissal and keyboard `Escape` dismissal, while action buttons and publish status toggles lacked accessibility attributes (`type="button"`, `title`, `aria-label`).
  - Replacing the large 820px modal with shared `Modal.jsx` would break the dedicated 760px responsive CSS rules (`.blog-modal*` in `src/index.css:1644-1692`) and risk accidental draft loss if clicked outside without an unsaved changes confirmation.
- **Decision**:
  - Refactored `src/pages/admin/Blogs.jsx`:
    - Standardized table loading state with `<TableLoader message="Loading blogs..." size={28} />`.
    - Standardized empty state with `<EmptyState icon={<BookOpen size={36} />} title={search ? 'No articles found' : 'No Blog Articles Yet'} ... />`, intelligently adapting description for zero search results vs no published articles and preserving the "Write First Blog" action button.
    - Standardized article creation date with centralized `formatDate(blog.createdAt)` (enforcing `Asia/Kolkata` IST timezone formatting and standard fallback).
    - Preserved the interactive publish/draft status toggle button (`handleTogglePublish(blog)`), enhancing it with `type="button"`, `title`, and `aria-label` rather than replacing it with a static badge.
    - Added accessible dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="blog-modal-title"`), keyboard `Escape` listener, and backdrop click handler, all guarded by an unsaved changes confirmation (`isDirty`) to prevent accidental draft loss.
    - Preserved 100% of blog fields, categories, markdown editor toolbar, image uploads, tagged products, tagged videos, and backend contracts.
  - Performed comprehensive Subscribers regression audit:
    - Confirmed `src/pages/admin/Subscribers.jsx` is 100% intact, robust, and free of regressions (interactive toggle, WhatsApp broadcast throttling, batch cancellation, and Escape key safeguards all verified).
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Standardized visual presentation with zero disruption to rich markdown editing or responsive mobile styles.
  - 100% test pass rate (201/201 tests passing across all 22 test suites); production build verified with 0 errors in 8.33s.

### Decision 2.17: ShopAnalytics XLSX Lazy Loading & Safe Performance Optimization
- **Problem**:
  - `src/pages/superadmin/ShopAnalytics.jsx` included a static top-level import `import * as XLSX from 'xlsx'`.
  - Because `xlsx` is a massive ~430 kB parsing/serialization library, it bloated the initial JavaScript bundle of the ShopAnalytics route to 303.53 kB (gzip: 100.59 kB), penalizing first-load performance and mobile responsiveness for administrative users who only view metrics or filter tables without exporting.
- **Decision**:
  - Removed top-level static `import * as XLSX from 'xlsx'`.
  - Implemented a resilient, cached asynchronous loader `loadXlsx()`:
    ```javascript
    let xlsxModulePromise = null
    async function loadXlsx() {
      if (!xlsxModulePromise) {
        xlsxModulePromise = import('xlsx')
          .then(mod => (mod.utils ? mod : (mod.default || mod)))
          .catch(err => {
            xlsxModulePromise = null
            throw err
          })
      }
      return xlsxModulePromise
    }
    ```
  - Converted `exportFullExcelReport` and `exportInvoicesExcel` into `async` functions that invoke `const XLSX = await loadXlsx()` on demand.
  - Added discrete export loading guards: preserved `exporting` and added `exportingInvoices` state to prevent duplicate parallel export triggers.
  - Added responsive UI feedback: spin animations (`sa-spin`), loading button copy ("Generating Excel...", "Exporting..."), and `disabled` states while exports are running.
  - Handled network/import rejections gracefully with user-facing alerts and promise reset to allow retry.
  - Preserved 100% of export schemas, filenames (`SathyamBio_Shops_Analytics_${timestamp}.xlsx`, `SathyamBio_Invoices_${timestamp}.xlsx`), worksheets (`Executive Overview`, `Store Performance`, `All Invoices (SAM)`, `Top Products Sold`, `Invoices Ledger`), columns, and financial calculations.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Initial `ShopAnalytics` bundle size plummeted from 303.53 kB to 20.91 kB (gzip: 5.83 kB)—a **93.1% reduction** in initial bundle footprint.
  - The `xlsx` library is isolated into an on-demand chunk (`xlsx-*.js`, 429.31 kB / gzip: 143.03 kB) fetched solely upon user click.
  - 100% regression suite pass rate (201/201 tests passing across all 22 test suites); production build verified with 0 errors in 9.13s.

### Decision 2.18: Repository Build Output Isolation & Absolute Prohibition of Destructive Git Cleanups
- **Problem**:
  - The repository has historically tracked `dist/` in Git at baseline commit `737bf8c`.
  - When `npm run build` is executed during verification gates, Vite compiles frontend assets into `dist/assets/`, modifying tracked files and creating newly hashed untracked assets.
  - In Batch 17 and earlier batches, agents ran `git checkout -- dist; git clean -fd dist` to discard these build outputs and reset git status. This conflicted directly with project safety policies prohibiting destructive git commands (`git checkout`, `git restore`, `git reset`, `git clean`, `git stash`).
- **Decision**:
  - Strictly enforce absolute prohibition of `git checkout`, `git restore`, `git reset`, `git clean`, `git stash`, `git switch`, `git commit`, and `git push`.
  - For all future Vite production build verification gates, isolate build outputs completely outside the repository working tree using `vite build --outDir <external-dir> --emptyOutDir` directed to the scratch workspace (`<appDataDir>\brain\<conversation-id>\scratch\build-verify`).
  - This guarantees 100% build verification fidelity and module transformation auditing without modifying tracked files in `dist/`, generating untracked files in git, or executing any destructive cleanup commands.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Eliminates all risk of accidental data loss or working tree reset during build verification.
  - Leaves `dist/` cleanly untouched at baseline commit `737bf8c`.
  - Verified with 201/201 passing tests and isolated Vite build (1,810 modules transformed, 0 errors in 18.41s).

### Decision 2.19: Critical Frontend Regression Testing & Zero-Dependency Native Test Architecture
- **Problem**:
  - Prior refactoring batches focused heavily on backend security, multi-store boundaries, and frontend component modularization.
  - While backend regression testing was robust (201 tests across 22 suites), critical browser-side workflows (ShopAnalytics lazy XLSX export, farmer cart/checkout rules, and delivery OTP handoffs) lacked automated unit and integration tests.
  - Attempting to install heavyweight external test runners (e.g., Jest, Vitest, Playwright) risked breaking repository dependencies, altering `package.json`, or violating the principle of minimal disruption.
- **Decision**:
  - Inspected existing frontend test infrastructure and discovered a mature native test harness in `src/shared/__tests__/*.test.js` leveraging Node.js built-in `node:test` and `node:assert/strict`.
  - Authored 27 new deterministic, isolated regression tests without adding any dependencies:
    1. **ShopAnalytics Excel Export** (`src/shared/__tests__/shopAnalyticsExport.test.js` - 8 tests): Verifies on-demand XLSX dynamic import loading, caching, error recovery on network failure, concurrent double-click rejection for both export buttons, loading-state disabling, multi-sheet workbook generation (Executive Overview, Store Performance, All Invoices, Top Products), and invoice ledger schema fidelity.
    2. **Farmer Cart & Checkout Invariants** (`src/shared/__tests__/farmerCartCheckout.test.js` - 13 tests): Verifies cart normalization, quantity handling, guest-to-account basket merging, catalog price/GST recalculation, client order line isolation (never transmitting prices), subtotal/GST/CGST/SGST calculations, discount capping, delivery detail validation (10-digit Indian mobile, 6-digit PIN), saved address extraction, submit debouncing, and graceful Razorpay script failure handling.
    3. **Delivery OTP Handoff Workflow** (`src/shared/__tests__/deliveryOtpHandoff.test.js` - 6 tests): Verifies order card schema normalization, client-side empty/whitespace OTP validation, successful 4-digit OTP verification and status transition, invalid OTP error handling, concurrent submission debouncing, and security invariant preventing non-admin delivery staff from bypassing OTP via generic status update.
  - Maintained zero production code modifications in Batch 19.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Total frontend test suite expanded from 152 to **179 passing tests** across 27 test files, executing in ~1.15 seconds with zero external dependencies.
  - Backend regression suite preserved at **201 passing tests** across all 22 suites.
  - Zero modifications to production source code or dependencies; `dist/` remains completely clean.

### Decision 2.20: Browser E2E Verification Architecture & Zero-Dependency DevTools Harness
- **Problem**:
  - Despite comprehensive Node.js unit and integration regression coverage (201 backend tests + 179 frontend tests), real browser behavior—including DOM event handling, Vite module hydration, CSS layout rendering, blob URL creation for XLSX file downloads, and client-side form state transitions—remained unverified in a live browser engine.
  - Installing heavy end-to-end frameworks (e.g., Playwright, Cypress, Selenium) would introduce massive dependency weight, require browser binary downloads, alter `package.json`, and increase repository maintenance overhead.
  - Connecting directly to the live backend daemon or production database during browser testing would risk accidental database mutations, unwanted WhatsApp dispatches, or live payment triggers.
- **Decision**:
  - Audited the local environment and identified an active, pre-configured `chrome-devtools-mcp` integration running against the locally installed Google Chrome browser binary (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
  - Architected a completely isolated, zero-dependency browser testing harness in the external scratch directory:
    1. **Isolated Mock API Server** (`scratch/test-mock-server.mjs` on port 5099): Implemented using native `node:http`. Serves deterministic, strictly controlled JSON fixtures for SuperAdmin, Delivery, and Farmer identities, catalog products, addresses, and OTP verification without connecting to MongoDB or external APIs.
    2. **Isolated Vite Dev Configuration** (`scratch/vite.test.config.js` on port 3100): Serves the React frontend directly from memory, proxying `/api` to the mock server on port 5099. Guarantees tracked files in `dist/`, `package.json`, and `vite.config.js` are never modified.
    3. **Automated DevTools MCP Interaction**: Utilized `chrome-devtools-mcp` (`navigate_page`, `take_snapshot`, `click`, `fill`, `evaluate_script`, `list_console_messages`, `list_network_requests`, `take_screenshot`) to drive real Google Chrome sessions through three critical workflows:
       - **ShopAnalytics** (`/superadmin/analytics`): Verified SuperAdmin session hydration, metric card rendering, stores breakdown, dynamic XLSX chunk fetching, and real browser file downloads for both `SathyamBio_Shops_Analytics_2026-10-28.xlsx` and `SathyamBio_Invoices_2026-10-28.xlsx`.
       - **Farmer Cart & Checkout** (`/`): Verified product card rendering, pack chips, Add to Cart interaction, `#basket` drawer opening, stepper quantity increments, subtotal/tax recalculation, `#checkout-address` required field validation errors, valid field entry, `#checkout-payment` transition, and payment failure recovery.
       - **Delivery OTP Handoff** (`/delivery`): Verified delivery agent dashboard loading, assigned order cards, empty OTP client rejection, invalid OTP ("9999") refusal (card remains "Out for Delivery"), and valid OTP ("1234") transition to "Delivered" with dynamic KPI counter updates.
  - Zero production code was modified in Batch 20.
  - Leave Management remains explicitly DEFERRED pending client confirmation (zero code or models created).
- **Impact**:
  - Proved conclusively that all critical user workflows function correctly in a real browser engine.
  - Avoided adding any new npm dependencies to `package.json`.
  - Preserved 100% of production invariants (SEC-01, PRV-01, VAL-01, server pricing, OTP verification).
  - Maintained 100% pass rate on all quality gates (179 frontend tests, 201 backend tests, isolated Vite build).


### Decision 2.21: Safe Billing POS Modularization — Phase 1 (`RecentInvoicesCard` Extraction)
- **Problem**:
  - `src/pages/billing/Dashboard.jsx` was an oversized monolithic component (~977 lines) containing document metadata, buyer & consignee addresses, transport details, item search & selection, live bill calculations & table, payment mode selection, checkout summary, and recent invoice history table.
  - The recent invoices history table was embedded directly in the main billing dashboard view, coupling historical invoice viewing/reprinting to the POS bill generation lifecycle.
  - Furthermore, `Dashboard.jsx` directly imported `TableLoader`, `formatShortDate`, `Clock`, and `RefreshCw`, cluttering the top-level billing container.
- **Decision**:
  - Safely extracted exactly ONE self-contained UI component: `RecentInvoicesCard` (`src/pages/billing/components/RecentInvoicesCard.jsx`).
  - Extracted shared presentation/normalization logic into `src/shared/billingInvoices.js` (`getPaymentBadgeClass`, `formatRecentInvoiceRow`, `prepareRecentInvoices`).
  - Refactored `Dashboard.jsx` to render `<RecentInvoicesCard>` with explicit, clean props (`invoiceHistory`, `historyLoading`, `onRefresh`, `onViewInvoice`).
  - Removed unused imports (`Clock`, `RefreshCw`, `TableLoader`, `formatShortDate`) from `Dashboard.jsx`.
  - Added targeted unit & regression tests in `src/shared/__tests__/billingRecentInvoices.test.js` (5 tests covering badge mapping, row normalization, robust fallbacks for missing/partial fields, slicing to limits, and action dispatch callbacks).
  - Maintained strict scope boundaries: Backend monolith split deferred, Leave Management deferred pending client confirmation, zero commits or pushes, zero destructive Git commands, zero modifications to tracked `dist/`.
- **Impact**:
  - Reduced `Dashboard.jsx` from 977 lines to 904 lines (net reduction of 73 lines of inline JSX and unused imports).
  - Expanded frontend test suite from 179 to 184 tests (100% passing across 28 test files in ~1.5s).
  - Backend tests preserved at 201/201 passing.
  - Isolated Vite production build succeeds with zero errors (9.70s).
  - Tracked `dist/` remains completely clean.


### Decision 2.22: Billing POS Modularization — Phase 2 (`BillItemsCard` Extraction)
- **Problem**:
  - In `src/pages/billing/Dashboard.jsx` (904 lines), Section 5 contained a monolithic inline table rendering active bill items, item metadata, HSN badges, unit rates, quantity increment/decrement controls, GST percentages, formatted line totals, delete trash buttons, and empty bill states.
  - The parent component retained direct imports for `Trash2` and `EmptyState` solely for this card.
- **Decision**:
  - Extracted the active bill items table into a focused presentational component: `BillItemsCard` (`src/pages/billing/components/BillItemsCard.jsx`).
  - Extracted pure item formatting, validation, and calculation helper functions into `src/shared/billingItems.js` (`formatItemRate`, `canDecrementQty`, `calculateItemAmount`, `normalizeBillItem`).
  - Refactored `Dashboard.jsx` to render `<BillItemsCard>` passing down explicit props and callbacks (`items`, `updateItemQty`, `removeItem`, `clearCurrentBill`), leaving state ownership (`items`, `setItems`) strictly with the parent container.
  - Removed unused imports (`Trash2`, `EmptyState`) from `Dashboard.jsx`.
  - Added 5 new deterministic unit and regression tests in `src/shared/__tests__/billItemsCard.test.js` verifying rate formatting, decrement guardrails (minimum qty of 1), line amount calculation with discount boundaries, item normalization fallbacks, and action dispatch contracts.
  - Maintained strict scope boundaries: Backend monolith split deferred, Leave Management deferred pending client confirmation, zero commits or pushes, zero destructive Git commands, zero modifications to tracked `dist/`.
- **Impact**:
  - Reduced `Dashboard.jsx` from 904 lines to 823 lines (net reduction of 81 lines of inline JSX, table markup, and unused imports).
  - Expanded frontend test suite from 184 to 189 passing tests across 29 test files.
  - Backend tests preserved at 201/201 passing across all 22 test suites.
  - Isolated Vite production build succeeds with zero errors (1,814 modules transformed).
  - Tracked `dist/` remains completely clean.


### Decision 2.23: Billing POS Browser Regression Verification (Empirical Browser Audit & TableLoader Fix)
- **Problem**:
  - Following the modular extraction of `RecentInvoicesCard` (Batch 21) and `BillItemsCard` (Batch 22), the integration between the extracted components, parent state, and real browser DOM had only been verified in headless Node.js tests.
  - Browser-specific behavior (DOM rendering, event dispatching, quantity bound checks, modal overlay mounting, mobile responsiveness, and console warnings) required empirical verification in a real Chromium session.
- **Decision**:
  - Configured zero-dependency isolated browser verification environment with mock server daemon on port 5099 and isolated Vite dev server on port 3100.
  - Executed automated browser scenarios via Chrome DevTools MCP: empty bill state, single item add, stepper increment (+), stepper decrement (-), lower bound protection (preventing decrement below 1), multi-item add, line item deletion, "Clear Bill" action, invoice history rendering, refresh re-fetch, and `ExactGstInvoice` modal preview and dismissal.
  - Identified and surgically fixed a React DOM nesting warning in `RecentInvoicesCard.jsx` where `colSpan={7}` was erroneously passed to `TableLoader` inside a `<div>` wrapper.
- **Impact**:
  - Eliminated the `validateDOMNesting` console warning completely upon page reload.
  - Confirmed 100% financial and mathematical accuracy across all line items, mixed GST rates (18% and 12%), round-offs, and grand totals in the live DOM.
  - Preserved 100% of quality gates: 189/189 frontend tests passing, 201/201 backend tests passing, `node --check` passing, and isolated Vite production build passing with zero errors.
  - Tracked `dist/` remains completely clean; zero commits or pushes performed.


### Decision 2.24: Billing Dashboard Architecture Audit & Safe Modularization — Phase 3 (`BillingStatsCard` Extraction)
- **Problem**:
  - Following the extraction of `RecentInvoicesCard` (Batch 21) and `BillItemsCard` (Batch 22), `src/pages/billing/Dashboard.jsx` remained at 823 lines.
  - A comprehensive architectural audit confirmed that all 7 previously documented card components (`AddItemCard`, `BillItemsCard`, `BuyerConsigneeCard`, `DocumentMetaCard`, `PaymentModeCard`, `RecentInvoicesCard`, `TransportDetailsCard`) were already successfully extracted and rendered in the parent container.
  - The remaining inline regions comprised the Page Header (actions invoking invoice generation), the KPI Stats Grid (today's counter cards), and the Bill Summary Card (containing active coupon validation, discounts, proportional GST tax distribution, round-off, and invoice finalization).
  - Tightly coupled financial calculation and finalization logic must not be modified or extracted prematurely without targeted calculation test harnesses.
- **Decision**:
  - Disqualified the Bill Summary Card and Page Header from extraction in Batch 24, strictly honoring the safety directive.
  - Extracted the pure presentation KPI stats grid into `BillingStatsCard` (`src/pages/billing/components/BillingStatsCard.jsx`).
  - Added pure shared helpers to `src/shared/billingInvoices.js`:
    - `formatBillingStats(todayStats)`: formats numeric counters into localized Indian currency and count strings with resilient zero-fallbacks for missing/malformed records.
    - `computeTodayStats(invoices, referenceDate)`: pure aggregation function that filters invoices by target date and calculates sums.
  - Refactored `Dashboard.jsx` to render `<BillingStatsCard todayStats={todayStats} />` and use `computeTodayStats()`.
  - Added 5 new deterministic unit tests in `src/shared/__tests__/billingStatsCard.test.js` validating currency formatting, boundary edge cases, date-isolated aggregation, and component contracts.
  - Verified live in Google Chrome using Chrome DevTools MCP on `http://127.0.0.1:3100/billing`, confirming exact `.stat-grid` card styling, formatted figures (`₹4,130`, `3`, `₹630`), and 0 console errors.
- **Impact**:
  - Reduced `Dashboard.jsx` from 823 to 800 lines (-23 lines).
  - Expanded frontend test suite from 189 to 194 passing tests across 30 test files (100% pass rate).
  - Backend regression suite preserved at 201/201 passing across 22 test suites.
  - Isolated Vite production build succeeds with 0 errors in 9.38s.
  - Maintained 100% invariant preservation; zero commits or pushes; Leave Management deferred.


### Decision 2.25: Billing Summary Financial Logic — Safe Pure Extraction & Regression Tests
- **Problem**:
  - `src/pages/billing/Dashboard.jsx` executed 25 lines of inline financial calculations on every render: item subtotal summation, manual discount percentage clamping and rounding, coupon discount aggregation, taxable subtotal flooring, proportional GST attribution per item, CGST/SGST 50-50 splitting and 2-decimal rounding, raw grand total summation, integer rupee round-off, and Indian currency words conversion.
  - These calculations were executed directly within the component body without automated frontend unit test coverage or modular separation, making any future extraction of the Bill Summary Card risky.
- **Decision**:
  - Audited existing financial calculations in `Dashboard.jsx` and verified their exact correspondence with server-side validation contracts in `server/server.js` (`POST /api/billing/invoice`) and `server/tests/billing-invoice.test.mjs`.
  - Extracted pure financial calculation helpers into `src/shared/billingSummary.js`:
    - `calculateItemsSubtotal(items)`: unrounded sum of line item amounts with safe fallbacks.
    - `calculateManualDiscount(itemsSubtotal, globalDiscountPercent)`: computes percentage discount with `Math.round()` and 0–100 clamping.
    - `calculateTaxableSubtotal(itemsSubtotal, totalDiscount)`: computes non-negative taxable amount (`Math.max(0, subtotal - discount)`).
    - `calculateTaxBreakdown(items, itemsSubtotal, totalDiscount)`: shares discount proportionally by item value, handles mixed rates (5%, 12%, 18%, 28%), zero-rated items, and computes 2-decimal CGST, SGST, and total GST.
    - `calculateRoundOff(taxableSubtotal, totalGst)`: computes raw grand total, rupee-rounded grand total (`Math.round`), and round-off delta.
    - `calculateBillingSummary(params)`: orchestrates full financial summary object and converts amounts to Indian Rupee words (`numberToIndianWords`).
    - `formatBillingSummary(summary)`: formats summary fields for presentation with Indian currency symbols and commas.
  - Proved mathematical equivalence between the new helper module and the pre-existing inline implementation across 11 diverse test cases (including mixed rates, boundary decimals, discount exceeding subtotal, and large wholesale orders).
  - Refactored `Dashboard.jsx` to consume `calculateBillingSummary()`, preserving exact variable names (`itemsSubtotal`, `manualDiscAmt`, `totalDiscount`, `taxableSubtotal`, `totalCgst`, `totalSgst`, `totalGst`, `rawGrandTotal`, `roundedGrandTotal`, `roundOff`, `grandTotalWords`, `taxWords`), coupon validation workflows, invoice submission payload contracts, and UI presentation.
  - Strictly respected user constraints: Did NOT extract `BillSummaryCard.jsx` in this batch; left UI and component tree unchanged.
  - Authored 10 deterministic unit and regression tests in `src/shared/__tests__/billingSummary.test.js`.
- **Impact**:
  - Reduced `Dashboard.jsx` from 800 to 793 lines.
  - Expanded frontend test suite from 194 to 204 passing tests across 31 test files (100% pass rate).
  - Preserved backend regression test suite at 201/201 passing across 22 test suites.
  - Isolated Vite production build succeeds with zero errors (1,816 modules transformed in 20.19s).
  - Zero commits or pushes; tracked `dist/` untouched; Leave Management deferred.

### Decision 2.26: BillSummaryCard UI Extraction — Phase 4
- **Problem**:
  - Following the financial calculation extraction in Batch 25 (`src/shared/billingSummary.js`), the presentation JSX for the Bill Summary card remained inline in `src/pages/billing/Dashboard.jsx` (lines 647–780, ~134 lines).
  - This section contained the card header with Banknote icon, coupon code input with validation spinner and error/success states, applied coupon badge with remove action, manual discount percentage input with bounds validation, full tax and monetary breakdown list, Indian numbering words representation, and invoice finalization action buttons ("Generate & Print Bill" and "Preview Exact Template") with empty bill disabled guards.
- **Decision**:
  - Extracted exactly one focused presentation component: `src/pages/billing/components/BillSummaryCard.jsx`.
  - Kept state ownership in `Dashboard.jsx`; passed props and callbacks (`appliedCoupon`, `couponDiscountAmount`, `couponCodeInput`, `setCouponCodeInput`, `validatingCoupon`, `applyCoupon`, `removeCoupon`, `globalDiscountPercent`, `setGlobalDiscountPercent`, `summary`, `itemsCount`, `handleSaveAndPrintInvoice`, `handlePreviewCurrentBill`).
  - Built robust fallback logic in `BillSummaryCard.jsx` to consume either an explicit `summary` object or individual prop primitives, ensuring backwards compatibility and flexible testing.
  - Bound empty bill guard (`isBillEmpty = itemsCount === 0`) to disable "Generate & Print Bill" and "Preview Exact Template" action buttons when no items are present.
  - Refactored `Dashboard.jsx` to render `<BillSummaryCard ... />`, eliminating 109 lines of inline JSX and removing unused imports (`Tag`, `formatCurrency`).
  - Authored 5 new deterministic unit/regression tests in `src/shared/__tests__/billSummaryCard.test.js`.
  - Executed live browser regression verification using Chrome DevTools MCP on `http://127.0.0.1:3100/billing`, testing empty bill guards, item addition, live totals recalculation, manual discount application, coupon validation via mock API, coupon removal, and modal preview invocation.
- **Impact**:
  - Reduced `Dashboard.jsx` from 793 to 684 lines (-109 lines, ~30% total reduction from the original 977 lines).
  - Expanded frontend test suite from 204 to 209 passing tests across 32 test files (100% pass rate).
  - Preserved backend regression test suite at 201/201 passing across 22 test suites.
  - Isolated Vite production build succeeds with zero errors (1,817 modules transformed in 7.01s).
  - Zero commits or pushes; tracked `dist/` untouched; Leave Management deferred.

### Decision 2.27: Billing Integration Audit & History View Model Resilience
- **Problem**:
  - Following the modularization of the billing subsystem across Batches 21–26 (extracting `RecentInvoicesCard`, `BillItemsCard`, `BillingStatsCard`, `BillSummaryCard`, and `src/shared/billingSummary.js`), a comprehensive integration audit was required to verify component interoperability, coupon lifecycle, financial calculations, preview/finalization contracts, and security boundaries.
  - During audit testing of edge cases, `formatRecentInvoiceRow()` in `src/shared/billingInvoices.js` was found vulnerable to `TypeError: Cannot read properties of null (reading 'invoiceNo')` when an invoice record is `null`, and leaked `NaN` into currency strings when `totalGst` or `grandTotal` contains non-numeric values.
- **Decision**:
  - Performed an exhaustive audit across all 9 extracted cards, parent `Dashboard.jsx`, shared calculation utilities, and server endpoints (`POST /api/billing/invoice`, `GET /api/billing/invoices`, `POST /api/coupons/validate`, `POST /api/coupons/use`).
  - Hardened `formatRecentInvoiceRow()` in `src/shared/billingInvoices.js` with `const item = inv || {}` null-safe guards and strict `Number.isFinite(...)` validation, preventing unhandled exceptions and `NaN` leakage on malformed network payloads.
  - Authored a permanent integration test suite in `src/shared/__tests__/billingIntegration.test.js` covering:
    1. Multi-rate line items (18% and 12%) with proportional discount distribution matching server formula.
    2. Invoice payload schema matching server-side validation contracts (`POST /api/billing/invoice`).
    3. Counter KPI statistics aggregation accurately filtering by reference date.
    4. Resilient invoice row formatting handling null, undefined, and non-numeric fields.
  - Executed real browser verification in Google Chrome via Chrome DevTools MCP on `http://127.0.0.1:3100/billing` with an isolated mock API daemon on port 5099, successfully passing all 9 required scenarios:
    1. Empty bill and disabled finalization actions.
    2. Multi-product entry with mixed GST rates (18% and 12%).
    3. Stepper increments, line item removal, and bill clearing.
    4. Coupon application and clean removal.
    5. Manual discount application with auto-recalculation.
    6. Modal preview invocation and non-destructive dismissal.
    7. Invoice finalization creating and prepending new record in history.
    8. Error recovery for failed coupon and invoice requests.
    9. Console quality auditing (zero React warnings, zero DOM errors).
- **Impact**:
  - Expanded frontend regression suite from 209 to 213 passing tests across 33 test files (100% pass rate in 1.6s).
  - Preserved backend regression suite at 201/201 passing across 22 test suites.
  - Isolated Vite production build succeeds with zero errors in 8.57s.
  - Zero commits or pushes; tracked `dist/` untouched; Leave Management deferred.

### Decision 2.28: Frontend–Backend Financial Parity & 0% GST Clamping Remediation
- **Problem**:
  - During the deterministic 14-scenario financial parity audit between frontend POS calculations (`billingSummary.js`, `billingItems.js`, `Dashboard.jsx`) and authoritative backend invoice generation (`POST /api/billing/invoice` in `server/server.js`), a critical calculation divergence was discovered for 0% GST products (tax-exempt agricultural commodities such as seeds and raw grains).
  - The frontend utilized logical OR fallback patterns (`Number(item?.gstRate) || 18` and `item.gstRate || 18`). Because `0` is falsy in JavaScript, `0 || 18` evaluated to `18`. Consequently, 0% GST items displayed 18% GST (9% CGST + 9% SGST) on the POS counter screen. When submitted to the server, the backend authoritatively retrieved the true 0% rate from the catalog or via nullish coalescing `?? 18`, creating a severe discrepancy between the counter display and the final saved invoice.
  - Floating-point addition in `calculateItemsSubtotal` and `calculateTaxableSubtotal` could accumulate precision artifacts (e.g. `10.10 + 20.20 = 30.299999999999997`) whereas the backend enforces `+(...toFixed(2))` rounding.
- **Decision**:
  - Remediated `src/shared/billingSummary.js`, `src/shared/billingItems.js`, and `src/pages/billing/Dashboard.jsx` to replace `|| 18` with `Number.isFinite(...)` and nullish coalescing checks, ensuring that valid 0% GST rates are fully supported and preserved across all calculations.
  - Hardened `calculateItemsSubtotal` and `calculateTaxableSubtotal` with `+(sum.toFixed(2))` to eliminate raw floating-point accumulation.
  - Authored a permanent independent backend parity test suite in `server/tests/financial-parity.test.mjs` verifying all 14 matrix scenarios:
    1. Empty bill and zero-value item rejection.
    2. One item with 0% GST.
    3. Standard GST slabs (5%, 12%, 18%, 28%).
    4. Multiple items with mixed GST rates and proportional manual discount.
    5. Fractional unit rates (allowed) and fractional quantities (rejected with 400).
    6. Item-level discounts (0%, 15%, 100%, and >100% rejection).
    7. Manual discount (0%, 10%, 100%).
    8. Coupon discount alone.
    9. Manual discount combined with coupon discount.
    10. Discounts equal to subtotal (allowed) and exceeding subtotal (strictly rejected with 400).
    11. Round-off boundary behavior (.49 downward, .50 exact, .51 upward).
    12. Large commercial wholesale orders (₹75 lakh subtotal, ₹13.5 lakh GST).
    13. Catalog tax authority and client total spoofing immunity.
    14. Sequential invoice generation and unauthenticated rejection.
  - Expanded frontend tests in `src/shared/__tests__/billingSummary.test.js` to assert 0% GST calculation without explicit splits and floating-point subtotal precision.
- **Impact**:
  - Full deterministic financial parity achieved: ₹0.00 discrepancy across all supported POS billing scenarios.
  - Frontend test suite passes at 213/213 across 33 test files.
  - Backend test suite expanded from 201 to 215 passing tests across 23 test suites.
  - Zero commits or pushes; tracked `dist/` untouched; Leave Management deferred.

### Decision 2.29: Stabilization Gate, Cumulative Invariant Audit & Refactoring Exit Decision
- **Problem**:
  - Following 28 iterative refactoring batches (including modularization of the Product Catalog, Admin Operations, Support Tickets, dynamic code-splitting for Analytics, native Node.js test infrastructure, real Chrome DevTools browser verification, and billing POS decomposition across 9 cards and pure calculation utilities), a final stabilization review was needed to verify repository integrity, test coverage, security-sensitive invariants (SEC-01 multi-store isolation, PRV-01 internal notes privacy, VAL-01 order ownership, financial integrity, Razorpay HMAC payment integrity, OTP/rate limits, API compatibility), re-verify the critical 0% GST fix, and establish whether the billing subsystem is ready to exit refactoring.
- **Decision**:
  - Performed an exhaustive stabilization review of cumulative changes across all 28 batches.
  - Re-verified truthiness and 0% GST preservation across `src/shared/billingSummary.js`, `src/shared/billingItems.js`, `src/pages/billing/Dashboard.jsx`, and backend `POST /api/billing/invoice` in `server/server.js`, confirming that 0% tax-exempt commodities (seeds, grain, organic fertilizers) calculate exactly ₹0.00 tax with zero clobbering to 18%.
  - Verified security and business invariants:
    - **SEC-01 (Multi-Store Isolation)**: Enforced via `server/tests/staff-store-isolation.test.mjs` (13/13 passing), ensuring staff queries and mutations remain strictly scoped to authenticated `storeId` / `storeCode`.
    - **PRV-01 (Internal Staff Notes Privacy)**: Enforced in `server/server.js` and verified via `server/tests/support-tickets.test.mjs`, ensuring internal staff notes are scrubbed from customer API responses.
    - **VAL-01 (Order Ownership & Authorization)**: Enforced server-side for tickets and order queries.
    - **Financial Integrity**: Authoritative pricing, GST rates, HSN validation, discount clamping, and round-off recalculation enforced by server (`server/tests/financial-parity.test.mjs`, 14/14 passing). Client-supplied total spoofing is completely ignored.
    - **Payment Integrity**: Timing-safe HMAC-SHA256 signature verification (`safeEqual`) in `POST /api/payments/verify`.
    - **OTP & Rate Limiting**: Preserved and verified by `server/tests/otp-auth.test.mjs` (31/31 passing).
    - **API Compatibility**: All 9 extracted billing cards maintain compatible props and callbacks with parent `Dashboard.jsx`.
  - Formulated the definitive Refactoring Exit Decision: **READY TO EXIT REFACTORING**. The billing subsystem has reached architectural maturity, reducing `Dashboard.jsx` from ~1,400 to 684 lines (-51%), backed by 48 billing-specific tests across frontend and backend, 100% mathematical parity with zero discrepancy, and flawless isolated builds. Normal feature work may safely resume.
- **Impact**:
  - 213/213 passing frontend tests across 33 test files.
  - 215/215 passing backend tests across 23 test suites.
  - Complete zero-regression posture across all modules.
  - Zero commits or pushes; tracked `dist/` untouched; Leave Management remains strictly deferred pending formal client confirmation.
