import pytest
from unittest.mock import MagicMock
from scripts.telegram_bot import IntentRouter

def test_handle_task_add():
    storage = MagicMock()
    storage.add_task.return_value = 42
    router = IntentRouter(storage=storage, db_path="dummy.db")
    
    reply = router.handle_text("/task Подготовить отчет по ставкам")
    assert "42" in reply
    assert "добавлена" in reply.lower()
    storage.add_task.assert_called_once_with("Подготовить отчет по ставкам", telegram_msg_id=None)

def test_handle_natural_task_add():
    storage = MagicMock()
    storage.add_task.return_value = 43
    router = IntentRouter(storage=storage, db_path="dummy.db")
    
    reply = router.handle_text("Запиши задачу: позвонить в Bakan Tex")
    assert "43" in reply
    assert "добавлена" in reply.lower()

def test_handle_task_done():
    storage = MagicMock()
    storage.complete_task.return_value = True
    router = IntentRouter(storage=storage, db_path="dummy.db")
    
    reply = router.handle_text("/done 42")
    assert "42" in reply
    assert "завершена" in reply.lower()
    storage.complete_task.assert_called_once_with(42, result_text="")

def test_handle_status():
    storage = MagicMock()
    storage.get_db_stats.return_value = {
        "clients": 428,
        "exhibition_leads": 29,
        "tariffs_routes": 24,
        "plan_fact": 36,
        "telegram_tasks": 5,
        "pending_tasks": 2
    }
    router = IntentRouter(storage=storage, db_path="dummy.db")
    reply = router.handle_text("/status")
    assert "428" in reply
    assert "29" in reply
    assert "Активных задач: 2" in reply

def test_handle_search_real_db():
    storage = MagicMock()
    router = IntentRouter(storage=storage, db_path="c:/Users/user/Fortis-way/db/fortisway.db")
    reply = router.handle_text("найди крахмал")
    assert "крахмал" in reply.lower() or "найдено" in reply.lower()
