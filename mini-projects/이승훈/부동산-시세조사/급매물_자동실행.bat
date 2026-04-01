@echo off
chcp 65001 >nul

set "SCRIPT_DIR=C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\부동산-시세조사"
set "PYTHON=C:\Users\leeha\AppData\Local\Microsoft\WindowsApps\python.exe"
set "LOG=%SCRIPT_DIR%\log.txt"

echo [%date% %time%] 실행 시작 >> "%LOG%"
"%PYTHON%" "%SCRIPT_DIR%\급매물_수집기_v2.py" --notify --days 1 >> "%LOG%" 2>&1
echo [%date% %time%] 실행 완료 (종료코드: %errorlevel%) >> "%LOG%"
echo. >> "%LOG%"
