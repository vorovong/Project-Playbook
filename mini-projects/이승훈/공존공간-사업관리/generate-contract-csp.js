const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// ========== 스타일 헬퍼 ==========
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const bottomOnly = { top: noBorder, bottom: thinBorder, left: noBorder, right: noBorder };

const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 600 }, children: [new TextRun({ text, bold: true, size: 44, font: "맑은 고딕" })] });
const p = (text, opts = {}) => new Paragraph({ spacing: { after: 160, line: 380 }, indent: opts.indent ? { left: opts.indent } : undefined, children: [new TextRun({ text, size: 22, font: "맑은 고딕", ...opts })] });
const pMulti = (runs, opts = {}) => new Paragraph({ spacing: { after: 160, line: 380 }, indent: opts.indent ? { left: opts.indent } : undefined, children: runs.map(r => typeof r === "string" ? new TextRun({ text: r, size: 22, font: "맑은 고딕" }) : new TextRun({ size: 22, font: "맑은 고딕", ...r })) });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const center = (text, opts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, size: 22, font: "맑은 고딕", ...opts })] });

// ========== 당사자 정보 테이블 ==========
function makePartyTable() {
  function cell(text, opts = {}) {
    return new TableCell({
      verticalAlign: "center",
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      borders: cellBorders,
      shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
      children: [new Paragraph({
        alignment: opts.align || AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, size: 20, font: "맑은 고딕", bold: opts.bold })]
      })]
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        cell("임 대 인", { bold: true, width: 12 }),
        cell("이름", { width: 12 }),
        cell("㈜공존공간", { width: 20 }),
        cell("주  소", { width: 8 }),
        cell("경기도 수원시 팔달구 화서문로 45번길 32, 3층 공존공간", { width: 48, align: AlignmentType.LEFT }),
      ]}),
      new TableRow({ children: [
        cell("", { width: 12 }),
        cell("사업자등록번호", { width: 12 }),
        cell("124-87-33486", { width: 20 }),
        cell("", { width: 8 }),
        cell("", { width: 48 }),
      ]}),
      new TableRow({ children: [
        cell("임 차 인", { bold: true, width: 12 }),
        cell("이름", { width: 12 }),
        cell("씨에스피 주식회사", { width: 20 }),
        cell("주  소", { width: 8 }),
        cell("전북특별자치도 전주시 완산구 현무1길 33, 2층 라운지디 (경원동3가, 지당빌딩)", { width: 48, align: AlignmentType.LEFT }),
      ]}),
      new TableRow({ children: [
        cell("", { width: 12 }),
        cell("사업자등록번호", { width: 12 }),
        cell("337-87-03633", { width: 20 }),
        cell("", { width: 8 }),
        cell("", { width: 48 }),
      ]}),
    ]
  });
}

// ========== 서명란 ==========
function makeSignSection() {
  return [
    new Paragraph({ spacing: { before: 100, after: 80 }, children: [new TextRun({ text: "임 대 인", bold: true, size: 22, font: "맑은 고딕", underline: {} })] }),
    p("성    명 : ㈜공존공간 대표 박승현    (인)"),
    p("주    소 : 경기도 수원시 팔달구 화서문로 45번길 32, 3층 공존공간"),
    p("전화번호 : 010-9268-2116"),
    empty(),
    new Paragraph({ spacing: { before: 100, after: 80 }, children: [new TextRun({ text: "임 차 인", bold: true, size: 22, font: "맑은 고딕", underline: {} })] }),
    p("성    명 : 씨에스피 주식회사 대표 민욱조    (인)"),
    p("주    소 : 전북특별자치도 전주시 완산구 현무1길 33, 2층 라운지디 (경원동3가, 지당빌딩)"),
    p("전화번호 : 010-4071-8742"),
  ];
}

// ========== 문서 생성 ==========
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      title("임 대 차 계 약 서"),
      makePartyTable(),
      empty(),

      p("계약의 편의상 임대인을 '갑'이라 정하고 임차인을 '을'이라 정한뒤 위 당사자간 다음 건물에 대하여 임대차계약을 체결함."),
      empty(),

      pMulti([{ text: "제1조 [부동산의 표시] ", bold: true }, "갑은 자기가 임차하고 있는 다음 사무실을 을에게 임대한다."]),
      p("주소 : 경기도 수원시 팔달구 화서문로번길 32, 201호", { indent: 600 }),
      empty(),

      pMulti([{ text: "제2조 [보증금] ", bold: true }, "본 계약의 보증금은 없는 것으로 한다."]),
      empty(),

      pMulti([{ text: "제3조 [공과금 기타 부담] ", bold: true }, "갑은 제1조 기재 건물에 관한 조세 기타의 공과 및 대수선을 부담한다."]),
      empty(),

      pMulti([{ text: "제4조 [임대료] ", bold: true }, "을은 갑에게 월 임대료 금 삼백만 원(₩3,000,000)을 매월 말일까지 갑이 지정하는 계좌로 납부한다."]),
      empty(),

      pMulti([{ text: "제5조 [배상책임] ", bold: true }, "을은 그 책임이 될 사유로 인하여 임차건물을 훼손한 경우에는 그 배상의 책임을 진다."]),
      empty(),

      pMulti([{ text: "제6조 [원상회복] ", bold: true }, "을은 명도에 있어서 본건 건물을 원상을 회복하지 않으면 안된다. 그러나 갑의 승낙을 얻어 조작·건구 등을 부착시킨 경우에는 갑은 시가에 의해서 그 조작·건구 등을 매수하는 것으로 한다."]),
      empty(),

      pMulti([{ text: "제7조 [건물용도] ", bold: true }, "을은 본건 건물을 사업장으로 사용하고 다른 용도로 사용하지 못한다. 을이 이 항목을 위반할 경우 갑은 계약해지를 할 수 있다."]),
      empty(),

      pMulti([{ text: "제8조 [계약기간] ", bold: true }, "임대차계약의 기간은 2026년 01월 07일로부터 3년간 한다."]),
      empty(),

      p("위 계약을 증명하기 위하여 본 계약서를 2통 작성하여 각기 서명날인하고 각 1통씩 보관한다."),
      empty(), empty(),

      center("2026 년    01 월    07 일"),
      empty(), empty(),

      ...makeSignSection(),
    ]
  }]
});

const outPath = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\DB\\[공존공간]CSP임대차계약서.docx";
Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(require("path").dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log("생성 완료:", outPath);
});
