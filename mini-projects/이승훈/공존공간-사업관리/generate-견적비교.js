const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// 스타일 헬퍼
const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, bold: true, size: 40, font: "맑은 고딕" })] });
const subtitle = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text, size: 22, font: "맑은 고딕", color: "666666" })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 28, font: "맑은 고딕" })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 24, font: "맑은 고딕" })] });
const p = (text) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pBold = (text) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });
const bullet = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 80 }, children: [] });

// 표 헬퍼
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function makeTable(headers, rows, colWidths) {
  const headerCells = headers.map((h, i) => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2C3E50" },
    width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: allBorders
  }));

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      children: [new Paragraph({
        alignment: i >= 1 && !isNaN(cell.replace(/[,%원]/g, "")) ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: cell, size: 18, font: "맑은 고딕" })]
      })],
      borders: allBorders
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

// 강조 표 (추천 업체용)
function makeHighlightTable(headers, rows, highlightRowIdx) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2C3E50" },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: allBorders
  }));

  const dataRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      shading: rIdx === highlightRowIdx ? { type: ShadingType.SOLID, color: "E8F5E9" } : undefined,
      children: [new Paragraph({
        alignment: i >= 1 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({
          text: cell,
          bold: rIdx === highlightRowIdx,
          size: 18,
          font: "맑은 고딕",
          color: rIdx === highlightRowIdx ? "1B5E20" : "000000"
        })]
      })],
      borders: allBorders
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

// === 문서 생성 ===
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      // 표지
      empty(), empty(), empty(),
      title("공존공간 누수보수공사"),
      title("견적 비교 보고서"),
      empty(),
      subtitle("2026년 3월 26일"),
      subtitle("작성: 이승훈"),
      empty(), empty(), empty(),
      p("본 보고서는 공존공간 본관·별관 누수보수공사에 대해 3개 업체의 견적을 비교·분석한 자료임."),

      empty(), empty(),

      // 1. 공사 개요
      h1("1. 공사 개요"),
      empty(),
      makeTable(["항목", "내용"], [
        ["공사명", "공존공간 누수보수공사 (본관 + 별관)"],
        ["위치", "팔달구 화서문로 45번길 32"],
        ["주요 시공 내용", "우레탄 방수, 크랙보수, 관통부 보수, 외벽 페인트"],
        ["견적 접수 업체", "파파설비 / 제이엠 / 방수하다"],
        ["견적 접수일", "2026. 03. 17 ~ 03. 25"],
      ]),

      empty(),

      // 2. 총액 비교
      h1("2. 총액 비교 (VAT 포함 기준)"),
      empty(),
      p("※ 방수하다의 지하 창고 인젝션공사(250만원)는 다른 업체에 없는 별도 항목이므로 비교 대상에서 제외함."),
      empty(),
      makeHighlightTable(
        ["업체", "금액 (VAT 별도)", "VAT", "합계 (VAT 포함)", "비고"],
        [
          ["파파설비", "4,818,182원", "481,818원", "5,300,000원", "2건 합산 (견적 분리)"],
          ["방수하다", "5,210,000원", "521,000원", "5,731,000원", "인젝션 250만 제외"],
          ["제이엠", "5,940,000원", "594,000원", "6,534,000원", ""],
        ],
        0  // 파파설비 행 강조
      ),
      empty(),
      pBold("최저가: 파파설비 5,300,000원 (VAT 포함)"),
      p("방수하다 대비 431,000원 저렴 (7.5% 차이)"),
      p("제이엠 대비 1,234,000원 저렴 (18.9% 차이)"),

      empty(),

      // 3. 업체별 상세
      h1("3. 업체별 견적 상세"),

      // 파파설비
      h2("3-1. 파파설비"),
      p("사업자등록번호: 144-21-02185 / 담당: 이상일 / 010-7479-1252"),
      empty(),
      pBold("견적 ① — 본관 바닥방수 + 크랙보수 (2,330,000원, VAT 포함)"),
      makeTable(["NO", "항목", "수량", "금액"], [
        ["1", "화도 (프라이머)", "1", "200,000"],
        ["2", "몰도 (우레탄방수)", "2", "400,000"],
        ["3", "몰도 (우레탄코팅)", "1", "150,000"],
        ["4", "1관통부 및 실리콘", "1", "150,000"],
        ["5", "몰탈 및 부자재", "1", "100,000"],
        ["6", "미장", "2", "700,000"],
        ["7", "조공", "1", "200,000"],
        ["8", "폐기물", "1", "100,000"],
        ["", "소계", "", "2,100,000"],
        ["", "부가세", "", "210,000"],
        ["", "합계", "", "2,330,000 (세금계산서 발행)"],
      ]),
      empty(),
      p("시공내용: 공존공간 3,4층 바닥방수 / 4층 1년 외관관통부 및 벽체 크랙보수"),
      p("하자보수기간: 1년"),
      empty(),

      pBold("견적 ② — 별관 발코니방수 + 크랙보수 + 페인트 (2,970,000원, VAT 포함)"),
      makeTable(["NO", "항목", "수량", "금액"], [
        ["1", "화도 (프라이머)", "1", "200,000"],
        ["2", "몰도 (우레탄방수)", "2", "400,000"],
        ["3", "몰도 (우레탄코팅)", "1", "400,000"],
        ["4", "관통 크랙보수작업", "1", "400,000"],
        ["5", "바닥 크라우레탄도장", "1", "250,000"],
        ["6", "미장보수작업", "1", "250,000"],
        ["7", "부자재", "-", "-"],
        ["8", "기공", "1", "-"],
        ["9", "조공", "-", "-"],
        ["10", "폐기물", "1", "-"],
        ["", "소계", "", "2,700,000"],
        ["", "부가세", "", "270,000"],
        ["", "합계", "", "2,970,000 (세금계산서 발행)"],
      ]),
      empty(),
      p("시공내용: 공존공간 발코니 바닥방수, 크랙보수 및 페인트 재도장"),
      p("시공소요기간: 2일 / 하자보수기간: 1년"),
      empty(),
      pBold("파파설비 합산: 5,300,000원 (VAT 포함)"),

      empty(),

      // 제이엠
      h2("3-2. 제이엠"),
      p("견적일: 2026. 03. 25 / 수신: 박이쁜민지님 귀하 (공존공간)"),
      empty(),
      makeTable(["항목", "소계"], [
        ["A. 주차장 진출 2층 블로어타지, 방탈곡, 수시물량", "1,800,000"],
        ["B. 추가 시공 항목", "2,450,000"],
        ["C. 다용관통부 역방지 방탈곡", "1,300,000"],
        ["D. 비보라인, 탈곡", "390,000"],
        ["합계 (VAT 별도)", "5,940,000"],
        ["VAT (10%)", "594,000"],
        ["합계 (VAT 포함)", "6,534,000"],
      ]),
      empty(),
      p("※ 견적서 이미지 해상도 한계로 세부 수량·단가는 일부 미확인"),

      empty(),

      // 방수하다
      h2("3-3. 방수하다"),
      p("경기도 안산시 상록구 안산천서로 241 / 010-4187-0099 / 사업자: 795-43-01157"),
      empty(),
      makeTable(["구분", "NO", "항목", "금액"], [
        ["본관", "1", "우레탄 방수 공사", "640,000"],
        ["본관", "2", "인건비", "1,120,000"],
        ["지하창고", "-", "인젝션공사 (비교 제외)", "2,500,000"],
        ["별관", "1", "쓰레기 처리비용", "500,000"],
        ["별관", "2", "스카이 장비", "400,000"],
        ["별관", "3", "외벽 부분 페인트 공사", "600,000"],
        ["별관", "4", "우레탄 방수공사", "830,000"],
        ["별관", "5", "인건비", "1,120,000"],
        ["", "", "총 금액 (VAT 별도)", "7,710,000"],
        ["", "", "인젝션 제외 금액 (VAT 별도)", "5,210,000"],
        ["", "", "인젝션 제외 (VAT 포함)", "5,731,000"],
      ]),
      empty(),
      p("결제조건: 계약금 20%, 중도금 0%, 잔금 80%"),
      p("타공사는 별도 협의하에 진행"),

      empty(),

      // 4. 비교 분석
      h1("4. 비교 분석"),
      empty(),
      makeTable(["비교 항목", "파파설비", "제이엠", "방수하다"], [
        ["총액 (VAT 포함)", "5,300,000", "6,534,000", "5,731,000"],
        ["최저가 대비", "기준 (최저)", "+1,234,000 (+23.3%)", "+431,000 (+8.1%)"],
        ["VAT", "포함", "별도", "별도"],
        ["견적 구분", "본관/별관 분리", "통합", "본관/별관/지하 분리"],
        ["하자보수", "1년", "확인 필요", "미기재"],
        ["시공기간", "2일 (별관 기준)", "확인 필요", "미기재"],
        ["세금계산서", "발행", "확인 필요", "확인 필요"],
        ["결제조건", "미기재", "미기재", "계약금 20% / 잔금 80%"],
        ["별도 장비비", "없음 (포함)", "확인 필요", "스카이 장비 40만 별도 기재"],
        ["폐기물 처리", "포함", "확인 필요", "쓰레기 처리 50만 별도 기재"],
      ]),

      empty(),

      // 5. 종합 의견
      h1("5. 종합 의견"),
      empty(),
      pBold("가격 기준 순위: ① 파파설비 → ② 방수하다 → ③ 제이엠"),
      empty(),
      p("1. 파파설비가 최저가(530만원)이며, 항목이 가장 구체적으로 분리되어 있음"),
      p("2. 하자보수기간 1년 명시, 세금계산서 발행 확인됨"),
      p("3. 방수하다는 파파설비 대비 43만원(8.1%) 높으나, 스카이 장비·쓰레기 처리를 별도 항목으로 명시해 투명성 있음"),
      p("4. 제이엠은 최고가(653만원)이며, 견적서 세부 항목 확인이 추가로 필요함"),
      empty(),
      pBold("계약 전 확인 사항:"),
      bullet("제이엠: 하자보수기간, 세금계산서 발행 여부, 세부 항목별 단가 재확인"),
      bullet("방수하다: 하자보수기간 별도 확인 (견적서에 미기재)"),
      bullet("공통: 시공 일정 조율, 우천 시 대응 방안"),
      empty(),
      p("※ 지하 창고 인젝션공사는 방수하다만 견적에 포함(250만원). 인젝션이 필요한 경우 방수하다에 별도 협의하거나, 파파설비·제이엠에 추가 견적을 받아 비교할 것을 권함."),
    ]
  }]
});

// 저장
const outputPath = "C:/Users/leeha/OneDrive/바탕 화면/공존공간-견적비교-누수보수공사.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ 저장 완료:", outputPath);
});
