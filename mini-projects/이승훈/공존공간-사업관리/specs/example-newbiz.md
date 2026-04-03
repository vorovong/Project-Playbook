# 새 업체 세팅 스펙 (예시)

## 목표
businesses/sample/ 폴더를 만들어서 샘플 업체의 월정산 시스템을 세팅한다.

## 작업 내용

### 1. config.js 작성
- 업체명: 샘플카페
- 인건비: 매니저 300만, 알바 150만
- 고정비: 임대료 200만, 통신 5만, 기장료 11만
- 수수료: 카드 3.3%
- parentPageId: 테스트용이므로 빈 문자열

### 2. collectors.js 작성
- POS 매출 수집 (노션 DB 쿼리)
- 공과금 수집 (노션 DB 쿼리)
- collectors 배열로 export

### 3. sheets.js 작성
- 월결산 시트 (매출 vs 지출)
- 매출상세 시트 (일별)
- 인건비 시트
- mainSheet + subSheets로 export

### 4. 검증
- `node -e "require('./businesses/sample/config')"` 에러 없이 로드
- `node -e "require('./businesses/sample/collectors')"` 에러 없이 로드
- `node -e "require('./businesses/sample/sheets')"` 에러 없이 로드

## 완료 기준
- [ ] businesses/sample/config.js 존재하고 require 가능
- [ ] businesses/sample/collectors.js 존재하고 require 가능
- [ ] businesses/sample/sheets.js 존재하고 require 가능
- [ ] 3개 파일 모두 에러 없이 로드됨
