---
title: Scripts & Automation Guide — FortisWay Logistics Hub
description: CLI reference for database querying and synchronization scripts optimized for AI agents.
status: active
category: runbook
tags: [scripts, cli, sqlite, query, build, automation]
last-verified: 2026-11-09
summary-ru: Руководство по CLI-скриптам синхронизации и быстрых запросов к базе данных для ИИ-агентов.
summary-uz: AI agentlari uchun ma'lumotlar bazasini sinxronlash va tezkor so'rovlar bo'yicha CLI qo'llanmasi.
related:
  - scripts/query.py
  - scripts/build_db.py
  - db/schema.md
  - AGENTS.md
---

# Automation Scripts & Query CLI (`scripts/`)

This directory contains standalone, idempotent Python scripts for maintaining and querying `db/fortisway.db`.

---

## 1. `scripts/query.py` — Fast AI Query Engine

Designed for instant retrieval of structured corporate data by AI agents in a single tool call.

### Syntax:
```bash
python scripts/query.py [OPTIONS]
```

### Options:
- `--summary`: Returns database-wide record counts, status distributions, and active date ranges.
- `--search "<term>"`: Sub-millisecond FTS5 search across all entities (clients, tariffs, leads, logs, documents).
- `--table <name>`: Retrieves rows from a specific table (`clients`, `exhibition_leads`, `tariffs_routes`, `plan_fact`, `documents_registry`, `company_knowledge`).
- `--limit <N>`: Maximum rows to return (default: 50).
- `--date "<DD.MM.YYYY>"`: Filter daily records for `plan_fact`.
- `--sql "<SELECT ...>"`: Execute arbitrary read-only SQL queries.
- `--json`: Format output as clean JSON (default).

---

## 2. `scripts/build_db.py` — Idempotent Database Synchronizer

Builds and indexes `db/fortisway.db` from all original Excel, CSV, and text files.

### Syntax:
```bash
python scripts/build_db.py
```

### Guarantees:
- Strictly idempotent. Re-running wipes and rebuilds fresh tables without duplicate entries.
- Automatically populates the `fts_index` virtual table with full-text search entries.

