# 03 — QA Test Order Analysis: Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026, 22:20 IST  
**Environment**: Production Database (`sathyambio`)  
**Auditor**: Principal QA Automation Engineer & Enterprise Data Architect  

---

## 1. Intentional QA Testing in Production: Context & Scope

In accordance with Sathyam Agro Mart's operational testing strategy, regression tests and payment flows are validated directly against the live environment. Consequently, the presence of **179 QA test orders** in the live database is **expected, intentional, and part of the validation lifecycle**. 

These orders do not represent system errors, data corruption, or runaway test scripts.

---

## 2. Current System Behavior with QA Data

An inspection of the backend API (`server/server.js`) was performed to determine how QA orders are handled across different dashboards, endpoints, and reports:

### A. Admin Order Management (`GET /api/orders`)
- **Current Behavior**: When an administrator or staff member requests `/api/orders`, the backend queries `db.getOrders()` and returns all orders in the database.
- **Impact**: All 181 orders (including the 179 QA orders) are displayed in the Admin Orders table.
- **Business Logic Fit**: Allows administrators and QA testers to view and verify newly created test orders in real-time.

### B. Customer Order History (`GET /api/orders`)
- **Current Behavior**: For non-staff customer tokens, the backend executes `db.getOrdersForCustomer(user)`. This filters orders strictly by the authenticated customer's phone number or user ID.
- **Impact**: **Zero data leakage**. Genuine customers see only their own orders. They never see any QA test orders.

### C. Financial & Sales Reporting
- **Current Behavior**: Total order count calculations (e.g. in `userProductSummary` or admin analytics) aggregate across all orders in the collection.
- **Impact**: Sales and revenue summaries include QA order volumes (₹140,402.00 QA vs. ₹6,298.00 genuine).
- **Business Logic Fit**: Acceptable for pre-launch staging/testing; however, post-launch analytics will benefit from an optional filter.

### D. Inventory Calculations
- **Current Behavior**: Test orders placed with `paymentMethod: 'Cash on Delivery'` or simulated payment reserve stock lines.
- **Impact**: Product stock numbers are updated to reflect orders. Because catalog products have generous default stock (50–100 units per formulation), testing does not cause stockouts.

---

## 3. Recommended Optional Enhancement (Do Not Implement Automatically)

While current behavior is fully functional, an optional enhancement can be introduced post-demo to give managers a cleaner reporting toggle:

### Proposed Design: Non-Intrusive Test Flag
1. **Schema Update**: Add an optional boolean `isTest?: boolean` to the `Order` schema (defaulting to `false`).
2. **Checkout Tagging**: When an order is placed from a test account (`TEST_PHONE_NUMBERS`), mark `isTest: true`.
3. **Admin UI Toggle**: Add an "Include QA Orders" switch on the Admin Orders & Analytics pages:
   - When **OFF** (default for managers): Filters query with `{ isTest: { $ne: true } }`.
   - When **ON** (for QA & dev): Displays all orders.

> [!IMPORTANT]
> **Release Recommendation**: Per the live environment rules, this enhancement should **NOT** be implemented prior to the November 6 client demo. The current behavior is stable, transparent, and fully documented.
