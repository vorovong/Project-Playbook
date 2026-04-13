const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// ========== 스타일 헬퍼 ==========
const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text, bold: true, size: 44, font: "맑은 고딕" })] });
const subtitle = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, size: 24, font: "맑은 고딕", color: "555555" })] });
const h1 = (text) => new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 28, font: "맑은 고딕" })] });
const p = (text) => new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pBold = (text) => new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });
const pIndent = (text) => new Paragraph({ spacing: { after: 100, line: 360 }, indent: { left: 400 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pIndent2 = (text) => new Paragraph({ spacing: { after: 80, line: 360 }, indent: { left: 800 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const center = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const centerBold = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });

// ========== 표 헬퍼 ==========
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function makeTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2C3E50" },
    verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: cellBorders
  }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      verticalAlign: "center",
      children: [new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: 80 }, children: [new TextRun({ text: cell, size: 18, font: "맑은 고딕" })] })],
      borders: cellBorders
    }))
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: headerCells }), ...dataRows] });
}

// ========== 서명란 테이블 ==========
function makeSignTable() {
  const noBorder = { style: BorderStyle.NONE, size: 0 };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const bottomOnly = { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder };

  function labelCell(text) {
    return new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] })]
    });
  }
  function valueCell(text) {
    return new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      borders: bottomOnly,
      children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] })]
    });
  }
  function emptyCell() {
    return new TableCell({
      width: { size: 5, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [new Paragraph({ children: [] })]
    });
  }

  const rows = [
    ["", "갑 (위탁자)", "", "을 (수탁자)"],
    ["단체/회사명", "시민상가시장 상인회", "단체/회사명", "공존공간 주식회사"],
    ["대표자", "                    (인)", "대표자", "박승현            (인)"],
    ["주소", "경기도 수원시 팔달구", "주소", "경기도 수원시 팔달구"],
    ["연락처", "", "연락처", ""],
    ["사업자등록번호", "", "사업자등록번호", ""],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, i) => new TableRow({
      children: [
        i === 0 ? new TableCell({ borders: noBorders, children: [empty()] }) : labelCell(row[0]),
        i === 0 ? new TableCell({ borders: noBorders, children: [centerBold(row[1])] }) : valueCell(row[1]),
        emptyCell(),
        i === 0 ? new TableCell({ borders: noBorders, children: [empty()] }) : labelCell(row[2]),
        i === 0 ? new TableCell({ borders: noBorders, children: [centerBold(row[3])] }) : valueCell(row[3]),
      ]
    }))
  });
}

// ========== 문서 생성 (가계약서) ==========
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      // 표지
      empty(), empty(), empty(), empty(), empty(), empty(),
      title("과업 위탁 가계약서"),
      empty(),
      subtitle("시민상가시장 브랜드 개발 및 홍보 사업"),
      empty(),
      subtitle("(정부지원사업 선정을 조건으로 함)"),
      empty(), empty(), empty(), empty(), empty(), empty(), empty(), empty(), empty(),
      center("2026년    월    일"),
      empty(), empty(),
      centerBold("갑: 시민상가시장 상인회"),
      centerBold("을: 공존공간 주식회사"),

      // 본문
      empty(), empty(),
      p("시민상가시장 상인회(이하 \"갑\")와 공존공간 주식회사(이하 \"을\")는 갑이 신청한 「2026년도 상권활성화 전략적 마케팅 공모사업」의 선정을 조건으로, 브랜드 개발 및 홍보 사업의 과업 위탁에 관하여 다음과 같이 가계약을 체결한다."),
      empty(),

      // 제1조
      h1("제1조 (목적)"),
      p("본 가계약은 갑이 신청한 「2026년도 상권활성화 전략적 마케팅 공모사업」에 선정될 경우, 「시민상가시장 브랜드 개발 및 홍보 사업」의 세부 과업을 을에게 위탁하겠다는 갑의 의사와, 이를 수탁하여 성실히 수행하겠다는 을의 의사를 상호 확인함을 목적으로 한다."),
      empty(),

      // 제2조
      h1("제2조 (과업 범위)"),
      p("을이 수행하는 과업의 범위는 다음과 같다."),
      empty(),
      pBold("1. 브랜드 아이덴티티 개발"),
      pIndent("시민상가시장을 대표하는 캐릭터, 로고 등 브랜드 디자인 개발"),
      empty(),
      pBold("2. 홍보물 제작"),
      pIndent("포장디자인, 생활용품(에코백, 장바구니 등) 등 브랜드를 활용한 홍보물 기획 및 제작"),
      empty(),
      p("세부 과업 범위, 수량, 일정 등은 정부지원사업 선정 후 갑과 을이 협의하여 본계약에서 확정한다."),
      empty(),

      // 제3조
      h1("제3조 (을의 의무)"),
      pIndent("1. 을은 갑이 정부지원사업에 선정될 경우, 제2조의 과업을 성실히 수행한다."),
      pIndent("2. 을은 과업 수행 시 갑과 수시로 협의하며, 상인회의 의견을 수렴하여 진행한다."),
      pIndent("3. 을은 과업 수행 과정에서 알게 된 갑의 경영 정보를 제3자에게 누설하지 않는다. 본 의무는 가계약 종료 후 1년간 유효하다."),
      empty(),

      // 제4조
      h1("제4조 (갑의 의무)"),
      pIndent("1. 갑은 정부지원사업에 선정될 경우, 제2조의 과업을 을에게 위탁한다."),
      pIndent("2. 갑은 을의 과업 수행에 필요한 자료와 정보를 적시에 제공한다."),
      pIndent("3. 갑은 시안 선택, 방향 결정 등 의사결정 사항에 대해 을의 요청일로부터 7일 이내에 회신한다."),
      pIndent("4. 갑의 회신 지연 또는 자료 미제공으로 인해 을의 과업 수행에 지장이 생긴 경우, 그로 인한 일정 지연의 책임은 갑에게 있다."),
      empty(),

      // 제5조
      h1("제5조 (계약의 효력 및 본계약 체결)"),
      pIndent("1. 본 가계약은 갑이 정부지원사업에 선정된 경우에 한하여 효력이 발생한다."),
      pIndent("2. 갑이 선정되지 않은 경우, 본 가계약은 자동 소멸되며 갑과 을 어느 쪽에도 의무가 발생하지 않는다."),
      pIndent("3. 갑은 정부지원사업 선정일로부터 30일 이내에 을과 본계약을 체결한다. 정당한 사유 없이 본계약 체결이 이루어지지 않을 경우, 을이 기 투입한 실비를 갑이 부담한다."),
      pIndent("4. 본계약에서 과업 범위, 금액, 일정, 납품물, 저작권 등 세부 사항을 확정한다."),
      pIndent("5. 본 가계약의 유효기간은 체결일로부터 6개월로 한다. 유효기간 내 선정되지 않을 경우 본 가계약은 자동 소멸한다."),
      empty(),

      // 제6조
      h1("제6조 (분쟁 해결)"),
      p("본 가계약에 관한 분쟁은 갑과 을의 협의로 해결하며, 협의가 이루어지지 않을 경우 갑의 소재지를 관할하는 법원을 관할 법원으로 한다."),
      empty(),

      // 제7조
      h1("제7조 (기타)"),
      pIndent("1. 본 가계약에 명시되지 않은 사항은 갑과 을의 협의에 따른다."),
      pIndent("2. 본 가계약은 2부를 작성하여 갑과 을이 각 1부씩 보관한다."),
      empty(), empty(),

      // 날짜 + 서명란
      center("2026년    월    일"),
      empty(), empty(),
      makeSignTable(),
    ]
  }]
});

const outPath = process.argv[2] || "C:\\Users\\leeha\\OneDrive\\바탕 화면\\DB\\산출물\\시민상가시장\\과업위탁-계약서.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("생성 완료:", outPath);
});
