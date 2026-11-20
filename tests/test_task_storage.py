import sqlite3
import pytest
from scripts.task_storage import TaskStorage

@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_fortisway.db"
    conn = sqlite3.connect(str(db_file))
    conn.execute("""
    CREATE TABLE plan_fact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        employee TEXT,
        tasks_decisions TEXT,
        execution_date TEXT,
        comments TEXT,
        status TEXT,
        category TEXT
    )""")
    conn.commit()
    conn.close()
    return str(db_file)

def test_add_and_list_tasks_with_plan_fact_mirror(test_db):
    storage = TaskStorage(test_db)
    task_id = storage.add_task("Позвонить в Bakan Tex", telegram_msg_id=101)
    assert task_id > 0
    
    pending = storage.list_pending_tasks()
    assert len(pending) == 1
    assert pending[0]["task_text"] == "Позвонить в Bakan Tex"
    assert pending[0]["status"] == "pending"
    
    # Check plan_fact mirror
    conn = sqlite3.connect(test_db)
    cur = conn.cursor()
    cur.execute("SELECT employee, tasks_decisions, status, category FROM plan_fact WHERE tasks_decisions = ?", ("Позвонить в Bakan Tex",))
    row = cur.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "Курбанов А."
    assert row[2] == "Запланировано"
    assert row[3] == "Telegram Задача"

def test_complete_task(test_db):
    storage = TaskStorage(test_db)
    task_id = storage.add_task("Отправить КП в Роттердам", telegram_msg_id=102)
    ok = storage.complete_task(task_id, result_text="КП отправлено на почту")
    assert ok is True
    assert len(storage.list_pending_tasks()) == 0
    
    # Check plan_fact updated to Сделано
    conn = sqlite3.connect(test_db)
    cur = conn.cursor()
    cur.execute("SELECT status, comments FROM plan_fact WHERE tasks_decisions = ?", ("Отправить КП в Роттердам",))
    row = cur.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "Сделано"
    assert "КП отправлено на почту" in row[1]
