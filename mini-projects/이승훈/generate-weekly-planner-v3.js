const ExcelJS = require('exceljs');

async function generate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('주간계획서', {
    properties: { defaultRowHeight: 24 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  // 열 너비 설정
  ws.columns = [
    { width: 14 },  // A 라벨
    { width: 15 },  // B 월
    { width: 5 },   // C 목표
    { width: 15 },  // D 화
    { width: 5 },   // E 목표
    { width: 15 },  // F 수
    { width: 5 },   // G 목표
    { width: 15 },  // H 목
    { width: 5 },   // I 목표
    { width: 15 },  // J 금
    { width: 5 },   // K 목표
    { width: 15 },  // L 토
    { width: 5 },   // M 목표
    { width: 15 },  // N 일
    { width: 5 },   // O
  ];

  // 스타일 프리셋
  const thick = { style: 'medium', color: { argb: '333333' } };
  const thin = { style: 'thin', color: { argb: 'AAAAAA' } };
  const thinBorder = { top: thin, bottom: thin, left: thin, right: thin };
  const thickBorder = { top: thick, bottom: thick, left: thick, right: thick };

  function styleRange(startRow, startCol, endRow, endCol, style) {
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

  let R = 1;

  // ========== 제목 ==========
  ws.mergeCells(R, 1, R, 15);
  const titleCell = ws.getCell(R, 1);
  titleCell.value = '📋  주 간 계 획 서';
  titleCell.font = { bold: true, size: 20, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2A4A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = thickBorder;
  ws.getRow(R).height = 42;
  R++;

  // ========== 기본 정보 ==========
  ws.getRow(R).height = 28;
  const infoLabels = [
    { col: 1, text: '📅 월', width: 1 },
    { col: 2, text: '3', width: 1, input: true },
    { col: 3, text: '주차', width: 1 },
    { col: 4, text: '2', width: 1, input: true },
    { col: 5, text: '기간', width: 1 },
    { col: 6, text: '3/10 ~ 3/16', width: 3, input: true },
    { col: 9, text: '작성자', width: 1 },
    { col: 10, text: '이승훈', width: 1, input: true },
  ];
  infoLabels.forEach(item => {
    const cell = ws.getCell(R, item.col);
    cell.value = item.text;
    cell.font = { bold: !item.input, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.input ? 'FFF9C4' : 'D1C4E9' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
    if (item.width > 1) ws.mergeCells(R, item.col, R, item.col + item.width - 1);
  });
  // 이번 주 한마디
  const themeLabel = ws.getCell(R, 11);
  themeLabel.value = '💡 이번 주 한마디';
  themeLabel.font = { bold: true, size: 11 };
  themeLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0B2' } };
  themeLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  themeLabel.border = thinBorder;
  ws.mergeCells(R, 12, R, 15);
  const themeInput = ws.getCell(R, 12);
  themeInput.value = '예) 신규 거래처 확보에 집중!';
  themeInput.font = { size: 10, italic: true, color: { argb: '999999' } };
  themeInput.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
  themeInput.alignment = { horizontal: 'left', vertical: 'middle' };
  themeInput.border = thinBorder;
  R++;

  // 빈 행
  ws.getRow(R).height = 6;
  R++;

  // ========== 🎯 이번 주 목표 ==========
  ws.mergeCells(R, 1, R, 15);
  const goalTitle = ws.getCell(R, 1);
  goalTitle.value = '🎯  이번 주 목표';
  goalTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  goalTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B5E20' } };
  goalTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  goalTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++;

  // 목표 헤더
  ws.mergeCells(R, 1, R, 2);
  styleRange(R, 1, R, 15, { fill: 'A5D6A7', font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: thinBorder });
  ws.getCell(R, 1).value = '구분';
  ws.mergeCells(R, 3, R, 10);
  ws.getCell(R, 3).value = '목표 내용';
  ws.mergeCells(R, 11, R, 13);
  ws.getCell(R, 11).value = '완료 기준 (어떻게 되면 성공?)';
  ws.mergeCells(R, 14, R, 15);
  ws.getCell(R, 14).value = '달성';
  ws.getRow(R).height = 26;
  R++;

  const goalExamples = [
    { goal: '예) 신규 거래처 3곳 미팅 잡기', criteria: '예) 미팅 일정 확정 3건' },
    { goal: '예) 이번 주 공동구매 마감률 90% 달성', criteria: '예) 미마감 상품 2개 이하' },
    { goal: '예) 주간 정산 자동화 시트 완성', criteria: '예) 시트에 데이터 넣으면 자동 계산됨' },
  ];
  for (let i = 1; i <= 3; i++) {
    ws.mergeCells(R, 1, R, 2);
    const numCell = ws.getCell(R, 1);
    numCell.value = '목표 ' + i;
    numCell.font = { bold: true, size: 12, color: { argb: '1B5E20' } };
    numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
    numCell.alignment = { horizontal: 'center', vertical: 'middle' };
    numCell.border = thinBorder;

    ws.mergeCells(R, 3, R, 10);
    const goalInput = ws.getCell(R, 3);
    goalInput.value = goalExamples[i-1].goal;
    goalInput.font = { size: 10, italic: true, color: { argb: '999999' } };
    goalInput.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    goalInput.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    goalInput.border = thinBorder;

    ws.mergeCells(R, 11, R, 13);
    const criteriaInput = ws.getCell(R, 11);
    criteriaInput.value = goalExamples[i-1].criteria;
    criteriaInput.font = { size: 10, italic: true, color: { argb: '999999' } };
    criteriaInput.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    criteriaInput.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    criteriaInput.border = thinBorder;

    ws.mergeCells(R, 14, R, 15);
    const checkCell = ws.getCell(R, 14);
    checkCell.value = '☐';
    checkCell.font = { size: 16 };
    checkCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    checkCell.alignment = { horizontal: 'center', vertical: 'middle' };
    checkCell.border = thinBorder;

    ws.getRow(R).height = 28;
    R++;
  }

  // 빈 행
  ws.getRow(R).height = 6;
  R++;

  // ========== 📅 일별 계획 ==========
  ws.mergeCells(R, 1, R, 15);
  const dayTitle = ws.getCell(R, 1);
  dayTitle.value = '📅  일별 계획';
  dayTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  dayTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };
  dayTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  dayTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++;

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const dayCols = [2, 4, 6, 8, 10, 12, 14]; // 시작 열
  const dayFills = ['42A5F5', '42A5F5', '42A5F5', '42A5F5', '42A5F5', 'FF9800', 'EF5350'];
  const dayLightFills = ['E3F2FD', 'E3F2FD', 'E3F2FD', 'E3F2FD', 'E3F2FD', 'FFF3E0', 'FFEBEE'];

  // 요일 헤더
  ws.getCell(R, 1).value = '';
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A237E' } };
  ws.getCell(R, 1).border = thickBorder;
  ws.getRow(R).height = 30;
  days.forEach((day, i) => {
    ws.mergeCells(R, dayCols[i], R, dayCols[i] + 1);
    const cell = ws.getCell(R, dayCols[i]);
    cell.value = day + '요일';
    cell.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayFills[i] } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thickBorder;
  });
  R++;

  // 날짜 행
  const dateExamples = ['3/10', '3/11', '3/12', '3/13', '3/14', '3/15', '3/16'];
  ws.getCell(R, 1).value = '📆 날짜';
  ws.getCell(R, 1).font = { bold: true, size: 10 };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFD8DC' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  days.forEach((_, i) => {
    ws.mergeCells(R, dayCols[i], R, dayCols[i] + 1);
    const cell = ws.getCell(R, dayCols[i]);
    cell.value = dateExamples[i];
    cell.font = { size: 10, italic: true, color: { argb: '999999' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  ws.getRow(R).height = 24;
  R++;

  // 컨디션 행
  const condExamples = ['💚', '💚', '🟡', '💚', '🟡', '🔴', '💚'];
  ws.getCell(R, 1).value = '💪 컨디션';
  ws.getCell(R, 1).font = { bold: true, size: 10 };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFD8DC' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  days.forEach((_, i) => {
    ws.mergeCells(R, dayCols[i], R, dayCols[i] + 1);
    const cell = ws.getCell(R, dayCols[i]);
    cell.value = condExamples[i];
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
    cell.font = { size: 14 };
  });
  ws.getRow(R).height = 26;
  R++;

  // 할일 서브헤더
  ws.getCell(R, 1).value = '핵심 할일';
  ws.getCell(R, 1).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '37474F' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  days.forEach((_, i) => {
    const todoHeader = ws.getCell(R, dayCols[i]);
    todoHeader.value = '할일';
    todoHeader.font = { bold: true, size: 9 };
    todoHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayLightFills[i] } };
    todoHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    todoHeader.border = thinBorder;

    const goalHeader = ws.getCell(R, dayCols[i] + 1);
    goalHeader.value = '①②③';
    goalHeader.font = { bold: true, size: 8, color: { argb: '666666' } };
    goalHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayLightFills[i] } };
    goalHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    goalHeader.border = thinBorder;
  });
  ws.getRow(R).height = 22;
  R++;

  // 할일 3줄 - 월요일에만 예시
  const todoExamples = [
    // [할일, 목표번호] x 7요일 x 3줄
    [['거래처 A사 미팅','①'], ['발주서 정리','②'], ['챗봇 테스트','③'], ['',''], ['',''], ['',''], ['','']],
    [['거래처 B사 전화','①'], ['공구 마감 확인','②'], ['시트 수정','③'], ['',''], ['',''], ['',''], ['','']],
    [['견적서 발송','①'], ['배송 현황 체크','②'], ['',''], ['',''], ['',''], ['',''], ['','']],
  ];
  for (let t = 0; t < 3; t++) {
    ws.getCell(R, 1).value = t + 1;
    ws.getCell(R, 1).font = { bold: true, size: 12, color: { argb: '0D47A1' } };
    ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: t === 0 ? 'BBDEFB' : 'E3F2FD' } };
    ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 1).border = thinBorder;

    days.forEach((_, i) => {
      const todoCell = ws.getCell(R, dayCols[i]);
      const ex = todoExamples[t][i];
      if (ex[0]) {
        todoCell.value = ex[0];
        todoCell.font = { size: 9, italic: true, color: { argb: '999999' } };
      } else {
        todoCell.font = { size: 10 };
      }
      todoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      todoCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      todoCell.border = thinBorder;

      const goalCell = ws.getCell(R, dayCols[i] + 1);
      if (ex[1]) {
        goalCell.value = ex[1];
        goalCell.font = { size: 9, italic: true, color: { argb: '999999' } };
      } else {
        goalCell.font = { size: 10 };
      }
      goalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
      goalCell.alignment = { horizontal: 'center', vertical: 'middle' };
      goalCell.border = thinBorder;
    });
    ws.getRow(R).height = 26;
    R++;
  }

  // 메모 행
  const memoExamples = ['예) A사 담당자 김부장', '', '', '', '', '', ''];
  ws.getCell(R, 1).value = '📝 메모';
  ws.getCell(R, 1).font = { bold: true, size: 10 };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFD8DC' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  days.forEach((_, i) => {
    ws.mergeCells(R, dayCols[i], R, dayCols[i] + 1);
    const cell = ws.getCell(R, dayCols[i]);
    if (memoExamples[i]) {
      cell.value = memoExamples[i];
      cell.font = { size: 9, italic: true, color: { argb: '999999' } };
    } else {
      cell.font = { size: 9 };
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });
  ws.getRow(R).height = 26;
  R++;

  // 빈 행
  ws.getRow(R).height = 6;
  R++;

  // ========== 🚀 핵심 프로젝트 ==========
  ws.mergeCells(R, 1, R, 15);
  const projTitle = ws.getCell(R, 1);
  projTitle.value = '🚀  핵심 프로젝트 진행';
  projTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  projTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BF360C' } };
  projTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  projTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++;

  // 프로젝트 헤더
  styleRange(R, 1, R, 15, { fill: 'FFAB91', font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: thinBorder });
  ws.getCell(R, 1).value = '#';
  ws.mergeCells(R, 2, R, 5);
  ws.getCell(R, 2).value = '프로젝트명';
  ws.mergeCells(R, 6, R, 10);
  ws.getCell(R, 6).value = '이번 주 할 것';
  ws.mergeCells(R, 11, R, 12);
  ws.getCell(R, 11).value = '진행상태';
  ws.mergeCells(R, 13, R, 15);
  ws.getCell(R, 13).value = '비고';
  ws.getRow(R).height = 26;
  R++;

  const projExamples = [
    { name: '예) 슈파 공동구매 챗봇', todo: '예) 주문관리 탭 완성 + 테스트', status: '🟡 진행중', note: '예) 카카오 연동 대기' },
    { name: '예) 주간 정산 자동화', todo: '예) 구글 시트 양식 확정', status: '🔴 시작전', note: '' },
    { name: '', todo: '', status: '', note: '' },
    { name: '', todo: '', status: '', note: '' },
    { name: '', todo: '', status: '', note: '' },
  ];
  for (let i = 0; i < 5; i++) {
    const numCell = ws.getCell(R, 1);
    numCell.value = i + 1;
    numCell.font = { bold: true, size: 11, color: { argb: 'BF360C' } };
    numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FBE9E7' } };
    numCell.alignment = { horizontal: 'center', vertical: 'middle' };
    numCell.border = thinBorder;

    ws.mergeCells(R, 2, R, 5);
    const nameCell = ws.getCell(R, 2);
    nameCell.value = projExamples[i].name;
    nameCell.font = projExamples[i].name ? { size: 10, italic: true, color: { argb: '999999' } } : { size: 10 };
    nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    nameCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    nameCell.border = thinBorder;

    ws.mergeCells(R, 6, R, 10);
    const todoCell = ws.getCell(R, 6);
    todoCell.value = projExamples[i].todo;
    todoCell.font = projExamples[i].todo ? { size: 10, italic: true, color: { argb: '999999' } } : { size: 10 };
    todoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    todoCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    todoCell.border = thinBorder;

    ws.mergeCells(R, 11, R, 12);
    const statusCell = ws.getCell(R, 11);
    statusCell.value = projExamples[i].status;
    statusCell.font = projExamples[i].status ? { size: 10, italic: true, color: { argb: '999999' } } : { size: 10 };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    statusCell.border = thinBorder;

    ws.mergeCells(R, 13, R, 15);
    const noteCell = ws.getCell(R, 13);
    noteCell.value = projExamples[i].note;
    noteCell.font = projExamples[i].note ? { size: 10, italic: true, color: { argb: '999999' } } : { size: 10 };
    noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    noteCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    noteCell.border = thinBorder;

    ws.getRow(R).height = 26;
    R++;
  }

  // 빈 행
  ws.getRow(R).height = 6;
  R++;

  // ========== 🤝 미팅 + ⚠️ 마감 (좌우) ==========
  // 미팅 타이틀
  ws.mergeCells(R, 1, R, 8);
  const meetTitle = ws.getCell(R, 1);
  meetTitle.value = '🤝  주요 미팅 / 약속';
  meetTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  meetTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A148C' } };
  meetTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  meetTitle.border = thickBorder;

  ws.mergeCells(R, 9, R, 15);
  const deadTitle = ws.getCell(R, 9);
  deadTitle.value = '⚠️  놓치면 안 되는 것 (마감)';
  deadTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  deadTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B71C1C' } };
  deadTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  deadTitle.border = thickBorder;
  ws.getRow(R).height = 30;
  R++;

  // 헤더
  const meetHeaders = [{c:1, t:'날짜', w:1}, {c:2, t:'시간', w:1}, {c:3, t:'대상', w:2}, {c:5, t:'안건', w:3}, {c:8, t:'비고', w:1}];
  meetHeaders.forEach(h => {
    if (h.w > 1) ws.mergeCells(R, h.c, R, h.c + h.w - 1);
    const cell = ws.getCell(R, h.c);
    cell.value = h.t;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CE93D8' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const deadHeaders = [{c:9, t:'마감일', w:1}, {c:10, t:'내용', w:4}, {c:14, t:'완료', w:2}];
  deadHeaders.forEach(h => {
    if (h.w > 1) ws.mergeCells(R, h.c, R, h.c + h.w - 1);
    const cell = ws.getCell(R, h.c);
    cell.value = h.t;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF9A9A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  ws.getRow(R).height = 24;
  R++;

  const meetExamples = [
    { date: '3/10', time: '14:00', target: 'A사 김부장', agenda: '신규 거래 조건 협의', note: '본사 방문' },
    { date: '3/12', time: '10:00', target: '팀 내부', agenda: '주간 점검 회의', note: '' },
    { date: '', time: '', target: '', agenda: '', note: '' },
    { date: '', time: '', target: '', agenda: '', note: '' },
    { date: '', time: '', target: '', agenda: '', note: '' },
  ];
  const deadExamples = [
    { date: '3/14', content: '공동구매 3월 2차 마감', check: '☐' },
    { date: '3/15', content: '거래처 견적서 회신', check: '☐' },
    { date: '', content: '', check: '☐' },
    { date: '', content: '', check: '☐' },
    { date: '', content: '', check: '☐' },
  ];
  const exFont = { size: 9, italic: true, color: { argb: '999999' } };
  const normalFont = { size: 10 };

  for (let i = 0; i < 5; i++) {
    const m = meetExamples[i];
    const d = deadExamples[i];

    // 미팅
    const dateCell = ws.getCell(R, 1);
    dateCell.value = m.date;
    dateCell.font = m.date ? exFont : normalFont;
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.border = thinBorder;

    const timeCell = ws.getCell(R, 2);
    timeCell.value = m.time;
    timeCell.font = m.time ? exFont : normalFont;
    timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    timeCell.border = thinBorder;

    ws.mergeCells(R, 3, R, 4);
    const targetCell = ws.getCell(R, 3);
    targetCell.value = m.target;
    targetCell.font = m.target ? exFont : normalFont;
    targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    targetCell.alignment = { horizontal: 'left', vertical: 'middle' };
    targetCell.border = thinBorder;

    ws.mergeCells(R, 5, R, 7);
    const agendaCell = ws.getCell(R, 5);
    agendaCell.value = m.agenda;
    agendaCell.font = m.agenda ? exFont : normalFont;
    agendaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    agendaCell.alignment = { horizontal: 'left', vertical: 'middle' };
    agendaCell.border = thinBorder;

    const mNoteCell = ws.getCell(R, 8);
    mNoteCell.value = m.note;
    mNoteCell.font = m.note ? exFont : normalFont;
    mNoteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    mNoteCell.alignment = { horizontal: 'left', vertical: 'middle' };
    mNoteCell.border = thinBorder;

    // 마감
    const dDateCell = ws.getCell(R, 9);
    dDateCell.value = d.date;
    dDateCell.font = d.date ? exFont : normalFont;
    dDateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    dDateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dDateCell.border = thinBorder;

    ws.mergeCells(R, 10, R, 13);
    const dContentCell = ws.getCell(R, 10);
    dContentCell.value = d.content;
    dContentCell.font = d.content ? exFont : normalFont;
    dContentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    dContentCell.alignment = { horizontal: 'left', vertical: 'middle' };
    dContentCell.border = thinBorder;

    ws.mergeCells(R, 14, R, 15);
    const checkCell = ws.getCell(R, 14);
    checkCell.value = d.check;
    checkCell.font = { size: 14 };
    checkCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    checkCell.alignment = { horizontal: 'center', vertical: 'middle' };
    checkCell.border = thinBorder;

    ws.getRow(R).height = 24;
    R++;
  }

  // 빈 행
  ws.getRow(R).height = 6;
  R++;

  // ========== 💭 주간 회고 ==========
  ws.mergeCells(R, 1, R, 15);
  const reviewTitle = ws.getCell(R, 1);
  reviewTitle.value = '💭  주간 회고';
  reviewTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  reviewTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D40' } };
  reviewTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  reviewTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++;

  const reviews = [
    { label: '✅  잘한 것', fill: 'B2DFDB', inputFill: 'E0F2F1', example: '예) 거래처 미팅 3건 모두 성사, 공구 마감률 95% 달성' },
    { label: '😅  아쉬운 것', fill: 'FFE082', inputFill: 'FFF8E1', example: '예) 정산 작업이 금요일로 밀림, 챗봇 테스트 시간 부족' },
    { label: '🔄  다음 주 개선점', fill: '90CAF9', inputFill: 'E3F2FD', example: '예) 정산은 수요일까지 끝내기, 미팅 후 바로 메모 정리' },
    { label: '📚  이번 주 배운 것', fill: 'F48FB1', inputFill: 'FCE4EC', example: '예) 구글 시트 Apps Script로 자동 전송 가능하다는 걸 알게 됨' },
  ];

  reviews.forEach(item => {
    ws.mergeCells(R, 1, R, 3);
    const labelCell = ws.getCell(R, 1);
    labelCell.value = item.label;
    labelCell.font = { bold: true, size: 12 };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.fill } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.border = thinBorder;

    ws.mergeCells(R, 4, R, 15);
    const inputCell = ws.getCell(R, 4);
    inputCell.value = item.example;
    inputCell.font = { size: 10, italic: true, color: { argb: '999999' } };
    inputCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.inputFill } };
    inputCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    inputCell.border = thinBorder;

    ws.getRow(R).height = 30;
    R++;
  });

  // ===== 하단 안내 =====
  R++;
  ws.mergeCells(R, 1, R, 15);
  const guideCell = ws.getCell(R, 1);
  guideCell.value = '💡 컨디션: 💚좋음  🟡보통  🔴나쁨  |  목표 번호: ①②③ 중 해당하는 목표 번호 기입  |  진행상태: 🔴시작전 → 🟡진행중 → 🟢완료';
  guideCell.font = { size: 9, color: { argb: '666666' } };
  guideCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(R).height = 22;

  // 저장
  const outputPath = 'C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서-최종판.xlsx';
  await wb.xlsx.writeFile(outputPath);
  console.log('완료: ' + outputPath);
}

generate().catch(console.error);
