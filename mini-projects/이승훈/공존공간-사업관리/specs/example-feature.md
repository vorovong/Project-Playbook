# 텔레그램 알림 추가

## 목표
monthly-report.js 실행 완료 후 텔레그램으로 요약 알림 보내기.

## 작업 내용
1. lib/telegram.js 생성 — sendMessage(text) 함수
2. .env의 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 사용
3. monthly-report.js 마지막에 알림 호출
4. 알림 내용: 업체명, 월, 총매출, 순이익, 노션 URL

## 완료 기준
- [ ] lib/telegram.js가 require 가능
- [ ] node -e "require('./lib/telegram')" 에러 없음
- [ ] monthly-report.js에 텔레그램 호출 코드 포함
- [ ] 실제 텔레그램 메시지 수신 확인
