# FortisWay 24/7 Telegram Agent & Task Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy an always-on, 24/7 autonomous Telegram agent (`@hermes_0078bot`) for Abdulkhakim Kurbanov (`@LogisticsFortisway`) to manage tasks, query FortisWay SQLite database (clients, leads, tariffs), and trigger remote maintenance scripts.

**Architecture:** A lightweight standard-library Python daemon (`scripts/telegram_bot.py`) running 24/7 via Windows Startup silent VBS launcher. It polls the Telegram API via HTTPS long-polling, validates sender access against `@LogisticsFortisway`, manages an SQLite task queue with `plan_fact` mirroring, and routes commands to SQLite FTS5 search or sandboxed script execution.

**Tech Stack:** Python 3 (standard library: `urllib.request`, `sqlite3`, `subprocess`, `json`, `os`, `re`, `pathlib`), pytest, Windows Script Host (`pythonw`, VBS).

**Spec:** [2026-11-20-telegram-bot-integration-design.md](file:///c:/Users/user/Fortis-way/docs/superpowers/specs/2026-11-20-telegram-bot-integration-design.md)

## Global Constraints

- Telegram Bot Token: `9221650250:AAFz-L5k5sBaExEFQdifbAIGNeW9prlmXu4` stored exclusively in `.env` (strictly gitignored).
- Authorized user: `@LogisticsFortisway`. The bot must permanently cache the numeric `user_id` on first contact and reject any other user.
- Master Database (SSOT): `db/fortisway.db` with WAL mode enabled.
- All new tasks must be recorded in `telegram_tasks` and mirrored into `plan_fact` (`employee = 'Курбанов А.'`, `category = 'Telegram Задача'`).
- Script execution via `/run` must be restricted to whitelisted scripts in `scripts/` with a 120-second timeout.
- 24/7 autostart on Windows login via `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FortisWayTelegramAgent.lnk`.

## Review Focus

- Non-whitelisted user sends `/start` or commands: bot must reject and not execute any action or expose data.
- Transient network drops or Telegram API 502/504 errors: bot must use exponential backoff and resume without crash.
- Database concurrency: concurrent reads from `query.py` or Antigravity while bot is writing must succeed via WAL mode and busy timeout.
- Missing optional Gemini API key: bot must degrade gracefully to local NLP/FTS5 search without crashing.
- Invalid or unknown script in `/run`: bot must reject with an explicit list of allowed scripts instead of spawning a shell.

---

### Task 1: Configuration, Secret Management & Security Filter

**Files:**
- Create: `.env`
- Modify: `.gitignore`
- Create: `scripts/config.py`
- Test: `tests/test_config_security.py`

**Interfaces:**
- Produces: `get_bot_config() -> dict`, `SecurityGuard.is_authorized(sender_username: str, sender_id: int) -> bool`

- [ ] **Step 1: Write the failing tests for configuration and security filtering**

```python
# tests/test_config_security.py
import os
import pytest
from scripts.config import get_bot_config, SecurityGuard

def test_config_loads_token_and_admin(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("TELEGRAM_BOT_TOKEN=test_token_123\nTELEGRAM_ADMIN_USERNAME=LogisticsFortisway\n", encoding="utf-8")
    monkeypatch.setenv("ENV_PATH", str(env_file))
    
    cfg = get_bot_config()
    assert cfg["bot_token"] == "test_token_123"
    assert cfg["admin_username"].lower() == "logisticsfortisway"

def test_security_guard_authorizes_and_caches_id(tmp_path):
    state_file = tmp_path / ".bot_state.json"
    guard = SecurityGuard(admin_username="LogisticsFortisway", state_file=str(state_file))
    
    # Unauthorized stranger
    assert guard.is_authorized(username="hacker", user_id=999999) is False
    
    # Authorized user by username first time
    assert guard.is_authorized(username="LogisticsFortisway", user_id=12345678) is True
    assert guard.admin_user_id == 12345678
    
    # Authorized user now matched by cached user_id even if username empty
    assert guard.is_authorized(username="", user_id=12345678) is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_config_security.py -v`
Expected: FAIL (ModuleNotFoundError or missing implementations)

- [ ] **Step 3: Implement `scripts/config.py` and ensure `.env` is gitignored**

Implement `get_bot_config()` to parse `.env` (with fallback to default token `9221650250:AAFz-L5k5sBaExEFQdifbAIGNeW9prlmXu4` and admin `LogisticsFortisway`), and `SecurityGuard` class with JSON state persistence for caching `admin_user_id`. Ensure `.gitignore` contains `.env` and `.bot_state.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_config_security.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .gitignore scripts/config.py tests/test_config_security.py
git commit -m "feat(telegram): add configuration and security guard with persistent state"
```

---

### Task 2: Database Schema & Task Queue Storage Service

**Files:**
- Modify: `db/schema.sql`
- Create: `scripts/task_storage.py`
- Test: `tests/test_task_storage.py`

**Interfaces:**
- Consumes: `db/fortisway.db`
- Produces: `TaskStorage(db_path: str)`:
  - `add_task(task_text: str, telegram_msg_id: int) -> int`
  - `list_pending_tasks() -> list[dict]`
  - `complete_task(task_id: int, result_text: str = "") -> bool`
  - `get_db_stats() -> dict`

- [ ] **Step 1: Write the failing tests for TaskStorage**

```python
# tests/test_task_storage.py
import sqlite3
import pytest
from scripts.task_storage import TaskStorage

@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_fortisway.db"
    conn = sqlite3.connect(str(db_file))
    conn.execute("""
    CREATE TABLE plan_fact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        employee TEXT,
        tasks_decisions TEXT,
        execution_date TEXT,
        comments TEXT,
        status TEXT,
        category TEXT
    )""")
    conn.commit()
    conn.close()
    return str(db_file)

def test_add_and_list_tasks_with_plan_fact_mirror(test_db):
    storage = TaskStorage(test_db)
    task_id = storage.add_task("Позвонить в Bakan Tex", telegram_msg_id=101)
    assert task_id > 0
    
    pending = storage.list_pending_tasks()
    assert len(pending) == 1
    assert pending[0]["task_text"] == "Позвонить в Bakan Tex"
    assert pending[0]["status"] == "pending"
    
    # Check plan_fact mirror
    conn = sqlite3.connect(test_db)
    cur = conn.cursor()
    cur.execute("SELECT employee, tasks_decisions, status, category FROM plan_fact WHERE tasks_decisions = ?", ("Позвонить в Bakan Tex",))
    row = cur.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "Курбанов А."
    assert row[2] == "Запланировано"
    assert row[3] == "Telegram Задача"

def test_complete_task(test_db):
    storage = TaskStorage(test_db)
    task_id = storage.add_task("Отправить КП в Роттердам", telegram_msg_id=102)
    ok = storage.complete_task(task_id, result_text="КП отправлено на почту")
    assert ok is True
    assert len(storage.list_pending_tasks()) == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_task_storage.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `TaskStorage` in `scripts/task_storage.py` and update `db/schema.sql`**

Enable WAL mode and busy_timeout=5000. Create `telegram_tasks` table and indexes if not existing. Implement `add_task` (with `plan_fact` insert transaction), `list_pending_tasks`, `complete_task` (updating both `telegram_tasks` and `plan_fact`), and `get_db_stats`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_task_storage.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add db/schema.sql scripts/task_storage.py tests/test_task_storage.py
git commit -m "feat(telegram): add TaskStorage with plan_fact synchronization"
```

---

### Task 3: Telegram Client & Long-Polling Engine

**Files:**
- Create: `scripts/telegram_client.py`
- Test: `tests/test_telegram_client.py`

**Interfaces:**
- Produces: `TelegramClient(token: str)`:
  - `get_me() -> dict`
  - `get_updates(offset: int = None, timeout: int = 30) -> list[dict]`
  - `send_message(chat_id: int, text: str, parse_mode: str = "Markdown") -> dict`

- [ ] **Step 1: Write the failing tests with mocked HTTP responses**

```python
# tests/test_telegram_client.py
import json
import pytest
from unittest.mock import patch, MagicMock
from scripts.telegram_client import TelegramClient

def test_get_me():
    client = TelegramClient("dummy_token")
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps({"ok": True, "result": {"id": 9221650250, "username": "hermes_0078bot"}}).encode("utf-8")
    
    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = client.get_me()
        assert res["ok"] is True
        assert res["result"]["username"] == "hermes_0078bot"

def test_send_message_truncates_long_text():
    client = TelegramClient("dummy_token")
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps({"ok": True, "result": {"message_id": 1}}).encode("utf-8")
    
    with patch("urllib.request.urlopen", return_value=mock_resp) as mock_urlopen:
        long_text = "A" * 5000
        client.send_message(chat_id=123, text=long_text)
        req = mock_urlopen.call_args[0][0]
        posted_data = json.loads(req.data.decode("utf-8"))
        assert len(posted_data["text"]) <= 4096
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_telegram_client.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `TelegramClient` in `scripts/telegram_client.py`**

Use standard `urllib.request`. Implement robust retry logic on network timeouts (`socket.timeout`, `urllib.error.URLError`), handle Telegram markdown escaping fallbacks, and enforce 4096-character Telegram message chunking/truncation.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_telegram_client.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram_client.py tests/test_telegram_client.py
git commit -m "feat(telegram): add TelegramClient with stdlib urllib and auto-retry"
```

---

### Task 4: Intent Router, FTS5 Search & Command Execution

**Files:**
- Create: `scripts/telegram_bot.py`
- Test: `tests/test_intent_router.py`

**Interfaces:**
- Consumes: `TelegramClient`, `SecurityGuard`, `TaskStorage`, `scripts/query.py`
- Produces: `IntentRouter`:
  - `handle_message(message: dict) -> str`

- [ ] **Step 1: Write the failing tests for intent parsing and handler dispatch**

```python
# tests/test_intent_router.py
import pytest
from unittest.mock import MagicMock
from scripts.telegram_bot import IntentRouter

def test_handle_task_add():
    storage = MagicMock()
    storage.add_task.return_value = 42
    router = IntentRouter(storage=storage, db_path="dummy.db")
    
    reply = router.handle_text("/task Подготовить отчет по ставкам")
    assert "42" in reply
    assert "добавлена" in reply.lower()

def test_handle_task_done():
    storage = MagicMock()
    storage.complete_task.return_value = True
    router = IntentRouter(storage=storage, db_path="dummy.db")
    
    reply = router.handle_text("/done 42")
    assert "42" in reply
    assert "завершена" in reply.lower()

def test_handle_search():
    storage = MagicMock()
    router = IntentRouter(storage=storage, db_path="c:/Users/user/Fortis-way/db/fortisway.db")
    reply = router.handle_text("найди крахмал")
    assert "крахмал" in reply.lower() or "найдено" in reply.lower() or "результат" in reply.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_intent_router.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `IntentRouter` and the main polling loop in `scripts/telegram_bot.py`**

Support:
- Commands: `/start`, `/help`, `/task <text>`, `/tasks`, `/done <id>`, `/search <query>`, `/tariff <query>`, `/run <script>`, `/status`.
- Natural language regex triggers: "запиши задачу", "напомни", "найди", "тариф", "статус".
- Subprocess execution for `/run` restricted to `scripts/*.py` with 120s timeout and output formatting.
- FTS5 query integration using existing queries from `scripts/query.py`.
- Gemini API fallback for general questions when `GEMINI_API_KEY` is present.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_intent_router.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram_bot.py tests/test_intent_router.py
git commit -m "feat(telegram): implement IntentRouter with FTS5 search and script runner"
```

---

### Task 5: 24/7 Always-On Autostart & End-to-End Daemon Setup

**Files:**
- Create: `scripts/start_bot_silent.vbs`
- Create: `scripts/install_autostart.py`
- Modify: `README.md`
- Test: `tests/test_e2e_daemon.py`

**Interfaces:**
- Produces: Silent background process invocation and Windows Startup shortcut link in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FortisWayTelegramAgent.lnk`.

- [ ] **Step 1: Write the test verifying autostart script and shortcut generation**

```python
# tests/test_e2e_daemon.py
import os
from pathlib import Path

def test_silent_vbs_script_exists():
    vbs_path = Path("scripts/start_bot_silent.vbs")
    assert vbs_path.exists()
    content = vbs_path.read_text(encoding="utf-8")
    assert "telegram_bot.py" in content
    assert "pythonw" in content.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_e2e_daemon.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `scripts/start_bot_silent.vbs` and `scripts/install_autostart.py`**

- `start_bot_silent.vbs`: Uses `WScript.Shell` with window mode `0` (hidden) to launch `pythonw.exe scripts/telegram_bot.py`.
- `install_autostart.py`: Creates a Windows shortcut in the user's Startup folder so the bot starts automatically on system reboot.
- Update `README.md` and `AGENTS.md` with instructions for the Telegram Agent.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_e2e_daemon.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/start_bot_silent.vbs scripts/install_autostart.py README.md AGENTS.md tests/test_e2e_daemon.py
git commit -m "feat(telegram): configure 24/7 silent autostart on Windows startup"
```
