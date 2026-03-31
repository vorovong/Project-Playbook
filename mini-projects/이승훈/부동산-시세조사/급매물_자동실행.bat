@echo off
chcp 65001 >nul
cd /d "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\부동산-시세조사"

echo [%date% %time%] 실행 시작 >> log.txt
python 급매물_수집기_v2.py --notify --days 1 >> log.txt 2>&1
echo [%date% %time%] 실행 완료 (종료코드: %errorlevel%) >> log.txt
echo. >> log.txt
