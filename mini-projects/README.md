# Mini Projects

팀원들의 미니 프로젝트 결과물이 모이는 곳입니다.

## 팀 대시보드

| 멤버 | # | 프로젝트 | 분야 | 미니 목표 | 상태 |
|---|---|---|---|---|---|
| 김민호 | ✓ | 회의 비서 | 회의록 자동화 | 미니 검증 완료 → 풀 프로젝트 전환 | [별도 레포](https://github.com/vorovong/meeting-assistant) |
| 김민호 | 2 | 공존공간 AX 아카이빙 | 문서 마이그레이션 | 구글 드라이브 폴더 트리 추출 + txt→md 변환 | 예정 |
| 김민호 | 3 | 텔레그램 알림 봇 | 팀 소통 자동화 | 클로드 코드에서 팀 그룹에 메시지 자동 발송 | 예정 |
| 김민호 | ✓ | ai-news-hub | AI 뉴스 큐레이션 | v3.0 완료 | [별도 레포](https://github.com/vorovong/my-ai-hub) 운영 중 |
| 박승현 | 1 | GONGZONE-FSM | AI 경영 시스템 | 마스터 프롬프트 시스템 구축 | 진행 중 |
| 박승현 | 2 | GIRIN-FSM | 개인 AI 조종 시스템 | "안녕/잘자" 커스텀 명령어 + FSM 아키텍처 | 진행 중 |
| 박승현 | 3 | GIRIN BODY LOG | 운동 기록 앱 | 길드원과 함께 쓰는 운동 기록 웹앱 | 진행 중 |
| 이승훈 | ✓ | 슈파 데이터분석 | 공동구매 데이터 분석 | 파트너별 리포트 + 협상 제안서 자동생성 | v2 완료 |
| 이승훈 | 2 | 슈파 공동구매 챗봇 | 카카오톡 주문 시스템 | 챗봇 주문 + 관리자 화면 + 발주서 자동생성 | Phase 1 진행 중 |

> **대시보드 갱신 규칙**: 멤버의 projects.md를 업데이트할 때, 다른 멤버 폴더의 projects.md도 확인하여 변경사항이 있으면 이 대시보드에 함께 반영한다.

---

## 폴더 구조

```
mini-projects/
  김민호/
    projects.md        ← 프로젝트 목록 및 계획
    (프로젝트별 폴더)
  박승현/
    GONGZONE-FSM/      ← 회사 운영 시스템
    GIRIN-FSM/         ← 개인 AI 조종 시스템
    side-projects/     ← 사이드 프로젝트 (BODY LOG, 체력단련)
  이승훈/
    projects.md        ← 프로젝트 목록
    슈파-데이터분석/   ← v2 완료
    슈파-공동구매/     ← Phase 1 진행 중
```

## 독립 레포로 분리된 프로젝트

| 멤버 | 프로젝트 | 레포 | 설명 |
|---|---|---|---|
| 김민호 | ai-news-hub | [vorovong/my-ai-hub](https://github.com/vorovong/my-ai-hub) | AI 뉴스 자동 수집 + GitHub Pages 배포 |
| 김민호 | meeting-assistant | [vorovong/meeting-assistant](https://github.com/vorovong/meeting-assistant) | 회의 녹음 → 구조화된 회의록 자동 생성 (텔레그램 봇 + Gemini) |

> 배포(GitHub Pages, Actions 등)가 필요해지면 별도 레포로 분리합니다.
> 분리 후에는 위 표에 링크를 추가해주세요.

---

## 규칙

1. **자기 이름 폴더 안에서 작업하세요**

2. **프로젝트별로 하위 폴더를 만드세요**

3. **다른 사람 폴더는 건드리지 마세요**

4. 잘 모르겠으면 클로드 코드에게 이렇게 말하세요:
   > "내 미니 프로젝트 결과물을 mini-projects/[내이름]/ 에 정리하고 git에 올려줘"
