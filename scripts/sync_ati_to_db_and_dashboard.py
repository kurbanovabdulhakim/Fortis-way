# -*- coding: utf-8 -*-
"""
Collects all filtered ATI.SU loads for Uzbekistan (18-24t, <=10 days, no ADR/wood/citrus),
stores them in db/fortisway.db (table: ati_loads + fts_index),
and exports web/ati_data.json for the interactive Dashboard.
"""

import json
import sqlite3
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "db" / "fortisway.db"
SCHEMA_PATH = ROOT_DIR / "db" / "schema.sql"
OUT_JSON_PATH = ROOT_DIR / "web" / "ati_data.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://loads.ati.su',
    'Referer': 'https://loads.ati.su/'
}

SEARCH_URL = "https://loads.ati.su/webapi/public/v1.0/loads/search"
MAX_DAYS = 10.0

EXCLUDE_ADR_KW = ["опасн", "adr", "адр", "кислот", "щелоч", "взрыв", "огнеопас"]
EXCLUDE_WOOD_KW = ["древесин", "пиломатериал", "тахта", "лес ", "кругляк", "доск", "брус", "фанер", "шпон", "дсп", "мдф", "лдсп"]
EXCLUDE_CITRUS_KW = ["цитрус", "мандарин", "апельсин", "лимон", "грейпфрут", "помело", "лайм"]

CAR_TYPE_MAP = {
    "1": "Фура-тент",
    "2": "Фургон",
    "4": "Фура-реф",
    "8": "Изотерм",
    "16": "Бортовой",
    "32": "Открытый",
    "64": "Контейнеровоз"
}

CURRENCY_MAP = {
    1: "RUB",
    2: "USD",
    3: "EUR",
    4: "KZT",
    5: "UZS"
}

SELECTED_SIGNATURES = [
    ("стамбул", "ташкент", "мармелад"),
    ("бурса", "ташкент", "курин"),
    ("бурса", "ташкент", "кетчуп"),
    ("самарканд", "измир", "фрукт"),
    ("измир", "ташкент", "хашбраун"),
    ("навои", "искендерун", "пряжа"),
    ("алашанькоу", "бухара", "тнп"),
    ("коргас", "бухара", "оборудован"),
    ("тяньцзинь", "юкоричирчик", "тнп"),
    ("кашгар", "ташкент", "продукт"),
    ("алашанькоу", "ташкент", "продукт"),
    ("тяньцзинь", "ангрен", "полистирол"),
]


def fetch_pages_seq(from_id=None, to_id=None, max_pages=2):
    results = []
    for page in range(1, max_pages + 1):
        flt = {"weight": {"min": 18, "max": 24}}
        if from_id is not None:
            flt["from"] = {"id": str(from_id), "type": 0}
        if to_id is not None:
            flt["to"] = {"id": str(to_id), "type": 0}
        payload = {"page": page, "items_per_page": 50, "filter": flt}
        try:
            req = urllib.request.Request(SEARCH_URL, data=json.dumps(payload).encode('utf-8'), headers=HEADERS)
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                loads = data.get("loads", [])
                results.extend(loads)
                total = data.get("totalItems", 0)
                if len(loads) == 0 or len(results) >= total:
                    break
            time.sleep(0.35)
        except Exception as e:
            print(f"[!] Skip (from={from_id}, to={to_id}, p={page}): {e}")
            break
    return results


def parse_truck_type(truck_obj):
    if not truck_obj:
        return "Фура-тент", 1, ""
    car_types = truck_obj.get("carTypes") or []
    names = [CAR_TYPE_MAP.get(str(ct), f"Тип-{ct}") for ct in car_types]
    # Deduplicate preserving order
    unique_names = list(dict.fromkeys(names))
    truck_str = " / ".join(unique_names) if unique_names else "Фура (любой кузов)"
    qty = truck_obj.get("quantity") or 1

    t_at = truck_obj.get("tempAt")
    t_to = truck_obj.get("tempTo")
    temp_str = ""
    if t_at is not None and t_to is not None:
        temp_str = f"{t_at}°C" if t_at == t_to else f"{t_at}..{t_to}°C"
    elif t_at is not None:
        temp_str = f"от {t_at}°C"

    return truck_str, qty, temp_str


def parse_rate_and_terms(rate_obj):
    if not rate_obj:
        return "По запросу", "Уточняется на ATI.SU", 0
    price = rate_obj.get("price")
    curr_id = rate_obj.get("currency")
    curr = CURRENCY_MAP.get(curr_id, "")
    rate_str = f"{price} {curr}".strip() if price else "Запрос ставки"
    if rate_obj.get("negotiation"):
        rate_str += " (торг)"

    terms = []
    if rate_obj.get("direct"):
        terms.append("Прямой заказчик")
    if rate_obj.get("payDaysEnabled") and rate_obj.get("payDays"):
        terms.append(f"Оплата {rate_obj.get('payDays')} дн.")
    if rate_obj.get("prepayEnabled") and rate_obj.get("prepay"):
        terms.append(f"Предоплата {rate_obj.get('prepay')}%")
    if rate_obj.get("payOnUnload"):
        terms.append("Оплата на выгрузке")

    terms_str = ", ".join(terms) if terms else "По договорённости"
    return rate_str, terms_str, 1 if rate_obj.get("direct") else 0


def transform_load(it, now_utc):
    load_info = it.get("load") or {}
    weight = load_info.get("weight") or 0
    if weight < 18 or weight > 24:
        return None
    if (load_info.get("adr") or 0) > 0:
        return None

    cargo = (load_info.get("cargoType") or "Груз").strip()
    cargo_lower = cargo.lower()
    if any(kw in cargo_lower for kw in EXCLUDE_ADR_KW + EXCLUDE_WOOD_KW + EXCLUDE_CITRUS_KW):
        return None

    date_str = it.get("changeDate") or it.get("addDate")
    if not date_str:
        return None
    try:
        dt_clean = date_str.split(".")[0].replace("Z", "")
        item_dt = datetime.fromisoformat(dt_clean).replace(tzinfo=timezone.utc)
        days_old = (now_utc - item_dt).total_seconds() / 86400.0
        if days_old > MAX_DAYS or days_old < -0.5:
            return None
    except Exception:
        return None

    days_old = round(max(days_old, 0.0), 1)
    days_rem = round(max(MAX_DAYS - days_old, 0.0), 1)

    loading = it.get("loading") or {}
    unloading = it.get("unloading") or {}
    loc_from = loading.get("location") or {}
    loc_to = unloading.get("location") or {}

    full_from = loc_from.get("fullGeoName") or ""
    full_to = loc_to.get("fullGeoName") or ""
    from_is_uz = "узбекистан" in full_from.lower()
    to_is_uz = "узбекистан" in full_to.lower()

    if not (from_is_uz ^ to_is_uz):
        return None

    from_city = loc_from.get("city") or ""
    from_reg = loc_from.get("region") or ""
    to_city = loc_to.get("city") or ""
    to_reg = loc_to.get("region") or ""

    from_country = full_from.split(",")[-1].strip() if "," in full_from else full_from
    to_country = full_to.split(",")[-1].strip() if "," in full_to else full_to

    from_label = f"{from_city} ({from_country})" if not from_is_uz and from_city and from_country != from_city else (f"{from_city} ({from_reg})" if from_reg and from_reg != from_city else from_city or full_from)
    to_label = f"{to_city} ({to_country})" if not to_is_uz and to_city and to_country != to_city else (f"{to_city} ({to_reg})" if to_reg and to_reg != to_city else to_city or full_to)

    direction = "Экспорт (из РУз)" if from_is_uz else "Импорт (в РУз)"
    partner_geo = (full_to if from_is_uz else full_from).lower()

    if any(k in partner_geo for k in ["турци", "иран", "польш"]):
        cat = "Турция / Иран / Польша"
    elif "китай" in partner_geo:
        cat = "Китай"
    else:
        cat = "РФ / СНГ / Европа"

    truck_str, qty, temp_str = parse_truck_type(it.get("truck"))
    rate_str, terms_str, is_direct = parse_rate_and_terms(it.get("rate"))

    f_date = (loading.get("firstDate") or "")[:10]
    l_date = (loading.get("lastDate") or "")[:10]
    if f_date and l_date and f_date != l_date:
        load_date = f"{f_date} — {l_date}"
    else:
        load_date = f_date or "Готов к погрузке"

    dist = (it.get("route") or {}).get("distance") or 0
    vol = load_info.get("volume") or 0
    ati_id = str(it.get("id"))
    ati_url = f"https://loads.ati.su/#?loadId={ati_id}"

    # Check if in user's 12 selected leads
    sig_str = f"{from_label} {to_label} {cargo}".lower()
    is_sel = 0
    for sf, st, sc in SELECTED_SIGNATURES:
        if sf in from_label.lower() and st in to_label.lower() and sc in cargo_lower:
            is_sel = 1
            break

    return {
        "ati_id": ati_id,
        "category": cat,
        "direction": direction,
        "from_location": from_label,
        "to_location": to_label,
        "distance_km": dist,
        "cargo_name": cargo,
        "weight_t": weight,
        "volume_m3": vol,
        "truck_type": truck_str,
        "trucks_count": qty,
        "temp_regime": temp_str,
        "loading_date": load_date,
        "added_at": date_str[:16].replace("T", " "),
        "days_on_site": days_old,
        "days_remaining_10d": days_rem,
        "rate_info": rate_str,
        "payment_terms": terms_str,
        "is_direct": is_direct,
        "ati_url": ati_url,
        "is_selected": is_sel,
        "updated_at": now_utc.strftime("%Y-%m-%d %H:%M:%S")
    }


def save_to_db(records):
    conn = sqlite3.connect(DB_PATH)
    # Ensure ati_loads table exists from schema.sql
    conn.execute("""
    CREATE TABLE IF NOT EXISTS ati_loads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ati_id TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        direction TEXT NOT NULL,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        distance_km INTEGER DEFAULT 0,
        cargo_name TEXT NOT NULL,
        weight_t REAL NOT NULL,
        volume_m3 REAL DEFAULT 0,
        truck_type TEXT,
        trucks_count INTEGER DEFAULT 1,
        temp_regime TEXT,
        loading_date TEXT,
        added_at TEXT,
        days_on_site REAL DEFAULT 0,
        days_remaining_10d REAL DEFAULT 10,
        rate_info TEXT,
        payment_terms TEXT,
        is_direct INTEGER DEFAULT 0,
        ati_url TEXT NOT NULL,
        is_selected INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
    );
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ati_loads_category ON ati_loads(category);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ati_loads_selected ON ati_loads(is_selected);")

    # Replace snapshot cleanly so stale >10d loads are purged
    conn.execute("DELETE FROM ati_loads;")
    conn.execute("DELETE FROM fts_index WHERE entity_type = 'ati_load';")

    for r in records:
        cur = conn.execute("""
            INSERT INTO ati_loads (
                ati_id, category, direction, from_location, to_location, distance_km,
                cargo_name, weight_t, volume_m3, truck_type, trucks_count, temp_regime,
                loading_date, added_at, days_on_site, days_remaining_10d,
                rate_info, payment_terms, is_direct, ati_url, is_selected, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r["ati_id"], r["category"], r["direction"], r["from_location"], r["to_location"], r["distance_km"],
            r["cargo_name"], r["weight_t"], r["volume_m3"], r["truck_type"], r["trucks_count"], r["temp_regime"],
            r["loading_date"], r["added_at"], r["days_on_site"], r["days_remaining_10d"],
            r["rate_info"], r["payment_terms"], r["is_direct"], r["ati_url"], r["is_selected"], r["updated_at"]
        ))
        row_id = cur.lastrowid
        conn.execute("""
            INSERT INTO fts_index (entity_type, entity_id, title, content, tags)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "ati_load",
            row_id,
            f"{r['from_location']} -> {r['to_location']} | {r['cargo_name']} ({r['weight_t']} т)",
            f"{r['category']} {r['direction']} {r['truck_type']} {r['rate_info']} {r['payment_terms']} {r['ati_url']}",
            f"ati, {r['category']}, {r['direction']}"
        ))

    conn.commit()
    conn.close()


def main():
    now_utc = datetime.now(timezone.utc)
    print(f"[*] Сбор актуальных данных ATI.SU ({now_utc.strftime('%Y-%m-%d %H:%M UTC')})...")

    raw_map = {}
    # Polite sequential fetches across all Uzbekistan directions
    queries = [
        (33, 14, 2), (14, 33, 1),  # Turkey <-> UZ
        (28, 14, 2), (14, 28, 1),  # Poland <-> UZ
        (58, 14, 1), (14, 58, 1),  # Iran <-> UZ
        (50, 14, 2), (14, 50, 1),  # China <-> UZ
        (14, None, 2),             # All UZ Export
        (None, 14, 2),             # All UZ Import
    ]
    for f_id, t_id, mp in queries:
        items = fetch_pages_seq(f_id, t_id, mp)
        for it in items:
            raw_map[it["id"]] = it

    records = []
    for it in raw_map.values():
        rec = transform_load(it, now_utc)
        if rec:
            records.append(rec)

    # Sort: selected first, then freshest
    records.sort(key=lambda x: (-x["is_selected"], x["days_on_site"]))

    save_to_db(records)

    OUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    export_payload = {
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total": len(records),
        "selected_count": sum(1 for r in records if r["is_selected"] == 1),
        "loads": records
    }
    json_str = json.dumps(export_payload, ensure_ascii=False, indent=2)
    OUT_JSON_PATH.write_text(json_str, encoding="utf-8")
    (ROOT_DIR / "web" / "ati_data.js").write_text(f"window.ATI_DASHBOARD_DATA = {json_str};\n", encoding="utf-8")

    print(f"[+] Сохранено в SQLite (ati_loads) и {OUT_JSON_PATH.name}: {len(records)} грузов (Избранных: {export_payload['selected_count']}).")


if __name__ == "__main__":
    main()
