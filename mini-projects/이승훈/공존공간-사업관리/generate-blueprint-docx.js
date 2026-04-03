// 월정산 자동화 청사진 v2 (모듈화) — DOCX 생성
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

const GRAY_BG = { type: ShadingType.SOLID, color: 'F2F2F2' };
const BLUE_BG = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN_BG = { type: ShadingType.SOLID, color: 'E2EFDA' };
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
function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Pretendard' })] });
}
function code(text) {
  return new Paragraph({ spacing: { after: 80 },
    children: [new TextRun({ text, size: 18, font: 'Consolas', color: '333333' })] });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? BLUE_BG : opts.green ? GREEN_BG : opts.gray ? GRAY_BG : undefined,
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

async function main() {
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Pretendard', size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
      children: [
        // ── 표지 ──
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: '월정산 자동화 청사진', bold: true, size: 48, font: 'Pretendard' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: 'v2 — 모듈화 버전', size: 28, font: 'Pretendard', color: '4472C4' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: '다른 업체 적용을 위한 시스템 설계 문서', size: 24, font: 'Pretendard', color: '666666' })] }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '공존공간 월 운영현황 자동화 구축 경험 기반', size: 20, font: 'Pretendard', color: '999999' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '2026.04.03', size: 20, font: 'Pretendard', color: '999999' })] }),

        // ── 1. 개요 ──
        new Paragraph({ spacing: { before: 600 } }),
        h1('1. 이 시스템이 하는 일'),
        p('매월 반복되는 운영현황 정산을 자동으로 만들어준다.'),
        p(''),
        p('구글시트에서 수동으로 하던 월 운영현황 작성을:'),
        bullet('데이터를 자동으로 수집하고 (POS, 메일, 웹)'),
        bullet('수동 입력이 필요한 건 노션 DB에 직접 입력하고'),
        bullet('스크립트 한 줄로 월 정산 보고서를 노션에 자동 생성'),
        p(''),
        p('node monthly-report.js gongzon 2026-03', true),
        p('→ 노션에 "26.03월 운영현황" 페이지 + 서브페이지 자동 생성'),

        // ── 2. 모듈화 구조 ──
        h1('2. 모듈화 구조'),

        h2('파일 구조'),
        code('프로젝트/'),
        code('├── monthly-report.js          ← 오케스트레이터 (업체 공통)'),
        code('├── lib/                       ← 공통 라이브러리'),
        code('│   ├── notion.js              ← 노션 API 헬퍼'),
        code('│   ├── blocks.js              ← 블록 빌더 (표, 제목)'),
        code('│   └── weeks.js               ← 주차 계산'),
        code('├── businesses/                ← 업체별 폴더'),
        code('│   └── gongzon/               ← 공존공간'),
        code('│       ├── config.js          ← 설정값'),
        code('│       ├── collectors.js      ← 데이터 수집'),
        code('│       └── sheets.js          ← 시트 빌더'),
        code('└── .env                       ← API 키, DB ID'),
        p(''),

        h2('각 파일의 역할'),
        makeTable(
          ['파일', '역할', '새 업체 시'],
          [
            ['monthly-report.js', '업체 로드 → 데이터 수집 → 페이지 생성', '수정 안 함'],
            ['lib/notion.js', 'notionPost, queryAll, createSubPage', '수정 안 함'],
            ['lib/blocks.js', 'heading, text, table, row, divider', '수정 안 함'],
            ['lib/weeks.js', 'getMonthRange (월~일 4주 계산)', '수정 안 함'],
            ['businesses/XX/config.js', '인건비, 고정비, 수수료율, DB ID', '복사 후 값 수정'],
            ['businesses/XX/collectors.js', '데이터 수집 함수 목록', 'POS/메일 다르면 수정'],
            ['businesses/XX/sheets.js', '시트 빌더 함수 목록', '시트 구성 다르면 수정'],
          ],
          [30, 40, 30],
        ),

        // ── 3. 체크리스트 ──
        h1('3. 새 업체 적용 시 파악할 것 (체크리스트)'),

        h2('A. 사업 구조'),
        makeTable(
          ['질문', '예시 (공존공간)', '새 업체'],
          [
            ['사업 영역이 뭔가?', '부동산(임대), 양조장, 워크샵', ''],
            ['임차인/직영 구분은?', '미식가(임차), 포토박스(임차), 재생전술(직영)', ''],
            ['수수료 구조는?', '카드 15%, 현금 13% (미식가) / 운영수수료 15% (포토)', ''],
            ['고정 인건비는?', '박승현 500만, 엄수빈 245만, 박주진 5만', ''],
            ['고정비 항목은?', '대출이자, 정수기, 통신, 캡스, 기장료, 승강기', ''],
            ['임대료 수익은?', '763만원/월', ''],
          ],
          [30, 40, 30],
        ),

        h2('B. 정산 주기'),
        makeTable(
          ['질문', '예시 (공존공간)', '새 업체'],
          [
            ['정산 단위?', '주간 (월~일)', ''],
            ['월은 몇 주?', '4주 고정', ''],
            ['이월 규칙?', '마지막 주 이후 남은 날 → 다음 달', ''],
            ['공과금 정산율?', '2026-03까지 95%, 이후 100%', ''],
          ],
          [30, 40, 30],
        ),

        h2('C. 데이터 소스'),
        makeTable(
          ['데이터', '수집 방법', '예시 (공존공간)', '새 업체'],
          [
            ['매출', 'POS 자동수집', 'OKPOS (Puppeteer)', ''],
            ['공과금', '메일 자동수집', '네이버+Gmail (IMAP)', ''],
            ['수도요금', '웹 자동수집', '수원시 수도요금 조회', ''],
            ['부스/매장 매출', '수동 입력', '노션 DB', ''],
            ['구매내역', '수동 입력', '노션 DB', ''],
            ['클래스/이벤트', '수동 입력', '노션 DB', ''],
            ['근태', '차후 자동화', '세콤 (미구현)', ''],
          ],
          [20, 20, 30, 30],
        ),

        h2('D. 시트(서브페이지) 구성'),
        makeTable(
          ['시트', '공존공간 구성', '새 업체'],
          [
            ['월 결산', '매출 vs 지출 요약 + 부문별 상세 + 고정비', ''],
            ['임차인 매출 상세', '일별·주차별 매출 + 수수료 계산', ''],
            ['공과금', '정산율 적용 + 고지서 대조', ''],
            ['임차인별 매출', '부스별/항목별 매출 + 재고', ''],
            ['인건비', '소속별 인건비', ''],
            ['구매내역', '온라인/오프라인 + 파트별 합산', ''],
            ['이벤트/클래스', '유형별 매출·비용·이익', ''],
          ],
          [25, 45, 30],
        ),

        // ── 4. 시스템 구성도 ──
        h1('4. 시스템 구성도'),
        p(''),
        makeTable(
          ['구간', '구성요소', '설명'],
          [
            ['자동 수집', 'POS 매출 스크립트', 'POS 시스템에서 일별 매출 자동 추출 → 노션 DB 저장'],
            ['자동 수집', '공과금 메일 파서', '네이버/Gmail에서 전기·가스 요금 자동 추출 → 노션 DB'],
            ['자동 수집', '수도요금 크롤러', '지자체 웹사이트에서 수도요금 조회 → 노션 DB'],
            ['수동 입력', '노션 DB', '자동화 안 되는 데이터는 노션에서 직접 입력'],
            ['오케스트레이터', 'monthly-report.js', '업체 폴더 로드 → collectors 실행 → sheets 생성'],
            ['업체 설정', 'businesses/XX/config.js', '인건비, 고정비, 수수료율, DB ID'],
            ['데이터 수집', 'businesses/XX/collectors.js', '노션 DB 쿼리 → 계산'],
            ['시트 생성', 'businesses/XX/sheets.js', '블록 배열 → 노션 페이지/서브페이지'],
            ['출력', '노션 페이지', '월 결산 + 서브페이지 자동 생성'],
          ],
          [15, 30, 55],
        ),
        p(''),
        p('데이터 흐름:', true),
        bullet('POS / 메일 / 웹 → 자동 수집 스크립트 → 노션 DB'),
        bullet('수동 입력 → 노션 DB'),
        bullet('노션 DB → collectors.js → sheets.js → 노션 월정산 페이지'),

        // ── 5. 적용 순서 ──
        h1('5. 새 업체 적용 순서 (5단계)'),

        h2('1단계: 사업 구조 파악 (1시간)'),
        bullet('체크리스트 A~D 채우기'),
        bullet('기존 정산 파일(엑셀/시트) 분석'),
        bullet('데이터 소스 확인 (POS 종류, 메일 형식 등)'),

        h2('2단계: 업체 폴더 생성 (30분)'),
        p('cp -r businesses/gongzon businesses/새업체', true),
        bullet('config.js 수정: 인건비, 고정비, 수수료율, 임대료'),
        bullet('.env에 새 노션 DB ID 추가'),
        bullet('노션 DB 생성 (create-operation-dbs.js 복사 → 필드 수정 → 실행)'),

        h2('3단계: collectors.js 수정 (1~3시간)'),
        bullet('POS가 같으면 → 수집 함수 그대로'),
        bullet('POS가 다르면 → 새 수집 함수 작성 (가장 시간 걸리는 부분)'),
        bullet('공과금 메일 형식 다르면 → 파서 수정'),
        bullet('수동 입력만이면 → 이 단계 생략 가능'),

        h2('4단계: sheets.js 수정 (30분~1시간)'),
        bullet('시트 구성이 비슷하면 → 제목/라벨만 수정'),
        bullet('사업 영역이 다르면 → 빌더 함수 추가/삭제/수정'),

        h2('5단계: 테스트 + 운영 (1시간)'),
        p('node monthly-report.js 새업체 2026-04', true),
        bullet('1개월치 데이터 입력 후 실행'),
        bullet('기존 엑셀/시트와 숫자 대조'),
        bullet('매월: 수동 입력 DB 채우기 → 스크립트 실행'),

        // ── 6. 코드 분류 ──
        h1('6. 코드 분류'),

        h2('수정 안 함 (공통 모듈)'),
        greenTable(
          ['파일', '역할'],
          [
            ['monthly-report.js', '오케스트레이터 (업체 로드 → 수집 → 생성)'],
            ['lib/notion.js', '노션 API 헬퍼 (인증, 쿼리, 페이지 생성)'],
            ['lib/blocks.js', '블록 빌더 (표, 제목, 구분선)'],
            ['lib/weeks.js', '주차 계산 (월~일 4주)'],
          ],
          [30, 70],
        ),

        h2('복사 후 수정 (업체별 폴더)'),
        makeTable(
          ['파일', '수정 내용'],
          [
            ['config.js', '인건비, 고정비, 수수료율, DB ID — 값만 바꾸기'],
            ['collectors.js', 'DB 필드명, 수수료 계산식 — POS 같으면 거의 안 바꿈'],
            ['sheets.js', '시트 제목, 테이블 구성 — 사업 구조 같으면 거의 안 바꿈'],
          ],
          [30, 70],
        ),

        h2('새로 작성 (업체마다 다른 것)'),
        makeTable(
          ['항목', '이유'],
          [
            ['POS 수집 스크립트', 'POS 시스템마다 로그인/데이터 구조가 다름'],
            ['공과금 메일 파서', '메일 형식이 업체/지역마다 다름'],
            ['수도요금 크롤러', '지자체 웹사이트가 다름'],
          ],
          [30, 70],
        ),

        // ── 7. 예상 소요 시간 ──
        h1('7. 예상 소요 시간'),
        makeTable(
          ['단계', '시간', '비고'],
          [
            ['사업 구조 파악', '1시간', '체크리스트 기반'],
            ['업체 폴더 생성 + config', '30분', '복사 후 값 수정'],
            ['collectors 수정', '1~3시간', 'POS 같으면 30분, 다르면 3시간'],
            ['sheets 수정', '30분~1시간', '사업 구조 비슷하면 30분'],
            ['테스트 + 검증', '1시간', ''],
            ['합계', '4~6시간', '사업 구조 비슷하면 3시간'],
          ],
          [30, 20, 50],
        ),
        p(''),
        p('비교:', true),
        bullet('청사진 없이 (공존공간 첫 구축): ~15시간'),
        bullet('청사진만 (모듈화 전): 5~7시간'),
        bullet('모듈화 후: 4~6시간 (비슷한 업체면 3시간)'),

        // ── 8. 기술 스택 ──
        h1('8. 기술 스택'),
        makeTable(
          ['구성요소', '기술', '역할'],
          [
            ['런타임', 'Node.js', '스크립트 실행'],
            ['백엔드 DB', '노션 API', '데이터 저장/조회'],
            ['로컬 DB', 'SQLite', 'PDF/프로젝트 관리'],
            ['웹 크롤링', 'Puppeteer', 'POS/공과금/순위 수집'],
            ['메일 수집', 'IMAP + mailparser', '공과금 메일 파싱'],
            ['알림', 'Telegram Bot', '정산 완료 알림'],
            ['웹 UI', 'Express + HTML', '대시보드 (선택)'],
          ],
          [20, 30, 50],
        ),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'C:/Users/leeha/OneDrive/바탕 화면/DB/월정산자동화_청사진.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('생성 완료:', outPath);
}

main().catch(console.error);
