# UI & Design Quality Guidelines
## Sathyam Agro Mart / Farmer-First Design Standards

### 1. Visual Integrity & Branding
- **Color Palette**: Agricultural green theme (`#15803d` / `bg-emerald-700` / `green-700`), earthy neutrals, clean high-contrast typography suitable for rural and outdoor sunlight readability.
- **Reference Designs**: Respect existing layout structures from reference mockups, mobile navigation bar, floating action buttons (Enquiry form, Chatbot doctor, WhatsApp support).
- **Responsive Layouts**: Designed mobile-first. Verified across small mobile screens (360px - 414px), tablets (768px - 1024px), and desktop displays.

### 2. Interaction & Component Consistency
- **Touch Targets**: All interactive elements (buttons, inputs, select boxes, tabs) must have a minimum touch target height of 40-44px on mobile devices.
- **Form Controls & Alignment**: Dropdowns, text inputs, and buttons in data tables must maintain consistent vertical alignment, normalized font sizes, and centered text/icons.
- **State Handling**: Always implement loading skeletons/spinners, empty states with helpful guidance, and non-blocking toast notifications for errors and successes.
- **Layout Shift Prevention**: Reserve dimensions for product cards, badges, and media to prevent cumulative layout shift (CLS).
- **Real Browser Verification**: Verify complex UI components in a real browser (via Chrome DevTools or live preview) before marking tasks complete.
