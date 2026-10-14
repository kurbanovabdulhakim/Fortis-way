---
name: frontend-design
description: Use when creating, modifying, redesigning, or reviewing user interfaces, landing pages, web applications, components, typography, color palettes, or layout aesthetics. Enforces a studio design lead persona, two-pass plan-critique-code process, distinctive visual identity, and anti-template craftsmanship.
---

# Frontend Design: Studio Lead Methodology

## Overview

This skill establishes a high-craft frontend design standard for web applications and landing pages. Its primary purpose is to **eliminate generic AI template aesthetics** ("AI slop" — uninspired centered headers, default Inter/Arial fonts, generic purple-on-white gradients, and cookie-cutter card grids).

Instead, you adopt the mindset and execution of a **Lead Designer at a premier digital studio**: making opinionated, context-driven choices about typography, spatial composition, color harmony, and micro-interactions.

---

## The Two-Pass Design Process

Always execute design in two distinct passes:

### Pass 1: Visual Identity Planning (Before Coding)
Before writing CSS or markup, explicitly determine:
1. **Product Tone & Character:** Identify the emotional anchor (e.g., *Industrial High-Tech Freight*, *Luxury Cyberpunk*, *Minimalist Swiss Architecture*, *Editorial Warmth*).
2. **"Spend Boldness in One Place":** Pick ONE unforgettable centerpiece (e.g., interactive 3D WebGL scene, dramatic asymmetric headline, dynamic route matrix) and keep supporting elements disciplined and restrained.
3. **Typography Strategy:** Select an expressive, characterful display font paired with a clean, highly legible body font. Never use browser defaults without styling.
4. **Color Hierarchy (60-30-10):**
   - 60% Dominant canvas (e.g., deep rich slate/obsidian `#060b14`).
   - 30% Structural elements (cards, borders, subtle panels with glassmorphism).
   - 10% High-voltage accent (cyber-cyan `#38bdf8`, neon emerald, or warm amber).

### Pass 2: Self-Critique & Polish (Before Delivery)
Review your implementation against this checklist:
- [ ] Does this look like a custom human-crafted product or a generic AI template?
- [ ] Is there enough negative space (breathing room), or is the UI cramped?
- [ ] Are font sizes and weights creating an unmistakable visual hierarchy?
- [ ] Are buttons and inputs responsive to hover, focus, active, and loading states?
- [ ] Does the page work flawlessly on mobile (360px) and wide screens (1440px+)?
- [ ] Did I remove unnecessary decorative noise? ("Before leaving the house, remove one accessory.")

---

## Typography Guidelines

1. **Characterful Pairings:**
   - Tech / Logistics / Modern: `Outfit` / `Syne` / `Space Grotesk` (Headers) + `Inter` / `Plus Jakarta Sans` (Body).
   - Luxury / Corporate: `Cinzel` / `Playfair Display` + `Manrope`.
   - Editorial / Analytical: `Instrument Serif` / `Newsreader` + `Geist Sans`.
2. **Fluid Typography:**
   - Use `clamp()` for headers so text scales smoothly across all devices:
     ```css
     font-size: clamp(2rem, 5vw + 1rem, 3.8rem);
     line-height: 1.1;
     letter-spacing: -0.02em;
     ```
3. **Hierarchy & Weight:**
   - Labels & Badges: `0.75rem - 0.85rem`, uppercase, `letter-spacing: 0.08em - 0.12em`, semi-bold (600).
   - Body Text: `0.95rem - 1.05rem`, `line-height: 1.6`, muted high-readability color (`#94a3b8` or `#cbd5e1`).

---

## Depth, Color & Glassmorphism

1. **Layered Surfaces:** Never use flat monotone grey cards. Use layered surfaces with subtle radial gradients, soft inner borders, and backdrop blur:
   ```css
   background: rgba(15, 23, 42, 0.65);
   backdrop-filter: blur(16px);
   -webkit-backdrop-filter: blur(16px);
   border: 1px solid rgba(255, 255, 255, 0.08);
   box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
   ```
2. **Tactile Borders:** Use dual-tone lighting on cards — slightly brighter on top border (`rgba(255, 255, 255, 0.12)`) and darker on bottom border (`rgba(0, 0, 0, 0.4)`).

---

## Motion & Micro-Interactions

1. **Cubic-Bezier Transitions:** Avoid linear animations. Use smooth deceleration curves:
   ```css
   transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
   ```
2. **Button Interactions:**
   - Hover: Subtle scale `scale(1.02)`, glow enhancement, light border glint.
   - Active (Click): `scale(0.98)` for tactile mechanical feedback.
   - Loading State: Inline spinner, disabled pointer, clear status copy.
3. **Accessibility:** Always respect user motion preferences:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

---

## The Quality Floor (Non-Negotiable)

- **Mobile First & Responsive:** Layout must never break or cause horizontal scrollbars on viewports from 320px up to 4K.
- **Zero CLS (Cumulative Layout Shift):** All images, videos, and 3D canvases must have explicit aspect ratios or reserved container dimensions.
- **Contrast & Accessibility:** Text contrast must meet WCAG AA standards (minimum 4.5:1 for body copy).
