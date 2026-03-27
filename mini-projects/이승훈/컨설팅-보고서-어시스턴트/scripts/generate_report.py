#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
서울신용보증재단 경영개선 컨설팅 보고서 HWPX 생성 스크립트

**참조 복원 방식**: 원본 HWPX에서 추출한 ref_section.xml을 복사한 후,
텍스트 내용(hp:t)만 사용자 데이터로 교체하여 빌드합니다.
원본의 스타일, 레이아웃, 치수를 100% 보존합니다.

사용법:
  python generate_report.py --data data.json --output 보고서.hwpx
"""

import copy
import json
import os
import subprocess
import sys
import tempfile
import argparse

from lxml import etree

SKILL_DIR = os.path.expanduser("~/.claude/skills/hwpx")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
TEMPLATE_DIR = os.path.join(PROJECT_DIR, "templates")

NS = {
    "hp": "http://www.hancom.co.kr/hwpml/2011/paragraph",
    "hs": "http://www.hancom.co.kr/hwpml/2011/section",
}


def get_ref_paths():
    """참조 XML 파일 경로를 반환한다."""
    header = os.path.join(TEMPLATE_DIR, "ref_header.xml")
    section = os.path.join(TEMPLATE_DIR, "ref_section.xml")
    if not os.path.exists(header):
        raise FileNotFoundError(f"ref_header.xml not found: {header}")
    if not os.path.exists(section):
        raise FileNotFoundError(f"ref_section.xml not found: {section}")
    return header, section


def find_tables(root):
    """섹션 내 모든 hp:tbl 요소를 반환한다."""
    return root.findall(".//hp:tbl", NS)


def get_cell(table, row_idx, col_idx):
    """테이블에서 특정 (row, col) 위치의 hp:tc 요소를 반환한다."""
    rows = table.findall(".//hp:tr", NS)
    if row_idx >= len(rows):
        return None
    cells = rows[row_idx].findall("hp:tc", NS)
    if col_idx >= len(cells):
        return None
    return cells[col_idx]


def get_sublist(cell):
    """셀 내 hp:subList 요소를 반환한다."""
    if cell is None:
        return None
    return cell.find(".//hp:subList", NS)


def set_cell_text(cell, text):
    """셀 내 첫 번째 hp:t 요소의 텍스트를 교체한다.
    단일 텍스트 셀 전용. 여러 hp:t가 있을 수 있으므로
    첫 번째 hp:t만 변경하고 나머지 run은 제거한다.
    hp:t가 없는 경우(자기닫힘 run) 새로 생성한다."""
    sl = get_sublist(cell)
    if sl is None:
        return
    paras = sl.findall("hp:p", NS)
    if not paras:
        return
    # 첫 번째 paragraph의 첫 번째 run의 hp:t를 교체
    p = paras[0]
    runs = p.findall("hp:run", NS)
    if not runs:
        return
    t_el = runs[0].find("hp:t", NS)
    if t_el is not None:
        t_el.text = text
    else:
        # hp:t가 없으면 생성
        t_el = etree.SubElement(
            runs[0], "{http://www.hancom.co.kr/hwpml/2011/paragraph}t"
        )
        t_el.text = text
    # 첫 번째 paragraph에 추가 run이 있으면 제거
    for r in runs[1:]:
        p.remove(r)


def replace_multiline_content(cell, lines, prefix=" - "):
    """셀 내 hp:subList의 paragraph들을 교체한다.

    원본의 첫 번째 hp:p를 템플릿으로 사용하여:
    - paraPrIDRef, styleIDRef 등 속성을 보존
    - 첫 번째 run의 charPrIDRef를 보존
    - 기존 paragraph을 모두 제거하고 새 항목으로 대체
    """
    sl = get_sublist(cell)
    if sl is None:
        return

    paras = sl.findall("hp:p", NS)
    if not paras:
        return

    # 첫 번째 paragraph을 템플릿으로 사용
    template_p = paras[0]
    template_attribs = dict(template_p.attrib)

    # 첫 번째 run의 charPrIDRef를 가져옴
    template_runs = template_p.findall("hp:run", NS)
    char_pr = "47"  # 기본값 (원본의 일반 텍스트 스타일)
    if template_runs:
        char_pr = template_runs[0].get("charPrIDRef", "47")

    # 기존 paragraph을 모두 제거
    for p in paras:
        sl.remove(p)

    # 새 paragraph 생성
    if not lines:
        lines = [""]

    for line_text in lines:
        new_p = etree.SubElement(sl, "{http://www.hancom.co.kr/hwpml/2011/paragraph}p")
        # 템플릿 속성 복사 (id 제외 - 새 id 생성)
        for k, v in template_attribs.items():
            if k == "id":
                new_p.set(k, "2147483648")  # 원본과 동일
            else:
                new_p.set(k, v)

        new_run = etree.SubElement(
            new_p, "{http://www.hancom.co.kr/hwpml/2011/paragraph}run"
        )
        new_run.set("charPrIDRef", char_pr)

        new_t = etree.SubElement(
            new_run, "{http://www.hancom.co.kr/hwpml/2011/paragraph}t"
        )
        if line_text:
            new_t.text = f"{prefix}{line_text}"
        else:
            new_t.text = ""


def replace_day_date(cell, date_str):
    """Table 3의 일차 셀에서 날짜 부분만 교체한다.
    구조: p[0]='N일차', p[1]='(MM/DD)'
    p[1]의 첫 번째 hp:t 텍스트만 교체한다."""
    sl = get_sublist(cell)
    if sl is None:
        return
    paras = sl.findall("hp:p", NS)
    if len(paras) < 2:
        return
    # p[1]의 첫 run의 hp:t를 교체
    runs = paras[1].findall("hp:run", NS)
    if not runs:
        return
    t_el = runs[0].find("hp:t", NS)
    if t_el is not None:
        t_el.text = date_str


def modify_section(section_path, data):
    """ref_section.xml을 파싱하고 데이터로 텍스트를 교체한 후 반환한다."""
    tree = etree.parse(section_path)
    root = tree.getroot()

    tables = find_tables(root)
    if len(tables) < 3:
        raise ValueError(f"Expected 3 tables, found {len(tables)}")

    tbl_info = tables[0]  # Table 0: 상단 정보 (2x4)
    tbl_content = tables[1]  # Table 1: 본문 (6x2)
    tbl_photo = tables[2]  # Table 2: 현장 사진 (4x3)

    year = data.get("year", "2026")

    # ── 제목 교체: 경영개선 컨설팅 보고서(YYYY) ──
    # Para 1의 run[1]에 있음 (charPr=45)
    top_paras = root.findall("hp:p", NS)
    if len(top_paras) > 1:
        title_para = top_paras[1]
        runs = title_para.findall("hp:run", NS)
        if len(runs) > 1:
            t_el = runs[1].find("hp:t", NS)
            if t_el is not None:
                t_el.text = f"경영개선 컨설팅 보고서({year})"

    # ── Table 0: 상단 정보 ──
    # Row 0: [업체명(label), 업체명(value), 컨설팅실시일(label), 날짜(value)]
    # Row 1: [접수번호(label), 접수번호(value), 수행컨설턴트(label), 이름(value)]

    # 업체명 값 (row=0, col=1)
    cell = get_cell(tbl_info, 0, 1)
    if cell is not None:
        set_cell_text(cell, data.get("업체명", ""))

    # 컨설팅 실시일 값 (row=0, col=3)
    dates = data.get("컨설팅실시일", ["   /   ", "   /   ", "   /   "])
    date_str = " ,  ".join(dates)
    cell = get_cell(tbl_info, 0, 3)
    if cell is not None:
        set_cell_text(cell, date_str)

    # 접수번호 값 (row=1, col=1)
    cell = get_cell(tbl_info, 1, 1)
    if cell is not None:
        set_cell_text(cell, data.get("접수번호", ""))

    # 수행 컨설턴트 값 (row=1, col=3) - " (인) " 형식 유지
    cell = get_cell(tbl_info, 1, 3)
    if cell is not None:
        name = data.get("수행컨설턴트", "")
        set_cell_text(cell, f"{name} (인) ")

    # ── Table 1: 본문 내용 ──
    # Row 0: 헤더 (구 분, 세 부 내 용) - 수정하지 않음
    # Row 1-5: 내용 셀 (col=1만 교체)
    content_keys = [
        "사전조사_현황분석",       # Row 1
        "컨설팅목적_추진과제",     # Row 2
        "수행내역",               # Row 3
        "컨설팅결과_기대효과",     # Row 4
        "활용자료_제공자료",       # Row 5
    ]

    for i, key in enumerate(content_keys):
        row_idx = i + 1  # Row 0은 헤더
        cell = get_cell(tbl_content, row_idx, 1)  # col=1 (내용 셀)
        if cell is not None:
            items = data.get(key, [])
            replace_multiline_content(cell, items, prefix=" - ")

    # ── Table 2: 현장 사진 - 날짜만 교체 ──
    # Row 0: 헤더 (현장 사진) - 수정하지 않음
    # Row 1-3: 일차 셀 (col=0)의 날짜 부분만 교체
    dates_list = data.get("컨설팅실시일", ["  /  ", "  /  ", "  /  "])
    for day_idx in range(3):
        row_idx = day_idx + 1
        cell = get_cell(tbl_photo, row_idx, 0)
        if cell is not None:
            if day_idx < len(dates_list):
                date_val = dates_list[day_idx]
                parts = date_val.split("/")
                if len(parts) >= 2:
                    date_short = f"({parts[-2]}/{parts[-1]})"
                else:
                    date_short = f"({date_val})"
            else:
                date_short = "(  /  )"
            replace_day_date(cell, date_short)

    return tree


def main():
    parser = argparse.ArgumentParser(description="컨설팅 보고서 HWPX 생성 (참조 복원 방식)")
    parser.add_argument("--data", required=True, help="JSON 데이터 파일 경로")
    parser.add_argument("--output", required=True, help="출력 HWPX 파일 경로")
    args = parser.parse_args()

    # JSON 읽기
    with open(args.data, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"데이터 로드: {args.data}")
    print(f"  업체명: {data.get('업체명', '?')}")
    print(f"  연도: {data.get('year', '?')}")

    # 참조 파일 경로
    ref_header, ref_section = get_ref_paths()
    print(f"참조 header: {ref_header}")
    print(f"참조 section: {ref_section}")

    # ref_section.xml 파싱 & 텍스트 교체
    modified_tree = modify_section(ref_section, data)

    # 수정된 section0.xml을 임시 파일에 저장
    tmp_section = os.path.join(tempfile.gettempdir(), "consulting_section0_modified.xml")
    modified_tree.write(
        tmp_section,
        xml_declaration=True,
        encoding="UTF-8",
        standalone=True,
    )
    print(f"수정된 section0.xml: {tmp_section}")

    # build_hwpx.py로 빌드
    build_script = os.path.join(SKILL_DIR, "scripts", "build_hwpx.py")
    cmd = [
        "python", build_script,
        "--header", ref_header,
        "--section", tmp_section,
        "--output", args.output,
    ]
    print(f"빌드 명령: {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="cp949",
        errors="replace",
    )
    print("빌드 출력:", result.stdout)
    if result.stderr:
        print("빌드 경고:", result.stderr)

    if result.returncode != 0:
        print("빌드 실패!")
        sys.exit(1)

    # 검증
    validate_script = os.path.join(SKILL_DIR, "scripts", "validate.py")
    vresult = subprocess.run(
        ["python", validate_script, args.output],
        capture_output=True,
        text=True,
        encoding="cp949",
        errors="replace",
    )
    print("검증 결과:", vresult.stdout)
    if vresult.stderr:
        print("검증 경고:", vresult.stderr)

    if vresult.returncode != 0:
        print("검증 실패!")
        sys.exit(1)

    print(f"\n완료: {args.output}")


if __name__ == "__main__":
    main()
