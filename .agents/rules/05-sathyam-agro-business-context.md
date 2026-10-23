# Sathyam Agro Mart Business Context
## Domain Models, Workflows & Operational Requirements

### 1. Business Entities & Domain Model
- **Product Catalog**: Bio-pesticides, bio-fungicides, bio-stimulants, and organic agricultural inputs.
  - Multi-pack sizes (e.g. 250g, 500g, 1kg, 10kg) with per-pack pricing (`packagePrices`, `packageMrps`).
  - HSN codes (e.g. `31010099`, `3808`) and exact GST rates (0%, 5%, 12%, 18%) for tax invoice compliance.
- **Crop Categories**: Paddy/Rice, Cotton, Sugarcane, Banana, Vegetables, Pulses, Spices, Flowers, Plantation.
- **Agronomy Consultation**:
  - Certified agronomist directory (`/agronomy-experts`).
  - Consultation booking requests with customer details, crop type, and problem description.
  - Interactive Admin Assignment System (`/admin/agronomy-bookings`): Admins can reassign bookings to certified agronomists or field staff.
- **Soil Health Testing**:
  - Soil report upload, analysis, parameter grading (N, P, K, pH, EC, Organic Carbon), and automated product recommendations.
- **GST Invoicing**: Exact CGST/SGST/IGST breakdown, printable and downloadable invoices, customer billing records.
- **Order & Delivery Tracking**:
  - Order statuses: Pending, Confirmed, Dispatched, In-Transit, Delivered, Cancelled.
  - Automated WhatsApp alerts to customer and dispatch alerts to staff.
