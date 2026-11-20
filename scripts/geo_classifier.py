# -*- coding: utf-8 -*-
"""
Geographic & Cargo Stage Taxonomy Classifier for FortisWay.
Maps text, filenames, and media to country routes, cargo IDs, and stage categories.
"""

import re
from datetime import datetime

GEO_ALIASES = {
    "Польша": ["польш", "poland", "варшав", "lodz", "лодз", "краков", "krakow"],
    "Нидерланды": ["нидерланд", "голланд", "netherland", "роттердам", "амстердам", "rotterdam"],
    "Узбекистан": ["узбекистан", "uzbekistan", "ташкент", "самарканд", "бухар", "андижан", "навои"],
    "Китай": ["китай", "china", "шанхай", "пекин", "гуанчжоу", "нинбо", "урумчи", "beijing"],
    "Россия": ["росси", "russia", "москв", "петербург", "новосибирск", "екатеринбург"],
    "Турция": ["турци", "turkey", "стамбул", "измир", "мерсин", "анкар"],
    "Германия": ["германи", "germany", "берлин", "гамбург", "франкфурт"],
    "Казахстан": ["казахстан", "kazakhstan", "алмат", "астан", "шымкент"]
}

def detect_country(text: str, file_name: str = "") -> str:
    """Detects country based on text and file name aliases."""
    combined = f"{text} {file_name}".lower()
    for country, stems in GEO_ALIASES.items():
        for stem in stems:
            if stem in combined:
                return country
    return "Несортированное"

def detect_cargo_id(text: str) -> str:
    """Extracts or normalizes a shipment/cargo identifier."""
    # Check for known clients/brands
    if re.search(r"bakan[\s_-]*tex", text, re.IGNORECASE):
        return "BakanTex"
    
    # Check for flight / shipment numbers e.g., 'рейс #44', 'рейса #44', 'рейс 12A'
    m_flight = re.search(r"рейс[а-яА-Яa-zA-Z]*[\s#№_-]*([0-9a-zA-Z]+)", text, re.IGNORECASE)
    if m_flight:
        return f"Рейс_{m_flight.group(1)}"
        
    m_cargo = re.search(r"груз[а-яА-Яa-zA-Z]*[\s#№_-]*([0-9a-zA-Z]+)", text, re.IGNORECASE)
    if m_cargo:
        return f"Груз_{m_cargo.group(1)}"
        
    return f"Груз_{datetime.now().strftime('%Y-%m-%d')}"

def detect_category(text: str, file_name: str = "", content_type: str = "text") -> str:
    """Determines stage category for the item."""
    combined = f"{text} {file_name}".lower()

    # Video / Unloading
    if content_type == "video" or any(w in combined for w in ["видео", "выгруз", "разгруз"]):
        return "03_Видео_Выгрузки"

    # Photo / Loading / Seals
    if content_type == "photo" or any(w in combined for w in ["фото", "пломб", "погруз", "загруз"]):
        return "02_Фото_Погрузки_Пломб"

    # Documents, CMR, Invoice, Contract
    if content_type == "document" or any(w in combined for w in ["cmr", "инвойс", "договор", "ттн", "акт", "счет", ".pdf", ".xlsx"]):
        return "01_Документы_CMR_Инвойсы"

    # Delays, communications, claims
    if any(w in combined for w in ["задержк", "поставщик", "претензи", "проблем", "переписк"]):
        return "04_Переписка_и_Задержки"

    return "05_Заметки_и_Разное"

def classify_message(text: str = "", file_name: str = "", content_type: str = "text") -> dict:
    """Full classification pipeline."""
    text_clean = (text or "").strip()
    country = detect_country(text_clean, file_name)
    category = detect_category(text_clean, file_name, content_type)
    cargo_id = detect_cargo_id(text_clean)
    
    # Extract hashtags
    tags = re.findall(r"#(\w+)", text_clean)
    
    return {
        "country": country,
        "category": category,
        "cargo_id": cargo_id,
        "tags": tags
    }
