const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

// 스타일 헬퍼
const title = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, bold: true, size: 40, font: "맑은 고딕" })] });
const subtitle = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text, size: 22, font: "맑은 고딕", color: "666666" })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 28, font: "맑은 고딕" })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 24, font: "맑은 고딕" })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [new TextRun({ text, bold: true, size: 22, font: "맑은 고딕" })] });
const p = (text) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const pBold = (text) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, bold: true, size: 20, font: "맑은 고딕" })] });
const pColor = (text, color) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕", color })] });
const bullet = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const bulletBold = (label, text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [new TextRun({ text: label, bold: true, size: 20, font: "맑은 고딕" }), new TextRun({ text, size: 20, font: "맑은 고딕" })] });
const bullet2 = (text) => new Paragraph({ bullet: { level: 1 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 18, font: "맑은 고딕" })] });
const empty = () => new Paragraph({ spacing: { after: 80 }, children: [] });

// 표 헬퍼
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function makeTable(headers, rows, colWidths) {
  const headerCells = headers.map((h, i) => new TableCell({
    shading: { type: ShadingType.SOLID, color: "2C3E50" },
    width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: allBorders
  }));

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text: cell, size: 18, font: "맑은 고딕" })]
      })],
      borders: allBorders
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

// 노드 테이블 (회의 노드용 — 강조색 배경)
function makeNodeHeader(date, title, participants, duration, nodeColor) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: nodeColor },
          columnSpan: 2,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
            new TextRun({ text: `NODE ${date}`, bold: true, size: 24, font: "맑은 고딕", color: "FFFFFF" })
          ]})],
          borders: allBorders
        })]
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: nodeColor },
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 20, font: "맑은 고딕", color: "FFFFFF" })] })],
            borders: allBorders
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: nodeColor },
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${participants} | ${duration}`, size: 18, font: "맑은 고딕", color: "FFFFFF" })] })],
            borders: allBorders
          })
        ]
      })
    ]
  });
}

// 상태 추적 표
function makeStatusTable(items) {
  const headerCells = ["과제", "상태", "신도시 대응", "성장 포인트"].map((h, i) => new TableCell({
    shading: { type: ShadingType.SOLID, color: "34495E" },
    width: { size: [25, 10, 35, 30][i], type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 16, font: "맑은 고딕", color: "FFFFFF" })] })],
    borders: allBorders
  }));

  const dataRows = items.map(row => {
    const statusColor = row[1] === "완료" ? "27AE60" : row[1] === "진행중" ? "F39C12" : row[1] === "미착수" ? "E74C3C" : "95A5A6";
    const statusBg = row[1] === "완료" ? "E8F8F5" : row[1] === "진행중" ? "FEF9E7" : row[1] === "미착수" ? "FDEDEC" : "F2F3F4";
    return new TableRow({
      children: row.map((cell, i) => new TableCell({
        width: { size: [25, 10, 35, 30][i], type: WidthType.PERCENTAGE },
        shading: i === 1 ? { type: ShadingType.SOLID, color: statusBg } : undefined,
        children: [new Paragraph({
          children: [new TextRun({
            text: cell,
            bold: i === 1,
            size: 16,
            font: "맑은 고딕",
            color: i === 1 ? statusColor : "000000"
          })]
        })],
        borders: allBorders
      }))
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows]
  });
}

// 연결선 표현 (텍스트)
const connector = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 100, after: 100 },
  children: [new TextRun({ text: `▼  ${text}  ▼`, bold: true, size: 20, font: "맑은 고딕", color: "3498DB" })]
});

// === 문서 생성 ===
const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
    children: [
      // 표지
      empty(), empty(),
      title("CSP × 신도시"),
      title("회의 과제추적표"),
      empty(),
      subtitle("노드 기반 시계열 추적 — 2026년 3월"),
      subtitle("작성: 이승훈 | 최종 업데이트: 2026-03-26"),
      empty(), empty(),
      p("본 문서는 CSP(민욱조 상무)와 신도시 팀 간의 회의 내용을 시계열 노드로 연결하여,"),
      p("각 회의에서 제기된 과제에 대해 신도시 팀이 어떻게 대응하고 성장했는지를 추적합니다."),
      empty(),
      pBold("추적 기간: 2026.03.05 ~ 2026.03.23 (4개 노드)"),
      p("참여자: 박승현(대표), 이승훈(운영), 김민호(AI전략)"),

      empty(), empty(),

      // ===== 1. 타임라인 총괄 =====
      h1("1. 타임라인 총괄"),
      empty(),

      makeTable(
        ["노드", "일시", "참석자", "시간", "핵심 키워드"],
        [
          ["NODE 1", "03-05 (수)", "박승현, 이승훈", "75분", "슈퍼파트너 로드맵, IR 전면개편, 무료전략 확정"],
          ["NODE 2", "03-13 (목)", "박승현, 김민호", "130분", "MVP 신속 빌드, 로컬 벤처스튜디오, CSP 구조 재검토"],
          ["NODE 3", "03-16 (일)", "박승현, 변리사, 이승훈, 김민호", "215분", "벤처인증, 특허출원, SaaS 도란, 에이전트 독립화"],
          ["NODE 4", "03-23 (일)", "박승현, 이승훈", "15분", "조기 기사화, 업무 체계화, AX 실전 모델"],
        ],
        [10, 12, 25, 8, 45]
      ),

      empty(),

      // 성장 궤적 요약
      h2("1-1. 성장 궤적 요약"),
      empty(),
      pBold("NODE 1 → NODE 2: 전략에서 실행으로"),
      bullet("IR 기획서 v1 → v2/v3 완성 (수익 모델 + CSP 파트너십 구체화)"),
      bullet("\"개발 리소스 통합 미결정\" → 김민호가 \"1~2개월 내 MVP 가능\" 확인"),
      bullet("CSP 관계에 대한 솔직한 리뷰: 혁주 대표 피드백 → 로컬 중심 재정립"),
      empty(),
      pBold("NODE 2 → NODE 3: 실행에서 법적 기반 확보로"),
      bullet("MVP 추진 확정 → 벤처인증을 위한 특허 출원 전략 수립"),
      bullet("에이전트 단순 루프 → 레드팀/블루팀/크리틱 독립 세션 구조(BEB)로 진화"),
      bullet("신규 SaaS '도란' 기획 — 미팅 어시스턴트의 커뮤니티 확장 버전"),
      empty(),
      pBold("NODE 3 → NODE 4: 법적 기반에서 시장 선점으로"),
      bullet("특허 출원 준비 중 + 벤처인증 로드맵 확정"),
      bullet("\"MVP 만들고 있다\" → \"기사화해서 소진공/중기부에 선점하자\""),
      bullet("공존공간 업무 전수 조사 + AI 공진화 설계 착수"),

      empty(), empty(),

      // ===== 2. 노드별 상세 =====
      h1("2. 노드별 상세 추적"),

      empty(),

      // ---- NODE 1 ----
      makeNodeHeader("2026-03-05", "슈퍼파트너 전략 수립 + IR 전면 개편", "박승현, 이승훈", "75분", "2980B9"),
      empty(),

      h3("배경 및 맥락"),
      p("스마트스터디벤처스 등 외부 투자 전문가로부터 \"비즈니스 모델 및 수익 시나리오 빈약\"이라는 강한 피드백을 받은 직후. 기존 임팩트 중심 IR을 비즈니스 버전으로 전면 재구성해야 하는 시점."),
      empty(),

      h3("핵심 결정"),
      bulletBold("슈퍼파트너 3단계 로드맵 확정: ", "유통(Phase 1) → SaaS/데이터(Phase 2) → 피지컬 AI(Phase 3)"),
      bulletBold("완전 무료 + 수수료 3% 모델 확정: ", "SaaS 구독 폐기. B2B 세금계산서 방식으로 PG 수수료 0"),
      bulletBold("IR 전략 수정: ", "임팩트 버전 → FI 대응 비즈니스 버전. 매출 시나리오 5페이지 이상 보강"),
      bulletBold("현장 중심 영업: ", "시스템 완성 전 수기 방식으로 공동구매 실행 → 트랙레코드 확보"),
      empty(),

      h3("제기된 과제"),
      makeStatusTable([
        ["IR 자료 5페이지 이상 보강", "완료", "v2(03-09) + v3(03-10) 완성. CSP 파트너십, 경쟁사 실적, 기술리스크 해결 추가", "투자자 피드백을 72시간 내 반영하는 실행력 입증"],
        ["유통사 단가 태핑 (CJ 등)", "진행중", "CSP 네트워크를 통한 유통 파트너 연결 경로 확보", "자체 영업 → 파트너 네트워크 활용으로 전환"],
        ["구매의향서(LOI) 확보", "진행중", "행궁동 통닭거리 중심 수요 조사 착수", "LOI = MVP 전 수요 검증 전략의 핵심 장치"],
        ["개발 리소스 통합 여부", "완료", "NODE 2에서 김민호가 자체 빌드 가능 확인 → CSP와 JV 구조 확정", "외부 의존 → 내부 역량 + 파트너 병행 구조"],
        ["정부 AI 실증사업 연계", "진행중", "벤처인증(NODE 3) + 데이터/AI 바우처 리서치 완료", "정부 지원 = 런웨이 확장 + 레퍼런스 동시 확보"],
      ]),

      empty(),

      connector("5일 후 — IR v2 완성, CSP 관계 재검토 계기"),

      empty(),

      // ---- NODE 2 ----
      makeNodeHeader("2026-03-13", "MVP 신속 빌드 확인 + 로컬 전략 재정립", "박승현, 김민호", "130분 (25+105)", "27AE60"),
      empty(),

      h3("배경 및 맥락"),
      p("혁주 대표(CSP 관계자)가 방문하여 CSP 구조에 대한 솔직한 피드백을 전달. \"콩 심은 데 콩 나고\" — 현재 구조가 박승현의 강점(전국 로컬 네트워크)을 살리는 방향인지 재검토 필요성 제기. 김민호는 AI 도구 발전으로 MVP 빠른 빌드가 가능함을 확인."),
      empty(),

      h3("핵심 결정"),
      bulletBold("슈퍼파트너 MVP 추진 확정: ", "AI 도구(클로드 코드 등)로 1~2개월 내 빌드. 4월 런칭 목표"),
      bulletBold("CSP 구조 솔직한 리뷰: ", "혁주 대표 피드백 — \"로컬 중심으로 재구조화하는 게 박승현에게 유리\""),
      bulletBold("전국 로컬 네트워크 활용: ", "행궁동 100개 + 수원 100개 + 전국 파트너(대전/울산/제주) 규합 = 1,000개"),
      bulletBold("AI 도메인 포지셔닝: ", "단순 로컬 플레이어가 아닌 'AI 기술을 도메인으로 가진 로컬 전문가'"),
      empty(),

      h3("NODE 1 과제 진척 + 신규 과제"),
      makeStatusTable([
        ["MVP 개발 착수", "진행중", "김민호 확인 — \"100분의 1의 노력으로 구현 가능\". 4월 게시판형 MVP부터 시작", "기술 리스크 해소의 결정적 전환점"],
        ["1개월 성과 + 3개월 로드맵 맵핑", "진행중", "시각적 맵 작업 준비. 각자의 성장 경로를 그림으로 정리", "팀 얼라인먼트 도구"],
        ["전국 로컬 네트워크 규합", "미착수", "대전/울산/제주 등 기존 네트워크 활용 구상", "CSP 멀티허브와 연결되는 확장 경로"],
        ["정치인 AI 지원 시스템", "미착수", "한준호 등 대상 회의록 자동화 + 캐릭터 분석 구상", "AX 비즈니스 모델의 첫 번째 응용 사례"],
        ["CSP JV 계약 조건 확정", "진행중", "혁주 대표 피드백 수용 → 로컬 중심 재정립하되 CSP 투자 관계는 유지", "외부 시각을 수용하는 유연성"],
      ]),

      empty(),

      connector("3일 후 — 벤처인증 전략 + SaaS 기획으로 확장"),

      empty(),

      // ---- NODE 3 ----
      makeNodeHeader("2026-03-16", "벤처인증 + 특허 + SaaS '도란' + 에이전트 독립화", "박승현, 변리사, 이승훈, 김민호", "215분", "8E44AD"),
      empty(),

      h3("배경 및 맥락"),
      p("벤처인증을 위한 특허 전략을 변리사와 협의. 동시에 미팅 어시스턴트를 SaaS '도란'으로 확장하는 기획이 구체화됨. AI 에이전트 구조도 단순 루프에서 독립 세션 기반으로 진화."),
      empty(),

      h3("핵심 결정"),
      bulletBold("신규 법인 기반 SaaS 확정: ", "벤처인증 + 실제 서비스(도란) 런칭으로 기술 실적과 매출 동시 확보"),
      bulletBold("특허 1~2건 출원: ", "플랫폼 서비스 아이디어 기반. 4월 말까지"),
      bulletBold("에이전트 독립화: ", "레드팀/블루팀/크리틱을 독립 세션으로 분리 → 실제 재귀적 개선 유도"),
      bulletBold("소상공인 밀착형 '대봉' MVP: ", "재고/발주 관리 실전 시스템 — 이론이 아닌 현장 검증"),
      empty(),

      h3("과제 추적"),
      makeStatusTable([
        ["특허 1~2건 출원 준비", "진행중", "변리사와 협의 완료. 슈파 서비스 기반 지식재산권 출원 방향 확정", "벤처인증의 핵심 요건 충족 경로"],
        ["법인 사업목적 기술업종 추가", "미착수", "응용 소프트웨어 개발업 추가 예정 (4월 10일까지)", "벤처인증 사전 요건"],
        ["SaaS '도란' MVP + 랜딩페이지", "진행중", "미팅 어시스턴트 → 커뮤니티 SaaS로 확장. 3월 말 목표", "기존 자산의 상품화"],
        ["에이전트 오케스트레이션 고도화", "진행중", "BEB 병렬 구조 + 랄프 루프(RALF Loop) 설계 적용", "AI 인프라 품질의 비약적 도약"],
        ["대봉 버전 재고/발주 시스템", "미착수", "설계 및 담당자 교육 4월 15일 목표", "소상공인 현장 검증의 첫 사례"],
      ]),

      empty(),

      connector("7일 후 — 기사화 전략 + 공존공간 업무 체계화"),

      empty(),

      // ---- NODE 4 ----
      makeNodeHeader("2026-03-23", "조기 기사화 + 공존공간 AX 실전", "박승현, 이승훈", "15분", "E67E22"),
      empty(),

      h3("배경 및 맥락"),
      p("소진공/중기부의 내년도 AX 사업 설계 시점에 맞춰 선제적 언론 플레이 필요성 대두. 혁주 대표와 협의 후 기사화 추진 결정. 동시에 공존공간의 산재된 업무를 AI와 공진화시키는 실전 단계 진입."),
      empty(),

      h3("핵심 결정"),
      bulletBold("슈퍼파트너 조기 기사화: ", "MVP 진행 중 상태에서 기사 선발표 → 소진공/지자체 관심 유도"),
      bulletBold("BEB 병렬 에이전트 구조 채택: ", "팅커벨이 서브에이전트 오케스트레이션. 컨텍스트 오염 방지"),
      bulletBold("AX 실전 모델: ", "점포 방문 → 녹음 → AI 루프 → 최선의 경영 피드백 생성"),
      bulletBold("공존공간 업무 전수 조사: ", "재생전술, 부동산 등 모든 업무를 태스크화 → AI 공진화 로드맵"),
      empty(),

      h3("과제 추적"),
      makeStatusTable([
        ["슈퍼파트너 기사화 추진", "미착수", "혁주 대표 기사화 역량 활용. 보도자료 초안 작성 필요", "시장 선점 — 정책 설계 시점에 레퍼런스 확보"],
        ["공존공간 홈페이지 슈퍼파트너 섹션", "미착수", "사업 안내/홍보 기능 강화. 기획 범위 확정 필요", "외부 가시성 확보"],
        ["공존공간 업무 전수조사 + 태스크화", "미착수", "3/25까지 정리 목표 (이승훈 담당)", "AI 공진화의 기초 데이터"],
        ["업무-AI 공진화 로드맵 설계", "미착수", "정리된 태스크 기반으로 자동화/효율화 지점 매핑", "AX 실전의 첫 설계도"],
        ["노션 대시보드 구축", "미착수", "김민호 자문. 업무 관리 도구 확정 필요", "팀 업무 가시화 인프라"],
      ]),

      empty(), empty(),

      // ===== 3. 핵심 과제 관통 추적 =====
      h1("3. 핵심 과제 관통 추적 (Cross-Node)"),
      empty(),
      p("여러 노드에 걸쳐 진화하는 핵심 과제들을 관통 추적합니다."),
      empty(),

      h2("3-1. IR 기획서 진화"),
      makeTable(
        ["시점", "버전", "변화", "트리거"],
        [
          ["NODE 1 이전", "v1", "임팩트 중심, 수익 시나리오 부족", "외부 투자자 피드백"],
          ["NODE 1 → 2 사이 (03-09)", "v2", "구독 폐기, 무료+3% 수수료, 데이터 판매 핵심 수익, LOI 전략", "03-05 회의 결정 반영"],
          ["NODE 1 → 2 사이 (03-10)", "v3", "CSP 파트너십, 경쟁사 실적(KCD 1,428억), 기술리스크 해결, 데이터 단가 근거", "CSP 관계 구체화"],
          ["NODE 4 시점", "v3 + 기사화", "IR 내용을 기사 형태로 재구성 추진", "소진공/중기부 정책 설계 시점"],
        ],
        [15, 8, 47, 30]
      ),

      empty(),

      h2("3-2. 기술 역량 진화"),
      makeTable(
        ["시점", "수준", "내용"],
        [
          ["NODE 1 (03-05)", "전략 수립", "\"개발 리소스 통합 미결정\" — 기술 부족 인정, CSP 의존도 높음"],
          ["NODE 2 (03-13)", "가능성 확인", "김민호: \"100분의 1로 가능\". 클로드 코드 활용한 자체 빌드 확인"],
          ["NODE 3 (03-16)", "구조 설계", "에이전트 독립화(BEB), 랄프 루프, 레드/블루/크리틱 팀 분리"],
          ["NODE 4 (03-23)", "실전 적용", "BEB 구조 채택. 컨텍스트 오염 방지. 서브에이전트 오케스트레이션 운용"],
        ],
        [15, 15, 70]
      ),

      empty(),

      h2("3-3. 사업 확장 경로 진화"),
      makeTable(
        ["시점", "범위", "전략"],
        [
          ["NODE 1", "행궁동 100개소", "현장 수기 영업 + 공동구매 실행"],
          ["NODE 2", "수원 → 전국", "로컬 네트워크 규합 (대전/울산/제주) + 정치인 AI 지원"],
          ["NODE 3", "SaaS 확장", "도란(커뮤니티 SaaS) + 대봉(소상공인 밀착) + 벤처인증"],
          ["NODE 4", "시장 선점", "조기 기사화 → 소진공/중기부 정책 연계 → 전국 AX 모델"],
        ],
        [12, 20, 68]
      ),

      empty(), empty(),

      // ===== 4. 종합 평가 =====
      h1("4. 종합 평가 — 신도시 팀의 3주간 성장"),
      empty(),

      h2("강점 (잘한 것)"),
      bullet("투자자 피드백 → IR v2/v3 완성까지 72시간. 빠른 실행력"),
      bullet("CSP 관계에 대한 외부 피드백(혁주 대표)을 방어적으로 받지 않고 전략적으로 수용"),
      bullet("기술 리스크를 \"개발자 없이 가능한 이유\" 3가지 논거로 전환 (v3)"),
      bullet("AI 에이전트 구조가 3주 만에 단순 루프 → BEB 병렬 독립 세션으로 진화"),
      bullet("벤처인증 → 특허 → SaaS → 기사화까지 연쇄적 전략 수립"),
      empty(),

      h2("리스크 (주의할 것)"),
      bullet("NODE 4에서 나온 과제들(기사화, 업무 전수조사, 대시보드)이 아직 미착수 상태"),
      bullet("LOI 확보가 진행중이지만 구체적 숫자(몇 개소 확보)가 아직 없음"),
      bullet("전국 로컬 네트워크 규합은 구상 단계 — 실제 접촉 기록 필요"),
      bullet("도란 SaaS 3월 말 목표 — 남은 기간 5일, 런칭 가능 여부 재점검 필요"),
      empty(),

      h2("다음 회의 필수 안건"),
      bullet("1. 슈퍼파트너 MVP 진척 상황 공유 (4월 런칭 가능 여부)"),
      bullet("2. 기사화 보도자료 초안 리뷰"),
      bullet("3. 공존공간 업무 전수조사 결과 + AI 공진화 로드맵 1차안"),
      bullet("4. 특허 출원 진행 상황"),
      bullet("5. CSP JV 계약 조건 최종 협의 일정"),
    ]
  }]
});

// 저장
const outputPath = "C:/Users/leeha/OneDrive/바탕 화면/DB/산출물/회의록/CSP회의-과제추적표-노드기반-20260326.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("저장 완료:", outputPath);
});
