# SATHYAM AGROMART
# INLINE FEEDBACK DESIGN SYSTEM SPECIFICATION
## Master UI/UX Design System for Contextual, High-Contrast Agricultural Commerce

---

## 1. Design Tokens & Visual Hierarchy

The Inline Feedback System adheres strictly to the Sathyam AgroMart Master Design System tokens defined in `src/index.css` and `docs/design-system/SATHYAM_AGROMART_DESIGN_SYSTEM.md`.

### 1.1 Color Palette & Semantic Tones

| Feedback Type | Background Token | Border Token | Text Token | Icon Token |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `var(--color-feedback-success-bg, #f0fdf4)` | `var(--color-feedback-success-border, #bbf7d0)` | `var(--color-feedback-success-text, #166534)` | `var(--color-feedback-success-icon, #15803d)` |
| **Error** | `var(--color-feedback-error-bg, #fef2f2)` | `var(--color-feedback-error-border, #fecaca)` | `var(--color-feedback-error-text, #991b1b)` | `var(--color-feedback-error-icon, #dc2626)` |
| **Warning** | `var(--color-feedback-warning-bg, #fffbeb)` | `var(--color-feedback-warning-border, #fde68a)` | `var(--color-feedback-warning-text, #92400e)` | `var(--color-feedback-warning-icon, #d97706)` |
| **Info** | `var(--color-feedback-info-bg, #f0f9ff)` | `var(--color-feedback-info-border, #bae6fd)` | `var(--color-feedback-info-text, #075985)` | `var(--color-feedback-info-icon, #0284c7)` |
| **Loading** | `var(--color-surface, #ffffff)` | `var(--color-border-subtle, #e2e8f0)` | `var(--color-text-secondary, #475569)` | `var(--color-primary, #15803d)` |

### 1.2 Spacing & Geometry (Strict 4px Scale)
- **Container Padding**: Desktop `14px 16px` (`space-3.5` x `space-4`), Compact/Mobile `10px 12px` (`space-2.5` x `space-3`).
- **Border Radius**: `12px` (`var(--radius-lg)`), harmonized with card containers.
- **Border Width**: `1.5px solid`, ensuring visual clarity on outdoor low-brightness mobile screens.
- **Icon Gap**: `12px` (`space-3`) between icon container and text block.
- **Touch Target**: Dismiss buttons and action controls strictly maintain minimum `44px x 44px` clickable area.

### 1.3 Micro-Animations
- **Entry**: `transform: translateY(-4px)`, transitioning to `translateY(0)` with `opacity: 1` over `180ms ease-out`.
- **Exit**: Fade out with `140ms ease-in`.

---

## 2. Component Suite & Usage

The system exposes clean, specialized React components from `src/components/common/InlineFeedback.jsx`:

### 2.1 Standard Contextual Banner (`InlineFeedback`)
```jsx
import { InlineFeedback } from '@/components/common/InlineFeedback'

<InlineFeedback
  type="success" // 'success' | 'error' | 'warning' | 'info' | 'loading'
  title="Profile Updated"
  message="Your farm location and preferred language have been saved."
  action={{ label: 'View Settings', onClick: handleView }}
  onDismiss={() => setShowFeedback(false)}
/>
```

### 2.2 Inline Form Field Validation (`InlineValidation`)
Mounted directly below inputs (e.g. phone number, coupon code, password fields):
```jsx
import { InlineValidation } from '@/components/common/InlineFeedback'

<input type="tel" className={error ? 'input-error' : ''} ... />
<InlineValidation message={phoneError} />
```

### 2.3 Contextual Empty State (`InlineEmptyState`)
Mounted inside tables, drawers, or product grids when zero records match:
```jsx
import { InlineEmptyState } from '@/components/common/InlineFeedback'

<InlineEmptyState
  title="No Orders Found"
  description="You have not placed any orders matching this filter."
  action={{ label: 'Browse Products', onClick: () => navigate('/') }}
  icon="fa-solid fa-basket-shopping"
/>
```

---

## 3. Placement & Positioning Rules

### 3.1 Forms & Authentication Modals
- **Placement**: Directly above the submit action or between the form title and first input field.
- **Behavior**: Persistent until user mutates an input field or resubmits.
- **Accessibility**: Automatically carries `role="alert"` and `aria-live="assertive"`.

### 3.2 Add to Basket Action
- **Placement**: Displays the centered modal dialog (`AddedToCartModal`), blurring the background with `backdrop-filter: blur(4px)`.
- **Content**: Clean product thumbnail, name, selected pack size, quantity, calculated price with MRP savings, and two full-width/side-by-side action buttons:
  1. `+ Add More Products`: Dismisses the modal and retains current catalog position.
  2. `Go to Cart & Checkout`: Opens basket / checkout drawer.
- **No Floating Layer**: No toast message appears simultaneously on the corner of the screen.

### 3.3 Shopping Cart & Checkout Drawer
- **Coupon Feedback**: Inline alert container rendered directly beneath the coupon apply button.
- **Delivery Availability**: High-contrast banner rendered directly under the delivery address card.
- **Payment Errors**: Inline alert rendered immediately above the "Pay Now" trigger button.

### 3.4 Operational & Admin Portals
- **Bulk Table Actions**: Renders in the table toolbar banner above column headers.
- **Form Drawer Mutations**: Sticky footer banner above the "Save / Update" buttons.

---

## 4. Accessibility & Quality Checklist

- [x] **WCAG 2.2 AA Compliance**: Text contrast meets or exceeds `4.5:1` ratio against light background tokens.
- [x] **Aria Roles**: `role="alert"` for critical errors; `role="status"` for non-critical confirmations.
- [x] **Zero Layout Shift (CLS)**: Smooth inline height expansion with `overflow: hidden`.
- [x] **Touch Targets**: All interactive elements (close buttons, action buttons) have >= `44px` bounding boxes.
- [x] **Multilingual Support**: Supports Tamil, English, Telugu, Kannada, Hindi, and Malayalam typography.
