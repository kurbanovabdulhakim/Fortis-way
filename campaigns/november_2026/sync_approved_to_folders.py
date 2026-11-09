# -*- coding: utf-8 -*-
"""
FORTISWAY Logistics // Auto-sync approved photos from dashboard to daily folders.
Reads 'fortisway_approved_photos.json' from Desktop or Downloads,
downloads approved high-res imagery, and replaces 'фото_для_поста.jpg' in each day's folder.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path
from PIL import Image
import io

DESKTOP = Path(r"C:\Users\user\Desktop")
DOWNLOADS = Path(os.path.expanduser(r"~\Downloads"))
TARGET_DIR = DESKTOP / "FORTISWAY_Instagram_Ноябрь_2026"

def find_json():
    candidates = [
        DESKTOP / "fortisway_approved_photos.json",
        DOWNLOADS / "fortisway_approved_photos.json",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None

def sync():
    json_path = find_json()
    if not json_path:
        print(f"[!] Файл 'fortisway_approved_photos.json' не найден на Рабочем столе или в Загрузках.")
        print(f"    Откройте дашборд 'FORTISWAY_Дашборд_Выбора_Фото_Ноябрь_2026.html', отметьте фото и нажмите 'Сохранить выбор'.")
        return

    print(f"[*] Читаем файл выбора: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    updated_count = 0

    for day_str, info in data.items():
        try:
            day_num = int(day_str)
        except ValueError:
            continue

        folder_name = f"{day_num:02d}_Ноября"
        day_folder = TARGET_DIR / folder_name
        if not day_folder.exists():
            print(f"[?] Папка дня не найдена: {day_folder}")
            continue

        url = info.get("url")
        if not url:
            continue

        target_file = day_folder / "фото_для_поста.jpg"
        print(f"[*] День {day_num:02d}: загрузка '{info.get('title', 'фото')}'...")

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                img_data = resp.read()

            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            # Square crop 1:1 for Instagram
            w, h = img.size
            min_dim = min(w, h)
            left = (w - min_dim) // 2
            top = (h - min_dim) // 2
            cropped = img.crop((left, top, left + min_dim, top + min_dim))
            resized = cropped.resize((1080, 1080), Image.Resampling.LANCZOS)

            # Backup old if exists
            if target_file.exists():
                backup = day_folder / "фото_для_поста_старое.jpg"
                if not backup.exists():
                    target_file.rename(backup)

            resized.save(target_file, "JPEG", quality=92)
            print(f"    [+] Сохранено: {target_file} (1080x1080)")
            updated_count += 1
        except Exception as e:
            print(f"    [-] Ошибка для дня {day_num:02d}: {e}")

    print(f"\n[ГОТОВО] Успешно обновлено папок: {updated_count} из {len(data)}")

if __name__ == "__main__":
    sync()

