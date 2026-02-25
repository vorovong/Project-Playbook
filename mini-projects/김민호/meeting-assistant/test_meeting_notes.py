#!/usr/bin/env python3
"""Gemini 오디오 → 구조화된 회의록 한 방 테스트"""

import os
import sys
import time
from google import genai

MEETING_NOTES_PROMPT = """이 오디오는 회의 녹음이야. 듣고 아래 형식으로 구조화된 회의록을 작성해줘.

## 출력 형식

```
---
date: (오늘 날짜 YYYY-MM-DD)
duration: (추정 소요시간)
participants: [화자 목록 - 이름을 알 수 있으면 이름, 아니면 화자1 등]
topics: [논의된 주제 태그들]
---

## 핵심 결정
| 결정 | 맥락 (왜?) | 담당 | 기한 |
|---|---|---|---|
| ... | ... | ... | ... |

## 액션 아이템
- [ ] 할 일 (@담당자, ~기한)

## 논의 요약 (토픽별)
### 토픽 제목
(해당 토픽에서 논의된 내용 요약)

## 다음 회의 안건
- (다음에 이어서 논의할 것들)
```

## 규칙
- 시간순이 아니라 **토픽별**로 정리
- 잡담, 필러(어, 음, 그) 제거
- 결정 사항에는 반드시 "왜 그렇게 결정했는지" 맥락 포함
- 액션 아이템은 구체적으로 (누가, 무엇을, 언제까지)
- 이름을 알 수 있으면 실명 사용, 아니면 화자1/화자2
- 알아들을 수 없는 부분은 [불명확]으로 표시
- 한국어로 작성
"""


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    audio_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not audio_path or not os.path.exists(audio_path):
        print(f"사용법: python test_meeting_notes.py <오디오파일경로>")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # 1단계: 오디오 파일 업로드
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    print(f"파일 업로드 중... ({file_size_mb:.1f}MB)")

    uploaded = client.files.upload(file=audio_path)
    print(f"업로드 완료: {uploaded.name}")

    while uploaded.state.name == "PROCESSING":
        print("처리 중...")
        time.sleep(5)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name == "FAILED":
        print(f"파일 처리 실패: {uploaded.state}")
        sys.exit(1)

    print(f"파일 준비 완료")

    # 2단계: 오디오 → 구조화된 회의록 한 번에
    print("\nGemini에 회의록 생성 요청 중... (시간이 좀 걸릴 수 있어요)")
    start_time = time.time()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded, MEETING_NOTES_PROMPT],
    )

    elapsed = time.time() - start_time
    print(f"생성 완료! (소요 시간: {elapsed:.1f}초)\n")
    print("=" * 60)
    print(response.text)
    print("=" * 60)

    # 3단계: 결과 저장
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "test_meeting_notes_result.md")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(response.text)

    print(f"\n결과 저장: {output_path}")
    print(f"총 글자 수: {len(response.text)}자")

    # 업로드 파일 정리
    client.files.delete(name=uploaded.name)
    print("업로드 파일 정리 완료")


if __name__ == "__main__":
    main()
