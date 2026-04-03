# 새 POS 수집기 개발

## 목표
[POS이름] POS에서 일별 매출 데이터를 자동 수집해서 노션 DB에 저장.

## 작업 내용
1. [POS이름]-sales.js 생성
2. Puppeteer로 POS 웹사이트 로그인
3. 일별 매출 데이터 추출 (총매출, 카드, 현금, 건수)
4. 노션 DB에 저장 (기존 okpos-sales.js 패턴 참고)
5. .env에 POS 로그인 정보 추가

## 완료 기준
- [ ] [POS이름]-sales.js 파일 존재
- [ ] node [POS이름]-sales.js --test 에러 없이 실행
- [ ] 노션 DB에 테스트 데이터 1건 이상 저장됨

## 참고
- 기존 패턴: okpos-sales.js
- POS 로그인 URL: [여기에 입력]
- POS ID/PW: .env에서 관리
