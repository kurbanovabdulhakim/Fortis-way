# -*- coding: utf-8 -*-
"""
Configuration and Security Guard module for FortisWay Telegram Agent.
Stdlib-only, respects Ponytail minimalism.
"""

import os
import json
from pathlib import Path

DEFAULT_ADMIN_USERNAME = "LogisticsFortisway"
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "db" / "fortisway.db"
DEFAULT_STATE_FILE = Path(__file__).resolve().parent.parent / ".bot_state.json"

def load_env(env_path: Path = None) -> dict:
    """Parses a simple .env file without external dependencies."""
    if env_path is None:
        custom_env = os.environ.get("ENV_PATH")
        if custom_env:
            env_path = Path(custom_env)
        else:
            env_path = Path(__file__).resolve().parent.parent / ".env"
    
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip().strip("'\"")
    return env_vars

def get_bot_config() -> dict:
    """Returns validated bot configuration dictionary."""
    file_vars = load_env()
    
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN") or file_vars.get("TELEGRAM_BOT_TOKEN", "")
    admin_username = os.environ.get("TELEGRAM_ADMIN_USERNAME") or file_vars.get("TELEGRAM_ADMIN_USERNAME", DEFAULT_ADMIN_USERNAME)
    gemini_api_key = os.environ.get("GEMINI_API_KEY") or file_vars.get("GEMINI_API_KEY", "")
    
    return {
        "bot_token": bot_token,
        "admin_username": admin_username.lstrip("@"),
        "gemini_api_key": gemini_api_key,
        "db_path": str(DEFAULT_DB_PATH)
    }

class SecurityGuard:
    """Enforces access control and caches the numeric admin Telegram ID."""
    
    def __init__(self, admin_username: str = DEFAULT_ADMIN_USERNAME, state_file: str = None):
        self.admin_username = admin_username.lstrip("@").lower()
        self.state_file = Path(state_file) if state_file else DEFAULT_STATE_FILE
        self.admin_user_id = None
        self._load_state()

    def _load_state(self):
        if self.state_file.exists():
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.admin_user_id = data.get("admin_user_id")
            except Exception:
                self.admin_user_id = None

    def _save_state(self):
        try:
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.state_file, "w", encoding="utf-8") as f:
                json.dump({"admin_user_id": self.admin_user_id, "admin_username": self.admin_username}, f, indent=2)
        except Exception:
            pass

    def is_authorized(self, username: str = "", user_id: int = 0) -> bool:
        """Verifies if the sender is the authorized manager."""
        clean_user = (username or "").lstrip("@").lower()
        clean_id = int(user_id or 0)
        
        # Check by cached numeric ID
        if self.admin_user_id and clean_id == self.admin_user_id:
            return True
            
        # Check by username and cache user_id if valid
        if clean_user and clean_user == self.admin_username:
            if clean_id > 0:
                self.admin_user_id = clean_id
                self._save_state()
            return True
            
        return False
