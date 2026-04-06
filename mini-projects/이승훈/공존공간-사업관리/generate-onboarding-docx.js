// 새업체 온보딩 프로세스 — DOCX 생성
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

const BLUE_BG = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN_BG = { type: ShadingType.SOLID, color: 'E2EFDA' };
const GRAY_BG = { type: ShadingType.SOLID, color: 'F2F2F2' };
const YELLOW_BG = { type: ShadingType.SOLID, color: 'FFF2CC' };
const noBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Pretendard' })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Pretendard' })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Pretendard' })] });
}
function p(text, bold = false) {
  return new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text, size: 20, font: 'Pretendard', bold })] });
}
function bullet(text, level = 0) {
  return new Paragraph({ bullet: { level }, spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Pretendard' })] });
}
function code(text) {
  return new Paragraph({ spacing: { after: 60 }, shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
    children: [new TextRun({ text, size: 18, font: 'Consolas', color: '333333' })] });
}
function spacer() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}
function checkbox(text) {
  return new Paragraph({ spacing: { after: 60 },
    children: [new TextRun({ text: `\u2610  ${text}`, size: 20, font: 'Pretendard' })] });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? BLUE_BG : opts.green ? GREEN_BG : opts.gray ? GRAY_BG : opts.yellow ? YELLOW_BG : undefined,
    borders,
    children: [new Paragraph({ alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), size: 18, font: 'Pretendard', bold: !!opts.header })] })],
  });
}

function makeTable(headers, rows, widths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => cell(h, { header: true, width: widths?.[i] })),
  });
  const dataRows = rows.map(r => new TableRow({
    children: r.map((c, i) => cell(c, { width: widths?.[i] })),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

function greenTable(headers, rows, widths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => cell(h, { green: true, width: widths?.[i] })),
  });
  const dataRows = rows.map(r => new TableRow({
    children: r.map((c, i) => cell(c, { width: widths?.[i] })),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

function yellowTable(headers, rows, widths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => cell(h, { yellow: true, width: widths?.[i] })),
  });
  const dataRows = rows.map(r => new TableRow({
    children: r.map((c, i) => cell(c, { width: widths?.[i] })),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

// ── 문서 생성 ──
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    children: [
      // 제목
      h1('새 업체 온보딩 프로세스'),
      p('새 업체를 월정산 시스템에 추가할 때 따라가는 표준 프로세스'),
      p('businesses/<업체명>/ 폴더에 config·collectors·sheets 3개 파일을 만들면 monthly-report.js가 자동 인식한다.'),
      spacer(),

      // ── 전체 흐름 ──
      h2('전체 흐름'),
      makeTable(
        ['단계', '할 일', '산출물'],
        [
          ['Phase 1', '업체 파악 (대화)', '파악 항목 정리'],
          ['Phase 2', '노션 DB 세팅', 'DB 생성 + .env 업데이트'],
          ['Phase 3', 'config.js 작성', 'businesses/새업체/config.js'],
          ['Phase 4', 'collectors.js 작성', 'businesses/새업체/collectors.js'],
          ['Phase 5', 'sheets.js 작성', 'businesses/새업체/sheets.js'],
          ['Phase 6', '테스트 & 검증', '노션 페이지 확인'],
        ],
        [15, 40, 45],
      ),
      spacer(),

      // ── Phase 1 ──
      h2('Phase 1: 업체 파악 (대화)'),
      p('새 업체가 정해지면 아래 항목을 대화로 파악한다. 모르는 건 [미결정]으로 남기고 추측하지 않는다.'),
      spacer(),

      h3('필수 파악 항목'),
      makeTable(
        ['#', '항목', '질문', '예시'],
        [
          ['1', '업체명', '정확한 상호명', '미식가의주방, 포토인더박스'],
          ['2', '사업 유형', '뭐 하는 곳?', '음식점, 포토부스, 워크샵'],
          ['3', '정산 유형', '어떻게 돈이 오가는지?', '아래 유형 분류표 참고'],
          ['4', '정산 주기', '얼마나 자주 정산?', '주간, 월간'],
          ['5', '데이터 소스', '매출 데이터가 어디에 있는지?', 'OKPOS, 엑셀, 수기장부'],
          ['6', '리포트 항목', '월보고서에 뭐가 들어가야 하는지?', '매출, 공과금, 인건비, 재고'],
          ['7', '노션 위치', '월정산 페이지가 어디에?', 'parentPageId'],
        ],
        [5, 15, 35, 45],
      ),
      spacer(),

      h3('정산 유형 분류'),
      greenTable(
        ['유형', '구조', '핵심 계산', '기존 예시'],
        [
          ['수수료형', '매출 x 수수료율 = 공존 수입', '카드/현금 수수료 + 부가세', '미식가의주방 (카드15%, 현금13%)'],
          ['매출-지출형', '총매출 - 운영비 = 순매출', '운영수수료, 임대료, 재고 차감', '포토인더박스 (운영수수료15%)'],
          ['클래스형', '건당 매출 - 원가 = 이익', '재료비, 강사비, 플랫폼 수수료', '재생전술'],
          ['월세형', '고정 월세 + 관리비 + 공과금', '수금 여부 관리', '(아직 없음)'],
          ['복합형', '위 유형 조합', '유형별로 분리 계산', '공존공간 = 수수료+매출지출+클래스'],
        ],
        [15, 30, 25, 30],
      ),
      spacer(),

      // ── Phase 2 ──
      h2('Phase 2: 노션 DB 세팅'),
      spacer(),

      h3('2-1. 정산 유형별 필요 DB'),
      makeTable(
        ['정산 유형', '필요 DB'],
        [
          ['수수료형', '매출 DB (일별)'],
          ['매출-지출형', '매출 DB + 재고 DB'],
          ['클래스형', '클래스 DB (건별)'],
          ['월세형', '수금 DB (월별)'],
          ['공통', '공과금 DB, 구매내역 DB (필요시)'],
        ],
        [30, 70],
      ),
      spacer(),

      h3('2-2. DB 프로퍼티 설계'),
      bullet('타이틀(제목) 필드: 보통 날짜 또는 월'),
      bullet('숫자 필드: 금액, 수량 등'),
      bullet('셀렉트 필드: 종류, 구분, 채널 등'),
      bullet('날짜 필드: 기간 필터용'),
      spacer(),

      h3('2-3. .env 업데이트'),
      code('# 새업체'),
      code('NOTION_새업체_SALES_DB=xxx'),
      code('NOTION_새업체_UTILITY_DB=xxx'),
      spacer(),

      h3('2-4. 데이터 입력 방식'),
      makeTable(
        ['방식', '언제', '설명'],
        [
          ['수동 입력', '첫 단계', '노션에 직접 입력 (가장 빠른 시작)'],
          ['엑셀 → 노션', '기존 엑셀이 있을 때', '스크립트로 변환'],
          ['POS 연동', '자동화 단계', 'okpos-sales.js 같은 수집기'],
          ['메일 파싱', '고지서 등', 'scan-mail.js 같은 파서'],
        ],
        [20, 25, 55],
      ),
      spacer(),

      // ── Phase 3 ──
      h2('Phase 3: config.js 작성'),
      p('businesses/gongzon/config.js를 복사해서 시작한다.'),
      spacer(),
      p('필수 항목:', true),
      bullet('name: 업체명'),
      bullet('parentPageId: 노션 월정산 페이지 ID'),
      bullet('db: 노션 DB ID 매핑 (.env에서 가져옴)'),
      spacer(),
      p('정산 유형별 추가 항목:', true),
      bullet('수수료형: 수수료율 (카드, 현금)'),
      bullet('매출-지출형: 운영수수료율, 임대료'),
      bullet('클래스형: (보통 DB에서 가져옴)'),
      bullet('월세형: 월세, 관리비'),
      spacer(),
      p('체크포인트:', true),
      code('node -e "require(\'./businesses/새업체/config\')"'),
      spacer(),

      // ── Phase 4 ──
      h2('Phase 4: collectors.js 작성'),
      p('businesses/gongzon/collectors.js를 참고한다.'),
      spacer(),
      p('구조:', true),
      bullet('각 데이터 종류별 async function 작성'),
      bullet('lib/notion.js의 queryAll 재사용'),
      bullet('collectors 배열로 export'),
      spacer(),
      p('수집기 규격:', true),
      makeTable(
        ['속성', '설명', '예시'],
        [
          ['key', '데이터 키 (sheets에서 참조)', 'sales, utilities'],
          ['label', '로그에 표시할 이름', '매출, 공과금'],
          ['fn', '수집 함수', 'fetch매출'],
          ['needsRange', 'true면 range 파라미터 추가', 'true/false(생략)'],
        ],
        [20, 45, 35],
      ),
      spacer(),
      p('체크포인트:', true),
      code('node -e "require(\'./businesses/새업체/collectors\')"'),
      spacer(),

      // ── Phase 5 ──
      h2('Phase 5: sheets.js 작성'),
      p('businesses/gongzon/sheets.js를 참고한다.'),
      spacer(),
      p('구조:', true),
      bullet('mainSheet: 월 결산 메인 페이지 빌더'),
      bullet('subSheets: 서브페이지 빌더 배열'),
      spacer(),
      p('사용 가능한 블록 (lib/blocks.js):', true),
      makeTable(
        ['함수', '용도', '예시'],
        [
          ['heading2(text)', '섹션 제목', 'heading2(\'매출 요약\')'],
          ['heading3(text)', '소제목', 'heading3(\'1주차\')'],
          ['table(rows, colCount)', '표', 'table([row([...])], 2)'],
          ['row(cells)', '표 행', 'row([\'매출\', fmt(100)])'],
          ['fmt(number)', '숫자 포맷 (천단위 콤마)', 'fmt(1500000) → 1,500,000'],
          ['text(content)', '텍스트', 'text(\'데이터 없음\')'],
          ['divider()', '구분선', ''],
        ],
        [25, 35, 40],
      ),
      spacer(),
      p('체크포인트:', true),
      code('node -e "require(\'./businesses/새업체/sheets\')"'),
      spacer(),

      // ── Phase 6 ──
      h2('Phase 6: 테스트 & 검증'),
      spacer(),
      h3('6-1. 모듈 로드 확인'),
      code('node -e "require(\'./businesses/새업체/config\')"'),
      code('node -e "require(\'./businesses/새업체/collectors\')"'),
      code('node -e "require(\'./businesses/새업체/sheets\')"'),
      p('3개 모두 에러 없으면 통과.'),
      spacer(),

      h3('6-2. 실행'),
      code('node monthly-report.js 새업체 2026-03'),
      spacer(),

      h3('6-3. 결과 확인'),
      checkbox('노션에 메인 페이지(월 결산) 생성됨'),
      checkbox('서브페이지들 생성됨'),
      checkbox('숫자가 원본 데이터와 일치함'),
      checkbox('표 레이아웃이 깨지지 않음'),
      spacer(),

      // ── 빠른 시작 체크리스트 ──
      h2('빠른 시작 체크리스트'),
      p('새 업체 추가 시 이 체크리스트를 따라간다:'),
      spacer(),
      yellowTable(
        ['단계', '체크', '할 일'],
        [
          ['Phase 1', '☐', '업체 정보 파악 완료 (정산유형, 데이터소스, 리포트항목)'],
          ['Phase 2', '☐', '노션 DB 생성 + .env 업데이트'],
          ['Phase 3', '☐', 'config.js 작성 → require 확인'],
          ['Phase 4', '☐', 'collectors.js 작성 → require 확인'],
          ['Phase 5', '☐', 'sheets.js 작성 → require 확인'],
          ['Phase 6', '☐', 'monthly-report.js 실행 → 노션 확인'],
        ],
        [15, 10, 75],
      ),
      spacer(),

      // ── 참고 파일 ──
      h2('참고 파일'),
      makeTable(
        ['파일', '역할'],
        [
          ['monthly-report.js', '오케스트레이터 (수정 불필요)'],
          ['lib/notion.js', '노션 API — queryAll, createSubPage'],
          ['lib/blocks.js', '노션 블록 빌더 — heading2, table, row, fmt 등'],
          ['lib/weeks.js', '주차 계산 — getMonthRange'],
          ['businesses/gongzon/config.js', '레퍼런스: 설정값'],
          ['businesses/gongzon/collectors.js', '레퍼런스: 수집기 5개'],
          ['businesses/gongzon/sheets.js', '레퍼런스: 시트 빌더 7개'],
        ],
        [40, 60],
      ),
    ],
  }],
});

const outPath = process.env.USERPROFILE + '/OneDrive/바탕 화면/DB/새업체-온보딩-프로세스.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('생성 완료:', outPath);
});
