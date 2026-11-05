# 10 — Defect Classification & Recommended Fixes: Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026, 22:20 IST  
**Auditor**: Senior Bug Triage Specialist & Release Auditor  

---

## 1. Defect Severity Classification Summary

| Severity Tier | Definition | Open Count | Resolved Count |
|---|---|:---:|:---:|
| **P0 — Critical** | Application unavailable, data loss, security compromise, broken checkout | **0** | **2** |
| **P1 — High** | Critical customer or admin workflow broken | **0** | **2** |
| **P2 — Medium** | Important functionality partially broken or incorrect | **0** | **3** |
| **P3 — Low** | Minor visual defects, non-blocking UX observations | **2** | **1** |
| **P4 — Enhancement** | Optional improvements and post-demo enhancements | **1** | **0** |

---

## 2. Resolved Pre-Demo Defects (Verified in Code)

### [RESOLVED] SAM-BUG-P0-01: Order Confirmation Modal Auto-Close Race Condition
- **Module**: Storefront Checkout (`src/hooks/useCheckout.js` & `src/storefront/sections/CheckoutSheet.jsx`)
- **Severity**: **P0 — Critical**
- **Symptom**: Placing an order immediately closed the checkout modal, leaving customers on the home page without confirmation or Order ID.
- **Root Cause**: Reactive `useEffect` in `useCheckout.js` called `actions.closeCheckout()` when `order` was non-null before the React Router hash transition to step `done` finished.
- **Resolution**: Guarded step transition to `done`; built rich order confirmation view with Copy button, expected delivery date, and WhatsApp alert. Verified live with order `SAM-ORD-MW3KZW40M5JY`.

### [RESOLVED] SAM-BUG-P0-02: Track Your Order Missing Order Focus & Auto-Scroll
- **Module**: Order Status (`src/pages/OrderStatus.jsx`)
- **Severity**: **P0 — Critical**
- **Symptom**: Clicking "Track Your Order" navigated to generic `/orders` list without highlighting the newly placed order.
- **Resolution**: Implemented `?orderId=...` detection with emerald green highlight ring, "Newly Placed Order" badge, and `scrollIntoView` centering.

### [RESOLVED] SAM-BUG-P1-01: Static Crop Grid vs Dynamic Admin Options
- **Module**: Storefront Discovery (`src/storefront/sections/ShopGrids.jsx` & `src/pages/StoreSection.jsx`)
- **Severity**: **P1 — High**
- **Symptom**: Crops were hardcoded to 4 static items (Paddy, Cotton, Turmeric, Sugarcane), ignoring new crops configured in MongoDB.
- **Resolution**: Updated `CropGrid` to dynamically merge master crops from `/api/catalog-options`. 18 crops now render live.

### [RESOLVED] SAM-BUG-P2-01: FontAwesome Subset Micro-Bundle Failure
- **Module**: Asset Bundling (`src/storefront/sections/CheckoutSheet.jsx`)
- **Severity**: **P2 — Medium**
- **Symptom**: Adding `fa-copy` class failed `faSubset.test.js`.
- **Resolution**: Replaced icon with an inline SVG `<svg>` tag, preserving the 15 KB micro-bundle size.

---

## 3. Open Non-Blocking Observations & Enhancements

### [OPEN / MITIGATED] SAM-BUG-P3-01: DevTools Viewport Override Persistence in Automated Test Runs
- **Module**: Headless / Automated Testing Harness
- **Severity**: **P3 — Low**
- **Symptom**: When automated tests emulate a 1920px desktop viewport via Chrome DevTools MCP, the override remains active. If a tester views the browser snapped to half-screen (500px), content appears cropped horizontally.
- **Root Cause**: DevTools Protocol `Emulation.setDeviceMetricsOverride` overrides window layout until explicitly cleared.
- **Mitigation**: Automated scripts now explicitly call `emulate` without viewport arguments at the end of runs to clear the override. In normal non-automated Chrome browsers, this issue does not occur.
- **Approval Required**: None (Operational guideline).

### [OPEN / MITIGATED] SAM-BUG-P3-02: WaSenderAPI WhatsApp Dispatch Mock Timeout When Credits Inactive
- **Module**: Notifications Gateway (`server/server.js`)
- **Severity**: **P3 — Low**
- **Symptom**: In local unit testing, WhatsApp message dispatch logs `WaSenderAPI request failed (503): upstream down`.
- **Root Cause**: Third-party SMS API credits are conserved during test runs.
- **Mitigation**: Server-side error handling safely catches upstream 503s and prevents application crashes. For live demo, active WhatsApp credits should be maintained or demo bypass numbers (`9876543210`) used.
- **Approval Required**: None.

### [PROPOSED ENHANCEMENT] SAM-ENH-P4-01: Admin QA Order Filter Toggle
- **Module**: Admin Orders & Analytics (`server/server.js` & `src/pages/Orders.jsx`)
- **Severity**: **P4 — Enhancement**
- **Description**: Add an optional toggle in the Admin Dashboard (`Show QA Orders: ON/OFF`) to allow administrators to filter out test orders from sales reports.
- **Recommendation**: Plan for Phase 3 post-demo deployment. Do not modify production schemas before the demo.
- **Approval Required**: Yes (Product Owner approval required prior to schema update).
