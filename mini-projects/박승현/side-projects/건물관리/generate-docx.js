const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel } = require("docx");
const fs = require("fs");

// Helper: create a text run
const text = (t, opts = {}) => new TextRun({ text: t, font: "맑은 고딕", size: opts.size || 20, bold: opts.bold || false, color: opts.color || "000000" });

// Helper: create a paragraph
const para = (runs, opts = {}) => new Paragraph({
  children: Array.isArray(runs) ? runs : [runs],
  spacing: { after: opts.after || 120, before: opts.before || 0, line: opts.line || 276 },
  alignment: opts.align || AlignmentType.LEFT,
  heading: opts.heading,
  indent: opts.indent ? { left: opts.indent } : undefined,
});

// Helper: table cell
const cell = (t, opts = {}) => new TableCell({
  children: [new Paragraph({
    children: [text(t, { bold: opts.bold, size: opts.size || 20 })],
    alignment: opts.align || AlignmentType.CENTER,
    spacing: { before: 40, after: 40 },
  })],
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  shading: opts.shading ? { fill: opts.shading } : undefined,
  verticalAlign: "center",
});

// Helper: header cell (dark bg, white text not supported easily, use gray bg + bold)
const hcell = (t, opts = {}) => new TableCell({
  children: [new Paragraph({
    children: [text(t, { bold: true, size: 20 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 40 },
  })],
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  shading: { fill: "D9E2F3" },
  verticalAlign: "center",
});

// Section title
const sectionTitle = (num, title) => para([text(`${num}. ${title}`, { bold: true, size: 26 })], { before: 300, after: 200 });

// Bullet point
const bullet = (t) => para([text(`• ${t}`)], { indent: 360 });

// Build document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "맑은 고딕", size: 20 },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
      },
    },
    children: [
      // Title
      para([text("견적 요청서", { bold: true, size: 36 })], { align: AlignmentType.CENTER, after: 60 }),
      para([text("공존공간 누수 보수 및 방수 공사", { bold: true, size: 28 })], { align: AlignmentType.CENTER, after: 400 }),

      // 1. 건물 개요
      sectionTitle("1", "건물 개요"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          ["건물명", "공존공간"],
          ["소재지", "수원시 팔달구 장안동 89-3 외 1필지"],
          ["구조", "철근콘크리트조"],
          ["규모", "지하 1층 / 지상 3층"],
          ["연면적", "642.81㎡ (약 194평)"],
          ["건축면적", "158.39㎡ (약 48평)"],
          ["최고높이", "11.95M"],
          ["준공연도", "2019년"],
          ["용도", "B1 일반음식점(양조장), 1F 소매점, 2F 일반음식점, 3F 단독주택"],
        ].map(([k, v]) => new TableRow({
          children: [
            cell(k, { bold: true, width: 25, shading: "F2F2F2", align: AlignmentType.CENTER }),
            cell(v, { width: 75, align: AlignmentType.LEFT }),
          ],
        })),
      }),

      // 2. 공사 요청 배경
      sectionTitle("2", "공사 요청 배경"),
      para([text("건물 노후화로 인해 지하 1층을 중심으로 다수의 누수가 발생하고 있습니다.")]),
      para([text("3층 옥상 방수 및 외벽 상태가 누수 원인으로 추정되어, "), text("상층부(3층)에서 하층부(지하)", { bold: true }), text(" 순서로 단계적 보수를 계획하고 있습니다.")]),

      // 3. 공사 항목
      sectionTitle("3", "공사 항목"),

      // 3층
      para([text("3층 (1차 공사)", { bold: true, size: 22 })], { before: 200, after: 120 }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [hcell("번호", {width:10}), hcell("위치", {width:20}), hcell("공사 내용", {width:40}), hcell("비고", {width:30})] }),
          new TableRow({ children: [cell("5"), cell("3층 샷시"), cell("잠금 장치 교체", {align:AlignmentType.LEFT}), cell("")] }),
          new TableRow({ children: [cell("6"), cell("3층 샷시"), cell("방충망 제작 및 설치", {align:AlignmentType.LEFT}), cell("")] }),
          new TableRow({ children: [cell("7"), cell("3층 옥상 바닥"), cell("우레탄 방수", {align:AlignmentType.LEFT}), cell("")] }),
          new TableRow({ children: [cell("7-1"), cell("3층 외부 벽돌"), cell("우레탄 방수 또는 매지 방수 여부 확인 필요", {align:AlignmentType.LEFT}), cell("현장 확인 요청", {bold:true})] }),
        ],
      }),
      para([text("※ 참고: ", { bold: true }), text("외벽 벽돌 또는 매지(줄눈)가 누수 원인으로 판단될 경우, 방수 방법에 대한 별도 제안을 요청드립니다. (1층 전체 바닥 재시공 또는 벽돌/매지 부분 방수 등)")], { before: 80, after: 200 }),

      // 1층
      para([text("1층 (2차 공사 — 3층 공사 후 경과 관찰 이후)", { bold: true, size: 22 })], { before: 200, after: 120 }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [hcell("번호", {width:10}), hcell("위치", {width:20}), hcell("공사 내용", {width:40}), hcell("비고", {width:30})] }),
          new TableRow({ children: [cell("4"), cell("1층 전체"), cell("기본 누수 흔적 조사 및 보수", {align:AlignmentType.LEFT}), cell("3층 공사 후 누수 지속 여부 확인 후 범위 결정", {align:AlignmentType.LEFT})] }),
        ],
      }),

      // 지하 1층
      para([text("지하 1층 (3차 공사 — 상층부 공사 완료 후)", { bold: true, size: 22 })], { before: 300, after: 120 }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [hcell("번호", {width:10}), hcell("위치", {width:25}), hcell("공사 내용", {width:40}), hcell("비고", {width:25})] }),
          new TableRow({ children: [cell("1"), cell("지하 1층 양조장"), cell("누수 보수", {align:AlignmentType.LEFT}), cell("")] }),
          new TableRow({ children: [cell("2"), cell("지하 1층 외부 계단\n연접 내부 벽체"), cell("양쪽 사이드 누수 보수", {align:AlignmentType.LEFT}), cell("")] }),
          new TableRow({ children: [cell("3"), cell("지하 1층 룸"), cell("천장 누수 보수", {align:AlignmentType.LEFT}), cell("")] }),
        ],
      }),

      // 4. 공사 순서 및 참고 사항
      sectionTitle("4", "공사 순서 및 참고 사항"),
      bullet("3층 먼저 시공 → 옥상 방수 + 외벽 점검 후 누수 재발 여부 관찰"),
      bullet("1층 누수 흔적 조사 → 3층 공사 효과 확인 후 범위 결정"),
      bullet("지하 1층 보수 → 상층부 원인 해소 확인 후 진행"),
      para([text("3층 외벽 벽돌/매지가 누수 원인으로 확인될 경우, 별도 방수 방안 제안 요청:", { bold: true })], { before: 120 }),
      bullet("방안 A: 1층 전체 바닥 재시공"),
      bullet("방안 B: 벽돌 및 매지 부분 방수"),
      bullet("기타 업체 제안"),

      // 5. 견적 요청 사항
      sectionTitle("5", "견적 요청 사항"),
      bullet("항목별 개별 견적 (3층 / 1층 / 지하 1층 분리)"),
      bullet("외벽 벽돌/매지 방수 방안별 견적 비교"),
      bullet("예상 공사 기간 (항목별)"),
      bullet("사용 자재 및 보증 기간 명시"),
      bullet("현장 실사 가능 일정"),

      // 6. 요청자 정보
      sectionTitle("6", "요청자 정보"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("건물명", { bold: true, width: 25, shading: "F2F2F2" }), cell("공존공간", { width: 75, align: AlignmentType.LEFT })] }),
          new TableRow({ children: [cell("요청자", { bold: true, width: 25, shading: "F2F2F2" }), cell("박승현", { width: 75, align: AlignmentType.LEFT })] }),
        ],
      }),

      // 7. 첨부 자료
      sectionTitle("7", "첨부 자료"),
      bullet("설계개요서 (설계개요.pdf)"),
      bullet("변경사항 반영 도면 (0526 공존공간 변경사항 반영 도면.pdf)"),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("견적요청서-누수보수공사.docx", buffer);
  console.log("완료: 견적요청서-누수보수공사.docx");
});
