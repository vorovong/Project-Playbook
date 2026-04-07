// 월정산 자동화 — 소상공인 가이드 DOCX 생성
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

const BLUE = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN = { type: ShadingType.SOLID, color: 'E2EFDA' };
const YELLOW = { type: ShadingType.SOLID, color: 'FFF2CC' };
const ORANGE = { type: ShadingType.SOLID, color: 'FCE4D6' };
const GRAY = { type: ShadingType.SOLID, color: 'F2F2F2' };
const nb = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: nb, bottom: nb, left: nb, right: nb };

const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 500, after: 200 },
  children: [new TextRun({ text: t, bold: true, size: 32, font: 'Pretendard' })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 350, after: 150 },
  children: [new TextRun({ text: t, bold: true, size: 26, font: 'Pretendard' })] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 250, after: 100 },
  children: [new TextRun({ text: t, bold: true, size: 22, font: 'Pretendard' })] });
const p = (t, bold = false) => new Paragraph({ spacing: { after: 100 },
  children: [new TextRun({ text: t, size: 20, font: 'Pretendard', bold })] });
const bullet = t => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: t, size: 20, font: 'Pretendard' })] });
const code = t => new Paragraph({ spacing: { after: 40 }, shading: GRAY,
  children: [new TextRun({ text: t, size: 17, font: 'Consolas', color: '333333' })] });
const gap = (s = 200) => new Paragraph({ spacing: { before: s } });

function cell(t, opts = {}) {
  let shading;
  if (opts.blue) shading = BLUE; else if (opts.green) shading = GREEN;
  else if (opts.yellow) shading = YELLOW; else if (opts.orange) shading = ORANGE;
  else if (opts.gray) shading = GRAY;
  return new TableCell({
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    shading, borders,
    children: [new Paragraph({ alignment: opts.c ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(t), size: 18, font: 'Pretendard', bold: !!opts.blue })] })],
  });
}

function tbl(headers, rows, widths, color = 'blue') {
  const hr = new TableRow({ children: headers.map((h, i) => cell(h, { [color]: true, w: widths?.[i] })) });
  const dr = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { w: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...dr] });
}

async function main() {
  const children = [
    // 표지
    gap(2000),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: '월정산 자동화', bold: true, size: 52, font: 'Pretendard' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 },
      children: [new TextRun({ text: '소상공인 가이드', size: 32, font: 'Pretendard', color: '4472C4' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: '카페 · 식당 · 미용실 · 임대업 · 배달가게', size: 22, font: 'Pretendard', color: '666666' })] }),
    gap(400),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '매달 엑셀로 하던 정산을 스크립트 한 줄로', size: 20, font: 'Pretendard', color: '999999' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '2026.04', size: 20, font: 'Pretendard', color: '999999' })] }),

    // 1. 이 시스템이 하는 일
    gap(600),
    h1('1. 이 시스템이 하는 일'),
    p('매달 반복하는 이 작업을:'),
    bullet('POS에서 매출 뽑고, 카드/현금 정리하고'),
    bullet('공과금 확인하고, 인건비·재료비·구매내역 정리하고'),
    bullet('엑셀에 숫자 넣고...'),
    p(''),
    p('스크립트 한 줄로 끝낸다.', true),
    code('node monthly-report.js 내가게 2026-04'),
    code('→ 노션에 "4월 운영현황" 페이지 자동 생성'),

    // 2. 기존 서비스 비교
    h1('2. 기존 서비스 vs 이 시스템'),

    h2('이미 있는 서비스들'),
    tbl(['서비스', '사용자', '뭘 해주나', '가격'],
      [['캐시노트', '210만 사장님', '카드매출 자동조회, 입금확인, 월간 리포트', '무료~5만/월'],
       ['오늘얼마 (OKPOS)', '25만+', 'POS 마감 후 일일보고서, 배달매출 통합', '무료'],
       ['얼마에요 (ERP)', '중소규모', '매출/매입, 손익, 급여계산, 4대보험', '유료'],
       ['머니핀', '법인~개인', '복식부기, 태그 기반 회계, 자금관리', '유료'],
       ['경리나라', '5인 이상', '거래/채권관리, 송금, 급여이체', '55만+월7.6만']],
      [18, 18, 40, 24]),
    gap(200),

    h2('기능 비교'),
    tbl(['기능', '캐시노트', '오늘얼마', '이 시스템'],
      [['카드매출 자동 조회', '✅', '✅', '✅'],
       ['현금매출 관리', '✅', '✅', '✅'],
       ['배달앱 매출 통합', '✅', '✅', '✅'],
       ['일별/월별 매출 리포트', '✅', '✅', '✅'],
       ['공과금 자동 수집 (메일)', '❌', '❌', '✅'],
       ['수도요금 자동 조회', '❌', '❌', '✅'],
       ['인건비 자동 계산', '❌', '△', '✅'],
       ['임차인별 수수료 정산', '❌', '❌', '✅'],
       ['복수 사업부문 통합 정산', '❌', '❌', '✅'],
       ['공과금 정산율 적용', '❌', '❌', '✅'],
       ['커스텀 보고서 형식', '❌', '❌', '✅'],
       ['여러 가게 통합 관리', '△', '❌', '✅'],
       ['노션 자동 생성', '❌', '❌', '✅'],
       ['구매내역/재료비 관리', '❌', '❌', '✅'],
       ['재고 관리', '❌', '❌', '✅'],
       ['워크샵/클래스 매출 관리', '❌', '❌', '✅'],
       ['세무사 전달용 전체 정산표', '△', '△', '✅']],
      [35, 15, 15, 15]),
    gap(200),

    h2('요약'),
    p('기존 서비스는 "매출 조회"까지는 잘 해준다.'),
    p('하지만 "매출 + 지출 + 수수료 + 인건비 + 공과금을 합쳐서 월 정산 보고서를 만드는 것"은 안 해준다.'),
    gap(100),
    p('이 시스템은:', true),
    bullet('기존 서비스가 하는 것 (매출 조회, 리포트) 다 하고'),
    bullet('지출 통합, 수수료 정산, 커스텀 보고서, 복합 사업체 관리까지 한다'),
    bullet('형식도 내가 원하는 대로 (구글시트 형식 그대로 노션에)'),

    // 3. 가게 유형
    h1('3. 우리 가게는 어떤 유형인가?'),

    h2('유형 A: 직영 가게'),
    p('카페, 식당, 미용실, 빵집, 옷가게 등 — 내가 직접 운영'),
    p('매출 = POS 총매출 (단순함)', true),
    tbl(['항목', '금액', '설명'],
      [['카드매출', '800만', ''], ['현금매출', '200만', ''],
       ['배달앱매출', '150만', '해당 시'], ['→ 총매출', '1,150만', ''],
       ['카드수수료(1.5%)', '-12만', ''], ['배달수수료(15%)', '-22.5만', '해당 시'],
       ['→ 실수령', '1,115.5만', '']],
      [30, 25, 45]),

    gap(200),
    h2('유형 B: 임대업'),
    p('건물주, 상가 임대, 공유오피스 — 임차인에게 수수료/임대료 받음'),
    p('매출 = 수수료 + 임대료 (임차인 총매출 ≠ 내 매출)', true),
    tbl(['항목', '금액', '설명'],
      [['임차인 카드수수료(15%)', '600만', '공존공간 사례'],
       ['임차인 현금수수료(13%)', '70만', ''],
       ['고정 임대료', '763만', ''],
       ['→ 내 수입', '1,433만', '']],
      [35, 20, 45]),

    gap(200),
    h2('유형 C: 복합형 (직영 + 임차)'),
    p('일부는 직접 운영, 일부는 임대. 각각 따로 계산해서 합산.'),

    gap(200),
    h2('유형 D: 온라인/배달 중심'),
    p('배민, 쿠팡이츠, 스마트스토어 — 플랫폼 매출이 대부분'),
    p('매출 = 플랫폼 총 주문액, 실수령 = 매출 - 수수료 - 배달비 - 부가세', true),

    // 3. POS
    h1('4. POS가 뭔가에 따라 다르다'),
    tbl(['POS', '수집 방법', '난이도', '비고'],
      [['OKPOS', '웹 크롤링', '중', '검증 완료'],
       ['키움POS', '웹 크롤링', '중', '웹 관리자 있음'],
       ['토스POS', 'API/크롤링', '중', '토스 비즈니스'],
       ['배달의민족', '웹 크롤링', '중', '사장님 사이트'],
       ['쿠팡이츠', '웹 크롤링', '중', '파트너 사이트'],
       ['카드사 조회', '웹 크롤링', '상', '여신금융협회'],
       ['엑셀/수기', '수동 입력', '하', '노션에 직접'],
       ['POS 없음', '수동 입력', '하', '노션에 직접']],
      [20, 20, 12, 48]),

    gap(100),
    p('POS가 없어도 된다', true),
    p('노션 앱에서 매일 매출을 직접 입력하면 똑같이 동작한다.'),
    code('노션 앱에서: 일자: 2026-04-01 / 카드: 350,000 / 현금: 80,000'),
    code('월말에: node monthly-report.js 내가게 2026-04 → 자동 생성'),

    // 4. 지출
    h1('5. 지출 항목: 가게마다 다르다'),

    h2('인건비'),
    tbl(['상황', '설정 방법'],
      [['사장 혼자 운영', '인건비 항목 없음 (또는 사장 급여만)'],
       ['알바 1~2명', '시급 × 시간 또는 월 고정'],
       ['정직원 있음', '월 고정급 + 4대보험'],
       ['일용직', '일당 × 일수']],
      [30, 70]),

    h2('고정비 (매달 같은 금액)'),
    tbl(['항목', '해당되는 가게'],
      [['임대료', '대부분 (자가 제외)'],
       ['대출이자', '대출 있으면'],
       ['통신요금', '대부분'],
       ['보험료', '대부분'],
       ['정수기/렌탈', '해당 시'],
       ['기장료 (세무사)', '대부분'],
       ['POS 이용료', '일부'],
       ['배달앱 월정액', '배달 가게']],
      [30, 70]),

    h2('수수료 (결제수단별)'),
    tbl(['결제수단', '일반 수수료', '비고'],
      [['신용카드', '1.5~2.5%', '연매출 3억 이하 우대'],
       ['체크카드', '1.0~1.5%', ''],
       ['현금', '0%', ''],
       ['배달의민족', '6.8~12.5%', '중개수수료'],
       ['쿠팡이츠', '9.8~15%', ''],
       ['카카오페이', '1.5~2.0%', ''],
       ['네이버페이', '1.5~3.0%', ''],
       ['스마트스토어', '2~6%', '카테고리별']],
      [25, 20, 55]),

    // 5. 공과금
    h1('6. 공과금'),
    h2('자동 수집 가능'),
    tbl(['공과금', '방법', '조건'],
      [['전기세', '한전 이메일 파싱', '이메일 고지서 설정'],
       ['가스비', '도시가스 이메일 파싱', '이메일 고지서 설정'],
       ['수도세', '지자체 웹 크롤링', '지자체마다 다름']],
      [20, 35, 45]),
    h2('수동 입력'),
    tbl(['공과금', '이유'],
      [['관리비', '건물마다 형식 다름'],
       ['도시가스 (일부)', '이메일 미지원'],
       ['기타', '자동화 대비 비용 안 맞음']],
      [25, 75]),

    // 6. 정산 주기
    h1('7. 정산 주기'),
    tbl(['유형', '설명', '적용'],
      [['달력 기준 월', '1일~말일', '대부분의 가게 (가장 단순)'],
       ['주차 기준 월', '월~일 4주 = 1개월', '주 단위 정산하는 곳'],
       ['플랫폼 정산', '배민: 주간, 쿠팡: 주간', '배달 중심 가게'],
       ['회계연도', '분기별', '법인']],
      [20, 35, 45]),

    // 7. 시트 구성
    h1('8. 보고서(시트) 구성: 유형별 추천'),

    h2('직영 가게 (카페/식당)'),
    tbl(['시트', '내용'],
      [['월 결산', '매출 vs 지출 요약, 순이익'],
       ['일별 매출', '날짜별 카드/현금/배달 + 합계'],
       ['인건비', '직원별 급여'],
       ['공과금', '전기/가스/수도/관리비'],
       ['재료비/구매', '식재료, 소모품 등'],
       ['배달 정산', '배민/쿠팡별 매출, 수수료 (해당 시)']],
      [25, 75]),

    h2('임대업'),
    tbl(['시트', '내용'],
      [['월 결산', '수수료수입 + 임대료 vs 지출'],
       ['임차인별 매출', '총매출, 수수료, 정산'],
       ['공과금', '정산율 적용'],
       ['인건비', '관리 인건비'],
       ['고정비', '대출이자, 관리비 등']],
      [25, 75]),

    h2('배달 중심'),
    tbl(['시트', '내용'],
      [['월 결산', '총 주문액 vs 실수령 vs 지출'],
       ['플랫폼별 매출', '배민/쿠팡/자체 분리'],
       ['수수료 상세', '플랫폼별 수수료, 배달비, VAT'],
       ['인건비', '직원 + 라이더'],
       ['재료비', '식재료 원가']],
      [25, 75]),

    // 8. DB 설계
    h1('9. 노션 DB 설계'),

    h2('공통 DB (어떤 가게든)'),

    h3('일별 매출 DB'),
    tbl(['필드', '타입', '직영', '임대업', '배달'],
      [['일자', 'title', '✅', '✅', '✅'],
       ['카드매출', 'number', '✅', '—', '✅'],
       ['현금매출', 'number', '✅', '—', '✅'],
       ['배달앱매출', 'number', '해당 시', '—', '✅'],
       ['총매출', 'number', '✅', '—', '✅'],
       ['결제건수', 'number', '선택', '—', '선택']],
      [20, 12, 16, 16, 16]),

    h3('공과금 DB'),
    tbl(['필드', '타입', '설명'],
      [['구분', 'title', '"매장", "지하" 등'],
       ['종류', 'select', '전기/가스/수도/관리비'],
       ['청구월', 'text', '2026-04'],
       ['청구금액', 'number', '고지서 금액']],
      [20, 15, 65]),

    h3('구매내역 DB'),
    tbl(['필드', '타입', '설명'],
      [['품목', 'title', '구매한 물건'],
       ['일자', 'date', '구매일'],
       ['금액', 'number', '가격'],
       ['구분', 'select', '재료비/소모품/사무용품/기타'],
       ['채널', 'select', '온라인/오프라인']],
      [20, 15, 65]),

    h2('유형별 추가 DB'),

    h3('임대업: 임차인 매출 DB'),
    tbl(['필드', '타입', '설명'],
      [['월', 'title', '2026-04'],
       ['임차인명', 'select', '가게명'],
       ['카드매출', 'number', ''],
       ['현금매출', 'number', ''],
       ['수수료율', 'number', '0.15'],
       ['임대료', 'number', '월 고정']],
      [22, 15, 63]),

    h3('배달: 플랫폼 정산 DB'),
    tbl(['필드', '타입', '설명'],
      [['정산기간', 'title', '4/1~4/7'],
       ['플랫폼', 'select', '배민/쿠팡이츠/요기요'],
       ['총주문액', 'number', ''],
       ['중개수수료', 'number', ''],
       ['배달비', 'number', ''],
       ['실입금액', 'number', '']],
      [22, 15, 63]),

    // 9. CONFIG 예시
    h1('10. 설정값(CONFIG) 예시'),

    h2('카페'),
    code("name: '해피카페'"),
    code('인건비: 김알바 120만, 이알바 80만'),
    code('고정비: 임대료 200만, 대출이자 50만, 통신 5만, 보험 15만, 기장료 11만'),
    code('수수료: 카드 1.5%'),

    gap(100),
    h2('배달 식당'),
    code("name: '맛있는분식'"),
    code('인건비: 박요리사 280만, 최알바 100만'),
    code('고정비: 임대료 150만, 통신 5만, 기장료 11만, 배민울트라콜 8.8만'),
    code('수수료: 카드 1.5%, 배민 6.8%, 쿠팡이츠 9.8%'),

    gap(100),
    h2('미용실'),
    code("name: '예쁜미용실'"),
    code('인건비: 이디자이너 300만, 박디자이너 250만, 김인턴 120만'),
    code('고정비: 임대료 300만, 통신 5만, 보험 20만, 기장료 11만, 정수기 3만'),
    code('수수료: 카드 2%, 네이버예약 4%'),

    gap(100),
    h2('상가 임대'),
    code("name: '행복빌딩'"),
    code('임차인: 1층카페(수수료10%, 임대200만), 2층미용실(임대180만), 3층사무실(임대120만)'),
    code('인건비: 관리인 200만'),
    code('고정비: 대출이자 300만, 승강기 15만, 기장료 27.5만, 보험 30만'),

    // 10. 시스템 구성도
    h1('11. 시스템 구성도'),
    p(''),
    tbl(['구간', '구성요소', '설명'],
      [['매출 입력', 'POS 자동수집 (있으면)', '웹 크롤링으로 매일 자동'],
       ['매출 입력', '또는 노션 수동입력', '노션 앱에서 매일 5분'],
       ['매출 입력', '+ 배달앱 정산 (해당 시)', '주간 정산 데이터'],
       ['지출 입력', '공과금 메일 (있으면)', '이메일 파싱 자동'],
       ['지출 입력', '또는 노션 수동입력', '고지서 보고 입력'],
       ['지출 입력', '+ 구매내역 수동', '영수증/주문내역'],
       ['', '', ''],
       ['처리', 'monthly-report.js', '설정 로드 → 데이터 수집 → 계산'],
       ['처리', 'businesses/내가게/', 'config + collectors + sheets'],
       ['', '', ''],
       ['출력', '노션 월정산 페이지', '월 결산 + 서브페이지 자동 생성']],
      [15, 28, 57]),

    // 11. 적용 순서
    h1('12. 적용 순서 (5단계)'),

    h2('1단계: 내 가게 분석 (30분)'),
    tbl(['질문', '답 (예시)'],
      [['어떤 유형?', '직영 / 임대 / 복합 / 배달'],
       ['POS가 뭔가?', 'OKPOS / 키움 / 토스 / 없음'],
       ['결제수단은?', '카드 / 현금 / 배달앱 / 간편결제'],
       ['직원은?', '혼자 / 알바 / 정직원'],
       ['고정 지출은?', '임대료, 대출, 통신, 보험, 세무사...'],
       ['변동 지출은?', '공과금, 재료비, 소모품...'],
       ['배달앱 쓰나?', '배민 / 쿠팡 / 안 씀'],
       ['정산 주기는?', '달력 기준 / 주차 기준']],
      [30, 70]),

    h2('2단계: 업체 폴더 + 설정 (30분)'),
    bullet('businesses/ 아래에 내 가게 폴더 생성'),
    bullet('config.js에 인건비, 고정비, 수수료율 입력'),
    bullet('.env에 노션 API 키, DB ID 추가'),

    h2('3단계: 노션 DB 만들기 (30분)'),
    bullet('필수: 일별 매출 DB, 공과금 DB, 구매내역 DB'),
    bullet('선택: 배달 정산 DB, 임차인 매출 DB'),

    h2('4단계: 데이터 수집 설정 (0~3시간)'),
    tbl(['상황', '할 일', '시간'],
      [['POS 없음, 수동만', '없음 (노션에 직접 입력)', '0분'],
       ['같은 POS', '기존 스크립트 복사, ID만 변경', '30분'],
       ['다른 POS', '새 크롤러 작성', '2~3시간'],
       ['공과금 수동', '없음 (노션에 직접 입력)', '0분']],
      [30, 45, 25]),

    h2('5단계: 테스트 + 운영 (1시간)'),
    bullet('1개월치 데이터 입력'),
    bullet('node monthly-report.js 내가게 2026-04 실행'),
    bullet('기존 정산 자료와 숫자 대조'),

    // 12. 소요 시간
    h1('13. 예상 소요 시간'),
    tbl(['상황', '시간', '비고'],
      [['수동 입력만 (POS 없음)', '2~3시간', 'config + DB + 시트'],
       ['같은 POS 사용', '3~4시간', '기존 스크립트 재사용'],
       ['새 POS + 메일 파서', '5~7시간', '크롤러 새로 작성'],
       ['복합형 (직영+임차)', '5~8시간', '계산 로직 복잡']],
      [35, 20, 45]),
    p(''),
    p('처음 1곳 구축: 5~15시간', true),
    p('2번째부터: 2~7시간 (유형이 비슷하면 더 빠름)', true),

    // 13. FAQ
    h1('14. 자주 묻는 질문'),
    tbl(['질문', '답'],
      [['노션 안 쓰는데?', '구글시트, 에어테이블 등도 가능. 연동 모듈만 교체.'],
       ['코딩 모르는데?', '설정은 숫자만 바꾸면 됨. POS 크롤러는 개발자 도움 필요. 수동 입력이면 설정만으로 가능.'],
       ['매일 뭘 해야 하나?', '자동수집: 아무것도 안 함. 수동: 매일 5분 노션 입력. 월말: 스크립트 한 줄.'],
       ['여러 가게 관리?', '가능. businesses/ 폴더에 가게별로 생성.'],
       ['배달앱 정산은?', '사장님 사이트 크롤링 또는 노션에 주간 수동 입력.'],
       ['세금 신고에 쓸 수 있나?', '운영 현황 파악용. 이 데이터를 세무사에게 주면 기장료 절감 가능.']],
      [30, 70]),

    // 14. 기술 스택
    h1('15. 기술 스택'),
    tbl(['구성요소', '기술', '역할'],
      [['런타임', 'Node.js', '스크립트 실행'],
       ['데이터 저장', '노션 API', 'DB 저장/조회/페이지 생성'],
       ['POS 수집', 'Puppeteer', '웹 크롤링 (해당 시)'],
       ['메일 수집', 'IMAP + mailparser', '공과금 이메일 (해당 시)'],
       ['알림', 'Telegram Bot', '정산 완료 알림 (선택)']],
      [20, 30, 50]),

    gap(400),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '공존공간 월정산 자동화 구축 경험(2026-03~04) 기반', size: 18, font: 'Pretendard', color: '999999', italics: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '다양한 소상공인 업종에 맞게 확장하여 작성', size: 18, font: 'Pretendard', color: '999999', italics: true })] }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Pretendard', size: 20 } } } },
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'C:/Users/leeha/OneDrive/바탕 화면/DB/월정산자동화_소상공인가이드.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('생성 완료:', outPath);
}

main().catch(console.error);
