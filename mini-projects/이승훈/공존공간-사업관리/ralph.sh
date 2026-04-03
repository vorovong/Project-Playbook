#!/bin/bash
# ============================================
# ralph.sh — Ralph Wiggum 자율 개발 루프
#
# 사용법: bash ralph.sh <스펙파일> [최대반복]
# 예시:   bash ralph.sh specs/newbiz.md 10
# ============================================

SPEC_FILE="$1"
MAX_ITERATIONS="${2:-10}"
ITERATION=0
LOG_DIR="ralph-logs"

# 색상
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 검증
if [ -z "$SPEC_FILE" ]; then
  echo -e "${RED}사용법: bash ralph.sh <스펙파일> [최대반복]${NC}"
  echo ""
  echo "예시:"
  echo "  bash ralph.sh specs/newbiz.md 10"
  echo "  bash ralph.sh specs/fix-bug.md 5"
  echo ""
  echo "스펙 파일 작성법:"
  echo "  specs/ 폴더에 .md 파일로 작업 설명 + 완료 기준 작성"
  exit 1
fi

if [ ! -f "$SPEC_FILE" ]; then
  echo -e "${RED}스펙 파일을 찾을 수 없습니다: $SPEC_FILE${NC}"
  exit 1
fi

# 로그 폴더 생성
mkdir -p "$LOG_DIR"

echo -e "${GREEN}=== Ralph Loop 시작 ===${NC}"
echo -e "스펙: $SPEC_FILE"
echo -e "최대 반복: $MAX_ITERATIONS"
echo -e "로그: $LOG_DIR/"
echo ""

# 메인 루프
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  LOG_FILE="$LOG_DIR/iteration_${ITERATION}_${TIMESTAMP}.log"

  echo -e "${YELLOW}── 반복 $ITERATION / $MAX_ITERATIONS ──${NC}"

  # Claude Code 실행 (비대화 모드)
  claude --print \
    "당신은 Ralph Loop의 반복 $ITERATION/$MAX_ITERATIONS 입니다.

## 스펙
$(cat "$SPEC_FILE")

## 규칙
1. 위 스펙을 읽고 작업을 수행하세요.
2. 이전 반복의 결과는 파일과 git 히스토리에 있습니다.
3. 에러가 있으면 고치세요.
4. 작업이 완전히 완료되면 마지막 줄에 정확히 RALPH_DONE 이라고 출력하세요.
5. 아직 할 일이 남았으면 RALPH_CONTINUE 라고 출력하고, 남은 작업을 설명하세요.
6. 완료 여부 판단: 스펙의 완료 기준을 모두 충족했는지 검증하세요.
" 2>&1 | tee "$LOG_FILE"

  echo ""

  # 완료 확인
  if grep -q "RALPH_DONE" "$LOG_FILE"; then
    echo -e "${GREEN}=== Ralph Loop 완료! (반복 $ITERATION회) ===${NC}"
    echo -e "로그: $LOG_DIR/"
    exit 0
  fi

  # 다음 반복 전 잠시 대기 (API 부하 방지)
  if [ $ITERATION -lt $MAX_ITERATIONS ]; then
    echo -e "${YELLOW}3초 후 다음 반복...${NC}"
    sleep 3
  fi
done

echo -e "${RED}=== 최대 반복 횟수 도달 ($MAX_ITERATIONS회) ===${NC}"
echo -e "마지막 로그: $LOG_FILE"
echo -e "수동으로 확인하세요."
exit 1
