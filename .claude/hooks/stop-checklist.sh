#!/bin/bash
# =============================================================
# Hook 7: 퇴근 체크리스트 (Stop)
# 팅커벨이 멈출 때 빠뜨린 것이 없는지 자동 체크
# 빠뜨린 게 있으면 차단 → 승현님에게 알려줌
# =============================================================

INPUT=$(cat)

# 무한루프 방지: stop_hook_active가 true이면 무조건 통과
STOP_ACTIVE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(str(data.get('stop_hook_active', False)).lower())
except:
    print('false')
" 2>/dev/null)

if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# 체크 1: 커밋 안 한 변경 (프롬프트 백업 파일은 제외 — Hook 간 충돌 방지)
UNCOMMITTED=$(git status --short 2>/dev/null | grep -v '\-prompts\.md' | wc -l | tr -d ' ')

# 체크 2: mini-projects 변경 + progress 누락 (프롬프트 백업 파일은 제외)
MINI_CHANGED=$(git diff --name-only 2>/dev/null | grep -v '\-prompts\.md' | grep -c 'mini-projects/' 2>/dev/null | tr -d ' \r\n' || echo 0)
PROGRESS_CHANGED=$(git diff --name-only 2>/dev/null | grep -v '\-prompts\.md' | grep -c 'progress/' 2>/dev/null | tr -d ' \r\n' || echo 0)
# 빈 값이면 0으로
MINI_CHANGED=${MINI_CHANGED:-0}
PROGRESS_CHANGED=${PROGRESS_CHANGED:-0}

# 문제 수집
ISSUES=""

if [ "$UNCOMMITTED" -gt 0 ]; then
  ISSUES="${ISSUES}커밋 안 된 파일 ${UNCOMMITTED}개 있어요. "
fi

if [ "$MINI_CHANGED" -gt 0 ] && [ "$PROGRESS_CHANGED" -eq 0 ]; then
  ISSUES="${ISSUES}mini-projects 변경이 있는데 progress 갱신이 안 됐어요. "
fi

# 문제 있으면 차단 + 안내
if [ -n "$ISSUES" ]; then
  echo "퇴근 체크리스트: ${ISSUES}커밋하고 마무리할까요? 승현님이 괜찮다고 하면 그냥 멈추세요." >&2
  exit 2
fi

# 문제 없으면 조용히 통과
exit 0
