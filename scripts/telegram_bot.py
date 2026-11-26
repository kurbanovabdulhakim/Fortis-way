# -*- coding: utf-8 -*-
"""
FortisWay 24/7 Digital Librarian Bot & 3-Tier Vault Daemon.
Operates as a faithful library archivist:
1. Ingestion: Accepts texts, photos, videos, and documents, categorizes by country & cargo,
   and copies to Private Channel, GitHub repository, and Google Drive.
2. Auto-Clean Chat: Deletes incoming media and forwarded messages from the chat to keep it spotless.
3. Concise Batch Summaries: Sends short, consolidated 2-3 line summaries instead of repetitive spam cards.
4. Search & Retrieval: Delivers country-isolated files and notes on request.
5. Storage Analytics: Smartphone-style memory breakdown (/stats).
"""

import os
import sys
import time
import json
from datetime import datetime
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Safe logging for pythonw.exe and Windows UTF-8 stdout
LOGS_DIR = PROJECT_ROOT / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
DAEMON_LOG = LOGS_DIR / "telegram_daemon.log"

if sys.stdout is None:
    try:
        sys.stdout = open(DAEMON_LOG, "a", encoding="utf-8", buffering=1, errors="replace")
    except Exception:
        sys.stdout = open(os.devnull, "w")
else:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

if sys.stderr is None:
    try:
        sys.stderr = open(DAEMON_LOG, "a", encoding="utf-8", buffering=1, errors="replace")
    except Exception:
        sys.stderr = open(os.devnull, "w")
else:
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scripts.config import get_bot_config, SecurityGuard
from scripts.library_storage import LibraryStorage
from scripts.geo_classifier import classify_message
from scripts.telegram_client import TelegramClient

COUNTRY_FLAGS = {
    "Польша": "🇵🇱",
    "Нидерланды": "🇳🇱",
    "Узбекистан": "🇺🇿",
    "Китай": "🇨🇳",
    "Россия": "🇷🇺",
    "Турция": "🇹🇷",
    "Германия": "🇩🇪",
    "Казахстан": "🇰🇿",
    "Несортированное": "📁",
    "Общее": "🌐"
}

def format_bytes(byte_count: int) -> str:
    """Formats raw bytes into human readable MB or GB."""
    if not byte_count:
        return "0 МБ"
    mb = byte_count / (1024 * 1024)
    if mb >= 1024:
        return f"{mb / 1024:.1f} ГБ"
    return f"{mb:.1f} МБ"

def format_batch_summary(items: list[dict]) -> str:
    """Formats a concise 2-3 line summary for a batch of ingested items."""
    if not items:
        return ""

    if len(items) == 1:
        it = items[0]
        flag = COUNTRY_FLAGS.get(it["country"], "📁")
        if it.get("is_duplicate"):
            return f"⚠️ Файл уже есть в библиотеке (#{it['id']}, {flag} {it['country']}). Исходное сообщение удалено из чата."

        if it["content_type"] == "document":
            return f"📥 Сохранен документ: `{it['file_name']}` ({flag} {it['country']}, раздел `{it['category']}`).\nСообщение удалено из чата."
        elif it["content_type"] in ("photo", "video"):
            return f"📥 Сохранено медиа: `{it['title']}` ({flag} {it['country']}).\nСообщение удалено из чата."
        else:
            return f"📥 Зафиксировано в базе: `{it['title']}` ({flag} {it['country']}).\nСообщение удалено из чата."

    # Batch of multiple items
    docs = [it for it in items if it["content_type"] == "document"]
    photos = [it for it in items if it["content_type"] == "photo"]
    videos = [it for it in items if it["content_type"] == "video"]
    voices = [it for it in items if it["content_type"] in ("voice", "audio")]
    texts = [it for it in items if it["content_type"] == "text"]

    lines = [f"📥 *Принято и сохранено в базу (всего {len(items)} записей):*"]
    if docs:
        doc_names = ", ".join(f"`{d['file_name'] or d['title']}`" for d in docs[:3])
        if len(docs) > 3:
            doc_names += f" и еще {len(docs)-3}"
        lines.append(f"• 📑 Документы ({len(docs)} шт.): {doc_names}")
    if photos:
        lines.append(f"• 📸 Фотографии: {len(photos)} шт.")
    if videos:
        lines.append(f"• 🎬 Видеозаписи: {len(videos)} шт.")
    if voices:
        lines.append(f"• 🎙 Голосовые: {len(voices)} шт.")
    if texts:
        lines.append(f"• 💬 Сообщения и ставки: {len(texts)} шт.")

    lines.append("\nВсе материалы разложены по каталогам, сообщения удалены из чата для чистоты.")
    return "\n".join(lines)


class LibrarianRouter:
    def __init__(self, storage: LibraryStorage, client: TelegramClient, channel_id: str = "", repo_dir: str = None):
        self.storage = storage
        self.client = client
        self.channel_id = channel_id
        self.repo_dir = Path(repo_dir or PROJECT_ROOT)
        self.library_dir = self.repo_dir / "library"
        self.entries_dir = self.library_dir / "entries"
        self.entries_dir.mkdir(parents=True, exist_ok=True)

    def handle_message(self, msg: dict) -> str | dict:
        """
        Routes incoming messages:
        - If command/search: returns response string immediately.
        - If data intake: ingests, auto-deletes incoming message, returns intake summary dict.
        """
        msg_id = msg.get("message_id")
        chat_id = msg.get("chat", {}).get("id")
        text = (msg.get("text") or msg.get("caption") or "").strip()
        lower = text.lower()

        # Help / Start
        if text.startswith("/start") or text.startswith("/help") or lower in ("помощь", "справка", "меню", "библиотека"):
            return self._handle_help()

        # Stats (Smartphone-style storage breakdown)
        if text.startswith("/stats") or lower in ("статус", "память", "хранилище"):
            return self._handle_stats()

        # Catalog / Last
        if text.startswith("/catalog") or text.startswith("/last") or lower in ("каталог", "последние"):
            return self._handle_last()

        # Search Query ("найди ...", "покажи ...", "где ...", "? ...", "/find ...")
        is_search = False
        search_query = text
        for prefix in ("/find", "найди", "покажи", "где", "поиск", "search", "?"):
            if text.startswith(prefix) or lower.startswith(prefix):
                is_search = True
                search_query = text[len(prefix):].strip(" ?:;,")
                break

        if is_search:
            return self._handle_search(search_query, chat_id=chat_id)

        # INTAKE FLOW: Save new item to 3-tier library and auto-delete original user message
        return self._handle_intake(msg)

    def _handle_help(self) -> str:
        return (
            "📚 *FortisWay — Цифровой Бот-Библиотекарь*\n"
            "Менеджер: *Курбанов Абдулхаким* (@LogisticsFortisway)\n"
            "Режим: 🟢 3-уровневое неуязвимое хранилище (24/7)\n\n"
            "*Как пользоваться библиотекой:*\n"
            "• **Сохранить материал:** Отправьте боту любой текст, фото, видео или документ. Бот автоматически просканирует и сохранит данные в базу, а сообщение уберет из чата, чтобы не засорять переписку.\n"
            "• **Найти материал:** Напишите `найди <запрос>` или `? <запрос>` (например: `найди зерно` или `? Хоргос`).\n"
            "• **/stats** — Память и раскладка по типам файлов и странам.\n"
            "• **/catalog** или **/last** — Последние сохраненные записи."
        )

    def _handle_stats(self) -> str:
        stats = self.storage.get_storage_stats()
        tot_bytes = stats.get("total_bytes", 0)
        tot_mb = tot_bytes / (1024 * 1024)
        tot_gb = tot_mb / 1024
        free_gb = max(5120.0 - tot_gb, 0.0) # 5 TB = 5120 GB

        by_type = stats.get("by_type", {})
        vid = by_type.get("video", {"count": 0, "bytes": 0})
        pho = by_type.get("photo", {"count": 0, "bytes": 0})
        doc = by_type.get("document", {"count": 0, "bytes": 0})
        txt = by_type.get("text", {"count": 0, "bytes": 0})

        by_country = stats.get("by_country", {})

        country_lines = []
        for c_name, c_data in sorted(by_country.items(), key=lambda x: x[1]["bytes"], reverse=True):
            flag = COUNTRY_FLAGS.get(c_name, "🌐")
            country_lines.append(f"• {flag} *{c_name}*: {format_bytes(c_data['bytes'])} _({c_data['count']} записей)_")

        if not country_lines:
            country_lines.append("• _Материалы пока не внесены_")

        return (
            "📊 *ХРАНИЛИЩЕ FORTISWAY VAULT:*\n"
            f"Общий объем: `5 120 ГБ (5 ТБ)` | Занято: `{format_bytes(tot_bytes)}` | Свободно: `{free_gb:.1f} ГБ`\n\n"
            "📱 *РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ФАЙЛОВ:*\n"
            f"• 🎬 Видео (погрузка/выгрузка): {format_bytes(vid['bytes'])} ({vid['count']} файлов)\n"
            f"• 📸 Фотографии и пломбы:         {format_bytes(pho['bytes'])} ({pho['count']} файлов)\n"
            f"• 📑 Документы (CMR, ТТН, PDF):   {format_bytes(doc['bytes'])} ({doc['count']} файлов)\n"
            f"• 📝 Заметки и переписки:        {format_bytes(txt['bytes'])} ({txt['count']} записей)\n\n"
            "🌍 *МАТЕРИАЛЫ ПО СТРАНАМ:*\n" + "\n".join(country_lines)
        )

    def _handle_last(self) -> str:
        items = self.storage.get_last_items(limit=5)
        if not items:
            return "📚 Библиотека пока пуста. Отправьте первый текст, фото или документ!"

        lines = ["📚 *Последние поступления в библиотеку:*"]
        for it in items:
            flag = COUNTRY_FLAGS.get(it["country"], "🌐")
            sz = f" ({format_bytes(it['file_size_bytes'])})" if it.get("file_size_bytes") else ""
            lines.append(f"• *#{it['id']}* {flag} *{it['country']}* — `{it['title']}`{sz}\n  _Раздел: {it['category']}_")
        lines.append("\n_Для поиска введите: `найди <название>` или `? <страна>`_")
        return "\n\n".join(lines)

    def _handle_search(self, query: str, chat_id: int = None) -> str:
        if not query:
            return "⚠️ Укажите, что именно вы ищете. Например: `найди зерно` или `? Хоргос`."

        # Detect country filter from query if present
        country_filter = None
        for country, stems in [
            ("Польша", ["польш", "poland", "варшав"]),
            ("Нидерланды", ["нидерланд", "голланд", "роттердам"]),
            ("Узбекистан", ["узбекистан", "ташкент", "самарканд"]),
            ("Китай", ["китай", "china"]),
            ("Россия", ["росси", "russia", "москв"]),
            ("Турция", ["турци", "стамбул"]),
            ("Германия", ["германи", "берлин"]),
            ("Казахстан", ["казахстан", "алмат"])
        ]:
            if any(s in query.lower() for s in stems):
                country_filter = country
                break

        results = self.storage.find_items(query=query, country_filter=country_filter, limit=5)
        if not results:
            scope = f" по направлению {country_filter}" if country_filter else ""
            return f"🔍 В библиотеке{scope} по запросу «{query}» ничего не найдено."

        out = [f"📖 *Найдено в библиотеке по запросу «{query}»:*"]
        for r in results:
            flag = COUNTRY_FLAGS.get(r["country"], "🌐")
            sz = f" [{format_bytes(r['file_size_bytes'])}]" if r.get("file_size_bytes") else ""
            cargo = f" | Рейс: `{r['cargo_id']}`" if r.get("cargo_id") else ""
            file_info = f"\n  📎 Файл: `{r['file_name']}`{sz}" if r.get("file_name") else ""
            text_preview = f"\n  💬 _{r['raw_text'][:120]}..._" if r.get("raw_text") else ""

            card = f"• *#{r['id']}* {flag} *{r['country']}*{cargo}\n  📂 `{r['category']}`: *{r['title']}*{file_info}{text_preview}"
            out.append(card)

            # If matching record has a channel message ID and chat_id provided, copy message
            if chat_id and self.channel_id and r.get("channel_msg_id"):
                try:
                    self.client.copy_message(chat_id=chat_id, from_chat_id=self.channel_id, message_id=r["channel_msg_id"])
                except Exception:
                    pass

        return "\n\n".join(out)

    def _handle_intake(self, msg: dict) -> dict:
        chat_id = msg.get("chat", {}).get("id")
        msg_id = msg.get("message_id")
        text = (msg.get("text") or msg.get("caption") or "").strip()

        # Determine media type and attributes
        content_type = "text"
        file_name = ""
        file_size = 0
        file_unique_id = None

        if "photo" in msg:
            content_type = "photo"
            photo_sizes = msg["photo"]
            best_photo = photo_sizes[-1] # highest resolution
            file_size = best_photo.get("file_size", 0)
            file_unique_id = best_photo.get("file_unique_id")
            file_name = f"photo_{file_unique_id}.jpg"

        elif "video" in msg:
            content_type = "video"
            v = msg["video"]
            file_size = v.get("file_size", 0)
            file_unique_id = v.get("file_unique_id")
            file_name = v.get("file_name") or f"video_{file_unique_id}.mp4"

        elif "document" in msg:
            content_type = "document"
            d = msg["document"]
            file_size = d.get("file_size", 0)
            file_unique_id = d.get("file_unique_id")
            file_name = d.get("file_name") or f"doc_{file_unique_id}.bin"

        elif "voice" in msg or "audio" in msg:
            content_type = "voice"
            a = msg.get("voice") or msg.get("audio")
            file_size = a.get("file_size", 0)
            file_unique_id = a.get("file_unique_id")
            file_name = f"audio_{file_unique_id}.oga"

        # Classification
        classification = classify_message(text=text, file_name=file_name, content_type=content_type)
        country = classification["country"]
        category = classification["category"]
        cargo_id = classification["cargo_id"]

        # Generate a concise title
        if text:
            first_line = text.split("\n")[0][:60]
            title = first_line
        elif file_name:
            title = file_name
        else:
            title = f"{content_type.capitalize()} от {datetime.now().strftime('%d.%m %H:%M')}"

        # Level 1: Copy to Private Telegram Channel (if channel is configured)
        channel_msg_id = None
        if self.channel_id and chat_id:
            try:
                flag = COUNTRY_FLAGS.get(country, "🌐")
                banner = f"📚 FortisWay Vault | {flag} #{country}\n📂 #{category.replace(' ', '_')}\n🚛 #{cargo_id}"
                copy_res = self.client.copy_message(
                    chat_id=self.channel_id,
                    from_chat_id=chat_id,
                    message_id=msg_id,
                    caption=f"{banner}\n\n{text}".strip()
                )
                if copy_res.get("ok"):
                    channel_msg_id = copy_res.get("result", {}).get("message_id")
            except Exception as e:
                print(f"[!] Ошибка копирования в канал: {e}")

        # Store in SQLite master database
        item_res = self.storage.add_item(
            country=country,
            category=category,
            title=title,
            content_type=content_type,
            telegram_msg_id=msg_id,
            channel_msg_id=channel_msg_id,
            cargo_id=cargo_id,
            raw_text=text,
            file_name=file_name,
            file_size_bytes=file_size,
            file_unique_id=file_unique_id
        )

        item_id = item_res["id"]
        is_dup = item_res.get("is_duplicate", False)

        # Level 2: Save Markdown card to GitHub repository
        if not is_dup:
            try:
                card_filename = f"{datetime.now().strftime('%Y-%m-%d')}-item-{item_id}.md"
                card_path = self.entries_dir / card_filename
                card_content = (
                    f"---\n"
                    f"id: {item_id}\n"
                    f"date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"country: {country}\n"
                    f"cargo_id: {cargo_id}\n"
                    f"category: {category}\n"
                    f"content_type: {content_type}\n"
                    f"file_name: {file_name}\n"
                    f"file_size: {format_bytes(file_size)}\n"
                    f"---\n\n"
                    f"# {title}\n\n"
                    f"{text}\n"
                )
                card_path.write_text(card_content, encoding="utf-8")
            except Exception as e:
                print(f"[!] Ошибка записи карточки в git: {e}")

            # Update WebApp live catalog.json
            try:
                if hasattr(self.storage, "export_catalog_json"):
                    self.storage.export_catalog_json(str(self.repo_dir / "web" / "catalog.json"))
            except Exception as e:
                print(f"[!] Ошибка обновления web/catalog.json: {e}")

        # AUTO-CLEAN: Delete user's incoming message from chat so it does not clutter
        if chat_id and msg_id:
            try:
                self.client.delete_message(chat_id=chat_id, message_id=msg_id)
            except Exception as e:
                print(f"[!] Ошибка удаления сообщения {msg_id}: {e}")

        return {
            "type": "intake",
            "id": item_id,
            "title": title,
            "country": country,
            "category": category,
            "content_type": content_type,
            "file_name": file_name,
            "file_size": file_size,
            "is_duplicate": is_dup
        }


def _update_channel_env(channel_id: str):
    """Saves detected channel ID to .env file for persistence."""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        text = env_path.read_text(encoding="utf-8")
        lines = text.splitlines()
        found = False
        new_lines = []
        for l in lines:
            if l.startswith("TELEGRAM_CHANNEL_ID="):
                new_lines.append(f"TELEGRAM_CHANNEL_ID={channel_id}")
                found = True
            else:
                new_lines.append(l)
        if not found:
            new_lines.append(f"TELEGRAM_CHANNEL_ID={channel_id}")
        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    os.environ["TELEGRAM_CHANNEL_ID"] = channel_id


def run_librarian_daemon(once: bool = False):
    """Main continuous 24/7 daemon loop for Librarian Bot with batching and auto-clean."""
    config = get_bot_config()
    token = config.get("bot_token")
    if not token:
        print("[!] Ошибка: Не задан TELEGRAM_BOT_TOKEN")
        sys.exit(1)

    admin_username = config.get("admin_username")
    db_path = config.get("db_path")
    channel_id = os.environ.get("TELEGRAM_CHANNEL_ID") or "-1003463990808"

    guard = SecurityGuard(admin_username=admin_username)
    storage = LibraryStorage(db_path=db_path)
    client = TelegramClient(token=token)
    router = LibrarianRouter(storage=storage, client=client, channel_id=channel_id)

    # Export latest catalog.json for WebApp on start
    try:
        storage.export_catalog_json(str(PROJECT_ROOT / "web" / "catalog.json"))
    except Exception:
        pass

    # Configure registered bot commands
    try:
        client.set_commands([
            {"command": "stats", "description": "📊 Память и хранилище FortisWay"},
            {"command": "catalog", "description": "📚 Каталог поступлений по странам"},
            {"command": "last", "description": "⏱ Последние 5 записей"},
            {"command": "help", "description": "ℹ️ Справка и поиск по библиотеке"}
        ])
    except Exception as e:
        print(f"[!] Предупреждение: Не удалось обновить команды: {e}")

    # Configure WebApp Menu Button (points to live GitHub Pages WebApp)
    WEB_APP_URL = "https://kurbanovabdulhakim.github.io/Fortis-way/web/index.html?v=5"
    try:
        client.set_menu_button(web_app_url=WEB_APP_URL, text="Каталог 📚")
        admin_id = guard.admin_user_id or 8930092703
        client.set_menu_button(web_app_url=WEB_APP_URL, chat_id=admin_id, text="Каталог 📚")
    except Exception as e:
        print(f"[!] Предупреждение: Не удалось настроить кнопку WebApp: {e}")

    print("[*] FortisWay 24/7 Digital Librarian Daemon запущен (режим авто-очистки и тихих отчетов).")
    print(f"[*] Авторизованный администратор: @{admin_username}")
    print(f"[*] База данных библиотеки: {db_path}")

    me = client.get_me()
    if me.get("ok"):
        print(f"[*] Библиотекарь подключен: @{me.get('result', {}).get('username')}")

    offset = None
    backoff = 1.0

    while True:
        try:
            updates = client.get_updates(offset=offset, timeout=25)
            backoff = 1.0

            if not updates:
                if once:
                    break
                continue

            # Batch collection of intake items per chat
            batch_intake_by_chat = {}

            def process_single_update(update_item):
                nonlocal offset
                uid = update_item.get("update_id")
                offset = uid + 1

                # Auto-detect channel if bot was added as admin
                my_chat_member = update_item.get("my_chat_member")
                if my_chat_member:
                    chat = my_chat_member.get("chat", {})
                    if chat.get("type") == "channel":
                        cid = str(chat.get("id"))
                        router.channel_id = cid
                        _update_channel_env(cid)
                        print(f"[*] Привязан приватный канал {chat.get('title')} (ID: {cid})")

                # Auto-detect channel if channel post received
                channel_post = update_item.get("channel_post")
                if channel_post:
                    chat = channel_post.get("chat", {})
                    if chat.get("id"):
                        cid = str(chat.get("id"))
                        router.channel_id = cid
                        _update_channel_env(cid)

                msg = update_item.get("message")
                if not msg:
                    return

                # Auto-detect channel if forwarded from channel
                fwd = msg.get("forward_from_chat")
                if fwd and fwd.get("type") == "channel":
                    cid = str(fwd.get("id"))
                    router.channel_id = cid
                    _update_channel_env(cid)
                    print(f"[*] Привязан канал из пересланного поста: {fwd.get('title')} (ID: {cid})")

                sender = msg.get("from", {})
                chat_id = msg.get("chat", {}).get("id")
                sender_user = sender.get("username", "")
                sender_id = sender.get("id", 0)

                # Security check
                if sender_id and not guard.is_authorized(username=sender_user, user_id=sender_id):
                    print(f"  [!] Отклонен неавторизованный пользователь: @{sender_user} (ID: {sender_id})")
                    client.send_message(
                        chat_id=chat_id,
                        text="⛔ *Доступ ограничен.*\nБот настроен исключительно для менеджера FortisWay (@LogisticsFortisway)."
                    )
                    return

                # Process message
                res = router.handle_message(msg)
                if isinstance(res, str) and chat_id:
                    # Direct command or search: reply immediately
                    client.send_message(chat_id=chat_id, text=res)
                elif isinstance(res, dict) and res.get("type") == "intake" and chat_id:
                    # Content intake: collect into batch
                    batch_intake_by_chat.setdefault(chat_id, []).append(res)

            # Process initial updates
            for u in updates:
                process_single_update(u)

            # Check for immediate follow-up burst updates within 0.8s
            burst_rounds = 0
            while burst_rounds < 3:
                time.sleep(0.4)
                more_updates = client.get_updates(offset=offset, timeout=0)
                if not more_updates:
                    break
                for u in more_updates:
                    process_single_update(u)
                burst_rounds += 1

            # Send single consolidated summary for chats that had intake items
            for cid, items in batch_intake_by_chat.items():
                summary = format_batch_summary(items)
                if summary:
                    client.send_message(chat_id=cid, text=summary)

            if once:
                break

        except KeyboardInterrupt:
            print("\n[*] Завершение работы по команде пользователя.")
            break
        except Exception as e:
            print(f"[!] Сбой в цикле polling: {e}. Переподключение через {backoff}с...")
            time.sleep(backoff)
            backoff = min(backoff * 2, 30.0)

if __name__ == "__main__":
    is_once = "--once" in sys.argv
    run_librarian_daemon(once=is_once)
