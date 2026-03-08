#!/bin/bash
# =============================================================
# Hook 3: 불약 방패 (PreToolUse - Edit|Write)
# 핵심 파일 수정 시도를 자동 차단
# 승현님이 승인하면 bypass 파일로 잠금 해제 (5분간 유효)
# =============================================================

# stdin에서 JSON 입력 읽기
INPUT=$(cat)

# python3으로 file_path 추출 (jq 대체)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# file_path가 비어있으면 통과
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 보호 파일 목록 (파일명으로 매칭)
PROTECTED_FILES=(
  "tinkerbell.md"
  "MISSION.md"
)

# bypass 파일 확인 (5분 이내 생성된 경우 통과)
BYPASS_FILE="/tmp/tinkerbell-bypass"
if [ -f "$BYPASS_FILE" ]; then
  # Windows Git Bash에서 find -mmin 대신 stat 사용
  BYPASS_AGE=$(( $(date +%s) - $(stat -c %Y "$BYPASS_FILE" 2>/dev/null || echo 0) ))
  if [ "$BYPASS_AGE" -lt 300 ]; then
    # bypass 유효 (5분 이내) — 통과
    exit 0
  else
    # bypass 만료 — 삭제
    rm -f "$BYPASS_FILE"
  fi
fi

# 보호 파일 체크
BASENAME=$(basename "$FILE_PATH")
for protected in "${PROTECTED_FILES[@]}"; do
  if [ "$BASENAME" = "$protected" ]; then
    echo "불약 방패: ${BASENAME}은 보호된 파일입니다. 승현님의 명시적 요청이 있어야 수정할 수 있어요. 승인받았다면 Bash로 'touch /tmp/tinkerbell-bypass' 실행 후 다시 시도하세요." >&2
    exit 2
  fi
done

# 보호 대상 아님 — 통과
exit 0
