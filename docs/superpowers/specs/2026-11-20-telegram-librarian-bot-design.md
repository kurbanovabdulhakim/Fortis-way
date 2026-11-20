---
title: FortisWay Librarian Bot & 3-Tier Vault Architecture
description: Specification for the 24/7 Telegram Librarian Bot integrating Telegram Channel Archive, GitHub Repository, and 5TB Google Drive with geographic cargo classification.
status: active
category: spec
tags: [telegram, bot, librarian, vault, google-drive, github, logistics, multi-tier-storage]
last-verified: 2026-11-20
summary-ru: Спецификация 24/7 бота-библиотекаря для каталогизации логистических материалов по странам с 3-уровневым хранилищем (Telegram + GitHub + Google Drive 5ТБ).
summary-uz: 3 darajali xotira (Telegram + GitHub + Google Drive 5TB) va mamlakatlar bo'yicha logistika materiallarini saralash uchun 24/7 kutubxonachi bot spetsifikatsiyasi.
related:
  - AGENTS.md
  - db/schema.md
  - docs/superpowers/specs/2026-11-20-telegram-bot-integration-design.md
---

# FortisWay Librarian Bot & 3-Tier Indestructible Vault

## 1. Executive Summary & Objectives

The FortisWay Librarian Bot (`@hermes_0078bot`) is an autonomous digital archivist for **Abdulkhakim Kurbanov (`@LogisticsFortisway`)**.

### Primary Goal:
Transform the bot into a **strict digital library / repository archivist**.
- It **does not** generate speculative text, run operational scripts, or maintain plan-fact tasks.
- It **only** acts as a faithful librarian:
  1. **Accepts & catalogs:** Any text, link, document (CMR/TTN), invoice, photo (loading/seals), or video (unloading) sent by the manager.
  2. **Classifies by Country & Shipment:** Groups files strictly by geography (Poland, Netherlands, Uzbekistan, China, etc.) and shipment/cargo ID.
  3. **Stores across 3 Indestructible Tiers:**
     - **Tier 1 (Instant Telegram Channel Archive):** Cloud storage via private channel (`https://t.me/+VeTqayUTctU0MmMy`).
     - **Tier 2 (GitHub Versioned Catalog):** Structured markdown repository in `kurbanovabdulhakim/Fortis-way/library/`.
     - **Tier 3 (Google Drive 5 TB Media Vault):** Full-resolution documents, photos, and videos organized into folders.
  4. **Retrieves on demand:** When asked (e.g. `Польша видео выгрузки` or `? договор Bakan Tex`), delivers the exact stored records and files directly to Telegram without mixing other countries.

---

## 2. 3-Tier Indestructible Storage Architecture

```
[Manager on Phone / Weekend] ──► Text / Photo / Video / Document
                                           │
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │  Librarian Bot Daemon (@hermes_0078bot)  │
                     │  1. Deduplication (SHA-256 / File ID)     │
                     │  2. Geo & Cargo Taxonomy Classifier       │
                     └───────────────────────────────────────────┘
                                   │       │       │
       ┌───────────────────────────┘       │       └───────────────────────────┐
       ▼                                   ▼                                   ▼
 [Tier 1: Telegram Channel]      [Tier 2: GitHub Repository]     [Tier 3: Google Drive 5TB]
  Private Channel Archive:        `library/entries/`              `FortisWay_Vault/`
  - Instant CDN persistence       - Markdown cards                - Full-res video/photos
  - Up to 2,000 MB per file       - Master CATALOG.md             - 5 TB quota headroom
  - In-app mobile playback        - Complete git history          - Permanent web links
```

---

## 3. Geographic & Cargo Taxonomy

Every incoming item is assigned a destination folder:

```
FortisWay_Vault /
├── 🇵🇱_Польша/
│   └── 2026-11_BakanTex_01/
│       ├── 01_Документы_CMR_Инвойсы/
│       ├── 02_Фото_Погрузки_Пломб/
│       ├── 03_Видео_Выгрузки/
│       └── 04_Переписка_и_Задержки/
├── 🇳🇱_Нидерланды/
├── 🇺🇿_Узбекистан/
├── 🇨🇳_Китай/
├── 🇷🇺_Россия/
└── 00_Общее_и_Несортированное/
```

### Auto-Tagging & Routing Engine:
- **Geo-Dictionary Normalization:** Recognizes variations (e.g. `польша`, `варшава`, `lodz`, `poland` ➔ `🇵🇱 Польша`; `роттердам`, `голландия`, `netherlands` ➔ `🇳🇱 Нидерланды`).
- **Cargo Stage Detection:**
  - Video + "выгруз" ➔ `03_Видео_Выгрузки`.
  - Photo + "пломб" / "погруз" ➔ `02_Фото_Погрузки_Пломб`.
  - PDF/XLSX + "cmr" / "инвойс" / "договор" ➔ `01_Документы_CMR_Инвойсы`.
- **Interactive Fallback:** If the message has no country or text, the bot provides 1-tap inline buttons:
  `[🇵🇱 Польша] [🇳🇱 Нидерланды] [🇺🇿 Узбекистан] [🇨🇳 Китай] [Другая страна]`.

---

## 4. Ingestion & Retrieval Specification

### Ingestion Flow:
1. Message arrives from `@LogisticsFortisway`.
2. Content hash and `file_unique_id` checked against `library_items` to prevent duplicates.
3. Item forwarded/copied to the Private Telegram Channel with tag banner (`#Польша #Видео #Запись_48`).
4. Item metadata and text committed to GitHub repository (`library/entries/`).
5. Binary file uploaded to Google Drive in the matching folder.
6. Confirmation sent to chat:
   ```
   📖 Запись #48 сохранена в библиотеку!
   🌍 Направление: 🇵🇱 Польша (Bakan Tex)
   📁 Раздел: 03_Видео_Выгрузки
   1️⃣ Telegram Канал: ✅ Сохранено
   2️⃣ GitHub: ✅ Зафиксировано
   3️⃣ Google Drive (5 ТБ): ✅ Загружено
   ```

### Retrieval Flow ("Выдача книги"):
- Trigger patterns: `найди <запрос>`, `покажи <запрос>`, `где <запрос>`, `? <запрос>`, `/find <запрос>`.
- Searches across `country`, `cargo_tag`, `caption`, `filename`, and `extracted_text`.
- Strict country filter: If querying `Польша`, results from other countries are excluded.
- Response includes:
  - Brief library card with date and record ID.
  - Direct Google Drive link.
  - **Direct file/photo/video dispatch** in Telegram or forward link from Channel.

---

## 5. Storage Analytics (`/stats`) — Smartphone Style

Command `/stats` generates an exact breakdown matching smartphone storage management:

```
📊 ХРАНИЛИЩЕ FORTISWAY VAULT:
Общий объем: 5 120 ГБ (5 ТБ) | Занято: 36.3 ГБ | Свободно: 5 083.7 ГБ

📱 ПО ТИПАМ ФАЙЛОВ:
• 🎬 Видео (погрузка / выгрузка): 24.2 ГБ (18 файлов)
• 📸 Фотографии и пломбы:         8.4 ГБ (142 файла)
• 📑 Документы (PDF, CMR, ТТН):   2.1 ГБ (86 файлов)
• 📊 Таблицы (Excel, расчеты):    420 МБ (14 файлов)
• 📝 Заметки и переписки:         12 МБ (53 записи)

🌍 ПО СТРАНАМ И НАПРАВЛЕНИЯМ:
🇵🇱 Польша:        14.8 ГБ (42 записи)
🇳🇱 Нидерланды:     11.2 ГБ (31 запись)
🇺🇿 Узбекистан:     6.1 ГБ (58 записей)
🇨🇳 Китай:          2.6 ГБ (11 записей)
🌐 Другие:         1.6 ГБ (8 записей)
```

---

## 6. Telegram WebApp / Menu Button

In the bottom-left corner of the Telegram input field, a persistent `Меню / Open` WebApp button is configured (`setChatMenuButton`):
- Clicking opens a mobile-optimized catalog viewer (`web/index.html`):
  - Visual flag buttons for quick country filtering.
  - Storage meter visual bar (Videos, Photos, Documents).
  - Fast search box.
  - One-tap links to files on Google Drive and Telegram Channel posts.

---

## 7. Edge Cases, Failure Modes & Rock-Solid Mitigations

| Failure Mode / Edge Case | Risk | Mitigation & Built-in Plan B |
|---|---|---|
| **Large Videos > 20 MB** | Standard Telegram Bot API `getFile` fails for downloads > 20 MB. | **Plan B Built-in:** The bot uses `copyMessage` / `forwardMessage` directly to the Private Telegram Channel, which supports files up to **2,000 MB (2 GB)** without needing local download! Channel message link is stored in catalog. |
| **PC Powered Off Over Weekend** | Local daemon does not execute while PC is off. | **Multi-tier resilience:** All messages sent to the channel or bot are preserved in Telegram Cloud. On PC boot, the sync engine checks un-synced updates. For true 24/7 cloud, webhook deployment instructions provided for Render/Cloudflare. |
| **Google Drive OAuth Expiry** | Access token expires after 60 minutes. | Automatic OAuth2 refresh token exchange prior to every upload request. Local SQLite queue caches uploads if network blips. |
| **No Text or Country Specified** | User sends bare photo without caption. | Bot sends inline interactive keyboard with country flags; one tap saves it directly to the chosen country. |
| **Duplicate Submissions** | Same photo or forward sent twice. | SHA-256 hash and `file_unique_id` check; bot replies that the record already exists under `#ID` without duplicating. |
| **Database Concurrency** | SQLite locks when reading and writing. | WAL mode enabled with `busy_timeout = 5000`. |

---

## 8. Database Schema Specification

In `db/fortisway.db`:

```sql
CREATE TABLE IF NOT EXISTS library_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,                -- YYYY-MM-DD HH:MM:SS
    telegram_msg_id INTEGER,                 -- Message ID in user chat
    channel_msg_id INTEGER,                  -- Message ID in private channel archive
    country TEXT NOT NULL DEFAULT 'Общее',   -- 'Польша', 'Нидерланды', 'Узбекистан', etc.
    cargo_id TEXT,                           -- '2026-11_BakanTex_01'
    category TEXT NOT NULL,                  -- '01_Документы', '02_Фото', '03_Видео', etc.
    content_type TEXT NOT NULL,              -- 'text', 'photo', 'video', 'document'
    title TEXT NOT NULL,                     -- Title or auto-generated summary
    raw_text TEXT,                           -- Full text or caption
    file_name TEXT,                          -- Original file name
    file_size_bytes INTEGER DEFAULT 0,       -- File size for smartphone storage stats
    file_unique_id TEXT UNIQUE,              -- Telegram unique file identifier (deduplication)
    gdrive_file_id TEXT,                     -- Google Drive File ID
    gdrive_web_link TEXT                     -- Direct Google Drive view link
);

CREATE INDEX IF NOT EXISTS idx_library_country ON library_items(country);
CREATE INDEX IF NOT EXISTS idx_library_category ON library_items(category);

-- Full-Text Search Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS library_fts USING fts5(
    item_id UNINDEXED,
    country,
    title,
    raw_text,
    file_name
);
```

---

## 9. Verification & Quality Gate

1. **Deduplication Test:** Send duplicate file, verify rejection/notice.
2. **Taxonomy & Geo-Routing Test:** Send message with "Польша" and video, verify routed to `Польша / 03_Видео_Выгрузки`.
3. **Channel Forwarding Test:** Verify item copies to private channel archive.
4. **Isolated Search Test:** Search "Польша", verify Netherlands and Uzbekistan items are excluded.
5. **Stats Test:** Verify `/stats` renders detailed smartphone storage breakdown.
6. **WebApp Menu Test:** Verify menu button registration.
