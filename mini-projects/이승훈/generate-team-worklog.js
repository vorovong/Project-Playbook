const ExcelJS = require('exceljs');
const fs = require('fs');

async function generate() {
  const wb = new ExcelJS.Workbook();

  // ===== 공통 스타일 =====
  const thick = { style: 'medium', color: { argb: '333333' } };
  const thin = { style: 'thin', color: { argb: 'AAAAAA' } };
  const thinBorder = { top: thin, bottom: thin, left: thin, right: thin };
  const thickBorder = { top: thick, bottom: thick, left: thick, right: thick };
  const exFont = { size: 9, italic: true, color: { argb: '999999' } };

  function styleRange(ws, startRow, startCol, endRow, endCol, style) {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(r, c);
        if (style.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
        if (style.font) cell.font = { ...cell.font, ...style.font };
        if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
        if (style.border) cell.border = style.border;
      }
    }
  }

  // ===== 팀원 설정 =====
  const members = ['수빈', '승훈', '팀원3'];
  const memberCategories = {
    '수빈': ['회계/세무', '사업비 정산', '포인박 이관', '재생전술', '기타'],
    '승훈': ['슈파', '공존공간', '신도시/투자', '기획/전략', '기타'],
    '팀원3': ['업무1', '업무2', '업무3', '업무4', '기타'],
  };

  const days = ['월', '화', '수', '목', '금'];
  const dayDates = ['3/24', '3/25', '3/26', '3/27', '3/28'];
  const dayFills = ['4FC3F7', '4FC3F7', '4FC3F7', '4FC3F7', '4FC3F7'];

  // ========================================
  // 시트 1: 📍 스케줄 보드
  // ========================================
  const sched = wb.addWorksheet('📍 스케줄 보드', {
    properties: { defaultRowHeight: 24 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  sched.columns = [
    { width: 12 }, // A: 이름
    { width: 18 }, // B: 월
    { width: 18 }, // C: 화
    { width: 18 }, // D: 수
    { width: 18 }, // E: 목
    { width: 18 }, // F: 금
  ];

  let R = 1;

  // 제목
  sched.mergeCells(R, 1, R, 6);
  const schedTitle = sched.getCell(R, 1);
  schedTitle.value = '📍  주간 스케줄 보드';
  schedTitle.font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
  schedTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2A4A' } };
  schedTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  schedTitle.border = thickBorder;
  sched.getRow(R).height = 40;
  R++;

  // 기간 정보
  sched.mergeCells(R, 1, R, 2);
  const periodLabel = sched.getCell(R, 1);
  periodLabel.value = '📅 3월 4주차';
  periodLabel.font = { bold: true, size: 12 };
  periodLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
  periodLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  periodLabel.border = thinBorder;

  sched.mergeCells(R, 3, R, 4);
  const periodVal = sched.getCell(R, 3);
  periodVal.value = '3/24 ~ 3/28';
  periodVal.font = { size: 11 };
  periodVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
  periodVal.alignment = { horizontal: 'center', vertical: 'middle' };
  periodVal.border = thinBorder;

  sched.mergeCells(R, 5, R, 6);
  const tipCell = sched.getCell(R, 5);
  tipCell.value = '💡 외근/미팅 일정을 적어주세요';
  tipCell.font = { size: 9, color: { argb: '888888' } };
  tipCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
  tipCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tipCell.border = thinBorder;
  sched.getRow(R).height = 28;
  R++;

  // 간격
  sched.getRow(R).height = 4;
  R++;

  // 요일 헤더
  const schedHeader = ['', '월', '화', '수', '목', '금'];
  schedHeader.forEach((text, i) => {
    const cell = sched.getCell(R, i + 1);
    cell.value = text ? text + '요일' : '';
    cell.font = { bold: true, size: 12, color: { argb: i === 0 ? '333333' : 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i === 0 ? 'ECEFF1' : '1565C0' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thickBorder;
  });
  sched.getRow(R).height = 30;
  R++;

  // 날짜 행
  sched.getCell(R, 1).value = '📆 날짜';
  sched.getCell(R, 1).font = { bold: true, size: 9 };
  sched.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFD8DC' } };
  sched.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  sched.getCell(R, 1).border = thinBorder;
  dayDates.forEach((d, i) => {
    const cell = sched.getCell(R, i + 2);
    cell.value = d;
    cell.font = exFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  sched.getRow(R).height = 22;
  R++;

  // 팀원별 스케줄 (대표 + 팀원들)
  const allMembers = ['대표(박승현)', ...members];
  const schedExamples = {
    '대표(박승현)': ['14:00 수원시청', '', '사무실', '10:00 투자미팅', '사무실'],
    '수빈': ['사무실', '사무실', '사무실', '10:00 도시재단', '사무실'],
    '승훈': ['사무실', '외근(행궁동)', '사무실', '사무실', '사무실'],
    '팀원3': ['사무실', '사무실', '사무실', '사무실', '사무실'],
  };
  const memberFills = ['FFE0B2', 'E8F5E9', 'E3F2FD', 'F3E5F5'];

  allMembers.forEach((name, mi) => {
    // 이름 셀
    const nameCell = sched.getCell(R, 1);
    nameCell.value = name;
    nameCell.font = { bold: true, size: 11 };
    nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: memberFills[mi] } };
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    nameCell.border = thinBorder;

    // 일정 셀
    const examples = schedExamples[name] || ['', '', '', '', ''];
    examples.forEach((ex, di) => {
      const cell = sched.getCell(R, di + 2);
      cell.value = ex;
      cell.font = ex ? exFont : { size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });
    sched.getRow(R).height = 36;
    R++;
  });

  // 안내
  R++;
  sched.mergeCells(R, 1, R, 6);
  const schedGuide = sched.getCell(R, 1);
  schedGuide.value = '💡 "사무실"은 기본값. 외근/미팅/휴가 등 변경 사항만 적어주세요. 시간+장소 형태 권장 (예: 14:00 수원시청)';
  schedGuide.font = { size: 9, color: { argb: '888888' } };
  schedGuide.alignment = { horizontal: 'center', vertical: 'middle' };

  // ========================================
  // 시트 2~4: 팀원별 업무일지
  // ========================================
  members.forEach((name, mi) => {
    const ws = wb.addWorksheet(name, {
      properties: { defaultRowHeight: 22 },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    ws.columns = [
      { width: 12 },  // A: 요일/라벨
      { width: 14 },  // B: 카테고리
      { width: 50 },  // C: 내용
      { width: 10 },  // D: 상태
    ];

    let R = 1;
    const cats = memberCategories[name];

    // ===== 제목 =====
    ws.mergeCells(R, 1, R, 4);
    const title = ws.getCell(R, 1);
    title.value = `📋  ${name} — 주간 업무일지`;
    title.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2A4A' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.border = thickBorder;
    ws.getRow(R).height = 38;
    R++;

    // 기본 정보
    ws.getCell(R, 1).value = '📅 주차';
    ws.getCell(R, 1).font = { bold: true, size: 10 };
    ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1C4E9' } };
    ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 1).border = thinBorder;

    ws.getCell(R, 2).value = '3월 4주차';
    ws.getCell(R, 2).font = { size: 11 };
    ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    ws.getCell(R, 2).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 2).border = thinBorder;

    ws.getCell(R, 3).value = '3/24 ~ 3/28';
    ws.getCell(R, 3).font = { size: 11 };
    ws.getCell(R, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    ws.getCell(R, 3).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 3).border = thinBorder;

    ws.getCell(R, 4).value = '';
    ws.getCell(R, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
    ws.getCell(R, 4).border = thinBorder;
    ws.getRow(R).height = 26;
    R++;

    // 간격
    ws.getRow(R).height = 6;
    R++;

    // ===== 이번 주 업무 계획 =====
    ws.mergeCells(R, 1, R, 4);
    const planTitle = ws.getCell(R, 1);
    planTitle.value = '📌  이번 주 업무 계획';
    planTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
    planTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B5E20' } };
    planTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    planTitle.border = thickBorder;
    ws.getRow(R).height = 30;
    R++;

    // 계획 헤더
    ws.getCell(R, 1).value = '#';
    ws.getCell(R, 1).font = { bold: true, size: 10 };
    ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A5D6A7' } };
    ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 1).border = thinBorder;

    ws.mergeCells(R, 2, R, 3);
    ws.getCell(R, 2).value = '업무 내용';
    ws.getCell(R, 2).font = { bold: true, size: 10 };
    ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A5D6A7' } };
    ws.getCell(R, 2).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 2).border = thinBorder;

    ws.getCell(R, 4).value = '완료';
    ws.getCell(R, 4).font = { bold: true, size: 10 };
    ws.getCell(R, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A5D6A7' } };
    ws.getCell(R, 4).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 4).border = thinBorder;
    ws.getRow(R).height = 24;
    R++;

    // 계획 항목 7줄
    const planExamples = name === '수빈' ? [
      '글로컬 전체 결과보고서 제출',
      '소상공인협업활성화 정보공시',
      '포토인더박스 사업이관 진행',
      '재생전술 예약 관리',
      '창고 물품 리스트 업데이트',
      '', ''
    ] : ['', '', '', '', '', '', ''];

    for (let i = 0; i < 7; i++) {
      ws.getCell(R, 1).value = i + 1;
      ws.getCell(R, 1).font = { bold: true, size: 10, color: { argb: '1B5E20' } };
      ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
      ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(R, 1).border = thinBorder;

      ws.mergeCells(R, 2, R, 3);
      ws.getCell(R, 2).value = planExamples[i] || '';
      ws.getCell(R, 2).font = planExamples[i] ? exFont : { size: 10 };
      ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      ws.getCell(R, 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      ws.getCell(R, 2).border = thinBorder;

      ws.getCell(R, 4).value = '☐';
      ws.getCell(R, 4).font = { size: 14 };
      ws.getCell(R, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
      ws.getCell(R, 4).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(R, 4).border = thinBorder;

      // 드롭다운
      ws.getCell(R, 4).dataValidation = {
        type: 'list', allowBlank: true,
        formulae: ['"☐ 미완,🔄 진행중,✅ 완료"'], showDropDown: false,
      };

      ws.getRow(R).height = 26;
      R++;
    }

    // 간격
    ws.getRow(R).height = 6;
    R++;

    // ===== 일간 진행 기록 =====
    ws.mergeCells(R, 1, R, 4);
    const dailyTitle = ws.getCell(R, 1);
    dailyTitle.value = '📅  일간 진행 기록';
    dailyTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
    dailyTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };
    dailyTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    dailyTitle.border = thickBorder;
    ws.getRow(R).height = 30;
    R++;

    // 수빈 예시 데이터
    const dailyExamples = name === '수빈' ? {
      '월': [
        ['회계/세무', '글로컬 추가 요청사항 진행, 결과보고서 작성(진행중)'],
        ['재생전술', '주질검사 수원세무서 소통'],
        ['기타', 'ESG경영지원센터 기사수정'],
      ],
      '화': [
        ['회계/세무', '증빙보완 취합, 결과보고서 검수'],
        ['포인박 이관', '양수도계약서 작성, 사업자등록정정'],
        ['재생전술', '예약응대, 효와복 인스타 업로드'],
      ],
      '수': [], '목': [], '금': [],
    } : { '월': [], '화': [], '수': [], '목': [], '금': [] };

    // 각 요일별 블록
    days.forEach((day, di) => {
      // 요일 헤더
      ws.mergeCells(R, 1, R, 4);
      const dayHeader = ws.getCell(R, 1);
      dayHeader.value = `${day}요일 (${dayDates[di]})`;
      dayHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
      dayHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: di < 5 ? '1565C0' : 'FF6F00' } };
      dayHeader.alignment = { horizontal: 'left', vertical: 'middle' };
      dayHeader.border = thickBorder;
      ws.getRow(R).height = 26;
      R++;

      // 카테고리별 행 (고정 5줄)
      const examples = dailyExamples[day] || [];
      for (let ci = 0; ci < cats.length; ci++) {
        const cat = cats[ci];
        const ex = examples.find(e => e[0] === cat);

        ws.getCell(R, 1).value = '';
        ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
        ws.getCell(R, 1).border = thinBorder;

        ws.getCell(R, 2).value = cat;
        ws.getCell(R, 2).font = { bold: true, size: 9, color: { argb: '37474F' } };
        ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECEFF1' } };
        ws.getCell(R, 2).alignment = { horizontal: 'left', vertical: 'middle' };
        ws.getCell(R, 2).border = thinBorder;

        ws.getCell(R, 3).value = ex ? ex[1] : '';
        ws.getCell(R, 3).font = ex ? exFont : { size: 10 };
        ws.getCell(R, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
        ws.getCell(R, 3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        ws.getCell(R, 3).border = thinBorder;

        ws.getCell(R, 4).value = '';
        ws.getCell(R, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
        ws.getCell(R, 4).border = thinBorder;

        ws.getRow(R).height = 24;
        R++;
      }

      // 커뮤니케이션 행
      ws.getCell(R, 1).value = '';
      ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
      ws.getCell(R, 1).border = thinBorder;

      ws.getCell(R, 2).value = '💬 소통';
      ws.getCell(R, 2).font = { bold: true, size: 9, color: { argb: '4A148C' } };
      ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E5F5' } };
      ws.getCell(R, 2).alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell(R, 2).border = thinBorder;

      ws.getCell(R, 3).value = '';
      ws.getCell(R, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      ws.getCell(R, 3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      ws.getCell(R, 3).border = thinBorder;

      ws.getCell(R, 4).value = '';
      ws.getCell(R, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      ws.getCell(R, 4).border = thinBorder;
      ws.getRow(R).height = 24;
      R++;

      // 요일 간 간격
      ws.getRow(R).height = 4;
      R++;
    });

    // ===== 주간 회고 =====
    ws.getRow(R).height = 6;
    R++;

    ws.mergeCells(R, 1, R, 4);
    const revTitle = ws.getCell(R, 1);
    revTitle.value = '💭  주간 회고 (금요일에 작성)';
    revTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
    revTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D40' } };
    revTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    revTitle.border = thickBorder;
    ws.getRow(R).height = 30;
    R++;

    const revItems = [
      { label: '✅ 잘한 것', fill: 'B2DFDB', iFill: 'E0F2F1' },
      { label: '😅 아쉬운 것', fill: 'FFE082', iFill: 'FFF8E1' },
      { label: '📋 다음 주 중점', fill: '90CAF9', iFill: 'E3F2FD' },
    ];

    revItems.forEach(item => {
      ws.getCell(R, 1).value = item.label;
      ws.getCell(R, 1).font = { bold: true, size: 10 };
      ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.fill } };
      ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(R, 1).border = thinBorder;

      ws.mergeCells(R, 2, R, 4);
      ws.getCell(R, 2).value = '';
      ws.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.iFill } };
      ws.getCell(R, 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      ws.getCell(R, 2).border = thinBorder;
      ws.getRow(R).height = 32;
      R++;
    });
  });

  // ========================================
  // 시트 5: 📊 대표 대시보드
  // ========================================
  const dash = wb.addWorksheet('📊 대표 대시보드', {
    properties: { defaultRowHeight: 22 },
  });

  dash.columns = [
    { width: 12 }, // A: 이름
    { width: 10 }, // B: 구분
    { width: 55 }, // C: 내용
  ];

  R = 1;
  dash.mergeCells(R, 1, R, 3);
  const dashTitle = dash.getCell(R, 1);
  dashTitle.value = '📊  주간 요약 — 대표 대시보드';
  dashTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  dashTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2A4A' } };
  dashTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  dashTitle.border = thickBorder;
  dash.getRow(R).height = 38;
  R++;

  dash.mergeCells(R, 1, R, 3);
  dash.getCell(R, 1).value = '3월 4주차 (3/24 ~ 3/28)';
  dash.getCell(R, 1).font = { bold: true, size: 12 };
  dash.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
  dash.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  dash.getCell(R, 1).border = thinBorder;
  dash.getRow(R).height = 28;
  R++;

  dash.getRow(R).height = 6;
  R++;

  // 팀원별 요약 블록
  const dashFills = ['E8F5E9', 'E3F2FD', 'F3E5F5'];
  const statusLabels = [
    { label: '✅ 완료', fill: 'C8E6C9' },
    { label: '🔄 진행중', fill: 'FFF9C4' },
    { label: '📋 주요 소통', fill: 'E1BEE7' },
    { label: '📌 다음 주', fill: 'BBDEFB' },
  ];

  members.forEach((name, mi) => {
    // 이름 헤더
    dash.mergeCells(R, 1, R, 3);
    const nameH = dash.getCell(R, 1);
    nameH.value = `👤  ${name}`;
    nameH.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    nameH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '37474F' } };
    nameH.alignment = { horizontal: 'left', vertical: 'middle' };
    nameH.border = thickBorder;
    dash.getRow(R).height = 28;
    R++;

    statusLabels.forEach(sl => {
      dash.getCell(R, 1).value = '';
      dash.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dashFills[mi] } };
      dash.getCell(R, 1).border = thinBorder;

      dash.getCell(R, 2).value = sl.label;
      dash.getCell(R, 2).font = { bold: true, size: 9 };
      dash.getCell(R, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sl.fill } };
      dash.getCell(R, 2).alignment = { horizontal: 'center', vertical: 'middle' };
      dash.getCell(R, 2).border = thinBorder;

      dash.getCell(R, 3).value = '';
      dash.getCell(R, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      dash.getCell(R, 3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      dash.getCell(R, 3).border = thinBorder;
      dash.getRow(R).height = 28;
      R++;
    });

    dash.getRow(R).height = 6;
    R++;
  });

  // 안내
  dash.mergeCells(R, 1, R, 3);
  dash.getCell(R, 1).value = '💡 v1: 수동 작성. v2에서 팀원 시트에서 자동 수집 예정';
  dash.getCell(R, 1).font = { size: 9, color: { argb: '888888' } };
  dash.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  // ========================================
  // 시트 6: 사용법
  // ========================================
  const help = wb.addWorksheet('사용법');
  help.columns = [{ width: 80 }];

  const helpTexts = [
    ['📋 팀 업무일지 — 사용법', { bold: true, size: 16 }],
    [''],
    ['1단계: 구글 드라이브에 업로드', { bold: true, size: 13 }],
    ['   • drive.google.com → "새로 만들기" → "파일 업로드" → 이 파일 선택'],
    ['   • 업로드된 파일 더블클릭 → "Google 스프레드시트로 열기"'],
    [''],
    ['2단계: 매일 사용하기', { bold: true, size: 13 }],
    ['   • 자기 이름 탭(시트)을 클릭'],
    ['   • 월요일 아침: "이번 주 업무 계획" 작성'],
    ['   • 매일 퇴근 전: 해당 요일의 "진행 기록"에 오늘 한 일 작성'],
    ['   • 금요일: "주간 회고" 작성'],
    [''],
    ['3단계: 스케줄 공유', { bold: true, size: 13 }],
    ['   • "📍 스케줄 보드" 탭에 외근/미팅 일정 입력'],
    ['   • 기본은 "사무실" — 변경 사항만 적으면 됨'],
    ['   • 팀 전원이 한눈에 확인 가능'],
    [''],
    ['4단계: 주간 마무리', { bold: true, size: 13 }],
    ['   • 대표님: "📊 대표 대시보드"에서 전체 팀원 주간 요약 확인'],
    ['   • 다음 주 시작 시: 새 파일 복사 or Apps Script로 초기화'],
    [''],
    ['💡 팁', { bold: true, size: 13 }],
    ['   • 핸드폰에서 구글 시트 앱으로 "📍 스케줄 보드"를 즐겨찾기 해두세요'],
    ['   • 카테고리(회계/세무, 재생전술 등)는 사람마다 다르게 설정 가능'],
    ['   • 팀원 추가 시: 시트를 복사해서 이름만 바꾸면 됨'],
  ];

  helpTexts.forEach((item, i) => {
    const row = help.getRow(i + 1);
    const text = Array.isArray(item) ? item[0] : item;
    const style = Array.isArray(item) && item[1] ? item[1] : {};
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = { size: style.size || 11, bold: style.bold || false };
    cell.alignment = { vertical: 'middle', wrapText: true };
    row.height = text ? 22 : 10;
  });

  // ===== Apps Script =====
  const appsScript = `
// ========================================
// 📋 팀 업무일지 — Apps Script
// 구글 시트 > 확장 프로그램 > Apps Script에 붙여넣기
// ========================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('업무일지')
    .addItem('새 주차 시작', 'newWeek')
    .addItem('이번 주 보관', 'archiveWeek')
    .addSeparator()
    .addItem('초기 설정 (최초 1회)', 'initialSetup')
    .addToUi();
}

function initialSetup() {
  setupDropdowns();
  SpreadsheetApp.getUi().alert(
    '초기 설정 완료!\\n\\n' +
    '드롭다운이 설정되었습니다.\\n' +
    '업무일지 메뉴에서 기능을 사용하세요.'
  );
}

function setupDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var checkRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['미완', '진행중', '완료'], true)
    .setAllowInvalid(false)
    .build();

  // 각 팀원 시트의 업무 계획 완료 드롭다운 설정
  var memberSheets = ss.getSheets().filter(function(s) {
    var name = s.getName();
    return name !== '📍 스케줄 보드' && name !== '📊 대표 대시보드' && name !== '사용법';
  });

  memberSheets.forEach(function(sheet) {
    // 업무 계획 완료 칸 (행 6~12, 열 D)
    for (var r = 6; r <= 12; r++) {
      sheet.getRange(r, 4).setDataValidation(checkRule);
    }
  });
}

function fmtDate(d) {
  return (d.getMonth() + 1) + '/' + d.getDate();
}

function newWeek() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '새 주차 시작',
    '모든 팀원 시트의 진행 기록과 스케줄을 초기화합니다.\\n업무 계획은 유지됩니다.\\n\\n저장하지 않은 내용은 사라집니다. 계속할까요?',
    ui.ButtonSet.YES_NO
  );
  if (result !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 다음 주 월요일 계산
  var today = new Date();
  var dayOfWeek = today.getDay();
  var daysUntilNextMon = (8 - dayOfWeek) % 7;
  if (daysUntilNextMon === 0) daysUntilNextMon = 7;
  var nextMon = new Date(today);
  nextMon.setDate(today.getDate() + daysUntilNextMon);

  var nextMonth = nextMon.getMonth() + 1;
  var weekOfMonth = Math.ceil(nextMon.getDate() / 7);

  var nextFri = new Date(nextMon);
  nextFri.setDate(nextMon.getDate() + 4);
  var period = fmtDate(nextMon) + ' ~ ' + fmtDate(nextFri);

  // 스케줄 보드 날짜 업데이트
  var schedSheet = ss.getSheetByName('📍 스케줄 보드');
  if (schedSheet) {
    schedSheet.getRange('C2').setValue(period);
    schedSheet.getRange('A2').setValue(nextMonth + '월 ' + weekOfMonth + '주차');
    // 날짜 행 (행 5)
    for (var i = 0; i < 5; i++) {
      var d = new Date(nextMon);
      d.setDate(nextMon.getDate() + i);
      schedSheet.getRange(5, i + 2).setValue(fmtDate(d));
    }
    // 스케줄 내용 초기화 (행 6~9, 열 B~F)
    for (var r = 6; r <= 9; r++) {
      for (var c = 2; c <= 6; c++) {
        schedSheet.getRange(r, c).setValue('사무실');
      }
    }
  }

  // 팀원 시트 초기화
  var memberSheets = ss.getSheets().filter(function(s) {
    var name = s.getName();
    return name !== '📍 스케줄 보드' && name !== '📊 대표 대시보드' && name !== '사용법';
  });

  memberSheets.forEach(function(sheet) {
    // 주차 정보 업데이트
    sheet.getRange('B2').setValue(nextMonth + '월 ' + weekOfMonth + '주차');
    sheet.getRange('C2').setValue(period);

    // 일간 진행 기록 초기화 (업무 계획은 유지)
    // 각 요일 블록의 내용 칸을 비움
    var lastRow = sheet.getLastRow();
    for (var r = 14; r <= lastRow; r++) {
      var cellB = sheet.getRange(r, 2).getValue();
      // 요일 헤더가 아닌 행의 C열(내용)만 비움
      if (cellB && typeof cellB === 'string' && !cellB.includes('요일')) {
        sheet.getRange(r, 3).setValue('');
      }
    }
  });

  ui.alert('새 주차(' + nextMonth + '월 ' + weekOfMonth + '주차)로 시작합니다!');
}

function archiveWeek() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schedSheet = ss.getSheetByName('📍 스케줄 보드');
  var period = schedSheet ? schedSheet.getRange('A2').getValue() : '주차정보없음';

  // 현재 스프레드시트 전체를 복사
  var copyName = period + ' (보관)';
  var copy = ss.copy(copyName);

  SpreadsheetApp.getUi().alert(
    '보관 완료!\\n\\n' +
    '"' + copyName + '" 파일로 저장했습니다.\\n' +
    '구글 드라이브에서 확인하세요.'
  );
}
`;

  fs.writeFileSync('C:\\Users\\leeha\\OneDrive\\바탕 화면\\팀업무일지-Apps-Script.txt', appsScript.trim(), 'utf8');
  console.log('Apps Script 저장 완료');

  // ===== 파일 저장 =====
  const outputPath = 'C:\\Users\\leeha\\OneDrive\\바탕 화면\\팀-업무일지-v2.xlsx';
  await wb.xlsx.writeFile(outputPath);
  console.log('완료: ' + outputPath);
}

generate().catch(console.error);
