# FortisWay Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the FortisWay website into a premier multi-modal logistics portal with UzPochta-style interactive Hero & express calculator, 4 cinematic transport sections with scroll-driven vehicle motion, Unity-Trans route matrix, and a protected B2B corporate requisites gateway.

**Architecture:** Modern semantic HTML5, Vanilla CSS Dark Tech design system with hardware-accelerated SVG vehicle animations, and modular Vanilla JS for calculator logic, scroll intersection observers, and client-side session auth state.

**Tech Stack:** HTML5, CSS3 (Custom Properties, Glassmorphism, CSS Transitions/Keyframes), Vanilla JavaScript (ES6+, IntersectionObserver, Clipboard API, SessionStorage).

**Spec:** `docs/superpowers/specs/2026-10-14-fortisway-portal-redesign.md`

## Global Constraints
- Unified contact phone: `+998 (93) 555-22-62` (callable link `tel:+998935552262`)
- Unified Telegram handle: `@LogisticsFortisway` (`https://t.me/LogisticsFortisway`)
- WhatsApp link: `https://wa.me/998935552262`
- Requisites of OOO «FORTISWAY» must match exact user values: INN 313334329, ОКЭД 49410, р/с 20208000607538177001, Банк АКИБ «Ipak Yo'li» Чиланзарский филиал, МФО 01067, адрес г. Ташкент, Яшнабадский район, МСГ Тойтепа, ул. Садика Азимова, 3-й проезд, д. 20.
- Requisites must be hidden/locked by default and unlocked only upon user authorization.
- Zero heavyweight external framework or video dependencies; 60fps lightweight performance.

## Review Focus
1. Direction swap button in Hero calculator (`⇄`) correctly swaps Country/City From & To without breaking slider states.
2. Animated vehicles (Truck, Train, Airplane, Ship) trigger smoothly via `IntersectionObserver` when scrolled into view and reset/replay elegantly.
3. Protected Requisites remain secure across page reloads using `sessionStorage` once logged in, with a clean "Выйти / Заблокировать" button.
4. One-click copy buttons for INN, Account number, and full requisites provide clear visual feedback ("Скопировано!").
5. Floating action bar supports Telegram, WhatsApp, and Direct Call on mobile screens.

---

### Task 1: Hero Section & UzPochta-Style Floating Dual-Column Calculator
**Files:**
- Modify: `index.html` (Hero section)
- Modify: `css/style.css` (Hero & Calculator styles)
- Modify: `js/main.js` (Calculator swap and calculation logic)

- [ ] **Step 1: Update Hero HTML in `index.html` with dual-column layout and floating calculator**
  - Left column: Main headline, trust badges, WhatsApp/Telegram/Call buttons.
  - Right column: UzPochta-style card with Country/City selects, swap button (`⇄`), weight/volume controls, toggles, instant quote preview, and Telegram booking CTA.
- [ ] **Step 2: Add styles in `css/style.css` for the floating card, swap button, and dual-column hero**
- [ ] **Step 3: Update `js/main.js` with swap direction handler and dynamic pricing formula**
- [ ] **Step 4: Verify Hero layout and calculator functionality**

---

### Task 2: 4 Dedicated Transport Sections with Scroll-Driven Motion (Auto, Rail, Air, Sea)
**Files:**
- Modify: `index.html` (Transport sections)
- Modify: `css/style.css` (Transport section themes, vehicle layers, animations)
- Modify: `js/main.js` (Scroll trigger observer)

- [ ] **Step 1: Structure 4 distinct full-width transport sections in `index.html`:**
  - Section 1: 🚛 Автоперевозки (FTL & LTL)
  - Section 2: 🚆 Железнодорожные перевозки (Контейнерные поезда & вагоны)
  - Section 3: ✈️ Авиаперевозки (Cargo Express 24-72ч)
  - Section 4: 🚢 Мультимодальные & Морские перевозки (Паромы Каспия, Черное море)
- [ ] **Step 2: Add ambient background scenes and animated vehicle elements in `css/style.css`:**
  - Euro-truck moving on highway track with illuminated headlights.
  - Container freight train moving along railway tracks.
  - Cargo aircraft climbing through cloud layer.
  - Container ship/ferry gliding across water with wave shimmer.
- [ ] **Step 3: Implement `IntersectionObserver` in `js/main.js` to trigger vehicle animation as sections scroll into viewport**
- [ ] **Step 4: Verify smooth 60fps animation and mobile responsiveness**

---

### Task 3: Popular Freight Routes & Rate Matrix (Unity-Trans Style)
**Files:**
- Modify: `index.html` (Routes & Tariffs table section)
- Modify: `css/style.css` (Table styles, responsive cards for mobile)

- [ ] **Step 1: Add transparent routes & pricing table in `index.html` (Москва, СПб, Стамбул, Урумчи, Алматы)**
- [ ] **Step 2: Add CSS in `css/style.css` for high-contrast dark table with hover highlights and mobile card fallback**
- [ ] **Step 3: Link table row CTA buttons to pre-populate Hero calculator with route parameters**

---

### Task 4: Protected Corporate Requisites Block & Multi-Modal Authorization Gateway (3-in-1)
**Files:**
- Modify: `index.html` (Requisites block & Auth modal)
- Modify: `css/style.css` (Locked frosted-glass styles, badge, modal)
- Modify: `js/main.js` (Auth state controller, tab switcher, clipboard copy)

- [ ] **Step 1: Add Requisites section in `index.html` with blurred/locked container and "Авторизоваться" CTA**
- [ ] **Step 2: Add Authorization Gateway Modal in `index.html` with 3 tabs:**
  - Tab 1: Lead capture (Company + Phone)
  - Tab 2: Partner Login (login: `partner`, pass: `2026`)
  - Tab 3: Telegram Verification (`@LogisticsFortisway`)
- [ ] **Step 3: Add unlocked requisites markup with exact OOO «FORTISWAY» data and copy buttons**
- [ ] **Step 4: Implement auth controller in `js/main.js` with `sessionStorage` persistence and clipboard copy helper**
- [ ] **Step 5: Verify lock/unlock behavior and clipboard copying**

---

### Task 5: Mobile Polish, Deployment & Live Verification
**Files:**
- Modify: `index.html`, `css/style.css`, `js/main.js`
- Create: `fortisway.zip`
- Deploy: `https://ship.page/deploy`

- [ ] **Step 1: Audit all contact points (Phone `+998 93 555 22 62`, TG `@LogisticsFortisway`, WhatsApp)**
- [ ] **Step 2: Sync all updated files from artifact directory to `C:\Users\user\GitHub\fortisway\`**
- [ ] **Step 3: Package site into zip archive and deploy to free public domain via `curl`**
- [ ] **Step 4: Run verification tests on live URL (HTTP 200 checks, asset integrity)**
- [ ] **Step 5: Present the active live link to the user**
