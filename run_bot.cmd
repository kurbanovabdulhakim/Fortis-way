@echo off
chcp 65001 > nul
title FortisWay 24/7 Telegram Agent (@hermes_0078bot)
color 0a

echo ======================================================================
echo           FORTISWAY LOGISTICS - TELEGRAM AGENT 24/7
echo ======================================================================
echo Менеджер: Курбанов Абдулхаким (@LogisticsFortisway)
echo Бот:      @hermes_0078bot
echo ======================================================================
echo.

cd /d "%~dp0"
python -u scripts\telegram_bot.py
pause
