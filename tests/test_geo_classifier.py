import pytest
from scripts.geo_classifier import classify_message

def test_classify_poland_video():
    res = classify_message(text="Польша Bakan Tex разгрузка завершена", file_name="vid_001.mp4", content_type="video")
    assert res["country"] == "Польша"
    assert res["category"] == "03_Видео_Выгрузки"
    assert "BakanTex" in res["cargo_id"]

def test_classify_alias_rotterdam():
    res = classify_message(text="Пришла машина из Роттердама, CMR на руках", file_name="scan.pdf", content_type="document")
    assert res["country"] == "Нидерланды"
    assert res["category"] == "01_Документы_CMR_Инвойсы"

def test_classify_unlabeled_fallback():
    res = classify_message(text="", file_name="image.jpg", content_type="photo")
    assert res["country"] == "Несортированное"
    assert res["category"] == "02_Фото_Погрузки_Пломб"

def test_classify_delay_note():
    res = classify_message(text="Узбекистан: поставщик сообщает о задержке рейса #44", content_type="text")
    assert res["country"] == "Узбекистан"
    assert res["category"] == "04_Переписка_и_Задержки"
    assert "Рейс_44" in res["cargo_id"]
