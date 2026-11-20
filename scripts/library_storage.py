# -*- coding: utf-8 -*-
"""
Library Storage Service for FortisWay 3-Tier Indestructible Vault.
Manages library_items table, FTS5 full-text indexing, deduplication,
country-isolated search, and smartphone storage metrics.
"""

import sqlite3
from datetime import datetime
from pathlib import Path

class LibraryStorage:
    def __init__(self, db_path: str):
        self.db_path = str(db_path)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA busy_timeout = 5000;")
        except sqlite3.OperationalError:
            pass
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
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
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_library_country ON library_items(country);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_library_category ON library_items(category);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_library_file_unique_id ON library_items(file_unique_id);")

            # Virtual table for Full Text Search
            conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS library_fts USING fts5(
                item_id UNINDEXED,
                country,
                title,
                raw_text,
                file_name
            );
            """)
            conn.commit()

    def add_item(
        self,
        country: str,
        category: str,
        title: str,
        content_type: str = "text",
        telegram_msg_id: int = None,
        channel_msg_id: int = None,
        cargo_id: str = "",
        raw_text: str = "",
        file_name: str = "",
        file_size_bytes: int = 0,
        file_unique_id: str = None,
        gdrive_file_id: str = "",
        gdrive_web_link: str = ""
    ) -> dict:
        """Adds an item with deduplication check on file_unique_id."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            
            # Check deduplication by file_unique_id
            if file_unique_id:
                cur.execute("SELECT id, country, category FROM library_items WHERE file_unique_id = ?", (file_unique_id,))
                existing = cur.fetchone()
                if existing:
                    return {
                        "id": existing["id"],
                        "is_duplicate": True,
                        "country": existing["country"],
                        "category": existing["category"]
                    }

            iso_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cur.execute("""
                INSERT INTO library_items (
                    created_at, telegram_msg_id, channel_msg_id, country, cargo_id,
                    category, content_type, title, raw_text, file_name, file_size_bytes,
                    file_unique_id, gdrive_file_id, gdrive_web_link
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                iso_now, telegram_msg_id, channel_msg_id, country, cargo_id,
                category, content_type, title, raw_text, file_name, file_size_bytes,
                file_unique_id, gdrive_file_id, gdrive_web_link
            ))
            item_id = cur.lastrowid

            # Insert into FTS index
            cur.execute("""
                INSERT INTO library_fts (item_id, country, title, raw_text, file_name)
                VALUES (?, ?, ?, ?, ?)
            """, (item_id, country, title, raw_text, file_name))

            conn.commit()
            return {
                "id": item_id,
                "is_duplicate": False,
                "country": country,
                "category": category
            }

    def find_items(self, query: str = "", country_filter: str = None, limit: int = 15) -> list[dict]:
        """Performs country-isolated search across library."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            query = (query or "").strip()

            conditions = []
            params = []

            if country_filter:
                conditions.append("country = ?")
                params.append(country_filter)

            if query:
                # First try FTS5 match if query is alphanumeric
                clean_q = "".join([c for c in query if c.isalnum() or c.isspace()]).strip()
                fts_ids = []
                if clean_q:
                    try:
                        cur.execute("SELECT item_id FROM library_fts WHERE library_fts MATCH ? LIMIT 30", (f'"{clean_q}"*',))
                        fts_ids = [r["item_id"] for r in cur.fetchall()]
                    except Exception:
                        pass

                if fts_ids:
                    placeholders = ",".join(["?"] * len(fts_ids))
                    conditions.append(f"id IN ({placeholders})")
                    params.extend(fts_ids)
                else:
                    like_q = f"%{query}%"
                    conditions.append("(country LIKE ? OR title LIKE ? OR raw_text LIKE ? OR file_name LIKE ? OR cargo_id LIKE ?)")
                    params.extend([like_q, like_q, like_q, like_q, like_q])

            where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            sql = f"""
                SELECT id, created_at, telegram_msg_id, channel_msg_id, country, cargo_id,
                       category, content_type, title, raw_text, file_name, file_size_bytes,
                       gdrive_file_id, gdrive_web_link
                FROM library_items
                {where_clause}
                ORDER BY id DESC
                LIMIT ?
            """
            params.append(limit)
            cur.execute(sql, tuple(params))
            return [dict(r) for r in cur.fetchall()]

    def get_storage_stats(self) -> dict:
        """Returns storage breakdown by content type and country (smartphone style)."""
        stats = {
            "total_items": 0,
            "total_bytes": 0,
            "by_type": {},
            "by_country": {}
        }
        with self._get_connection() as conn:
            cur = conn.cursor()
            
            # Total counts
            cur.execute("SELECT COUNT(*), COALESCE(SUM(file_size_bytes), 0) FROM library_items;")
            tot_row = cur.fetchone()
            stats["total_items"] = tot_row[0]
            stats["total_bytes"] = tot_row[1]

            # By content_type
            cur.execute("""
                SELECT content_type, COUNT(*) as cnt, COALESCE(SUM(file_size_bytes), 0) as total_sz
                FROM library_items
                GROUP BY content_type
                ORDER BY total_sz DESC;
            """)
            for r in cur.fetchall():
                stats["by_type"][r["content_type"]] = {
                    "count": r["cnt"],
                    "bytes": r["total_sz"]
                }

            # By country
            cur.execute("""
                SELECT country, COUNT(*) as cnt, COALESCE(SUM(file_size_bytes), 0) as total_sz
                FROM library_items
                GROUP BY country
                ORDER BY total_sz DESC;
            """)
            for r in cur.fetchall():
                stats["by_country"][r["country"]] = {
                    "count": r["cnt"],
                    "bytes": r["total_sz"]
                }

        return stats

    def get_last_items(self, limit: int = 5) -> list[dict]:
        """Returns the most recently cataloged items."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, created_at, country, cargo_id, category, content_type, title, raw_text, file_name, file_size_bytes
                FROM library_items
                ORDER BY id DESC
                LIMIT ?
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]
