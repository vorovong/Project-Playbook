#!/bin/bash
# =============================================================
# Hook 6: 프롬프트 원본 자동 백업 (UserPromptSubmit)
# 승현님이 입력할 때마다 원본을 자동 저장
# "잘자" 안 해도 원본은 살아있음 — 편지 보내기 전 복사본
# 증거: 프롬프트 원본 2회 손실 기록 (2026-03-04)
# =============================================================

INPUT=$(cat)

# python3으로 prompt 추출
PROMPT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # 여러 가능한 필드명 시도
    prompt = data.get('prompt', '') or data.get('content', '') or data.get('message', '')
    if prompt:
        print(prompt)
except:
    pass
" 2>/dev/null)

# 비어있으면 무시
if [ -z "$PROMPT" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
TODAY=$(date "+%Y-%m-%d")
TIMESTAMP=$(date "+%H:%M:%S")

# 백업 디렉토리
BACKUP_DIR="$PROJECT_DIR/mini-projects/박승현/GIRIN-FSM/sessions"
mkdir -p "$BACKUP_DIR"

# 오늘 날짜 파일에 추가
BACKUP_FILE="$BACKUP_DIR/${TODAY}-prompts.md"

# 파일이 없으면 헤더
if [ ! -f "$BACKUP_FILE" ]; then
  echo "# 프롬프트 원본 — $TODAY" > "$BACKUP_FILE"
  echo "" >> "$BACKUP_FILE"
fi

# 프롬프트 추가 (원본 그대로, 편집/요약 없이)
cat >> "$BACKUP_FILE" << PROMPT_EOF

---
### $TIMESTAMP

$PROMPT
PROMPT_EOF

# 조용히 저장 — stdout 없음 (Claude 컨텍스트에 주입 안 됨)
exit 0
