@echo off
chcp 65001 >nul
cd /d "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\부동산-시세조사"
python 급매물_수집기_v2.py --notify --days 1
