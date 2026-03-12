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
        // 제목
        p('소 명 서', { align: AlignmentType.CENTER, size: 32, bold: true, after: 400 }),

        // 수신
        p('수신 : 수원도시재단', { after: 80 }),
        p('제목 : 카메라 장비 임대차 계약 관련 업종 미등록 소명', { after: 80 }),
        p('작성일 : 2026년 3월 12일', { after: 300 }),

        // 본문 시작
        p('안녕하십니까, 비욘드상상 대표 한승연입니다.'),
        p('2025년 6월 1일 (주)공존공간 글로컬 상권 창출팀과 체결한 카메라 장비 임대차 계약(총 4,950,000원, VAT 포함)과 관련하여, 계약 당시 당사 사업자등록증에 임대업 관련 업종이 등록되어 있지 않았던 부분에 대해 아래와 같이 소명드립니다.'),

        empty(200),

        // 경위
        p('1. 경위', { bold: true, size: 22, after: 160 }),
        p('당사는 2022년부터 광고 영상 제작과 시각 디자인을 주된 사업으로 운영해 온 업체입니다. 카메라 장비는 영상 제작 업무를 위해 보유하고 있던 자산이며, (주)공존공간의 사업 수행에 장비가 필요하여 당사 보유 장비를 제공하게 되었습니다.'),
        p('그 과정에서 장비를 임대할 경우 사업자등록증에 별도의 임대업 업종을 등록해야 한다는 점을 알지 못했습니다. 영상 제작이 주된 사업이다 보니 장비 제공에 별도 업종이 필요하다는 행정 요건까지는 확인하지 못한 것이 솔직한 경위입니다.'),

        empty(200),

        // 거래 처리 내역
        p('2. 거래 처리 내역', { bold: true, size: 22, after: 160 }),
        p('업종 등록이 누락된 부분은 당사의 과실이 맞으나, 거래 자체는 정상적으로 이루어졌음을 말씀드립니다.'),
        empty(40),
        p('- 임대차 계약서 : 2025년 6월 1일 정식 체결', { indent: 300 }),
        p('- 세금계산서 : 적격 세금계산서 정상 발행', { indent: 300 }),
        p('- 대금 수령 : 계좌이체를 통해 정상 수령', { indent: 300 }),
        p('- 부가세 신고 : 당사 매출로 정상 신고 및 납부 완료', { indent: 300 }),
        empty(40),
        p('계약 체결부터 대금 수령, 세무 처리까지 모든 과정이 정상적으로 완료된 실거래입니다.'),

        empty(200),

        // 시정 조치
        p('3. 시정 조치', { bold: true, size: 22, after: 160 }),
        p('해당 사실을 인지한 후 즉시 관할 세무서에 업종 추가를 신청하였으며, 2026년 3월 10일자로 사업자등록증에 "사업시설 관리, 사업지원 및 임대서비스업(업태)" 및 "기타 산업용 기계 및 장비 임대업(종목)"을 추가 등록 완료하였습니다.'),

        empty(200),

        // 첨부
        p('4. 첨부 서류', { bold: true, size: 22, after: 160 }),
        p('1) 변경 전 사업자등록증 사본 1부 (2025.08.26 발급)', { indent: 300 }),
        p('2) 변경 후 사업자등록증 사본 1부 (2026.03.10 발급)', { indent: 300 }),
        p('3) 카메라 장비 임대차 계약서 사본 1부', { indent: 300 }),
        p('4) 세금계산서 사본 1부', { indent: 300 }),

        empty(300),

        p('행정 절차를 미처 확인하지 못한 점 깊이 반성하며, 향후 이러한 일이 재발하지 않도록 하겠습니다. 검토하여 주시면 감사하겠습니다.'),

        empty(400),

        p('2026년 3월 12일', { align: AlignmentType.CENTER, size: 22 }),
        p('비욘드상상 대표  한승연  (인)', { align: AlignmentType.CENTER, size: 22 }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join('C:', 'Users', 'leeha', 'OneDrive', '바탕 화면', '소명서_비욘드상상_업종미등록.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('생성 완료:', outputPath);
}

generate().catch(console.error);
