import os
import pytest
from scripts.config import get_bot_config, SecurityGuard

def test_config_loads_token_and_admin(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("TELEGRAM_BOT_TOKEN=test_token_123\nTELEGRAM_ADMIN_USERNAME=LogisticsFortisway\n", encoding="utf-8")
    monkeypatch.setenv("ENV_PATH", str(env_file))
    
    cfg = get_bot_config()
    assert cfg["bot_token"] == "test_token_123"
    assert cfg["admin_username"].lower() == "logisticsfortisway"

def test_security_guard_authorizes_and_caches_id(tmp_path):
    state_file = tmp_path / ".bot_state.json"
    guard = SecurityGuard(admin_username="LogisticsFortisway", state_file=str(state_file))
    
    # Unauthorized stranger
    assert guard.is_authorized(username="hacker", user_id=999999) is False
    
    # Authorized user by username first time
    assert guard.is_authorized(username="LogisticsFortisway", user_id=12345678) is True
    assert guard.admin_user_id == 12345678
    
    # State was persisted to file
    assert state_file.exists()
    
    # New guard instance loads persisted state and recognizes user by id
    guard2 = SecurityGuard(admin_username="LogisticsFortisway", state_file=str(state_file))
    assert guard2.is_authorized(username="", user_id=12345678) is True
    assert guard2.is_authorized(username="intruder", user_id=888888) is False
