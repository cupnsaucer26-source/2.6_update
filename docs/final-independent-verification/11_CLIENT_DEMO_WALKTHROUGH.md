# 11 — Client Demonstration Walkthrough & Script: Sathyam Agro Mart
**Target Event**: Official Client Demonstration  
**Scheduled Date**: November 6, 2026  
**Demonstrator**: Product Engineering & Solutions Architecture Team  
**Designated Demo Account**: Farmer Murugan (Phone: `9876543210`, OTP: `123456`)  
**Designated Admin Account**: Salem Admin Murugan (`USR-MVQZ622I12TB`)  

---

## 1. Pre-Demo Checklist (15 Minutes Before Presentation)

- [ ] Ensure full-stack server is running on `http://localhost:5000` (backed by MongoDB Atlas `sathyambio`).
- [ ] Confirm public fallback is accessible at `https://www.sathyamagromart.com`.
- [ ] Open a fresh, normal Chrome browser window (maximized to standard full desktop).
- [ ] Ensure the browser zoom is set to 100%.
- [ ] Have test credentials ready: Phone `9876543210` (Bypass OTP: `123456`).

---

## 2. Practical Step-by-Step Demo Sequence

### Phase A: Customer Discovery & Catalog Navigation (No DB Mutation)
1. **Open Homepage**:
   - Navigate to `http://localhost:5000`.
   - Point out the branding, dual-language capabilities (Tamil & English), and the responsive header.
2. **Dynamic Crop Filtering**:
   - Scroll to **"Shop by Crop"**.
   - Highlight the dynamic crop options (Paddy, Cotton, Turmeric, Sugarcane, Banana, Groundnut, etc.).
   - Click **Paddy**: Show how the product catalog instantly filters to paddy-specific crop protection formulations.
3. **Category Filtering**:
   - Click **Bio Fertilizers** or **Crop Protection** in the category pill bar.
   - Show how the grid immediately adjusts without a full-page refresh.
4. **Product Detail Page**:
   - Click on **Shakthi Gold Gel** (or **Carbonzyme 10kg**).
   - Highlight packaging artwork, detailed dosage guidelines (*"2.5 ml per litre of water"*), storage conditions, and customer reviews.
   - Switch pack sizes (e.g. 500ml vs 1L) to show dynamic price and savings recalculation.

### Phase B: Cart & Checkout Experience
5. **Add to Cart & Quantity Stepper**:
   - Click **Add to Cart**.
   - Show the cart badge update in the top navbar and the sticky mobile action bar.
   - Open the cart drawer; use the `+` stepper to increase quantity to 2; show the line total recalculating to ₹5,998.00.
6. **Proceed to Checkout**:
   - Click **Checkout**.
   - Enter demo farmer delivery details:
     - Name: `Demo Farmer Murugan`
     - Mobile: `9876543210`
     - Address: Door `12/4`, Street `Agro Farm Road`, Area `Greenfield`, Taluk `Salem South`, District `Salem`, State `Tamil Nadu`, Pincode `636001`.
   - Highlight the delivery date calculation (2–3 business days).

### Phase C: Order Placement & Order Success Flow (Creates Production Test Record)
> [!NOTE]
> **Production Mutation Notice**: This step creates one COD test order record in MongoDB Atlas under test phone `9876543210`. It does NOT trigger real payment charges.

7. **Place Order**:
   - Select payment method: **Cash on Delivery**.
   - Click **Place Order**.
8. **Showcase Order Success Modal**:
   - **Key Demonstration Point**: Show that the checkout modal stays firmly pinned to the new **"SUCCESSFUL ORDER PLACED!"** screen.
   - Demonstrate the **Copy Order ID** button: click it and show the confirmation toast notification.
   - Point out the expected delivery date and the WhatsApp confirmation notice.
9. **Showcase Order Tracking**:
   - Click the green **"TRACK YOUR ORDER"** button.
   - Observe the smooth transition to the `/orders` page.
   - Point out that the newly placed order card is immediately highlighted with an **emerald green ring** and a **"Newly Placed Order"** badge, automatically scrolled to the center of the viewport.

### Phase D: Administrator Operations & Management
10. **Admin Panel Access**:
    - Navigate to `/admin`.
    - Authenticate using the administrator profile.
11. **Order Management**:
    - Open **Orders**: locate the newly placed demo order at the top of the list.
    - Show order details: customer phone, delivery address, line items, and payment mode (`Cash on Delivery`).
    - Demonstrate an order status change from `Placed` to `Processing`.
12. **Product Catalog Management**:
    - Open **Products**: show the 41 active products with image thumbnails, stock levels, and category badges.
    - Demonstrate dynamic price or stock adjustment: show that editing a product in Admin reflects instantly on the public storefront.
13. **Settings & Dynamic Master Data**:
    - Open **Settings**: show how adding a custom crop or category in the admin panel dynamically updates the storefront dropdowns without touching code.

---

## 3. Post-Demo Safety Assurance
- The demo order created during the walkthrough will reside safely under test account `9876543210`.
- Genuine customer records and historical transactions remain completely unaffected.
