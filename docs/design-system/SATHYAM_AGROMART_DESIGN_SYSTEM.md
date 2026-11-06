# SATHYAM AGROMART — MASTER UI/UX DESIGN SYSTEM, DESIGN ENGINEERING & FRONTEND QUALITY RULES

## ROLE & RESPONSIBILITY
As the Principal Product Designer, Senior UI/UX Architect, Design Systems Engineer, and Senior Frontend Engineer responsible for Sathyam AgroMart:
- Build and maintain a consistent, professional, production-grade digital commerce experience across the entire Sathyam AgroMart platform.
- Think and work like a world-class product team combining enterprise-grade product design, modern e-commerce UX, design tokens, responsive web architecture, accessibility engineering (WCAG 2.2 AA), and conversion-focused design.
- Every interface must look intentionally designed, properly aligned, visually balanced, accessible, and production-ready.
- NEVER generate random layouts, arbitrary spacing, inconsistent typography, or visually unfinished components.

---

## PART 1 — PERMANENT PROJECT DESIGN RULES

### 1.1 Non-Negotiable Design Philosophy
1. Visual hierarchy before decoration.
2. Consistency before creativity.
3. Usability before unnecessary animations.
4. Responsive behavior before desktop-only perfection.
5. Accessibility before visual shortcuts.
6. Design tokens before arbitrary CSS values.
7. Reusable components before duplicated UI.
8. Performance before unnecessary visual effects.
9. Clear user intent before adding interface elements.
10. Production quality before declaring completion.

Every element must have a purpose. Do not add elements merely to fill empty space. Do not compress elements merely to fit more content. Use negative space intentionally. Every section must have a clear visual relationship with surrounding sections.

### 1.2 Reference Quality Benchmarks
- **Apple**: Visual hierarchy, typography, whitespace, precision.
- **Stripe**: Structured layouts, information architecture, forms.
- **Shopify**: E-commerce workflows and merchant usability.
- **Linear**: Spacing consistency, component precision, interaction quality.
- **Airbnb**: Responsive interfaces and clear user journeys.
- **Amazon**: Product information density and shopping usability.
- **Material Design 3**: Interaction patterns, accessibility, and component behavior.

---

## PART 2 — DESIGN SYSTEM ARCHITECTURE

### 2.1 Color System & Semantic Tokens
The official brand palette centers on agricultural green (`#15803D` / Emerald 700), earthy neutrals, and clear status signals.

```css
:root {
  /* Brand Primary */
  --color-primary: #15803D;
  --color-primary-hover: #166534;
  --color-primary-active: #14532D;
  --color-primary-subtle: #F0FDF4;
  --color-primary-border: #BBF7D0;

  /* Secondary & Accents */
  --color-secondary: #0F172A;
  --color-secondary-hover: #1E293B;
  --color-accent: #EAB308;
  --color-accent-hover: #CA8A04;

  /* Surfaces & Backgrounds */
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F1F5F9;
  --color-surface-elevated: #FFFFFF;

  /* Typography */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;
  --color-text-disabled: #94A3B8;
  --color-text-inverse: #FFFFFF;

  /* Borders & Dividers */
  --color-border: #E2E8F0;
  --color-border-subtle: #F1F5F9;
  --color-border-hover: #CBD5E1;
  --color-divider: #E2E8F0;

  /* Feedback & Status */
  --color-success: #15803D;
  --color-success-bg: #DCFCE7;
  --color-success-border: #86EFAC;
  --color-warning: #D97706;
  --color-warning-bg: #FEF3C7;
  --color-warning-border: #FCD34D;
  --color-error: #DC2626;
  --color-error-bg: #FEE2E2;
  --color-error-border: #FCA5A5;
  --color-info: #2563EB;
  --color-info-bg: #DBEAFE;
  --color-info-border: #93C5FD;
}
```

### 2.2 Typography Scale
Primary font stack: `Plus Jakarta Sans`, `Inter`, system fallback. Headings and currency: `Outfit`, `Poppins`. Indian Languages: `Noto Sans Tamil`, `Noto Sans Telugu`, `Noto Sans Kannada`, `Noto Sans Devanagari`, `Noto Sans Malayalam`.

- **Display**: 40–48px | Line-height 1.15 | Weight 800
- **H1**: 32–40px | Line-height 1.2 | Weight 800
- **H2**: 26–32px | Line-height 1.25 | Weight 700
- **H3**: 22–24px | Line-height 1.3 | Weight 700
- **H4**: 18–20px | Line-height 1.35 | Weight 600–700
- **Body Large**: 16–18px | Line-height 1.5 | Weight 400–500
- **Body**: 14–16px | Line-height 1.5 | Weight 400–500
- **Supporting / Small**: 13–14px | Line-height 1.45 | Weight 400–500
- **Caption / Meta**: 12px | Line-height 1.4 | Weight 500–600

### 2.3 Strict 4px Spacing Scale
| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Micro spacing, icon/text gap |
| `space-2` | 8px | Compact element spacing, badge padding |
| `space-3` | 12px | Input internal padding, card gap |
| `space-4` | 16px | Standard component gap, modal internal gap |
| `space-5` | 20px | Card padding, mobile sheet horizontal padding |
| `space-6` | 24px | Standard card/modal padding |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Large content separation |
| `space-12` | 48px | Major section separation |
| `space-16` | 64px | Page container vertical padding |

### 2.4 Container & Layout System
- **Standard content**: `max-width: 1200px`
- **Wide content**: `max-width: 1280px`
- **Extra-wide content**: `max-width: 1440px`
- Fluid widths with intentional maximum constraints.
- No horizontal overflow anywhere (`overflow-x: hidden` safety on root layouts).

---

## PART 3 — RESPONSIVE BREAKPOINTS
- **Small mobile**: `320px–374px`
- **Standard mobile**: `375px–479px`
- **Large mobile**: `480px–767px`
- **Tablet**: `768px–1023px`
- **Laptop**: `1024px–1279px`
- **Desktop**: `1280px–1439px`
- **Large desktop**: `1440px+`

### Rules
- Mobile-first engineering: Ensure touch targets are >= 44px height.
- Modals on mobile switch to ergonomic bottom-sheets respecting `env(safe-area-inset-bottom)`.
- Never compress multi-column desktop grids into tiny horizontal cramped rows on mobile; stack with intentional spacing.

---

## PART 4 — COMPONENT DESIGN STANDARDS

### 4.1 Buttons
- **Heights**: Small: 36px, Medium: 44px, Large: 48–52px.
- **Primary CTA**: Dominant, `#15803D` / gradient `#15803D -> #166534`, white text, soft elevation `0 4px 14px rgba(21, 128, 61, 0.28)`.
- **Secondary CTA**: Neutral outline or subtle fill, border `1.5px solid #CBD5E1`, text `#334155`, hover `#F8FAFC`.
- **Icon Alignment**: Centered inline-flex with `gap: 8px`. Icon size: 14–16px.
- **Interaction States**: Hover (translateY -1px, shadow deepen), active (translateY 0), focus-visible (2px offset ring).

### 4.2 Cards
- Elevation: Clean, subtle multi-layered shadows without murky dark edges: `0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)`.
- Padding: 16px to 24px.
- Radius: `12px` (cards), `16px` (large cards), `20px–24px` (modals).

---

## PART 5 — MODALS, POPUPS & DIALOG STANDARDS

### 5.1 Architecture
1. **Backdrop**: `rgba(15, 23, 42, 0.65)` with backdrop blur `4px-6px`.
2. **Card**: Centered, balanced width (`420px–500px` for confirmation/action dialogs).
3. **Header**: Status badge on left, circular close button on right (`32-36px`, centered icon).
4. **Content Box**: Structured product card with thumbnail, title (2-line clamp safety), variant/pack pill, quantity, and price.
5. **Action Area**: High-contrast primary action and secondary continue action.
6. **Accessibility**: `role="dialog"`, `aria-modal="true"`, `Escape` key closes, click-outside handling, focus management.
7. **Mobile Form Factor**: Converts to bottom sheet (`border-radius: 24px 24px 0 0`), stacked action buttons with safe area padding.

---

## PART 6 — E-COMMERCE UX & ADD-TO-CART FEEDBACK
- When a user adds a product to the cart:
  - Display the Add to Basket dialog immediately.
  - Show the actual product image, name, pack size, price, and savings where applicable.
  - Provide two balanced options: Continue shopping ("Add More Products") vs Proceed to checkout ("Go to Cart & Checkout").
  - Do NOT double-notify with overlapping toast banners.

---

## PART 7 — ACCESSIBILITY & PERFORMANCE
- WCAG 2.2 AA compliant contrast (minimum 4.5:1 for normal text, 3:1 for large headings/badges).
- Keyboard operable: `Escape` closes dialogs, `Tab` navigates through focusable controls with visible focus rings.
- Zero cumulative layout shift (CLS).
- Responsive images with fallback placeholders.

---

## PART 8 — PRE-COMPLETION DESIGN REVIEW CHECKLIST
Before declaring any UI task complete:
- [ ] Visual hierarchy: Clear title, secondary info, primary CTA.
- [ ] Spacing: Verified against 4px tokens (no arbitrary margins/paddings).
- [ ] Typography: High contrast, correct weights, readable line heights.
- [ ] Component boundaries: No overflowing text, no clipped buttons.
- [ ] Responsive testing: 360px mobile, 390px mobile, 768px tablet, 1280px+ desktop.
- [ ] Business logic preservation: Cart state, pricing calculation, navigation intact.
- [ ] Code quality: Zero build errors, syntax checks pass, clean git commit.
