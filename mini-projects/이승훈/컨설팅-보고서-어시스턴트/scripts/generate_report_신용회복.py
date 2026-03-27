#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
신용회복위원회 맞춤형 컨설팅 진단/수행결과 보고서 HWPX 생성 스크립트

참조 복원 방식: 원본 HWPX에서 추출한 ref_section_신용회복.xml을 복사한 후,
텍스트 내용(hp:t)만 사용자 데이터로 교체하여 빌드합니다.

사용법:
  python generate_report_신용회복.py --data data.json --output 보고서.hwpx
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
    header = os.path.join(TEMPLATE_DIR, "ref_header_신용회복.xml")
    section = os.path.join(TEMPLATE_DIR, "ref_section_신용회복.xml")
    if not os.path.exists(header):
        raise FileNotFoundError(f"ref_header_신용회복.xml not found: {header}")
    if not os.path.exists(section):
        raise FileNotFoundError(f"ref_section_신용회복.xml not found: {section}")
    return header, section


def find_tables(root):
    return root.findall(".//hp:tbl", NS)


def get_cell(table, row_idx, col_idx):
    rows = table.findall(".//hp:tr", NS)
    if row_idx >= len(rows):
        return None
    cells = rows[row_idx].findall("hp:tc", NS)
    if col_idx >= len(cells):
        return None
    return cells[col_idx]


def get_sublist(cell):
    if cell is None:
        return None
    return cell.find(".//hp:subList", NS)


def set_cell_text(cell, text):
    """셀 내 첫 번째 hp:t 요소의 텍스트를 교체한다."""
    sl = get_sublist(cell)
    if sl is None:
        return
    paras = sl.findall("hp:p", NS)
    if not paras:
        return
    p = paras[0]
    runs = p.findall("hp:run", NS)
    if not runs:
        return
    t_el = runs[0].find("hp:t", NS)
    if t_el is not None:
        t_el.text = text
    else:
        t_el = etree.SubElement(
            runs[0], "{http://www.hancom.co.kr/hwpml/2011/paragraph}t"
        )
        t_el.text = text
    # 추가 run 제거
    for r in runs[1:]:
        p.remove(r)


def replace_multiline_content(cell, lines, prefix=" □ "):
    """셀 내 hp:subList의 paragraph들을 교체한다."""
    sl = get_sublist(cell)
    if sl is None:
        return

    paras = sl.findall("hp:p", NS)
    if not paras:
        return

    template_p = paras[0]
    template_attribs = dict(template_p.attrib)

    template_runs = template_p.findall("hp:run", NS)
    char_pr = "0"
    if template_runs:
        char_pr = template_runs[0].get("charPrIDRef", "0")

    for p in paras:
        sl.remove(p)

    if not lines:
        lines = [""]

    for line_text in lines:
        new_p = etree.SubElement(sl, "{http://www.hancom.co.kr/hwpml/2011/paragraph}p")
        for k, v in template_attribs.items():
            if k == "id":
                new_p.set(k, "2147483648")
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


def modify_section(section_path, data):
    """ref_section_신용회복.xml을 파싱하고 데이터로 텍스트를 교체한다.

    신용회복위원회 양식 구조 (13 tables):
    Page 1 - 진단 보고서:
      Table 0: 제목 (붙임1 + 맞춤형 컨설팅 진단 보고서)
      Table 1: 부제
      Table 2: 기본정보 + 사업현황 + 사진 + 애로사항 (7 rows)
      Table 3: 컨설팅 내용 + 향후 계획 (5 rows)
      Table 4: 서명란
    Page 2 - 수행결과 보고서:
      Table 5: 제목 (붙임2 + 맞춤형 컨설팅 수행결과 보고서)
      Table 6: 부제
      Table 7: 기본정보 (4 rows)
      Table 8: 컨설팅 수행내용
      Table 9: 개선 전/후
      Table 10: 개선 필요사항
      Table 11: 빈 셀
      Table 12: 서명란
    """
    tree = etree.parse(section_path)
    root = tree.getroot()

    tables = find_tables(root)
    if len(tables) < 13:
        raise ValueError(f"Expected 13 tables, found {len(tables)}")

    # === Page 1: 진단 보고서 ===
    tbl_info1 = tables[2]   # 기본정보 + 사업현황 + 애로사항
    tbl_consult = tables[3]  # 컨설팅 내용 + 향후 계획

    # Table 2 Row 0: 신청자 성명(col1), 컨설턴트 성명(col3)
    cell = get_cell(tbl_info1, 0, 1)
    if cell is not None:
        set_cell_text(cell, data.get("신청자성명", ""))
    cell = get_cell(tbl_info1, 0, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설턴트성명", ""))

    # Table 2 Row 1: 컨설팅 일자(col1), 컨설팅 유형(col3)
    cell = get_cell(tbl_info1, 1, 1)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅일자_1회차", ""))
    cell = get_cell(tbl_info1, 1, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅유형", "경영안정 컨설팅"))

    # Table 2 Row 2: 컨설팅 회차(col1), 컨설팅 시간(col3)
    cell = get_cell(tbl_info1, 2, 1)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅회차_1", "1회차"))
    cell = get_cell(tbl_info1, 2, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅시간_1", ""))

    # Table 2 Row 3: 업체명(col1), 업종(col3)
    cell = get_cell(tbl_info1, 3, 1)
    if cell is not None:
        set_cell_text(cell, data.get("업체명", ""))
    cell = get_cell(tbl_info1, 3, 3)
    if cell is not None:
        set_cell_text(cell, data.get("업종", ""))

    # Table 2 Row 4: 사업 현황 (col1 = label, col1 = content) - 2 cells
    cell = get_cell(tbl_info1, 4, 1)
    if cell is not None:
        items = data.get("사업현황", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    # Table 2 Row 6: 신청인 애로사항 및 요구사항 (col1)
    cell = get_cell(tbl_info1, 6, 1)
    if cell is not None:
        items = data.get("애로사항_요구사항", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    # Table 3 Row 0: 컨설팅 내용 (col1)
    cell = get_cell(tbl_consult, 0, 1)
    if cell is not None:
        items = data.get("컨설팅내용_1회차", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    # Table 3 Row 2: 향후 컨설팅 일자(col0), 시간(col1)
    cell = get_cell(tbl_consult, 2, 0)
    if cell is not None:
        set_cell_text(cell, data.get("향후컨설팅일자", ""))
    cell = get_cell(tbl_consult, 2, 1)
    if cell is not None:
        set_cell_text(cell, data.get("향후컨설팅시간", ""))

    # Table 3 Row 4: 향후 컨설팅 내용 (col0, 1 cell)
    cell = get_cell(tbl_consult, 4, 0)
    if cell is not None:
        items = data.get("향후컨설팅내용", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    # === Page 2: 수행결과 보고서 ===
    tbl_info2 = tables[7]   # 기본정보 2회차
    tbl_perform = tables[8]  # 컨설팅 수행내용
    tbl_improve = tables[9]  # 개선 전/후

    # Table 7 Row 0: 신청자 성명(col1), 컨설턴트 성명(col3)
    cell = get_cell(tbl_info2, 0, 1)
    if cell is not None:
        set_cell_text(cell, data.get("신청자성명", ""))
    cell = get_cell(tbl_info2, 0, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설턴트성명", ""))

    # Table 7 Row 1: 컨설팅 일자(col1), 컨설팅 유형(col3)
    cell = get_cell(tbl_info2, 1, 1)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅일자_2회차", ""))
    cell = get_cell(tbl_info2, 1, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅유형", "경영안정 컨설팅"))

    # Table 7 Row 2: 컨설팅 회차(col1), 컨설팅 시간(col3)
    cell = get_cell(tbl_info2, 2, 1)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅회차_2", "2회차"))
    cell = get_cell(tbl_info2, 2, 3)
    if cell is not None:
        set_cell_text(cell, data.get("컨설팅시간_2", ""))

    # Table 7 Row 3: 업체명(col1), 업종(col3)
    cell = get_cell(tbl_info2, 3, 1)
    if cell is not None:
        set_cell_text(cell, data.get("업체명", ""))
    cell = get_cell(tbl_info2, 3, 3)
    if cell is not None:
        set_cell_text(cell, data.get("업종", ""))

    # Table 8 Row 0: 컨설팅 수행내용 (col0, 1 cell)
    cell = get_cell(tbl_perform, 0, 0)
    if cell is not None:
        items = data.get("컨설팅수행내용", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    # Table 9: 개선 전/후
    # Row 1: 개선 전(col0), 개선 후(col1)
    cell = get_cell(tbl_improve, 1, 0)
    if cell is not None:
        items = data.get("개선전", [])
        replace_multiline_content(cell, items, prefix=" □ ")
    cell = get_cell(tbl_improve, 1, 1)
    if cell is not None:
        items = data.get("개선후", [])
        replace_multiline_content(cell, items, prefix=" □ ")

    return tree


def main():
    parser = argparse.ArgumentParser(description="신용회복위원회 컨설팅 보고서 HWPX 생성")
    parser.add_argument("--data", required=True, help="JSON 데이터 파일 경로")
    parser.add_argument("--output", required=True, help="출력 HWPX 파일 경로")
    args = parser.parse_args()

    with open(args.data, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"데이터 로드: {args.data}")
    print(f"  업체명: {data.get('업체명', '?')}")

    ref_header, ref_section = get_ref_paths()
    print(f"참조 header: {ref_header}")
    print(f"참조 section: {ref_section}")

    modified_tree = modify_section(ref_section, data)

    tmp_section = os.path.join(tempfile.gettempdir(), "신용회복_section0_modified.xml")
    modified_tree.write(
        tmp_section,
        xml_declaration=True,
        encoding="UTF-8",
        standalone=True,
    )
    print(f"수정된 section0.xml: {tmp_section}")

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
