const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// ========== 스타일 헬퍼 ==========
const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, bold: true, size: 48, font: "맑은 고딕" })] });
const subtitle = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text, size: 24, font: "맑은 고딕", color: "666666" })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, font: "맑은 고딕" })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 26, font: "맑은 고딕" })] });
const p = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pBold = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });
const bullet = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });

// ========== 표 헬퍼 ==========
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const headerCell = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  shading: { type: ShadingType.SOLID, color: "2C3E50" },
  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 }, children: [new TextRun({ text, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })]
});

const cell = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  children: [new Paragraph({ spacing: { before: 50, after: 50 }, indent: { left: 100 }, children: [new TextRun({ text, size: 18, font: "맑은 고딕" })] })]
});

const cellBold = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  children: [new Paragraph({ spacing: { before: 50, after: 50 }, indent: { left: 100 }, children: [new TextRun({ text, bold: true, size: 18, font: "맑은 고딕" })] })]
});

const cellCenter = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 }, children: [new TextRun({ text, size: 18, font: "맑은 고딕" })] })]
});

// ========== 문서 내용 ==========
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
      }
    },
    children: [
      // === 표지 ===
      empty(), empty(), empty(), empty(),
      title("공존공간"),
      subtitle("임대 안내서"),
      empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "수원시 팔달구 창인동 89-3", size: 22, font: "맑은 고딕" })] }),
      empty(), empty(), empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "2026. 3.", size: 20, font: "맑은 고딕", color: "666666" })] }),

      // === 1. 건물 개요 ===
      empty(), empty(),
      h1("1. 건물 개요"),
      empty(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            headerCell("항목", 30),
            headerCell("내용", 70),
          ]}),
          new TableRow({ children: [
            cellBold("건물명", 30),
            cell("공존공간", 70),
          ]}),
          new TableRow({ children: [
            cellBold("소재지", 30),
            cell("수원시 팔달구 창인동 89-3", 70),
          ]}),
          new TableRow({ children: [
            cellBold("건물 용도", 30),
            cell("근린주택 (제2종 근린생활시설 + 일반음식점)", 70),
          ]}),
          new TableRow({ children: [
            cellBold("설계", 30),
            cell("건축사사무소 지오(GEO)", 70),
          ]}),
          new TableRow({ children: [
            cellBold("임대 가능 층", 30),
            cell("지하 1층, 지상 1층", 70),
          ]}),
        ]
      }),
      empty(),

      // === 2. 임대 공간 안내 ===
      h1("2. 임대 공간 안내"),

      h2("가. 지하 1층"),
      empty(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            headerCell("항목", 30),
            headerCell("내용", 70),
          ]}),
          new TableRow({ children: [
            cellBold("면적", 30),
            cell("약 45.9평 (전체)", 70),
          ]}),
          new TableRow({ children: [
            cellBold("보증금", 30),
            cell("1억 2,000만 원", 70),
          ]}),
          new TableRow({ children: [
            cellBold("월세", 30),
            cell("1,200만 원 (부가세 별도)", 70),
          ]}),
          new TableRow({ children: [
            cellBold("입주 시기", 30),
            cell("3개월 내 공실 예정 (별도 협의)", 70),
          ]}),
          new TableRow({ children: [
            cellBold("용도", 30),
            cell("제2종 근린생활시설 / 일반음식점", 70),
          ]}),
        ]
      }),
      empty(),

      h2("나. 지상 1층"),
      empty(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            headerCell("구분", 15),
            headerCell("면적", 20),
            headerCell("보증금", 25),
            headerCell("월세", 25),
            headerCell("입주 시기", 15),
          ]}),
          new TableRow({ children: [
            cellBold("전체", 15),
            cellCenter("약 40평", 20),
            cellCenter("8,500만 원", 25),
            cellCenter("850만 원", 25),
            cellCenter("즉시 가능", 15),
          ]}),
          new TableRow({ children: [
            cellBold("반쪽", 15),
            cellCenter("약 20평", 20),
            cellCenter("4,700만 원", 25),
            cellCenter("470만 원", 25),
            cellCenter("즉시 가능", 15),
          ]}),
        ]
      }),
      p("※ 모든 임대료는 부가세 별도"),
      empty(),

      // === 3. 입점 가능 업종 ===
      h1("3. 입점 가능 업종"),
      empty(),
      p("제2종 근린생활시설 및 일반음식점 용도에 해당하는 대부분의 업종이 입점 가능함."),
      empty(),
      pBold("입점 가능 업종 예시"),
      bullet("음식점 (한식, 양식, 일식, 카페 등)"),
      bullet("소매점 / 편의점"),
      bullet("사무실 / 공유 오피스"),
      bullet("학원 / 교육 시설"),
      bullet("미용실 / 네일샵"),
      bullet("기타 근린생활시설"),
      empty(),
      pBold("입점 불가 업종"),
      bullet("뽑기방"),
      bullet("포토부스"),
      bullet("유해 시설"),
      bullet("무인샵"),
      empty(),

      // === 4. 주차 안내 ===
      h1("4. 주차 안내"),
      empty(),
      p("주차 대수는 임차인과 별도 조율 가능함."),
      p("건물 인근 영화동에 사설 주차장이 있어 저렴하게 이용 가능함."),
      empty(),

      // === 5. 문의 ===
      h1("5. 문의"),
      empty(),
      p("임대 조건 및 현장 방문은 아래로 문의 바람."),
      empty(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            headerCell("항목", 30),
            headerCell("내용", 70),
          ]}),
          new TableRow({ children: [
            cellBold("담당", 30),
            cell("공존공간", 70),
          ]}),
          new TableRow({ children: [
            cellBold("연락처", 30),
            cell("[연락처 기입]", 70),
          ]}),
          new TableRow({ children: [
            cellBold("이메일", 30),
            cell("[이메일 기입]", 70),
          ]}),
        ]
      }),
      empty(), empty(),

      // === 하단 ===
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "— 끝 —", size: 20, font: "맑은 고딕", color: "999999" })]
      }),
    ]
  }]
});

// ========== 파일 생성 ==========
const OUTPUT = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\공존공간-임대안내서.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("완료:", OUTPUT);
});
