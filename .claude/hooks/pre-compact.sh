#!/bin/bash
# =============================================================
# Hook 3: 세션 이전 경보 (PreCompact) — v2
# 컨텍스트 압축 전에 현재 상태를 자동 백업
# v2 추가: sessions/ 오늘 파일 존재 여부 확인
# =============================================================

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || true

TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
TODAY=$(date "+%Y-%m-%d")
STATE_FILE="$HOME/.claude/tinkerbell-state.txt"

# 1. 현재 상태를 파일에 저장
cat > "$STATE_FILE" << STATE_EOF
저장 시각: $TIMESTAMP

[Git 상태]
$(git status --short 2>/dev/null || echo "(확인 불가)")

[최근 커밋 3개]
$(git log --oneline -3 2>/dev/null || echo "(확인 불가)")

[미커밋 변경]
$(git diff --stat 2>/dev/null || echo "(없음)")
STATE_EOF

# 2. sessions/ 오늘 파일 확인
SESSION_WARNING=""
SESSIONS_DIR="$PROJECT_DIR/mini-projects/박승현/팅커벨/sessions"
if [ -d "$SESSIONS_DIR" ]; then
  TODAY_SESSION=$(ls "$SESSIONS_DIR" 2>/dev/null | grep "$TODAY" | head -1)
  if [ -z "$TODAY_SESSION" ]; then
    SESSION_WARNING="
[WARNING] 오늘($TODAY) 세션 원문이 sessions/에 저장되지 않았습니다!
프롬프트 원본을 먼저 저장하세요. (2회 손실 기록 있음)"
  fi
fi

# 3. 컨텍스트에 경보 출력
cat << COMPACT_EOF
==========================================
 TINKERBELL COMPACT ALERT - $TIMESTAMP
==========================================

컨텍스트 압축이 시작됩니다.

체크리스트:
- 프롬프트 원본이 sessions/에 저장되었나요?
- progress가 최신 상태인가요?
- 미커밋 파일: $(git status --short 2>/dev/null | wc -l | tr -d ' ')개
$SESSION_WARNING
현재 상태가 자동 저장되었습니다.
다음 세션 시작 시 자동 복원됩니다.
==========================================
COMPACT_EOF
