---
title: Database Schema Specification — FortisWay Logistics Hub
description: Canonical SQLite database schema specification for clients, exhibition leads, freight tariffs, daily activity logs, and documents.
status: active
category: spec
tags: [sqlite, schema, ssot, fortisway, logistics, database, fts5]
last-verified: 2026-11-09
summary-ru: Каноническая спецификация схемы базы данных SQLite (db/fortisway.db) для хранения клиентов, лидов выставки, тарифов, план-факт отчетов и документов.
summary-uz: Mijozlar, ko'rgazma lidlari, tariflar, reja-fakt hisobotlari va hujjatlarni saqlash uchun SQLite ma'lumotlar bazasi (db/fortisway.db) kanonik sxemasi.
related:
  - db/schema.sql
  - scripts/query.py
  - scripts/build_db.py
  - AGENTS.md
---

# FortisWay Corporate Database Schema (`db/fortisway.db`)

> **Single Source of Truth (SSOT):** The central SQLite database designed for sub-millisecond retrieval by AI agents and automated scripts.

---

## 1. Relational Tables Overview

| Table Name | Description | Key Source | Total Rows |
|:---|:---|:---|:---|
| `clients` | Client directory, CRM calling records, GoldenPages companies | `Клиентская_база_*.xlsx`, `GoldenPages_*.xlsx` | 428 |
| `exhibition_leads` | B2B key decision makers from Mining & Metals 2026 | `Baza_Kontaktov_Vystavka_*.xlsx` | 29 |
| `tariffs_routes` | Regional (Uzbekistan) and international freight rates | `Stoimost_Perevozki_*.xlsx` | 24 |
| `plan_fact` | Daily task and operational journal (Oct–Nov 2026) | `План_факт_*.xlsx` | 36 |
| `documents_registry` | Index of presentations, commercial proposals, contracts | File scanner (`documents/`) | 47 |
| `company_knowledge` | Requisites, manager profiles, vehicle specs, rules | Corporate guidelines | 7 |
| `fts_index` | FTS5 full-text search index across all entities | Dynamic index | 571 |

---

## 2. Table Schemas

### A. `clients`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT — Contact person name
- `position` TEXT — Contact person job title
- `company` TEXT NOT NULL — Company name
- `phone` TEXT — Phone numbers
- `code` TEXT — Priority code: `3` (VIP 100+ trucks), `2` (Active lead), `1` (Reserve), `0` (Irrelevant), `?` (Call back)
- `status` TEXT — Client status (Активный лид, В резерве, Неактуален, Справочник GP)
- `call_result` TEXT — Details or commentary from cold call / sales contact
- `source` TEXT — Origin dataset
- `city` TEXT — City or region
- `email` TEXT — Email address
- `address` TEXT — Physical address

### B. `exhibition_leads`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `exhibition` TEXT — Event name (`Mining & Metals Central Asia 2026`)
- `company` TEXT NOT NULL — Brand / Enterprise
- `contact_person` TEXT — Full name
- `position` TEXT — Job title (General Director, Sales Manager, etc.)
- `country_region` TEXT — Country/city of origin (China, Turkey, Uzbekistan, Russia, etc.)
- `activity_field` TEXT — Production / mining scope
- `phone` TEXT — Direct mobile / office phone
- `email` TEXT — Corporate email
- `website` TEXT — Official web address
- `notes` TEXT — Targeted logistics requirements

### C. `tariffs_routes`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `route_name` TEXT NOT NULL — Origin to destination
- `rate` REAL — Base freight rate
- `currency` TEXT — Currency code (`UZS`, `EUR`, `USD`)
- `vat_percent` REAL — Applicable VAT rate (e.g., `12.0`)
- `rate_with_vat` REAL — Total rate including VAT
- `rate_with_discount_5pct` REAL — Rate discounted for strategic clients (e.g. Bakan Tex)
- `cargo_type` TEXT — Description of cargo
- `vehicle_type` TEXT — Required rolling stock
- `transit_days` TEXT — Estimated delivery time
- `conditions` TEXT — Demurrage, re-coupling, customs terms
- `source_doc` TEXT — Originating calculation / proposal

### D. `plan_fact`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `date` TEXT NOT NULL — Date of activity (`DD.MM.YYYY`)
- `employee` TEXT NOT NULL — Specialist (`Курбанов А.`)
- `tasks_decisions` TEXT — Tasks assigned / decisions taken
- `execution_date` TEXT — Target / completion date
- `comments` TEXT — Operational progress and notes
- `status` TEXT — Status (`Сделано`, `В работе`)
- `category` TEXT — Category tag (`Оперативка`, `Продажи`, `Диспетчеризация`, `Выставка`, `Выходной`)

### E. `documents_registry`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `category` TEXT — Document category
- `title` TEXT NOT NULL — File name / title
- `file_path` TEXT UNIQUE — Full absolute path on disk
- `file_format` TEXT — File extension (`xlsx`, `docx`, `pdf`, `pptx`, `html`)
- `file_size_kb` REAL — Size in kilobytes
- `description` TEXT — Content summary

### F. `company_knowledge`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `section` TEXT — Knowledge domain (`user_profile`, `company`, `rules`)
- `key_name` TEXT NOT NULL UNIQUE — Lookup key
- `value_text` TEXT NOT NULL — Main value string
- `details_json` TEXT — Additional JSON attributes

### G. `fts_index` (Virtual FTS5)
- `entity_type` TEXT — Category (`client`, `exhibition_lead`, `tariff`, `plan_fact`, `document`, `knowledge`)
- `entity_id` UNINDEXED INTEGER — Foreign key to originating table
- `title` TEXT — Searchable title
- `content` TEXT — Aggregated searchable text
- `tags` TEXT — Space-separated keywords

