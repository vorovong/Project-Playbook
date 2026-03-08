const ExcelJS = require('exceljs');

async function generate() {
  const wb = new ExcelJS.Workbook();

  // ===== Apps Script 코드를 별도 텍스트 파일로도 저장 =====
  const fs = require('fs');

  const appsScript = `
// ========================================
// 📋 주간 계획서 — Apps Script
// 구글 시트에 붙여넣기 하세요
// ========================================

// 메뉴 추가 (시트 열 때 자동 실행)
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 계획서')
    .addItem('💾 이번 주 저장하기', 'saveWeek')
    .addItem('📄 새 주차 시작', 'resetSheet')
    .addSeparator()
    .addItem('📌 도구 패널 열기', 'showSidebar')
    .addItem('🔧 초기 설정 (최초 1회)', 'initialSetup')
    .addToUi();
}

// 🔧 초기 설정 — 최초 1회만 실행 (드롭다운 + 도구 패널 자동 열기)
function initialSetup() {
  setupDropdowns();
  enableAutoSidebar();
  showSidebar();

  SpreadsheetApp.getUi().alert(
    '✅ 초기 설정 완료!\\n\\n' +
    '📌 오른쪽에 도구 패널이 나타났습니다!\\n' +
    '큰 버튼으로 저장/초기화를 할 수 있어요.\\n\\n' +
    '다음부터 시트를 열면 자동으로 도구 패널이 뜹니다.'
  );
}

// 🔧 드롭다운 설정
function setupDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('주간계획서');
  if (!sheet) return;

  // 컨디션 드롭다운 (행 13, 열 B~O, 2칸씩 병합)
  var condRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['💚 좋음', '🟡 보통', '🔴 나쁨'], true)
    .setAllowInvalid(false)
    .build();
  for (var col = 2; col <= 14; col += 2) {
    sheet.getRange(13, col).setDataValidation(condRule);
  }

  // 목표 번호 드롭다운 (행 15~17, 각 요일의 목표열)
  var goalNumRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['①', '②', '③'], true)
    .setAllowInvalid(false)
    .build();
  for (var r = 15; r <= 17; r++) {
    for (var col = 3; col <= 15; col += 2) {
      sheet.getRange(r, col).setDataValidation(goalNumRule);
    }
  }

  // 달성 여부 드롭다운 (행 6~8, 열 N)
  var checkRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['☐ 미완', '✅ 완료'], true)
    .setAllowInvalid(false)
    .build();
  for (var r = 6; r <= 8; r++) {
    sheet.getRange(r, 14).setDataValidation(checkRule);
  }

  // 프로젝트 진행상태 드롭다운 (행 22~26, 열 K)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['🔴 시작전', '🟡 진행중', '🟢 완료'], true)
    .setAllowInvalid(false)
    .build();
  for (var r = 22; r <= 26; r++) {
    sheet.getRange(r, 11).setDataValidation(statusRule);
  }

  // 마감 완료 드롭다운 (행 30~34, 열 N)
  var deadCheckRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['☐ 미완', '✅ 완료'], true)
    .setAllowInvalid(false)
    .build();
  for (var r = 30; r <= 34; r++) {
    sheet.getRange(r, 14).setDataValidation(deadCheckRule);
  }

}

// 💾 저장 버튼: 현재 내용을 새 시트로 복사 + 원본 초기화
function saveWeek() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('주간계획서');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('⚠️ "주간계획서" 시트를 찾을 수 없습니다.');
    return;
  }

  // 월, 주차 정보 가져오기
  var month = sheet.getRange('B2').getValue();
  var week = sheet.getRange('D2').getValue();
  var period = sheet.getRange('F2').getValue();

  // 시트 이름 만들기
  var sheetName = month + '월' + week + '주차';
  if (period) sheetName += ' (' + period + ')';

  // 같은 이름이 있으면 번호 붙이기
  var finalName = sheetName;
  var counter = 1;
  while (ss.getSheetByName(finalName)) {
    counter++;
    finalName = sheetName + '_' + counter;
  }

  // 현재 시트 복사
  var newSheet = sheet.copyTo(ss);
  newSheet.setName(finalName);

  // 복사된 시트를 맨 뒤로 이동
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(ss.getNumSheets());

  // 원본 시트 초기화
  resetInputCells(sheet);

  // 원본 시트로 돌아가기
  ss.setActiveSheet(sheet);

  SpreadsheetApp.getUi().alert(
    '✅ 저장 완료!\\n\\n' +
    '📁 "' + finalName + '" 시트로 저장했습니다.\\n' +
    '📝 주간계획서는 새 주차로 초기화되었습니다.'
  );
}

// 📄 새 주차 시작: 입력 칸만 비우기
function resetSheet() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '📄 새 주차 시작',
    '현재 내용을 모두 지우고 빈 양식으로 만듭니다.\\n\\n⚠️ 저장하지 않은 내용은 사라집니다. 계속할까요?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('주간계획서');
  if (!sheet) return;

  resetInputCells(sheet);
  ui.alert('✅ 초기화 완료! 새 주차를 시작하세요.');
}

// 입력 칸 초기화 + 다음 주 날짜 자동 채우기
function resetInputCells(sheet) {
  // ===== 다음 주 월요일 계산 =====
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0=일, 1=월, ...
  // 다음 주 월요일까지 남은 일수
  var daysUntilNextMon = (8 - dayOfWeek) % 7;
  if (daysUntilNextMon === 0) daysUntilNextMon = 7; // 오늘이 월요일이면 다음 주 월요일
  var nextMon = new Date(today);
  nextMon.setDate(today.getDate() + daysUntilNextMon);

  // 다음 주 일요일
  var nextSun = new Date(nextMon);
  nextSun.setDate(nextMon.getDate() + 6);

  // 월, 주차 계산
  var nextMonth = nextMon.getMonth() + 1;
  var weekOfMonth = Math.ceil(nextMon.getDate() / 7);

  // 날짜 포맷 함수
  function fmt(d) { return (d.getMonth() + 1) + '/' + d.getDate(); }

  // ===== 기본 정보 자동 채우기 =====
  sheet.getRange('B2').setValue(nextMonth);  // 월
  sheet.getRange('D2').setValue(weekOfMonth);  // 주차
  sheet.getRange('F2').setValue(fmt(nextMon) + ' ~ ' + fmt(nextSun));  // 기간
  // 작성자는 유지 (안 지움)
  sheet.getRange('L2').setValue('');  // 이번 주 한마디만 초기화

  // ===== 날짜 행 자동 채우기 (행 12, 각 요일) =====
  var dayCols = [2, 4, 6, 8, 10, 12, 14];
  for (var i = 0; i < 7; i++) {
    var d = new Date(nextMon);
    d.setDate(nextMon.getDate() + i);
    sheet.getRange(12, dayCols[i]).setValue(fmt(d));
  }

  // ===== 나머지 초기화 =====

  // 목표 초기화 (행 6~8)
  for (var r = 6; r <= 8; r++) {
    sheet.getRange(r, 3, 1, 8).setValue('');   // 목표 내용
    sheet.getRange(r, 11, 1, 3).setValue('');  // 완료 기준
    sheet.getRange(r, 14, 1, 2).setValue('☐ 미완'); // 달성 체크 리셋
  }

  // 컨디션 행 초기화 (행 13)
  for (var col = 2; col <= 14; col += 2) {
    sheet.getRange(13, col, 1, 2).setValue('');
  }
  // 할일 3줄 (행 15~17) + 목표번호
  for (var r = 15; r <= 17; r++) {
    for (var col = 2; col <= 14; col += 2) {
      sheet.getRange(r, col).setValue('');      // 할일
      sheet.getRange(r, col + 1).setValue('');  // 목표번호
    }
  }
  // 메모 행 (행 18)
  for (var col = 2; col <= 14; col += 2) {
    sheet.getRange(18, col, 1, 2).setValue('');
  }

  // 프로젝트 초기화 (행 22~26)
  for (var r = 22; r <= 26; r++) {
    sheet.getRange(r, 2, 1, 4).setValue('');   // 프로젝트명
    sheet.getRange(r, 6, 1, 5).setValue('');   // 이번 주 할 것
    sheet.getRange(r, 11, 1, 2).setValue('');  // 진행상태
    sheet.getRange(r, 13, 1, 3).setValue('');  // 비고
  }

  // 미팅 초기화 (행 30~34)
  for (var r = 30; r <= 34; r++) {
    sheet.getRange(r, 1).setValue('');  // 날짜
    sheet.getRange(r, 2).setValue('');  // 시간
    sheet.getRange(r, 3, 1, 2).setValue('');  // 대상
    sheet.getRange(r, 5, 1, 3).setValue('');  // 안건
    sheet.getRange(r, 8).setValue('');  // 비고
    sheet.getRange(r, 9).setValue('');  // 마감일
    sheet.getRange(r, 10, 1, 4).setValue('');  // 내용
    sheet.getRange(r, 14, 1, 2).setValue('☐ 미완');  // 완료 체크 리셋
  }

  // 주간 회고 초기화 (행 37~40)
  for (var r = 37; r <= 40; r++) {
    sheet.getRange(r, 4, 1, 12).setValue('');
  }
}

// ===== 📌 도구 패널 (사이드바) =====

function showSidebar() {
  var html = HtmlService.createHtmlOutput(getSidebarHtml())
    .setTitle('📋 계획서 도구');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getSidebarHtml() {
  return '<style>'
    + 'body{font-family:Arial,sans-serif;padding:20px;background:#FAFAFA;margin:0;}'
    + '.btn{display:block;width:100%;margin:12px 0;font-weight:bold;border-radius:14px;cursor:pointer;border:none;color:white;text-align:center;transition:opacity 0.2s;}'
    + '.btn:hover{opacity:0.85;}'
    + '.btn:active{transform:scale(0.97);}'
    + '.save{background:linear-gradient(135deg,#2E7D32,#43A047);font-size:18px;padding:24px 12px;}'
    + '.new{background:linear-gradient(135deg,#1565C0,#1E88E5);font-size:15px;padding:18px 12px;}'
    + '.msg{padding:14px;margin:12px 0;border-radius:10px;background:#E8F5E9;font-size:13px;display:none;line-height:1.5;}'
    + '.title{text-align:center;font-size:20px;font-weight:bold;margin:0 0 24px 0;}'
    + '.tip{font-size:11px;color:#888;text-align:center;margin-top:24px;line-height:1.6;}'
    + '</style>'
    + '<div class="title">📋 계획서 도구</div>'
    + '<div id="msg" class="msg"></div>'
    + '<button class="btn save" onclick="runSave(this)">💾 이번 주 저장하기</button>'
    + '<button class="btn new" onclick="runReset(this)">📄 새 주차 시작</button>'
    + '<div class="tip">💡 저장하면 이번 주가 새 시트로 복사되고<br>다음 주 날짜가 자동으로 채워져요</div>'
    + '<script>'
    + 'function showMsg(t){var e=document.getElementById("msg");e.innerText=t;e.style.display="block";setTimeout(function(){e.style.display="none";},6000);}'
    + 'function runSave(b){if(!confirm("이번 주 내용을 저장하고 새 주차로 넘어갈까요?"))return;b.disabled=true;b.textContent="저장 중...";google.script.run.withSuccessHandler(function(m){showMsg(m);b.disabled=false;b.textContent="\\ud83d\\udcbe 이번 주 저장하기";}).withFailureHandler(function(e){showMsg("오류: "+e.message);b.disabled=false;b.textContent="\\ud83d\\udcbe 이번 주 저장하기";}).saveWeekSidebar();}'
    + 'function runReset(b){if(!confirm("저장 안 한 내용은 사라집니다. 계속할까요?"))return;b.disabled=true;google.script.run.withSuccessHandler(function(m){showMsg(m);b.disabled=false;}).withFailureHandler(function(e){showMsg("오류: "+e.message);b.disabled=false;}).resetSheetSidebar();}'
    + '</script>';
}

// 사이드바에서 호출 — 저장
function saveWeekSidebar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('주간계획서');
  if (!sheet) return '⚠️ "주간계획서" 시트를 찾을 수 없습니다.';

  var month = sheet.getRange('B2').getValue();
  var week = sheet.getRange('D2').getValue();
  var period = sheet.getRange('F2').getValue();

  var sheetName = month + '월' + week + '주차';
  if (period) sheetName += ' (' + period + ')';

  var finalName = sheetName;
  var counter = 1;
  while (ss.getSheetByName(finalName)) { counter++; finalName = sheetName + '_' + counter; }

  var newSheet = sheet.copyTo(ss);
  newSheet.setName(finalName);
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(ss.getNumSheets());

  resetInputCells(sheet);
  ss.setActiveSheet(sheet);

  return '✅ "' + finalName + '" 저장 완료! 다음 주 날짜가 채워졌습니다.';
}

// 사이드바에서 호출 — 초기화
function resetSheetSidebar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('주간계획서');
  if (!sheet) return '⚠️ 시트를 찾을 수 없습니다.';

  resetInputCells(sheet);
  return '✅ 초기화 완료! 새 주차를 시작하세요.';
}

// 시트 열 때 자동으로 도구 패널 표시 (설치형 트리거)
function enableAutoSidebar() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'showSidebar') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('showSidebar')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
}
`;

  // Apps Script를 텍스트 파일로 저장
  fs.writeFileSync('C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서-Apps-Script.txt', appsScript.trim(), 'utf8');
  console.log('Apps Script 저장 완료');

  // ===== 메인 시트 생성 =====
  const ws = wb.addWorksheet('주간계획서', {
    properties: { defaultRowHeight: 24 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  ws.columns = [
    { width: 14 },  // A
    { width: 15 },  // B
    { width: 5 },   // C
    { width: 15 },  // D
    { width: 5 },   // E
    { width: 15 },  // F
    { width: 5 },   // G
    { width: 15 },  // H
    { width: 5 },   // I
    { width: 15 },  // J
    { width: 5 },   // K
    { width: 15 },  // L
    { width: 5 },   // M
    { width: 15 },  // N
    { width: 5 },   // O
  ];

  const thick = { style: 'medium', color: { argb: '333333' } };
  const thin = { style: 'thin', color: { argb: 'AAAAAA' } };
  const thinBorder = { top: thin, bottom: thin, left: thin, right: thin };
  const thickBorder = { top: thick, bottom: thick, left: thick, right: thick };
  const exFont = { size: 9, italic: true, color: { argb: '999999' } };
  const normalFont = { size: 10 };

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

  // ========== 행1: 제목 ==========
  ws.mergeCells(R, 1, R, 15);
  const titleCell = ws.getCell(R, 1);
  titleCell.value = '📋  주 간 계 획 서';
  titleCell.font = { bold: true, size: 20, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2A4A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = thickBorder;
  ws.getRow(R).height = 42;
  R++; // R=2

  // ========== 행2: 기본 정보 ==========
  ws.getRow(R).height = 28;
  const infoItems = [
    { col: 1, text: '📅 월', input: false },
    { col: 2, text: '', input: true },
    { col: 3, text: '주차', input: false },
    { col: 4, text: '', input: true },
    { col: 5, text: '기간', input: false },
    { col: 6, text: '', input: true, merge: 3 },
    { col: 9, text: '작성자', input: false },
    { col: 10, text: '', input: true },
  ];
  infoItems.forEach(item => {
    const cell = ws.getCell(R, item.col);
    cell.value = item.text;
    cell.font = { bold: !item.input, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.input ? 'FFF9C4' : 'D1C4E9' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
    if (item.merge) ws.mergeCells(R, item.col, R, item.col + item.merge - 1);
  });
  const themeLabel = ws.getCell(R, 11);
  themeLabel.value = '💡 이번 주 한마디';
  themeLabel.font = { bold: true, size: 11 };
  themeLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0B2' } };
  themeLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  themeLabel.border = thinBorder;
  ws.mergeCells(R, 12, R, 15);
  const themeInput = ws.getCell(R, 12);
  themeInput.value = '예) 신규 거래처 확보에 집중!';
  themeInput.font = exFont;
  themeInput.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
  themeInput.alignment = { horizontal: 'left', vertical: 'middle' };
  themeInput.border = thinBorder;
  R++; // R=3

  ws.getRow(R).height = 6;
  R++; // R=4

  // ========== 행4: 목표 타이틀 ==========
  ws.mergeCells(R, 1, R, 15);
  const goalTitle = ws.getCell(R, 1);
  goalTitle.value = '🎯  이번 주 목표';
  goalTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  goalTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B5E20' } };
  goalTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  goalTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++; // R=5

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
  R++; // R=6

  const goalExamples = [
    { goal: '예) 신규 거래처 3곳 미팅 잡기', criteria: '예) 미팅 일정 확정 3건' },
    { goal: '예) 이번 주 공동구매 마감률 90%', criteria: '예) 미마감 상품 2개 이하' },
    { goal: '예) 주간 정산 자동화 시트 완성', criteria: '예) 데이터 넣으면 자동 계산됨' },
  ];
  for (let i = 0; i < 3; i++) {
    ws.mergeCells(R, 1, R, 2);
    const numCell = ws.getCell(R, 1);
    numCell.value = '목표 ' + (i + 1);
    numCell.font = { bold: true, size: 12, color: { argb: '1B5E20' } };
    numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
    numCell.alignment = { horizontal: 'center', vertical: 'middle' };
    numCell.border = thinBorder;

    ws.mergeCells(R, 3, R, 10);
    const gCell = ws.getCell(R, 3);
    gCell.value = goalExamples[i].goal;
    gCell.font = exFont;
    gCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    gCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    gCell.border = thinBorder;

    ws.mergeCells(R, 11, R, 13);
    const cCell = ws.getCell(R, 11);
    cCell.value = goalExamples[i].criteria;
    cCell.font = exFont;
    cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cCell.border = thinBorder;

    ws.mergeCells(R, 14, R, 15);
    const chk = ws.getCell(R, 14);
    chk.value = '☐';
    chk.font = { size: 16 };
    chk.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    chk.alignment = { horizontal: 'center', vertical: 'middle' };
    chk.border = thinBorder;
    ws.getRow(R).height = 28;
    R++;
  }
  // R=9
  ws.getRow(R).height = 6;
  R++; // R=10

  // ========== 일별 계획 ==========
  ws.mergeCells(R, 1, R, 15);
  const dayTitle = ws.getCell(R, 1);
  dayTitle.value = '📅  일별 계획';
  dayTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  dayTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D47A1' } };
  dayTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  dayTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++; // R=11 → 날짜행은 12가 되어야... 아 잠깐, 요일 헤더가 먼저

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const dayCols = [2, 4, 6, 8, 10, 12, 14];
  const dayFills = ['42A5F5', '42A5F5', '42A5F5', '42A5F5', '42A5F5', 'FF9800', 'EF5350'];
  const dayLightFills = ['E3F2FD', 'E3F2FD', 'E3F2FD', 'E3F2FD', 'E3F2FD', 'FFF3E0', 'FFEBEE'];

  // 요일 헤더 (R=11)
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
  R++; // R=12

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
    cell.font = exFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  ws.getRow(R).height = 24;
  R++; // R=13

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
  R++; // R=14

  // 할일 서브헤더
  ws.getCell(R, 1).value = '핵심 할일';
  ws.getCell(R, 1).font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '37474F' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  days.forEach((_, i) => {
    const th = ws.getCell(R, dayCols[i]);
    th.value = '할일';
    th.font = { bold: true, size: 9 };
    th.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayLightFills[i] } };
    th.alignment = { horizontal: 'center', vertical: 'middle' };
    th.border = thinBorder;
    const gh = ws.getCell(R, dayCols[i] + 1);
    gh.value = '①②③';
    gh.font = { bold: true, size: 8, color: { argb: '666666' } };
    gh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayLightFills[i] } };
    gh.alignment = { horizontal: 'center', vertical: 'middle' };
    gh.border = thinBorder;
  });
  ws.getRow(R).height = 22;
  R++; // R=15

  // 할일 3줄 (R=15,16,17)
  const todoExamples = [
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
      const tc = ws.getCell(R, dayCols[i]);
      const ex = todoExamples[t][i];
      tc.value = ex[0] || '';
      tc.font = ex[0] ? exFont : normalFont;
      tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      tc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      tc.border = thinBorder;
      const gc = ws.getCell(R, dayCols[i] + 1);
      gc.value = ex[1] || '';
      gc.font = ex[1] ? exFont : normalFont;
      gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
      gc.alignment = { horizontal: 'center', vertical: 'middle' };
      gc.border = thinBorder;
    });
    ws.getRow(R).height = 26;
    R++;
  }
  // R=18

  // 메모 행
  ws.getCell(R, 1).value = '📝 메모';
  ws.getCell(R, 1).font = { bold: true, size: 10 };
  ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFD8DC' } };
  ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(R, 1).border = thinBorder;
  const memoEx = ['예) A사 담당자 김부장', '', '', '', '', '', ''];
  days.forEach((_, i) => {
    ws.mergeCells(R, dayCols[i], R, dayCols[i] + 1);
    const cell = ws.getCell(R, dayCols[i]);
    cell.value = memoEx[i] || '';
    cell.font = memoEx[i] ? exFont : { size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });
  ws.getRow(R).height = 26;
  R++; // R=19

  ws.getRow(R).height = 6;
  R++; // R=20

  // ========== 프로젝트 ==========
  ws.mergeCells(R, 1, R, 15);
  const projTitle = ws.getCell(R, 1);
  projTitle.value = '🚀  핵심 프로젝트 진행';
  projTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  projTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BF360C' } };
  projTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  projTitle.border = thickBorder;
  ws.getRow(R).height = 32;
  R++; // R=21

  styleRange(R, 1, R, 15, { fill: 'FFAB91', font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: thinBorder });
  ws.getCell(R, 1).value = '#';
  ws.mergeCells(R, 2, R, 5); ws.getCell(R, 2).value = '프로젝트명';
  ws.mergeCells(R, 6, R, 10); ws.getCell(R, 6).value = '이번 주 할 것';
  ws.mergeCells(R, 11, R, 12); ws.getCell(R, 11).value = '진행상태';
  ws.mergeCells(R, 13, R, 15); ws.getCell(R, 13).value = '비고';
  ws.getRow(R).height = 26;
  R++; // R=22

  const projEx = [
    { n: '예) 슈파 공동구매 챗봇', t: '예) 주문관리 탭 완성', s: '🟡 진행중', note: '예) 카카오 연동 대기' },
    { n: '예) 주간 정산 자동화', t: '예) 구글 시트 양식 확정', s: '🔴 시작전', note: '' },
    { n: '', t: '', s: '', note: '' },
    { n: '', t: '', s: '', note: '' },
    { n: '', t: '', s: '', note: '' },
  ];
  for (let i = 0; i < 5; i++) {
    const p = projEx[i];
    ws.getCell(R, 1).value = i + 1;
    ws.getCell(R, 1).font = { bold: true, size: 11, color: { argb: 'BF360C' } };
    ws.getCell(R, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FBE9E7' } };
    ws.getCell(R, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(R, 1).border = thinBorder;

    ws.mergeCells(R, 2, R, 5);
    const nc = ws.getCell(R, 2); nc.value = p.n; nc.font = p.n ? exFont : normalFont;
    nc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    nc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; nc.border = thinBorder;

    ws.mergeCells(R, 6, R, 10);
    const tc = ws.getCell(R, 6); tc.value = p.t; tc.font = p.t ? exFont : normalFont;
    tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    tc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; tc.border = thinBorder;

    ws.mergeCells(R, 11, R, 12);
    const sc = ws.getCell(R, 11); sc.value = p.s; sc.font = p.s ? exFont : normalFont;
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } };
    sc.alignment = { horizontal: 'center', vertical: 'middle' }; sc.border = thinBorder;

    ws.mergeCells(R, 13, R, 15);
    const bc = ws.getCell(R, 13); bc.value = p.note; bc.font = p.note ? exFont : normalFont;
    bc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    bc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; bc.border = thinBorder;

    ws.getRow(R).height = 26;
    R++;
  }
  // R=27

  ws.getRow(R).height = 6;
  R++; // R=28

  // ========== 미팅 + 마감 ==========
  ws.mergeCells(R, 1, R, 8);
  const meetT = ws.getCell(R, 1);
  meetT.value = '🤝  주요 미팅 / 약속';
  meetT.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  meetT.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A148C' } };
  meetT.alignment = { horizontal: 'center', vertical: 'middle' };
  meetT.border = thickBorder;
  ws.mergeCells(R, 9, R, 15);
  const deadT = ws.getCell(R, 9);
  deadT.value = '⚠️  놓치면 안 되는 것 (마감)';
  deadT.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
  deadT.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B71C1C' } };
  deadT.alignment = { horizontal: 'center', vertical: 'middle' };
  deadT.border = thickBorder;
  ws.getRow(R).height = 30;
  R++; // R=29

  // 헤더
  [{c:1,t:'날짜',w:1},{c:2,t:'시간',w:1},{c:3,t:'대상',w:2},{c:5,t:'안건',w:3},{c:8,t:'비고',w:1}].forEach(h => {
    if (h.w > 1) ws.mergeCells(R, h.c, R, h.c + h.w - 1);
    const cell = ws.getCell(R, h.c);
    cell.value = h.t; cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CE93D8' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = thinBorder;
  });
  [{c:9,t:'마감일',w:1},{c:10,t:'내용',w:4},{c:14,t:'완료',w:2}].forEach(h => {
    if (h.w > 1) ws.mergeCells(R, h.c, R, h.c + h.w - 1);
    const cell = ws.getCell(R, h.c);
    cell.value = h.t; cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF9A9A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = thinBorder;
  });
  ws.getRow(R).height = 24;
  R++; // R=30

  const meetEx = [
    { d:'3/10', ti:'14:00', tg:'A사 김부장', ag:'신규 거래 조건 협의', n:'본사 방문' },
    { d:'3/12', ti:'10:00', tg:'팀 내부', ag:'주간 점검 회의', n:'' },
    { d:'', ti:'', tg:'', ag:'', n:'' },
    { d:'', ti:'', tg:'', ag:'', n:'' },
    { d:'', ti:'', tg:'', ag:'', n:'' },
  ];
  const deadEx = [
    { d:'3/14', c:'공동구매 3월 2차 마감' },
    { d:'3/15', c:'거래처 견적서 회신' },
    { d:'', c:'' },
    { d:'', c:'' },
    { d:'', c:'' },
  ];

  for (let i = 0; i < 5; i++) {
    const m = meetEx[i], de = deadEx[i];

    [{c:1,v:m.d},{c:2,v:m.ti}].forEach(x => {
      const cell = ws.getCell(R, x.c); cell.value = x.v;
      cell.font = x.v ? exFont : normalFont;
      cell.fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
      cell.alignment = {horizontal:'center',vertical:'middle'}; cell.border = thinBorder;
    });
    ws.mergeCells(R, 3, R, 4);
    const tgc = ws.getCell(R, 3); tgc.value = m.tg; tgc.font = m.tg ? exFont : normalFont;
    tgc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
    tgc.alignment={horizontal:'left',vertical:'middle'}; tgc.border=thinBorder;

    ws.mergeCells(R, 5, R, 7);
    const agc = ws.getCell(R, 5); agc.value = m.ag; agc.font = m.ag ? exFont : normalFont;
    agc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
    agc.alignment={horizontal:'left',vertical:'middle'}; agc.border=thinBorder;

    const nc = ws.getCell(R, 8); nc.value = m.n; nc.font = m.n ? exFont : normalFont;
    nc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
    nc.alignment={horizontal:'left',vertical:'middle'}; nc.border=thinBorder;

    const ddc = ws.getCell(R, 9); ddc.value = de.d; ddc.font = de.d ? exFont : normalFont;
    ddc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
    ddc.alignment={horizontal:'center',vertical:'middle'}; ddc.border=thinBorder;

    ws.mergeCells(R, 10, R, 13);
    const dcc = ws.getCell(R, 10); dcc.value = de.c; dcc.font = de.c ? exFont : normalFont;
    dcc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF'}};
    dcc.alignment={horizontal:'left',vertical:'middle'}; dcc.border=thinBorder;

    ws.mergeCells(R, 14, R, 15);
    const chk = ws.getCell(R, 14); chk.value = '☐'; chk.font = { size: 14 };
    chk.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF9C4'}};
    chk.alignment={horizontal:'center',vertical:'middle'}; chk.border=thinBorder;

    ws.getRow(R).height = 24;
    R++;
  }
  // R=35

  ws.getRow(R).height = 6;
  R++; // R=36

  // ========== 주간 회고 ==========
  ws.mergeCells(R, 1, R, 15);
  const revT = ws.getCell(R, 1);
  revT.value = '💭  주간 회고';
  revT.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  revT.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D40' } };
  revT.alignment = { horizontal: 'center', vertical: 'middle' };
  revT.border = thickBorder;
  ws.getRow(R).height = 32;
  R++; // R=37

  const revs = [
    { label: '✅  잘한 것', fill: 'B2DFDB', iFill: 'E0F2F1', ex: '예) 거래처 미팅 3건 모두 성사' },
    { label: '😅  아쉬운 것', fill: 'FFE082', iFill: 'FFF8E1', ex: '예) 정산 작업이 금요일로 밀림' },
    { label: '🔄  다음 주 개선점', fill: '90CAF9', iFill: 'E3F2FD', ex: '예) 정산은 수요일까지 끝내기' },
    { label: '📚  이번 주 배운 것', fill: 'F48FB1', iFill: 'FCE4EC', ex: '예) Apps Script로 자동 전송 가능' },
  ];

  revs.forEach(item => {
    ws.mergeCells(R, 1, R, 3);
    const lc = ws.getCell(R, 1);
    lc.value = item.label; lc.font = { bold: true, size: 12 };
    lc.fill = { type:'pattern',pattern:'solid',fgColor:{argb:item.fill}};
    lc.alignment = { horizontal: 'center', vertical: 'middle' }; lc.border = thinBorder;

    ws.mergeCells(R, 4, R, 15);
    const ic = ws.getCell(R, 4);
    ic.value = item.ex; ic.font = exFont;
    ic.fill = { type:'pattern',pattern:'solid',fgColor:{argb:item.iFill}};
    ic.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; ic.border = thinBorder;

    ws.getRow(R).height = 30;
    R++;
  });

  // 안내
  R++;
  ws.mergeCells(R, 1, R, 15);
  const guide = ws.getCell(R, 1);
  guide.value = '💡 컨디션: 💚좋음  🟡보통  🔴나쁨  |  목표 번호: ①②③  |  진행상태: 🔴시작전 → 🟡진행중 → 🟢완료  |  📋 메뉴 > 계획서 > 💾 저장하기';
  guide.font = { size: 9, color: { argb: '666666' } };
  guide.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(R).height = 22;

  // ===== 사용법 시트 =====
  const helpSheet = wb.addWorksheet('사용법');
  helpSheet.columns = [{ width: 80 }];

  const helpTexts = [
    ['📋 주간 계획서 — 사용법', { bold: true, size: 16 }],
    [''],
    ['1단계: 구글 드라이브에 업로드', { bold: true, size: 13 }],
    ['   • drive.google.com 접속'],
    ['   • "새로 만들기" → "파일 업로드" → 이 파일 선택'],
    ['   • 업로드된 파일 더블클릭 → "Google 스프레드시트로 열기"'],
    [''],
    ['2단계: Apps Script 붙여넣기 (저장 버튼 + 드롭다운)', { bold: true, size: 13 }],
    ['   • 구글 시트 상단 메뉴에서 "확장 프로그램" → "Apps Script" 클릭'],
    ['   • 기존 코드를 모두 지우고'],
    ['   • 바탕화면의 "주간계획서-Apps-Script.txt" 파일을 메모장으로 열어서'],
    ['   • 전체 복사(Ctrl+A → Ctrl+C) 후 Apps Script에 붙여넣기(Ctrl+V)'],
    ['   • 위쪽 💾 아이콘(저장) 클릭'],
    ['   • Apps Script 탭을 닫고 구글 시트로 돌아오기'],
    ['   • 시트를 새로고침(F5) → 상단에 "📋 계획서" 메뉴가 나타남!'],
    [''],
    ['3단계: 초기 설정 (최초 1회만)', { bold: true, size: 13 }],
    ['   • "📋 계획서" → "🔧 초기 설정 (최초 1회)" 클릭'],
    ['   • 승인 팝업이 뜨면 "확인" → 구글 로그인 → "허용" (아까 미식가의 주방과 같은 과정!)'],
    ['   • 한 번만 하면 드롭다운 + 도구 패널이 자동으로 설정됨'],
    [''],
    ['4단계: 사용하기', { bold: true, size: 13 }],
    ['   • 오른쪽에 📋 도구 패널이 자동으로 뜹니다!'],
    ['   • 💾 이번 주 저장하기 — 큰 초록 버튼 클릭'],
    ['   • 📄 새 주차 시작 — 파란 버튼 클릭'],
    ['   • 회색 예시 글씨를 지우고 본인 내용 작성'],
    ['   • 드롭다운 칸은 클릭하면 선택 목록이 뜸'],
    ['   • 저장하면 이번 주가 새 시트로 복사 + 다음 주 날짜 자동 채우기!'],
    ['   • 하단 시트 탭에서 지난 주 기록을 언제든 볼 수 있음!'],
    [''],
    ['💡 팁', { bold: true, size: 13 }],
    ['   • 도구 패널이 안 보이면: "📋 계획서" → "📌 도구 패널 열기"'],
    [''],
    ['📌 드롭다운 목록', { bold: true, size: 13 }],
    ['   • 컨디션: 💚좋음 / 🟡보통 / 🔴나쁨'],
    ['   • 목표 번호: ① / ② / ③'],
    ['   • 달성 여부: ☐미완 / ✅완료'],
    ['   • 진행상태: 🔴시작전 / 🟡진행중 / 🟢완료'],
    ['   • 마감 완료: ☐미완 / ✅완료'],
  ];

  helpTexts.forEach((item, i) => {
    const row = helpSheet.getRow(i + 1);
    const text = Array.isArray(item) ? item[0] : item;
    const style = Array.isArray(item) && item[1] ? item[1] : {};
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = { size: style.size || 11, bold: style.bold || false };
    cell.alignment = { vertical: 'middle', wrapText: true };
    row.height = text ? 22 : 10;
  });

  // ===== 드롭다운(데이터 유효성 검사) 직접 설정 =====

  // 컨디션 드롭다운 (행 13, 각 요일 병합 셀)
  const condList = ['"💚 좋음,🟡 보통,🔴 나쁨"'];
  dayCols.forEach(col => {
    ws.getCell(13, col).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: condList,
      showDropDown: false,
    };
  });

  // 목표 번호 드롭다운 (행 15~17, 각 요일의 목표열 = dayCols[i]+1)
  const goalNumList = ['"①,②,③"'];
  for (let r = 15; r <= 17; r++) {
    dayCols.forEach(col => {
      ws.getCell(r, col + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: goalNumList,
        showDropDown: false,
      };
    });
  }

  // 달성 여부 드롭다운 (행 6~8, 열 14)
  const checkList = ['"☐ 미완,✅ 완료"'];
  for (let r = 6; r <= 8; r++) {
    ws.getCell(r, 14).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: checkList,
      showDropDown: false,
    };
  }

  // 프로젝트 진행상태 드롭다운 (행 22~26, 열 11)
  const statusList = ['"🔴 시작전,🟡 진행중,🟢 완료"'];
  for (let r = 22; r <= 26; r++) {
    ws.getCell(r, 11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: statusList,
      showDropDown: false,
    };
  }

  // 마감 완료 드롭다운 (행 30~34, 열 14)
  for (let r = 30; r <= 34; r++) {
    ws.getCell(r, 14).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: checkList,
      showDropDown: false,
    };
  }

  console.log('드롭다운 설정 완료');

  // 저장
  const outputPath = 'C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서-최종판.xlsx';
  await wb.xlsx.writeFile(outputPath);
  console.log('완료: ' + outputPath);
}

generate().catch(console.error);
