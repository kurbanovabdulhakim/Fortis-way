# -*- coding: utf-8 -*-
"""
Database Task Storage & SSOT Mirroring Service for FortisWay.
Handles telegram_tasks queue and bidirectional mirroring with plan_fact.
"""

import sqlite3
from datetime import datetime
from pathlib import Path

class TaskStorage:
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
            CREATE TABLE IF NOT EXISTS telegram_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                telegram_msg_id INTEGER,
                task_text TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                result_text TEXT,
                completed_at TEXT
            );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_telegram_tasks_status ON telegram_tasks(status);")
            conn.commit()

    def add_task(self, task_text: str, telegram_msg_id: int = None) -> int:
        """Adds a task to the queue and mirrors to plan_fact."""
        now_dt = datetime.now()
        iso_now = now_dt.strftime("%Y-%m-%d %H:%M:%S")
        date_dd_mm_yyyy = now_dt.strftime("%d.%m.%Y")
        
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO telegram_tasks (created_at, telegram_msg_id, task_text, status)
                VALUES (?, ?, ?, 'pending')
            """, (iso_now, telegram_msg_id, task_text.strip()))
            task_id = cur.lastrowid
            
            # Mirror into plan_fact table if plan_fact exists
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='plan_fact';")
            if cur.fetchone():
                comment = f"Источник: Telegram (@hermes_0078bot, task #{task_id})"
                cur.execute("""
                    INSERT INTO plan_fact (date, employee, tasks_decisions, execution_date, comments, status, category)
                    VALUES (?, ?, ?, ?, ?, 'Запланировано', 'Telegram Задача')
                """, (date_dd_mm_yyyy, "Курбанов А.", task_text.strip(), date_dd_mm_yyyy, comment))
            conn.commit()
            return task_id

    def list_pending_tasks(self, limit: int = 50) -> list[dict]:
        """Lists all active pending tasks."""
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, created_at, telegram_msg_id, task_text, status
                FROM telegram_tasks
                WHERE status = 'pending'
                ORDER BY id ASC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cur.fetchall()]

    def complete_task(self, task_id: int, result_text: str = "") -> bool:
        """Marks a task as completed and updates plan_fact."""
        now_dt = datetime.now()
        iso_now = now_dt.strftime("%Y-%m-%d %H:%M:%S")
        
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT task_text FROM telegram_tasks WHERE id = ?
            """, (task_id,))
            row = cur.fetchone()
            if not row:
                return False
            task_text = row["task_text"]
            
            cur.execute("""
                UPDATE telegram_tasks
                SET status = 'completed', result_text = ?, completed_at = ?
                WHERE id = ?
            """, (result_text.strip(), iso_now, task_id))
            
            # Mirror update into plan_fact
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='plan_fact';")
            if cur.fetchone():
                cur.execute("""
                    SELECT id, comments FROM plan_fact
                    WHERE tasks_decisions = ? OR comments LIKE ?
                    ORDER BY id DESC LIMIT 1
                """, (task_text, f"%task #{task_id}%"))
                pf_row = cur.fetchone()
                if pf_row:
                    old_comments = pf_row["comments"] or ""
                    new_comments = f"{old_comments} | Выполнено: {result_text}".strip(" |")
                    cur.execute("""
                        UPDATE plan_fact
                        SET status = 'Сделано', comments = ?
                        WHERE id = ?
                    """, (new_comments, pf_row["id"]))
            conn.commit()
            return True

    def get_db_stats(self) -> dict:
        """Returns statistics on core tables."""
        stats = {}
        tables = ["clients", "exhibition_leads", "tariffs_routes", "plan_fact", "telegram_tasks"]
        with self._get_connection() as conn:
            cur = conn.cursor()
            for t in tables:
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (t,))
                if cur.fetchone():
                    cur.execute(f"SELECT COUNT(*) FROM {t};")
                    stats[t] = cur.fetchone()[0]
                else:
                    stats[t] = 0
            # Pending tasks count
            cur.execute("SELECT COUNT(*) FROM telegram_tasks WHERE status = 'pending';")
            stats["pending_tasks"] = cur.fetchone()[0]
        return stats
