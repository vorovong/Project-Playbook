#!/bin/bash
# =============================================================
# Hook 8: 세션 로그 자동 저장 (SessionEnd)
# "잘자" 없이 끊겨도 최소한의 기록은 남김
# 일지 자동 저장 — 뒷문 잠금장치
# =============================================================

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

# 로그 파일
LOG_DIR="$PROJECT_DIR/mini-projects/박승현/GIRIN-FSM/sessions"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/session-log.md"

# 파일이 없으면 헤더
if [ ! -f "$LOG_FILE" ]; then
  echo "# 세션 로그 (자동 기록)" > "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo "> 이 파일은 SessionEnd Hook이 자동 생성합니다." >> "$LOG_FILE"
  echo "> \"잘자\" 없이 세션이 끝나도 최소 기록이 남습니다." >> "$LOG_FILE"
fi

# git 상태 스냅샷
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "(확인 불가)")
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')

# 로그 추가
cat >> "$LOG_FILE" << LOG_EOF

---
**$TIMESTAMP** — 세션 종료
- 마지막 커밋: $LAST_COMMIT
- 미커밋 파일: ${UNCOMMITTED}개
LOG_EOF

exit 0
