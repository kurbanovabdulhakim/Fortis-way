import json
import pytest
from unittest.mock import patch, MagicMock
from scripts.telegram_client import TelegramClient

def _create_mock_context(payload_dict):
    mock_cm = MagicMock()
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps(payload_dict).encode("utf-8")
    mock_cm.__enter__.return_value = mock_resp
    mock_cm.__exit__.return_value = False
    return mock_cm

def test_get_me():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({"ok": True, "result": {"id": 9221650250, "username": "hermes_0078bot"}})
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = client.get_me()
        assert res["ok"] is True
        assert res["result"]["username"] == "hermes_0078bot"

def test_send_message_truncates_long_text():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({"ok": True, "result": {"message_id": 1}})
    
    with patch("urllib.request.urlopen", return_value=mock_cm) as mock_urlopen:
        long_text = "A" * 5000
        client.send_message(chat_id=123, text=long_text)
        req = mock_urlopen.call_args[0][0]
        posted_data = json.loads(req.data.decode("utf-8"))
        assert len(posted_data["text"]) <= 4096

def test_get_updates():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({
        "ok": True,
        "result": [{"update_id": 100, "message": {"text": "hello"}}]
    })
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        updates = client.get_updates(offset=100, timeout=10)
        assert len(updates) == 1
        assert updates[0]["update_id"] == 100

def test_set_menu_button_webapp():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({"ok": True, "result": True})
    
    with patch("urllib.request.urlopen", return_value=mock_cm) as mock_urlopen:
        client.set_menu_button(web_app_url="https://example.com/app", chat_id=12345)
        req = mock_urlopen.call_args[0][0]
        posted_data = json.loads(req.data.decode("utf-8"))
        assert posted_data["chat_id"] == 12345
        assert posted_data["menu_button"]["type"] == "web_app"
        assert posted_data["menu_button"]["web_app"]["url"] == "https://example.com/app"
