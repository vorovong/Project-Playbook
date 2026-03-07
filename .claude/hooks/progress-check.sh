#!/bin/bash
# =============================================================
# Hook 5: progress 동반 커밋 경고 (PreToolUse - Bash)
# mini-projects/ 변경이 있는데 progress/ 없이 커밋하면 경고
# 증거: MEMORY.md 규칙 + 3/2 잘자 루틴에서 progress 누락
# =============================================================

INPUT=$(cat)

# python3으로 command 추출
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# git commit 또는 git push가 아니면 무시
case "$COMMAND" in
  *"git commit"*|*"git push"*) ;;
  *) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# staged 파일 확인
STAGED=$(git diff --cached --name-only 2>/dev/null)

# staged가 비어있으면 (git push만 하는 경우) unstaged도 확인
if [ -z "$STAGED" ]; then
  STAGED=$(git diff --name-only 2>/dev/null)
fi

# mini-projects/ 변경이 있는지
HAS_MINI=$(echo "$STAGED" | grep -c "^mini-projects/" 2>/dev/null)

# progress/ 변경이 있는지
HAS_PROGRESS=$(echo "$STAGED" | grep -c "^progress/" 2>/dev/null)

# mini-projects 변경은 있는데 progress 변경이 없으면 경고
if [ "$HAS_MINI" -gt 0 ] && [ "$HAS_PROGRESS" -eq 0 ]; then
  cat << EOF

=== progress 동반 커밋 경고 ===
mini-projects/ 변경이 있는데 progress/가 빠져있어요!

규칙: mini-projects 커밋 시 progress도 반드시 함께.
progress를 먼저 업데이트한 후 커밋하세요.
================================

EOF
fi

# 경고만 하고 차단하지는 않음 (exit 0)
exit 0
