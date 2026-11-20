from unittest.mock import patch, MagicMock
from scripts.telegram_client import TelegramClient

def _create_mock_context(payload_dict):
    mock_cm = MagicMock()
    mock_resp = MagicMock()
    mock_resp.read.return_value = str(payload_dict).replace("'", '"').replace("True", "true").replace("False", "false").encode("utf-8")
    mock_cm.__enter__.return_value = mock_resp
    mock_cm.__exit__.return_value = False
    return mock_cm

def test_copy_message_to_channel():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({"ok": True, "result": {"message_id": 999}})
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = client.copy_message(chat_id="-1001234567890", from_chat_id=123, message_id=456, caption="#Польша")
        assert res["ok"] is True
        assert res["result"]["message_id"] == 999

def test_set_menu_button():
    client = TelegramClient("dummy_token")
    mock_cm = _create_mock_context({"ok": True, "result": True})
    
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = client.set_menu_button("https://kurbanovabdulhakim.github.io/Fortis-way/web/")
        assert res["ok"] is True
