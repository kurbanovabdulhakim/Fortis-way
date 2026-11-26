import pytest
from unittest.mock import MagicMock
from scripts.telegram_bot import LibrarianRouter

def test_intake_text_note(tmp_path):
    storage = MagicMock()
    storage.add_item.return_value = {"id": 15, "is_duplicate": False, "country": "Польша", "category": "04_Переписка_и_Задержки"}
    client = MagicMock()
    
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel", repo_dir=str(tmp_path))
    reply = router.handle_message({
        "message_id": 1,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "Польша: поставщик задерживает отгрузку до вторника"
    })
    assert reply["id"] == 15
    assert reply["country"] == "Польша"
    assert reply["is_duplicate"] is False

def test_intake_duplicate_file(tmp_path):
    storage = MagicMock()
    storage.add_item.return_value = {"id": 12, "is_duplicate": True, "country": "Польша", "category": "02_Фото_Погрузки_Пломб"}
    client = MagicMock()
    
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel", repo_dir=str(tmp_path))
    reply = router.handle_message({
        "message_id": 2,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "Польша фото пломбы",
        "photo": [{"file_id": "p1", "file_unique_id": "u1", "file_size": 50000}]
    })
    assert reply["id"] == 12
    assert reply["is_duplicate"] is True

def test_query_country_search(tmp_path):
    storage = MagicMock()
    storage.find_items.return_value = [{
        "id": 12,
        "created_at": "2026-11-20 12:00:00",
        "country": "Польша",
        "category": "03_Видео_Выгрузки",
        "title": "Видео выгрузки Bakan Tex",
        "raw_text": "Выгрузка 20 тонн",
        "file_name": "unloading.mp4",
        "channel_msg_id": 88
    }]
    client = MagicMock()
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel", repo_dir=str(tmp_path))
    
    reply = router.handle_message({
        "message_id": 3,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "найди видео выгрузки Польша"
    })
    assert "Bakan Tex" in reply
    assert "Польша" in reply

def test_smartphone_stats_report(tmp_path):
    storage = MagicMock()
    storage.get_storage_stats.return_value = {
        "total_items": 10,
        "total_bytes": 104857600, # 100 MB
        "by_type": {
            "video": {"count": 2, "bytes": 80000000},
            "photo": {"count": 5, "bytes": 20000000},
            "document": {"count": 3, "bytes": 4857600}
        },
        "by_country": {
            "Польша": {"count": 6, "bytes": 70000000},
            "Узбекистан": {"count": 4, "bytes": 34857600}
        }
    }
    client = MagicMock()
    router = LibrarianRouter(storage=storage, client=client, channel_id="@test_channel", repo_dir=str(tmp_path))
    
    reply = router.handle_message({
        "message_id": 4,
        "from": {"id": 8930092703, "username": "LogisticsFortisway"},
        "text": "/stats"
    })
    assert "ХРАНИЛИЩЕ" in reply
    assert "Видео" in reply
    assert "Польша" in reply
