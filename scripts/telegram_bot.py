# -*- coding: utf-8 -*-
"""
FortisWay 24/7 Autonomous Telegram Agent & Task Queue Daemon.
Operates via Telegram Bot API with SQLite SSOT integration and remote runner.
"""

import os
import sys
import time
import json
import sqlite3
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.config import get_bot_config, SecurityGuard
from scripts.task_storage import TaskStorage
from scripts.telegram_client import TelegramClient

WHITELISTED_SCRIPTS = {
    "build_db.py": "Сборка и синхронизация мастер-базы fortisway.db",
    "export_vcard.py": "Экспорт базы контактов в формат vCard (.vcf)",
    "query.py": "Быстрый поиск и сводка базы данных",
    "reformat_goldenpages_excel.py": "Форматирование таблицы GoldenPages",
    "reformat_translogistica_excel.py": "Форматирование базы TransLogistica 2026",
    "update_translogistica_cards.py": "Обновление визиток TransLogistica"
}

START_TIME = datetime.now()

class IntentRouter:
    def __init__(self, storage: TaskStorage, db_path: str = None, gemini_api_key: str = ""):
        self.storage = storage
        self.db_path = str(db_path or (PROJECT_ROOT / "db" / "fortisway.db"))
        self.gemini_api_key = gemini_api_key

    def handle_text(self, text: str, msg_id: int = None) -> str:
        text = (text or "").strip()
        if not text:
            return "Пустое сообщение. Введите /help для справки."

        lower = text.lower()

        # Help / Start
        if text.startswith("/start") or text.startswith("/help") or lower in ("помощь", "справка", "меню"):
            return self._handle_help()

        # Status
        if text.startswith("/status") or lower in ("статус", "uptime", "состояние"):
            return self._handle_status()

        # Task Add
        if text.startswith("/task") or lower.startswith("запиши задачу") or lower.startswith("напомни") or lower.startswith("добавь задачу"):
            task_desc = text
            for prefix in ("/task", "запиши задачу:", "запиши задачу", "напомни:", "напомни", "добавь задачу:", "добавь задачу"):
                if text.lower().startswith(prefix):
                    task_desc = text[len(prefix):].strip()
                    break
            if not task_desc:
                return "⚠️ Укажите текст задачи, например:\n`/task Позвонить в Bakan Tex`"
            task_id = self.storage.add_task(task_desc, telegram_msg_id=msg_id)
            return f"✅ *Задача #{task_id} успешно добавлена и сохранена в базу FortisWay!*\n\n📝 `{task_desc}`\n🔄 Синхронизировано с отчетом `plan_fact`."

        # Tasks List
        if text.startswith("/tasks") or lower in ("мои задачи", "список задач", "задачи", "план"):
            return self._handle_list_tasks()

        # Task Done
        if text.startswith("/done") or lower.startswith("сделано") or lower.startswith("выполнено") or lower.startswith("завершить"):
            parts = text.split(maxsplit=2)
            if len(parts) < 2 or not parts[1].isdigit():
                return "⚠️ Укажите номер задачи, например: `/done 5` или `/done 5 договор подписан`"
            task_id = int(parts[1])
            res_note = parts[2] if len(parts) > 2 else ""
            if self.storage.complete_task(task_id, result_text=res_note):
                note_str = f" ({res_note})" if res_note else ""
                return f"🎉 *Задача #{task_id} завершена и отмечена как выполненная!*{note_str}\nСтатус в `plan_fact` обновлен на 'Сделано'."
            return f"❌ Задача #{task_id} не найдена."

        # Search Clients / Exhibition / DB
        if text.startswith("/search") or lower.startswith("найди") or lower.startswith("поиск"):
            query = text
            for prefix in ("/search", "найди", "поиск"):
                if text.lower().startswith(prefix):
                    query = text[len(prefix):].strip()
                    break
            if not query:
                return "⚠️ Укажите поисковый запрос, например: `/search крахмал`"
            return self._handle_search(query)

        # Tariffs
        if text.startswith("/tariff") or lower.startswith("тариф") or lower.startswith("ставки") or lower.startswith("ставка"):
            query = text
            for prefix in ("/tariff", "тарифы", "тариф", "ставки", "ставка"):
                if text.lower().startswith(prefix):
                    query = text[len(prefix):].strip()
                    break
            return self._handle_tariffs(query)

        # Run Script
        if text.startswith("/run"):
            parts = text.split()
            if len(parts) < 2:
                available = "\n".join([f"• `{s}` — {desc}" for s, desc in WHITELISTED_SCRIPTS.items()])
                return f"⚠️ Укажите имя скрипта для запуска:\n\n*Доступные скрипты:*\n{available}\n\nПример: `/run build_db.py`"
            script_name = parts[1]
            if script_name not in WHITELISTED_SCRIPTS and f"{script_name}.py" in WHITELISTED_SCRIPTS:
                script_name = f"{script_name}.py"
            return self._handle_run_script(script_name, parts[2:])

        # AI Converse / Fallback
        return self._handle_converse_or_fallback(text)

    def _handle_help(self) -> str:
        return (
            "🚚 *FortisWay Logistics — 24/7 AI Агент*\n"
            "Менеджер: *Курбанов Абдулхаким*\n"
            "Статус: 🟢 В сети (Круглосуточный режим)\n\n"
            "*Команды управления:*\n"
            "• `/task <текст>` — Сохранить задачу в очередь и `plan_fact`\n"
            "• `/tasks` — Список активных задач\n"
            "• `/done <id>` — Отметить задачу выполненной\n"
            "• `/search <запрос>` — Поиск по 428 клиентам и выставкам\n"
            "• `/tariff <направление>` — Проверка ставок и маршрутов\n"
            "• `/run <скрипт>` — Запуск разрешенных скриптов\n"
            "• `/status` — Состояние системы и сводка базы данных\n\n"
            "_Также вы можете просто писать текстом: «найди крахмал», «запиши задачу...», «какие ставки до Польши»._"
        )

    def _handle_status(self) -> str:
        stats = self.storage.get_db_stats()
        uptime_sec = int((datetime.now() - START_TIME).total_seconds())
        uptime_str = f"{uptime_sec // 3600}ч {(uptime_sec % 3600) // 60}м {uptime_sec % 60}с"
        
        return (
            "📊 *Статус FortisWay Agent:*\n"
            f"• Режим работы: 🟢 24/7 Активен\n"
            f"• Uptime: `{uptime_str}`\n"
            f"• База данных: `fortisway.db` (WAL Mode)\n\n"
            "*Сводка записей базы:*\n"
            f"👥 Клиенты (GoldenPages): *{stats.get('clients', 0)}*\n"
            f"🏭 Лиды с выставок: *{stats.get('exhibition_leads', 0)}*\n"
            f"🛣 Тарифы и маршруты: *{stats.get('tariffs_routes', 0)}*\n"
            f"📋 Записи Plan-Fact: *{stats.get('plan_fact', 0)}*\n"
            f"📌 Активных задач: {stats.get('pending_tasks', 0)}"
        )

    def _handle_list_tasks(self) -> str:
        pending = self.storage.list_pending_tasks(limit=15)
        if not pending:
            return "✅ Все текущие задачи выполнены! Активных задач нет."
        
        lines = ["📌 *Список активных задач в очереди:*"]
        for t in pending:
            lines.append(f"• *#{t['id']}* `{t['task_text']}` _({t['created_at'][:10]})_")
        lines.append("\n_Для завершения напишите: `/done <номер>`_")
        return "\n".join(lines)

    def _handle_search(self, query: str) -> str:
        if not Path(self.db_path).exists():
            return "❌ База данных `db/fortisway.db` не найдена."
            
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            
            # FTS search first if available
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='fts_index';")
            if cur.fetchone():
                try:
                    cur.execute("""
                        SELECT entity_type, entity_id, title, snippet(fts_index, 3, '[', ']', '...', 15) as snip
                        FROM fts_index
                        WHERE fts_index MATCH ?
                        LIMIT 5;
                    """, (f'"{query}"*',))
                    fts_rows = cur.fetchall()
                    if fts_rows:
                        out = [f"🔍 *Результаты поиска по запросу «{query}»:*"]
                        for r in fts_rows:
                            out.append(f"• *[{r['entity_type']}]* {r['title']}\n  _{r['snip']}_")
                        return "\n".join(out)
                except Exception:
                    pass

            # Fallback standard search on clients and exhibition_leads
            like_q = f"%{query}%"
            cur.execute("""
                SELECT company, name, position, phone, city
                FROM clients
                WHERE company LIKE ? OR name LIKE ? OR call_result LIKE ?
                LIMIT 5;
            """, (like_q, like_q, like_q))
            client_rows = cur.fetchall()

            cur.execute("""
                SELECT company, contact_person, activity_field, phone
                FROM exhibition_leads
                WHERE company LIKE ? OR contact_person LIKE ? OR activity_field LIKE ?
                LIMIT 5;
            """, (like_q, like_q, like_q))
            lead_rows = cur.fetchall()

            if not client_rows and not lead_rows:
                return f"🔍 По запросу «{query}» ничего не найдено в базе клиентов и лидов."

            out = [f"🔍 *Найдено по запросу «{query}»:*"]
            for r in client_rows:
                out.append(f"🏢 *{r['company']}* ({r['city'] or 'Ташкент'})\n  👤 {r['name'] or 'Контакт'} | 📞 `{r['phone'] or 'нет'}`")
            for r in lead_rows:
                out.append(f"🏭 *{r['company']}* (Выставка)\n  👤 {r['contact_person'] or 'Лицо'} | 📞 `{r['phone'] or 'нет'}`")
            return "\n\n".join(out)

    def _handle_tariffs(self, query: str = "") -> str:
        if not Path(self.db_path).exists():
            return "❌ База данных не найдена."
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            if query:
                like_q = f"%{query}%"
                cur.execute("""
                    SELECT route_name, rate, currency, vehicle_type, transit_days, conditions
                    FROM tariffs_routes
                    WHERE route_name LIKE ? OR conditions LIKE ? OR cargo_type LIKE ?
                    LIMIT 6;
                """, (like_q, like_q, like_q))
            else:
                cur.execute("""
                    SELECT route_name, rate, currency, vehicle_type, transit_days, conditions
                    FROM tariffs_routes LIMIT 6;
                """)
            rows = cur.fetchall()
            if not rows:
                return f"🛣 По направлению «{query}» тарифов в базе пока не найдено."

            out = ["🛣 *Тарифы и ставки перевозки FortisWay:*"]
            for r in rows:
                price = f"{r['rate']:,.0f} {r['currency']}" if r['rate'] else "По запросу"
                veh = f" ({r['vehicle_type']})" if r['vehicle_type'] else ""
                days = f" | ⏱ {r['transit_days']}" if r['transit_days'] else ""
                out.append(f"• *{r['route_name']}*{veh}\n  💰 `{price}`{days}\n  _{r['conditions'] or ''}_")
            return "\n\n".join(out)

    def _handle_run_script(self, script_name: str, args: list) -> str:
        if script_name not in WHITELISTED_SCRIPTS:
            allowed = ", ".join(WHITELISTED_SCRIPTS.keys())
            return f"⛔ Скрипт `{script_name}` запрещен к запуску.\nРазрешенные: {allowed}"

        script_file = PROJECT_ROOT / "scripts" / script_name
        if not script_file.exists():
            return f"❌ Файл скрипта `{script_name}` не найден в каталоге `scripts/`."

        cmd = [sys.executable, str(script_file)] + args
        try:
            start_t = time.time()
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(PROJECT_ROOT)
            )
            elapsed = round(time.time() - start_t, 2)
            stdout = (res.stdout or "").strip()
            stderr = (res.stderr or "").strip()
            
            if res.returncode == 0:
                short_out = stdout[-1500:] if len(stdout) > 1500 else stdout
                return f"✅ *Скрипт `{script_name}` успешно выполнен!* ({elapsed}с)\n\n```\n{short_out or 'Вывод пуст'}\n```"
            else:
                short_err = stderr[-1500:] if len(stderr) > 1500 else stderr
                return f"⚠️ *Ошибка при выполнении `{script_name}`* (код {res.returncode}, {elapsed}с):\n\n```\n{short_err or stdout}\n```"
        except subprocess.TimeoutExpired:
            return f"⏱ Превышен лимит времени выполнения (120 секунд) для `{script_name}`."
        except Exception as e:
            return f"❌ Ошибка вызова скрипта: {e}"

    def _handle_converse_or_fallback(self, text: str) -> str:
        # Check if query matches client/lead names or products first
        search_reply = self._handle_search(text)
        if "Найдено по запросу" in search_reply or "Результаты поиска" in search_reply:
            return search_reply

        # If Gemini API Key is available, call Gemini API
        if self.gemini_api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
                system_prompt = (
                    "Ты — персональный AI-ассистент Курбанова Абдулхакима, менеджера по логистике компании FortisWay (fortisway.uz). "
                    "Компания осуществляет международные грузоперевозки со всеми странами мира. "
                    "Отвечай кратко, профессионально, по делу, на русском языке."
                )
                payload = {
                    "contents": [{"parts": [{"text": f"Системный контекст: {system_prompt}\n\nВопрос менеджера: {text}"}]}]
                }
                req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=20.0) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    cand = data.get("candidates", [])[0]
                    content = cand.get("content", {}).get("parts", [])[0].get("text", "")
                    if content:
                        return content
            except Exception:
                pass

        return (
            f"Я принял ваше сообщение: «{text}».\n\n"
            "• Чтобы сохранить это как задачу, напишите: `/task {text}`\n"
            "• Чтобы найти компанию или контакт, напишите: `/search {text}`\n"
            "• Для полного списка команд введите `/help`."
        )

def run_agent_daemon(once: bool = False):
    """Main continuous daemon polling loop."""
    config = get_bot_config()
    token = config.get("bot_token")
    if not token:
        print("[!] Ошибка: Не задан TELEGRAM_BOT_TOKEN в .env")
        sys.exit(1)

    admin_username = config.get("admin_username")
    db_path = config.get("db_path")
    gemini_key = config.get("gemini_api_key")

    guard = SecurityGuard(admin_username=admin_username)
    storage = TaskStorage(db_path=db_path)
    client = TelegramClient(token=token)
    router = IntentRouter(storage=storage, db_path=db_path, gemini_api_key=gemini_key)

    print(f"[*] FortisWay 24/7 Telegram Daemon запущен.")
    print(f"[*] Авторизованный администратор: @{admin_username}")
    print(f"[*] База данных: {db_path}")

    # Test token
    me = client.get_me()
    if not me.get("ok"):
        print(f"[!] Ошибка подключения к Telegram API: {me.get('description')}")
        if not once:
            time.sleep(3)
    else:
        bot_info = me.get("result", {})
        print(f"[*] Бот подключен: @{bot_info.get('username')} (ID: {bot_info.get('id')})")

    offset = None
    backoff = 1.0

    while True:
        try:
            updates = client.get_updates(offset=offset, timeout=25)
            backoff = 1.0 # reset on successful call
            
            for update in updates:
                update_id = update.get("update_id")
                offset = update_id + 1
                
                msg = update.get("message")
                if not msg:
                    continue

                sender = msg.get("from", {})
                chat_id = msg.get("chat", {}).get("id")
                sender_user = sender.get("username", "")
                sender_id = sender.get("id", 0)
                msg_id = msg.get("message_id")
                text = msg.get("text", "")

                print(f"[{datetime.now().strftime('%H:%M:%S')}] Сообщение от @{sender_user} (ID: {sender_id}): {text}")

                # Verify Security Whitelist
                if not guard.is_authorized(username=sender_user, user_id=sender_id):
                    print(f"  [!] Отклонен неавторизованный пользователь: @{sender_user} (ID: {sender_id})")
                    client.send_message(
                        chat_id=chat_id,
                        text="⛔ *Доступ ограничен.*\nБот настроен исключительно для менеджера FortisWay (@LogisticsFortisway)."
                    )
                    continue

                # Process authorized message
                reply = router.handle_text(text, msg_id=msg_id)
                client.send_message(chat_id=chat_id, text=reply)

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
    run_agent_daemon(once=is_once)
