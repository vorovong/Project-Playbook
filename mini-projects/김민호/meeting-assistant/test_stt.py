#!/usr/bin/env python3
"""Gemini 오디오 STT 테스트 — 회의 비서 미니 프로젝트"""

import os
import sys
import time
from google import genai

def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    audio_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not audio_path or not os.path.exists(audio_path):
        print(f"사용법: python test_stt.py <오디오파일경로>")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # 1단계: 오디오 파일 업로드
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    print(f"파일 업로드 중... ({file_size_mb:.1f}MB)")

    uploaded = client.files.upload(file=audio_path)
    print(f"업로드 완료: {uploaded.name}")

    # 파일 처리 대기
    while uploaded.state.name == "PROCESSING":
        print("처리 중...")
        time.sleep(5)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name == "FAILED":
        print(f"파일 처리 실패: {uploaded.state}")
        sys.exit(1)

    print(f"파일 준비 완료 (상태: {uploaded.state.name})")

    # 2단계: Gemini에 오디오 + 프롬프트 전달
    print("\nGemini에 텍스트 변환 요청 중...")
    start_time = time.time()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            uploaded,
            """이 오디오 파일의 한국어 음성을 텍스트로 변환해줘.

규칙:
- 들리는 그대로 충실하게 텍스트로 옮겨줘
- 화자가 여러 명이면 구분해줘 (화자1, 화자2 등)
- 필러(어, 음, 그)는 제거
- 의미 단위로 문단을 나눠줘
- 알아들을 수 없는 부분은 [불명확]으로 표시"""
        ],
    )

    elapsed = time.time() - start_time
    print(f"변환 완료! (소요 시간: {elapsed:.1f}초)\n")
    print("=" * 60)

    result_text = response.text
    print(result_text[:3000])  # 처음 3000자만 출력

    if len(result_text) > 3000:
        print(f"\n... (총 {len(result_text)}자, 처음 3000자만 표시)")

    # 3단계: 결과 저장
    output_path = os.path.splitext(audio_path)[0] + "_transcript.md"
    # 프로젝트 폴더에 저장
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.basename(output_path)
    output_path = os.path.join(output_dir, output_filename)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"# 음성 변환 결과\n\n")
        f.write(f"- 원본 파일: {os.path.basename(audio_path)}\n")
        f.write(f"- 변환 모델: gemini-2.5-flash\n")
        f.write(f"- 소요 시간: {elapsed:.1f}초\n\n---\n\n")
        f.write(result_text)

    print(f"\n결과 저장: {output_path}")

    # 업로드한 파일 정리
    client.files.delete(name=uploaded.name)
    print("업로드 파일 정리 완료")


if __name__ == "__main__":
    main()
