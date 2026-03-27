const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// 스타일 — 2장 압축용 (작은 폰트, 좁은 간격)
const sz = 16; // 기본 8pt
const szS = 14; // 표 안 7pt
const font = "맑은 고딕";
const thin = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorderBottom = { top: thin, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: thin, right: thin };

const titleP = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text, bold: true, size: 32, font })] });
const sub = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text, size: sz, font, color: "666666" })] });
const h1 = (text) => new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text, bold: true, size: 22, font })] });
const h2 = (text) => new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text, bold: true, size: 18, font })] });
const p = (text) => new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text, size: sz, font })] });
const pB = (text) => new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text, bold: true, size: sz, font })] });
const gap = () => new Paragraph({ spacing: { after: 40 }, children: [] });

// 셀 헬퍼
function hCell(text, width, color = "2C3E50") {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: szS, font, color: "FFFFFF" })] })],
    borders
  });
}
function dCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold: !!opts.bold, size: szS, font, color: opts.color || "000000" })]
    })],
    borders
  });
}

// 노드 헤더 행 (1행짜리)
function nodeRow(date, title, who, dur, color) {
  return new TableRow({ children: [
    new TableCell({ shading: { type: ShadingType.SOLID, color }, width: { size: 12, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: date, bold: true, size: szS, font, color: "FFFFFF" })] })], borders }),
    new TableCell({ shading: { type: ShadingType.SOLID, color }, width: { size: 30, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: szS, font, color: "FFFFFF" })] })], borders }),
    new TableCell({ shading: { type: ShadingType.SOLID, color }, width: { size: 18, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: who, size: szS, font, color: "FFFFFF" })] })], borders }),
    new TableCell({ shading: { type: ShadingType.SOLID, color }, width: { size: 40, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: dur, size: szS, font, color: "FFFFFF" })] })], borders }),
  ]});
}

// 과제 행
function taskRow(task, status, response, growth) {
  const sc = status === "완료" ? "27AE60" : status === "진행중" ? "D4AC0D" : "E74C3C";
  const sb = status === "완료" ? "E8F8F5" : status === "진행중" ? "FEF9E7" : "FDEDEC";
  return new TableRow({ children: [
    dCell(task, 12),
    dCell(status, 30, { bg: sb, color: sc, bold: true, center: true }),
    dCell(response, 18),
    dCell(growth, 40),
  ]});
}

// ========== 문서 ==========
const doc = new Document({
  sections: [
    // ===== PAGE 1: 타임라인 + 노드별 핵심 =====
    {
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: [
        titleP("CSP × 신도시  회의 과제추적표"),
        sub("노드 기반 시계열 추적  |  3개 노드 (03.05 / 03.13 / 03.23)  |  작성: 이승훈"),
        gap(),

        // 타임라인 총괄 표
        h1("타임라인 총괄"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [
            hCell("일자", 12), hCell("회의 주제", 30), hCell("참석", 18), hCell("핵심 결정", 40)
          ]}),
          nodeRow("03-05", "슈퍼파트너 전략 + IR 전면개편", "박승현, 이승훈", "3단계 로드맵 확정 / 무료+3% 수수료 / IR FI 버전 전환", "2980B9"),
          nodeRow("03-13", "MVP 빌드 확인 + 로컬 재정립", "박승현, 김민호", "1~2개월 MVP 가능 확인 / 로컬 중심 방향 재확인 / 전국 네트워크 규합", "27AE60"),
          nodeRow("03-23", "실전 단계 진입 + 업무 정비", "박승현, 이승훈", "AX 실전 모델 구체화 / 홈페이지 개편 / 업무 자동화 착수", "E67E22"),
        ]}),

        gap(),

        // 성장 궤적
        h1("3주간 흐름 정리"),

        h2("IR 기획서 변화"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("이전 (v1)", 33, "95A5A6"), hCell("03-09 (v2)", 34, "2980B9"), hCell("03-10 (v3)", 33, "27AE60")] }),
          new TableRow({ children: [
            dCell("가치 중심. 숫자 부족하다는 피드백", 33),
            dCell("구독 없앰. 무료+3% 수수료. 데이터 판매가 핵심", 34),
            dCell("CSP 파트너십 추가. KCD 실적 벤치마크. 기술 가능 논거", 33),
          ]}),
        ]}),

        gap(),

        h2("개발/기술 쪽 변화"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("03-05", 33, "2980B9"), hCell("03-13", 34, "27AE60"), hCell("03-23", 33, "E67E22")] }),
          new TableRow({ children: [
            dCell("자체 개발 가능한지 확신 없는 상태", 33),
            dCell("김민호가 클로드코드로 직접 빌드 가능 확인", 34),
            dCell("AI 도구 실전 활용 중. 업무 자동화 루프 돌리기 시작", 33),
          ]}),
        ]}),

        gap(),

      ]
    },

    // ===== PAGE 2: 과제 상태 + 종합 평가 =====
    {
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: [
        h1("핵심 과제 상태 추적"),
        gap(),

        // NODE 1 과제
        h2("03-05 회의에서 나온 것"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("과제", 22), hCell("상태", 10), hCell("우리가 한 것", 34), hCell("의미", 34)] }),
          taskRow("IR 자료 보강", "완료", "v2(03-09)+v3(03-10) 만들어서 넘김", "피드백 받고 바로 반영함"),
          taskRow("유통사 단가 확인", "진행중", "CSP 네트워크로 유통 파트너 연결 중", "직접 뛰는 것보다 경로가 생김"),
          taskRow("개발 리소스 정리", "완료", "MVP 기획서 바탕으로 김민호가 직접 빌드 착수", "기획서가 있으니까 바로 만들 수 있게 됨"),
        ]}),

        gap(),

        // NODE 2 과제
        h2("03-13 회의에서 나온 것"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("과제", 22), hCell("상태", 10), hCell("우리가 한 것", 34), hCell("의미", 34)] }),
          taskRow("MVP 개발 착수 (4월 목표)", "진행중", "게시판형부터 가볍게 시작. 클로드코드 활용", "만들 수 있다는 확신이 생긴 시점"),
          taskRow("전국 로컬 네트워크 규합", "미착수", "대전/울산/제주 기존 네트워크 활용 구상", "멀티허브 확장의 씨앗"),
          taskRow("1개월 성과 + 3개월 로드맵 맵핑", "진행중", "각자 성장 경로를 그림으로 정리 중", "같은 방향 보고 있는지 점검"),
        ]}),

        gap(),

        // NODE 3 과제
        h2("03-23 회의에서 나온 것"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("과제", 22), hCell("상태", 10), hCell("우리가 한 것", 34), hCell("의미", 34)] }),
          taskRow("홈페이지 슈퍼파트너 섹션", "미착수", "사업 안내 + 홍보 페이지 기획", "외부에서 봤을 때 뭐 하는 곳인지 보여줘야 함"),
          taskRow("업무 자동화 로드맵", "미착수", "어떤 업무를 AI로 돌릴 수 있는지 정리", "실제로 쓸 수 있는 자동화 찾기"),
          taskRow("노션 대시보드 구축", "미착수", "김민호 자문 예정. 도구 확정 필요", "흩어진 업무를 한 곳에서 보기"),
        ]}),

        gap(), gap(),

        // 종합 평가
        h1("종합 평가"),
        gap(),

        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [
            hCell("잘 된 것", 50, "27AE60"),
            hCell("신경 써야 할 것", 50, "E74C3C"),
          ]}),
          new TableRow({ children: [
            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders, children: [
              p("• IR 피드백 받고 3일 만에 v2/v3 완성"),
              p("• 외부 의견 듣고 로컬 중심으로 방향 재조정"),
              p("• \"개발 못 한다\"에서 \"직접 만든다\"로 전환"),
              p("• 기획서 기반으로 MVP 빌드 바로 시작됨"),
            ]}),
            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders, children: [
              p("• 03-23 과제들 아직 시작 못 함"),
              p("• 전국 네트워크 규합은 아직 말뿐"),
              p("• MVP 4월 런칭인데 진척 확인 필요"),
              p("• 홈페이지/대시보드 등 인프라 작업 밀려있음"),
            ]}),
          ]}),
        ]}),

        gap(),

        h2("다음 회의 때 꼭 다룰 것"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ children: [hCell("No.", 10), hCell("안건", 50), hCell("기대 산출물", 40)] }),
          new TableRow({ children: [dCell("1", 10, {center:true}), dCell("MVP 어디까지 됐는지 공유", 50), dCell("데모 또는 기능 목록", 40)] }),
          new TableRow({ children: [dCell("2", 10, {center:true}), dCell("유통 파트너 연결 현황", 50), dCell("접촉 업체 리스트 + 단가 비교", 40)] }),
          new TableRow({ children: [dCell("3", 10, {center:true}), dCell("홈페이지 슈퍼파트너 섹션 기획안", 50), dCell("페이지 구성 초안", 40)] }),
          new TableRow({ children: [dCell("4", 10, {center:true}), dCell("업무 자동화 어디부터 할지 정리", 50), dCell("자동화 대상 업무 리스트", 40)] }),
        ]}),
      ]
    }
  ]
});

const outputPath = "C:/Users/leeha/OneDrive/바탕 화면/DB/산출물/회의록/CSP회의-과제추적표-v2-20260326.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("저장 완료:", outputPath);
});
