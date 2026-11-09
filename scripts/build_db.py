import os
import re
import csv
import sqlite3
import openpyxl
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "db" / "fortisway.db"
DOCS_DIR = ROOT_DIR / "documents" if (ROOT_DIR / "documents").exists() else Path(r"C:\Users\user\Fortis-way\documents")
DOWNLOADS_TG = Path(r"C:\Users\user\Downloads\Telegram Desktop")
ALT_DB_PATH = Path(r"C:\Users\user\Fortis-way\db\fortisway.db")

def create_schema(conn):
    cursor = conn.cursor()
    cursor.executescript("""
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS exhibition_leads;
    DROP TABLE IF EXISTS tariffs_routes;
    DROP TABLE IF EXISTS plan_fact;
    DROP TABLE IF EXISTS documents_registry;
    DROP TABLE IF EXISTS company_knowledge;
    DROP TABLE IF EXISTS fts_index;

    CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        position TEXT,
        company TEXT NOT NULL,
        phone TEXT,
        code TEXT,
        status TEXT,
        call_result TEXT,
        source TEXT,
        city TEXT,
        email TEXT,
        address TEXT
    );

    CREATE TABLE exhibition_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exhibition TEXT NOT NULL,
        company TEXT NOT NULL,
        contact_person TEXT,
        position TEXT,
        country_region TEXT,
        activity_field TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        notes TEXT
    );

    CREATE TABLE tariffs_routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_name TEXT NOT NULL,
        rate REAL,
        currency TEXT DEFAULT 'UZS',
        vat_percent REAL DEFAULT 12,
        rate_with_vat REAL,
        rate_with_discount_5pct REAL,
        cargo_type TEXT,
        vehicle_type TEXT,
        transit_days TEXT,
        conditions TEXT,
        source_doc TEXT
    );

    CREATE TABLE plan_fact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        employee TEXT NOT NULL,
        tasks_decisions TEXT,
        execution_date TEXT,
        comments TEXT,
        status TEXT,
        category TEXT
    );

    CREATE TABLE documents_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        title TEXT NOT NULL,
        file_path TEXT UNIQUE,
        file_format TEXT,
        file_size_kb REAL,
        description TEXT
    );

    CREATE TABLE company_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,
        key_name TEXT NOT NULL UNIQUE,
        value_text TEXT NOT NULL,
        details_json TEXT
    );

    CREATE VIRTUAL TABLE fts_index USING fts5(
        entity_type,
        entity_id UNINDEXED,
        title,
        content,
        tags
    );
    """)
    conn.commit()

def import_clients_kurbanov(conn):
    path = DOCS_DIR / r"Базы_клиентов_и_выставки\Клиентская_база_Курбанов_Абдулхаким_ПОЛНАЯ.xlsx"
    if not path.exists():
        print(f"Skipping {path}: not found")
        return 0
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['Клиентская база']
    rows_to_insert = []
    fts_rows = []
    for r in ws.iter_rows(min_row=4, values_only=True):
        if not r or not any(r):
            continue
        num, name, pos, comp, phone, code, status, comment = (list(r) + [None]*8)[:8]
        if not comp and not name:
            continue
        rows_to_insert.append((
            str(name or '').strip(),
            str(pos or '').strip() if pos != '—' else '',
            str(comp or '').strip(),
            str(phone or '').strip(),
            str(code if code is not None else '').strip(),
            str(status or '').strip(),
            str(comment or '').strip(),
            'Клиентская база Курбанов',
            'Ташкент / Узбекистан',
            '',
            ''
        ))
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO clients (name, position, company, phone, code, status, call_result, source, city, email, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    # FTS
    cursor.execute("SELECT id, name, company, position, phone, status, call_result FROM clients WHERE source='Клиентская база Курбанов'")
    for cid, cname, comp, cpos, cphone, cstat, ccomm in cursor.fetchall():
        fts_rows.append((
            'client',
            cid,
            f"{comp} ({cname})",
            f"{cname} {comp} {cpos} {cphone} {cstat} {ccomm}",
            'клиент обзвон лид'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Imported {len(rows_to_insert)} clients from Kurbanov DB")
    return len(rows_to_insert)

def import_golden_pages(conn):
    path = DOCS_DIR / r"Базы_клиентов_и_выставки\GoldenPages_Gruzoperevozki_Uzbekistan.xlsx"
    if not path.exists():
        print(f"Skipping {path}: not found")
        return 0
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows_to_insert = []
    fts_rows = []
    for r in ws.iter_rows(min_row=6, values_only=True):
        if not r or not any(r):
            continue
        row_vals = (list(r) + [None]*10)[:10]
        num, gp_id, company, city, phones, email, address = row_vals[:7]
        if not company:
            continue
        rows_to_insert.append((
            '', # name
            '', # pos
            str(company).strip(),
            str(phones or '').strip(),
            'GP',
            'Справочник GP',
            f"ID GP: {gp_id}",
            'GoldenPages Справочник',
            str(city or '').strip(),
            str(email or '').strip(),
            str(address or '').strip()
        ))
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO clients (name, position, company, phone, code, status, call_result, source, city, email, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    cursor.execute("SELECT id, company, city, phone, email, address FROM clients WHERE source='GoldenPages Справочник'")
    for cid, comp, ccity, cphone, cemail, caddr in cursor.fetchall():
        fts_rows.append((
            'client',
            cid,
            f"GoldenPages: {comp}",
            f"{comp} {ccity} {cphone} {cemail} {caddr}",
            'goldenpages перевозчик узбекистан'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Imported {len(rows_to_insert)} companies from GoldenPages")
    return len(rows_to_insert)

def import_exhibition_leads(conn):
    path = DOCS_DIR / r"Базы_клиентов_и_выставки\Baza_Kontaktov_Vystavka_MiningMetals_2026.xlsx"
    if not path.exists():
        print(f"Skipping {path}: not found")
        return 0
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['Визитки MiningMetals 2026']
    rows_to_insert = []
    fts_rows = []
    for r in ws.iter_rows(min_row=5, values_only=True):
        if not r or not any(r):
            continue
        vals = (list(r) + [None]*15)[:15]
        num, comp, person, pos, country, activity, phone, email, site, notes = vals[:10]
        if not comp:
            continue
        rows_to_insert.append((
            'Mining & Metals Central Asia 2026',
            str(comp).strip(),
            str(person or '').strip(),
            str(pos or '').strip(),
            str(country or '').strip(),
            str(activity or '').strip(),
            str(phone or '').strip(),
            str(email or '').strip(),
            str(site or '').strip(),
            str(notes or '').strip()
        ))
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO exhibition_leads (exhibition, company, contact_person, position, country_region, activity_field, phone, email, website, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    cursor.execute("SELECT id, exhibition, company, contact_person, position, country_region, activity_field, phone, email FROM exhibition_leads")
    for eid, exh, comp, cper, cpos, ccount, cact, cphone, cemail in cursor.fetchall():
        fts_rows.append((
            'exhibition_lead',
            eid,
            f"Выставка: {comp} - {cper}",
            f"{exh} {comp} {cper} {cpos} {ccount} {cact} {cphone} {cemail}",
            'выставка mining metals лид b2b'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Imported {len(rows_to_insert)} exhibition leads")
    return len(rows_to_insert)

def import_tariffs(conn):
    path_base = DOCS_DIR / r"Тарифы_и_расчеты\Stoimost_Perevozki_Po_Marshrutam.xlsx"
    path_5pct = DOCS_DIR / r"Тарифы_и_расчеты\Stoimost_Perevozki_Po_Marshrutam_5pct_NDS.xlsx"
    
    routes_data = {}
    if path_base.exists():
        wb = openpyxl.load_workbook(path_base, data_only=True)
        ws = wb['Тарифы']
        for r in ws.iter_rows(min_row=5, values_only=True):
            if not r or not r[1]:
                continue
            num = r[0]
            name = str(r[1]).strip()
            rate = float(r[2]) if r[2] is not None else 0.0
            vat = (rate * 0.12)
            total = rate + vat
            routes_data[name] = {
                'rate': rate,
                'vat': vat,
                'total': total,
                'rate_5pct': total * 0.95,
                'source': 'Stoimost_Perevozki_Po_Marshrutam.xlsx'
            }
            
    # Add special ad-hoc international projects
    routes_data['Нидерланды (Ter Apelkanaal) — Ташкент (Сергели/Янгихаёт)'] = {
        'rate': 8000.0,
        'currency': 'EUR',
        'vat': 0.0,
        'total': 8000.0,
        'rate_5pct': 7600.0,
        'cargo_type': 'Картофельный крахмал (мешки, 22.55 т, код ТН ВЭД 350510)',
        'vehicle_type': 'Тент FTL, схема без перегруза (перецепка тягача в Европе)',
        'transit_days': '14-18 дней',
        'conditions': 'ЭПИ до 30 EUR включено/отдельно, 1 день погрузка/EX-1, 1 день таможня, 1 день выгрузка. Простой 150 EUR/сут.',
        'source': 'Оперативный расчет директору (04-06.11.2026)'
    }
    routes_data['Польша — Ташкент (Nestle Purina)'] = {
        'rate': 7200.0,
        'currency': 'EUR',
        'vat': 0.0,
        'total': 7200.0,
        'rate_5pct': 6840.0,
        'cargo_type': 'Корма для животных Nestle Purina (рефрижератор / изотерм)',
        'vehicle_type': 'Рефрижератор 86-90 м3',
        'transit_days': '12-16 дней',
        'conditions': 'Температурный режим +15..+20 C, пломбировка, GPS-трекинг',
        'source': 'КП Nestle Purina Poland-Uzbekistan'
    }

    cursor = conn.cursor()
    rows_to_insert = []
    fts_rows = []
    for rname, d in routes_data.items():
        curr = d.get('currency', 'UZS')
        cargo = d.get('cargo_type', 'Грузоперевозки тентованные / бортовые по РУз')
        veh = d.get('vehicle_type', 'Автотранспорт 20т / Тент')
        transit = d.get('transit_days', '1-3 дня')
        cond = d.get('conditions', 'Включает НДС 12%')
        src = d.get('source', 'Тарифная сетка')
        rows_to_insert.append((
            rname,
            d['rate'],
            curr,
            12.0 if curr == 'UZS' else 0.0,
            d['total'],
            d['rate_5pct'],
            cargo,
            veh,
            transit,
            cond,
            src
        ))
    cursor.executemany("""
    INSERT INTO tariffs_routes (route_name, rate, currency, vat_percent, rate_with_vat, rate_with_discount_5pct, cargo_type, vehicle_type, transit_days, conditions, source_doc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    cursor.execute("SELECT id, route_name, rate, currency, rate_with_vat, cargo_type, conditions FROM tariffs_routes")
    for tid, rname, rrate, rcurr, rtot, rcargo, rcond in cursor.fetchall():
        fts_rows.append((
            'tariff',
            tid,
            f"Маршрут: {rname}",
            f"{rname} {rrate} {rcurr} {rtot} {rcargo} {rcond}",
            'тариф маршрут ставка фрахт доставка'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Imported {len(rows_to_insert)} tariffs and routes")
    return len(rows_to_insert)

def import_plan_fact(conn):
    path = DOCS_DIR / r"План_Факт_Отчеты\План_факт_Курбанов_ПОЛНЫЙ_02_Окт_06_Ноя_2026.xlsx"
    if not path.exists():
        print(f"Skipping {path}: not found")
        return 0
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows_to_insert = []
    fts_rows = []
    for r in ws.iter_rows(min_row=4, values_only=True):
        if not r or not any(r):
            continue
        vals = (list(r) + [None]*6)[:6]
        dt, emp, task, exec_dt, comm, stat = vals
        if not dt or not task:
            continue
        cat = 'Оперативка'
        if 'выходной' in str(task).lower():
            cat = 'Выходной'
        elif 'выставк' in str(task).lower() or 'mining' in str(task).lower():
            cat = 'Выставка'
        elif 'звон' in str(task).lower() or 'клиент' in str(task).lower():
            cat = 'Продажи'
        elif 'расчет' in str(task).lower() or 'рейс' in str(task).lower() or 'ставк' in str(task).lower():
            cat = 'Диспетчеризация'
            
        rows_to_insert.append((
            str(dt).strip(),
            str(emp or 'Курбанов А.').strip(),
            str(task).strip(),
            str(exec_dt or dt).strip(),
            str(comm or '').strip(),
            str(stat or 'Сделано').strip(),
            cat
        ))
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO plan_fact (date, employee, tasks_decisions, execution_date, comments, status, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    cursor.execute("SELECT id, date, employee, tasks_decisions, comments, status, category FROM plan_fact")
    for pid, pdate, pemp, ptask, pcomm, pstat, pcat in cursor.fetchall():
        fts_rows.append((
            'plan_fact',
            pid,
            f"Отчет {pdate} ({pemp})",
            f"{pdate} {pemp} {ptask} {pcomm} {pstat} {pcat}",
            'отчет план факт задача журнал'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Imported {len(rows_to_insert)} plan-fact daily records")
    return len(rows_to_insert)

def import_documents_registry(conn):
    rows_to_insert = []
    fts_rows = []
    categories = {
        'Базы_клиентов_и_выставки': 'Базы контактов и выставки',
        'Коммерческие_предложения': 'Коммерческие предложения',
        'План_Факт_Отчеты': 'План-факт отчеты',
        'Презентации': 'Корпоративные презентации',
        'Тарифы_и_расчеты': 'Тарифы и расчеты фрахта'
    }
    
    for root, dirs, files in os.walk(DOCS_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, DOCS_DIR)
            folder = os.path.dirname(rel_path).split(os.sep)[0]
            cat = categories.get(folder, 'Прочие документы')
            ext = os.path.splitext(f)[1].lower().replace('.', '')
            size_kb = round(os.path.getsize(full_path) / 1024, 1)
            desc = f"Файл проекта FortisWay: {f}"
            rows_to_insert.append((
                cat,
                f,
                full_path,
                ext,
                size_kb,
                desc
            ))
            
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT OR IGNORE INTO documents_registry (category, title, file_path, file_format, file_size_kb, description)
    VALUES (?, ?, ?, ?, ?, ?)
    """, rows_to_insert)
    
    cursor.execute("SELECT id, category, title, file_path, file_format, description FROM documents_registry")
    for did, dcat, dtitle, dpath, dfmt, ddesc in cursor.fetchall():
        fts_rows.append((
            'document',
            did,
            f"Документ: {dtitle}",
            f"{dcat} {dtitle} {dpath} {dfmt} {ddesc}",
            'документ файл архив фортисвей'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print(f"Registered {len(rows_to_insert)} documents in registry")
    return len(rows_to_insert)

def import_company_knowledge(conn):
    knowledge = [
        ('user_profile', 'user_full_name', 'Курбанов Абдулхаким Нодиржон угли', '{"short_name": "Курбанов А.", "role": "Менеджер по логистике ВЭД", "company": "ООО FORTISWAY"}'),
        ('user_profile', 'contacts', '+998 (93) 555-22-62 | a.kurbanov@fortisway.uz', '{"telegram": "+998935552262", "email": "a.kurbanov@fortisway.uz", "phone": "+998935552262"}'),
        ('company', 'company_full_name', 'ООО «FORTISWAY» (FortisWay Logistics)', '{"brand": "FortisWay", "website": "fortisway.uz", "scope": "Международные грузоперевозки со всеми странами мира без исключений"}'),
        ('company', 'director', 'Азизхон Юнусов (Azizxon Yunusov)', '{"role": "Генеральный директор / Руководитель", "contact_telegram": "@AzizxonYunusov"}'),
        ('company', 'legal_details', 'ООО «FORTISWAY», г. Ташкент', '{"activity": "Международные и региональные авто-, ж/д и авиаперевозки", "nds": "12% белый официальный НДС", "fleet_range": "1.5 - 40 тонн, FTL / LTL / Рефрижераторы"}'),
        ('rules', 'ponytail_mode', 'Lazy Senior Dev Mode (7-Rung Minimalist Ladder)', '{"ladder": ["YAGNI", "Reuse", "Stdlib first", "Native CLI", "Existing dependencies", "One-liner", "Minimum code"]}'),
        ('rules', 'ai_first_ssot', 'SQLite master database as Single Source of Truth', '{"db_path": "C:\\\\Users\\\\user\\\\Fortis-way\\\\db\\\\fortisway.db", "cli": "python scripts/query.py --json"}')
    ]
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO company_knowledge (section, key_name, value_text, details_json)
    VALUES (?, ?, ?, ?)
    """, knowledge)
    
    fts_rows = []
    cursor.execute("SELECT id, section, key_name, value_text, details_json FROM company_knowledge")
    for kid, ksec, kkey, kval, kdet in cursor.fetchall():
        fts_rows.append((
            'knowledge',
            kid,
            f"База знаний: {kkey}",
            f"{ksec} {kkey} {kval} {kdet}",
            'профиль компания реквизиты правила знания'
        ))
    cursor.executemany("INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", fts_rows)
    conn.commit()
    print("Imported company knowledge & profile")

def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    print(f"Creating database at {DB_PATH}...")
    create_schema(conn)
    import_clients_kurbanov(conn)
    import_golden_pages(conn)
    import_exhibition_leads(conn)
    import_tariffs(conn)
    import_plan_fact(conn)
    import_documents_registry(conn)
    import_company_knowledge(conn)
    conn.close()
    print(f"Successfully built {DB_PATH}!")
    if ALT_DB_PATH.resolve() != DB_PATH.resolve() and ALT_DB_PATH.parent.exists():
        import shutil
        shutil.copy2(DB_PATH, ALT_DB_PATH)
        print(f"Synchronized database to {ALT_DB_PATH}!")

if __name__ == "__main__":
    main()

