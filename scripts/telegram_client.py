# -*- coding: utf-8 -*-
"""
Lightweight Telegram Bot API Client using Python standard library.
Stdlib urllib.request, automatic retries, Markdown fallback.
"""

import json
import time
import urllib.request
import urllib.error
import socket

TELEGRAM_API_BASE = "https://api.telegram.org/bot"

class TelegramClient:
    def __init__(self, token: str):
        self.token = token.strip()
        self.api_url = f"{TELEGRAM_API_BASE}{self.token}/"

    def _call_api(self, method: str, payload: dict = None, timeout: float = 35.0) -> dict:
        url = f"{self.api_url}{method}"
        headers = {"Content-Type": "application/json"}
        data = json.dumps(payload).encode("utf-8") if payload else None
        
        req = urllib.request.Request(url, data=data, headers=headers)
        
        retries = 3
        delay = 1.0
        for attempt in range(retries):
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    resp_bytes = resp.read()
                    return json.loads(resp_bytes.decode("utf-8"))
            except (urllib.error.HTTPError) as e:
                try:
                    err_body = json.loads(e.read().decode("utf-8"))
                except Exception:
                    err_body = {"ok": False, "description": str(e)}
                # If markdown failed, don't retry in loop, return error body so caller can fallback
                return err_body
            except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
                if attempt == retries - 1:
                    return {"ok": False, "description": f"Network error after {retries} attempts: {e}"}
                time.sleep(delay)
                delay *= 2
        return {"ok": False, "description": "Unknown API error"}

    def get_me(self) -> dict:
        """Tests the token and returns basic bot info."""
        return self._call_api("getMe", timeout=15.0)

    def get_updates(self, offset: int = None, timeout: int = 30) -> list[dict]:
        """Polls new updates via Long Polling."""
        payload = {"timeout": timeout}
        if offset is not None:
            payload["offset"] = offset
        res = self._call_api("getUpdates", payload=payload, timeout=timeout + 10)
        if res.get("ok"):
            return res.get("result", [])
        return []

    def send_message(self, chat_id: int | str, text: str, parse_mode: str = "Markdown", reply_markup: dict = None) -> dict:
        """Sends a text message with safe chunking, Markdown error fallback, and optional reply_markup."""
        if not text:
            return {"ok": False, "description": "Empty text"}
            
        # Truncate if exceeds single message limit
        if len(text) > 4096:
            text = text[:4090] + "..."
            
        payload = {
            "chat_id": chat_id,
            "text": text
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup
            
        res = self._call_api("sendMessage", payload=payload, timeout=20.0)
        
        # If Markdown parsing failed (e.g., unmatched brackets), retry as plain text
        if not res.get("ok") and parse_mode and "can't parse entities" in res.get("description", "").lower():
            payload.pop("parse_mode", None)
            res = self._call_api("sendMessage", payload=payload, timeout=20.0)
            
        return res

    def copy_message(self, chat_id: int | str, from_chat_id: int | str, message_id: int, caption: str = "") -> dict:
        """Copies any message (video, photo, document up to 2GB) to destination chat/channel."""
        payload = {
            "chat_id": chat_id,
            "from_chat_id": from_chat_id,
            "message_id": message_id
        }
        if caption:
            payload["caption"] = caption
        return self._call_api("copyMessage", payload=payload, timeout=30.0)

    def set_menu_button(self, web_app_url: str = "", chat_id: int | str = None, text: str = "Каталог 📚") -> dict:
        """Configures the persistent menu/WebApp button in the bottom-left corner."""
        payload = {}
        if chat_id is not None:
            payload["chat_id"] = chat_id
            
        if web_app_url:
            payload["menu_button"] = {
                "type": "web_app",
                "text": text,
                "web_app": {"url": web_app_url}
            }
        else:
            payload["menu_button"] = {"type": "default"}
            
        return self._call_api("setChatMenuButton", payload=payload, timeout=15.0)

    def set_commands(self, commands: list[dict]) -> dict:
        """Sets the bot's registered command list for autocomplete and menu."""
        return self._call_api("setMyCommands", payload={"commands": commands}, timeout=15.0)

