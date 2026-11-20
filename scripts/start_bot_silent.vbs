Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\user\Fortis-way"
WshShell.Run "cmd /c python -u scripts\telegram_bot.py >> logs\telegram_daemon.log 2>&1", 0, False
