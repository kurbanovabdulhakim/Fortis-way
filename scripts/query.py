#!/usr/bin/env python3
"""
AI-First Database Query CLI for FortisWay Logistics Hub.
Designed specifically for AI Agents (Antigravity, Cursor, Codex, Hermes)
to fetch, search, and inspect corporate state in one fast call.

Usage Examples:
  python query.py --summary --json
  python query.py --search "крахмал" --json
  python query.py --search "Mining" --json
  python query.py --table tariffs_routes --json
  python query.py --table exhibition_leads --limit 5 --json
  python query.py --table plan_fact --date "06.11.2026" --json
  python query.py --sql "SELECT company, phone, status FROM clients WHERE code='3'" --json
"""

import sys
import json
import sqlite3
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = ROOT_DIR / "db" / "fortisway.db"
if not DEFAULT_DB_PATH.exists() and Path(r"C:\Users\user\Fortis-way\db\fortisway.db").exists():
    DEFAULT_DB_PATH = Path(r"C:\Users\user\Fortis-way\db\fortisway.db")

def get_connection(db_path=DEFAULT_DB_PATH):
    if not db_path.exists():
        sys.stderr.write(f"Error: Database file not found at {db_path}\n")
        sys.exit(1)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def search_fts(conn, query_str, limit=20):
    cursor = conn.cursor()
    # Sanitize query for FTS5 (wrap in quotes if plain string or escape operators)
    sanitized = query_str.replace('"', '""')
    sql = """
    SELECT 
        entity_type,
        entity_id,
        title,
        content,
        tags,
        rank
    FROM fts_index
    WHERE fts_index MATCH ?
    ORDER BY rank
    LIMIT ?
    """
    try:
        cursor.execute(sql, (f'"{sanitized}"', limit))
        rows = [dict(r) for r in cursor.fetchall()]
    except sqlite3.OperationalError:
        # Fallback to token prefix search if exact phrase fails
        tokens = " ".join([f'"{t}"*' for t in query_str.split() if t])
        cursor.execute(sql, (tokens, limit))
        rows = [dict(r) for r in cursor.fetchall()]
        
    return rows

def get_table_data(conn, table_name, limit=50, where_clause=None, params=()):
    allowed_tables = {
        'clients',
        'exhibition_leads',
        'tariffs_routes',
        'plan_fact',
        'documents_registry',
        'company_knowledge'
    }
    if table_name not in allowed_tables:
        sys.stderr.write(f"Error: Unknown table '{table_name}'. Allowed: {', '.join(sorted(allowed_tables))}\n")
        sys.exit(1)
        
    cursor = conn.cursor()
    query = f"SELECT * FROM {table_name}"
    if where_clause:
        query += f" WHERE {where_clause}"
    query += f" LIMIT {int(limit)}"
    
    cursor.execute(query, params)
    return [dict(r) for r in cursor.fetchall()]

def get_database_summary(conn):
    cursor = conn.cursor()
    summary = {
        "database": str(DEFAULT_DB_PATH),
        "tables": {}
    }
    tables = [
        ('clients', 'Клиенты и перевозчики (обзвон + GoldenPages)'),
        ('exhibition_leads', 'ЛПР и B2B контакты с выставки Mining&Metals 2026'),
        ('tariffs_routes', 'Сетка тарифов по маршрутам РУз и международным рейсам'),
        ('plan_fact', 'Ежедневный план-факт журнал работ Курбанова А.'),
        ('documents_registry', 'Реестр коммерческих предложений, презентаций и файлов'),
        ('company_knowledge', 'Реквизиты, профиль компании, миссия и регламенты')
    ]
    for tbl, desc in tables:
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {tbl}")
        cnt = cursor.fetchone()['cnt']
        summary["tables"][tbl] = {
            "description": desc,
            "total_records": cnt
        }
        
    # Extra insights
    cursor.execute("SELECT status, COUNT(*) as cnt FROM clients GROUP BY status ORDER BY cnt DESC LIMIT 5")
    summary["clients_top_statuses"] = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT currency, COUNT(*) as cnt FROM tariffs_routes GROUP BY currency")
    summary["tariffs_by_currency"] = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT MIN(date) as start_date, MAX(date) as end_date, COUNT(*) as total_days FROM plan_fact")
    summary["plan_fact_period"] = dict(cursor.fetchone())
    
    return summary

def run_custom_sql(conn, query_str):
    cursor = conn.cursor()
    trimmed = query_str.strip().lower()
    if not (trimmed.startswith("select") or trimmed.startswith("pragma") or trimmed.startswith("explain")):
        sys.stderr.write("Error: query.py only allows read-only SELECT statements.\n")
        sys.exit(1)
    cursor.execute(query_str)
    return [dict(r) for r in cursor.fetchall()]

def main():
    parser = argparse.ArgumentParser(
        description="Fast AI Query Tool for FortisWay SQLite Hub",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--search", "-s", type=str, help="Full-text FTS5 search across all entities")
    parser.add_argument("--table", "-t", type=str, help="Query records from a specific table")
    parser.add_argument("--summary", action="store_true", help="Get overview metrics and table record counts")
    parser.add_argument("--sql", "-q", type=str, help="Execute raw read-only SQL query")
    parser.add_argument("--limit", "-l", type=int, default=50, help="Max records to return (default 50)")
    parser.add_argument("--date", "-d", type=str, help="Filter plan_fact by date (e.g. '06.11.2026')")
    parser.add_argument("--json", action="store_true", help="Output raw JSON (optimized for AI/LLM digestion)")
    parser.add_argument("--db", type=str, default=str(DEFAULT_DB_PATH), help="Path to SQLite DB")

    args = parser.parse_args()
    db_path = Path(args.db)
    conn = get_connection(db_path)

    result = None

    if args.summary:
        result = get_database_summary(conn)
    elif args.search:
        result = {
            "query": args.search,
            "count": None,
            "results": search_fts(conn, args.search, limit=args.limit)
        }
        result["count"] = len(result["results"])
    elif args.table:
        where = []
        params = []
        if args.table == 'plan_fact' and args.date:
            where.append("date = ?")
            params.append(args.date)
        where_clause = " AND ".join(where) if where else None
        rows = get_table_data(conn, args.table, limit=args.limit, where_clause=where_clause, params=params)
        result = {
            "table": args.table,
            "count": len(rows),
            "rows": rows
        }
    elif args.sql:
        rows = run_custom_sql(conn, args.sql)
        result = {
            "sql": args.sql,
            "count": len(rows),
            "rows": rows
        }
    else:
        # Default behavior if called with no args: show summary
        result = get_database_summary(conn)

    conn.close()

    if args.json or True: # AI agents always prefer clean structured output
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()

