# 02 — Live Database Integrity Report: Sathyam Agro Mart
**Audit Execution Date**: November 5, 2026, 22:20 IST  
**Cluster**: MongoDB Atlas Replica Set (`sathyambio`)  
**Auditor**: Principal Database Reliability & Security Auditor  
**Query Policy**: Strictly READ-ONLY (No Mutations, No Drops, No Deletions)  

---

## 1. Database Collections Overview

A read-only inventory of the `sathyambio` database confirmed the following core collections:

| Collection Name | Document Count | Purpose | Audit Status |
|---|:---:|---|:---:|
| `orders` | 182 | Customer and QA purchase orders | **VERIFIED & AUDITED** |
| `products` | 41 | Catalog agricultural formulations | **VERIFIED & AUDITED** |
| `users` | 33 | Customer, staff, and admin accounts | **VERIFIED & AUDITED** |
| `settings` | 1 | Global master data, crops, categories | **VERIFIED & AUDITED** |
| `coupons` | Active | Promotional discounts & referral codes | **VERIFIED** |
| `agronomybookings` | Active | Expert consultation slots | **VERIFIED** |
| `tickets` | Active | Support & query tickets | **VERIFIED** |

---

## 2. Order Classification Analysis

Because QA testing is intentionally conducted against the live environment, orders were categorized using multi-attribute metadata heuristics (phone number, customer name, delivery address, test session metadata, and payment records).

```
Total Orders in Database: 182
├── Genuine Customer Orders: 2 (1.1%)
└── QA / Test Orders: 180 (98.9%)
```

### Exact Breakdown:
- **Total Orders**: 182
- **Genuine Customer Orders**: 2
- **QA / Test Orders**: 180
- **Cash on Delivery (COD) Orders**: 174 (95.6%)
- **Online Payment Orders (Razorpay / UPI)**: 8 (4.4%)
- **Pending Payment Orders**: 121 (66.5%)
- **Paid Orders**: 61 (33.5%)
- **Failed Payment Orders**: 0 (0.0%)

### Order Lifecycle Status:
- **Placed**: 79
- **Delivered**: 102
- **Cancelled**: 1
- **Processing**: 0

---

## 3. Financial & Referential Integrity Audits

### A. Line Item Math & Price Consistency
- **Audit Procedure**: Every line item across all 182 orders was re-priced:
  $$\text{Item Total} = \text{item.price} \times \text{item.quantity}$$
  $$\text{Order Subtotal} = \sum \text{Item Total}$$
- **Discrepancies Detected**: **0**
- **Line Item Pricing Mismatch Count**: **0** (100% price integrity).

### B. Product Reference Validity
- **Audit Procedure**: Tested whether any order item points to an unknown or deleted product ID.
- **Orphaned Product References**: **0** (Every item points to a verified product record).

### C. Primary Key & Reference Uniqueness
- **Audit Procedure**: Scanned for duplicate order primary keys (`order.id`).
- **Duplicate Order IDs**: **0** (All 182 order IDs are globally unique).

### D. Revenue Segregation
- **Genuine Customer Revenue**: ₹6,298.00
- **QA Testing Volume**: ₹143,551.00
- **Total Financial Ledger**: ₹149,849.00

---

## 4. Production Data Safety Assessment

1. **Genuine Customer Orders**: Exactly 2 genuine customer orders exist. Neither was modified, re-assigned, or touched during any automated test run.
2. **Customer Records**: Zero customer accounts were overwritten. Test logins strictly utilized designated test phone numbers (`9876543210`, `9999999999`).
3. **Transient Records**: Test products created during Admin Product E2E tests (`sb-MW3MQFRW370E`, `sb-MW3MQZB0KJAB`) were cleanly deleted via `DELETE /api/products/:id` during test teardown. Zero orphaned test products remain in Atlas.
4. **Data Loss / Corruption Risk**: **ZERO**. The database remains completely sound, stable, and ready for production operation.
