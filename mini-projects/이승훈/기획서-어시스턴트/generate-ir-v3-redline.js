const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType, PageBreak } = require("docx");
const fs = require("fs");

// ========== 기본 스타일 헬퍼 (검정) ==========
const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, bold: true, size: 48, font: "맑은 고딕" })] });
const subtitle = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text, size: 24, font: "맑은 고딕", color: "666666" })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, font: "맑은 고딕" })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 26, font: "맑은 고딕" })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [new TextRun({ text, bold: true, size: 22, font: "맑은 고딕" })] });
const p = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pBold = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });
const bullet = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const bullet2 = (text) => new Paragraph({ bullet: { level: 1 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const quote = (text) => new Paragraph({
  spacing: { before: 100, after: 100 },
  indent: { left: 720 },
  children: [new TextRun({ text, italics: true, size: 20, font: "맑은 고딕", color: "555555" })]
});

// ========== 빨간 글씨 헬퍼 (v3 신규 추가분) ==========
const RED = "FF0000";
const rH2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 26, font: "맑은 고딕", color: RED })] });
const rH3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [new TextRun({ text, bold: true, size: 22, font: "맑은 고딕", color: RED })] });
const rP = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕", color: RED })] });
const rPBold = (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕", color: RED })] });
const rBullet = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕", color: RED })] });
const rQuote = (text) => new Paragraph({
  spacing: { before: 100, after: 100 },
  indent: { left: 720 },
  children: [new TextRun({ text, italics: true, size: 20, font: "맑은 고딕", color: RED })]
});

// ========== 표 헬퍼 ==========
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };

function makeTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2C3E50" },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
  }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18, font: "맑은 고딕" })] })],
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
    }))
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: headerCells }), ...dataRows] });
}

function makeRedTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: "8B0000" },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
  }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18, font: "맑은 고딕", color: RED })] })],
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
    }))
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: headerCells }), ...dataRows] });
}

// === 문서 생성 ===
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      // ===== 표지 =====
      empty(), empty(), empty(), empty(), empty(),
      title("(주)신도시"),
      subtitle("The First City OS Provider."),
      empty(), empty(),
      title("슈파(SUPA) — 사장님의 슈퍼 파트너"),
      subtitle("경영 지원 + 비용 절감, AI로 한 번에"),
      empty(), empty(), empty(), empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Seed Round · 2.5억원", bold: true, size: 28, font: "맑은 고딕" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2026년 3월", size: 22, font: "맑은 고딕", color: "888888" })] }),
      empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "※ 빨간 글씨 = v2 대비 신규 추가된 내용 (v3)", bold: true, size: 22, font: "맑은 고딕", color: RED })] }),

      pageBreak(),

      // ===== 목차 =====
      h1("목차"),
      p("1. Problem — 숫자로 보는 위기"),
      p("2. Solution — 슈파(SUPA): 사장님의 슈퍼 파트너"),
      p("3. Product — 서비스 구조"),
      p("4. Business Model — 수익 구조"),
      p("5. Market — 시장 규모"),
      p("6. Go-to-Market — 유저 확보 전략"),
      p("7. Competitive Landscape — 경쟁 분석"),
      p("8. Structure — PropCo / OpCo 구조"),
      p("9. Team — AI 네이티브 조직"),
      p("10. Traction — 현재까지"),
      p("11. Ask — 투자 요청"),
      p("12. 비전"),
      p("13. Expected Synergy — 기대 효과"),

      pageBreak(),

      // ===== 1. Problem =====
      h1("1. Problem — 숫자로 보는 위기"),
      p("대한민국에서 가장 거대하지만, 가장 비효율적인 시장."),
      empty(),
      h2("The 95% Majority"),
      makeTable(["지표", "수치"], [
        ["국내 소상공인 사업체 수", "약 790만 7천 개 (전체의 95.2%)"],
        ["소상공인 종사자 수", "약 1,090만 명 (전체의 45.9%)"],
      ]),
      empty(),
      p("소상공인은 국가 경제의 모세혈관이자 고용의 핵심이나, 가장 낙후된 경영 환경에 방치되어 있다."),
      empty(),
      h2("구조적 문제"),
      makeTable(["문제", "현실"], [
        ["경영 비효율", "세무, 마케팅, 재고, 고객관리를 사장님이 직접 → 본업에 집중 못 함"],
        ["고비용 구조", "개별 점포 단위의 구매·마케팅·채용 = 구조적으로 '고비용 저효율'"],
        ["기존 지원의 한계", "교육·컨설팅(간접 지원) → \"배웠는데 할 시간이 없다\""],
        ["디지털 격차", "AI 기술은 발전하지만, 소상공인 현장에 맞는 도구는 거의 없음"],
        ["생존 위기", "인건비 급등 + AI 가속화 속에서, 데이터 없는 소상공인은 '소멸' 위기"],
      ]),

      pageBreak(),

      // ===== 2. Solution =====
      h1("2. Solution — 슈파(SUPA): 사장님의 슈퍼 파트너"),
      quote("\"뭉치면 싸지고, 쌓이면 보인다.\""),
      p("AI로 경영을 도와주고, 유저가 모이면 비용까지 낮춰준다."),
      p("사장님이 내는 돈은 거의 없다. AI가 운영하니까."),
      empty(),
      h2("한 문장 정의"),
      pBold("슈파 = 소상공인의 AI 경영 파트너. 경영 효율화(완전 무료) + 공동구매·물류 비용 절감."),
      empty(),
      h2("(주)신도시의 정의"),
      p("도시의 상업 활동을 관장하는 운영체제(OS)를 공급하는 로컬 테크(Local Tech) 기업."),
      p("핵심 솔루션 '슈파'로 파편화된 로컬 비즈니스를 디지털로 혁신한다."),
      empty(),
      h2("왜 지금 가능한가"),
      bullet("AI 운영 비용 ≒ 0 → 수수료를 극도로 낮게 받아도 사업이 돌아감"),
      bullet("기존 SaaS는 구독료가 수익 → 무료로 못 함"),
      bullet("슈파는 구독료가 아니라 데이터와 네트워크 효과가 수익 → 무료가 전략"),

      pageBreak(),

      // ===== 3. Product =====
      h1("3. Product — 서비스 구조"),

      h2("3-1. 플라이휠 (핵심 도식)"),
      p("AI로 운영비 ≒ 0 → 수수료 최소화"),
      p("→ 사장님 부담 없이 가입 → 유저 확보"),
      p("→ 유저가 모이면 → 공동구매·물류 원가 절감"),
      p("→ 경영 지원 + 실제 비용 절감 → 더 많은 사장님 유입"),
      p("→ 데이터 축적 → 진짜 자산"),
      p("→ 🔄 계속 돈다"),
      empty(),

      h2("3-2. Phase 1 — 행궁동·수원 장악 (~27년 1분기)"),
      quote("\"Traffic First, Monetize Later.\" — 선 트래픽 확보, 후 고도화"),
      empty(),

      h3("① Cost Innovation — 비용의 파괴적 혁신"),
      p("초기 유저 확보를 위한 핵심 가치(Killer Value) = '즉각적인 비용 절감'"),
      empty(),
      makeTable(["기능", "설명"], [
        ["슈파 Buying (공동 구매)", "1,000개 가맹점의 구매력 통합 → 식자재·소모품·배달용기를 프랜차이즈 본사 공급가 수준으로 인하"],
        ["Shared Service (공유 인프라)", "세무 기장, 법률 자문, 방역, 렌탈 등 공통 고정비를 'N분의 1' 구조로 최소화"],
      ]),
      empty(),
      p("유통 도메인 파트너사와 연결 (직접 물류 안 함 = Asset Light)"),
      p("5개소만 묶어도 유통 업체에게 매력적 → 50개소, 100개소면 협상력 ↑"),
      empty(),

      h3("② AI 경영 효율화 (완전 무료)"),
      p("MVP 핵심 — 26년 9월 출시"),
      makeTable(["기능", "설명"], [
        ["AI 경영 대시보드", "매출·비용 자동 정리, 한눈에 보는 가게 현황"],
        ["세무·장부 자동 정리", "거래 자동 분류, 부가세·종소세 신고 보조"],
        ["SNS 콘텐츠 자동 생성", "가게 사진 → 인스타·네이버 포스트 자동 생성"],
        ["구매몰 (공동구매)", "식자재·소모품 공동구매 주문·결제 시스템"],
        ["고객·예약 관리", "단골 관리, 예약 자동 응대, 고객 알림"],
        ["AI 상담 챗봇", "사장님 질문에 AI가 365일 답변 (세무, 노무, 마케팅 등)"],
      ]),
      empty(),
      p("MVP 확장 — 26년 12월까지"),
      makeTable(["기능", "설명"], [
        ["매출·원가 분석 리포트", "월별·주별 매출 트렌드, 원가율 알림, 손익 분석"],
        ["마케팅 기본", "리뷰 자동 응대, 키워드 분석, 프로모션 제안"],
        ["인력 매칭", "단기 아르바이트·전문 인력 연결"],
        ["메뉴·상품 분석", "인기/비인기 메뉴 분석, 가격 최적화 제안"],
      ]),
      empty(),

      p("고급 기능 — Phase 2 (27년~)"),
      makeTable(["기능", "설명"], [
        ["Predictive AI", "날씨·행사·유동인구 결합 → 발주량·필요 인력 예측"],
        ["Peer Benchmarking", "내 가게를 동일 상권 상위 10%와 비교"],
        ["맞춤 자동화", "가게별 고유 문제 진단 → 커스텀 해결 (현장 지식 기반)"],
        ["마케팅 고급 분석", "상권 분석, 타겟 마케팅, 광고 효율 추적"],
        ["입지·상권 분석", "창업 전 입지 평가, 상권 트렌드 리포트"],
        ["거래처·계약 관리", "납품 단가 비교, 계약 갱신 알림, 거래처 평가"],
      ]),
      empty(),
      p("개발 방식: 전략적 파트너와 공동 개발"),
      bullet("창업팀 3명(기획·현장·영업) + 전략적 파트너의 개발 인력"),
      bullet("창업팀은 기획·UX 설계·현장 검증·데이터 수집에 집중"),
      bullet("개발팀은 설계·구현·운영에 집중"),
      bullet("공동 개발 구조의 근거: 전략적 파트너는 슈파의 소상공인 현장 채널과 운영 데이터에 접근하고, 신도시는 개발 역량을 확보하는 상호 이익 구조"),
      empty(),

      h3("③ 완전 무료 전략"),
      p("Phase 1~2 모두 구독료 0원. 경영자동화 전 기능을 무료로 개방한다."),
      p("수익은 구매몰 수수료 3%와 데이터 판매로 만든다. 사장님에게 월정액을 받지 않는다."),
      empty(),
      makeTable(["기존 플랫폼", "수수료", "슈파"], [
        ["네이버 스마트스토어", "5~8%", "구매몰 수수료 3%"],
        ["쿠팡 마켓플레이스", "10~15%", "(기존 대비 50~80% 절감)"],
        ["배달의민족", "6.8% + 광고비 (실질 15~20%)", ""],
        ["SPC 등 B2B 유통", "15~25%", ""],
      ]),
      empty(),
      p("슈파 구매몰은 B2B 거래(사업자 간 식자재 구매)이므로 세금계산서 + 계좌이체 방식 적용."),
      p("PG 결제 수수료 없이 수수료 3%가 온전히 슈파 마진이 된다."),
      p("사장님도 세금계산서 발행으로 부가세 매입세액 공제를 받을 수 있어 양쪽 모두 유리."),
      empty(),
      pBold("KPI: 행궁동 100개소 → 수원 1,000개소"),
      pBold("수익: 구매몰 수수료 3% + B2G 용역 (캐시카우). 구독료 없음"),

      pageBreak(),

      // Phase 2
      h2("3-3. Phase 2 — 국내 확장 + 수익화 (27년~)"),
      p("두 가지 수익 엔진이 동시에 켜지는 단계"),
      empty(),

      h3("① 데이터 판매 — 핵심 수익 엔진"),
      pBold("슈파만이 가진 데이터: 매입 + 매출 + 맥락의 통합 데이터"),
      p("카드사는 매출 데이터만 있다. 유통사는 매입 데이터만 있다."),
      p("슈파는 '어떤 가게가, 뭘 사서, 뭘 만들어, 얼마에 팔았는지'를 전부 안다."),
      p("이 통합 데이터는 카드사도, 배민도, 캐시노트도 갖고 있지 않다."),
      empty(),

      pBold("데이터 수집 구조 — 단계적 확장"),
      empty(),
      makeTable(["데이터 종류", "수집 방법", "수집 시점"], [
        ["매입 데이터 (핵심)", "슈파 구매몰 주문 내역에서 자동 수집. 어떤 가게가 어떤 식자재를 얼마나 사는지 = 슈파만 가진 데이터", "Phase 1 (구매몰 오픈 시)"],
        ["매출 총액 데이터", "금융 데이터 API 중개업체(쿠콘 등)를 통한 카드 매출 자동 연동. 사장님은 사업자등록번호 + 본인인증만 하면 끝", "Phase 1 (MVP)"],
        ["맥락 데이터", "AI 상담 기록 + 업종·위치·운영 형태 등 프로필 정보", "Phase 1 (가입 시)"],
        ["품목별 판매 데이터", "클라우드 POS 제휴(토스POS, 페이히어 등) + 배달앱 연동으로 메뉴별 판매 수량 확보", "Phase 2 (제휴 확장)"],
      ]),
      empty(),

      pBold("Phase 1 — 매입 데이터가 진짜 자산"),
      p("카드 매출 데이터는 '얼마 팔았는지(총액)'만 안다. 어떤 메뉴가 몇 개 나갔는지는 모른다."),
      p("하지만 슈파 구매몰의 매입 데이터는 '어떤 식자재를, 얼마나, 얼마에 사는지'를 정확히 안다."),
      p("유통사·식자재 공급사에게는 카드 매출보다 매입 데이터가 훨씬 가치 있다."),
      p("\"이 지역에서 양파가 월 몇 톤 소비되는가\" — 이걸 아는 곳은 슈파뿐이다."),
      empty(),
      pBold("매입 + 매출 총액이 합쳐지면:"),
      p("→ 원가율(매입÷매출) 자동 계산 = 금융사 신용평가에 핵심 지표"),
      p("→ \"행궁동 한식집 평균 원가율 42%, 월매출 1,800만원, 2인 운영\""),
      p("→ 이 수준의 통합 인사이트를 제공할 수 있는 플레이어는 슈파뿐이다."),
      empty(),

      pBold("Phase 2 — 품목별 판매 데이터로 확장"),
      p("클라우드 POS(토스POS, 페이히어 등)와 제휴하면 메뉴별 판매 수량까지 확보된다."),
      p("배달앱(배민, 쿠팡이츠) 연동으로 배달 주문의 품목별 데이터도 수집 가능."),
      p("마이데이터 사업자 등록을 통해 카드 매출 직접 연동으로 전환하여 비용을 절감한다."),
      empty(),

      pBold("데이터 수집 로드맵"),
      makeTable(["단계", "수집하는 것", "알 수 있는 것"], [
        ["Phase 1", "매입(구매몰) + 매출 총액(카드 API) + 맥락", "원가율, 매출 추이, 업종별 소비 패턴"],
        ["Phase 2", "+ 품목별 판매(POS 제휴) + 배달앱", "메뉴별 인기도, 가격 최적화, 수요 예측"],
      ]),
      empty(),

      pBold("데이터 판매 대상"),
      makeTable(["데이터 구매자", "활용", "예상 가격대"], [
        ["금융사", "소상공인 신용평가, 맞춤 대출", "연 3,000만~1억원"],
        ["유통사", "상권·소비 트렌드, 수요 예측", "연 2,000~8,000만원"],
        ["보험사", "업종별 리스크 분석", "연 1,000~3,000만원"],
        ["지자체", "상권 정책 근거 데이터", "연 500~2,000만원"],
        ["프랜차이즈 본사", "벤치마킹, 신규 출점", "리포트당 30~100만원"],
      ]),
      empty(),
      p("첫 번째 데이터 바이어: 수원시 (기존 2년 협업 관계 → 상권 정책 데이터 리포트 납품 가능)"),
      p("레퍼런스: 캐시노트(KCD)는 170만 사업장 기반 연결 매출 1,428억원. 사업장당 약 8만원/년 수준."),
      empty(),
      rPBold("가격 추정 근거 — KCD 단가 역산"),
      rP("KCD 벤치마크: 170만 사업장 → 연 매출 1,428억원 = 사업장당 약 8.4만원/년"),
      rP("슈파 1,000개소 × 8.4만원 = 약 8,400만원/년 (KCD 동일 단가 적용 시)"),
      rP("슈파 프리미엄: KCD에 없는 매입 데이터(구매몰) + 맥락 데이터(AI 상담) 보유 → 단가 상승 여력"),
      rP("보수적 추정: Phase 2 데이터 판매 연 8,000만~1.5억원 (1,000개소 기준)"),
      empty(),

      h3("② 광고 수익"),
      p("유통사·공급사 → 소상공인 대상 타겟 광고"),
      p("슈파 구매몰 내 추천 상품, 배너, 프로모션 영역"),
      empty(),

      h3("③ 상권 기금 선순환 (Ecosystem Fund)"),
      quote("\"내 거래가 우리 동네를 지킨다\""),
      p("슈파는 단순 도구가 아니라 지역 생태계 플랫폼이다."),
      p("구매몰 수수료와 데이터 판매 수익의 일부를 공존 기금으로 적립하여,"),
      p("소상공인이 만든 가치가 소상공인에게 돌아가는 선순환을 만든다."),
      empty(),
      makeTable(["영역", "예시"], [
        ["상권 활성화", "로컬 기획 프로젝트, 공동 마케팅"],
        ["젠트리피케이션 방지", "임대료 안정 기금, 장기 임차 지원"],
        ["재기 지원", "폐업 소상공인 재창업 자금, 컨설팅"],
      ]),
      empty(),
      pBold("투자자 관점: 공존 기금이 만드는 '지역 귀속감'은 경쟁사가 복제할 수 없는 유저 잔존율의 핵심 동력이다. 비용이 아니라 해자(moat)."),

      pageBreak(),

      // Phase 3
      h2("3-4. Phase 3 — 피지컬 AI (라스트마일)"),
      p("현실에서 데이터를 모으고, 피지컬 AI를 구현하는 도메인"),
      empty(),
      p("Phase 1~2에서 쌓은 것:"),
      bullet("소상공인 현장 접점 (설치·운영 채널)"),
      bullet("업종별 운영 데이터 (학습 데이터)"),
      bullet("물류·배송 네트워크 (인프라)"),
      empty(),
      p("→ 피지컬 AI 접목: 배달·물류 로봇, 매장 자동화 기기, 무인 주문·결제, 재고 자동 관리"),
      empty(),
      pBold("핵심: 로봇을 만드는 건 다른 회사도 하지만, 소상공인 현장에 놓을 수 있는 도메인(현장 채널 + 데이터 + 현장 지식)을 가진 곳은 우리뿐."),

      pageBreak(),

      // ===== 4. Business Model =====
      h1("4. Business Model — 수익 구조"),
      h2("Two-Track: Cash Cow + Tech Growth"),
      makeTable(["Track", "수익원", "시점"], [
        ["Cash Cow (생존)", "B2G 용역·컨설팅 (글로컬상권 수행 경험 기반, 연 1~2억)", "Y1~"],
        ["Cash Cow (생존)", "팝업/이벤트 대행 (공존공간 인프라 활용)", "Y1~"],
        ["Tech Growth", "구매몰 수수료 3% (구독료 없음. 선 트래픽 확보)", "Phase 1"],
        ["Tech Growth", "데이터 판매 (B2B)", "Phase 2"],
        ["Tech Growth", "광고 (구매몰 내 타겟 광고)", "Phase 2"],
        ["Tech Growth", "피지컬 AI (RaaS, 하드웨어)", "Phase 3"],
      ]),
      empty(),
      h2("왜 무료가 가능한가"),
      makeTable(["기존 구독형 서비스", "슈파"], [
        ["사람이 운영 → 인건비 큼", "AI가 운영 → 운영비 ≒ 0"],
        ["구독료가 수익 → 무료 불가", "데이터·네트워크가 수익 → 무료가 전략"],
        ["유저 이탈 = 매출 하락", "유저 증가 = 데이터 자산 + 물류 협상력 ↑"],
      ]),
      empty(),

      h2("3개년 추정 손익 (P&L)"),
      p("(단위: 억원)"),
      makeTable(["구분", "2026년", "2027년", "2028년"], [
        ["매출", "2.1", "5.7", "26.9"],
        ["  - B2G 용역 (캐시카우)", "2.0", "2.0", "2.0"],
        ["  - 구매몰 수수료 3%", "0.1", "2.1", "18.9"],
        ["  - 데이터 판매", "—", "0.8", "3.0"],
        ["  - 광고", "—", "0.8", "3.0"],
        ["비용", "3.0", "5.5", "11.0"],
        ["영업이익", "-0.9", "+0.2", "+15.9"],
      ]),
      empty(),
      bullet("2026년 (기반 구축): B2G 용역으로 버티면서 유저 확보에 올인. 적자 9,000만원은 투자금으로 커버"),
      bullet("2027년 (전환점): 구매몰 수수료 + 데이터 판매 + 광고가 동시에 켜짐. 흑자 전환"),
      bullet("2028년 (폭발적 성장): 전국 5,000개소로 확장. 구매몰 거래액이 레버리지 → 영업이익 15.9억"),
      rP("  → 5,000개소 근거: 수원 1,000개소 성공 모델 → CSP 멀티허브 거점 도시(전주·제주·양양·대전 등)로 단계 확장"),
      empty(),
      pBold("핵심 매출 엔진 = 구매몰 수수료 3%"),
      p("가게가 늘면 → 구매몰 거래가 늘고 → 수수료가 자동으로 커지는 구조."),
      p("사람을 더 안 뽑아도 매출이 올라감 (= Asset Light의 힘)."),
      empty(),
      h3("2028년 구매몰 수수료 18.9억원 산출"),
      p("전국 5,000개소 × 구매몰 이용률 35%(보수적) = 1,750개소 이용"),
      p("× 전 업종 가중 월 구매액 300만원 × 12개월 = 연간 GMV 약 630억원"),
      p("× 수수료 3% = 18.9억원"),
      empty(),
      p("최저가 정책 효과로 이용률이 50%까지 상승하면 GMV 약 900억원, 수수료 약 27억원."),
      empty(),

      h3("P&L 추정 근거"),
      makeTable(["가정", "수치", "출처"], [
        ["음식점 월 식재료비", "매출의 40~48% (월 760~910만원)", "KREI 외식업체 경영실태조사 2024"],
        ["소상공인 월 평균 매출", "1,660만원", "중기부 소상공인실태조사 2023"],
        ["행궁동 식음 업종 비율", "54% (449개 중 244개)", "수원시 상권컨설팅 2023"],
        ["전 업종 가중 월 구매액", "250~350만원", "식음(700만+) + 비식음(100만) 가중 추정"],
        ["구매몰 이용률", "35% → 50% (최저가 효과)", "자체 추정"],
      ]),

      pageBreak(),

      // ===== 5. Market =====
      h1("5. Market — 시장 규모"),
      h2("슈파의 시장은 SaaS가 아니라 유통이다"),
      p("AI 경영보조는 유저를 모으는 무료 서비스이고, 진짜 매출은 구매몰 수수료에서 나온다."),
      p("따라서 TAM은 SaaS 시장(4,000~6,000억원)이 아니라, 소상공인 구매/유통 시장이다."),
      empty(),
      h2("TAM · SAM · SOM"),
      makeTable(["구분", "정의", "규모"], [
        ["TAM", "국내 소상공인 구매/유통 시장", "64조원"],
        ["", "→ 슈파 수수료 기준 (64조 × 3%)", "약 1.9조원"],
        ["SAM", "수원시 소상공인 약 11~13만개", "약 5,000~7,000억원"],
        ["SOM", "행궁동 100개소 → 수원 1,000개소", "Phase 1 GMV 약 40~70억원"],
      ]),
      empty(),
      h3("TAM 산출 근거"),
      makeTable(["항목", "수치", "출처"], [
        ["국내 B2B 식자재 유통 시장", "64조원 (2025년 추정)", "벤처스퀘어, 한국경제"],
        ["국내 소상공인 수", "596만 개 (2023년 기준)", "중기부 소상공인실태조사 2023"],
        ["음식점 월 식재료비", "매출의 40~48%", "KREI 외식업체 경영실태조사 2024"],
        ["수원시 소상공인 수", "약 11~13만 개", "경기도 사업체 수 × 수원 인구 비중"],
        ["행궁동 사업체 수 (장안동·신풍동)", "449개 (식음 54%)", "수원시 상권컨설팅 2023"],
        ["행궁동 상권 전체", "약 2,400개 사업자", "현장 파악"],
      ]),
      empty(),
      h3("시장 트렌드"),
      bullet("소상공인 디지털 전환 가속화 — 정부 데이터바우처 사업 등 정책 지원 확대"),
      bullet("AI 비용 급락 → 소상공인도 AI를 쓸 수 있는 시대 도래"),
      bullet("B2B 식자재 유통 시장 디지털화 가속 — 80% 이상이 아직 영세 유통업체 중심"),
      bullet("피지컬 AI(배달로봇 등) 규제 완화 추세"),
      bullet("한국 데이터 시장: 27조원(2023) → 49조원(2028 목표), 연평균 12.7% 성장"),

      pageBreak(),

      // ===== 6. Go-to-Market =====
      h1("6. Go-to-Market — 유저 확보 전략"),
      quote("\"Zero Barrier.\" — 진입 장벽 제거"),
      empty(),

      h2("Phase 1-1: 행궁동 100개소 (~26년 12월)"),
      makeTable(["채널", "전략", "목표"], [
        ["① 글로컬상권 네트워크", "2년 142회 현장 협업 관계 + 200여 핵심 사업자 DB", "초기 50개소+"],
        ["② 찾아가는 온보딩", "직접 방문 + 설치 + 교육", "100개소 확대"],
        ["③ 구매의향서(LOI) 확보", "MVP 출시 전 품목별 구매의향서 수집 → 수요 검증", "수요 증빙"],
      ]),
      empty(),
      pBold("구매의향서(LOI) = MVP 전 수요 검증"),
      p("시스템이 완성되기 전에, 행궁동 소상공인 대상으로 품목별 구매의향서를 확보한다."),
      p("\"이 품목을, 이 가격이면 공동구매하겠다\"는 서면 확인 = 투자자에게 수요가 이미 존재한다는 증거."),
      p("동시에 어떤 품목에 수요가 집중되는지 데이터를 확보 → MVP 우선순위 결정에 활용."),
      empty(),

      h2("Phase 1-2: 수원 1,000개소 (~27년 1분기)"),
      makeTable(["채널", "전략", "목표"], [
        ["③ 행정 공식 접근", "지자체 협업으로 전통시장·상권 단위 확보", "상권 단위 확보"],
        ["④ 전략적 파트너 네트워크", "유통 업체 연결", "유통 연결"],
      ]),
      empty(),

      h2("Phase 2: 전국 (27년~)"),
      makeTable(["채널", "전략"], [
        ["⑤ 수원 성공 모델 복제", "타 지자체로 City OS 확산"],
        ["⑥ 데이터 판매 실적 기반", "파트너 확대"],
      ]),
      empty(),

      h3("핵심 논리"),
      bullet("무료 서비스 = 행정 접근 가능. 지자체 입장에서 \"소상공인에게 무료 AI 경영 지원\"은 정책 목표와 일치"),
      bullet("공존공간 대표가 이미 2년간 지자체·소상공인·행정 3자 협업을 해본 사람"),
      bullet("민간 주도 상권관리기구(BID) 행궁동행의 기획 주체 → 상권 내 '관리자 명분' 보유"),
      bullet("다른 스타트업이 \"행정에 접근하겠습니다\"라고 하면 뜬소리지만, 이 팀은 이미 하고 있는 사람들"),

      pageBreak(),

      // ===== 7. Competitive Landscape =====
      h1("7. Competitive Landscape — 경쟁 분석"),

      // ★★★ [v3 추가] 경쟁사 실적 비교 — 실제 숫자 ★★★
      rH2("경쟁사 실적 비교 — 숫자로 보는 시장"),
      rP("이 시장에서 이미 검증된 플레이어들의 실적이다. 시장은 존재하고, 돈이 된다."),
      empty(),
      makeRedTable(["기업", "사업장 수", "연 매출", "핵심 수익 모델", "밸류에이션"], [
        ["캐시노트 (KCD)", "170만", "1,428억 (2024)", "금융중개 + B2B 데이터 판매 + 멤버십", "~1조+ (유니콘)"],
        ["토스플레이스", "20만 가맹점", "4,333억 (머천트, 2025 상반기)", "결제 수수료 + 단말기", "토스 연결 15조+"],
        ["당근", "비즈프로필 200만", "1,891억 (2024)", "하이퍼로컬 광고 99%", "~3조"],
        ["스마트푸드네트웍스", "5,500개 외식업", "~3,000억 (2023)", "식자재 유통 마진", "누적투자 625억"],
      ]),
      empty(),

      rH3("캐시노트(KCD)의 데이터 사업 모델 — 슈파의 직접 벤치마크"),
      rP("캐시노트는 \"무료 앱으로 사업장을 모으고 → 데이터를 쌓고 → 금융사에 판다\"는 플라이휠의 원조다."),
      empty(),
      makeRedTable(["수익원", "구조", "규모"], [
        ["금융상품 중개", "매출/계좌 데이터 기반 맞춤 대출 추천 → 금융사 중개 수수료", "29개 금융사, 33개 금융상품 연결"],
        ["B2B 데이터 판매 (크레딧브리지)", "사업자 동의 → 운영 데이터(매출·단골·계좌)를 금융사에 전달", "개인사업자 신용평가용"],
        ["멤버십 구독", "월 33,000원 유료 구독 — 사업 필수 패키지", "2023년 출시"],
      ]),
      empty(),
      rPBold("KCD의 한계 = 슈파의 기회"),
      rP("KCD는 \"매출 데이터\"만 안다. 어떤 식자재를 얼마에 사는지(매입)는 모른다."),
      rP("슈파는 구매몰을 통해 매입 데이터를 직접 수집한다. 이것은 KCD에 없는 데이터다."),
      rP("매입 + 매출 + 맥락 = 통합 데이터. 이걸 가진 곳은 슈파뿐이다."),
      rP("KCD와 슈파는 경쟁이 아니라 보완 관계. KCD가 슈파의 매입 데이터 바이어가 될 수 있다."),
      empty(),
      rP("데이터 시장 규모: 국내 데이터산업 25조원(2022) → 50조원(2027 목표), 연 12.6% 성장"),
      empty(),

      h2("주요 비교"),
      makeTable(["구분", "캐시노트 (KCD)", "스마트푸드네트웍스", "슈파 (SUPA)"], [
        ["핵심", "무료 매출관리 → 금융중개", "식자재 유통 + 무료 장부앱", "AI 경영 자동화 + 공동구매"],
        ["유저", "170만 사업장", "35,000개 매장", "0 (MVP 전)"],
        ["업종", "전 업종", "외식업만", "전 업종"],
        ["AI 깊이", "매출 분석", "리뷰 자동 응답 1개", "경영 전반 AI 자동화 + Predictive AI"],
        ["비용 절감", "금융 중개", "식자재 원가만", "경영비+물류+공동구매+Shared Service"],
        ["물류", "없음", "자체 물류 (Asset Heavy)", "파트너 연결 (Asset Light)"],
        ["데이터 수익", "금융중개형", "없음", "B2B 데이터 판매"],
        ["피지컬 AI", "없음", "없음", "Phase 3 로드맵"],
      ]),
      empty(),

      h2("MOAT (경쟁 우위)"),
      makeTable(["우위", "설명"], [
        ["현장 지식", "2년 142회 현장 협업 + 200여 핵심 사업자 DB"],
        ["AI 내재화 조직", "3명 + 슈파 AI. 운영비 최소화 = 낮은 수수료"],
        ["관리자 명분", "행궁동행(BID) 기획 주체. 로컬 시장에서 '관리자'로 시작"],
        ["행정 채널", "지자체 2년 협업 + B2G 누적 16.4억원 수행 실적"],
        ["전략적 파트너십", "유통 도메인 연결 + 데이터 판매 협업"],
        ["플라이휠", "유저 → 공동구매 → 비용절감 → 유저. 먼저 돌린 사람이 이김"],
        ["Asset Light", "재고 0, 설비 0의 순수 Tech/Platform"],
        ["통합 데이터", "구매몰 매입 + 카드 매출(API 연동) + 맥락 데이터를 동시에 가진 플레이어 = 슈파뿐"],
      ]),
      empty(),

      p("검증된 선례: 스마트푸드네트웍스가 \"무료 앱 → 유저 확보 → 물류 수익\" 플라이휠로 35,000개 매장을 확보했다."),
      p("슈파는 이 검증된 구조에 AI 경영 자동화 + 전 업종 확장 + 데이터 수익 + 피지컬 AI를 얹는다."),
      empty(),

      h2("슈파는 SaaS가 아니다 — 글로벌 패러다임 전환"),
      p("2026년, 세계 소프트웨어 시장에 \"SaaSpocalypse\"(SaaS 종말)라는 말이 나왔다."),
      p("SaaS 기업 주식에서 시가총액 약 1,300조원이 증발했고, 투자자들은 \"좌석당 구독 모델\"에서 등을 돌리고 있다. (출처: TechCrunch, 2026.02)"),
      empty(),
      quote("\"AI는 소프트웨어 시장(400조)이 아니라 노동 시장(1경 7,000조)을 먹는다.\" — a16z (2025)"),
      quote("\"우리는 더 이상 소프트웨어를 배포하는 것이 아니다. 지능을 배포하는 것이다.\" — NFX (2025)"),
      empty(),
      h3("글로벌 선례"),
      makeTable(["기업", "시작", "진화", "수익 비율"], [
        ["Toast (미국, 시총 67조원)", "외식업 POS 도구", "금융+데이터 플랫폼", "구독 1 : 금융 6"],
        ["Shopify (캐나다)", "온라인 스토어 빌더", "결제+AI 커머스 플랫폼", "구독 1 : 결제 3"],
        ["캐시노트 (한국)", "무료 매출관리", "금융 중개", "무료 → 연결 매출 1,428억"],
      ]),
      empty(),
      pBold("슈파는 SaaS가 아니다."),
      p("AI 경영 서비스를 무료로 제공해서 유저를 모으고, 유저의 구매력을 통합해 거래 수수료로 수익을 만드는 AI 기반 커머스 플랫폼이다."),

      pageBreak(),

      // ===== 8. Structure =====
      h1("8. Structure — PropCo / OpCo 구조"),
      h2("분리 구조"),
      h3("(주)공존공간 [PropCo — Asset & Governance]"),
      bullet("부동산 자산 보유, 임대"),
      bullet("지역 거버넌스 및 파트너십 관리"),
      bullet("제조업(양조) 리스크 잔존"),
      bullet("신도시에 '실증 단지(Test-bed)' 접근권 제공"),
      empty(),
      h3("(주)신도시 [OpCo — Tech & Operation]"),
      bullet("슈파(SUPA) 개발·운영"),
      bullet("City OS 구축"),
      bullet("지역창업스튜디오 (비즈니스 스케일업)"),
      bullet("Asset-Light: 재고 0, 설비 0"),
      empty(),

      // ★★★ [v3 추가] CSP 전략적 파트너십 — 멀티허브 강조 ★★★
      rH2("전략적 기술 파트너: CSP (Community Scale-up Partners)"),
      rP("로컬 비즈니스 벤처스튜디오. 브랜드·공간·콘텐츠를 동시에 기획·실행하는 컴퍼니 빌더."),
      rP("임팩트 투자사 MYSC로부터 투자 유치 완료."),
      empty(),
      rPBold("멀티허브 전략 — 수원에서 만나는 두 조직"),
      makeRedTable(["CSP 멀티허브", "슈파 거점"], [
        ["전주 · 제주 · 양양 · 수원 · 대전", "수원 행궁동 → 수원 전역 → 전국"],
      ]),
      empty(),
      rP("CSP의 수원 허브와 슈파의 수원 거점이 같은 상권에서 만난다."),
      rP("우연이 아니라 로컬 생태계를 함께 만들어온 관계에서 나온 전략적 결합이다."),
      empty(),
      makeRedTable(["CSP 역할", "슈파에 제공하는 것"], [
        ["공동 개발", "슈파 MVP 설계·구현 (벤처스튜디오 모델)"],
        ["유통 파트너 연결", "식자재 유통사 네트워크 조사·매칭"],
        ["투자자 네트워크", "VC 업계 경력 기반 투자 유치 채널"],
        ["멀티허브 확장", "수원 성공 모델 → CSP 거점 도시로 복제"],
      ]),
      empty(),
      rPBold("벤처스튜디오 모델의 검증된 성과"),
      rP("스튜디오/파트너 기반 스타트업의 시드 펀딩 성공률: 84% (일반 42%)"),
      rP("IRR 53% (일반 VC 21.3%). Zalando, HelloFresh 등 유니콘도 이 모델에서 탄생."),
      rP("CSP와의 JV는 \"외주\"가 아니라 리스크와 성과를 함께 공유하는 \"공동 창업\" 구조."),
      rP("CSP는 슈파의 소상공인 현장 채널과 운영 데이터에 접근하고, 신도시는 개발 역량과 투자 네트워크를 확보하는 상호 이익 구조."),
      empty(),

      h2("전략적 연합"),
      makeTable(["교환", "공존공간 → 신도시", "신도시 → 공존공간"], [
        ["데이터", "15년 축적 아날로그 상권 데이터 + 300여 파트너 DB", "실시간 디지털 상권 분석 데이터"],
        ["인프라", "물리적 거점 (오피스, 라운지, 팝업 공간)", "정당한 임대료 + 인프라 사용료"],
        ["실증", "슈파 솔루션 테스트베드 우선 활용", "상권 매력도 유지·상승에 기여"],
      ]),
      empty(),
      h3("투자자 관점 이점"),
      bullet("부동산 등 무거운 자산에 자금이 묶이지 않음"),
      bullet("오직 성장(Growth)과 기술(Tech)에 자금 투입"),
      bullet("높은 ROE(자기자본이익률) 달성 가능"),
      bullet("Clean Company: 부채와 리스크 제거된 상태에서 출발"),

      pageBreak(),

      // ===== 9. Team =====
      h1("9. Team — AI 네이티브 조직"),
      pBold("3명 + AI = 10인 이상의 속도"),
      p("이 팀의 경쟁력은 개인 이력이 아니라, AI를 내재화한 조직 구조다."),
      p("기획·전략·영업·세무·마케팅·데이터 분석을 3명이 AI와 함께 처리한다."),
      p("사람을 늘리는 게 아니라, AI로 속도를 만드는 조직."),
      empty(),

      makeTable(["", "박승현", "김민호", "이승훈"], [
        ["역할", "대표·기획 총괄", "AI 전략·시스템 설계", "운영·영업"],
        ["도메인", "문화기획 15년·F&B 10년", "공존공간 코파운더", "무역업·소상공인 컨설턴트 10년"],
        ["AI 활용", "AI 기획 자동화·IR 협업", "AI 업무 자동화 설계", "AI 영업 데이터 분석"],
        ["핵심 실적", "글로컬상권 142회 협업 / B2G 16.4억원 PM / 중기부장관 표창 2회", "AI 업무 프로세스 구축", "현장 네트워크 구축"],
      ]),
      empty(),

      h2("팀의 핵심 강점"),
      makeTable(["강점", "설명"], [
        ["AI 내재화", "AI를 도구로 쓰는 게 아니라, AI가 팀원이다. 3명이 10명분의 속도를 낸다"],
        ["현장 × 기술", "15년 로컬 현장 지식 + AI 자동화 = 다른 테크 스타트업이 못 가진 조합"],
        ["검증된 실행력", "B2G 16.4억원 완주 + 142회 현장 협업 + 중기부장관 표창 2회"],
        ["확장 가능한 구조", "외부 개발팀 공동 개발 + AI 자동화 → 인원 추가 없이 서비스 확장 가능"],
      ]),
      empty(),
      pBold("이 팀은 돈을 태워서 사람을 늘리는 조직이 아니다."),
      p("AI로 효율을 만들고, 현장 지식으로 진입 장벽을 세우고, 검증된 실행력으로 결과를 낸다."),
      empty(),

      // ★★★ [v3 추가] 기술 리스크 해결 ★★★
      rH2("기술 접근 전략 — 왜 개발자 없이 가능한가"),
      empty(),
      rQuote("\"기술은 빌릴 수 있지만, 15년의 현장 지식은 빌릴 수 없다.\""),
      empty(),
      rPBold("1. 도메인 우선 — 대체 불가능한 핵심 자산"),
      rP("소상공인 현장에서 15년간 축적한 도메인 지식은 어떤 개발팀도 대체할 수 없다."),
      rP("Airbnb(디자이너), Alibaba(영어교사), Warby Parker(패션) — 가장 성공한 테크 기업의 창업자들도 비개발자였다."),
      rP("공통점: 시장을 가장 깊이 이해한 팀이 기술을 확보해서 이겼다."),
      empty(),
      rPBold("2. CSP 벤처스튜디오 = 검증된 공동 개발 모델"),
      rP("스튜디오 기반 스타트업의 시드 성공률 84%, IRR 53%. (일반 VC 대비 2~2.5배)"),
      rP("CSP는 MYSC 투자를 받은 검증된 로컬 벤처스튜디오이며, 수원 멀티허브를 공유한다."),
      rP("\"외주\"가 아니라 성과와 리스크를 공유하는 JV 구조."),
      empty(),
      rPBold("3. AI 시대 — MVP 비용 1/15 하락"),
      rP("3년 전 MVP 개발비: 약 3.3억원. 2025년: 약 2,000만원. (Wildfire Labs)"),
      rP("바이브 코딩 시장: 2025년 $4.7B → 2027년 $12.3B. 비개발자도 프로토타입 제작 가능."),
      rP("이중 전략: 프로토타입은 AI로 빠르게 검증, 프로덕션은 CSP와 공동 개발."),
      rP("기술 내재화 로드맵: Phase 1 CSP 공동개발 → Phase 2 핵심 개발 인력 내재화 → Phase 3 자체 기술 조직 구축."),
      empty(),

      h3("지역창업스튜디오 (Company Builder)"),
      p("단순 투자를 넘어, 성공 확률을 설계하는 컴퍼니 빌더"),
      bullet("City OS에 축적된 상권 데이터를 예비 창업자에게 제공"),
      bullet("공존공간 유휴 공간을 활용한 '팝업 테스트' 선행 → 본 창업 전 시장성 검증"),
      bullet("스튜디오를 통해 성장한 기업은 다시 슈파의 핵심 유저 → 플라이휠 강화"),

      pageBreak(),

      // ===== 10. Traction =====
      h1("10. Traction — 현재까지"),
      makeTable(["항목", "상태"], [
        ["법인 설립", "2026년 3월 (진행 중)"],
        ["슈파 MVP", "2026년 9월 목표"],
        ["구매의향서(LOI)", "행궁동 소상공인 대상 품목별 구매의향서 확보 진행"],
        ["소상공인 네트워크", "행궁동 약 2,400 사업자, 200여 핵심 DB 기보유"],
        ["지자체 협업", "글로컬상권창출팀 2년 (142회 현장 협업)"],
        ["B2G 수행", "누적 16.4억원 대형 정부 프로젝트 완주"],
        ["창업가 발굴", "44명 발굴 실적"],
        ["행궁동행 (BID)", "사단법인 창립 총회 완료. 기획 주체"],
        ["Anchor Alliance", "정지영커피로스터즈, 진미통닭, 존앤진 등"],
        ["전략적 파트너십", "CSP(벤처스튜디오) 공동 개발 진행 중 + 유통 파트너 조사 중"],
        ["지분 구조", "박승현 60%+ / 공존공간 40%-"],
      ]),

      pageBreak(),

      // ===== 11. Ask =====
      h1("11. Ask — 투자 요청"),
      h2("시드 라운드: 2.5억원"),
      makeTable(["사용처", "금액", "비중", "내용"], [
        ["인건비", "1.25억원", "50%", "Core Team 3명 급여+4대보험"],
        ["공간", "0.5억원", "20%", "보증금 3,500만 + 초기 임대료·관리비"],
        ["제품 개발 인프라", "0.35억원", "14%", "AI API, 클라우드 서버. 개발 인력은 파트너 공동 개발"],
        ["초기 유저 확보", "0.25억원", "10%", "행궁동 100개소 온보딩, 마케팅"],
        ["예비비", "0.15억원", "6%", "비상 대응"],
      ]),
      empty(),
      p("제품 개발비가 14%로 낮은 이유: 전략적 파트너와 공동 개발 구조다."),
      p("파트너는 슈파의 소상공인 현장 채널·데이터에 접근하고, 신도시는 개발 역량을 확보한다."),
      p("투자금의 절반 이상이 팀과 유저 확보에 집중된다."),
      empty(),

      h2("월 고정 운영비 (Monthly Burn Rate)"),
      makeTable(["항목", "금액 (월)"], [
        ["급여 + 4대보험", "약 1,550만원"],
        ["임차료 + 관리비", "약 520만원"],
        ["AI 서비스 구독", "약 50만원"],
        ["영업 활동비", "약 100만원"],
        ["기타 관리비", "약 20만원"],
        ["합계", "약 2,240만원"],
      ]),
      empty(),

      h2("런웨이 분석 — 왜 2.5억인가"),
      makeTable(["항목", "금액"], [
        ["투자금", "2.5억원"],
        ["초기 세팅비 (보증금+장비)", "-4,545만원"],
        ["남는 운영자금", "약 2.05억원"],
      ]),
      empty(),
      makeTable(["시나리오", "런웨이"], [
        ["B2G 매출 없이 (최악)", "약 9개월"],
        ["B2G 용역 연 2억 포함", "약 15개월"],
      ]),
      empty(),
      p("2억 투자 시 런웨이 약 7개월(B2G 없이) — B2G가 한 분기만 밀려도 현금 부족 위험."),
      p("2.5억이면 B2G 시점과 무관하게 MVP(9월) + 100개소 확보(12월)까지 안정적으로 운영 가능."),
      empty(),

      h2("마일스톤"),
      makeTable(["시점", "목표"], [
        ["2026년 3월", "법인 설립"],
        ["2026년 9월", "슈파 MVP 출시"],
        ["2026년 12월", "행궁동 100개소 확보"],
        ["2027년 1분기", "수원 1,000개소 + 공동구매 시작 = Phase 1 완료"],
        ["2027년 상반기~", "전국 모델 확대 준비 시작"],
        ["2027년 하반기", "데이터 판매 시작"],
      ]),

      pageBreak(),

      // ===== 12. 비전 =====
      h1("12. 비전"),
      quote("\"기술 소외 계층 없는 디지털 경제 실현\""),
      empty(),
      pBold("The First City OS Provider."),
      empty(),
      makeTable(["Phase 1", "Phase 2", "Phase 3"], [
        ["경영 지원 + 비용 절감", "데이터가 수익이 되고", "피지컬 AI가 현실에 들어온다"],
        ["행궁동·수원 100→1,000개소", "전국 / 데이터 B2B", "라스트마일 / 로봇·자동화"],
      ]),
      empty(),
      p("수원 성공 모델 → 타 지자체로 City OS 복제 → 전국 단위 플랫폼"),

      pageBreak(),

      // ===== 13. Expected Synergy =====
      h1("13. Expected Synergy — 기대 효과"),
      makeTable(["관점", "효과"], [
        ["투자자", "자금이 부동산에 묶이지 않고 성장·기술에만 투입 → 높은 ROE"],
        ["소상공인", "경영 비용 절감 + AI 도구 → 생존력 강화"],
        ["지역 사회", "공존 기금 → 상권 보호, 젠트리피케이션 방지"],
        ["스케일업", "수원 성공 모델 → 타 지자체 복제 → 전국 City OS"],
      ]),

      empty(), empty(), empty(),

      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "감사합니다.", bold: true, size: 36, font: "맑은 고딕" })] }),
      empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(주)신도시", bold: true, size: 24, font: "맑은 고딕" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "The First City OS Provider.", size: 20, font: "맑은 고딕", color: "888888" })] }),

      // ── 회의 안건 (빨간색) ──
      empty(), empty(), empty(),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "━".repeat(50), size: 16, font: "맑은 고딕", color: "CCCCCC" })] }),
      empty(),
      rH2("📋 회의 안건"),
      rP("이번 회의에서 논의가 필요한 사항을 정리했습니다."),
      empty(),

      makeRedTable(
        ["No.", "안건", "내용", "필요 액션"],
        [
          ["1", "김민호 대표 실적 구체화", "현재 '로컬 리빌딩 전문가'로만 소개됨.\n구체적 매출/성과 숫자 보충 필요", "김민호 대표 이력서/포트폴리오 확보"],
          ["2", "CSP JV 계약 조건", "지분 구조, 기술 개발 범위,\n비용 분담 비율 확정 필요", "CSP 측과 MOU/계약 조건 협의"],
          ["3", "Pilot 런칭 일정", "Q1 2026 목표 중 구체적\n런칭 날짜 및 마일스톤 확정", "개발 일정표 수립"],
          ["4", "데이터 판매 가격 검증", "KCD 역산 단가(8.4만원/소) 기반\n실제 시장 수용성 확인 필요", "잠재 고객(유통사/금융사) 인터뷰"],
          ["5", "투자 구조 확정", "Seed 2.5억 배분 비율,\n밸류에이션, 투자 조건 확정", "텀시트 초안 작성"],
        ]
      ),
      empty(),
      rP("※ 위 안건은 IR 기획서 v3 크리틱 과정에서 도출된 보완 필요 사항입니다."),
    ]
  }]
});

// 저장
const outputPath = "C:/Users/leeha/OneDrive/문서/카카오톡 받은 파일/IR-기획서-v3-레드라인.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ 저장 완료:", outputPath);
  console.log("");
  console.log("=== v3 신규 추가 내용 (빨간 글씨) ===");
  console.log("");
  console.log("[Section 7] 경쟁사 실적 비교");
  console.log("  - KCD 170만/1,428억, 토스 20만/4,333억, 당근 200만/1,891억, SFN 5,500개/3,000억");
  console.log("  - KCD 데이터 사업 모델 상세 (크레딧브리지, 29개 금융사, 멤버십)");
  console.log("  - KCD의 한계 = 슈파의 기회 (매출만 vs 매입+매출+맥락)");
  console.log("  - 데이터 시장 규모: 25조→50조 (2027)");
  console.log("");
  console.log("[Section 8] CSP 전략적 파트너십");
  console.log("  - CSP = 로컬 벤처스튜디오, MYSC 투자 유치 완료");
  console.log("  - 멀티허브 전략: 전주·제주·양양·수원·대전 — 수원에서 슈파와 만남");
  console.log("  - 역할: 공동개발 + 유통파트너 + 투자 네트워크 + 멀티허브 확장");
  console.log("  - 벤처스튜디오 성과: 시드 성공률 84%, IRR 53%");
  console.log("");
  console.log("[Section 9] 기술 접근 전략");
  console.log("  - 도메인 우선: 15년 현장 = 대체 불가 (Airbnb, Alibaba 사례)");
  console.log("  - CSP JV: 벤처스튜디오 모델 (시드 84%, IRR 53%)");
  console.log("  - AI 시대: MVP 비용 1/15 하락, 이중 전략");
  console.log("");
  console.log("=== 파일 구조 ===");
  console.log("  v2 원본: generate-ir-v2.js (변경 없음)");
  console.log("  v2 레드라인: generate-ir-v2-redline.js (v1→v2 차이)");
  console.log("  v3 레드라인: generate-ir-v3-redline.js (v2→v3 차이) ← 현재");
}).catch(err => {
  console.error("❌ 에러:", err);
});
