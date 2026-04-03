# 공과금 정산율 버그 수정

## 목표
2026-04월 이후 공과금 정산율이 100%로 적용되는지 확인하고, 안 되면 수정.

## 작업 내용
1. businesses/gongzon/collectors.js의 fetchUtilities에서 정산율 로직 확인
2. node monthly-report.js gongzon 2026-04 실행
3. 콘솔 출력에서 공과금 합계가 95%가 아니라 100% 적용됐는지 확인

## 완료 기준
- [ ] 2026-03: 95% 적용 확인
- [ ] 2026-04: 100% 적용 확인
- [ ] node monthly-report.js gongzon 2026-04 에러 없이 실행
