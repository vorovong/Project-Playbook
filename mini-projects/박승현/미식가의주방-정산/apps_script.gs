/**
 * 미식가의 주방 — 주간 정산 전송 스크립트
 *
 * [설치 방법]
 * 1. 구글시트 열기
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 코드를 붙여넣기 → 저장
 * 4. "주간 입력" 시트의 전송 버튼 셀을 선택
 * 5. 삽입 → 그림 → 버튼 모양 그리기 → 스크립트 할당: submitData
 */

// === 입력 셀 위치 (시트1 "주간 입력") ===
const INPUT_CELLS = {
  month:    'C5',
  week:     'C6',
  startDate:'C7',
  endDate:  'C8',
  card:     'C11',
  cash:     'C12',
  elec:     'C15',
  gas:      'C16',
  water:    'C17',
  clean:    'C21',
  party:    'C22',
  etc:      'C23',
  note:     'C24'
};

/**
 * 전송 버튼 클릭 시 실행
 * 1. 입력값 검증
 * 2. 데이터 시트에 한 줄 추가
 * 3. 입력 폼 초기화
 */
function submitData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('주간 입력');
  const dataSheet = ss.getSheetByName('데이터');

  // 1. 입력값 읽기
  const month = formSheet.getRange(INPUT_CELLS.month).getValue();
  const week = formSheet.getRange(INPUT_CELLS.week).getValue();
  const startDate = formSheet.getRange(INPUT_CELLS.startDate).getValue();
  const endDate = formSheet.getRange(INPUT_CELLS.endDate).getValue();
  const card = formSheet.getRange(INPUT_CELLS.card).getValue();
  const cash = formSheet.getRange(INPUT_CELLS.cash).getValue();
  const elec = formSheet.getRange(INPUT_CELLS.elec).getValue();
  const gas = formSheet.getRange(INPUT_CELLS.gas).getValue();
  const water = formSheet.getRange(INPUT_CELLS.water).getValue();
  const clean = formSheet.getRange(INPUT_CELLS.clean).getValue();
  const party = formSheet.getRange(INPUT_CELLS.party).getValue();
  const etc = formSheet.getRange(INPUT_CELLS.etc).getValue();
  const note = formSheet.getRange(INPUT_CELLS.note).getValue();

  // 2. 필수값 검증
  if (!month || !week) {
    SpreadsheetApp.getUi().alert('⚠️ 월과 주차를 입력해주세요!');
    return;
  }
  if (!card && !cash) {
    SpreadsheetApp.getUi().alert('⚠️ 카드매출 또는 현금매출을 입력해주세요!');
    return;
  }

  // 3. 중복 체크 (같은 월/주차가 이미 있는지)
  const dataRange = dataSheet.getDataRange();
  const dataValues = dataRange.getValues();
  for (let i = 1; i < dataValues.length; i++) {
    if (dataValues[i][0] == month && dataValues[i][1] == week) {
      const confirm = SpreadsheetApp.getUi().alert(
        '⚠️ 중복 확인',
        `${month}월 ${week}주차 데이터가 이미 있습니다.\n덮어쓸까요?`,
        SpreadsheetApp.getUi().ButtonSet.YES_NO
      );
      if (confirm === SpreadsheetApp.getUi().Button.YES) {
        // 기존 행 삭제
        dataSheet.deleteRow(i + 1);
      } else {
        return;
      }
      break;
    }
  }

  // 4. 데이터 시트에 추가
  const now = new Date();
  const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

  const newRow = [
    month, week, startDate, endDate,
    card || 0, cash || 0,
    elec || '', gas || '', water || '',
    clean || '', party || '', etc || '',
    note || '',
    timestamp
  ];

  // 월/주차 순서대로 정렬된 위치에 삽입
  let insertRow = 2; // 기본: 헤더 바로 아래
  for (let i = 1; i < dataValues.length; i++) {
    const existMonth = dataValues[i][0];
    const existWeek = dataValues[i][1];
    if (!existMonth) break;
    if (existMonth < month || (existMonth == month && existWeek < week)) {
      insertRow = i + 2;
    } else {
      break;
    }
  }

  dataSheet.insertRowAfter(insertRow - 1);
  const range = dataSheet.getRange(insertRow, 1, 1, newRow.length);
  range.setValues([newRow]);

  // 숫자 형식 적용
  dataSheet.getRange(insertRow, 5, 1, 2).setNumberFormat('#,##0');
  dataSheet.getRange(insertRow, 7, 1, 3).setNumberFormat('#,##0');

  // 5. 입력 폼 초기화
  const clearCells = [
    INPUT_CELLS.month, INPUT_CELLS.week,
    INPUT_CELLS.startDate, INPUT_CELLS.endDate,
    INPUT_CELLS.card, INPUT_CELLS.cash,
    INPUT_CELLS.elec, INPUT_CELLS.gas, INPUT_CELLS.water,
    INPUT_CELLS.clean, INPUT_CELLS.party, INPUT_CELLS.etc,
    INPUT_CELLS.note
  ];
  clearCells.forEach(cell => formSheet.getRange(cell).clearContent());

  // 6. 완료 메시지
  SpreadsheetApp.getUi().alert(
    '✅ 전송 완료!',
    `${month}월 ${week}주차 정산 데이터가 저장되었습니다.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * 메뉴 추가 (시트 열 때 자동)
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧮 정산')
    .addItem('📤 전송', 'submitData')
    .addToUi();
}
