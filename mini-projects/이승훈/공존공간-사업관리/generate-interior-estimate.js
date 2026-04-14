const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");
const path = require("path");

// ========== 공통 ==========
const font = "맑은 고딕";
const thin = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const cb = { top: thin, bottom: thin, left: thin, right: thin };
const nb = { style: BorderStyle.NONE, size: 0 };
const nbs = { top: nb, bottom: nb, left: nb, right: nb };
const blue = "2C5F8A";

function fmt(n) { return n.toLocaleString("ko-KR"); }

// ========== 견적 항목 ==========
const items = [
  { name: "철거공사", spec: "기존 내장재/파티션 철거", unit: "식", qty: 1, price: 780000 },
  { name: "폐기물처리", spec: "철거 폐기물 반출·처리", unit: "식", qty: 1, price: 350000 },
  { name: "벽체/파티션공사", spec: "경량벽체·파티션 설치", unit: "식", qty: 1, price: 950000 },
  { name: "페인트공사", spec: "벽면/천장 수성페인트", unit: "평", qty: 20, price: 35000 },
  { name: "전기공사", spec: "콘센트 증설, 분전반, 네트워크 배선", unit: "식", qty: 1, price: 850000 },
  { name: "조명공사", spec: "LED 매입등/패널등 교체", unit: "식", qty: 1, price: 600000 },
  { name: "출입문/하드웨어", spec: "출입문 교체, 도어락, 손잡이", unit: "식", qty: 1, price: 350000 },
  { name: "잡자재/소모품", spec: "실리콘, 코킹, 마감재 등", unit: "식", qty: 1, price: 520000 },
];
items.forEach(i => { i.amount = i.qty * i.price; });
const supply = items.reduce((s, i) => s + i.amount, 0);
const vat = Math.round(supply * 0.1);
const total = supply + vat;

// ========== 공급자 정보 테이블 ==========
function makeInfoTable() {
  function lbl(text, w = 20) {
    return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, borders: cb,
      shading: { type: ShadingType.SOLID, color: "E8EDF2" }, verticalAlign: "center",
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20, after: 20 },
        children: [new TextRun({ text, size: 16, font, bold: true })] })] });
  }
  function val(text, w = 30) {
    return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, borders: cb, verticalAlign: "center",
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20, after: 20 },
        children: [new TextRun({ text, size: 16, font })] })] });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [lbl("견적일자"), val("2026년 03월 16일"), lbl("등록번호"), val("244-21-02185")] }),
      new TableRow({ children: [lbl("대 표 자"), val("이삼열"), lbl("회 사 명"), val("파파설비")] }),
      new TableRow({ children: [lbl("연 락 처"), val("010-7479-1252"), lbl("이 메 일"), val("papa1253@naver.com")] }),
      new TableRow({ children: [
        lbl("주    소"),
        new TableCell({ columnSpan: 3, borders: cb, verticalAlign: "center",
          children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 20, after: 20 }, indent: { left: 100 },
            children: [new TextRun({ text: "경기도 화성시 봉담읍 1597-26, 1동 3층 301호", size: 16, font })] })] }),
      ]}),
    ]
  });
}

// ========== 합계 바 ==========
function makeTotalBar() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: cb,
        shading: { type: ShadingType.SOLID, color: blue },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "합계 (VAT 포함)", bold: true, size: 22, font, color: "FFFFFF" })] })] }),
      new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: cb,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 60, after: 60 }, indent: { right: 150 },
          children: [
            new TextRun({ text: `${fmt(total)}`, bold: true, size: 30, font, color: "CC0000" }),
            new TextRun({ text: " 원", bold: true, size: 22, font, color: "CC0000" }),
          ] })] }),
    ]})]
  });
}

// ========== 소계/부가세 영역 ==========
function makeSummary() {
  function row(label, amount) {
    return new TableRow({ children: [
      new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: nbs,
        children: [new Paragraph({ children: [] })] }),
      new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, borders: nbs, verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 15, after: 15 },
          children: [new TextRun({ text: label, size: 16, font })] })] }),
      new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE },
        borders: { top: nb, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: nb, right: nb },
        verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 15, after: 15 },
          children: [new TextRun({ text: `${fmt(amount)} 원`, size: 16, font })] })] }),
    ]});
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [row("공급가액", supply), row("부가세(10%)", vat)] });
}

// ========== 상세 항목 테이블 ==========
function makeItemTable() {
  function hc(text, w) {
    return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, borders: cb,
      shading: { type: ShadingType.SOLID, color: blue }, verticalAlign: "center",
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 30, after: 30 },
        children: [new TextRun({ text, bold: true, size: 16, font, color: "FFFFFF" })] })] });
  }
  function dc(text, w, align) {
    return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, borders: cb, verticalAlign: "center",
      children: [new Paragraph({
        alignment: align || AlignmentType.CENTER,
        spacing: { before: 25, after: 25 },
        indent: align === AlignmentType.RIGHT ? { right: 80 } : (align === AlignmentType.LEFT ? { left: 80 } : undefined),
        children: [new TextRun({ text, size: 16, font })]
      })] });
  }

  const rows = [
    new TableRow({ children: [hc("NO", 6), hc("품  명", 15), hc("규      격", 24), hc("수량", 7), hc("단가(원)", 14), hc("공급가액", 16), hc("세  액", 14)] }),
  ];

  items.forEach((item, i) => {
    const tax = Math.round(item.amount * 0.1);
    rows.push(new TableRow({ children: [
      dc(`${i + 1}`, 6),
      dc(item.name, 15, AlignmentType.LEFT),
      dc(item.spec, 24, AlignmentType.LEFT),
      dc(`${item.qty}`, 7),
      dc(fmt(item.price), 14, AlignmentType.RIGHT),
      dc(fmt(item.amount), 16, AlignmentType.RIGHT),
      dc(fmt(tax), 14, AlignmentType.RIGHT),
    ]}));
  });

  // 빈 행 1줄만
  rows.push(new TableRow({ children: [dc("", 6), dc("", 15), dc("", 24), dc("", 7), dc("", 14), dc("", 16), dc("", 14)] }));

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ========== 참고사항 ==========
function makeNotes() {
  const bullet = (text) => new Paragraph({ spacing: { after: 20 }, indent: { left: 250 },
    children: [new TextRun({ text: `• ${text}`, size: 15, font })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({ borders: cb,
      shading: { type: ShadingType.SOLID, color: "F5F7FA" },
      children: [
        new Paragraph({ spacing: { before: 50, after: 30 }, indent: { left: 100 },
          children: [new TextRun({ text: "참 고 사 항", bold: true, size: 17, font, color: blue })] }),
        bullet("시공내용 : 공존공간 사무실 인테리어 리모델링 (약 20평)"),
        bullet("시공범위 : 기존 철거 후 파티션, 페인트, 전기, 조명, 출입문 시공"),
        bullet("시공소요기간 : 약 5~7일"),
        new Paragraph({ spacing: { after: 50 }, indent: { left: 250 },
          children: [new TextRun({ text: "• 본 견적은 현장 상황에 따라 변동될 수 있습니다.", size: 15, font, italics: true, color: "666666" })] }),
      ]
    })] })]
  });
}

// ========== 입금안내 ==========
function makeBank() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({ borders: cb,
      shading: { type: ShadingType.SOLID, color: "F5F7FA" },
      children: [
        new Paragraph({ spacing: { before: 50, after: 30 }, indent: { left: 100 },
          children: [new TextRun({ text: "입 금 안 내", bold: true, size: 17, font, color: blue })] }),
        new Paragraph({ spacing: { after: 50 }, indent: { left: 250 },
          children: [new TextRun({ text: "• 국민은행  534237-04-004500  이삼열(파파설비)", size: 15, font })] }),
      ]
    })] })]
  });
}

// ========== 문서 ==========
const sp = (n) => new Paragraph({ spacing: { after: n || 60 }, children: [] });

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 700, bottom: 500, left: 1000, right: 1000 } } },
    children: [
      // 제목
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "견  적  서", bold: true, size: 44, font })] }),

      // 수신처
      new Paragraph({ spacing: { before: 60, after: 30 },
        children: [
          new TextRun({ text: "씨에스피 주식회사", bold: true, size: 24, font, color: blue }),
          new TextRun({ text: "  귀중", size: 20, font }),
        ] }),

      // 인사말
      new Paragraph({ spacing: { after: 80 },
        children: [new TextRun({ text: "아래와 같이 견적합니다.", size: 17, font })] }),

      // 공급자 정보 테이블
      makeInfoTable(),
      sp(80),

      // 합계 바
      makeTotalBar(),
      sp(30),

      // 소계/부가세
      makeSummary(),
      sp(100),

      // 상세 테이블
      makeItemTable(),
      sp(80),

      // 참고사항
      makeNotes(),
      sp(50),

      // 입금안내
      makeBank(),
    ]
  }]
});

const outPath = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\DB\\[공존공간]인테리어공사-견적서.docx";
Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log("생성 완료:", outPath);
  console.log(`공급가액: ${fmt(supply)}원 / 부가세: ${fmt(vat)}원 / 합계: ${fmt(total)}원`);
});
