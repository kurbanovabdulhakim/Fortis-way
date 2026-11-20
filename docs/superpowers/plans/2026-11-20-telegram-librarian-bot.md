# FortisWay Librarian Bot & 3-Tier Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `@hermes_0078bot` into an autonomous 24/7 digital Librarian Bot that stores all submitted texts, documents, photos, and videos into a 3-tier indestructible vault (Private Telegram Channel + GitHub repository + 5TB Google Drive) with strict geographic cargo isolation, smartphone-style `/stats`, and instant retrieval.

**Architecture:** A lightweight standard-library Python daemon (`scripts/telegram_bot.py`) that receives updates from `@LogisticsFortisway`, auto-classifies media and notes by destination country/shipment, archives items to the private Telegram channel, records structured cards into SQLite FTS5 and GitHub, and delivers country-isolated search results with original files and Google Drive links.

**Tech Stack:** Python 3 (stdlib: `sqlite3`, `urllib.request`, `json`, `hashlib`, `re`, `pathlib`), pytest, Telegram Bot API, HTML5 WebApp.

**Spec:** [2026-11-20-telegram-librarian-bot-design.md](file:///c:/Users/user/Fortis-way/docs/superpowers/specs/2026-11-20-telegram-librarian-bot-design.md)

## Global Constraints

- Bot token: `9221650250:AAFz-L5k5sBaExEFQdifbAIGNeW9prlmXu4` in `.env`.
- Authorized manager: `@LogisticsFortisway` (numeric ID `8930092703`).
- Private channel archive: `https://t.me/+VeTqayUTctU0MmMy`.
- Master Database: `db/fortisway.db` (WAL mode, table `library_items`, virtual table `library_fts`).
- All old operational features (task creation, plan_fact mirroring, tariffs, script runners, hallucinations) are completely eliminated.
- Files > 20 MB must be archived via Telegram `copyMessage`/`forwardMessage` to the private channel to avoid Bot API download limits.
- Geo-isolation: A search for a country (e.g. `Польша`) must strictly return only records for that country.

## Review Focus

- Deduplication: Submitting the same file/photo twice must return the existing record ID instead of duplicating.
- Country isolation: Searching `Польша` must never return items categorized under `Узбекистан` or `Нидерланды`.
- Unlabeled input: Bare photos or files without text must trigger an interactive 1-tap country selector.
- Smartphone `/stats`: Must calculate exact megabytes/gigabytes and count per media type (video, photo, document, excel, text) and per country.
- Long queries / typos: Fuzzy geographic alias mapping (`варшава` -> `Польша`, `роттердам` -> `Нидерланды`).

---

### Task 1: Database Schema & Library Storage Service

**Files:**
- Modify: `db/schema.sql`
- Create: `scripts/library_storage.py`
- Test: `tests/test_library_storage.py`

**Interfaces:**
- Produces: `LibraryStorage(db_path: str)`:
  - `add_item(...) -> dict` (returns `{id, is_duplicate, country, category}`)
  - `find_items(query: str, country_filter: str = None, limit: int = 10) -> list[dict]`
  - `get_storage_stats() -> dict` (breakdown by file type and country with bytes)
  - `get_last_items(limit: int = 5) -> list[dict]`

- [ ] **Step 1: Write failing tests for LibraryStorage**

```python
# tests/test_library_storage.py
import pytest
import sqlite3
from scripts.library_storage import LibraryStorage

@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_library.db"
    return str(db_file)

def test_add_item_and_deduplication(test_db):
    storage = LibraryStorage(test_db)
    res1 = storage.add_item(
        telegram_msg_id=101,
        country="Польша",
        cargo_id="BakanTex_01",
        category="01_Документы",
        content_type="document",
        title="CMR накладная Варшава",
        raw_text="Груз отправлен из Варшавы",
        file_name="cmr_01.pdf",
        file_size_bytes=1048576,
        file_unique_id="unique_file_abc123"
    )
    assert res1["id"] > 0
    assert res1["is_duplicate"] is False
    
    # Submitting identical file_unique_id returns is_duplicate True and same id
    res2 = storage.add_item(
        telegram_msg_id=102,
        country="Польша",
        file_unique_id="unique_file_abc123",
        title="Повторная накладная",
        category="01_Документы",
        content_type="document"
    )
    assert res2["is_duplicate"] is True
    assert res2["id"] == res1["id"]

def test_country_isolated_search(test_db):
    storage = LibraryStorage(test_db)
    storage.add_item(country="Польша", title="Польша CMR", raw_text="Ткани Bakan Tex", category="01_Документы", content_type="document")
    storage.add_item(country="Узбекистан", title="Узбекистан Разгрузка", raw_text="Склад Ташкент", category="03_Видео", content_type="video")
    
    # Querying Poland
    poland_results = storage.find_items(query="Польша")
    assert len(poland_results) == 1
    assert poland_results[0]["country"] == "Польша"
    
    # Querying with country_filter
    uz_results = storage.find_items(query="", country_filter="Узбекистан")
    assert len(uz_results) == 1
    assert uz_results[0]["country"] == "Узбекистан"

def test_smartphone_stats(test_db):
    storage = LibraryStorage(test_db)
    storage.add_item(country="Польша", content_type="video", file_size_bytes=50000000, category="03_Видео", title="Видео 1")
    storage.add_item(country="Польша", content_type="photo", file_size_bytes=5000000, category="02_Фото", title="Фото 1")
    storage.add_item(country="Нидерланды", content_type="document", file_size_bytes=2000000, category="01_Документы", title="Док 1")
    
    stats = storage.get_storage_stats()
    assert "by_type" in stats
    assert "by_country" in stats
    assert stats["by_type"]["video"]["count"] == 1
    assert stats["by_type"]["video"]["bytes"] == 50000000
    assert stats["by_country"]["Польша"]["bytes"] == 55000000
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_library_storage.py -v`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement `scripts/library_storage.py` and update `db/schema.sql`**

Implement tables `library_items` and `library_fts`, WAL mode, indexing, deduplication logic, country-isolated search, and smartphone `/stats` calculation.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_library_storage.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add db/schema.sql scripts/library_storage.py tests/test_library_storage.py
git commit -m "feat(library): implement LibraryStorage with deduplication and stats"
```

---

### Task 2: Geographic & Cargo Taxonomy Engine

**Files:**
- Create: `scripts/geo_classifier.py`
- Test: `tests/test_geo_classifier.py`

**Interfaces:**
- Produces: `classify_message(text: str, file_name: str = "", content_type: str = "text") -> dict`
  - Returns `{country: str, category: str, cargo_id: str, tags: list[str]}`

- [ ] **Step 1: Write failing tests for geo classifier**

```python
# tests/test_geo_classifier.py
import pytest
from scripts.geo_classifier import classify_message

def test_classify_poland_video():
    res = classify_message(text="Польша Bakan Tex разгрузка завершена", file_name="vid_001.mp4", content_type="video")
    assert res["country"] == "Польша"
    assert res["category"] == "03_Видео_Выгрузки"
    assert "BakanTex" in res["cargo_id"]

def test_classify_alias_rotterdam():
    res = classify_message(text="Пришла машина из Роттердама, CMR на руках", file_name="scan.pdf", content_type="document")
    assert res["country"] == "Нидерланды"
    assert res["category"] == "01_Документы_CMR_Инвойсы"

def test_classify_unlabeled_fallback():
    res = classify_message(text="", file_name="image.jpg", content_type="photo")
    assert res["country"] == "Несортированное"
    assert res["category"] == "02_Фото_Погрузки_Пломб"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_geo_classifier.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `scripts/geo_classifier.py`**

Implement dictionary mapping for geographic regions (Poland, Netherlands, Uzbekistan, China, Russia, Turkey, Germany, Kazakhstan), cargo stage keywords (погрузка, пломба, выгрузка, cmr, инвойс, акт, претензия, задержка), and auto-category assignment.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_geo_classifier.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/geo_classifier.py tests/test_geo_classifier.py
git commit -m "feat(library): add geographic and cargo stage classification engine"
```

---

### Task 3: Telegram Client Enhancements (Channel Forwarding & WebApp Menu)

**Files:**
- Modify: `scripts/telegram_client.py`
- Test: `tests/test_telegram_channel.py`

**Interfaces:**
- Extends: `TelegramClient`:
  - `copy_message(chat_id: int | str, from_chat_id: int, message_id: int, caption: str = "") -> dict`
  - `send_media_with_buttons(chat_id: int, text: str, reply_markup: dict = None) -> dict`
  - `set_menu_button(web_app_url: str = "") -> dict`

- [ ] **Step 1: Write failing tests for channel copy and menu button**

```python
# tests/test_telegram_channel.py
from unittest.mock import patch, MagicMock
from scripts.telegram_client import TelegramClient

def test_copy_message_to_channel():
    client = TelegramClient("dummy_token")
    mock_cm = MagicMock()
    mock_cm.__enter__.return_value.read.return_value = b'{"ok": true, "result": {"message_id": 999}}'
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = client.copy_message(chat_id="-1001234567890", from_chat_id=123, message_id=456, caption="#Польша")
        assert res["ok"] is True
        assert res["result"]["message_id"] == 999

def test_set_menu_button():
    client = TelegramClient("dummy_token")
    mock_cm = MagicMock()
    mock_cm.__enter__.return_value.read.return_value = b'{"ok": true, "result": true}'
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = client.set_menu_button("https://kurbanovabdulhakim.github.io/Fortis-way/")
        assert res["ok"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_telegram_channel.py -v`
Expected: FAIL

- [ ] **Step 3: Implement methods in `scripts/telegram_client.py`**

Add `copy_message` (uses Telegram API `copyMessage` for seamless transfer of any size up to 2GB to the private channel), `send_inline_keyboard`, and `set_menu_button` (`setChatMenuButton` with WebApp).

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_telegram_channel.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram_client.py tests/test_telegram_channel.py
git commit -m "feat(telegram): add channel copyMessage and WebApp menu button configuration"
```

---

### Task 4: Complete Librarian Bot Router & Search Engine

**Files:**
- Modify: `scripts/telegram_bot.py`
- Test: `tests/test_librarian_router.py`

**Interfaces:**
- Strips out old task and plan_fact functions.
- Wires: `LibrarianRouter`:
  - `handle_incoming_message(msg: dict) -> str | dict`
  - Handles text, photo, video, document, voice, audio.
  - Generates smartphone `/stats` report.
  - Implements country-isolated search (`найди ...`, `? ...`).

- [ ] **Step 1: Write failing tests for LibrarianRouter**

```python
# tests/test_librarian_router.py
import pytest
from unittest.mock import MagicMock
from scripts.telegram_bot import LibrarianRouter

def test_intake_text_note():
    storage = MagicMock()
    storage.add_item.return_value = {"id": 15, "is_duplicate": False, "country": "Польша", "category": "04_Переписка"}
    client = MagicMock()
    
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel")
    reply = router.handle_message({
        "message_id": 1,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "Польша: поставщик задерживает отгрузку до вторника"
    })
    assert "15" in reply
    assert "Польша" in reply
    assert "сохранена в библиотеку" in reply.lower()

def test_query_country_search():
    storage = MagicMock()
    storage.find_items.return_value = [{
        "id": 12,
        "created_at": "2026-11-20 12:00:00",
        "country": "Польша",
        "category": "03_Видео_Выгрузки",
        "title": "Видео выгрузки Bakan Tex",
        "raw_text": "Выгрузка 20 тонн",
        "file_name": "unloading.mp4",
        "channel_msg_id": 88
    }]
    client = MagicMock()
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel")
    
    reply = router.handle_message({
        "message_id": 2,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "найди видео выгрузки Польша"
    })
    assert "Bakan Tex" in reply
    assert "Польша" in reply
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_librarian_router.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `LibrarianRouter` in `scripts/telegram_bot.py`**

Replace all legacy logic. Implement multi-media intake, channel copy, classification, deduplication, search with file delivery, `/stats` smartphone visualization, and `/catalog`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_librarian_router.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram_bot.py tests/test_librarian_router.py
git commit -m "feat(library): replace bot logic with LibrarianRouter and smartphone stats"
```

---

### Task 5: Mobile WebApp Catalog & System Integration

**Files:**
- Create: `web/index.html`
- Create: `web/app.js`
- Create: `web/style.css`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Test: `tests/test_e2e_librarian.py`

**Interfaces:**
- Produces: Responsive Telegram WebApp catalog with country flags filter and smartphone storage meter bar.

- [ ] **Step 1: Write test for WebApp files and integration**

```python
# tests/test_e2e_librarian.py
from pathlib import Path

def test_webapp_assets_exist():
    assert Path("web/index.html").exists()
    content = Path("web/index.html").read_text(encoding="utf-8")
    assert "Telegram.WebApp" in content
    assert "Польша" in content or "Нидерланды" in content
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_e2e_librarian.py -v`
Expected: FAIL

- [ ] **Step 3: Implement WebApp in `web/` and update documentation**

Design a mobile-first HTML5 WebApp with dark mode, country cards (Poland, Netherlands, Uzbekistan, China), media filters, storage meter bar, and search bar. Update `README.md` and `AGENTS.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_e2e_librarian.py -v`
Expected: PASS

- [ ] **Step 5: Commit & Start 24/7 background daemon**

```bash
git add web/ README.md AGENTS.md tests/test_e2e_librarian.py
git commit -m "feat(library): add mobile WebApp catalog and finalize librarian architecture"
```
