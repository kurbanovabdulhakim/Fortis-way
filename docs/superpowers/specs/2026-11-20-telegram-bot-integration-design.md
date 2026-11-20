---
title: FortisWay 24/7 Telegram Agent & Task Queue Design
description: Architectural specification for an autonomous 24/7 Telegram bot agent integrating FortisWay SQLite SSOT, task queue, and local remote execution.
status: active
category: spec
tags: [telegram, bot, automation, task-queue, sqlite, fortisway, daemon]
last-verified: 2026-11-20
summary-ru: Спецификация автономного круглосуточного Telegram-агента для постановки задач, работы с базой FortisWay и выполнения команд.
summary-uz: FortisWay ma'lumotlar bazasi, topshiriqlar navbati va buyruqlarni bajarish uchun 24/7 avtonom Telegram bot spetsifikatsiyasi.
related:
  - AGENTS.md
  - db/schema.md
  - scripts/query.py
---

# FortisWay 24/7 Telegram Agent & Task Queue System

## 1. Executive Summary & Objectives

The goal is to provide **Abdulkhakim Kurbanov (`@LogisticsFortisway`)** with a dedicated, 24/7 continuously running Telegram interface to the FortisWay system via the `@hermes_0078bot` bot.

### Core Capabilities:
1. **Always-On Autonomous Daemon (24/7):** Runs silently in the background, auto-starts on Windows login, and auto-restarts on any connection blip.
2. **Task Queue & Mirroring:** Every task or instruction sent via Telegram is logged to `telegram_tasks` and mirrored into the `plan_fact` table in `db/fortisway.db`.
3. **Instant Database Expert:** Responds in sub-100ms to queries regarding clients (428 entries), exhibition leads (29 entries), tariffs and routes (24 entries) using SQLite FTS5.
4. **Local Command Runner:** Safely triggers maintenance scripts (database rebuilds, vCard exports, data transformations) and returns console output.
5. **Hybrid AI Assistance:** Provides natural language conversation and logistics analysis via local domain rules and optional Gemini API.

---

## 2. System Architecture

```
                                  [ Telegram Cloud ]
                                          │
                                          ▼ HTTPS Long Polling (urllib)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ WINDOWS HOST (24/7 Background Process)                                                 │
│                                                                                        │
│  [Windows Startup: silent_runner.vbs] ──► [Watchdog Wrapper] ──► [scripts/telegram_bot.py]│
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ scripts/telegram_bot.py                                                          │  │
│  │                                                                                  │  │
│  │  1. SecurityGuard:                                                               │  │
│  │     - Matches @LogisticsFortisway & permanently caches User ID.                  │  │
│  │     - Silently drops or logs unauthorized sender attempts.                       │  │
│  │                                                                                  │  │
│  │  2. IntentRouter:                                                                │  │
│  │     - TASK_ADD / TASK_LIST / TASK_DONE                                           │  │
│  │     - SEARCH (FTS5 clients / exhibition_leads)                                   │  │
│  │     - TARIFF (tariffs_routes lookup)                                             │  │
│  │     - RUN_SCRIPT (whitelisted subprocess execution)                              │  │
│  │     - STATUS (PC uptime, DB record stats, active queue count)                    │  │
│  │     - AI_CONVERSE (natural language response / Gemini fallback)                  │  │
│  │                                                                                  │  │
│  │  3. Storage & Execution:                                                         │  │
│  │     - SQLite WAL mode (db/fortisway.db)                                          │  │
│  │     - Whitelisted subprocess executor with 120s timeout                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Security & Access Control

1. **Bot Token Management:**
   - Token `9221650250:AAFz-L5k5sBaExEFQdifbAIGNeW9prlmXu4` is stored in `.env` (strictly ignored by `.gitignore`).
2. **Access Whitelist:**
   - Primary identifier: Telegram username `LogisticsFortisway`.
   - On the first incoming update from `@LogisticsFortisway`, the script reads the unique integer `user_id` and records it into `.bot_state.json`.
   - All subsequent updates strictly verify `from.id == state.admin_id`.
   - Non-whitelisted users are rejected without disclosing system capabilities.
3. **Execution Sandboxing:**
   - Only scripts residing in the `scripts/` directory or explicitly whitelisted commands (`build_db.py`, `export_vcard.py`, `query.py`, `reformat_goldenpages_excel.py`, `reformat_translogistica_excel.py`) can be executed via `/run`.

---

## 4. Database Schema Specification

In `db/fortisway.db`:

```sql
-- Dedicated Telegram Task Queue
CREATE TABLE IF NOT EXISTS telegram_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,                -- ISO 8601 string (YYYY-MM-DD HH:MM:SS)
    telegram_msg_id INTEGER,                 -- Originating Telegram message ID
    task_text TEXT NOT NULL,                 -- Task description / instruction
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
    result_text TEXT,                        -- Execution outcome or resolution comment
    completed_at TEXT                        -- Completion timestamp
);

CREATE INDEX IF NOT EXISTS idx_telegram_tasks_status ON telegram_tasks(status);
```

### Automatic Mirroring to `plan_fact`:
Whenever a new task is inserted into `telegram_tasks`, a record is automatically synchronized to `plan_fact`:
- `date`: Current date (`DD.MM.YYYY`)
- `employee`: `'Курбанов А.'`
- `tasks_decisions`: `task_text`
- `execution_date`: Current date (`DD.MM.YYYY`)
- `comments`: `'Источник: Telegram (@hermes_0078bot, task #' || new.id || ')'`
- `status`: `'Запланировано'`
- `category`: `'Telegram Задача'`

---

## 5. Command & Intent Reference

| Command / Pattern | Intent | Description & Response |
|---|---|---|
| `/start`, `/help` | `HELP` | Greets the manager, shows command cheat sheet, reports DB status. |
| `/task <text>`, `запиши задачу <текст>`, `напомни <текст>` | `TASK_ADD` | Adds a new task to `telegram_tasks` and mirrors to `plan_fact`. Returns task ID. |
| `/tasks`, `мои задачи`, `список задач` | `TASK_LIST` | Displays all pending tasks formatted with checkmarks. |
| `/done <id>`, `сделано <id>`, `завершить <id>` | `TASK_DONE` | Marks task `<id>` as `completed` in both `telegram_tasks` and `plan_fact`. |
| `/search <query>`, `найди <запрос>`, `поиск <запрос>` | `SEARCH` | Queries FTS5 across clients and exhibition leads. Returns cards and phone numbers. |
| `/tariff <query>`, `тариф <направление>` | `TARIFF` | Searches `tariffs_routes` for rate cards (e.g. Rotterdam, Poland, domestic). |
| `/run <script_name>` | `RUN_SCRIPT` | Executes a verified local maintenance script with live console output in chat. |
| `/status`, `статус` | `STATUS` | Reports bot uptime, active tasks count, and database record stats. |
| Free text queries | `AI_CONVERSE` | Generates intelligent context-aware responses or falls back to smart local routing. |

---

## 6. 24/7 Always-On Autostart Architecture

To ensure the bot never shuts down:

1. **Watchdog Loop:** `scripts/telegram_bot.py` contains an outer supervision loop with exponential backoff for network drops. It never exits on transient HTTP 5xx or SSL connection drops.
2. **Silent Background Runner (`scripts/start_bot_silent.vbs`):**
   ```vbs
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run "pythonw.exe c:\Users\user\Fortis-way\scripts\telegram_bot.py", 0, False
   ```
   Runs completely hidden with no visible command prompt window interrupting the user's work.
3. **Windows Startup Link:**
   A shortcut pointing to `start_bot_silent.vbs` is registered in:
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FortisWayTelegramAgent.lnk`
   This guarantees that whenever the user turns on the computer or logs into Windows, the bot immediately starts in the background.

---

## 7. Verification & Testing Protocol

1. **Token & Network Test:** Verify connectivity to Telegram Bot API without external dependencies.
2. **Security Test:**
   - Simulate an update from an unknown user: verify rejection.
   - Simulate an update from `@LogisticsFortisway`: verify acceptance and state caching.
3. **Database Test:**
   - Verify creation of `telegram_tasks`.
   - Verify task creation, listing, completion, and mirroring to `plan_fact`.
   - Verify FTS5 search queries return results from `clients` and `tariffs_routes`.
4. **Command Execution Test:**
   - Execute `/run build_db` or a safe test command and verify output capture.
5. **Startup & Daemon Test:**
   - Verify silent execution via `pythonw` / `start_bot_silent.vbs`.
   - Verify presence in Windows Startup directory.
