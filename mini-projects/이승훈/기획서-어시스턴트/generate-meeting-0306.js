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
const bullet2 = (text) => new Paragraph({ bullet: { level: 1 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });

// ========== 표 헬퍼 ==========
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const headerCell = (text, width) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  shading: { type: ShadingType.SOLID, color: "2C3E50" },
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })]
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
      title("로컬 창업 및 상권 활성화 전략"),
      subtitle("회의록 요약"),
      empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "2026. 3. 6.(목) | 180분", size: 22, font: "맑은 고딕" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "참석: 박승현, 이승훈, 중기부 서기관, 중기부 사무관, 지역 기획자", size: 20, font: "맑은 고딕", color: "666666" })] }),
      empty(), empty(), empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "공존공간", bold: true, size: 28, font: "맑은 고딕" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONFIDENTIAL — 내부 공유용", size: 18, font: "맑은 고딕", color: "999999" })] }),

      // === 1. 한줄 요약 ===
      empty(), empty(),
      h1("1. 회의 요약"),
      p("중기부에서 로컬 창업 및 상권 활성화 지원사업 설계에 앞서 현장 의견을 청취하는 자리. 중기부 측에서 립스 3(투자 가치 기반 보증 상품) 추진 계획을 공유하였고, 현장에서는 상권 기획자 육성, 글로컬 마케팅 실무 지원, 지방비 매칭 구조 개선 등을 건의함."),
      empty(),

      // === 2. 핵심 결정사항 ===
      h1("2. 주요 논의사항"),
      empty(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            headerCell("논의사항", 30),
            headerCell("내용", 50),
            headerCell("성격", 20),
          ]}),
          new TableRow({ children: [
            cellBold("립스 3(LIPS 3)", 30),
            cell("기업 가치와 투자 실적에 연동된 보증 상품. 기존 매출 채권 기반 대출의 한계를 극복하여 로컬 기업의 자본 확충 지원", 50),
            cell("중기부 추진 예정", 20),
          ]}),
          new TableRow({ children: [
            cellBold("상권 기획자 역할 재정의", 30),
            cell("단순 행정 용역사가 아닌, 투자와 운영을 병행하며 상권의 가치를 높이는 액셀러레이터(AA 모델)로 육성 필요", 50),
            cell("현장 건의", 20),
          ]}),
          new TableRow({ children: [
            cellBold("글로컬 상권 실무 지원 강화", 30),
            cell("화려한 축제보다 구글 맵 등록, 샤오홍슈 마케팅 등 외국인 유입에 직결되는 실무 인프라 지원이 더 효과적이었음", 50),
            cell("현장 사례 공유", 20),
          ]}),
          new TableRow({ children: [
            cellBold("지방비 매칭 구조 개선", 30),
            cell("현금 매칭 부담으로 인한 사업 포기를 방지하기 위해 현물(부동산, 인프라) 매칭 인정 요청", 50),
            cell("현장 건의", 20),
          ]}),
          new TableRow({ children: [
            cellBold("상권 혁신 펀드 수익 모델", 30),
            cell("비상장 로컬 기업의 엑시트 한계를 고려하여 배당 중심의 리츠 모델이나 별도 회수 구조 설계 필요", 50),
            cell("현장 건의", 20),
          ]}),
        ]
      }),
      empty(),

      // === 3. 토픽별 논의 요약 ===
      h1("3. 논의 요약"),

      h2("가. 로컬 금융 시스템 고도화 (립스 3) — 중기부 추진 예정"),
      p("중기부에서 립스 3 모델 추진 계획을 공유함. 기존 소상공인 지원 시스템이 자산 규모나 대출 한도에 묶여 성장하는 로컬 기업(라이콘 등)을 지원하지 못하는 한계를 인식하고 있음."),
      p("투자 유치 금액이나 기업 가치를 기준으로 보증을 제공하는 새로운 금융 상품을 설계 중임."),
      p("로컬 기업이 제도권 금융에서 탈피해 투자 기반으로 성장할 수 있는 발판을 마련하는 것이 목적임."),
      empty(),

      h2("나. 상권 기획자의 실질적 역할과 수익 구조"),
      p("상권 기획자가 단순히 정부 예산을 집행하는 용역사에 머물러서는 상권이 자생력을 가질 수 없음을 강조함."),
      p("일본의 분리형(AB) 모델보다 한국 실정에 맞는 운영-기획 통합형(AA) 모델을 지향함."),
      p("기획자가 상권 내 기업에 직접 투자하거나 수익을 쉐어하는 구조(IP 쉐어)가 필요함."),
      p("상권 사업비의 일정 비율(약 30%)을 창업자 대투(Direct Investment)로 전환하는 방안이 논의됨."),
      empty(),

      h2("다. 글로컬 상권의 마케팅 및 데이터 전략"),
      p("수원 행궁동 사례를 통해 외국인 관광객 유입을 위한 구체적인 방법론이 공유됨."),
      p("단순히 예쁜 패키징보다 구글 맵 등록, 샤오홍슈(중화권 SNS) 마케팅, 외국인 결제 편의성 등 '보이지 않는 인프라'가 매출(107% 증가)에 더 큰 영향을 미쳤음을 확인함."),
      p("향후 글로컬 상권 사업에서 디지털 전환(DX) 지원을 필수 과제로 포함하기로 함."),
      empty(),

      h2("라. 지역 상권 펀드와 부동산 연계"),
      p("지역 소멸 대응 기금 등을 활용하여 구도심의 유휴 공간(조선소 부지, 폐공장 등)을 매입하고 로컬 기업의 거점으로 활용하는 '리츠(REITs)' 방식의 투자가 제안됨."),
      p("벤처 캐피탈(VC)이나 액셀러레이터(AC)가 상권 기획자(GP)가 되어 지역 부동산 가치를 높이고 배당을 받는 구조를 설계해야 함."),
      p("신도시 JV 설립 및 자본 확충 전략을 상권 전체로 확대한 모델임."),
      empty(),

      h2("마. 정부 지원 사업의 유연성 확보"),
      p("지방비 매칭(현금 50% 등)이 가난한 기초 지자체에게는 큰 장벽이 되어 우수한 민간 기획자가 있어도 사업 신청을 못 하는 모순을 지적함."),
      p("지자체가 보유한 유휴 공간을 현물로 매칭하거나, 민간이 먼저 기획안을 던지면 지자체가 협력하는 '역제안 방식'의 도입이 건의됨."),
      p("AI 활용 지원 사업(2,000만 원 규모) 등을 로컬 기업에 적극 연계하여 운영 효율화를 꾀하기로 함."),
      empty(),

      // === 하단 ===
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "— 끝 —", size: 20, font: "맑은 고딕", color: "999999" })]
      }),
      empty(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "공존공간 | 2026. 3. 11. 작성", size: 16, font: "맑은 고딕", color: "AAAAAA" })]
      }),
    ]
  }]
});

// ========== 파일 생성 ==========
const OUTPUT = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\회의록-2026-03-06-로컬창업전략.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("완료:", OUTPUT);
});
