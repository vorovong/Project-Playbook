// 월정산 자동화 청사진 상세편 (v3) — DOCX 생성
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

const BLUE_BG = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN_BG = { type: ShadingType.SOLID, color: 'E2EFDA' };
const YELLOW_BG = { type: ShadingType.SOLID, color: 'FFF2CC' };
const RED_BG = { type: ShadingType.SOLID, color: 'FCE4EC' };
const GRAY_BG = { type: ShadingType.SOLID, color: 'F2F2F2' };
const noBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 500, after: 200 },
    children: [new TextRun({ text: t, bold: true, size: 32, font: 'Pretendard' })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 350, after: 150 },
    children: [new TextRun({ text: t, bold: true, size: 26, font: 'Pretendard' })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 250, after: 100 },
    children: [new TextRun({ text: t, bold: true, size: 22, font: 'Pretendard' })] });
}
function p(t, bold = false) {
  return new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text: t, size: 20, font: 'Pretendard', bold })] });
}
function bullet(t) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 },
    children: [new TextRun({ text: t, size: 20, font: 'Pretendard' })] });
}
function code(t) {
  return new Paragraph({ spacing: { after: 40 },
    shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
    children: [new TextRun({ text: t, size: 17, font: 'Consolas', color: '333333' })] });
}
function gap(size = 200) {
  return new Paragraph({ spacing: { before: size } });
}

function cell(t, opts = {}) {
  let shading;
  if (opts.header) shading = BLUE_BG;
  else if (opts.green) shading = GREEN_BG;
  else if (opts.yellow) shading = YELLOW_BG;
  else if (opts.red) shading = RED_BG;
  else if (opts.gray) shading = GRAY_BG;
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading, borders,
    children: [new Paragraph({ alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(t), size: 18, font: 'Pretendard', bold: !!opts.header })] })],
  });
}

function makeTable(headers, rows, widths) {
  const hr = new TableRow({ children: headers.map((h, i) => cell(h, { header: true, width: widths?.[i] })) });
  const dr = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...dr] });
}

function greenTable(headers, rows, widths) {
  const hr = new TableRow({ children: headers.map((h, i) => cell(h, { green: true, width: widths?.[i] })) });
  const dr = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...dr] });
}

function yellowTable(headers, rows, widths) {
  const hr = new TableRow({ children: headers.map((h, i) => cell(h, { yellow: true, width: widths?.[i] })) });
  const dr = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...dr] });
}

function redTable(headers, rows, widths) {
  const hr = new TableRow({ children: headers.map((h, i) => cell(h, { red: true, width: widths?.[i] })) });
  const dr = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...dr] });
}

async function main() {
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Pretendard', size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
      children: [
        // ── 표지 ──
        gap(2000),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: '월정산 자동화 청사진', bold: true, size: 48, font: 'Pretendard' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: '상세편 (v3)', size: 28, font: 'Pretendard', color: '4472C4' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: '수익모델 · DB구조 · 코드상세 · 트러블슈팅 · Ralph Loop', size: 20, font: 'Pretendard', color: '666666' })] }),
        gap(600),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '공존공간 월 운영현황 자동화 구축 경험 기반', size: 20, font: 'Pretendard', color: '999999' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '2026.04.03', size: 20, font: 'Pretendard', color: '999999' })] }),

        // ══════════════════════════════════════════
        // 1. 수익 모델
        // ══════════════════════════════════════════
        gap(600),
        h1('1. 수익 모델 이해 (가장 중요)'),
        p('정산 자동화의 핵심은 "뭘 매출로 잡느냐"다. 이걸 틀리면 모든 숫자가 틀린다.'),

        h2('공존공간 수익 모델'),
        p('공존공간은 건물주(임대업)다. 직접 장사하는 게 아니라, 임차인이 벌어온 돈에서 수수료를 받는 구조.'),
        gap(100),
        makeTable(
          ['사업부', '구분', '총매출 예시', '공존공간 매출', '계산'],
          [
            ['미식가의주방', '임차인', '4,351만원', '약 670만원', '카드 15%+부가세 + 현금 13%+부가세'],
            ['포토인더박스', '임차인', '300만원', '45만+임대55만', '운영수수료 15% + 고정 임대료'],
            ['재생전술', '직영', '150만원', '150만원', '직영이라 전액 매출'],
          ],
          [18, 12, 18, 18, 34],
        ),
        gap(100),
        p('핵심 공식:', true),
        code('공존공간 매출 = 미식가_카드수수료총액 + 미식가_현금수수료총액'),
        code('             + 포토인더박스_총매출'),
        code('             + 재생전술_총매출'),
        code('※ 임대료수익(763만)은 별도 고정 수입'),
        gap(100),

        h2('새 업체 적용 시 확인 사항'),
        yellowTable(
          ['질문', '왜 중요한가'],
          [
            ['직영인가 임차인인가?', '직영 = 총매출이 매출, 임차인 = 수수료만 매출'],
            ['수수료 구조는?', '카드/현금 다를 수 있음, 부가세 포함 여부'],
            ['임대료는 고정인가 변동인가?', '고정이면 CONFIG에, 변동이면 collector에'],
          ],
          [35, 65],
        ),

        // ══════════════════════════════════════════
        // 2. 주차 계산
        // ══════════════════════════════════════════
        h1('2. 주차 계산 로직'),
        p('공존공간은 월~일 단위 4주를 한 달로 본다.'),
        bullet('매월 1일이 속한 주의 월요일부터 시작'),
        bullet('단, 1일이 일요일이면 다음 날(월요일)부터 시작'),
        bullet('4주(28일) = 해당 월'),
        bullet('29일~31일은 다음 달로 이월'),

        h2('실제 예시'),
        makeTable(
          ['월', '1일 요일', '시작', '종료', '이월'],
          [
            ['2026-03', '일요일', '3월 2일 (월)', '3월 29일 (일)', '3/30~31 → 4월'],
            ['2026-04', '수요일', '3월 30일 (월)', '4월 26일 (일)', '4/27~30 → 5월'],
            ['2026-05', '금요일', '4월 28일 (월)', '5월 25일 (일)', '5/26~31 → 6월'],
          ],
          [15, 15, 22, 22, 26],
        ),
        gap(100),

        h2('3월 주차 상세'),
        greenTable(
          ['주차', '시작', '종료', '일수'],
          [
            ['1주차', '3/2 (월)', '3/8 (일)', '7일'],
            ['2주차', '3/9 (월)', '3/15 (일)', '7일'],
            ['3주차', '3/16 (월)', '3/22 (일)', '7일'],
            ['4주차', '3/23 (월)', '3/29 (일)', '7일'],
            ['합계', '', '', '28일'],
          ],
          [20, 30, 30, 20],
        ),
        gap(100),

        p('중요: 월 경계 쿼리', true),
        p('4월 1주차는 3/30부터 시작한다. 매출 쿼리할 때 전월 데이터도 가져와야 한다.'),
        code('months.add(range.start.slice(0,7)); // "2026-03" (이월분)'),
        code('months.add(range.end.slice(0,7));   // "2026-04"'),
        code('// 두 달 모두 쿼리한 뒤, 날짜 범위로 필터'),

        // ══════════════════════════════════════════
        // 3. CONFIG 상세
        // ══════════════════════════════════════════
        h1('3. CONFIG 상세 (config.js)'),

        h2('전체 설정 항목'),
        makeTable(
          ['항목', '공존공간 값', '설명', '새 업체 시'],
          [
            ['name', "'공존공간'", '업체명 (로그 출력용)', '업체명 변경'],
            ['parentPageId', '노션 페이지 ID', '월정산 보고서가 생성되는 위치', '노션에서 새 페이지 만들고 ID 복사'],
            ['db.sales', '.env에서 읽음', 'POS 일별 매출 DB', '.env에 새 ID 추가'],
            ['db.utility', '.env에서 읽음', '공과금 DB', '.env에 새 ID 추가'],
            ['db.photo', '.env에서 읽음', '임차인 매출 DB', '해당 없으면 삭제'],
            ['db.purchase', '.env에서 읽음', '구매내역 DB', '.env에 새 ID 추가'],
            ['db.class', '.env에서 읽음', '클래스/이벤트 DB', '해당 없으면 삭제'],
          ],
          [18, 22, 30, 30],
        ),
        gap(100),

        h2('인건비 설정'),
        makeTable(
          ['그룹', '이름', '금액', '비고'],
          [
            ['오피스', '박승현', '5,000,000', '대표'],
            ['오피스', '엄수빈', '2,450,000', '매니저'],
            ['재생전술', '박주진', '50,000', '강사 (건당)'],
            ['합계', '', '7,500,000', ''],
          ],
          [20, 20, 25, 35],
        ),
        gap(100),

        h2('고정비 설정'),
        makeTable(
          ['항목', '금액', '비고'],
          [
            ['대출이자', '1,695,556', '건물 대출'],
            ['정수기', '54,910', '임대'],
            ['통신요금', '127,030', ''],
            ['캡스', '121,000', '보안'],
            ['기장료', '275,000', '세무사'],
            ['승강기보수료', '121,000', ''],
            ['합계', '2,394,496', ''],
          ],
          [30, 25, 45],
        ),
        gap(100),

        h2('수수료/세율 설정'),
        makeTable(
          ['항목', '값', '적용 대상'],
          [
            ['카드 수수료', '15%', '미식가 카드매출에 적용'],
            ['현금 수수료', '13%', '미식가 현금매출에 적용'],
            ['부가세율', '10%', '수수료에 추가'],
            ['감가상각율', '2%', '총매출 대비'],
            ['포토 운영수수료', '15%', '포토인더박스 매출에 적용'],
            ['포토 임대료', '550,000', '월 고정'],
            ['임대료수익', '7,635,400', '월 고정 수입'],
          ],
          [25, 20, 55],
        ),

        // ══════════════════════════════════════════
        // 4. 노션 DB 필드 구조
        // ══════════════════════════════════════════
        h1('4. 노션 DB 필드 구조 (5개 DB)'),

        h2('DB 1: 미식가 일별 매출 (POS 자동수집)'),
        p('okpos-sales.js가 매일 자동으로 채움'),
        makeTable(
          ['필드명', '타입', '설명', '예시'],
          [
            ['일자', 'title', '날짜 (YYYY-MM-DD)', '2026-03-02'],
            ['총매출', 'number', 'POS 총매출', '1,823,500'],
            ['실매출', 'number', '할인 후 매출', '1,750,000'],
            ['총할인', 'number', '할인 총액', '73,500'],
            ['신용카드', 'number', '카드 결제액', '1,500,000'],
            ['단순현금', 'number', '현금 (영수증X)', '200,000'],
            ['현금영수', 'number', '현금 (영수증O)', '50,000'],
            ['영수건수', 'number', '총 결제 건수', '45'],
            ['고객수', 'number', '방문 고객 수', '38'],
          ],
          [18, 12, 35, 35],
        ),

        h2('DB 2: 공과금 (메일 자동수집)'),
        p('utility-autofill.js, water-bill.js가 자동으로 채움'),
        makeTable(
          ['필드명', '타입', '설명', '예시'],
          [
            ['호실', 'title', '위치/구분', '지하1층'],
            ['종류', 'select', '전기/가스/수도/태양광', '전기'],
            ['청구월', 'rich_text', '대상 월', '2026-03'],
            ['청구금액', 'number', '고지서 금액', '245,000'],
            ['사용량', 'number', 'kWh/㎥ 등', '1,250'],
          ],
          [18, 15, 32, 35],
        ),

        h2('DB 3: 포토인더박스 매출 (수동 입력)'),
        makeTable(
          ['필드명', '타입', '설명'],
          [
            ['월', 'title', 'YYYY-MM'],
            ['1~4번부스_카드', 'number × 4', '각 부스 카드매출'],
            ['1~4번부스_현금', 'number × 4', '각 부스 현금매출'],
            ['필름_재고', 'number', '금월 남은 수량'],
            ['필름_단가', 'number', '장당 가격'],
            ['필름_사용', 'number', '이번 달 사용량'],
            ['캡슐_재고/사용', 'number × 2', '꽃가루 캡슐'],
            ['봉투_재고/사용', 'number × 2', '포장봉투'],
          ],
          [30, 25, 45],
        ),

        h2('DB 4: 구매내역 (수동 입력)'),
        makeTable(
          ['필드명', '타입', '설명'],
          [
            ['품목', 'title', '구매한 물건'],
            ['일자', 'date', '구매일'],
            ['금액', 'number', '상품가격'],
            ['배송비', 'number', ''],
            ['구분', 'select', '재생전술/사무실/양조장/로컬페스타/팝업'],
            ['채널', 'select', '네이버/쿠팡/기타온라인/오프라인'],
            ['구매처', 'rich_text', '가게명'],
            ['비고', 'rich_text', '메모'],
          ],
          [20, 15, 65],
        ),

        h2('DB 5: 재생전술 클래스 (수동 입력)'),
        makeTable(
          ['필드명', '타입', '설명'],
          [
            ['클래스명', 'title', '이름'],
            ['날짜', 'date', '진행일'],
            ['유형', 'select', '워크샵/소규모'],
            ['플랫폼', 'select', '유선예약/솜씨당/프립/카카오톡'],
            ['인원', 'number', '참가 인원'],
            ['판매가격', 'number', '총 결제액'],
            ['정산수수료', 'number', '플랫폼 수수료'],
            ['정산금액', 'number', '실수령액'],
            ['재료비_인당', 'number', '1인당 재료비'],
            ['강사비', 'number', ''],
            ['비고', 'rich_text', ''],
          ],
          [22, 15, 63],
        ),

        // ══════════════════════════════════════════
        // 5. Collector 상세
        // ══════════════════════════════════════════
        h1('5. Collector 상세 (데이터 수집)'),

        p('collectors.js는 배열로 수집 함수를 export한다. 오케스트레이터가 순서대로 실행.'),
        gap(100),

        h2('fetchMisikga (미식가 매출)'),
        makeTable(
          ['구분', '내용'],
          [
            ['입력', 'config, month, range (needsRange: true)'],
            ['쿼리', 'SALES_DB에서 range 포함 월 전체 쿼리 → 날짜 필터'],
            ['처리', '주차별 그룹핑 + 수수료 계산 (카드15%+부가세, 현금13%+부가세)'],
            ['출력', 'days[], weeks{}, 총매출, 카드수수료총액, 현금수수료총액 등'],
          ],
          [15, 85],
        ),
        gap(50),
        p('수수료 계산 과정:', true),
        code('카드수수료 = 카드합계 × 15%'),
        code('카드수수료부가세 = 카드수수료 × 10%'),
        code('카드수수료총액 = 카드수수료 + 부가세 ← 공존공간 매출'),
        code('카드입금액 = 카드합계 - 카드수수료총액 ← 미식가에게 돌아가는 돈'),

        h2('fetchUtilities (공과금)'),
        makeTable(
          ['구분', '내용'],
          [
            ['입력', 'config, month'],
            ['쿼리', 'UTILITY_DB에서 청구월=month 쿼리'],
            ['처리', '종류별 분류 → 전기(지하/공용) 분리 → 태양광 절감 → 정산율 적용'],
            ['출력', '가스비, 전기세, 수도세, 합계 + 고지서 원금액'],
          ],
          [15, 85],
        ),
        gap(50),
        p('태양광 절감 계산:', true),
        code('전월 태양광 발전량 × (지하 전기 고지서 ÷ 지하 전기 사용량) = 절감액'),
        code('전기_지하 = (지하 고지서 + 태양광 절감액) × 정산율'),

        h2('fetchPhoto / fetchPurchases / fetchClasses'),
        makeTable(
          ['함수', '쿼리', '출력 핵심'],
          [
            ['fetchPhoto', '월=month으로 1건 조회', '부스별 카드/현금, 재고, 사용량'],
            ['fetchPurchases', '일자 >= month-01 → 월말 필터', 'items[], 채널별/파트별 합산'],
            ['fetchClasses', '날짜 >= month-01 → 월말 필터', 'classes[], 총매출/재료비/강사비/순이익'],
          ],
          [22, 38, 40],
        ),

        h2('새 collector 작성 팁'),
        bullet('needsRange: true → 주차 기반 쿼리 필요 시 (POS 매출 등)'),
        bullet('함수 시그니처: (config, month) 또는 (config, month, range)'),
        bullet('리턴 key가 sheets.js에서 data.xxx로 접근됨'),
        bullet('빈 데이터 처리 필수 — 데이터 없으면 0/빈 배열 리턴'),

        // ══════════════════════════════════════════
        // 6. Sheet 상세
        // ══════════════════════════════════════════
        h1('6. Sheet 상세 (시트 빌더)'),

        p('모든 빌더 함수 시그니처: build시트명(config, month, data) → blocks[]'),
        gap(100),

        h2('시트 1: 월 결산 (메인 페이지)'),
        p('원본 구글시트의 "월 결산" 탭과 동일한 구조. 3개 영역으로 구성.'),
        gap(50),
        h3('영역 1: 매출 vs 지출 요약'),
        makeTable(
          ['매출', '', '지출', ''],
          [
            ['총 매출', '7,500,000', '총 지출', '9,800,000'],
            ['*임대료 매출 제외', '', '', ''],
            ['부가세(10%)', '750,000', '전기세', '285,000'],
            ['카드수수료(1.3%)', '97,500', '가스비', '95,000'],
            ['기타지출', '121,000', '수도세', '45,000'],
            ['순 매출액', '6,531,500', '대출이자', '1,695,556'],
            ['', '', '감가상각(2%)', '150,000'],
            ['전체 인건비', '7,500,000 (100%)', '', ''],
            ['순이익', '-3,268,500', '', ''],
          ],
          [25, 25, 25, 25],
        ),
        gap(50),
        h3('영역 2: 부문별 상세 (3개 테이블)'),
        p('오피스(미식가) / 포토인더박스 / 재생전술 각각 매출 vs 지출'),
        gap(50),
        h3('영역 3: 임대료수익 + 고정비'),
        p('고정 수입(임대료 763만) + 월 고정 지출 항목 나열'),

        h2('시트 2: 미식가 총매출'),
        bullet('월 요약 테이블 (총매출, 할인, 실매출, 카드, 현금)'),
        bullet('수수료 계산 테이블 (카드15%, 현금13%, 부가세, 입금액)'),
        bullet('주차별 일별 매출 테이블 × 4 (9열: 일자, 요일, 총매출, 할인, 실매출, 카드, 현금, 현금영수, 건수)'),

        h2('시트 3: 공과금'),
        makeTable(
          ['내역', '총액', '정산% 금액', '날짜/구분', '고지서 금액'],
          [
            ['가스비', '95,000', '95,000', '', '100,000'],
            ['전기세', '285,000', '190,000', '지하', '200,000'],
            ['', '', '', '태양광', '-10,000'],
            ['', '', '95,000', '공용', '100,000'],
            ['수도세', '42,750', '42,750', '', '45,000'],
            ['합계', '422,750', '', '', ''],
          ],
          [18, 18, 18, 18, 28],
        ),
        gap(50),
        p('정산율: 2026-03까지 95% (건물주 5% 부담), 2026-04부터 100%'),

        h2('시트 4~7'),
        makeTable(
          ['시트', '구성'],
          [
            ['포토인더박스', '카드매출 → 현금매출 → 총매출 → 정산 → 재고 → 사용량'],
            ['인건비', '소속/이름/금액/비고 테이블'],
            ['구매내역', '온라인 → 오프라인 → 파트별 합산'],
            ['재생전술', '워크샵/소규모 분리, 클래스별 매출·재료비·이익률'],
          ],
          [25, 75],
        ),

        // ══════════════════════════════════════════
        // 7. 실행 흐름
        // ══════════════════════════════════════════
        h1('7. 오케스트레이터 실행 흐름'),
        p('node monthly-report.js gongzon 2026-03 실행 시:', true),
        gap(50),
        code('1. dotenv 로드 (.env)'),
        code('2. businesses/gongzon/ 모듈 로드'),
        code('   ├── config.js → CONFIG 객체'),
        code('   ├── collectors.js → collectors 배열'),
        code('   └── sheets.js → mainSheet + subSheets'),
        code(''),
        code('3. getMonthRange("2026-03")'),
        code('   → { start: "2026-03-02", end: "2026-03-29", weeks: [...] }'),
        code(''),
        code('4. collectors 순차 실행'),
        code('   ├── fetchMisikga → data.misikga'),
        code('   ├── fetchUtilities → data.utilities'),
        code('   ├── fetchPhoto → data.photo'),
        code('   ├── fetchPurchases → data.purchases'),
        code('   └── fetchClasses → data.classes'),
        code(''),
        code('5. 메인 페이지 생성 (월 결산)'),
        code('   └── createSubPage(parentPageId, "26.03월 운영현황", blocks)'),
        code(''),
        code('6. 서브페이지 6개 생성'),
        code('   ├── 미식가의주방 총매출'),
        code('   ├── 미식가의주방 공과금'),
        code('   ├── 포토인더박스'),
        code('   ├── 인건비'),
        code('   ├── 구매내역'),
        code('   └── 재생전술'),

        // ══════════════════════════════════════════
        // 8. 실제 결과
        // ══════════════════════════════════════════
        h1('8. 실제 실행 결과 (2026년 3월)'),

        h2('콘솔 출력'),
        code('=== 공존공간 26.03월 운영현황 생성 ==='),
        code('   기간: 2026-03-02 ~ 2026-03-29 (4주)'),
        code(''),
        code('1. 미식가의주방 매출 조회... 실매출: 43,512,515원 (28일)'),
        code('2. 공과금 조회... 합계: 422,750원'),
        code('3. 포토인더박스 조회... 총매출: 0원 (데이터 미입력)'),
        code('4. 구매내역 조회... 합계: 0원'),
        code('5. 재생전술 조회... 총매출: 0원'),
        code(''),
        code('✅ 완료! https://www.notion.so/26-03-xxxxx'),

        h2('검증: 구글시트와 대조'),
        greenTable(
          ['항목', '구글시트', '자동화', '일치'],
          [
            ['미식가 실매출 (28일)', '43,512,515', '43,512,515', '✅'],
            ['공과금 합계', '422,750', '422,750', '✅'],
            ['인건비 합계', '7,500,000', '7,500,000', '✅'],
          ],
          [30, 22, 22, 10],
        ),
        gap(50),
        p('※ 구글시트 30일 매출(49,400,000)과 자동화 28일 매출(43,512,515)은 의도된 차이 (4주 기준)'),

        // ══════════════════════════════════════════
        // 9. 트러블슈팅
        // ══════════════════════════════════════════
        h1('9. 트러블슈팅 (겪었던 문제 6가지)'),

        h2('문제 1: 매출이 구글시트와 안 맞는다'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', '구글시트 49.4M vs 자동화 43.5M'],
            ['원인', '구글시트는 30일(달력), 자동화는 28일(4주)'],
            ['해결', 'getMonthRange() 도입, 29~31일은 다음 달로 이월'],
            ['교훈', '정산 기간 정의를 먼저 확인할 것'],
          ],
          [15, 85],
        ),

        h2('문제 2: 수수료 계산이 틀렸다'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', '공존공간 매출에 미식가 입금액(수수료 차감 후)이 잡힘'],
            ['원인', '수수료후입금(미식가 몫)을 공존공간 매출로 잡음'],
            ['해결', '카드수수료총액 + 현금수수료총액(공존공간 몫)으로 변경'],
            ['교훈', '임차인 매출 ≠ 임대업 매출. "누구의 매출인가?" 반드시 확인'],
          ],
          [15, 85],
        ),

        h2('문제 3: 데이터 없으면 크래시'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', 'TypeError: Cannot read properties of undefined'],
            ['원인', 'fetchPhoto 결과가 빈 객체일 때 중첩 속성 접근'],
            ['해결', '빈 데이터 시 {수량:0, 단가:0, 금액:0} 형태 리턴'],
            ['교훈', '모든 collector는 빈 데이터 처리 필수'],
          ],
          [15, 85],
        ),

        h2('문제 4: 노션 블록 100개 제한'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', '주차별 매출 테이블이 잘려서 생성됨'],
            ['원인', '노션 API children 100개 제한'],
            ['해결', 'createSubPage()에서 100개씩 나눠서 PATCH 추가'],
            ['교훈', '블록 많은 시트는 자동 분할 필요'],
          ],
          [15, 85],
        ),

        h2('문제 5: 페이지가 엉뚱한 곳에 생겼다'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', '월정산이 미식가의주방 아래에 생김'],
            ['원인', 'parentPageId를 미식가 정산 페이지로 지정'],
            ['해결', '노션 페이지 계층 확인 후 공존공간 바로 아래 ID로 변경'],
            ['교훈', 'parentPageId는 노션에서 직접 확인. 가정하지 말 것'],
          ],
          [15, 85],
        ),

        h2('문제 6: 아카이브된 페이지에 DB 생성 실패'),
        redTable(
          ['구분', '내용'],
          [
            ['증상', 'DB 생성 API 오류'],
            ['원인', '부모 페이지가 아카이브됨'],
            ['해결', '활성 페이지 ID를 다시 찾아서 지정'],
            ['교훈', '아카이브된 페이지 ID는 사용 불가'],
          ],
          [15, 85],
        ),

        // ══════════════════════════════════════════
        // 10. Ralph Loop
        // ══════════════════════════════════════════
        h1('10. 자동 개발 루프 (Ralph Loop)'),

        p('새 업체 세팅이나 버그 수정을 자율적으로 돌릴 수 있다.'),
        gap(50),
        code('bash ralph.sh specs/작업.md 10'),
        gap(50),

        h2('스펙 파일 구조'),
        code('# [작업 제목]'),
        code('## 목표'),
        code('한 줄로 뭘 만들건지.'),
        code('## 작업 내용'),
        code('1. ...'),
        code('## 완료 기준'),
        code('- [ ] 기준 1 (자동 검증 가능하게)'),
        gap(100),

        h2('완료 기준 작성법'),
        makeTable(
          ['좋은 기준', '나쁜 기준'],
          [
            ['node xxx.js 에러 없이 실행', '코드가 잘 돌아감'],
            ['노션에 페이지 생성됨', '결과가 괜찮음'],
            ['require("./file") 성공', '파일이 올바름'],
            ['숫자가 43,512,515와 일치', '숫자가 맞음'],
          ],
          [50, 50],
        ),
        gap(100),

        h2('실행 흐름'),
        code('사용자: bash ralph.sh specs/newbiz.md 10'),
        code(''),
        code('반복 1: Claude 스펙 읽기 → 코드 작성 → 에러 발생 → RALPH_CONTINUE'),
        code('반복 2: 에러 수정 → 일부 통과 → RALPH_CONTINUE'),
        code('반복 3: 나머지 수정 → 전체 통과 → RALPH_DONE'),
        code(''),
        code('완료! (3회 반복)'),

        // ══════════════════════════════════════════
        // 11. 실전 워크플로우
        // ══════════════════════════════════════════
        h1('11. 새 업체 적용 실전 워크플로우'),

        p('시나리오: "ABC카페"에 적용', true),
        gap(50),
        code('# 1. 업체 폴더 복사'),
        code('cp -r businesses/gongzon businesses/abccafe'),
        code(''),
        code('# 2. config.js 수정 (인건비, 고정비, 수수료 등)'),
        code(''),
        code('# 3. .env에 DB ID 추가'),
        code('NOTION_ABCCAFE_SALES_DB=xxx'),
        code(''),
        code('# 4. collectors.js 수정 (POS 다르면 새 수집기)'),
        code(''),
        code('# 5. sheets.js 수정 (시트 구성 변경)'),
        code(''),
        code('# 6. 테스트'),
        code('node monthly-report.js abccafe 2026-04'),
        code(''),
        code('# 또는 Ralph Loop으로 자동화'),
        code('bash ralph.sh specs/abccafe-setup.md 10'),

        gap(400),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '이 청사진은 공존공간 월정산 자동화 구축 경험(2026-03~04)을 기반으로 작성됨', size: 18, font: 'Pretendard', color: '999999', italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'v3 상세편 (2026-04-03)', size: 18, font: 'Pretendard', color: '999999', italics: true })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'C:/Users/leeha/OneDrive/바탕 화면/DB/월정산자동화_청사진_상세.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('생성 완료:', outPath);
}

main().catch(console.error);
