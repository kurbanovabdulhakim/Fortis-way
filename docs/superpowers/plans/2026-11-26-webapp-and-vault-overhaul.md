---
title: Telegram WebApp & 3-Tier Vault Overhaul Plan
description: Fix empty catalog, broken desktop scrolling, and live DB-to-WebApp sync with countermeasures
status: active
category: plan
tags: [telegram, webapp, sqlite, ati, github-pages]
last-verified: 2026-11-26
summary-ru: План исправления пустого каталога в Telegram WebApp, прокрутки на ПК и автосинхронизации с БД.
summary-uz: Telegram WebApp bo'sh katalogi, kompyuterda skroll ishlamasligi va DB bilan avtosinxronizatsiyani tuzatish rejasi.
related:
  - web/index.html
  - web/app.js
  - scripts/library_storage.py
---

# Telegram WebApp & Vault Overhaul Plan

## Root Causes Identified
1. **Empty Catalog:** `web/catalog.json` only exported `library_items` (1 record `/старт`), ignoring `ati_loads` (40+ records), `cargo_leads`, and `documents_registry` (106 records). Also, `telegram_bot.py` did not push updated `web/catalog.json` to GitHub Pages.
2. **Broken Scrolling on Telegram Desktop:** `.country-scroll` used `overflow-x: auto` + `scrollbar-width: none` + `flex-wrap: nowrap`, making horizontal scrolling impossible with a mouse on Windows Desktop.
3. **No Interactive Actions:** Cards had no click actions, copy buttons, or ATI.SU direct links.

## Countermeasures & Implementation
1. **Unified Export (`scripts/library_storage.py`):** Export `ati_loads`, `cargo_leads`, `library_items`, and `documents_registry` into `web/catalog.json` and `web/catalog.js`.
2. **Desktop-First + Mobile-Ready WebApp (`web/index.html`, `web/style.css`, `web/app.js`):**
   - Wrap filter pills (`flex-wrap: wrap`) and enable smooth vertical scrolling (`overflow-y: auto`).
   - Add top-level tabs: `Грузы ATI.SU` and `Библиотека и Документы`.
   - Add 1-click Copy (`Для группы`, `Расширенный`) and `Открыть ATI.SU` buttons on every cargo card.
3. **Auto-Sync & Cache Busting (`scripts/telegram_bot.py`):**
   - Auto-push `web/catalog.json` / `web/catalog.js` on intake (debounced, non-blocking).
   - Bump WebApp URL to `?v=5` via `setChatMenuButton` so Telegram Desktop drops the stale cache.
4. **Verification:** Unit tests (`pytest tests/`), live HTTP 200 checks on GitHub Pages, and Telegram API `getChatMenuButton` check.
