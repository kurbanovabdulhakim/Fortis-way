# FortisWay AI Agent Orientation Guide (`AGENTS.md`)

> **Primary Directive:** AI agents (Antigravity, Cursor, Hermes, Codex) operating in this workspace must use `db/fortisway.db` as the Single Source of Truth (SSOT).

---

## 1. Quick Start Protocol (Cold-Start)

When starting a new session or task in this repository:
1. **Query Database State (1-Click):**
   ```bash
   python scripts/query.py --summary --json
   ```
2. **Instant Search across All Corporate Entities:**
   ```bash
   python scripts/query.py --search "крахмал" --json
   python scripts/query.py --search "Mining" --json
   ```
3. **Targeted Table Queries:**
   ```bash
   python scripts/query.py --table tariffs_routes --json
   python scripts/query.py --table exhibition_leads --limit 10 --json
   python scripts/query.py --table plan_fact --date "06.11.2026" --json
   ```

---

## 2. Master Database & Single Source of Truth (SSOT)

- **Database Path:** `db/fortisway.db` (SQLite 3 with FTS5 full-text indexing)
- **Schema DDL:** `db/schema.sql`
- **Schema Specification:** `db/schema.md`
- **Builder / Synchronizer:** `python scripts/build_db.py` (idempotent; rebuilds from original source sheets)
- **Query Engine:** `python scripts/query.py` (returns structured JSON for AI models)

### Table Directory:
- `clients` (428 records): Client calling logs, priority codes, GoldenPages freight forwarders.
- `exhibition_leads` (29 records): B2B decision makers from Mining & Metals 2026.
- `tariffs_routes` (24 records): Uzbekistan domestic and international rates (Bakan Tex, Netherlands, Poland).
- `plan_fact` (36 records): Daily tasks, decisions, and comments for Курбанов А.
- `documents_registry` (47 records): File registry of presentations, proposals, and contracts.
- `company_knowledge` (7 records): Company profile, requisites, and rules.
- `fts_index` (Virtual): Full-text search across all entities.

---

## 3. Governance & Ponytail Minimalist Mode (ExpertOps)

Every agent must strictly observe the **7-Rung Minimalist Ladder**:
1. **YAGNI:** Speculative code and hypothetical wrappers are rejected immediately.
2. **Reuse:** Check existing utilities and records before writing anything new.
3. **Stdlib First:** Python `sqlite3`, `pathlib`, `json`, `argparse`; native PowerShell cmdlets.
4. **Native CLI:** Use `scripts/query.py` rather than opening multiple heavy files.
5. **Existing Dependencies:** Never install unneeded third-party libraries.
6. **One-Liner / Procedural:** Simple readable procedural code beats meta-programming.
7. **Minimum Working Code:** The shortest correct diff wins.

### Boundaries:
- Fix root causes, never symptoms.
- Never compromise secrets, audit logs, or factual accuracy.
- Telegram bots/scraping remain deferred until explicitly requested.

---

## 4. Documentation Standards

Every `.md` file created or updated must have standard YAML frontmatter:
```yaml
---
title: English Title
description: One-line concise summary
status: active
category: spec | rule | runbook | architecture | index
tags: [tag1, tag2]
last-verified: YYYY-MM-DD
summary-ru: Краткое описание на русском для пользователя
summary-uz: Foydalanuvchi uchun o'zbek tilidagi qisqacha tavsif
related:
  - path/to/related.md
---
```

