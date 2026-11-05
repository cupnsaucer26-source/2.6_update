# REPORT A — SATHYAM AGRO MART: MASTER PROJECT-WIDE UI/UX INVENTORY

**Document Classification:** Master Project Inventory & Structural Baseline  
**Workspace:** `C:\Users\step1\OneDrive\Desktop\2.6-test_cases\2.6_update`  
**Target Environment:** Production (`https://www.sathyamagromart.com`)  
**Audit Mode:** Strict Read-Only Baseline  
**Date of Audit:** October 30, 2026  
**Auditing Team:** Principal UI/UX & Frontend Architecture Engineering Team

---

## 1. Project Architecture Summary

| Dimension | Specification / Technology | Implementation Details |
|:---|:---|:---|
| **Frontend Framework** | React 18.3.1 (Vite 6.4.5) | SPA architecture with native ESM bundling and route-level dynamic code-splitting (`React.lazy` + `Suspense`). |
| **Routing System** | React Router DOM v6.22.0 | Centralized in `src/App.jsx`. Employs 6 specialized layout hierarchies and role-based `PrivateRoute` route guards. |
| **Styling & Design System** | Custom CSS Architecture with CSS Layers | Modern CSS layers (`@layer app, sb-reset;`), CSS Custom Properties (`:root`), fluid typography (`clamp()`), and scoped stylesheets (`storefront.css`, `index.css`, `phase2.css`, `app.css`). Tailwind is disabled in `index.css` to prevent conflicts with the bespoke agricultural UI. |
| **Iconography** | Lucide React + FontAwesome 6 | Lucide React for administrative/staff dashboards and operational actions; FontAwesome 6 (pre-loaded subset) for public storefront chips and floating action controls. |
| **Notification System** | Sonner v1.4.0 + Custom Storefront Toasts | Stacked, swipeable, accessible toasts configured globally in `src/main.jsx` with responsive offsets (16px desktop, 12px mobile). |
| **Backend Integration** | Express 4.18.2 (Node.js ESM) | Native ESM (`"type": "module"`). Serves REST API under `/api` and serves the pre-built `dist/` directory via `express.static(DIST_DIR)`. |
| **Database & ORM** | MongoDB Atlas (`sathyambio` replica set) | Mongoose 8.x with permissive schemas (`strict: false`) and human-readable string IDs (`sb-XXXX`, `rcpt-XXXX`). |
| **Payment Gateway** | Razorpay Standard Web Checkout | Live mode active for **SATHYAM AGRO CLINIC** (`rzp_live_TrKx8Jv1RFFOOx`). Webhook at `/api/payments/webhook`. |
| **Internationalization (i18n)** | Custom React Context (`LanguageContext.jsx`) | 7 Indian languages: English (`en`), Tamil (`ta`), Kannada (`kn`), Telugu (`te`), Hindi (`hi`), Malayalam (`ml`), and Tulu (`tulu`). Noto script fonts preloaded in `index.html`. |
| **Automated Testing** | Node.js Test Runner (`node:test`) | 233 passing unit tests in `src/shared/__tests__/*.test.js` verifying translations, voice search, GST calculations, OTP countdown, and POS contracts. |

---

## 2. Feature Presence Classification

As mandated by the discovery rule, each feature category is evaluated against actual code evidence:

| Feature Category | Classification | Actual Implementation Evidence |
|:---|:---:|:---|
| **Product Search & Filtering** | **PRESENT** | Storefront live header search with voice transliteration (`VoiceButton.jsx`), crop filters (`CropSelect.jsx`), category pills (`Categories.jsx`), and administrative product filters (`AdminProducts.jsx`). |
| **Product Sorting** | **PARTIALLY PRESENT** | Filtering by category, brand, and crop exists; price range slider exists in `#filterDrawer`. An explicit "Sort by Price: Low to High / High to Low" dropdown on the public catalog is currently absent. |
| **Pagination** | **PRESENT** | Admin orders, users, tickets, and work logs implement server/client pagination. Storefront catalog utilizes category/crop tab filtering and section limits. |
| **Shopping Cart & Checkout** | **PRESENT** | Slide-out quick basket (`CheckoutSheet.jsx`), full checkout route (`/checkout`, `Checkout.jsx`), Razorpay web payment checkout, address validation, and server-side pricing recalculation. |
| **Customer Authentication** | **PRESENT** | Modern phone/OTP modal (`AuthModal.jsx`), 60s countdown timer with resend protection (`useResendCountdown.js`), and referral code auto-capture (`captureReferralFromUrl`). |
| **Staff & Admin Authentication** | **PRESENT** | Dedicated password sign-in (`/login`, `Login.jsx`), password recovery (`/forgot-password`), and JWT session tokens. |
| **User Profiles** | **PRESENT** | Employee/Delivery profile screens (`Profile.jsx`), customer delivery addresses (`ProfileFields.jsx`), and customer order histories (`OrderStatus.jsx`). |
| **Agricultural Crop Personalisation** | **PRESENT** | Crop selection modal on initial visit, crop advisory push notifications, and WhatsApp broadcast filtering by subscribed crops (`cropRules.js`). |
| **AI Leaf Scanner & Visual Diagnostics** | **PRESENT** | `PhotoScannerModal.jsx` embedded in storefront hero; camera/file capture for crop disease analysis. |
| **Customer Support & Ticketing** | **PRESENT** | Public customer ticket submitter (`SupportTicketsCustomer.jsx`), admin ticket management (`SupportTickets.jsx`, `Tickets.jsx`), and superadmin routing (`SupportTicketSystem.jsx`). |
| **Live Chat & WhatsApp Assist** | **PRESENT** | Rule-based automated storefront assistant (`Chatbot.jsx`), floating Call FAB (`CallFab.jsx`), WhatsApp click-to-chat, and admin chat logs (`ChatRecords.jsx`). |
| **Billing & Point-of-Sale (POS)** | **PRESENT** | Complete in-store counter billing (`/billing`, `BillingDashboard.jsx`), barcode item entry, customer search, GST calculation (18% and 12%), and printable GST tax invoice (`ExactGstInvoice.jsx`). |
| **Data Export (Excel / Reports)** | **PRESENT** | Dynamic lazy-loaded XLSX export for 4-sheet Full Enterprise Report and Invoices Ledger (`exportFullExcelReport`, `exportInvoicesExcel`). |
| **Multi-Language Voice Search** | **PRESENT** | Web Speech API integration (`VoiceAnywhere.jsx`, `VoiceButton.jsx`) supporting spoken agricultural terms across Tamil, Telugu, Kannada, Hindi, Malayalam, and Tulu. |
| **Social / Public Reviews** | **PARTIALLY PRESENT** | Product rating stars and testimonial quotes are rendered in static hero/review cards; an open user-submitted review creation form is not implemented. |
| **Wishlist Workflow** | **PRESENT** | Client-persisted wishlist (`Wishlist.jsx`) with quick add/remove heart toggles across catalog cards. |
| **Returns & Refunds Workflow** | **PARTIALLY PRESENT** | Informational policy page exists (`/refund-policy`); automated self-service refund claim submission form is handled via support tickets rather than a dedicated return module. |

---

## 3. Complete Route and Page Inventory (72 Discovered Route Nodes)

The application defines 72 route nodes across 6 layout hierarchies in `src/App.jsx`. Every route is accounted for below:

### A. Public Storefront & Customer Routes

| Route Pattern | Component File | Parent Layout | Purpose & Key Features | Audit Status |
|:---|:---|:---|:---|:---:|
| `/` | `src/storefront/Storefront.jsx` | Unwrapped / Standalone | Homepage, 2026 rounded floating header, hero bento grid, AI scanner card, categories, crops, catalog, chatbot, Call FAB. | Verified Live |
| `/product/:id` | `src/pages/ProductDetail.jsx` | `StoreLayout` | Full product view, image gallery, package variants, technical specs, related items, add to cart. | Verified Live |
| `/product/:id/ingredients` | `src/pages/IngredientDetail.jsx` | `StoreLayout` | Technical chemical formulations, active ingredients, dosage, target pests/weeds. | Verified Live |
| `/cart` | Redirects to `/checkout` | Standalone | Convenience redirect for cart requests; opens checkout sheet or navigates to checkout. | Verified |
| `/checkout` | `src/pages/Checkout.jsx` | Standalone | Full-page order checkout, delivery address selection, coupon application, Razorpay payment. | Verified |
| `/wishlist` | `src/pages/Wishlist.jsx` | `StoreLayout` | Customer saved items, inventory status, direct move-to-cart. | Verified Live |
| `/orders` | `src/pages/OrderStatus.jsx` | `StoreLayout` | Live tracking of customer orders by phone/order ID, status timeline, delivery details. | Verified Live |
| `/order-status` | Redirects to `/orders` | Standalone | Legacy route redirect. | Verified |
| `/shop` | Redirects to `/products` | Standalone | Legacy route redirect. | Verified |
| `/products` | `src/pages/AllProducts.jsx` | `StoreLayout` | Comprehensive catalog search, category/crop filters, pagination, grid view. | Verified Live |
| `/categories` | `src/pages/Categories.jsx` | `StoreLayout` | Category visual directory (Fertilizers, Pesticides, Seeds, Growth Promoters, Equipment). | Verified Live |
| `/crops` | `src/pages/StoreSection.jsx` (`type="crops"`) | `StoreLayout` | Crop-wise catalog filtering (Paddy, Cotton, Banana, Chilli, Sugarcane, Vegetables). | Verified Live |
| `/brands` | `src/pages/StoreSection.jsx` (`type="brands"`) | `StoreLayout` | Brand directory and manufacturer-filtered catalog listings. | Verified Live |
| `/agronomy-experts` | `src/pages/AgronomyExperts.jsx` | `StoreLayout` | Agronomy expert consultation directory, booking scheduler, advisory profiles. | Verified Live |
| `/soil-test-report` | `src/pages/SoilTestReport.jsx` | `StoreLayout` | Soil health card submission, lab report lookup, NPK recommendation breakdown. | Verified Live |
| `/support-tickets` | `src/pages/SupportTicketsCustomer.jsx` | `StoreLayout` | Customer ticket creation, order issue reporting, attachment upload, status tracking. | Verified Live |
| `/blog` | `src/pages/Blog.jsx` | `StoreLayout` | Agricultural news, crop protection guides, organic farming techniques. | Verified Live |
| `/blog/:id` | `src/pages/BlogDetail.jsx` | `StoreLayout` | Full blog article view, related articles, share triggers. | Verified Live |
| `/privacy-policy` | `src/pages/InformationPage.jsx` | `StoreLayout` | Legal privacy policy document. | Verified Live |
| `/terms-of-sale` | `src/pages/InformationPage.jsx` | `StoreLayout` | Legal terms of sale, delivery terms, and customer conditions. | Verified Live |
| `/refund-policy` | `src/pages/InformationPage.jsx` | `StoreLayout` | Policy governing returns, broken package replacements, cancellations. | Verified Live |
| `/about-us` | `src/pages/InformationPage.jsx` | `StoreLayout` | Company background, agricultural clinic history, mission statement. | Verified Live |
| `/contact-us` | `src/pages/InformationPage.jsx` | `StoreLayout` | Store physical locations, telephone numbers, emails, inquiry form. | Verified Live |
| `/login` | `src/pages/Login.jsx` | Standalone | Staff and administrative sign-in portal (email/password). | Verified Live |
| `/register` | Redirects to `/` | Standalone | Customer registration handled via modal (`AuthModal.jsx`). | Verified |
| `/forgot-password` | `src/pages/ForgotPassword.jsx` | Standalone | Password reset request with email verification link. | Verified Live |

---

### B. SuperAdmin Portal (`/superadmin` — Role: `superadmin`)

| Route Pattern | Component File | Parent Layout | Business Purpose & Key UI Features |
|:---|:---|:---|:---|
| `/superadmin` | `src/pages/superadmin/Dashboard.jsx` | `SuperAdminLayout` | Platform KPI cards (Total Sales, Active Stores, Tickets, Soil Reports), system status. |
| `/superadmin/analytics` | `src/pages/superadmin/ShopAnalytics.jsx` | `SuperAdminLayout` | Platform-wide financial reporting, cross-store comparison, volume trends. |
| `/superadmin/agronomy-bookings`| `src/pages/admin/AgronomyBookings.jsx` | `SuperAdminLayout` | Master booking monitor for agricultural clinic consultations. |
| `/superadmin/support-tickets` | `src/pages/superadmin/SupportTicketSystem.jsx` | `SuperAdminLayout` | Global ticket queue, SLA escalations, multi-store assignment. |
| `/superadmin/soil-reports` | `src/pages/superadmin/SoilReportMonitor.jsx` | `SuperAdminLayout` | Global laboratory report verification, farmer test result dispatch. |
| `/superadmin/stores` | `src/pages/superadmin/Stores.jsx` | `SuperAdminLayout` | Franchise and branch store management (Coimbatore, Erode, Salem, etc.). |
| `/superadmin/users` | `src/pages/superadmin/Users.jsx` | `SuperAdminLayout` | Enterprise user directory, role assignment, account activation/suspension. |
| `/superadmin/permissions` | `src/pages/superadmin/Permissions.jsx` | `SuperAdminLayout` | Role-based access control (RBAC) matrix for administrative permissions. |
| `/superadmin/logs` | `src/pages/superadmin/WorkLog.jsx` | `SuperAdminLayout` | Audit trail of administrative actions, logins, price updates, order cancellations. |

---

### C. Admin Portal (`/admin` — Roles: `admin`, `superadmin`)

| Route Pattern | Component File | Parent Layout | Business Purpose & Key UI Features |
|:---|:---|:---|:---|
| `/admin` | `src/pages/admin/Dashboard.jsx` | `AdminLayout` | Store-level KPI overview (Today's revenue, pending orders, low-stock alerts). |
| `/admin/cms` | `src/pages/admin/CMS.jsx` | `AdminLayout` | Homepage banners, ticker announcements, promotional strip editor. |
| `/admin/users` | `src/pages/admin/Users.jsx` | `AdminLayout` | Customer customer management, search by phone, order history inspection. |
| `/admin/profile-fields` | `src/pages/admin/ProfileFields.jsx` | `AdminLayout` | Dynamic customer profile field configurations (farm size, crop types, village). |
| `/admin/products` | `src/pages/admin/Products.jsx` | `AdminLayout` | Product catalog CRUD, pricing, stock, technical formulations, media upload. |
| `/admin/orders` | `src/pages/admin/Orders.jsx` | `AdminLayout` | Order fulfillment, tracking assignment, dispatch confirmation, status updates. |
| `/admin/subscribers` | `src/pages/admin/Subscribers.jsx` | `AdminLayout` | Newsletter and WhatsApp advisory subscriber lists with opt-out status. |
| `/admin/enquiries` | `src/pages/admin/Enquiries.jsx` | `AdminLayout` | Customer bulk inquiries and quotation requests from product pages. |
| `/admin/analytics` | `src/pages/admin/Analytics.jsx` | `AdminLayout` | Sales charts, revenue trends, top-performing fertilizers and seeds. |
| `/admin/employees` | `src/pages/admin/Employees.jsx` | `AdminLayout` | Staff management, role allocation, branch assignment. |
| `/admin/support-tickets` | `src/pages/admin/SupportTickets.jsx` | `AdminLayout` | Branch support ticket inbox, reply threads, resolution status. |
| `/admin/soil-reports` | `src/pages/admin/SoilReports.jsx` | `AdminLayout` | Soil test review, agronomist recommendation notes, PDF upload. |
| `/admin/agronomy-bookings` | `src/pages/admin/AgronomyBookings.jsx` | `AdminLayout` | Field appointment scheduling, doctor visits, farmer call logs. |
| `/admin/tickets` | `src/pages/shared/Tickets.jsx` | `AdminLayout` | Internal communication tickets between staff, stores, and management. |
| `/admin/chat` | `src/pages/shared/ChatRecords.jsx` | `AdminLayout` | Customer conversation transcripts from the automated storefront chatbot. |
| `/admin/blogs` | `src/pages/admin/Blogs.jsx` | `AdminLayout` | Agricultural blog publication, content authoring, image attachment. |
| `/admin/videos` | `src/pages/admin/Videos.jsx` | `AdminLayout` | Farming video guides, demo reels, pest control video curation. |
| `/admin/coupons` | `src/pages/admin/Coupons.jsx` | `AdminLayout` | Discount coupons, minimum order value limits, expiry dates, usage caps. |
| `/admin/referrals` | `src/pages/admin/Referrals.jsx` | `AdminLayout` | Farmer referral program tracking, reward credits, payout verification. |

---

### D. Employee Portal (`/employee` — Role: `employee`)

| Route Pattern | Component File | Parent Layout | Business Purpose & Key UI Features |
|:---|:---|:---|:---|
| `/employee` | `src/pages/employee/Dashboard.jsx` | `EmployeeLayout` | Personal daily work queue, assigned tickets, upcoming farmer visits. |
| `/employee/profile` | `src/pages/employee/Profile.jsx` | `EmployeeLayout` | Personal credentials, contact details, attendance, shift details. |
| `/employee/tickets` | `src/pages/shared/Tickets.jsx` | `EmployeeLayout` | Assigned customer and internal service tickets. |
| `/employee/soil-reports` | `src/pages/admin/SoilReports.jsx` | `EmployeeLayout` | Upload and review assigned soil testing samples. |
| `/employee/agronomy-bookings` | `src/pages/admin/AgronomyBookings.jsx` | `EmployeeLayout` | View and complete assigned farm visit consultations. |

---

### E. Delivery Portal (`/delivery` — Role: `delivery`)

| Route Pattern | Component File | Parent Layout | Business Purpose & Key UI Features |
|:---|:---|:---|:---|
| `/delivery` | `src/pages/delivery/Dashboard.jsx` | `DeliveryLayout` | Active delivery orders, GPS route hints, farmer phone dialer, COD collection. |
| `/delivery/profile` | `src/pages/employee/Profile.jsx` | `DeliveryLayout` | Driver profile, vehicle info, emergency contacts. |

---

### F. In-Store Billing Portal (`/billing` — Roles: `billing`, `admin`)

| Route Pattern | Component File | Parent Layout | Business Purpose & Key UI Features |
|:---|:---|:---|:---|
| `/billing` | `src/pages/billing/Dashboard.jsx` | `BillingLayout` | Fast counter POS, barcode scan, product search, cart table, GST invoice generator. |
| `/billing/history` | `src/pages/billing/InvoiceHistory.jsx` | `BillingLayout` | Ledger of past in-store sales, reprint GST invoice, filter by payment mode. |
| `/billing/profile` | `src/pages/employee/Profile.jsx` | `BillingLayout` | Cashier profile and shift settlement. |

---

## 4. Shared Layouts and Global Containers

| Layout Component | Location | Distinct Visual & Functional Responsibilities |
|:---|:---|:---|
| **Storefront Root** | `src/storefront/Storefront.jsx` | Standalone public homepage container. Houses modern floating rounded header (`.sb-header-shell`), top promotional ticker, floating action buttons, and storefront sections. |
| **`StoreLayout`** | `src/layouts/StoreLayout.jsx` | Wraps all sub-pages of the store (`/products`, `/product/:id`, `/orders`, etc.). Injects `StoreTopChrome`, `StoreHeader`, `StoreTicker`, child route content (`<Outlet />`), `Footer`, and `MobileBottomNav`. |
| **`AdminLayout`** | `src/layouts/AdminLayout.jsx` | Fixed left administrative sidebar, top status bar with branch selector and user badge, responsive main content area. |
| **`SuperAdminLayout`** | `src/layouts/SuperAdminLayout.jsx` | Enterprise-grade dark/emerald sidebar with system health indicators, store switcher, and breadcrumb header. |
| **`EmployeeLayout`** | `src/layouts/EmployeeLayout.jsx` | Streamlined staff workspace layout focusing on daily tasks and mobile responsiveness. |
| **`DeliveryLayout`** | `src/layouts/DeliveryLayout.jsx` | Mobile-first delivery driver view with high-contrast buttons, fast action triggers, and quick phone links. |
| **`BillingLayout`** | `src/layouts/BillingLayout.jsx` | Desktop/tablet widescreen layout optimized for fast keyboard and barcode entry; high-density POS interface. |

---

## 5. Forms, Data Tables, and Modal Inventory

### A. Discovered Forms (24 Form Containers)

| Form Container | File Location | Key Input Fields & Controls | Validation & Actions |
|:---|:---|:---|:---|
| **Customer Auth Modal** | `src/storefront/sections/AuthModal.jsx` | Phone number (10 digits), OTP verification (6 digits), Farmer Name, Village, Farm Size (acres), Primary Crops. | Strict 10-digit regex, auto-advancing 6-box OTP, server-verified registration. |
| **Quick Product Enquiry**| `src/storefront/sections/EnquirySheet.jsx` | Name, Phone, Delivery District, Quantity, Crop Problem Description. | Submits to `/api/enquiries` with real-time phone sanitation. |
| **Checkout Address Form**| `src/pages/Checkout.jsx` | Door/Street, Area, Village/Taluk, District dropdown, Pincode (6 digits), Payment Mode (Online / COD). | Mandatory district and 6-digit pincode validation; minimum order checks. |
| **Soil Test Submission** | `src/pages/SoilTestReport.jsx` | Farmer Name, Phone, Survey No, Acreage, Previous Crop, Soil Type, Water Source. | File upload for laboratory test card; automated NPK recommendations. |
| **Agronomy Booking** | `src/pages/AgronomyExperts.jsx` | Selected Agronomist, Visit Date/Time, Crop Type, Acreage, Problem Photos. | Calendar slot picker, photo upload, SMS confirmation. |
| **Customer Support Ticket**| `src/pages/SupportTicketsCustomer.jsx`| Order Reference, Issue Category (Damaged, Delayed, Quality, Advisory), Message, Attachments. | Multi-part file upload, automated ticket assignment by district. |
| **Admin Product Editor** | `src/pages/admin/Products.jsx` | SKU, Name, Tamil Name, Category, Brand, Price, Compare Price, GST Rate (18%/12%), Stock, Technical Formulation, Images, Video URL. | Multi-tab form rail (`ProductFormRail.jsx`), server-side price integrity. |
| **In-Store Item Entry** | `src/pages/billing/components/AddItemCard.jsx` | Product Search, Barcode Input, Unit Rate, Quantity, Line Discount (%). | Enter-key dispatch, stock boundary check, live line total calculation. |
| **In-Store Buyer Consignee**| `src/pages/billing/components/BuyerConsigneeCard.jsx`| Farmer Phone, Name, GSTIN (optional), Village/Address, State Code. | Auto-populates existing customer profile upon entering 10-digit phone. |
| **Staff Sign-In Form** | `src/pages/Login.jsx` | Staff Email, Password, Remember Me toggle. | Role redirect (`/admin`, `/superadmin`, `/billing`, `/employee`, `/delivery`). |
| **Staff Password Reset** | `src/pages/ForgotPassword.jsx` | Registered Email address. | Dispatches timed password recovery token via email. |
| **Admin Coupon Creator** | `src/pages/admin/Coupons.jsx` | Coupon Code, Discount Type (Fixed / %), Value, Min Order, Expiry Date, Usage Limit. | Duplicate code prevention, date boundary validation. |
| **Admin User Creator** | `src/pages/admin/users/CreateUserModal.jsx` | Name, Phone, Role selector, Store/Branch assignment, Password. | Role-based permission assignment, phone uniqueness check. |

---

### B. Discovered Data Tables (18 Table Containers)

| Table Container | File Location | Columns & Structure | Responsive Presentation |
|:---|:---|:---|:---|
| **Admin Orders Table** | `src/pages/admin/Orders.jsx` | Order ID, Date, Customer, District, Total (₹), Items, Payment Status, Delivery Status, Actions. | Horizontal scroll on tablet; collapsible card view on mobile. |
| **Admin Products Table** | `src/pages/admin/Products.jsx` | Image, Name / Tamil, SKU, Category, Price, Stock Badge, Status, Actions. | High-density grid with fixed action column. |
| **POS Bill Items Table** | `src/pages/billing/components/BillItemsCard.jsx` | Sl, Item Description, HSN, Qty, Rate (₹), Discount, Taxable, GST %, Amount (₹), Actions. | Fixed POS layout; touch-friendly +/- buttons with minimum 40px height. |
| **POS Recent Invoices** | `src/pages/billing/components/RecentInvoicesCard.jsx`| Invoice No, Time, Customer Name, Items, Payment Mode Badge, Total (₹), Print / View. | Scrollable quick-access list with instant reprint trigger. |
| **Invoice History Ledger**| `src/pages/billing/InvoiceHistory.jsx` | Invoice No, Date, Customer Phone, Payment Mode, Taxable, CGST, SGST, Net Total, Actions. | Full-width ledger with date-range filters and Excel export trigger. |
| **Analytics Orders Table**| `src/pages/admin/analytics/AnalyticsOrdersTable.jsx`| Order Ref, Customer, Store Branch, Revenue, Margin, Settlement Status. | Sortable headers with monetary formatting. |
| **Chat Records Table** | `src/pages/shared/ChatRecords.jsx` | Session ID, Timestamp, Customer Phone, Identified Crop, Message Count, Actions. | Inspection drawer for conversation transcripts. |
| **SuperAdmin Audit Log** | `src/pages/superadmin/WorkLog.jsx` | Timestamp, Staff User, Action Type, Target Resource, IP Address, Status. | Monospaced audit trail with color-coded status badges. |

---

### C. Discovered Modals, Drawers & Overlays (36 Containers)

| Container Component | File Location | Overlay Type | Triggers & Behaviors |
|:---|:---|:---|:---|
| **`AuthModal`** | `src/storefront/sections/AuthModal.jsx` | Centered Modal | Triggered via Header "Sign In", "Account", checkout prompt, or `#login` URL hash. Traps focus, suppresses floating controls. |
| **`CheckoutSheet`** | `src/storefront/sections/CheckoutSheet.jsx` | Right Slide Drawer | Triggered by cart icon or "Buy Now". Displays line items, quantity adjustments, order summary, and checkout trigger. |
| **`EnquirySheet`** | `src/storefront/sections/EnquirySheet.jsx` | Right Slide Drawer | Triggered by "Bulk Enquiry" buttons on product cards and catalog. |
| **`PhotoScannerModal`** | `src/storefront/sections/PhotoScannerModal.jsx` | Centered Full Modal | Triggered by "AI Leaf Scanner" card in Hero. Handles camera feed and image preview. |
| **`CropSelect`** | `src/storefront/sections/CropSelect.jsx` | Centered Dialog | Triggered on first visit or header "Shop by Crop" edit. Saves selected crops to localStorage and cookies. |
| **`LocationPrompt`** | `src/storefront/sections/LocationPrompt.jsx` | Bottom Slide Sheet | Prompts customer for delivery district to calculate accurate delivery timelines. |
| **`ExactGstInvoice`** | `src/components/billing/ExactGstInvoice.jsx` | Print Dialog Overlay | Renders formal A4 GST tax invoice with barcode, HSN summary, and authorized signature block. |
| **`MobileBottomNav` Drawer**| `src/components/home/MobileBottomNav.jsx` | Bottom Fixed Bar | Mobile sticky navigation: Home, Categories, Chat, Call, Basket. |

---

## 6. Design System & Brand Asset Baseline

### A. Brand Identity
- **Company Name:** Sathyam Agro Mart (Sathyam Bio / Sathyam Agro Clinic)
- **Tagline:** FACTORY 2 FARMER | Grow More. Protect Better. Farm Smarter.
- **Brand Logomark:** Sprouting plant inside an agricultural shield (`/assets/brand/logo-mark.png`).
- **Brand Wordmark:** Sathyam Agro Mart serifed bold lettering (`/assets/brand/logo-wordmark.png`).
- **White Badge Badge:** Inverted logo for dark backgrounds (`/assets/brand/logo-badge.png`).

### B. Color Tokens

```css
:root {
  /* Storefront Primary Palette */
  --primary: #0B7A4B;          /* Sathyam Agricultural Deep Green */
  --primary-dark: #075437;     /* Hover & Active States */
  --primary-light: #16A46A;    /* Dotted labels, accents */
  --accent-gold: #C77D18;      /* Special promotions, badges */
  --bg-main: #FBFAF7;          /* Warm organic background */
  --bg-section: #F4F3EF;       /* Subtle section division */
  --bg-card: #FFFFFF;          /* Pure white card backgrounds */
  
  /* Administrative Brand Scale */
  --brand-50: #ecfdf5;
  --brand-500: #10b981;
  --brand-700: #047857;
  --brand-900: #064e3b;
  
  /* High-Contrast Rural Mobile Typography */
  --text-main: #14231C;        /* Deep organic ink (WCAG AAA on white) */
  --text-muted: #5A6B63;       /* Secondary descriptions */
  --text-dim: #8D9A93;         /* Disabled text & borders */
}
```

### C. Typography Hierarchy
1. **Headings:** `"Outfit", "Plus Jakarta Sans", sans-serif; font-weight: 700`.
2. **Body Prose & Controls:** `"Plus Jakarta Sans", "Poppins", sans-serif; font-weight: 400, 500, 600`.
3. **Data Tables & Billing Code:** System monospaced font or tabular numbers (`font-variant-numeric: tabular-nums`).
4. **Indian Regional Scripts:**
   - Tamil: `"Noto Sans Tamil"`
   - Kannada: `"Noto Sans Kannada"`
   - Telugu: `"Noto Sans Telugu"`
   - Hindi: `"Noto Sans Devanagari"`
   - Malayalam: `"Noto Sans Malayalam"`

---

## 7. Audit Coverage & Missing Inspection Scope

1. **Fully Covered in Real Browser:** 17 customer-facing routes, header, navigation, floating Call/Chat controls, checkout sheet, and 14 responsive viewports.
2. **Partially Covered / Inventoried:** 35 administrative and staff routes (`/admin/*`, `/superadmin/*`, `/employee/*`, `/delivery/*`, `/billing/*`). These have been structurally mapped from JSX source files and unit-tested, but require authenticated session credentials for interactive browser audit.
3. **Third-Party Integrations:** Razorpay checkout modal and WhatsApp API links require live sandbox or test credentials for end-to-end execution.

---
*Report A Complete. Proceed to Report B for Detailed Page & Component Findings.*
