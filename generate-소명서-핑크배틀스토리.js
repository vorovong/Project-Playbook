const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

async function generate() {

  function p(text, options = {}) {
    return new Paragraph({
      alignment: options.align || AlignmentType.LEFT,
      spacing: { before: options.before || 0, after: options.after || 160, line: 360 },
      indent: options.indent ? { left: options.indent } : undefined,
      children: [
        new TextRun({ text, size: options.size || 21, bold: options.bold || false, font: '맑은 고딕' })
      ]
    });
  }

  function empty(after = 100) {
    return new Paragraph({ spacing: { after }, children: [] });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      children: [
        // 수신
        p('수원도시재단 귀하', { align: AlignmentType.RIGHT, after: 300 }),

        // 제목
        p('소 명 서', { align: AlignmentType.CENTER, size: 32, bold: true, after: 400 }),

        // 업체 정보
        p('상    호 : 행궁매듭스토리', { after: 60 }),
        p('대 표 자 : 송상은', { after: 60 }),
        p('주    소 : 경기도 수원시 팔달구 효원로26번길 31-4, 2층', { after: 300 }),

        // 본문
        p('2025년 9월 16일 (주)공존공간 글로컬 상권 창출팀에 납품한 미니걱정인형(870,000원) 거래 건의 현금영수증 미발급에 대하여 아래와 같이 소명드립니다.'),

        empty(200),

        p('1. 거래 내역', { bold: true, size: 22, after: 160 }),
        p('- 거래일 : 2025년 9월 16일', { indent: 300 }),
        p('- 품  목 : 미니걱정인형 (환대패키지 제작용)', { indent: 300 }),
        p('- 금  액 : 870,000원', { indent: 300 }),
        p('- 거래처 : (주)공존공간', { indent: 300 }),

        empty(200),

        p('2. 현금영수증 미발급 경위', { bold: true, size: 22, after: 160 }),
        p('해당 거래 시 현금영수증 발급을 실수로 누락하였습니다. 납품과 대금 수령 과정에서 현금영수증 발급을 잊은 것으로, 고의로 발급을 거부하거나 회피한 것이 아닙니다.'),
        p('소규모로 운영하다 보니 납품에 집중하면서 현금영수증 발급까지 챙기지 못한 단순 실수였습니다.'),

        empty(200),

        p('3. 소급 발급이 불가한 사유', { bold: true, size: 22, after: 160 }),
        p('현금영수증은 발급 시점의 날짜로 처리되며, 거래일로 소급하여 발급하는 것이 시스템상 불가능합니다. 이에 현재 시점에서 발급하더라도 실제 거래일(2025.09.16)과 발급일이 일치하지 않게 되어, 오히려 증빙 서류 간 날짜 불일치 문제가 발생할 수 있습니다.'),

        empty(200),

        p('4. 거래의 적정성', { bold: true, size: 22, after: 160 }),
        p('현금영수증 미발급은 당사의 과실이 맞으나, 거래 자체는 실제 물품이 납품된 정상 거래임을 말씀드립니다. 대금은 계좌이체를 통해 정상적으로 수령하였으며, 매출 신고 또한 정상적으로 처리하였습니다.'),

        empty(200),

        p('현금영수증 발급을 누락한 점 깊이 반성하며, 향후 모든 거래에서 발급 절차를 빠짐없이 이행하겠습니다. 검토하여 주시면 감사하겠습니다.'),

        empty(400),

        p('2026년 3월 12일', { align: AlignmentType.CENTER, size: 22 }),
        empty(200),
        p('행궁매듭스토리 대표  송상은  (인)', { align: AlignmentType.CENTER, size: 22 }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join('C:', 'Users', 'leeha', 'OneDrive', '바탕 화면', '소명서_행궁매듭스토리_현금영수증.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('생성 완료:', outputPath);
}

generate().catch(console.error);
