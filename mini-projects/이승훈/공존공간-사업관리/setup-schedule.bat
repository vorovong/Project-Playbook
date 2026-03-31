@echo off
schtasks /create /tn "공존공간-업무일지-자동분류" /tr "node C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리\notion-autofill.js" /sc daily /st 20:00 /f
echo 완료! 매일 저녁 8시에 자동 분류가 실행됩니다.
pause
