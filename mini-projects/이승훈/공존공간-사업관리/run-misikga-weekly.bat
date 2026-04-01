@echo off
chcp 65001 >nul
cd /d "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리"

:: 전주 월~일 자동 계산
for /f %%a in ('node -e "const d=new Date();d.setDate(d.getDate()-d.getDay()-6);console.log(d.toISOString().slice(0,10))"') do set START=%%a
for /f %%a in ('node -e "const d=new Date();d.setDate(d.getDate()-d.getDay());console.log(d.toISOString().slice(0,10))"') do set END=%%a

echo [미식가] 주간정산: %START% ~ %END%
node misikga-settlement.js weekly %START% %END%
