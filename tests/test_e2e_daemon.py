import os
from pathlib import Path

def test_silent_vbs_script_exists():
    vbs_path = Path("scripts/start_bot_silent.vbs")
    assert vbs_path.exists()
    content = vbs_path.read_text(encoding="utf-8")
    assert "telegram_bot.py" in content
    assert "python" in content.lower()

def test_install_autostart_script_exists():
    script_path = Path("scripts/install_autostart.py")
    assert script_path.exists()
