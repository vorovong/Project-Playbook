#!/bin/bash
# =============================================================
# Hook 7: 세션 자동 저장 (PreCompact) — v3
# 컨텍스트 압축 전에 자동 커밋 & 푸시 (경보만 → 실제 행동)
# v3 변경: 자동 커밋 + 푸시 추가 (2026-03-08)
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

# 2. 자동 커밋 + 푸시
# - prompts 백업 파일 추가 (prompt-backup Hook이 생성한 것)
# - 이미 tracked된 변경 파일 추가 (git add -u)
# - untracked 파일 중 다른 세션 작업물은 건드리지 않음
COMMITTED=0

# prompts 파일 staging
git add mini-projects/*/GIRIN-FSM/sessions/*-prompts.md 2>/dev/null

# tracked 변경 파일 staging
git add -u 2>/dev/null

# 커밋할 게 있는지 확인
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')

if [ "$STAGED" -gt 0 ]; then
  git commit -m "자동 저장: pre-compact 세션 보존 ($TIMESTAMP)" 2>/dev/null && COMMITTED=1
  if [ "$COMMITTED" -eq 1 ]; then
    git push 2>/dev/null
  fi
fi

# 3. 컨텍스트에 상태 출력
if [ "$COMMITTED" -eq 1 ]; then
  SAVE_STATUS="자동 커밋+푸시 완료"
else
  SAVE_STATUS="커밋할 변경 없음"
fi

cat << COMPACT_EOF
==========================================
 TINKERBELL COMPACT ALERT - $TIMESTAMP
==========================================

컨텍스트 압축이 시작됩니다.
자동 저장: $SAVE_STATUS

팅커벨 할 일 (compact 후):
- [ ] progress 최신 상태 확인 + 갱신
- [ ] 대규모 분석 자제 (compact 후 컨텍스트 여유 적음)

현재 상태 → $STATE_FILE 에 저장됨
==========================================
COMPACT_EOF
