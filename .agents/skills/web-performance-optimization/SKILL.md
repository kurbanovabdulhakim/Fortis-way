---
name: web-performance-optimization
description: Use when optimizing website loading speed, Core Web Vitals (LCP, INP, CLS), animation frame rates (60/120 FPS), WebGL/Three.js GPU resource management, font loading, or asset delivery.
---

# Web Performance & Core Web Vitals Optimization

## Overview

High visual design quality must never come at the expense of runtime performance. This skill establishes guidelines for achieving top-tier **Google Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)** and maintaining a smooth **60/120 FPS animation budget**, even when running rich 3D WebGL scenes.

---

## 1. Core Web Vitals (CWV) Targets & Solutions

### A. Largest Contentful Paint (LCP < 2.5s)
- **Problem:** Hero image or primary heading takes too long to render.
- **Rules:**
  1. Preload the primary above-the-fold image:
     ```html
     <link rel="preload" as="image" href="/assets/hero.webp" fetchpriority="high">
     ```
  2. Never lazy-load the hero image! Lazy-loading (`loading="lazy"`) is only for images **below the fold**.
  3. Inline critical above-the-fold CSS directly in the `<head>` to prevent render-blocking stylesheet waterfalls.

### B. Interaction to Next Paint (INP < 200ms)
- **Problem:** Heavy JavaScript calculations or unoptimized event handlers block the main browser thread when user taps or clicks.
- **Rules:**
  1. Debounce and throttle real-time slider inputs and scroll listeners (e.g. calculator sliders, window resize).
  2. Use `requestAnimationFrame` for DOM updates tied to visual animations.
  3. Keep JavaScript execution chunks under 50ms (avoid Long Tasks). Break heavy tasks using `setTimeout(..., 0)` or `scheduler.yield()`.

### C. Cumulative Layout Shift (CLS < 0.1)
- **Problem:** Content jumps around during page load as images, fonts, or dynamic cards load in.
- **Rules:**
  1. **Always specify explicit `width` and `height`** (or CSS `aspect-ratio`) on all `<img>`, `<video>`, and `<canvas>` elements.
  2. Reserve container space for dynamic content, alerts, or calculator results before they appear.
  3. Use `font-display: swap` alongside matching font-metric fallbacks to eliminate layout shift on custom font swap.

---

## 2. WebGL & Three.js 60/120 FPS Performance Architecture

When integrating 3D scenes (canvases, shaders, particle systems):

1. **Mandatory Off-Screen Pausing (`IntersectionObserver`):**
   Never render Three.js scenes when their canvas is outside the viewport! This wastes GPU power and drains laptop batteries:
   ```javascript
   let isVisible = false;
   const observer = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       isVisible = entry.isIntersecting;
       if (isVisible) renderScene();
     });
   }, { threshold: 0.1 });
   observer.observe(canvas);

   function renderScene() {
     if (!isVisible) return;
     requestAnimationFrame(renderScene);
     // ... render loop ...
   }
   ```
2. **Cap Device Pixel Ratio:**
   Retina and 4K displays often have `devicePixelRatio = 3+`, which triples GPU fragment shader cost. Always clamp to a maximum of 2:
   ```javascript
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   ```
3. **Geometry & Material Sharing:**
   Reuse geometries and materials across cloned meshes instead of instantiating new geometries in loops.
4. **Clean Disposal:**
   When removing canvas elements, always dispose of geometries, textures, and materials (`geo.dispose()`, `mat.dispose()`) to prevent GPU memory leaks.

---

## 3. High-Performance CSS & Animations

1. **Composite-Only Properties:**
   Only animate `transform` and `opacity`. These are handled directly by the browser compositor on the GPU and do NOT trigger costly layout reflows or repaints:
   - ✅ `transform: translateY(-8px); opacity: 0.9;`
   - ❌ `top: -8px; height: 200px; margin-top: 10px;` (triggers full layout recalculation!)
2. **Conservative `will-change`:**
   Use `will-change: transform` only on actively animating elements, and remove it when animation ends to prevent excessive GPU VRAM consumption.

---

## 4. Asset & Font Optimization

1. **Modern Image Formats:** Use WebP or AVIF with 80-85% compression quality (reduces file sizes by 60-80% compared to raw PNG/JPG).
2. **Font Subsetting:** Self-host fonts in `.woff2` format with `font-display: swap`, requesting only Latin and Cyrillic subsets.
