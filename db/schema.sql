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

-- Full Text Search Virtual Table (FTS5) for sub-millisecond retrieval
CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    content,
    tags
);

