---
name: frontend-ui-engineering
description: Use when structuring frontend architectures, creating reusable component design systems, managing design tokens, implementing accessible forms and modals, or ensuring WCAG 2.2 AA compliance.
---

# Frontend UI Engineering: Component & Token Architecture

## Overview

This skill provides the architectural foundation for scalable, accessible, and maintainable user interfaces. Grounded in design systems engineering principles (by Addy Osmani and modern Chrome/W3C guidelines), it bridges raw visual design with robust code structure.

---

## 1. Design Token System

Never hardcode arbitrary pixel values or ad-hoc hex codes across files. Establish centralized CSS custom properties in `:root`:

```css
:root {
  /* Spacing Scale (8pt grid system) */
  --space-2xs: 4px;
  --space-xs:  8px;
  --space-sm:  12px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Corner Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Semantic Color Tokens */
  --bg-canvas: #060b14;
  --bg-card: rgba(15, 23, 42, 0.65);
  --bg-card-hover: rgba(30, 41, 59, 0.7);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-highlight: rgba(56, 189, 248, 0.4);

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-cyan: #38bdf8;
  --accent-emerald: #10b981;
  --accent-rose: #f43f5e;

  /* Elevation & Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px -4px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 20px 40px -8px rgba(0, 0, 0, 0.6);
  --shadow-cyan-glow: 0 0 25px rgba(56, 189, 248, 0.25);
}
```

---

## 2. Component State Rigor

Every interactive element (button, input, select, card, modal) must implement 6 distinct lifecycle states:

1. **Default:** Clean, balanced, legible.
2. **Hover:** Clear cursor feedback (`cursor: pointer`), subtle border brightening, lift or glow.
3. **Focus-Visible:** Accessible keyboard focus ring (`outline: 2px solid var(--accent-cyan); outline-offset: 2px;`). Never disable outlines without providing an accessible alternative!
4. **Active (Pressed):** Physical tactile depression (`transform: scale(0.98)`).
5. **Loading / Pending:** Disabled pointer events, spinner animation, non-jarring layout width lock.
6. **Disabled:** Reduced opacity (`0.5`), `cursor: not-allowed`, no hover effects.

---

## 3. Accessible Form Engineering (WCAG 2.2 AA)

1. **Explicit Labels:** Every `<input>` and `<select>` must have an associated `<label>` using matching `id` and `for` attributes.
2. **Accessible Form Feedback:**
   - Error states must use color **AND** text/icon feedback (never color alone, per color-blindness guidelines).
   - Use `aria-describedby` for error message containers.
3. **Touch Targets:**
   - Mobile interactive elements must have a minimum tap area of **44 × 44 pixels** to prevent mis-taps.
4. **Autofill & Keyboard Support:**
   - Always set standard `autocomplete` attributes (e.g., `name`, `tel`, `email`, `organization`).
   - Support `Enter` key for primary actions and `Escape` key for closing open modals/dropdowns.

---

## 4. Modal & Dialog Best Practices

1. **Focus Trap:** When a modal is open, keyboard focus must stay trapped inside the modal.
2. **Scroll Lock:** Lock body scrolling when modal is active (`document.body.style.overflow = 'hidden'`).
3. **Backdrop Dismiss:** Clicking the backdrop or pressing `Escape` must cleanly close the dialog.
4. **ARIA Roles:** Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="dialogTitleId"`.

---

## 5. Resilient Layouts & Grid Systems

1. **Fluid Grid:** Use CSS Grid with `auto-fit` and `minmax()` to eliminate brittle media queries:
   ```css
   grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
   gap: var(--space-lg);
   ```
2. **Container Queries:** For modular components that adapt to parent container width rather than full viewport width:
   ```css
   .card-container {
     container-type: inline-size;
   }
   @container (min-width: 500px) {
     .card-layout { flex-direction: row; }
   }
   ```
