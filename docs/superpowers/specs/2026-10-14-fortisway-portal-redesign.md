# Design Specification: FortisWay Logistics Portal & Transport Showcase

**Date:** 2026-10-14  
**Project:** FortisWay B2B Website Redesign  
**Status:** In Review  

---

## 1. Executive Summary & Goals
The objective is to elevate the FortisWay digital presence to an industry-leading B2B logistics portal, combining the high-converting ergonomics of **UzPochta.ru** (express calculation, high contrast, clean dual-column hero) with the comprehensive multi-transport depth and route transparency of **Unity-Trans.uz**.

Key priorities:
1. **Clean Structural Hierarchy:** Avoid cluttered "salads" of content. Segment each logistics mode into a dedicated cinematic section.
2. **Scroll-Driven Transport Motion:** Each transport mode features an ambient dynamic scene where vehicles animate smoothly as the section enters the viewport (highway truck, railway freight train, cargo aircraft, ocean container vessel).
3. **Protected Corporate Requisites & B2B Portal:** The official legal information of LLC «FORTISWAY» (INN 313334329, Bank Ipak Yo'li, legal address, settlement account) is protected behind an authorization gateway supporting instant B2B lead unlock, credentials login, and Telegram verification.
4. **Verified Unified Contacts:** Phone `+998 93 555 22 62`, Telegram `@LogisticsFortisway`, and WhatsApp integration across all touchpoints.

---

## 2. Page Architecture & Section Layout

### Section 0: Top Bar & Navigation Header
- **Top Utility Bar:** Working hours (24/7), Phone (`+998 (93) 555-22-62`), Direct links to Telegram `@LogisticsFortisway` & WhatsApp.
- **Main Nav:** Logo (FortisWay Freight & Logistics), Navigation anchor links (Авто, Ж/Д, Авиа, Море, Маршруты, Реквизиты, Контакты), CTA Button «Заказать звонок» + «Личный кабинет».

### Section 1: Hero Section (Inspired by UzPochta + Unity-Trans)
- **Left Column:**
  - Dynamic status badge: `🟢 Диспетчерская 24/7 активна · Узбекистан & ВЭД`
  - Bold Value Proposition: «Международные и региональные грузоперевозки: Узбекистан ↔ СНГ, Турция, Европа, Китай»
  - Trust metrics: `30+ единиц техники`, `Доставка от 150$/т`, `Работа с НДС`, `GPS 24/7`
  - Direct Action Buttons: «Заказать перевозку», «Позвонить логисту», «Написать в Telegram / WhatsApp»
- **Right Column (Floating Express Calculator Card):**
  - Departure Country & City dropdowns
  - Destination Country & City dropdowns with a 1-click **Swap Directions** button (`⇄`)
  - Weight slider/input (kg/tons) & Volume slider/input (m³)
  - Quick toggles: `Негабаритный груз`, `Рефрижератор / температурный режим`, `Срочная доставка`
  - Instant rate calculation with recommended vehicle class
  - One-click order dispatch to Telegram `@LogisticsFortisway` with pre-filled route and payload details.

### Section 2: 🚛 Автомобильные перевозки (FTL & LTL)
- **Visual Background & Motion:** High-contrast highway scene. As the user enters the section, a modern FortisWay euro-truck glides across the road with illuminated headlamps.
- **Content:**
  - Complete vehicle catalog (1.5т Газель, 5т Isuzu, 20т Тент 92м³, 105м³ Мегатрейлер, Рефрижераторы -20°C..+12°C, Низкорамные тралы).
  - Transit times (Ташкент ↔ Москва: 5-7 дней, Ташкент ↔ Алматы: 2-3 дня).
  - Tariffs and booking triggers.

### Section 3: 🚆 Железнодорожные перевозки (Ж/Д логистика)
- **Visual Background & Motion:** Twilight railway terminal / mountain pass. A heavy container train smoothly travels along the tracks upon scroll.
- **Content:**
  - 20' & 40' HQ containerized shipments, covered wagons, platforms for heavy machinery.
  - Border crossing clearance (Сарыагаш, Озинки, Забайкальск).
  - Wagon location telemetry tracking by wagon number.

### Section 4: ✈️ Авиаперевозки (Cargo Express)
- **Visual Background & Motion:** Atmospheric cloudscape with airport runway lights. A freight Boeing/Airbus Cargo aircraft climbs smoothly along a diagonal trajectory.
- **Content:**
  - Ultra-fast delivery: 24 to 72 hours.
  - Key international air hubs: Ташкент (TAS), Стамбул (IST), Дубай (DXB), Франкфурт (FRA), Гуанчжоу (CAN), Москва (SVO/DME).
  - High-value, perishable, pharmaceutical, and sample deliveries with AWB documentation.

### Section 5: 🚢 Мультимодальные и морские перевозки
- **Visual Background & Motion:** Deep blue sea harbor with container crane reflections and a freight container vessel gliding across calm water.
- **Content:**
  - Combined routes: Sea + Rail + Auto.
  - Caspian ferry routes (Курык / Актау ⇄ Баку / Алят).
  - Black Sea ports (Поти, Батуми, Новороссийск) & Persian Gulf (Бендер-Аббас).
  - Door-to-door single bill of lading.

### Section 6: Таблица популярных маршрутов и ориентировочных ставок (Unity-Trans Style)
- Clean, searchable matrix of freight routes:
  - Маршрут | Дистанция | Срок доставки | Ориентировочная ставка | Тип транспорта
  - Москва ⇄ Ташкент (3 400 км, 5-7 дней, от 160$/т)
  - Санкт-Петербург ⇄ Ташкент (4 100 км, 7-9 дней, от 190$/т)
  - Стамбул ⇄ Ташкент (4 800 км, 10-14 дней, от 220$/т)
  - Урумчи ⇄ Ташкент (1 200 км, 3-5 дней, от 140$/т)
  - Алматы ⇄ Ташкент (810 км, 24-48 часов, от 85$/т)

### Section 7: Защищённый блок «Реквизиты и правовая информация ООО «FORTISWAY»»
- **Default State (Unauthenticated):**
  - Section title: «Официальные реквизиты ООО «FORTISWAY»».
  - Frosted glass container with lock icon and shield badge: `🔒 Конфиденциальная корпоративная информация`.
  - Preview card with blurred text: ИНН, Расчетный счет, Банк, Адрес.
  - Action button: «Авторизоваться для доступа к реквизитам и договору».
- **Authentication Gateway Modal (Supports Options 1, 2, 3):**
  - Tab 1: **Быстрый доступ для партнёров (Лид-авторизация)** — Ввод названия компании и телефона (или ИНН) → мгновенный доступ.
  - Tab 2: **Вход по корпоративным данным** — Логин (`partner`) и пароль (`2026`) для прямого демо-доступа руководителя.
  - Tab 3: **Верификация через Telegram** — Авторизация в 1 клик через диалог с `@LogisticsFortisway`.
- **Unlocked State:**
  - Полное наименование: `Общество с ограниченной ответственностью «FORTISWAY» (OOO «FORTISWAY»)`
  - Юридический / Почтовый адрес: `Республика Узбекистан, г. Ташкент, Яшнабадский район, МСГ Тойтепа, ул. Садика Азимова, 3-й проезд, д. 20`
  - ИНН: `313334329`
  - ОКЭД: `49410 (Грузовые перевозки автомобильным транспортом)`
  - Расчетный счет: `20208000607538177001`
  - Банк: `АКИБ «Ipak Yo'li», Чиланзарский филиал`
  - МФО: `01067`
  - Интерактивные функции:
    * Кнопка «Скопировать все реквизиты» (в буфер обмена)
    * Кнопка «Скопировать р/с»
    * Кнопка «Скачать карточку предприятия (TXT / PDF)»
    * Статус сессии: «Вы авторизованы как партнёр» с кнопкой «Выйти».

### Section 8: Контакты, FAQ и Диспетчерская
- Диспетчерская служба 24/7: `+998 (93) 555-22-62`
- Мессенджеры: Telegram `@LogisticsFortisway` & WhatsApp `+998 93 555 22 62`
- Email: `info@fortisway.uz`
- Адрес офиса с картой.

---

## 3. Technical Implementation Details
1. **Performance & Lightweight Assets:**
   - SVG vector vehicle schematics with CSS hardware-accelerated motion (`transform: translate3d`) for 60fps responsiveness.
   - Zero heavyweight video dependencies; instant load on mobile 4G/5G.
2. **State Management for Auth:**
   - Client-side `sessionStorage` / `localStorage` flag `fortisway_auth=true`.
   - Remembers login state during navigation or refresh; allows immediate demo testing by typing `partner` / `2026` or simply entering a test phone number.
3. **Responsive Breakpoints:**
   - Full desktop dual-column layout (1200px+).
   - Fluid tablet stack (768px - 1199px).
   - Mobile single-column with touch-optimized sliders and floating buttons (under 768px).
