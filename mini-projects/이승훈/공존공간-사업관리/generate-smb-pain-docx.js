// 소상공인 운영 애로사항 50가지 & 패스트 무버 분석 — DOCX 생성
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

// ── 스타일 ──
const BLUE_BG = { type: ShadingType.SOLID, color: 'D6E4F0' };
const GREEN_BG = { type: ShadingType.SOLID, color: 'E2EFDA' };
const YELLOW_BG = { type: ShadingType.SOLID, color: 'FFF2CC' };
const RED_BG = { type: ShadingType.SOLID, color: 'FCE4EC' };
const GRAY_BG = { type: ShadingType.SOLID, color: 'F2F2F2' };
const noBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Pretendard' })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 350, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Pretendard' })] });
}
function p(text, bold = false) {
  return new Paragraph({ spacing: { after: 100 },
    children: [new TextRun({ text, size: 20, font: 'Pretendard', bold })] });
}
function pSmall(text) {
  return new Paragraph({ spacing: { after: 60 },
    children: [new TextRun({ text, size: 16, font: 'Pretendard', color: '666666', italics: true })] });
}
function spacer() { return new Paragraph({ spacing: { after: 150 }, children: [] }); }
function bigSpacer() { return new Paragraph({ spacing: { after: 300 }, children: [] }); }

function cell(text, opts = {}) {
  const bgMap = { header: BLUE_BG, green: GREEN_BG, yellow: YELLOW_BG, red: RED_BG, gray: GRAY_BG };
  let shading;
  for (const [k, v] of Object.entries(bgMap)) { if (opts[k]) { shading = v; break; } }
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading, borders,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: String(text), size: opts.small ? 16 : 18, font: 'Pretendard', bold: !!opts.bold || !!opts.header })],
    })],
  });
}

function makeTable(headers, rows, widths) {
  const hRow = new TableRow({ children: headers.map((h, i) => cell(h, { header: true, width: widths?.[i] })) });
  const dRows = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hRow, ...dRows] });
}

function categoryTable(rows, widths) {
  const hRow = new TableRow({ children: ['#', '어려움', '상세', '패스트 무버 (해결책)'].map((h, i) => cell(h, { header: true, width: widths[i] })) });
  const dRows = rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hRow, ...dRows] });
}

const W = [5, 18, 37, 40]; // #, 어려움, 상세, 패스트무버

// ── 데이터 ──
const data = {
  '1. 매출/수익': [
    ['1', '내수 부진으로 매출 감소', '소상공인 77.4%가 내수부진을 1순위 원인. 자영업자 72.6%가 전년 대비 매출 감소 (평균 -12.8%)', '캐시노트: 매출 분석 리포트 / 토스플레이스: 실시간 매출 모니터링'],
    ['2', '배달앱 수수료 과다', '매출 대비 수수료 16.9%~29.3%. 점주 95%가 수수료 부담', '배달특급: 공공배달앱 저수수료 / 제로배달유니온: 지자체 기반 / 포스피드: 배달앱 통합관리'],
    ['3', '카드 수수료 부담', '카드 매출 비중 높지만 수수료가 고정비로 작용', '토스페이먼츠: 최저 수수료 / 제로페이: 0%~0.3% / 네이버페이: 소상공인 우대'],
    ['4', '비수기 매출 급감', '계절/요일/시간대별 편차로 고정비 부담 집중', '캐시노트: 상권 리포트로 대응 / 네이버 예약: 비수기 프로모션 | [기회] 비수기 매출보전 보험'],
    ['5', '온라인 채널 전환 어려움', '오프라인 중심 매장의 온라인 확장 노하우 부족', '네이버 스마트스토어: 무료 입점 / 카카오쇼핑 / Shopify: 글로벌 이커머스'],
    ['6', '객단가 하락', '소비 위축으로 1인당 지출 감소, 원가는 그대로', '키오스크(티오더): 업셀링 UI / 토스 비즈니스: 맞춤 프로모션 | [기회] AI 메뉴 추천'],
  ],
  '2. 인력/인건비': [
    ['7', '인건비 상승 부담', '소상공인 26.4%가 주요 애로. 경영비용 중 인건비 21.2%', '키오스크(티오더): 주문 자동화 / 서빙로봇(브이디컴퍼니) / 셀프계산대'],
    ['8', '구인난 (알바 구하기 어려움)', '임시/단기직 미충원율 21.5%. 주말/비인기 시간대 특히 어려움', '당근알바: 동네 기반 단기 구인 / 모든인력: GPS 기반 긴급 매칭 5분'],
    ['9', '높은 이직률', '아르바이트 평균 근속 짧아 반복 채용/교육 비용 발생', '시프티: 근태/스케줄 관리 SaaS / 보스몬: 급여 자동관리 | [기회] 소상공인 직원 리텐션 솔루션'],
    ['10', '급여/4대보험 계산 복잡', '주휴수당, 야간수당, 4대보험 산정 복잡', '보스몬: 1분 단위 출퇴근+급여 자동정산 / 얼마에요: 4대보험 자동계산'],
    ['11', '근로계약서 작성/관리', '법적 의무이나 양식 작성 번거롭고 미작성 시 과태료', '보스몬: 모바일 전자계약 / 사람인 HR: 계약서 자동생성'],
    ['12', '사장의 과로 (1인 다역)', '주문~정산~마케팅 혼자 담당. 월 영업이익 300만 미만 58.2%', '캐시노트/토스플레이스: 정산 자동화 | [기회] 소상공인 업무자동화 통합 플랫폼'],
  ],
  '3. 세무/회계/정산': [
    ['13', '부가세/종소세 신고 부담', '세금 신고 시기마다 시간/비용 소모', '삼쩜삼: AI 세금신고/환급 자동화 / SSEM: 셀프 신고 앱'],
    ['14', '매출/비용 장부 관리 어려움', '카드/현금/배달앱 등 채널별 매출 파악 복잡', '캐시노트: 카드매출/계좌/세금계산서 자동 장부화 / 얼마에요: 모바일 회계장부'],
    ['15', '복수 결제채널 정산 복잡', '카드사·배달앱·간편결제별 정산 주기/금액 다 다름', '캐시노트: 미지급 매출 진단+정산 알림 / 토스페이먼츠: 통합 정산 리포트'],
    ['16', '세무사 비용 부담', '월 10~30만원 세무대리비가 큰 고정비', '삼쩜삼: 무료/저가 세금 서비스 / SSEM: 월 3.3만원'],
    ['17', '현금영수증/세금계산서 관리', '발급/수취 관리 번거롭고 누락 시 가산세', '캐시노트: 현금영수증/계산서 자동 조회 / 홈택스 연동 서비스'],
    ['18', '카드매출 입금 시차', '결제~입금 2~7일. 임대료/인건비 지급일과 불일치', '토스페이먼츠: D+1 빠른 정산 / 캐시노트: 입금 예정일 알림'],
  ],
  '4. 마케팅/집객': [
    ['19', '마케팅 예산/인력 부족', '소상공인 마케팅 지원 요구 22.9%. 전문인력 없음', '네이버 플레이스: 무료 매장 등록 / 당근 비즈프로필: 동네 무료 홍보'],
    ['20', 'SNS 마케팅 운영 어려움', '인스타/블로그 콘텐츠 제작과 지속 운영 부담', '캔바: 무료 디자인 템플릿 / ChatGPT·Claude: AI 마케팅 카피 생성'],
    ['21', '네이버 플레이스 상위 노출 어려움', '검색 노출이 매출과 직결되나 알고리즘 최적화 어려움', '네이버 플레이스 광고: 유료 상위 노출 | [기회] 소상공인 SEO 자동최적화'],
    ['22', '악성 리뷰/별점 테러', '부당한 악성 리뷰로 매출 타격. 대응 방법 모름', '캐시노트 플러스: 리뷰 통합관리 | [기회] AI 악성 리뷰 자동대응/신고'],
    ['23', '신규 고객 유치 어려움', '상권 경쟁 심화로 신규 확보 비용 증가', '토스애즈: 위치 기반 타겟 광고 / 당근마켓: 동네 노출'],
    ['24', '재방문율 관리 어려움', '단골 관리를 체계적으로 못함. 종이쿠폰 비효율', '도도포인트: 태블릿 적립/CRM / 카카오톡 채널: 단골 메시지'],
  ],
  '5. 재고/발주': [
    ['25', '원부자재/재료비 상승', '소상공인 28.3%가 원부자재 상승 지목', '마켓보로(식봄): 가격비교/최저가 발주 / 푸드팡: 산지직송 | [기회] AI 원가예측'],
    ['26', '재고 관리 수기/감에 의존', '재고 부정확 → 폐기 손실 또는 품절', '마켓보로: 자동발주/재고관리 / BoxHero: 바코드 재고관리 앱'],
    ['27', '발주 시스템 비효율', '유선/문자 수동 발주, 실수·누락 빈번', '마켓보로: 온라인 식자재 발주 | [기회] 매출예측 기반 자동발주 AI'],
    ['28', '유통기한/폐기 관리', '유통기한 관리 미흡 → 폐기 손실, 위생법 위반', 'BoxHero: 유통기한 알림 | [기회] 소상공인용 저가 유통기한 자동추적'],
    ['29', '물류/배송비 부담', '소량 발주 시 단가/배송비 높음', '마켓보로: 소량발주+묶음배송 / 쿠팡비즈: 당일배송 | [기회] 소상공인 공동구매'],
  ],
  '6. 부동산/임대': [
    ['30', '임대료 부담', '경영비용 중 임차료 18.7%. 매출 하락에도 고정', '공유주방(위쿡): 초기 부담 없이 창업 | [기회] 매출연동형 변동 임대료'],
    ['31', '권리금 분쟁', '권리금 회수 보장 미흡. 임대인과 갈등 빈번', '로톡/로앤컴퍼니: 저가 법률상담 | [기회] 권리금 에스크로/보증 서비스'],
    ['32', '적합한 매장 찾기 어려움', '상권 분석 없이 감으로 입지 선정', '오픈업(KB): 무료 상권 분석 / 소진공 상권정보시스템'],
    ['33', '젠트리피케이션', '상권 활성화 → 임대료 급등 → 기존 소상공인 밀려남', '[미해결] 상가임대차보호법 한계, 갱신거절 시 보호 부족'],
    ['34', '인테리어/시설투자 부담', '개업 시 비용 크고 폐업 시 원상복구 추가', '공유주방(위쿡): 완비 주방 공유 / 소상공인 경영안정 바우처'],
  ],
  '7. 규제/행정': [
    ['35', '복잡한 인허가/신고 절차', '영업신고·위생교육·소방점검 등 업종별 복잡', '정부24: 온라인 인허가 | [기회] 업종별 인허가 체크리스트 AI'],
    ['36', '잦은 법규 변경 대응', '식품위생법·노동법·세법 자주 변경', '삼쩜삼/SSEM: 세법 자동 반영 | [기회] 소상공인 맞춤 법규 변경 알림'],
    ['37', '정부 지원금 신청 복잡', '금융지원 요구 71.9%이나 절차 복잡, 정보 부족', '비즈info: 지원사업 통합 검색 | [기회] AI 맞춤 지원금 추천/신청 대행'],
    ['38', '과잉/중복 규제', '소상공인 19%가 개선 요구. 여러 부처 규제 중복', '[미해결] 규제 샌드박스 논의 중이나 체감 개선 미흡'],
    ['39', '위생/안전 점검 대응 부담', '식품위생·소방·가스 등 각종 점검에 시간/비용', 'HACCP 관리 솔루션: 체크리스트 디지털화 | [기회] 통합 컴플라이언스 관리'],
  ],
  '8. IT/디지털': [
    ['40', '디지털 전환 역량 부족', '디지털 활용 소상공인 27.2%. 나머지 72.8% 미실시', '소상공인 디지털 전환 바우처 / KT 소상공인 DX'],
    ['41', 'POS/키오스크 도입 비용', '초기 설치비 + 월 유지비 부담', '토스플레이스: 저가 올인원 POS / Loyverse: 무료 POS SW'],
    ['42', '여러 앱/시스템 분산 관리', 'POS·배달앱·예약·정산 각각 다른 시스템', '포스피드: 배달앱 통합 | [기회] 소상공인 슈퍼앱 (모든 운영 통합)'],
    ['43', '개인정보 보호/보안 위험', '고객 데이터 관리 이해 부족. 유출 시 법적 책임', 'KISA 포털: 무료 가이드/점검 | [기회] 소상공인 간편 보안 패키지'],
    ['44', '홈페이지/온라인 존재감 부족', '자체 웹사이트 없거나 관리 안 됨', '네이버 스마트플레이스: 무료 매장 페이지 / 식신: 무료 등록'],
  ],
  '9. 고객관리': [
    ['45', '노쇼(No-show) 피해', '예약 후 무단 불참 → 식자재 폐기, 매출 손실', '공비서: 자동 알림톡 / 네이버 예약: 예약금 결제 / 테이블링: 실시간 대기관리'],
    ['46', '고객 데이터 수집/활용 미흡', '방문 패턴·선호도 데이터 수집 못함', '도도포인트: 전화번호 기반 방문/구매 데이터 / 캐시노트: 고객 분석'],
    ['47', '고객 클레임/CS 대응', '불만 고객 대응에 시간 소모. 체계적 매뉴얼 부재', '카카오톡 채널 챗봇: 자동 FAQ | [기회] 소상공인용 AI 고객응대 챗봇'],
    ['48', '단골 유지/이탈 방지', '체계적 단골 관리 수단 부재', '도도포인트: 적립+타겟 마케팅 / 카카오톡 채널: 정기 메시지'],
  ],
  '10. 기타 운영': [
    ['49', '대출/자금 조달 어려움', '이자 부담 59.4%, 한도 부족 49.7%. 평균 대출 1.2억, 월 이자 84.3만원', '핀다: 대출 비교 / 토스 대출: 비대면 / 와디즈: 크라우드펀딩'],
    ['50', '폐업 시 정리 절차 복잡', '자영업자 43.6%가 3년 내 폐업 고려. 세무/임대/인력 정리 복잡', '소진공 희망리턴패키지: 폐업 컨설팅 | [기회] 폐업 원스톱 정리 플랫폼'],
  ],
};

const opportunities = [
  ['매출', '비수기 매출 보전', '매출 연동형 보험/임대료 모델'],
  ['인력', '직원 리텐션/복지', '소상공인 직원 복지 플랫폼'],
  ['재고', '매출 예측 기반 자동 발주', 'AI 수요 예측 + 자동 발주'],
  ['규제', '과잉/중복 규제', '업종별 규제 가이드 AI'],
  ['IT', '시스템 분산', '소상공인 슈퍼앱 (운영 통합)'],
  ['고객', 'AI CS 챗봇', '저가형 AI 고객 응대'],
  ['부동산', '젠트리피케이션', '매출 연동형 임대료 모델'],
  ['행정', '지원금 정보 접근', 'AI 맞춤 지원금 추천/신청 대행'],
  ['보안', '개인정보 관리', '소상공인 간편 보안 패키지'],
  ['폐업', '정리 절차', '폐업 원스톱 정리 플랫폼'],
];

const sources = [
  '소상공인연합회 2026년 신년 경영 실태조사 (1,073명)',
  '한국경제인협회 자영업자 실적/전망 설문 (500명)',
  'Federal Reserve 2025 Small Business Credit Survey',
  'KDI 소상공인 디지털 전환 현황 보고서',
  '헤럴드경제, 아시아투데이, 이로운넷 등 언론 보도',
];

// ── 문서 빌드 ──
const children = [];

// 표지
children.push(h1('소상공인 운영 애로사항 50가지'));
children.push(h2('& 패스트 무버 분석'));
children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '조사일: 2026-04-06', size: 20, font: 'Pretendard', color: '666666' })] }));
children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

// 출처
children.push(p('주요 출처', true));
for (const s of sources) {
  children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 },
    children: [new TextRun({ text: s, size: 18, font: 'Pretendard', color: '555555' })] }));
}
children.push(bigSpacer());

// 요약 수치
children.push(h2('한눈에 보는 소상공인 현실'));
const sumRows = [
  ['매출 감소', '자영업자 72.6%가 전년 대비 매출 감소 (평균 -12.8%)'],
  ['1순위 원인', '내수부진 77.4%'],
  ['인건비 비중', '경영비용의 21.2%'],
  ['임대료 비중', '경영비용의 18.7%'],
  ['배달앱 수수료', '16.9% ~ 29.3%'],
  ['디지털 전환율', '27.2% (72.8%는 미실시)'],
  ['자금난', '이자 부담 59.4%, 한도 부족 49.7%'],
  ['폐업 고려', '자영업자 43.6%가 3년 내 폐업 고려'],
];
const sumHRow = new TableRow({ children: ['지표', '수치'].map((h, i) => cell(h, { header: true, width: [35, 65][i] })) });
const sumDRows = sumRows.map(r => new TableRow({ children: [cell(r[0], { bold: true, width: 35 }), cell(r[1], { width: 65 })] }));
children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [sumHRow, ...sumDRows] }));
children.push(bigSpacer());

// 카테고리별 테이블
for (const [category, rows] of Object.entries(data)) {
  children.push(h2(category));
  children.push(categoryTable(rows, W));
  children.push(spacer());
}

// 기회 영역
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
children.push(h2('미해결 / 기회 영역 TOP 10'));
children.push(p('아직 충분한 솔루션이 없는 영역 — 스타트업이 진입할 수 있는 기회'));
children.push(spacer());

const oppHRow = new TableRow({ children: ['영역', '미해결 문제', '기회'].map((h, i) =>
  cell(h, { yellow: true, bold: true, width: [15, 35, 50][i] })) });
const oppDRows = opportunities.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: [15, 35, 50][i] })) }));
children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [oppHRow, ...oppDRows] }));
children.push(bigSpacer());

// 주요 패스트 무버 정리
children.push(h2('주요 패스트 무버 커버리지'));
children.push(p('가장 넓은 영역을 커버하는 서비스'));
children.push(spacer());
children.push(makeTable(
  ['서비스', '커버 영역', '핵심 기능'],
  [
    ['캐시노트 (한국신용데이터)', '매출분석, 장부, 정산, 리뷰, 상권', '카드매출/계좌 자동 수집, 미지급 진단, 상권 리포트'],
    ['토스 (비바리퍼블리카)', '결제, 정산, 대출, 마케팅, POS', '저수수료 결제, D+1 정산, 위치기반 광고, POS'],
    ['삼쩜삼 (자비스앤빌런즈)', '세무, 회계', 'AI 세금신고/환급, 부가세/종소세 자동화'],
    ['마켓보로 (식봄)', '식자재 발주, 재고', '온라인 발주, 가격비교, 재고관리'],
    ['보스몬', '인력, 급여, 계약', '출퇴근/급여 자동정산, 전자근로계약'],
    ['도도포인트', '고객관리, 마케팅', '적립/CRM, 방문데이터, 타겟마케팅'],
  ],
  [20, 30, 50],
));

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    children,
  }],
});

const outPath = process.env.USERPROFILE + '/OneDrive/바탕 화면/DB/소상공인-운영애로사항-50-패스트무버.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('생성 완료:', outPath);
});
