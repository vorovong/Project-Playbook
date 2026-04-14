const docx = require("docx");
const fs = require("fs");
const path = require("path");

const { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition } = docx;

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1134, bottom: 851, left: 1701, right: 1701 },
        size: { width: 11906, height: 16838 } // A4
      }
    },
    children: [
      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제목
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "시 설 공 사 계 약 서", bold: true, font: "함초롬바탕", size: 44 })]
      }),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 공급자 정보
      new Paragraph({ children: [
        new TextRun({ text: " (공급자)", bold: true, font: "함초롬바탕", size: 20 }),
        new TextRun({ text: " 주    소 : 경기도 화성시 반월동 973 110-301", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "          상    호 : 파파설비 ( 등록번호 : 144 – 21 - 02185 )", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      대 표 자 명 : 이상윤", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      연  락  처 : 010 – 7679 - 1292", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 계약자 정보
      new Paragraph({ children: [
        new TextRun({ text: " (계약자)", bold: true, font: "함초롬바탕", size: 20 }),
        new TextRun({ text: " 주    소 : 경기도 수원시 팔달구 화서문로 45번길 32", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "          상    호 : 공존공간 ( 등록번호 :                           )", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "          이    름 :", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      연  락  처 :", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 체결 문구
      new Paragraph({ children: [
        new TextRun({ text: " 상기의 양 당사자를 각각 \u201C공급자\u201D \u201C계약자\u201D 라고 말하고 다음과 같이 체결한다", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 계약 내용
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "- 계 약 내 용 -", bold: true, font: "함초롬바탕", size: 20 })]
      }),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 공사명 (수정: 인테리어 공사)
      new Paragraph({ children: [
        new TextRun({ text: " 공  사  명 : 인테리어 공사", font: "함초롬바탕", size: 20 })
      ]}),

      // 공사기간
      new Paragraph({ children: [
        new TextRun({ text: " 공 사 기 간 : 2026년 4월 14일 ~ 2026년 4월 16일 ( 총 3일 )", font: "함초롬바탕", size: 20 })
      ]}),

      // A/S 기간
      new Paragraph({ children: [
        new TextRun({ text: " A/S 기  간 : 2년", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 공사비
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "- 공사비 -", bold: true, font: "함초롬바탕", size: 20 })]
      }),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 금액
      new Paragraph({ children: [
        new TextRun({ text: "      계 약 금 액 : 일금  오백육십일만원 (₩ 5,610,000 원)", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      선  수  금 : 일금  이백팔십일만오천원 (₩ 2,805,000 원)", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      잔       금 : 일금  이백이십사만사천원 (₩ 2,244,000 원)", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "      유  보  금 : 일금  오십육만일천원 (₩ 561,000 원)", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제1조 (기존 그대로)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: "제 1 조 ( 대금의 지급 및 유보금 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),

      new Paragraph({ children: [
        new TextRun({ text: " ① 총 공사금액은 금 오백육십일만원 (VAT 포함)으로 한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 계약자는 공사 완료 후 공사대금의 90%를 지급하고 나머지 10%는 하자보수보증금(유보금)으로 유보한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ③ 유보금은 공사완료 시점으로부터 3개월내로 지급한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ④ 하자 발생시 공급자는 즉시 보수해야하며, 이를 이행하지 않을 경우 계약자는 유보금에서 보수비를 공제할 수 있다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ⑤ 견적서 2장 별첨", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제2조 (신규)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "제 2 조 ( 별첨 견적서의 효력 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),
      new Paragraph({ children: [
        new TextRun({ text: " ① 별첨 견적서는 본 계약의 일부로서 동일한 효력을 가진다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 견적서에도 양측(공급자, 계약자) 서명을 받는다.", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제3조 (신규)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "제 3 조 ( 검수 및 잔금 지급 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),
      new Paragraph({ children: [
        new TextRun({ text: " ① 공급자는 공사 완료 후 계약자에게 완료 통보를 하고, 계약자는 통보일로부터 영업일 기준 3일 이내에 검수를 실시한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 계약자의 검수 완료 후 영업일 기준 7일 이내에 잔금을 지급한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ③ 검수 결과 하자가 발견된 경우, 공급자는 즉시 보수하고 재검수를 받아야 하며, 잔금 지급 기한은 재검수 완료일로부터 기산한다.", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제4조 (신규)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "제 4 조 ( 공기 지연 및 지체상금 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),
      new Paragraph({ children: [
        new TextRun({ text: " ① 공급자의 귀책사유로 공사기간을 초과할 경우, 지체일수 1일당 계약금액의 0.1%를 지체상금으로 계약자에게 지급한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 천재지변, 계약자의 귀책사유 등 불가항력적 사유로 인한 지연은 지체상금 산정에서 제외한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ③ 지체상금의 총액은 계약금액의 10%를 초과하지 않는다.", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제5조 (신규)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "제 5 조 ( 추가 공사 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),
      new Paragraph({ children: [
        new TextRun({ text: " ① 본 계약에 명시되지 않은 추가 공사가 필요한 경우, 반드시 양 당사자의 서면 합의를 거쳐야 한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 추가 공사의 범위, 금액, 공사기간은 별도 서면 합의서에 명시하며, 서면 합의 없이 진행된 추가 공사에 대해서는 대금을 청구할 수 없다.", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 제6조 (신규)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "제 6 조 ( 분쟁 해결 )", bold: true, font: "함초롬바탕", size: 20 })]
      }),
      new Paragraph({ children: [
        new TextRun({ text: " ① 본 계약과 관련하여 분쟁이 발생한 경우, 양 당사자는 우선 협의를 통해 해결한다.", font: "함초롬바탕", size: 20 })
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: " ② 협의가 이루어지지 않을 경우, 공사 현장 소재지를 관할하는 수원지방법원을 제1심 관할법원으로 한다.", font: "함초롬바탕", size: 20 })
      ]}),

      // 빈 줄 x2
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      // 서명란
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "(공 급 자) 이 름 :          이상윤        (인)", font: "함초롬바탕", size: 20 })]
      }),

      // 빈 줄
      new Paragraph({ children: [new TextRun({ text: "", font: "함초롬바탕", size: 20 })] }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "(계 약 자) 이 름 :                        (인)", font: "함초롬바탕", size: 20 })]
      }),
    ]
  }]
});

const outputPath = path.join(process.env.USERPROFILE, "OneDrive", "바탕 화면", "DB", "시설공사계약서_수정본2.docx");

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("생성 완료:", outputPath);
});
