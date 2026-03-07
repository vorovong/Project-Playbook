#!/bin/bash
# =============================================================
# Hook 1: 수호자 부트 시퀀스 (SessionStart) — v2
# 세션 시작할 때마다 자동 실행 — 팅커벨 3파일 로드를 "강제"
# v2 추가: 실수노트 리마인드, 새벽 경고, 매달 30일 루틴, PDF 카운터 초기화
# =============================================================

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || true

# 1. Git pull (조용히)
git pull --quiet 2>/dev/null

# 2. 현재 시간 파싱
CURRENT_TIME=$(date "+%Y-%m-%d (%a) %H:%M")
CURRENT_HOUR=$(date "+%H")
CURRENT_DAY=$(date "+%d")

# 3. 이전 세션 상태 복원 (PreCompact에서 저장한 파일)
STATE_FILE="$HOME/.claude/tinkerbell-state.txt"
RESTORE_MSG=""
if [ -f "$STATE_FILE" ]; then
  RESTORE_MSG="
--- 이전 세션 상태 (자동 복원) ---
$(cat "$STATE_FILE")
---"
fi

# 4. 새벽 경고 (00:00~06:00)
NIGHT_WARNING=""
if [ "$CURRENT_HOUR" -ge 0 ] && [ "$CURRENT_HOUR" -lt 6 ]; then
  NIGHT_WARNING="
[HEALTH] 새벽 ${CURRENT_HOUR}시입니다.
승현님 컨디션을 먼저 확인하세요.
자정 넘김 작업이면 전날 내용을 브리핑에서 빠뜨리지 마세요."
fi

# 5. 실수노트 최근 항목 추출 (있으면)
MISTAKE_REMINDER=""
MISTAKE_FILE="$PROJECT_DIR/mini-projects/박승현/팅커벨/LOG/실수노트.md"
if [ -f "$MISTAKE_FILE" ]; then
  # 최근 실수 유형 3개 추출 (## 패턴으로 헤딩 찾기)
  RECENT_MISTAKES=$(grep -E "^## [0-9]" "$MISTAKE_FILE" | tail -3 | sed 's/^## /  - /')
  if [ -n "$RECENT_MISTAKES" ]; then
    MISTAKE_REMINDER="
[CAUTION] 최근 실수 패턴 (반복하지 않기):
$RECENT_MISTAKES"
  fi
fi

# 6. 매달 28~30일 루틴 리마인드
MONTHLY_REMINDER=""
if [ "$CURRENT_DAY" -ge 28 ]; then
  MONTHLY_REMINDER="
[MONTHLY] ${CURRENT_DAY}일 — 월간 루틴 시즌입니다!
  - 30일: 팅커벨 버전 리포트 (프론티어 비교 + 버전 판정)
  - 30일: Hook 패턴 분석 (대화/실수 분석 → Hook 강화 제안)
  28일부터 데이터 수집을 시작하세요."
fi

# 7. PDF 카운터 초기화
rm -f /tmp/tinkerbell-pdf-count

# 8. 컨텍스트 주입 (이 출력이 Claude에게 전달됨)
cat << BOOT_EOF
======================================
 TINKERBELL BOOT SEQUENCE - $CURRENT_TIME
======================================

[MANDATORY] 다음을 반드시 실행하세요. 이 지시를 건너뛸 수 없습니다:

1. Read 도구로 3파일 로드:
   - mini-projects/박승현/팅커벨/tinkerbell.md
   - mini-projects/박승현/팅커벨/TELOS/MISSION.md
   - mini-projects/박승현/팅커벨/STRATEGY/내부전략.md

2. Read 도구로 commands.md 로드:
   - mini-projects/박승현/GIRIN-FSM/commands.md

3. 팅커벨로서 응답 (존대말, 여성형, 승현님)

4. 로드 완료 후 Interlock 출력:
   > 팅커벨 로드 완료
   > tinkerbell.md | MISSION.md | 내부전략.md

이 부트 시퀀스는 SessionStart Hook에 의해 자동 실행되었습니다.
$RESTORE_MSG$NIGHT_WARNING$MISTAKE_REMINDER$MONTHLY_REMINDER
======================================
BOOT_EOF
