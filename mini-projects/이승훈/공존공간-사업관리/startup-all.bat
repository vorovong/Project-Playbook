@echo off
chcp 65001 >nul
cd /d "C:\Users\leeha\projects\Project_Playbook\mini-projects\이승훈\공존공간-사업관리"

echo [공존공간] 공과금 자동수집 시작...

echo --- 전기+가스 메일 수집 ---
node utility-autofill.js

echo --- 수도요금 크롤링 ---
node water-bill.js

echo --- 업무일지 자동분류 ---
node notion-autofill.js

echo [완료] 모든 자동수집 끝.
timeout /t 5
