# -*- coding: utf-8 -*-
"""
Sends the 12 selected ATI.SU leads (Category 1: 2,3,4,5,6,8 and Category 2: all 6)
to the user's Telegram bot (@hermes_0078bot) in clean emoji-free table blocks.
"""

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.config import get_bot_config
from scripts.telegram_client import TelegramClient


def format_lead_block(idx: int, item: dict) -> str:
    vol = f"{item['volume_m3']} м3" if item.get("volume_m3") else "не указан"
    temp = f" ({item['temp_regime']})" if item.get("temp_regime") else ""
    lines = [
        f"ЛИД #{idx}",
        f"Откуда — Куда | {item['from_location']} — {item['to_location']}",
        f"Груз          | {item['cargo_name']}",
        f"Вес / Объём   | {item['weight_t']} т / {vol}",
        f"Транспорт     | {item['trucks_count']} авто, {item['truck_type']}{temp}",
        f"Код ТН ВЭД    | {item['tnved_code']}",
        f"Документы     | {item['documents_req']}",
        f"Погрузка      | {item['loading_date']}",
    ]
    return "```\n" + "\n".join(lines) + "\n```"


def main():
    data_path = ROOT_DIR / "web" / "ati_data.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    selected = [x for x in data.get("loads", []) if x.get("is_selected") == 1]

    cat1 = [x for x in selected if x["category"] == "Турция / Иран / Польша"]
    cat2 = [x for x in selected if x["category"] == "Китай"]

    print(f"Selected total: {len(selected)} (Cat1: {len(cat1)}, Cat2: {len(cat2)})")

    config = get_bot_config()
    token = config.get("bot_token")
    if not token:
        print("[!] Ошибка: нет токена бота")
        sys.exit(1)

    client = TelegramClient(token=token)
    user_id = 8930092703

    # Send Category 1
    msg1_parts = ["КАТЕГОРИЯ 1: ТУРЦИЯ / ИРАН / ПОЛЬША — УЗБЕКИСТАН\n"]
    for i, item in enumerate(cat1, 1):
        msg1_parts.append(format_lead_block(i, item))
    msg1 = "\n".join(msg1_parts)

    # Send Category 2
    msg2_parts = ["КАТЕГОРИЯ 2: КИТАЙ — УЗБЕКИСТАН\n"]
    for i, item in enumerate(cat2, 1):
        msg2_parts.append(format_lead_block(i, item))
    msg2 = "\n".join(msg2_parts)

    r1 = client.send_message(chat_id=user_id, text=msg1)
    r2 = client.send_message(chat_id=user_id, text=msg2)
    print("Telegram Cat 1:", r1.get("ok"), "msg_id=", r1.get("result", {}).get("message_id"))
    print("Telegram Cat 2:", r2.get("ok"), "msg_id=", r2.get("result", {}).get("message_id"))


if __name__ == "__main__":
    main()
