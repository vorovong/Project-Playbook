#!/bin/bash
# =============================================================
# Hook 5: PDF 폭탄 감지기 (PostToolUse - Read)
# PDF 2개 이상 읽으면 "중간 커밋하세요!" 경고
# 증거: 3/3 PDF 3개 연속 → 컨텍스트 소진 사고
# =============================================================

INPUT=$(cat)

# python3으로 file_path 추출
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# PDF 파일이 아니면 무시
case "$FILE_PATH" in
  *.pdf|*.PDF) ;;
  *) exit 0 ;;
esac

# PDF 카운터 파일
COUNTER_FILE="/tmp/tinkerbell-pdf-count"

# 현재 카운트 읽기
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
else
  COUNT=0
fi

# 카운트 증가
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# 2개 이상이면 경고 (stdout → Claude 컨텍스트에 주입)
if [ "$COUNT" -ge 2 ]; then
  cat << EOF

=== PDF 폭탄 경고 ===
PDF ${COUNT}개째 읽었습니다!
지금 바로 중간 커밋 & 푸시하세요.

PDF는 컨텍스트 폭탄입니다 (일반 파일의 5~10배).
규칙: PDF 2개 이상 → 반드시 중간 커밋.
========================

EOF
fi

exit 0
