# -*- coding: utf-8 -*-
"""
Deletes previous unbolded lead messages (318..330) and sends the 11 selected
ATI.SU leads with bold HTML field labels (Маршрут, Груз, Вес / Объём,
Транспорт, Код ТН ВЭД, Документы, Погрузка) for 1-click copy & forward.
"""

import html
import json
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.config import get_bot_config
from scripts.telegram_client import TelegramClient


def format_bold_lead(item: dict) -> str:
    vol = f"{item['volume_m3']} м3" if item.get("volume_m3") else "не указан"
    temp = f" ({item['temp_regime']})" if item.get("temp_regime") else ""
    tnved = item.get("tnved_code") or "Кода пока нет"
    docs = item.get("documents_req") or "Дополнительных документов не требуется"

    e = html.escape
    lines = [
        f"<b>Маршрут:</b> {e(item['from_location'])} — {e(item['to_location'])}",
        f"<b>Груз:</b> {e(item['cargo_name'])}",
        f"<b>Вес / Объём:</b> {e(str(item['weight_t']))} т / {e(vol)}",
        f"<b>Транспорт:</b> {e(str(item['trucks_count']))} авто, {e(item['truck_type'])}{e(temp)}",
        f"<b>Код ТН ВЭД:</b> {e(tnved)}",
        f"<b>Документы:</b> {e(docs)}",
        f"<b>Погрузка:</b> {e(item['loading_date'])}",
    ]
    return "\n".join(lines)


def main():
    data_path = ROOT_DIR / "web" / "ati_data.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    selected = [x for x in data.get("loads", []) if x.get("is_selected") == 1]

    cat1 = [x for x in selected if x["category"] == "Турция / Иран / Польша"]
    cat2 = [x for x in selected if x["category"] == "Китай"]

    config = get_bot_config()
    token = config.get("bot_token")
    if not token:
        print("[!] Ошибка: нет токена бота")
        sys.exit(1)

    client = TelegramClient(token=token)
    user_id = 8930092703

    # 1. Delete previous lead messages (318..330)
    for old_id in range(318, 331):
        client._call_api("deleteMessage", {"chat_id": user_id, "message_id": old_id})

    # 2. Send clean bold-label leads via HTML parse_mode
    client.send_message(chat_id=user_id, text="<b>Категория 1: Турция / Иран / Польша — Узбекистан</b>", parse_mode="HTML")
    for item in cat1:
        r = client.send_message(chat_id=user_id, text=format_bold_lead(item), parse_mode="HTML")
        print(f"Cat1 sent msg_id={r.get('result', {}).get('message_id')}: {item['from_location']} -> {item['to_location']}")
        time.sleep(0.15)

    client.send_message(chat_id=user_id, text="<b>Категория 2: Китай — Узбекистан</b>", parse_mode="HTML")
    for item in cat2:
        r = client.send_message(chat_id=user_id, text=format_bold_lead(item), parse_mode="HTML")
        print(f"Cat2 sent msg_id={r.get('result', {}).get('message_id')}: {item['from_location']} -> {item['to_location']}")
        time.sleep(0.15)


if __name__ == "__main__":
    main()
