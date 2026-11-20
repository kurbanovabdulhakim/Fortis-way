import pytest
import sqlite3
from scripts.library_storage import LibraryStorage

@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_library.db"
    return str(db_file)

def test_add_item_and_deduplication(test_db):
    storage = LibraryStorage(test_db)
    res1 = storage.add_item(
        telegram_msg_id=101,
        country="Польша",
        cargo_id="BakanTex_01",
        category="01_Документы",
        content_type="document",
        title="CMR накладная Варшава",
        raw_text="Груз отправлен из Варшавы",
        file_name="cmr_01.pdf",
        file_size_bytes=1048576,
        file_unique_id="unique_file_abc123"
    )
    assert res1["id"] > 0
    assert res1["is_duplicate"] is False
    
    # Submitting identical file_unique_id returns is_duplicate True and same id
    res2 = storage.add_item(
        telegram_msg_id=102,
        country="Польша",
        file_unique_id="unique_file_abc123",
        title="Повторная накладная",
        category="01_Документы",
        content_type="document"
    )
    assert res2["is_duplicate"] is True
    assert res2["id"] == res1["id"]

def test_country_isolated_search(test_db):
    storage = LibraryStorage(test_db)
    storage.add_item(country="Польша", title="Польша CMR", raw_text="Ткани Bakan Tex", category="01_Документы", content_type="document")
    storage.add_item(country="Узбекистан", title="Узбекистан Разгрузка", raw_text="Склад Ташкент", category="03_Видео", content_type="video")
    
    # Querying Poland
    poland_results = storage.find_items(query="Польша")
    assert len(poland_results) == 1
    assert poland_results[0]["country"] == "Польша"
    
    # Querying with country_filter
    uz_results = storage.find_items(query="", country_filter="Узбекистан")
    assert len(uz_results) == 1
    assert uz_results[0]["country"] == "Узбекистан"

def test_smartphone_stats(test_db):
    storage = LibraryStorage(test_db)
    storage.add_item(country="Польша", content_type="video", file_size_bytes=50000000, category="03_Видео", title="Видео 1")
    storage.add_item(country="Польша", content_type="photo", file_size_bytes=5000000, category="02_Фото", title="Фото 1")
    storage.add_item(country="Нидерланды", content_type="document", file_size_bytes=2000000, category="01_Документы", title="Док 1")
    
    stats = storage.get_storage_stats()
    assert "by_type" in stats
    assert "by_country" in stats
    assert stats["by_type"]["video"]["count"] == 1
    assert stats["by_type"]["video"]["bytes"] == 50000000
    assert stats["by_country"]["Польша"]["bytes"] == 55000000

def test_export_catalog_json(test_db, tmp_path):
    storage = LibraryStorage(test_db)
    storage.add_item(country="Польша", content_type="video", file_size_bytes=50000000, category="03_Видео_Выгрузки", title="Видео 1", cargo_id="Bakan_01")
    json_path = tmp_path / "catalog.json"
    data = storage.export_catalog_json(output_path=str(json_path))
    assert json_path.exists()
    assert len(data["items"]) == 1
    assert data["items"][0]["country"] == "Польша"
    assert data["items"][0]["cargo"] == "Bakan_01"
