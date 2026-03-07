import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  TableLayoutType, VerticalAlign, Tab, TabStopPosition, TabStopType,
  convertInchesToTwip, LevelFormat
} from "docx";
import fs from "fs";

// ─── 색상 시스템 ───
const C = {
  deepBlue:   "1A365D",
  steelBlue:  "4A6FA5",
  iceBlue:    "EBF1F8",
  emerald:    "2E8B57",
  charcoal:   "2D3436",
  gray:       "718096",
  lightGray:  "F7F9FC",
  silver:     "E2E8F0",
  white:      "FFFFFF",
  coral:      "E53E3E",
};
const FONT = "맑은 고딕";

// ─── 헬퍼 ───
function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size || 22, // 11pt
    bold: opts.bold || false,
    color: opts.color || C.charcoal,
    ...(opts.italics ? { italics: true } : {}),
  });
}

function para(runs, opts = {}) {
  const runArr = typeof runs === "string" ? [txt(runs, opts)] : runs;
  return new Paragraph({
    children: runArr,
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: opts.line ?? 360 },
    alignment: opts.align || AlignmentType.LEFT,
    ...(opts.heading ? { heading: opts.heading } : {}),
    ...(opts.indent ? { indent: opts.indent } : {}),
    ...(opts.border ? { border: opts.border } : {}),
    ...(opts.shading ? { shading: opts.shading } : {}),
    ...(opts.pageBreakBefore ? { pageBreakBefore: true } : {}),
  });
}

function sectionTitle(text) {
  return new Paragraph({
    children: [txt(text, { size: 28, bold: true, color: C.deepBlue })],
    spacing: { before: 200, after: 120, line: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.deepBlue } },
  });
}

function subTitle(text) {
  return new Paragraph({
    children: [txt(text, { size: 24, bold: true, color: C.charcoal })],
    spacing: { before: 200, after: 100, line: 360 },
  });
}

function subSubTitle(text) {
  return new Paragraph({
    children: [txt(text, { size: 22, bold: true, color: C.steelBlue })],
    spacing: { before: 160, after: 80, line: 360 },
  });
}

function bullet(text, opts = {}) {
  const children = typeof text === "string"
    ? [txt("• ", { bold: true, color: C.steelBlue }), txt(text, opts)]
    : [txt("• ", { bold: true, color: C.steelBlue }), ...text];
  return new Paragraph({
    children,
    spacing: { after: 60, line: 340 },
    indent: { left: convertInchesToTwip(0.3) },
  });
}

function source(text) {
  return para(text, { size: 18, color: C.gray, align: AlignmentType.RIGHT, after: 120 });
}

// ─── 테이블 헬퍼 ───
function headerCell(text, width) {
  return new TableCell({
    children: [new Paragraph({
      children: [txt(text, { size: 20, bold: true, color: C.white })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    shading: { fill: C.deepBlue, type: ShadingType.CLEAR },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

function dataCell(text, opts = {}) {
  const runs = typeof text === "string"
    ? [txt(text, { size: 20, bold: opts.bold, color: opts.color || C.charcoal })]
    : text;
  return new TableCell({
    children: [new Paragraph({
      children: runs,
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 30, after: 30 },
    })],
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function makeTable(headers, rows, opts = {}) {
  const hRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, opts.widths?.[i])),
    tableHeader: true,
  });
  const dRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => {
        const isHighlight = opts.highlightRows?.includes(ri);
        const isTotal = opts.totalRow === ri;
        if (isTotal) {
          return dataCell(cell, {
            bold: true, color: C.white,
            shading: C.deepBlue,
            align: opts.alignCols?.[ci] || AlignmentType.LEFT,
            width: opts.widths?.[ci],
          });
        }
        const bg = isHighlight ? C.iceBlue : (ri % 2 === 1 ? C.lightGray : C.white);
        const isGreen = opts.greenCols?.includes(ci);
        return dataCell(cell, {
          bold: isGreen || isHighlight,
          color: isGreen ? C.emerald : C.charcoal,
          shading: bg,
          align: opts.alignCols?.[ci] || AlignmentType.LEFT,
          width: opts.widths?.[ci],
        });
      }),
    })
  );
  return new Table({
    rows: [hRow, ...dRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

// ─── KPI 박스 ───
function kpiBox(number, label) {
  return new Table({
    rows: [new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [txt(number, { size: 52, bold: true, color: C.deepBlue })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 20 },
            }),
            new Paragraph({
              children: [txt(label, { size: 18, color: C.gray })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
          ],
          shading: { fill: C.iceBlue, type: ShadingType.CLEAR },
          borders: {
            left: { style: BorderStyle.SINGLE, size: 18, color: C.deepBlue },
            top: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
            right: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
          },
        }),
      ],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function kpiRow(kpis) {
  return new Table({
    rows: [new TableRow({
      children: kpis.map(k => new TableCell({
        children: [
          new Paragraph({
            children: [txt(k.number, { size: 48, bold: true, color: C.deepBlue })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 20 },
          }),
          new Paragraph({
            children: [txt(k.label, { size: 18, color: C.gray })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
        ],
        shading: { fill: C.iceBlue, type: ShadingType.CLEAR },
        borders: {
          left: { style: BorderStyle.SINGLE, size: 18, color: C.deepBlue },
          top: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
          right: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
        },
        width: { size: 25, type: WidthType.PERCENTAGE },
      })),
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function calloutBox(text) {
  return new Table({
    rows: [new TableRow({
      children: [new TableCell({
        children: [para(text, { size: 22 })],
        shading: { fill: C.iceBlue, type: ShadingType.CLEAR },
        borders: {
          left: { style: BorderStyle.SINGLE, size: 18, color: C.deepBlue },
          top: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
          right: { style: BorderStyle.SINGLE, size: 1, color: C.silver },
        },
      })],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function spacer(h = 200) {
  return para("", { after: h });
}

// ═══════════════════════════════════════════
// 문서 생성
// ═══════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22, color: C.charcoal },
        paragraph: { spacing: { line: 360 } },
      },
    },
  },
  sections: [
    // ──────── 표지 ────────
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: { default: new Footer({ children: [] }) },
      children: [
        spacer(2000),
        new Paragraph({
          children: [txt("수원 행궁동", { size: 44, bold: true, color: C.deepBlue })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [txt("글로컬 상권 활성화 사업", { size: 44, bold: true, color: C.deepBlue })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [txt("성과 종합 보고", { size: 36, bold: true, color: C.steelBlue })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        // 구분선
        new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.deepBlue } },
          spacing: { after: 400 },
        }),
        // 메타
        para([txt("사업 기간", { size: 24, bold: true, color: C.steelBlue }), txt("    2024년 6월 ~ 2025년 12월", { size: 24 })], { align: AlignmentType.CENTER, after: 80 }),
        para([txt("총 사업비", { size: 24, bold: true, color: C.steelBlue }), txt("    최대 155억 원", { size: 24 })], { align: AlignmentType.CENTER, after: 80 }),
        para([txt("운영기관", { size: 24, bold: true, color: C.steelBlue }), txt("    (주)공존공간", { size: 24 })], { align: AlignmentType.CENTER, after: 80 }),
        para([txt("보고 대상", { size: 24, bold: true, color: C.steelBlue }), txt("    중소벤처기업부", { size: 24 })], { align: AlignmentType.CENTER, after: 400 }),
        para("2026년 3월", { size: 24, align: AlignmentType.CENTER, after: 0, color: C.gray }),
      ],
    },

    // ──────── 목차 ────────
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              txt("수원 행궁동 글로컬 상권 활성화 사업 성과 보고", { size: 16, color: C.gray }),
              new TextRun({ children: [new Tab()], font: FONT }),
              txt("(주)공존공간", { size: 16, color: C.gray }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.silver } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gray })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [
        sectionTitle("목 차"),
        spacer(100),
        ...[
          "1. 개요",
          "2. 연차별 핵심 성과 비교",
          "3. 정량 성과",
          "4. '온라인 간판' 만들기 — 글로벌 디지털 접근성 구축",
          "5. 환대지수 및 미스터리 쇼퍼 운영",
          "6. 글로컬 상권 연계 축제 운영 — 깍페스티벌",
          "7. 콘텐츠 제작 및 디지털 확산",
          "8. 대기업·대학 협업 유치",
          "9. 소상공인 역량 강화 — 교육 및 컨설팅",
          "10. 상권 거버넌스 구축",
          "11. 성과의 전국 확산",
          "12. 결론 및 향후 방향",
        ].map(item => para(item, { size: 24, after: 100, indent: { left: convertInchesToTwip(0.3) } })),
      ],
    },

    // ──────── KPI 요약 + 본문 ────────
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              txt("수원 행궁동 글로컬 상권 활성화 사업 성과 보고", { size: 16, color: C.gray }),
              new TextRun({ children: [new Tab()], font: FONT }),
              txt("(주)공존공간", { size: 16, color: C.gray }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.silver } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gray })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [
        // ── 핵심 KPI ──
        sectionTitle("핵심 성과 요약"),
        spacer(60),
        kpiRow([
          { number: "+107%", label: "외국인 관광 소비액 증가 (23→25)" },
          { number: "64→89점", label: "환대지수 향상 (+39%)" },
          { number: "185명", label: "깍스쿨 교육 누적 참여" },
          { number: "+610%", label: "소상공인 협업 (20→142회)" },
        ]),
        spacer(100),

        // ── 1. 개요 ──
        sectionTitle("1. 개요"),
        para([
          txt("2024년이 인재 발굴과 교육을 통해 상권의 기초 체력을 다지는 "),
          txt("'기반 조성'", { bold: true, color: C.steelBlue }),
          txt(" 단계였다면, 2025년은 축적된 역량을 바탕으로 킬러 콘텐츠를 생산하고 이를 온·오프라인으로 확산시키는 "),
          txt("'콘텐츠 확산 및 글로컬화'", { bold: true, color: C.steelBlue }),
          txt(" 단계로 진화하였음."),
        ]),

        // ── 2. 연차별 비교 ──
        sectionTitle("2. 연차별 핵심 성과 비교"),
        makeTable(
          ["구분", "2024년 (기반 조성)", "2025년 (성과 확산)", "비고"],
          [
            ["핵심 목표", "로컬 인재 발굴 및 기초 역량 강화", "콘텐츠 큐레이션 및 온라인 확산", "목표 고도화"],
            ["인재 발굴", "예비창업가 발굴, 장인학교 44명", "발굴 인재의 브랜드화 및 상권 안착 유도", "인재 DB 확보"],
            ["컨설팅", "139회 (외부 컨설턴트 의존)", "53회 (자체 역량 진행)", "역량 내재화"],
            ["소상공인 협업", "20회", "142회 (+610%)", "콘텐츠화"],
            ["국비 스케일업", "신사업창업사관학교, 로컬크리에이터, 강한소상공인 3팀", "로컬크리에이터 1팀, 강한소상공인 3팀 (비예산/전국 경쟁)", "자생적 스케일업"],
            ["전국 확산", "로컬크리에이터 × 소상공인 협업 시작", "글로컬페스타 54팀, 팝업 23건(54업체)", "전국화"],
          ],
          { widths: [15, 30, 30, 15] }
        ),
        spacer(60),

        // ── 3. 정량 성과 ──
        sectionTitle("3. 정량 성과"),
        subTitle("가. 외국인 관광 — 질적 전환"),
        makeTable(
          ["지표", "2023년 (사업 전)", "2024년", "2025년 (10월)", "변화율"],
          [
            ["외국인 방문객", "15만 명", "21만 명", "21만 명", "+40%"],
            ["외국인 관광 총소비", "14억 원", "24억 원", "29억 원", "+107.1%"],
            ["1인당 소비액(ARPU)", "9,333원", "11,429원", "13,810원", "+48%"],
          ],
          { greenCols: [4], alignCols: [, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] }
        ),
        bullet([txt("방문객 증가율(+40%) 대비 총소비액 증가("), txt("+107.1%", { bold: true, color: C.emerald }), txt(")가 월등히 높아, 고부가가치 관광지로의 전환 성과 가시화")]),
        bullet("외국인 1인당 소비액 지속 증가 → 관광의 질적 성장 확인"),
        spacer(60),

        subTitle("나. 경쟁 지역 비교 — 외국인 방문객"),
        makeTable(
          ["지역", "2023년", "2024년", "2025년 (~10월)"],
          [
            ["수원 행궁동", "15만 명", "21만 명", "21만 명"],
            ["경주 황남동", "20만 명", "29만 명", "27만 명"],
            ["전주 풍남동", "16만 명", "16만 명", "14만 명"],
          ],
          { highlightRows: [0], alignCols: [, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] }
        ),
        bullet("2024년: 전주 한옥마을 방문객 수 역전"),
        bullet("2025년: 경주 황리단길의 성장 속도(전년 실적 달성률) 추월"),
        spacer(60),

        subSubTitle("외국인 관광소비액"),
        makeTable(
          ["지역", "2023년", "2024년", "2025년 (~10월)", "성장률"],
          [
            ["수원 행궁동", "14억 원", "24억 원", "29억 원", "+107%"],
            ["경주 황남동", "27억 원", "46억 원", "57억 원", "+111%"],
            ["전주 풍남동", "32억 원", "35억 원", "38억 원", "+19%"],
          ],
          { highlightRows: [0], greenCols: [4], alignCols: [, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] }
        ),
        source("출처: 한국관광데이터랩 (2025.10 기준)"),
        spacer(60),

        subTitle("다. 내국인 방문객"),
        makeTable(
          ["연도", "내국인 방문객", "전년 대비"],
          [
            ["2023년", "1,610만 명", "-"],
            ["2024년", "1,690만 명", "+4.9%"],
            ["2025년 (10월 누적)", "1,470만 명", "연말 기준 성장세 지속 전망"],
          ],
          { alignCols: [, AlignmentType.CENTER, AlignmentType.CENTER] }
        ),

        // ── 4. 온라인 간판 ── (새 페이지)
        sectionTitle("4. '온라인 간판' 만들기 — 글로벌 디지털 접근성 구축"),

        subTitle("가. 문제 인식"),
        calloutBox("국내 소상공인은 네이버 스마트플레이스에는 정보가 비교적 잘 등록되어 있으나, 외국인이 주로 이용하는 구글맵, 트립어드바이저, 샤오홍슈 등 글로벌 플랫폼에는 상호명만 등록되어 있고 상세 정보(메뉴, 영업시간, 사진, 리뷰 등)가 부실한 상황이었음. 이로 인해 외국인 관광객의 신뢰도가 떨어지고, 오프라인 상권의 매력이 온라인에서 발견되지 못하는 구조적 단절이 존재하였음."),
        spacer(60),

        subTitle("나. 추진 내용"),
        para("공존공간은 이 문제를 '온라인 간판 만들기'로 명명하고, 교육·컨설팅·등록 지원을 통합 추진하였음."),
        makeTable(
          ["항목", "내용"],
          [
            ["교육", "'깍스쿨' 10회차(2025.02.24) — '온라인 간판' 만들기 (구글맵, 트립어드바이저 등록)"],
            ["1:1 컨설팅", "디지털 전환 컨설팅 3회차(2025.01.15~17) — 개별 매장 맞춤 등록 지원"],
            ["등록 대행", "네이버 스마트플레이스, 구글맵, 트립어드바이저 등 주요 플랫폼 점포 정보 등록"],
            ["검색 최적화", "SEO 키워드 설정, 대표 이미지 개선, 다국어 정보 입력"],
          ],
          { widths: [20, 80] }
        ),
        spacer(60),

        subTitle("다. 추진 성과"),
        bullet("행궁동 상권 내 점포의 글로벌 플랫폼(구글맵, 트립어드바이저) 정보 등록 및 간판 세팅 완료"),
        bullet("등록 후 실제 다수 점포에서 방문자 수 및 리뷰 수 증가 등 긍정적 반응 확인"),
        bullet("오프라인 환대 경험과 온라인 노출을 연결하는 상권 경쟁력 강화 기반 마련"),
        bullet("빠르고 직관적인 설명 → 소상공인이 즉시 실행 가능한 결과물 확보 → 높은 만족도"),
        spacer(60),

        subTitle("라. 의의"),
        bullet([txt("네이버에만 등록된 점포 = ", { color: C.gray }), txt("내국인만 발견 가능", { bold: true, color: C.gray })]),
        bullet([txt("구글맵·트립어드바이저에 등록된 점포 = ", { color: C.emerald }), txt("전 세계 관광객이 발견 가능", { bold: true, color: C.emerald })]),
        bullet([txt("외국인 소비액 "), txt("+107%", { bold: true, color: C.emerald }), txt(" 성장의 디지털 인프라 기반 중 하나로 기능")]),
        spacer(60),

        subTitle("마. 향후 계획"),
        bullet("이번 컨설팅에서 시도한 플랫폼 등록을 상권 내 전 상점으로 확대 적용"),
        bullet("온라인 매뉴얼 제작 및 연계 사업 계획 수립 필요"),

        // ── 5. 환대지수 ──
        sectionTitle("5. 환대지수(Hospitality Index) 및 미스터리 쇼퍼 운영"),

        subTitle("가. 추진 내용"),
        bullet("행궁동 상권 특성에 적합한 자체 평가 지표 '환대의 인덱스' 개발"),
        bullet("평가 항목: 내부환경, 서비스 태도, 고객응대 인프라 등"),
        bullet("미스터리 쇼퍼 → 컨설팅·교육 → 인스펙터(사후점검)로 이어지는 통합 솔루션 체계 구축"),
        spacer(60),

        // 프로세스 흐름 시각화
        new Table({
          rows: [new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [txt("미스터리 쇼퍼", { size: 20, bold: true, color: C.white }), txt("\n(사전 평가)", { size: 16, color: C.white })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })],
                shading: { fill: C.deepBlue, type: ShadingType.CLEAR },
                width: { size: 28, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ children: [txt("→", { size: 28, bold: true, color: C.steelBlue })], alignment: AlignmentType.CENTER })],
                width: { size: 8, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
              new TableCell({
                children: [new Paragraph({ children: [txt("컨설팅·교육", { size: 20, bold: true, color: C.white }), txt("\n(개선)", { size: 16, color: C.white })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })],
                shading: { fill: C.steelBlue, type: ShadingType.CLEAR },
                width: { size: 28, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ children: [txt("→", { size: 28, bold: true, color: C.steelBlue })], alignment: AlignmentType.CENTER })],
                width: { size: 8, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
              new TableCell({
                children: [new Paragraph({ children: [txt("인스펙터", { size: 20, bold: true, color: C.white }), txt("\n(사후 점검)", { size: 16, color: C.white })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })],
                shading: { fill: C.emerald, type: ShadingType.CLEAR },
                width: { size: 28, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          })],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        spacer(60),

        subTitle("나. 추진 성과"),
        makeTable(
          ["항목", "실적"],
          [
            ["미스터리 쇼퍼 대상", "행궁동 상권 내 100개 점포"],
            ["환대 점수 변화", "64점 → 89점 (약 +39% 향상)"],
            ["사전·사후 평가", "미스터리 쇼퍼(사전) + 인스펙터(사후) 체계 구축 완료"],
            ["온라인 간판 연계", "구글맵·트립어드바이저 등록 동시 진행"],
          ],
          { widths: [30, 70], highlightRows: [1] }
        ),
        spacer(60),

        subTitle("다. 의의"),
        bullet("기존 주관적 평가에서 벗어나, 점포별 환대 수준을 수치화·비교 가능한 체계 마련"),
        bullet("미스터리 쇼퍼-컨설팅-인스펙터 선순환 구조 → 타 지역 확장 가능 모델"),
        bullet("사후 피드백을 통한 반복 개선 → 점포 운영자 높은 만족도와 신뢰도 확보"),
        spacer(60),

        subTitle("라. 향후 계획"),
        bullet("환대의 인덱스 고도화 (외국인 방문객, 다양한 연령층 반영한 다층적 분석)"),
        bullet("연 1~2회 정기 점검 정례화"),
        bullet("상권관리 거버넌스의 일원으로 인스펙터 시스템 포지셔닝"),

        // ── 6. 깍페스티벌 ──
        sectionTitle("6. 글로컬 상권 연계 축제 운영 — 깍페스티벌"),

        subTitle("가. 추진 내용"),
        bullet("깍페스티벌(上, 下) 2회 개최"),
        bullet("롯데 웰푸드 브랜드 협업 → '남문 깍페스티벌' 운영 (비예산)"),
        bullet("콜라보 팝업스토어 23건 운영 (54개 업체 참여)"),
        bullet("체류형 러닝 프로그램 연계 운영"),
        bullet("기부팝업 운영"),
        spacer(60),

        subTitle("나. 추진 성과"),
        makeTable(
          ["항목", "실적"],
          [
            ["축제 운영", "깍페스티벌(上, 下) 2회"],
            ["콜라보 팝업스토어", "23건 / 54개 업체 참여"],
            ["환대의 패키지 배포", "691건 (아이템 11종, 패키지 5종)"],
            ["대기업 비예산 협업", "롯데 웰푸드, 오뚜기(진행 중)"],
          ],
          { widths: [30, 70] }
        ),
        spacer(60),

        subTitle("다. 환대의 패키지"),
        bullet("아이템 11종: 티셔츠, 스티커 3종, 깍 와팬, 수원 키링, 고수원 QR 아크릴 스탠드, 통닭 키링, 종이꽃, 전통매듭 팔찌"),
        bullet("패키지 5종: 내빈용, 락성연 1·2일차 사전 참여자용, 기부팝업 참여자용, 참여 소상공인용"),
        bullet("다국어 인사말 디자인 제작 — 외국인 관광객 환대 문화 정착 기반"),

        // ── 7. 콘텐츠 ──
        sectionTitle("7. 콘텐츠 제작 및 디지털 확산"),

        subTitle("가. GoSuwon 홈페이지 고도화"),
        makeTable(
          ["2024년", "2025년"],
          [
            ["콘텐츠 아카이빙 용도", "글로벌 플랫폼으로 전환"],
            ["영문 콘텐츠 제공 불가", "다국어 번역 기능 추가"],
            ["검색 노출 불가", "SEO 검색 최적화 추가"],
            ["구글맵 연동 불안정", "구글맵 연동 안정화"],
            ["-", "GPS 개인화, 색각이상자 지원, SNS 노출, PDF 다운로드 추가"],
          ],
          { widths: [50, 50] }
        ),
        spacer(60),

        subTitle("나. 4개국어 SNS 채널 운영"),
        makeTable(
          ["채널", "콘텐츠 수", "노출 수"],
          [
            ["@gosuwon.kr (한국어)", "12개", "166,736건"],
            ["@gosuwon.en (영어)", "12개", "187,324건"],
            ["@gosuwon.jp (일본어)", "8개", "41,194건"],
            ["@gosuwon.tw (중국어)", "11개", "91,488건"],
            ["합계", "43개", "486,742건"],
          ],
          { widths: [40, 20, 40], totalRow: 4, alignCols: [, AlignmentType.CENTER, AlignmentType.CENTER] }
        ),
        bullet([txt("전체 콘텐츠 누적 노출 약 "), txt("89만 회", { bold: true, color: C.emerald }), txt(", 도달 66만 회, 팔로워 1,300여 명 확보")]),
        spacer(60),

        subTitle("다. 큐레이션 및 콘텐츠 자산"),
        makeTable(
          ["항목", "실적"],
          [
            ["로컬크리에이터 5인 협업 큐레이션 콘텐츠", "19개 발행"],
            ["인터뷰 콘텐츠 참여 업체", "11곳"],
            ["우수 점포 홍보 영상 (유튜브 PPK, 구독자 5.9만)", "10개 제작, 누적 조회 5,800회"],
            ["다국어 상권 지도", "4종 (드라마/맛집/무장애/축제)"],
            ["상권 뉴스레터 '로컬디인사이트'", "6회 발행"],
            ["로컬 인사이트 보고서", "2개 발행"],
          ],
          { widths: [55, 45] }
        ),

        // ── 8. 협업 ──
        sectionTitle("8. 대기업·대학 협업 유치 (비예산)"),
        makeTable(
          ["파트너", "협업 내용", "비고"],
          [
            ["롯데 웰푸드", "'남문 깍페스티벌' 브랜드 협업, 상권 유입 인구 증대", "비예산"],
            ["오뚜기", "통닭거리 '소상공인 공구 프로젝트', 지역 먹거리 + 유통망 결합", "진행 중 / 비예산"],
            ["경희대학교", "로컬콘텐츠중점대학 — 학생·교수·상인 연결, 팝업 4개소", "예산"],
            ["아주대학교", "파란학기제 등 — '로컬 캠퍼스' 역할", "비예산"],
          ],
          { widths: [20, 60, 20] }
        ),
        spacer(40),
        calloutBox("상권의 가치가 입증되면서 자생적으로 유치된 협업으로, 사업비 없이도 대기업 마케팅 자원 활용이 가능한 구조가 형성됨."),

        // ── 9. 교육 ──
        sectionTitle("9. 소상공인 역량 강화 — '깍스쿨' 교육 및 컨설팅"),

        subTitle("가. 교육 프로그램 (깍스쿨)"),
        makeTable(
          ["회차", "일자", "강의 내용", "인원", "강사"],
          [
            ["1", "2024.12.26", "행궁동의 환대, 기업가 정신 함양", "26", "박승현"],
            ["2", "2024.12.27", "매장 환대 인프라 조성", "23", "박필관"],
            ["3", "2024.12.30", "환대의 말하기 듣기, 단골 만들기", "22", "이채은"],
            ["4", "2025.01.07", "사업계획서의 기초", "24", "김다빈"],
            ["5", "2025.01.13", "효과적인 홍보·마케팅 전략", "24", "임향미"],
            ["6", "2025.01.14", "정부 지원 사업 활용 노하우", "19", "장예원"],
            ["7", "2025.01.20", "IR교육 (사업계획서 작성)", "19", "장부"],
            ["8", "2025.02.07", "IR교육 (발표자료 작성)", "11", "민욱조"],
            ["9", "2025.02.10", "브랜딩 및 디자인 도입, 고도화 전략", "10", "마지연"],
            ["10", "2025.02.24", "'온라인 간판' 만들기 (구글맵, 트립어드바이저)", "7", "이승훈"],
            ["", "", "총 누적 참여", "185명", "전문 강사 12인"],
          ],
          { widths: [8, 15, 42, 10, 15], totalRow: 10, highlightRows: [9], alignCols: [AlignmentType.CENTER, , , AlignmentType.CENTER] }
        ),
        bullet([txt("평균 만족도: "), txt("4.41점", { bold: true, color: C.emerald }), txt(" (5점 만점)")]),
        bullet("온라인 마케팅 및 정부지원사업 활용 교육 만족도 최고 → 실제 신청·등록 성과로 연결"),
        spacer(60),

        subTitle("나. 1:1 맞춤 컨설팅"),
        makeTable(
          ["항목", "실적"],
          [
            ["총 컨설팅 수", "138건"],
            ["참여 업체", "27개 팀"],
            ["참여 전문가", "12명"],
            ["운영 기간", "2024.12 ~ 2025.02 (사전 컨설팅 2024.11)"],
            ["분야", "홍보 마케팅, 디지털 전환, 브랜드, F&B, 경영, IR"],
          ],
          { widths: [30, 70] }
        ),
        bullet("컨설팅 이후 스마트스토어, 온라인 홍보 이미지 등 매출·조회수 성과 확인"),
        bullet("일부 점포는 정부지원사업에 도전 → 사업 성장 모멘텀 형성"),
        spacer(60),

        subTitle("다. 스케일업 성과 (국비 연계)"),
        makeTable(
          ["항목", "실적"],
          [
            ["정부지원사업 신청", "8개 팀"],
            ["강한소상공인 선정", "3팀 (비예산/전국 경쟁)"],
            ["로컬크리에이터 선정", "1팀 (비예산/경쟁)"],
            ["선진지 답사", "14개 팀 참가 (목포·공주·인천)"],
          ],
          { widths: [30, 70] }
        ),
        spacer(60),

        subTitle("라. 선진지 답사"),
        bullet("유휴공간 활용, 노포와 청년 창업의 융합, 마을 기반 콘텐츠 기획 등 전략을 현장 관찰"),
        bullet("참여자 간 네트워킹을 통한 협업 프로젝트 기획 활성화"),

        // ── 10. 거버넌스 ──
        sectionTitle("10. 상권 거버넌스 구축 — 사단법인 행궁동행 (비예산)"),
        makeTable(
          ["항목", "실적"],
          [
            ["설립회원", "50명"],
            ["성격", "단순 친목 단체가 아닌 실질적 상권 관리 기구로 법인화"],
            ["주요 지원", "통닭거리 상인회 로컬 브랜딩 기획, '수월래' 축제 기획 및 운영"],
            ["추진 방식", "비예산 — 상인 자발적 참여 기반"],
          ],
          { widths: [20, 80] }
        ),
        para("향후 '사단법인 행궁동행'이 상권관리자로서의 역할을 담당하며, 환대의 커뮤니티 BI 및 인스펙터 시스템과 연계 운영 예정."),

        // ── 11. 전국 확산 ──
        sectionTitle("11. 성과의 전국 확산"),
        makeTable(
          ["확산 사례", "내용"],
          [
            ["제주 '귤메달' × 오뚜기", "수원발 로컬 브랜드 협업 모델을 전국 단위로 확장, 협업 프로젝트 성사"],
            ["2025 글로컬페스타", "중소벤처기업부 주관, 54팀 참여 — 상권 활성화 성공 사례 공유 및 확산 주도"],
            ["대전시 상권 분석", "AI 기반 상권 분석 노하우 및 서사 기획(로컬디인사이트) 방법론 이식"],
          ],
          { widths: [30, 70] }
        ),

        // ── 12. 결론 ──
        sectionTitle("12. 결론 및 향후 방향"),
        para([
          txt("2024년이 '가능성'을 확인하고 '사람'을 키우는 단계였다면, 2025년은 그 사람과 콘텐츠가 온라인을 통해 전 세계와 연결되는 "),
          txt("'확장'의 원년", { bold: true, color: C.steelBlue }),
          txt("이었음."),
        ]),
        spacer(40),
        makeTable(
          ["성과 영역", "근거"],
          [
            ["고부가가치 전환", "방문객 +40%, 소비액 +107% — 양보다 질"],
            ["글로벌 디지털 접근성", "'온라인 간판' + GoSuwon + 4개국어 SNS"],
            ["서비스 품질 체계화", "환대지수 64→89점, 미스터리 쇼퍼-인스펙터 선순환"],
            ["자생적 구조", "대기업·대학 비예산 협업 유치, 상인 주도 협업 20→142회"],
            ["역량 내재화", "외부 컨설턴트 의존 → 자체 역량 전환"],
            ["거버넌스 구축", "사단법인 행궁동행 설립 (50명)"],
            ["전국 확산", "제주·대전·글로컬페스타로 모델 전파"],
          ],
          { widths: [30, 70] }
        ),
        spacer(60),
        calloutBox("⇒ 소상공인 스케일업의 지속 지원을 통해 수원 행궁동을 대한민국 대표 K상권으로 도약시킬 필요가 있음."),
        spacer(200),
      ],
    },
  ],
});

// ─── 저장 ───
const buffer = await Packer.toBuffer(doc);
const outPath = "C:/Users/Administrator/projects/Project_Playbook/mini-projects/박승현/글로컬상권-성과/글로컬상권-성과-종합보고.docx";
fs.writeFileSync(outPath, buffer);
console.log("✅ 생성 완료:", outPath);
console.log("📄 파일 크기:", (buffer.length / 1024).toFixed(1), "KB");
