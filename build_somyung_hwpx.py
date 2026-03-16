#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""소명서(비욘드상상) HWPX 생성 스크립트"""

import subprocess, sys, os

SKILL_DIR = os.path.expanduser("~/.claude/skills/hwpx")

# section0.xml 내용 작성
section_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
section_xml += '<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">\n'

# secPr 첫 문단 (gonmun 템플릿에서 복사)
section_xml += '''  <hp:p id="1000000001" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="0">
      <hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0">
        <hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/>
        <hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>
        <hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/>
        <hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>
        <hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY">
          <hp:margin header="4252" footer="4252" gutter="0" left="8504" right="8504" top="5668" bottom="4252"/>
        </hp:pagePr>
        <hp:footNotePr>
          <hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>
          <hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/>
          <hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/>
          <hp:numbering type="CONTINUOUS" newNum="1"/>
          <hp:placement place="EACH_COLUMN" beneathText="0"/>
        </hp:footNotePr>
        <hp:endNotePr>
          <hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>
          <hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/>
          <hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/>
          <hp:numbering type="CONTINUOUS" newNum="1"/>
          <hp:placement place="END_OF_DOCUMENT" beneathText="0"/>
        </hp:endNotePr>
        <hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">
          <hp:offset left="1417" right="1417" top="1417" bottom="1417"/>
        </hp:pageBorderFill>
        <hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">
          <hp:offset left="1417" right="1417" top="1417" bottom="1417"/>
        </hp:pageBorderFill>
        <hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">
          <hp:offset left="1417" right="1417" top="1417" bottom="1417"/>
        </hp:pageBorderFill>
      </hp:secPr>
      <hp:ctrl>
        <hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/>
      </hp:ctrl>
    </hp:run>
    <hp:run charPrIDRef="0">
      <hp:t/>
    </hp:run>
    <hp:linesegarray>
      <hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="42520" flags="393216"/>
    </hp:linesegarray>
  </hp:p>
'''

# Helper functions
pid = 2

def empty():
    global pid
    p_id = f"1{pid:09d}"
    pid += 1
    return f'  <hp:p id="{p_id}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">\n    <hp:run charPrIDRef="0"><hp:t/></hp:run>\n  </hp:p>\n'

def para(text, charPr="0", paraPr="0"):
    global pid
    p_id = f"1{pid:09d}"
    pid += 1
    return f'  <hp:p id="{p_id}" paraPrIDRef="{paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">\n    <hp:run charPrIDRef="{charPr}">\n      <hp:t>{text}</hp:t>\n    </hp:run>\n  </hp:p>\n'

# 빈줄
section_xml += empty()

# 제목: 소 명 서 (center, bold 22pt = charPr 7, paraPr 20 = center)
section_xml += para("\uc18c \uba85 \uc11c", charPr="7", paraPr="20")

# 빈줄
section_xml += empty()

# 수신/제목/작성일
section_xml += para("\uc218\uc2e0 : \uc218\uc6d0\ub3c4\uc2dc\uc7ac\ub2e8")
section_xml += para("\uc81c\ubaa9 : \uce74\uba54\ub77c \uc7a5\ube44 \uc784\ub300\ucc28 \uacc4\uc57d \uad00\ub828 \uc5c5\uc885 \ubbf8\ub4f1\ub85d \uc18c\uba85")
section_xml += para("\uc791\uc131\uc77c : 2026\ub144 3\uc6d4 12\uc77c")

# 빈줄
section_xml += empty()

# 인사
section_xml += para("\uc548\ub155\ud558\uc2ed\ub2c8\uae4c, \ube44\uc6d0\ub4dc\uc0c1\uc0c1 \ub300\ud45c \ud55c\uc2b9\uc5f0\uc785\ub2c8\ub2e4.")

# 본문 첫 단락
section_xml += para("2025\ub144 6\uc6d4 1\uc77c (\uc8fc)\uacf5\uc874\uacf5\uac04 \uae00\ub85c\uceec \uc0c1\uad8c \ucc3d\ucd9c\ud300\uacfc \uccb4\uacb0\ud55c \uce74\uba54\ub77c \uc7a5\ube44 \uc784\ub300\ucc28 \uacc4\uc57d(\ucd1d 4,950,000\uc6d0, VAT \ud3ec\ud568)\uacfc \uad00\ub828\ud558\uc5ec, \uacc4\uc57d \ub2f9\uc2dc \ub2f9\uc0ac \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d\uc5d0 \uc784\ub300\uc5c5 \uad00\ub828 \uc5c5\uc885\uc774 \ub4f1\ub85d\ub418\uc5b4 \uc788\uc9c0 \uc54a\uc558\ub358 \ubd80\ubd84\uc5d0 \ub300\ud574 \uc544\ub798\uc640 \uac19\uc774 \uc18c\uba85\ub4dc\ub9bd\ub2c8\ub2e4.")

section_xml += empty()

# 1. 경위 (bold = charPr 10)
section_xml += para("1. \uacbd\uc704", charPr="10")
section_xml += empty()
section_xml += para("\ub2f9\uc0ac\ub294 2022\ub144\ubd80\ud130 \uad11\uace0 \uc601\uc0c1 \uc81c\uc791\uacfc \uc2dc\uac01 \ub514\uc790\uc778\uc744 \uc8fc\ub41c \uc0ac\uc5c5\uc73c\ub85c \uc6b4\uc601\ud574 \uc628 \uc5c5\uccb4\uc785\ub2c8\ub2e4. \uce74\uba54\ub77c \uc7a5\ube44\ub294 \uc601\uc0c1 \uc81c\uc791 \uc5c5\ubb34\ub97c \uc704\ud574 \ubcf4\uc720\ud558\uace0 \uc788\ub358 \uc790\uc0b0\uc774\uba70, (\uc8fc)\uacf5\uc874\uacf5\uac04\uc758 \uc0ac\uc5c5 \uc218\ud589\uc5d0 \uc7a5\ube44\uac00 \ud544\uc694\ud558\uc5ec \ub2f9\uc0ac \ubcf4\uc720 \uc7a5\ube44\ub97c \uc81c\uacf5\ud558\uac8c \ub418\uc5c8\uc2b5\ub2c8\ub2e4.")
section_xml += para("\uadf8 \uacfc\uc815\uc5d0\uc11c \uc7a5\ube44\ub97c \uc784\ub300\ud560 \uacbd\uc6b0 \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d\uc5d0 \ubcc4\ub3c4\uc758 \uc784\ub300\uc5c5 \uc5c5\uc885\uc744 \ub4f1\ub85d\ud574\uc57c \ud55c\ub2e4\ub294 \uc810\uc744 \uc54c\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc601\uc0c1 \uc81c\uc791\uc774 \uc8fc\ub41c \uc0ac\uc5c5\uc774\ub2e4 \ubcf4\ub2c8 \uc7a5\ube44 \uc81c\uacf5\uc5d0 \ubcc4\ub3c4 \uc5c5\uc885\uc774 \ud544\uc694\ud558\ub2e4\ub294 \ud589\uc815 \uc694\uac74\uae4c\uc9c0\ub294 \ud655\uc778\ud558\uc9c0 \ubabb\ud55c \uac83\uc774 \uc194\uc9c1\ud55c \uacbd\uc704\uc785\ub2c8\ub2e4.")

section_xml += empty()

# 2. 거래 처리 내역
section_xml += para("2. \uac70\ub798 \ucc98\ub9ac \ub0b4\uc5ed", charPr="10")
section_xml += empty()
section_xml += para("\uc5c5\uc885 \ub4f1\ub85d\uc774 \ub204\ub77d\ub41c \ubd80\ubd84\uc740 \ub2f9\uc0ac\uc758 \uacfc\uc2e4\uc774 \ub9de\uc73c\ub098, \uac70\ub798 \uc790\uccb4\ub294 \uc815\uc0c1\uc801\uc73c\ub85c \uc774\ub8e8\uc5b4\uc84c\uc74c\uc744 \ub9d0\uc500\ub4dc\ub9bd\ub2c8\ub2e4.")
section_xml += para("  - \uc784\ub300\ucc28 \uacc4\uc57d\uc11c : 2025\ub144 6\uc6d4 1\uc77c \uc815\uc2dd \uccb4\uacb0")
section_xml += para("  - \uc138\uae08\uacc4\uc0b0\uc11c : \uc801\uaca9 \uc138\uae08\uacc4\uc0b0\uc11c \uc815\uc0c1 \ubc1c\ud589")
section_xml += para("  - \ub300\uae08 \uc218\ub839 : \uacc4\uc88c\uc774\uccb4\ub97c \ud1b5\ud574 \uc815\uc0c1 \uc218\ub839")
section_xml += para("  - \ubd80\uac00\uc138 \uc2e0\uace0 : \ub2f9\uc0ac \ub9e4\ucd9c\ub85c \uc815\uc0c1 \uc2e0\uace0 \ubc0f \ub0a9\ubd80 \uc644\ub8cc")
section_xml += empty()
section_xml += para("\uacc4\uc57d \uccb4\uacb0\ubd80\ud130 \ub300\uae08 \uc218\ub839, \uc138\ubb34 \ucc98\ub9ac\uae4c\uc9c0 \ubaa8\ub4e0 \uacfc\uc815\uc774 \uc815\uc0c1\uc801\uc73c\ub85c \uc644\ub8cc\ub41c \uc2e4\uac70\ub798\uc785\ub2c8\ub2e4.")

section_xml += empty()

# 3. 시정 조치
section_xml += para("3. \uc2dc\uc815 \uc870\uce58", charPr="10")
section_xml += empty()
section_xml += para("\ud574\ub2f9 \uc0ac\uc2e4\uc744 \uc778\uc9c0\ud55c \ud6c4 \uc989\uc2dc \uad00\ud560 \uc138\ubb34\uc11c\uc5d0 \uc5c5\uc885 \ucd94\uac00\ub97c \uc2e0\uccad\ud558\uc600\uc73c\uba70, 2026\ub144 3\uc6d4 10\uc77c\uc790\ub85c \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d\uc5d0 \"\uc0ac\uc5c5\uc2dc\uc124 \uad00\ub9ac, \uc0ac\uc5c5\uc9c0\uc6d0 \ubc0f \uc784\ub300\uc11c\ube44\uc2a4\uc5c5(\uc5c5\ud0dc)\" \ubc0f \"\uae30\ud0c0 \uc0b0\uc5c5\uc6a9 \uae30\uacc4 \ubc0f \uc7a5\ube44 \uc784\ub300\uc5c5(\uc885\ubaa9)\"\uc744 \ucd94\uac00 \ub4f1\ub85d \uc644\ub8cc\ud558\uc600\uc2b5\ub2c8\ub2e4.")

section_xml += empty()

# 4. 첨부 서류
section_xml += para("4. \ucca8\ubd80 \uc11c\ub958", charPr="10")
section_xml += empty()
section_xml += para("  1) \ubcc0\uacbd \uc804 \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d \uc0ac\ubcf8 1\ubd80 (2025.08.26 \ubc1c\uae09)")
section_xml += para("  2) \ubcc0\uacbd \ud6c4 \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d \uc0ac\ubcf8 1\ubd80 (2026.03.10 \ubc1c\uae09)")
section_xml += para("  3) \uce74\uba54\ub77c \uc7a5\ube44 \uc784\ub300\ucc28 \uacc4\uc57d\uc11c \uc0ac\ubcf8 1\ubd80")
section_xml += para("  4) \uc138\uae08\uacc4\uc0b0\uc11c \uc0ac\ubcf8 1\ubd80")

section_xml += empty()

# 마무리
section_xml += para("\ud589\uc815 \uc808\ucc28\ub97c \ubbf8\ucc98 \ud655\uc778\ud558\uc9c0 \ubabb\ud55c \uc810 \uae4a\uc774 \ubc18\uc131\ud558\uba70, \ud5a5\ud6c4 \uc774\ub7ec\ud55c \uc77c\uc774 \uc7ac\ubc1c\ud558\uc9c0 \uc54a\ub3c4\ub85d \ud558\uaca0\uc2b5\ub2c8\ub2e4. \uac80\ud1a0\ud558\uc5ec \uc8fc\uc2dc\uba74 \uac10\uc0ac\ud558\uaca0\uc2b5\ub2c8\ub2e4.")

section_xml += empty()
section_xml += empty()

# 날짜 + 서명 (center)
section_xml += para("2026\ub144 3\uc6d4 12\uc77c", paraPr="20")
section_xml += para("\ube44\uc6d0\ub4dc\uc0c1\uc0c1 \ub300\ud45c  \ud55c\uc2b9\uc5f0  (\uc778)", charPr="8", paraPr="20")

section_xml += '</hs:sec>\n'

# 파일 저장
import tempfile
section_path = os.path.join(tempfile.gettempdir(), "somyung_section0.xml")
with open(section_path, "w", encoding="utf-8") as f:
    f.write(section_xml)

print(f"section0.xml saved to {section_path}")
print(f"File size: {os.path.getsize(section_path)} bytes")

# 출력 경로
output_path = os.path.join(os.path.expanduser("~"), "OneDrive", "\ubc14\ud0d5 \ud654\uba74", "\uc18c\uba85\uc11c_\ube44\uc6d4\ub4dc\uc0c1\uc0c1_\uc5c5\uc885\ubbf8\ub4f1\ub85d.hwpx")

# build
build_script = os.path.join(SKILL_DIR, "scripts", "build_hwpx.py")
result = subprocess.run(
    ["python", build_script, "--template", "gonmun", "--section", section_path, "--output", output_path],
    capture_output=True, text=True, encoding="utf-8"
)
print("BUILD STDOUT:", result.stdout)
if result.stderr:
    print("BUILD STDERR:", result.stderr)
print("BUILD RC:", result.returncode)

if result.returncode == 0:
    # validate
    validate_script = os.path.join(SKILL_DIR, "scripts", "validate.py")
    vresult = subprocess.run(
        ["python", validate_script, output_path],
        capture_output=True, text=True, encoding="utf-8"
    )
    print("VALIDATE STDOUT:", vresult.stdout)
    if vresult.stderr:
        print("VALIDATE STDERR:", vresult.stderr)
