# -*- coding: utf-8 -*-
"""
Installs FortisWay Telegram Agent into Windows Startup folder.
Ensures the bot starts silently on system boot and runs 24/7.
"""

import os
import sys
import subprocess
from pathlib import Path

def create_windows_shortcut(target_path: Path, shortcut_path: Path, working_dir: Path, description: str = ""):
    """Creates a Windows .lnk shortcut using PowerShell."""
    ps_cmd = (
        f'$ws = New-Object -ComObject WScript.Shell; '
        f'$s = $ws.CreateShortcut("{shortcut_path}"); '
        f'$s.TargetPath = "{target_path}"; '
        f'$s.WorkingDirectory = "{working_dir}"; '
        f'$s.Description = "{description}"; '
        f'$s.Save()'
    )
    subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True, capture_output=True)

def install():
    project_root = Path(__file__).resolve().parent.parent
    vbs_target = project_root / "scripts" / "start_bot_silent.vbs"
    
    if not vbs_target.exists():
        print(f"[!] Файл {vbs_target} не найден.")
        sys.exit(1)

    startup_dir = Path(os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"))
    shortcut_path = startup_dir / "FortisWayTelegramAgent.lnk"
    
    print(f"[*] Установка автозагрузки в: {shortcut_path}")
    create_windows_shortcut(
        target_path=vbs_target,
        shortcut_path=shortcut_path,
        working_dir=project_root,
        description="FortisWay 24/7 Autonomous Telegram Agent"
    )
    print("✅ Автозагрузка успешно установлена. Бот будет автоматически запускаться при входе в Windows.")

    # Also create desktop shortcut for convenience
    desktop_dir = Path(os.path.expandvars(r"%USERPROFILE%\Desktop"))
    desktop_shortcut = desktop_dir / "FortisWay Telegram Agent.lnk"
    try:
        create_windows_shortcut(
            target_path=vbs_target,
            shortcut_path=desktop_shortcut,
            working_dir=project_root,
            description="Запустить FortisWay Telegram Agent 24/7"
        )
        print(f"✅ Ярлык на Рабочем столе создан: {desktop_shortcut}")
    except Exception as e:
        print(f"⚠️ Не удалось создать ярлык на рабочем столе: {e}")

if __name__ == "__main__":
    install()
