// 새업체 온보딩 프로세스 — 3가지 버전 DOCX 생성
// 소상공인용 / 투자자용 / 내부용
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

// ── 공통 헬퍼 ──
const BLUE_BG = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN_BG = { type: ShadingType.SOLID, color: 'E2EFDA' };
const YELLOW_BG = { type: ShadingType.SOLID, color: 'FFF2CC' };
const GRAY_BG = { type: ShadingType.SOLID, color: 'F2F2F2' };
const DARK_BG = { type: ShadingType.SOLID, color: '2F5496' };
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
function pMulti(runs) {
  return new Paragraph({ spacing: { after: 100 },
    children: runs.map(r => new TextRun({ text: r.text, size: 20, font: 'Pretendard', bold: r.bold || false, color: r.color })) });
}
function bullet(text, level = 0) {
  return new Paragraph({ bullet: { level }, spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Pretendard' })] });
}
function spacer() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}
function bigSpacer() {
  return new Paragraph({ spacing: { after: 300 }, children: [] });
}

function cell(text, opts = {}) {
  const shading = opts.header ? BLUE_BG : opts.green ? GREEN_BG : opts.yellow ? YELLOW_BG : opts.gray ? GRAY_BG : opts.dark ? DARK_BG : undefined;
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading, borders,
    children: [new Paragraph({ alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), size: opts.big ? 22 : 18, font: 'Pretendard', bold: !!opts.header || !!opts.bold, color: opts.dark ? 'FFFFFF' : undefined })] })],
  });
}

function makeTable(headers, rows, widths) {
  const headerRow = new TableRow({ children: headers.map((h, i) => cell(h, { header: true, width: widths?.[i] })) });
  const dataRows = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}
function greenTable(headers, rows, widths) {
  const headerRow = new TableRow({ children: headers.map((h, i) => cell(h, { green: true, width: widths?.[i], bold: true })) });
  const dataRows = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}
function yellowTable(headers, rows, widths) {
  const headerRow = new TableRow({ children: headers.map((h, i) => cell(h, { yellow: true, width: widths?.[i], bold: true })) });
  const dataRows = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

// ============================================================
// 버전 1: 소상공인용 (쉬운 버전)
// ============================================================
function buildSmb() {
  return [
    h1('월정산 자동화 안내'),
    p('매달 수작업으로 하던 정산, 자동으로 만들어드립니다.'),
    bigSpacer(),

    // 뭐가 달라지나요
    h2('지금 vs 자동화 후'),
    makeTable(
      ['', '지금 (수작업)', '자동화 후'],
      [
        ['월말 정산', '엑셀에 하나하나 입력', '버튼 한 번이면 끝'],
        ['매출 확인', '포스기 → 엑셀 옮기기', '자동으로 가져옴'],
        ['공과금', '고지서 보고 직접 입력', '메일에서 자동 수집'],
        ['보고서', '양식 만들어서 수기 작성', '매달 자동 생성'],
        ['실수 가능성', '숫자 옮기다 실수', '계산 실수 없음'],
      ],
      [20, 40, 40],
    ),
    bigSpacer(),

    // 어떻게 진행되나요
    h2('진행 순서'),
    p('총 3단계로 진행됩니다. 사장님은 1단계에서 알려주시기만 하면 됩니다.'),
    spacer(),

    greenTable(
      ['단계', '할 일', '누가', '소요 시간'],
      [
        ['1단계', '가게 정보 알려주기', '사장님', '30분 대화'],
        ['2단계', '시스템 세팅', '공존공간', '1~2일'],
        ['3단계', '확인 & 시작', '같이', '30분'],
      ],
      [15, 35, 15, 35],
    ),
    bigSpacer(),

    // 1단계 상세
    h2('1단계: 알려주실 것'),
    p('아래 내용만 알려주시면 됩니다. 모르는 건 괜찮습니다, 같이 확인합니다.'),
    spacer(),

    yellowTable(
      ['항목', '예시'],
      [
        ['가게 이름', '미식가의주방, 포토인더박스'],
        ['어떤 장사를 하시나요?', '음식점, 카페, 포토부스, 워크샵 등'],
        ['정산 방식', '수수료? 월세? 매출 나눠서?'],
        ['매출 기록을 어디서 보시나요?', '포스기(OKPOS 등), 엑셀, 수기장부'],
        ['월 보고서에 뭐가 들어가면 좋겠어요?', '매출, 공과금, 인건비, 재고 등'],
      ],
      [40, 60],
    ),
    bigSpacer(),

    // 2단계
    h2('2단계: 저희가 하는 일'),
    bullet('사장님 가게에 맞는 정산 양식을 만듭니다'),
    bullet('매출 데이터를 자동으로 가져오는 연결을 만듭니다'),
    bullet('매달 보고서가 자동으로 만들어지게 세팅합니다'),
    p('이 과정에서 사장님이 하실 건 없습니다.'),
    bigSpacer(),

    // 3단계
    h2('3단계: 확인하고 시작'),
    bullet('첫 번째 보고서를 같이 확인합니다'),
    bullet('숫자가 맞는지 사장님이 확인해주시면 됩니다'),
    bullet('이상 없으면 그때부터 매달 자동으로 돌아갑니다'),
    bigSpacer(),

    // 정산 방식 안내
    h2('우리 가게는 어떤 방식?'),
    p('가게마다 돈이 오가는 방식이 다릅니다. 어떤 방식이든 맞춰드립니다.'),
    spacer(),

    makeTable(
      ['방식', '쉽게 말하면', '예시'],
      [
        ['수수료형', '매출의 일정 %를 수수료로 냄', '미식가의주방 (카드 15%, 현금 13%)'],
        ['매출-지출형', '번 돈에서 쓴 돈 빼기', '포토인더박스'],
        ['클래스형', '수업 하나당 수익 계산', '재생전술 워크샵'],
        ['월세형', '매달 정해진 금액', '일반 임대'],
      ],
      [15, 40, 45],
    ),
    bigSpacer(),

    // 자주 묻는 질문
    h2('자주 묻는 질문'),
    spacer(),
    p('Q. 컴퓨터를 잘 몰라도 되나요?', true),
    p('네. 처음 세팅만 저희가 해드리면, 이후에는 알아서 돌아갑니다.'),
    spacer(),
    p('Q. 기존 엑셀 데이터도 옮길 수 있나요?', true),
    p('네. 기존에 쓰시던 엑셀이 있으면 데이터를 옮겨드립니다.'),
    spacer(),
    p('Q. 보고서 양식을 바꿀 수 있나요?', true),
    p('네. 사장님이 원하시는 항목으로 맞춰드립니다.'),
    spacer(),
    p('Q. 비용이 드나요?', true),
    p('공존공간 입점 업체에게 제공하는 서비스입니다.'),
  ];
}

// ============================================================
// 버전 2: 투자자용
// ============================================================
function buildInvestor() {
  return [
    h1('공존공간 운영 자동화 시스템'),
    p('멀티테넌트 월정산 자동화 — 확장 가능한 모듈형 아키텍처'),
    bigSpacer(),

    // 핵심 가치
    h2('핵심 가치'),
    makeTable(
      ['지표', '현재', '자동화 후'],
      [
        ['월정산 소요 시간', '업체당 4~6시간 (수작업)', '업체당 5분 (자동 실행)'],
        ['정산 정확도', '수기 입력 오류 발생', '계산 오류 0%'],
        ['신규 업체 온보딩', '양식 새로 만들기 (1~2주)', '모듈 세팅 (1~2일)'],
        ['운영 인력', '정산 전담 필요', '무인 운영 가능'],
      ],
      [30, 35, 35],
    ),
    bigSpacer(),

    // 시스템 구조
    h2('시스템 구조'),
    p('업체가 늘어나도 코어 시스템은 변경 없음. 업체별 설정 파일만 추가.'),
    spacer(),

    greenTable(
      ['계층', '구성', '역할'],
      [
        ['오케스트레이터', 'monthly-report.js', '전체 실행 흐름 제어 (업체 무관)'],
        ['공통 라이브러리', 'lib/ (3개 모듈)', '노션 API, 블록 빌더, 주차 계산'],
        ['업체 모듈', 'businesses/<업체명>/', '업체별 설정·수집·보고서 (3개 파일)'],
      ],
      [20, 30, 50],
    ),
    spacer(),
    p('신규 업체 추가 = 업체 모듈 폴더 1개 추가. 오케스트레이터·라이브러리 수정 없음.'),
    bigSpacer(),

    // 확장성
    h2('확장 모델'),
    spacer(),

    h3('업체 온보딩 프로세스 (표준화 완료)'),
    makeTable(
      ['단계', '내용', '소요'],
      [
        ['1. 업체 파악', '정산 구조·데이터 소스·보고 항목 정의', '1시간'],
        ['2. DB 세팅', '노션 데이터베이스 생성·연결', '2시간'],
        ['3. 모듈 개발', '설정·수집·보고서 파일 작성', '4~8시간'],
        ['4. 검증', '테스트 실행·결과 확인', '1시간'],
      ],
      [20, 50, 30],
    ),
    spacer(),
    pMulti([
      { text: '업체당 온보딩: ', bold: true },
      { text: '1~2일 (정산 구조 복잡도에 따라)' },
    ]),
    bigSpacer(),

    h3('정산 유형 커버리지'),
    p('현재 4가지 정산 유형을 지원하며, 복합형(조합)도 가능.'),
    spacer(),
    makeTable(
      ['유형', '구조', '적용 업종', '구현 상태'],
      [
        ['수수료형', '매출 x 수수료율', '음식점, 카페', '완료 (미식가의주방)'],
        ['매출-지출형', '총매출 - 운영비', '포토부스, 소매', '완료 (포토인더박스)'],
        ['클래스형', '건당 매출 - 원가', '워크샵, 교육', '완료 (재생전술)'],
        ['월세형', '고정 월세 + 관리비', '일반 임대', '템플릿 준비'],
      ],
      [15, 25, 25, 35],
    ),
    bigSpacer(),

    // 데이터 파이프라인
    h2('데이터 파이프라인'),
    makeTable(
      ['단계', '방식', '현재 구현'],
      [
        ['데이터 수집', 'POS 연동 / 메일 파싱 / 수동 입력', 'OKPOS, 메일(공과금), 수동'],
        ['데이터 저장', '노션 데이터베이스', '매출·공과금·재고·구매·클래스 DB'],
        ['정산 계산', 'Node.js 모듈 (업체별)', '수수료·세금·감가상각 자동 계산'],
        ['보고서 생성', '노션 페이지 자동 생성', '메인 결산 + 상세 서브페이지'],
      ],
      [20, 35, 45],
    ),
    bigSpacer(),

    // 운영 효율
    h2('운영 효율 개선 효과'),
    spacer(),
    makeTable(
      ['항목', '수치'],
      [
        ['월 정산 자동화율', '90% (수동 확인 10%)'],
        ['업체당 월 운영 시간 절감', '약 4~5시간/월'],
        ['신규 업체 세팅 시간', '1~2일 (기존 2주)'],
        ['정산 오류율', '0% (자동 계산)'],
        ['확장 한계', '업체 수 제한 없음 (모듈 추가 방식)'],
      ],
      [50, 50],
    ),
    bigSpacer(),

    // 로드맵
    h2('향후 확장 방향'),
    makeTable(
      ['단계', '내용', '효과'],
      [
        ['자동 수집 확대', 'POS 연동 업체 확대, 카드사 매출 자동 수집', '수동 입력 0%'],
        ['대시보드', '전체 업체 실시간 현황 웹 대시보드', '경영 의사결정 가속'],
        ['알림 시스템', '이상 매출·미수금 자동 알림', '리스크 조기 감지'],
        ['멀티 건물', '타 건물/지점 확장', '동일 시스템 복제'],
      ],
      [20, 45, 35],
    ),
  ];
}

// ============================================================
// 버전 3: 내부용 (실행 가이드)
// ============================================================
function buildInternal() {
  return [
    h1('새 업체 추가 가이드'),
    p('이 순서대로 하면 됨. businesses/<업체명>/ 폴더에 파일 3개 만들면 끝.'),
    bigSpacer(),

    // 한눈에 보기
    h2('한눈에 보기'),
    yellowTable(
      ['순서', '할 일', '확인'],
      [
        ['1', '업체 정보 파악 (정산방식, 데이터 위치, 보고서 항목)', '☐'],
        ['2', '노션 DB 만들기 + .env에 ID 추가', '☐'],
        ['3', 'config.js 작성 → require 확인', '☐'],
        ['4', 'collectors.js 작성 → require 확인', '☐'],
        ['5', 'sheets.js 작성 → require 확인', '☐'],
        ['6', 'node monthly-report.js <업체> <월> 실행 → 노션 확인', '☐'],
      ],
      [10, 75, 15],
    ),
    bigSpacer(),

    // 1. 업체 파악
    h2('1. 업체 파악'),
    p('아래 7가지만 확인하면 됨:'),
    spacer(),
    makeTable(
      ['#', '뭘 확인', '왜 필요'],
      [
        ['1', '업체명', 'config.name, 폴더명'],
        ['2', '사업 유형 (음식점/소매/워크샵 등)', '정산 로직 결정'],
        ['3', '정산 방식', '아래 유형 분류 참고'],
        ['4', '정산 주기 (주간/월간)', 'collectors 설계'],
        ['5', '데이터 소스 (POS/엑셀/수기)', 'collectors 데이터 수집 방식'],
        ['6', '보고서 필요 항목', 'sheets 설계'],
        ['7', '노션 parentPageId', 'config.parentPageId'],
      ],
      [5, 45, 50],
    ),
    spacer(),

    // 정산 유형
    h3('정산 유형 분류'),
    greenTable(
      ['유형', '계산', '레퍼런스'],
      [
        ['수수료형', '매출 x 수수료율 = 수입', 'collectors.js → fetchMisikga'],
        ['매출-지출형', '총매출 - 운영비 = 순매출', 'collectors.js → fetchPhoto'],
        ['클래스형', '건당 매출 - 재료비 - 강사비', 'collectors.js → fetchClasses'],
        ['월세형', '고정 월세 + 관리비 + 공과금', '(아직 없음, 가장 단순)'],
      ],
      [20, 40, 40],
    ),
    bigSpacer(),

    // 2. 노션 DB
    h2('2. 노션 DB 세팅'),
    spacer(),
    p('필요한 DB (정산 유형별):', true),
    makeTable(
      ['유형', '만들 DB'],
      [
        ['수수료형', '매출 DB (일별: 일자, 총매출, 카드, 현금 등)'],
        ['매출-지출형', '매출 DB + 재고 DB'],
        ['클래스형', '클래스 DB (건별: 클래스명, 인원, 가격, 재료비 등)'],
        ['월세형', '수금 DB (월별: 월세, 관리비, 납부여부)'],
        ['공통', '공과금 DB, 구매내역 DB (필요시)'],
      ],
      [25, 75],
    ),
    spacer(),
    p('.env에 추가:', true),
    p('NOTION_<업체>_SALES_DB=xxx'),
    p('NOTION_<업체>_UTILITY_DB=xxx'),
    bigSpacer(),

    // 3. config.js
    h2('3. config.js'),
    p('gongzon/config.js 복사해서 시작. 값만 바꾸면 됨.'),
    spacer(),
    p('필수:', true),
    bullet('name — 업체명'),
    bullet('parentPageId — 노션 월정산 페이지 ID'),
    bullet('db — 노션 DB ID 매핑'),
    spacer(),
    p('유형별 추가:', true),
    bullet('수수료형: 수수료 = { 카드: 0.15, 현금: 0.13 }'),
    bullet('매출-지출형: 운영수수료율, 임대료'),
    bullet('월세형: 월세, 관리비'),
    bigSpacer(),

    // 4. collectors.js
    h2('4. collectors.js'),
    p('gongzon/collectors.js 참고. queryAll로 노션 DB 조회.'),
    spacer(),
    p('구조:', true),
    bullet('async function fetch매출(config, month, range) { ... }'),
    bullet('queryAll(config.db.sales, { filter }) 로 데이터 조회'),
    bullet('계산 후 결과 객체 return'),
    spacer(),
    p('export:', true),
    bullet('collectors: [{ key, label, fn, needsRange }]'),
    bullet('needsRange: true면 fn(config, month, range)로 호출'),
    bullet('needsRange 없으면 fn(config, month)로 호출'),
    bigSpacer(),

    // 5. sheets.js
    h2('5. sheets.js'),
    p('gongzon/sheets.js 참고. lib/blocks.js로 노션 블록 생성.'),
    spacer(),
    p('블록 빌더:', true),
    makeTable(
      ['함수', '용도'],
      [
        ['heading2(text)', '섹션 제목'],
        ['table(rows, colCount)', '표'],
        ['row(cells)', '표 행'],
        ['fmt(number)', '숫자 → 1,500,000'],
        ['text(content)', '텍스트'],
        ['divider()', '구분선'],
      ],
      [35, 65],
    ),
    spacer(),
    p('export:', true),
    bullet('mainSheet: { build: build월결산 }'),
    bullet('subSheets: [{ key, title(label), build }]'),
    bigSpacer(),

    // 6. 테스트
    h2('6. 테스트'),
    p('순서대로 확인:', true),
    spacer(),
    p('모듈 로드:'),
    bullet('node -e "require(\'./businesses/새업체/config\')"'),
    bullet('node -e "require(\'./businesses/새업체/collectors\')"'),
    bullet('node -e "require(\'./businesses/새업체/sheets\')"'),
    spacer(),
    p('실행:'),
    bullet('node monthly-report.js <업체명> <월>'),
    spacer(),
    p('확인:'),
    bullet('노션에 메인 페이지 생성됨?'),
    bullet('서브페이지들 생성됨?'),
    bullet('숫자가 원본과 맞음?'),
    bigSpacer(),

    // 참고
    h2('참고 파일'),
    makeTable(
      ['파일', '역할'],
      [
        ['monthly-report.js', '오케스트레이터 (수정 X)'],
        ['lib/notion.js', 'queryAll, createSubPage'],
        ['lib/blocks.js', 'heading2, table, row, fmt'],
        ['lib/weeks.js', 'getMonthRange (주차 계산)'],
        ['businesses/gongzon/', '레퍼런스 (복사해서 시작)'],
      ],
      [40, 60],
    ),
  ];
}

// ── 문서 생성 ──
async function generate() {
  const versions = [
    { name: '소상공인용', fn: buildSmb },
    { name: '투자자용', fn: buildInvestor },
    { name: '내부용', fn: buildInternal },
  ];

  const outDir = process.env.USERPROFILE + '/OneDrive/바탕 화면/DB';

  for (const v of versions) {
    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
        children: v.fn(),
      }],
    });

    const buf = await Packer.toBuffer(doc);
    const path = `${outDir}/새업체-온보딩-${v.name}.docx`;
    fs.writeFileSync(path, buf);
    console.log(`생성: ${path}`);
  }
}

generate().catch(console.error);
