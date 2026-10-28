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
