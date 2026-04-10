@echo off
chcp 65001 >nul

set "SCRIPT_DIR=C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\부동산-시세조사"
set "PYTHON=C:\Users\leeha\AppData\Local\Microsoft\WindowsApps\python.exe"
set "LOG=%SCRIPT_DIR%\valuemap_log.txt"

echo [%date% %time%] 실행 시작 >> "%LOG%"
"%PYTHON%" "%SCRIPT_DIR%\벨류맵_수집기.py" --notify >> "%LOG%" 2>&1
echo [%date% %time%] 실행 완료 (종료코드: %errorlevel%) >> "%LOG%"
echo. >> "%LOG%"
