-- ============================================================================
-- Canonical SQLite Schema for FortisWay Corporate Knowledge Hub
-- Single Source of Truth (SSOT): db/fortisway.db
-- Author: AI Agent (Ponytail ExpertOps Standard)
-- Date: 2026-11-09
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
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

CREATE TABLE IF NOT EXISTS exhibition_leads (
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

CREATE TABLE IF NOT EXISTS tariffs_routes (
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

CREATE TABLE IF NOT EXISTS plan_fact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    employee TEXT NOT NULL,
    tasks_decisions TEXT,
    execution_date TEXT,
    comments TEXT,
    status TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS documents_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    title TEXT NOT NULL,
    file_path TEXT UNIQUE,
    file_format TEXT,
    file_size_kb REAL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS company_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    key_name TEXT NOT NULL UNIQUE,
    value_text TEXT NOT NULL,
    details_json TEXT
);

-- Dedicated Telegram Task Queue for 24/7 Agent
CREATE TABLE IF NOT EXISTS telegram_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    telegram_msg_id INTEGER,
    task_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    result_text TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_telegram_tasks_status ON telegram_tasks(status);

-- 3-Tier Library Storage Schema
CREATE TABLE IF NOT EXISTS library_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    telegram_msg_id INTEGER,
    channel_msg_id INTEGER,
    country TEXT NOT NULL DEFAULT 'Общее',
    cargo_id TEXT,
    category TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    raw_text TEXT,
    file_name TEXT,
    file_size_bytes INTEGER DEFAULT 0,
    file_unique_id TEXT UNIQUE,
    gdrive_file_id TEXT,
    gdrive_web_link TEXT
);

CREATE INDEX IF NOT EXISTS idx_library_country ON library_items(country);
CREATE INDEX IF NOT EXISTS idx_library_category ON library_items(category);
CREATE INDEX IF NOT EXISTS idx_library_file_unique_id ON library_items(file_unique_id);

-- Active Cargo Leads (processed Uzbekistan import/export freight requests)
CREATE TABLE IF NOT EXISTS cargo_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    direction TEXT NOT NULL,
    route TEXT NOT NULL,
    vehicle_type TEXT,
    cargo_name TEXT,
    volume TEXT,
    weight TEXT,
    units_count TEXT,
    rate REAL,
    currency TEXT,
    payment_terms TEXT,
    loading_status TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Активный лид'
);

-- ATI.SU Filtered Loads Registry (18-24t, <=10 days, UZ export/import, no ADR/wood/citrus)
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
    tnved_code TEXT,
    documents_req TEXT,
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

CREATE INDEX IF NOT EXISTS idx_ati_loads_category ON ati_loads(category);
CREATE INDEX IF NOT EXISTS idx_ati_loads_selected ON ati_loads(is_selected);

-- Full Text Search Virtual Table (FTS5) for sub-millisecond retrieval
CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    content,
    tags
);

