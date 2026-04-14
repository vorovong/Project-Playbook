const docx = require("docx");
const fs = require("fs");
const path = require("path");

const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

const FONT = "함초롬바탕";
const SZ = 20;

function p(text, opts = {}) {
  const { bold, center } = opts;
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : undefined,
    children: [new TextRun({ text, font: FONT, size: SZ, bold: !!bold })]
  });
}

function pMulti(runs) {
  return new Paragraph({
    children: runs.map(r => new TextRun({ text: r.text, font: FONT, size: SZ, bold: !!r.bold }))
  });
}

function empty() {
  return new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: SZ })] });
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1134, bottom: 851, left: 1701, right: 1701 },
        size: { width: 11906, height: 16838 }
      }
    },
    children: [
      empty(),

      // 제목
      p("시 설 공 사 계 약 서", { bold: true, center: true }),
      empty(),

      // 공급자
      pMulti([
        { text: " (공급자)", bold: true },
        { text: " 주  소 : 경기도 화성시 반월동 973 110-301" }
      ]),
      p("          상  호 : 파파설비 ( 등록번호 : 144 – 21 - 02185 )"),
      p("      대 표 자 명 : 이상윤"),
      p("      연  락  처 : 010 – 7679 - 1292"),
      empty(),

      // 계약자
      pMulti([
        { text: " (계약자)", bold: true },
        { text: " 주  소 : 세종특별자치시 고운서길 16 102-8호" }
      ]),
      p("          상  호 : 씨에스피 주식회사 ( 등록번호 : 337-87-03633 )"),
      p("      대 표 자 명 : 민욱조"),
      p("      연  락  처 : 010-4945-1115"),
      empty(),

      // 체결 문구
      p(" 상기의 양 당사자를 각각 \u201C공급자\u201D \u201C계약자\u201D 라고 말하고 다음과 같이 체결한다"),
      empty(),

      // 계약 내용
      p("- 계 약 내 용 -", { bold: true, center: true }),
      empty(),

      p(" 공  사  명 : 인테리어 공사"),
      p(" 공 사 기 간 : 2026년 4월 14일 ~ 2026년 4월 16일 ( 총 3일 )"),
      p(" A/S 기  간 : 2년"),
      empty(),

      // 공사비
      p("- 공사비 -", { bold: true, center: true }),
      empty(),

      p("      계 약 금 액 : 일금  오백육십일만원 (\u20A9 5,610,000 원)"),
      p("      선  수  금 : 일금  이백팔십일만오천원 (\u20A9 2,805,000 원)"),
      p("      잔       금 : 일금  이백이십사만사천원 (\u20A9 2,244,000 원)"),
      p("      유  보  금 : 일금  오십육만일천원 (\u20A9 561,000 원)"),
      empty(),

      // 제1조 (기존 그대로)
      p("제 1 조 ( 대금의 지급 및 유보금 )", { bold: true, center: true }),
      p(" \u2460 총 공사금액은 금 오백육십일만원 (VAT 포함)으로 한다."),
      p(" \u2461 계약자는 공사 완료 후 공사대금의 90%를 지급하고 나머지 10%는 하자보수보증금(유보금)으로 유보한다."),
      p(" \u2462 유보금은 공사완료 시점으로부터 3개월내로 지급한다."),
      p(" \u2463 하자 발생시 공급자는 즉시 보수해야하며, 이를 이행하지 않을 경우 계약자는 유보금에서 보수비를 공제할 수 있다."),
      p(" \u2464 견적서 2장 별첨"),
      empty(),

      // 제2조 (신규)
      p("제 2 조 ( 별첨 견적서의 효력 )", { bold: true, center: true }),
      p(" \u2460 별첨 견적서는 본 계약의 일부로서 동일한 효력을 가진다."),
      p(" \u2461 견적서에도 양측(공급자, 계약자) 서명을 받는다."),
      empty(),

      // 제3조 (신규)
      p("제 3 조 ( 검수 및 잔금 지급 )", { bold: true, center: true }),
      p(" \u2460 공급자는 공사 완료 후 계약자에게 완료 통보를 하고, 계약자는 통보일로부터 영업일 기준 3일 이내에 검수를 실시한다."),
      p(" \u2461 계약자의 검수 완료 후 영업일 기준 7일 이내에 잔금을 지급한다."),
      p(" \u2462 검수 결과 하자가 발견된 경우, 공급자는 즉시 보수하고 재검수를 받아야 하며, 잔금 지급 기한은 재검수 완료일로부터 기산한다."),
      empty(),

      // 제4조 (신규)
      p("제 4 조 ( 공기 지연 및 지체상금 )", { bold: true, center: true }),
      p(" \u2460 공급자의 귀책사유로 공사기간을 초과할 경우, 지체일수 1일당 계약금액의 0.1%를 지체상금으로 계약자에게 지급한다."),
      p(" \u2461 천재지변, 계약자의 귀책사유 등 불가항력적 사유로 인한 지연은 지체상금 산정에서 제외한다."),
      p(" \u2462 지체상금의 총액은 계약금액의 10%를 초과하지 않는다."),
      empty(),

      // 제5조 (신규)
      p("제 5 조 ( 추가 공사 )", { bold: true, center: true }),
      p(" \u2460 본 계약에 명시되지 않은 추가 공사가 필요한 경우, 반드시 양 당사자의 서면 합의를 거쳐야 한다."),
      p(" \u2461 추가 공사의 범위, 금액, 공사기간은 별도 서면 합의서에 명시하며, 서면 합의 없이 진행된 추가 공사에 대해서는 대금을 청구할 수 없다."),
      empty(),

      // 제6조 (신규)
      p("제 6 조 ( 분쟁 해결 )", { bold: true, center: true }),
      p(" \u2460 본 계약과 관련하여 분쟁이 발생한 경우, 양 당사자는 우선 협의를 통해 해결한다."),
      p(" \u2461 협의가 이루어지지 않을 경우, 공사 현장 소재지를 관할하는 수원지방법원을 제1심 관할법원으로 한다."),
      empty(),
      empty(),
      empty(),

      // 서명란
      p("(공 급 자) 이 름 :          이상윤        (인)", { center: true }),
      empty(),
      p("(계 약 자) 이 름 :          민욱조        (인)", { center: true }),
    ]
  }]
});

const outputPath = path.join(process.env.USERPROFILE, "OneDrive", "바탕 화면", "DB", "시설공사계약서_수정본.docx");

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("생성 완료:", outputPath);
});
