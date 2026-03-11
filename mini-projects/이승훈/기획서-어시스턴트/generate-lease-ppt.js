const PptxGenJS = require("pptxgenjs");
const fs = require("fs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "공존공간";
pptx.title = "공존공간 임대 안내서";

// ========== 공존공간 브랜드 컬러 (흰 배경) ==========
const BLACK = "000000";
const WHITE = "FFFFFF";
const ACCENT = "00C853";   // 딥그린 (공존공간 시그니처)
const ORANGE = "E74C3C";   // 빨간 강조 (입점불가)
const DARK_GRAY = "212121";
const MID_GRAY = "777777";
const LIGHT_BG = "F5F5F5";
const TABLE_BG = "FAFAFA";
const LINE = "E0E0E0";

// ========== 평면도 이미지 경로 ==========
const FLOOR_B1 = "C:\\Users\\leeha\\Downloads\\공존공간 평면도 도면집_페이지_1_수정.jpg";
const FLOOR_1F = "C:\\Users\\leeha\\Downloads\\공존공간 평면도 도면집_페이지_2.jpg";

// ========== 슬라이드 1: 표지 ==========
let slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addText("공존공간", { x: 1.5, y: 1.8, w: 10, h: 1.5, fontSize: 52, bold: true, color: BLACK, fontFace: "맑은 고딕" });
slide.addText("임대 안내서", { x: 1.5, y: 3.3, w: 10, h: 0.8, fontSize: 28, color: ACCENT, fontFace: "맑은 고딕" });
slide.addShape(pptx.ShapeType.rect, { x: 1.5, y: 4.3, w: 3, h: 0.04, fill: { color: ACCENT } });
slide.addText("경기 수원시 팔달구 화서문로 45번길 32 공존공간", { x: 1.5, y: 4.6, w: 10, h: 0.5, fontSize: 16, color: MID_GRAY, fontFace: "맑은 고딕" });
slide.addText("2026. 3.", { x: 1.5, y: 5.1, w: 10, h: 0.5, fontSize: 14, color: MID_GRAY, fontFace: "맑은 고딕" });

// ========== 슬라이드 2: 회사 소개 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });

slide.addText("공존공간", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

slide.addText([
  { text: "LIFESTYLE ", options: { fontSize: 36, bold: true, color: BLACK, fontFace: "맑은 고딕" } },
  { text: "NEARBY", options: { fontSize: 36, bold: true, color: ACCENT, fontFace: "맑은 고딕" } },
], { x: 1, y: 1.6, w: 11, h: 0.8 });

slide.addShape(pptx.ShapeType.rect, { x: 1, y: 2.6, w: 2.5, h: 0.04, fill: { color: ACCENT } });

slide.addText("창의적인 도시를 위해, 로컬과 커뮤니티에\n새로운 흐름을 제안하는 행궁동 지역경영회사", {
  x: 1, y: 3.0, w: 11, h: 1.0, fontSize: 18, color: MID_GRAY, fontFace: "맑은 고딕", lineSpacingMultiple: 1.5
});

slide.addShape(pptx.ShapeType.roundRect, { x: 1, y: 4.3, w: 11, h: 2.6, fill: { color: LIGHT_BG }, rectRadius: 0.1 });

slide.addText("주식회사 공존공간은 로컬을 기반으로 도시문화기획과 콘텐츠를 통해 도시에 새로운 비즈니스 모델을 제안하는 지역경영회사입니다.", {
  x: 1.5, y: 4.6, w: 10, h: 0.8, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕", lineSpacingMultiple: 1.5
});

slide.addText("삶과 라이프스타일을 담은 복합문화공간으로써, 가장 가까운 곳에서 일상을 영위할 수 있도록 다양한 콘텐츠를 기획·운영하고 있습니다.", {
  x: 1.5, y: 5.4, w: 10, h: 0.8, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕", lineSpacingMultiple: 1.5
});

// ========== 슬라이드 3: 건물 개요 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("건물 개요", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

const buildingRows = [
  ["건물명", "공존공간"],
  ["소재지", "경기 수원시 팔달구 화서문로 45번길 32 공존공간"],
  ["건물 용도", "근린주택 (제2종 근린생활시설 + 일반음식점)"],
  ["설계", "건축사사무소 지오(GEO)"],
  ["임대 가능 층", "지하 1층, 지상 1층"],
].map(([label, value]) => [
  { text: label, options: { fontSize: 15, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "left", fill: { color: ACCENT } } },
  { text: value, options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "left", fill: { color: TABLE_BG } } },
]);

slide.addTable(buildingRows, {
  x: 1, y: 1.8, w: 11,
  border: { type: "solid", pt: 0.5, color: LINE },
  colW: [3, 8],
  rowH: [0.7, 0.7, 0.7, 0.7, 0.7],
  margin: [8, 15, 8, 15],
});

// ========== 슬라이드 4: 지하 1층 평면도 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("평면도 — 지하 1층", { x: 1, y: 0.3, w: 11, h: 0.7, fontSize: 28, bold: true, color: BLACK, fontFace: "맑은 고딕" });
slide.addImage({ path: FLOOR_B1, x: 1.5, y: 1.2, w: 10, h: 5.8 });

// ========== 슬라이드 5: 지하 1층 임대 조건 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("임대 조건 — 지하 1층", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

const b1Rows = [
  [
    { text: "구분", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "면적", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "보증금", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "월세", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "입주 시기", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
  ],
  [
    { text: "전체", options: { fontSize: 15, bold: true, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "약 45.9평", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "1억 2,000만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "1,200만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "3개월 내 (별도 협의)", options: { fontSize: 15, color: ORANGE, bold: true, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
  ],
];

slide.addTable(b1Rows, {
  x: 1, y: 2.0, w: 11,
  border: { type: "solid", pt: 0.5, color: LINE },
  colW: [1.8, 2, 2.5, 2.2, 2.5],
  rowH: [0.7, 0.8],
  margin: [8, 10, 8, 10],
});

slide.addText("※ 부가세 별도", { x: 1, y: 3.6, w: 11, h: 0.4, fontSize: 13, color: MID_GRAY, fontFace: "맑은 고딕" });
slide.addText("용도: 제2종 근린생활시설 / 일반음식점", { x: 1, y: 4.0, w: 11, h: 0.4, fontSize: 13, color: MID_GRAY, fontFace: "맑은 고딕" });

// ========== 슬라이드 6: 1층 평면도 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("평면도 — 지상 1층", { x: 1, y: 0.3, w: 11, h: 0.7, fontSize: 28, bold: true, color: BLACK, fontFace: "맑은 고딕" });
slide.addImage({ path: FLOOR_1F, x: 1.5, y: 1.2, w: 10, h: 5.8 });

// ========== 슬라이드 7: 1층 임대 조건 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("임대 조건 — 지상 1층", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

const f1Rows = [
  [
    { text: "구분", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "면적", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "보증금", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "월세", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
    { text: "입주 시기", options: { fontSize: 14, bold: true, color: WHITE, fontFace: "맑은 고딕", align: "center", fill: { color: ACCENT } } },
  ],
  [
    { text: "전체", options: { fontSize: 15, bold: true, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "약 40평", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "8,500만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "850만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "즉시 가능", options: { fontSize: 15, color: ACCENT, bold: true, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
  ],
  [
    { text: "반쪽", options: { fontSize: 15, bold: true, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "약 20평", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "4,700만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "470만 원", options: { fontSize: 15, color: DARK_GRAY, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
    { text: "즉시 가능", options: { fontSize: 15, color: ACCENT, bold: true, fontFace: "맑은 고딕", align: "center", fill: { color: TABLE_BG } } },
  ],
];

slide.addTable(f1Rows, {
  x: 1, y: 2.0, w: 11,
  border: { type: "solid", pt: 0.5, color: LINE },
  colW: [1.8, 2, 2.5, 2.2, 2.5],
  rowH: [0.7, 0.8, 0.8],
  margin: [8, 10, 8, 10],
});

slide.addText("※ 부가세 별도", { x: 1, y: 4.4, w: 11, h: 0.4, fontSize: 13, color: MID_GRAY, fontFace: "맑은 고딕" });
slide.addText("용도: 제2종 근린생활시설 / 일반음식점", { x: 1, y: 4.8, w: 11, h: 0.4, fontSize: 13, color: MID_GRAY, fontFace: "맑은 고딕" });

// ========== 슬라이드 8: 입점 가능 업종 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("입점 가능 업종", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

slide.addText("대부분의 업종 입점 가능", { x: 1, y: 1.5, w: 11, h: 0.6, fontSize: 20, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
slide.addText("제2종 근린생활시설 및 일반음식점 용도에 해당하는 업종", { x: 1, y: 2.0, w: 11, h: 0.5, fontSize: 14, color: MID_GRAY, fontFace: "맑은 고딕" });

// 가능 업종
const possibleList = ["음식점 (한식, 양식, 일식, 카페 등)", "소매점 / 편의점", "사무실 / 공유 오피스", "학원 / 교육 시설", "미용실 / 네일샵", "기타 근린생활시설"];
slide.addShape(pptx.ShapeType.roundRect, { x: 1, y: 2.8, w: 5.2, h: 4, fill: { color: LIGHT_BG }, rectRadius: 0.1 });
slide.addText("입점 가능", { x: 1.3, y: 2.9, w: 4.5, h: 0.5, fontSize: 16, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
possibleList.forEach((item, i) => {
  slide.addText("✓  " + item, { x: 1.5, y: 3.4 + i * 0.5, w: 4.5, h: 0.4, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕" });
});

// 불가 업종
const impossibleList = ["뽑기방", "포토부스", "유해 시설", "무인샵"];
slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 2.8, w: 5.2, h: 4, fill: { color: LIGHT_BG }, rectRadius: 0.1 });
slide.addText("입점 불가", { x: 7.1, y: 2.9, w: 4.5, h: 0.5, fontSize: 16, bold: true, color: ORANGE, fontFace: "맑은 고딕" });
impossibleList.forEach((item, i) => {
  slide.addText("✗  " + item, { x: 7.3, y: 3.4 + i * 0.5, w: 4, h: 0.4, fontSize: 14, color: ORANGE, fontFace: "맑은 고딕" });
});

// ========== 슬라이드 9: 주차 + 문의 ==========
slide = pptx.addSlide();
slide.background = { color: WHITE };
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: ACCENT } });
slide.addText("주차 및 문의", { x: 1, y: 0.5, w: 11, h: 0.8, fontSize: 32, bold: true, color: BLACK, fontFace: "맑은 고딕" });

// 주차
slide.addShape(pptx.ShapeType.roundRect, { x: 1, y: 1.6, w: 11, h: 1.6, fill: { color: LIGHT_BG }, rectRadius: 0.1 });
slide.addText("주차 안내", { x: 1.5, y: 1.8, w: 10, h: 0.5, fontSize: 18, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
slide.addText("•  주차 대수는 임차인과 별도 조율 가능", { x: 1.5, y: 2.3, w: 10, h: 0.4, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕" });
slide.addText("•  건물 인근 영화동 사설 주차장 저렴하게 이용 가능", { x: 1.5, y: 2.7, w: 10, h: 0.4, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕" });

// 문의
slide.addShape(pptx.ShapeType.roundRect, { x: 1, y: 3.8, w: 11, h: 2.8, fill: { color: LIGHT_BG }, rectRadius: 0.1 });
slide.addShape(pptx.ShapeType.rect, { x: 1, y: 3.8, w: 11, h: 0.06, fill: { color: ACCENT } });
slide.addText("문의", { x: 1.5, y: 4.1, w: 10, h: 0.5, fontSize: 20, bold: true, color: BLACK, fontFace: "맑은 고딕" });
slide.addText("담당", { x: 1.5, y: 4.7, w: 2, h: 0.4, fontSize: 14, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
slide.addText("공존공간", { x: 3.5, y: 4.7, w: 8, h: 0.4, fontSize: 14, color: DARK_GRAY, fontFace: "맑은 고딕" });
slide.addText("연락처", { x: 1.5, y: 5.2, w: 2, h: 0.4, fontSize: 14, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
slide.addText("[연락처 기입]", { x: 3.5, y: 5.2, w: 8, h: 0.4, fontSize: 14, color: MID_GRAY, fontFace: "맑은 고딕" });
slide.addText("이메일", { x: 1.5, y: 5.7, w: 2, h: 0.4, fontSize: 14, bold: true, color: ACCENT, fontFace: "맑은 고딕" });
slide.addText("[이메일 기입]", { x: 3.5, y: 5.7, w: 8, h: 0.4, fontSize: 14, color: MID_GRAY, fontFace: "맑은 고딕" });

// ========== 파일 생성 ==========
const OUTPUT = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\공존공간-임대안내서.pptx";

pptx.writeFile({ fileName: OUTPUT }).then(() => {
  console.log("완료:", OUTPUT);
});
