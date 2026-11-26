# SATHYAM AGROMART — UI & DESIGN SYSTEM QUALITY RULES
## Permanent Workspace Operating Instructions for UI/UX & Design Engineering

### 1. Non-Negotiable Design Philosophy
1. Visual hierarchy before decoration.
2. Consistency before creativity.
3. Usability before unnecessary animations.
4. Responsive behavior before desktop-only perfection.
5. Accessibility (WCAG 2.2 AA) before visual shortcuts.
6. Design tokens before arbitrary CSS values.
7. Reusable components before duplicated UI.
8. Performance before unnecessary visual effects.
9. Clear user intent before adding interface elements.
10. Production quality before declaring completion.

### 2. Design Tokens & Styling Architecture
- **Brand Colors**: Agricultural green (`#15803d` / `green-700`), earthy neutrals, clean high-contrast text (`#0f172a` primary, `#475569` secondary).
- **Spacing Scale (4px-based)**:
  - `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-5` (20px), `space-6` (24px), `space-8` (32px), `space-10` (40px), `space-12` (48px), `space-16` (64px).
  - Never use arbitrary margins or uncalculated paddings.
- **Typography Scale**: Display (40-48px), H1 (32-40px), H2 (26-32px), H3 (22-24px), H4 (18-20px), Body (14-16px), Caption (12px).
  - Preserve multilingual typography for Tamil, Telugu, Kannada, Hindi, Malayalam and English.
- **Radius Scale**: Small (6px), Medium (8px), Large (12px), Card (16px), Dialog (20px-24px), Pill (999px).

### 3. Component Design Standards
- **Buttons**:
  - Small (36px), Medium (44px), Large (48-52px). Minimum 44px touch targets on mobile.
  - Primary CTA: Visually dominant brand green (`#15803d`), white text, soft elevation.
  - Secondary CTA: Clean neutral border (`#cbd5e1`), high contrast text, subtle hover.
  - Consistent icon-to-label spacing (8px gap) and centered alignment.
- **Modals, Dialogs & Popups**:
  - Balanced width (440-520px for confirmation modals).
  - Consistent padding (20-24px desktop, mobile bottom sheet with safe-area padding).
  - Clear visual structure: Status badge, circular close button, product info box, action buttons.
  - Never allow buttons to clip, overflow, or touch the modal border.
  - Accessibility: `role="dialog"`, `aria-modal="true"`, `Escape` key closes, outside click handling, focus restoration.
- **E-Commerce Product Cards & Add-to-Cart Feedback**:
  - Clear product imagery with preserved aspect ratio (contain fit, no stretching).
  - Accurate pricing, variant pack size, discount badges, and immediate feedback.
  - Avoid duplicate notifications (never show both a toast and a modal simultaneously).

### 4. Responsive Design Engineering
- Verify across all standard viewports:
  - Mobile: 320px, 375px, 390px, 430px.
  - Tablet: 768px - 1023px.
  - Laptop / Desktop: 1024px, 1280px, 1440px+.
- Zero horizontal scrolling on mobile.
- Mobile bottom-sheet presentation for action popups.

### 5. Mandatory Verification Before Declaring Completion
1. `node --check server/server.js` (backend syntax check passes).
2. `npm run build` (Vite build passes with zero errors).
3. Chrome DevTools or live preview verification at mobile (375-390px), tablet (768px), and desktop (1280px+).
4. Full interactive check (buttons clickable, modals close, state updates).
5. Clean commit pushed to `rensog/main`.
