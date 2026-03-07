/**
 * 미식가의 주방 — 주간 정산 스크립트 v2
 *
 * [설치 방법]
 * 1. 구글시트 → 확장 프로그램 → Apps Script
 * 2. 기존 코드 전부 삭제 → 이 코드 붙여넣기 → 저장
 * 3. 시트로 돌아오면 상단에 "🧮 정산" 메뉴 생김
 * 4. "🧮 정산" → "🔧 수식 초기화" 실행 (최초 1회)
 * 5. "주간 입력" 시트에 전송 버튼 만들기 (삽입→그림→스크립트 할당: submitData)
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
 */
function submitData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('주간 입력');
  const dataSheet = ss.getSheetByName('데이터');

  // 1. 입력값 읽기 — 숫자는 반드시 Number()로 변환
  const month = Number(formSheet.getRange(INPUT_CELLS.month).getValue());
  const week = Number(formSheet.getRange(INPUT_CELLS.week).getValue());
  const startDate = formSheet.getRange(INPUT_CELLS.startDate).getValue();
  const endDate = formSheet.getRange(INPUT_CELLS.endDate).getValue();
  const card = Number(formSheet.getRange(INPUT_CELLS.card).getValue()) || 0;
  const cash = Number(formSheet.getRange(INPUT_CELLS.cash).getValue()) || 0;
  const elec = Number(formSheet.getRange(INPUT_CELLS.elec).getValue()) || 0;
  const gas = Number(formSheet.getRange(INPUT_CELLS.gas).getValue()) || 0;
  const water = Number(formSheet.getRange(INPUT_CELLS.water).getValue()) || 0;
  const clean = Number(formSheet.getRange(INPUT_CELLS.clean).getValue()) || 0;
  const party = Number(formSheet.getRange(INPUT_CELLS.party).getValue()) || 0;
  const etc = Number(formSheet.getRange(INPUT_CELLS.etc).getValue()) || 0;
  const note = formSheet.getRange(INPUT_CELLS.note).getValue() || '';

  // 2. 필수값 검증
  if (!month || !week) {
    SpreadsheetApp.getUi().alert('⚠️ 월과 주차를 입력해주세요!');
    return;
  }
  if (!card && !cash) {
    SpreadsheetApp.getUi().alert('⚠️ 카드매출 또는 현금매출을 입력해주세요!');
    return;
  }

  // 3. 중복 체크
  const dataRange = dataSheet.getDataRange();
  const dataValues = dataRange.getValues();
  for (let i = 1; i < dataValues.length; i++) {
    if (Number(dataValues[i][0]) === month && Number(dataValues[i][1]) === week) {
      const ui = SpreadsheetApp.getUi();
      const confirm = ui.alert(
        '⚠️ 중복 확인',
        month + '월 ' + week + '주차 데이터가 이미 있습니다.\n덮어쓸까요?',
        ui.ButtonSet.YES_NO
      );
      if (confirm === ui.Button.YES) {
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
    card, cash,
    elec, gas, water,
    clean, party, etc,
    note,
    timestamp
  ];

  // 월/주차 순서대로 정렬된 위치에 삽입
  let insertRow = 2;
  for (let i = 1; i < dataValues.length; i++) {
    const existMonth = Number(dataValues[i][0]);
    const existWeek = Number(dataValues[i][1]);
    if (!existMonth) break;
    if (existMonth < month || (existMonth === month && existWeek < week)) {
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
    month + '월 ' + week + '주차 정산 데이터가 저장되었습니다.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * 정산 요약 시트의 수식을 구글시트 네이티브로 생성
 * — Excel→구글시트 변환으로 깨진 수식을 복구
 * — 메뉴에서 "🔧 수식 초기화" 클릭 (최초 1회만 실행하면 됨)
 */
function setupFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('정산 요약');
  if (!ws) {
    SpreadsheetApp.getUi().alert('❌ "정산 요약" 시트를 찾을 수 없습니다.');
    return;
  }

  // 데이터 시트 참조 범위
  const DA = "'데이터'!$A$2:$A$200";  // 월
  const DB = "'데이터'!$B$2:$B$200";  // 주차
  const DC = "'데이터'!$C$2:$C$200";  // 시작일
  const DD = "'데이터'!$D$2:$D$200";  // 종료일
  const DE = "'데이터'!$E$2:$E$200";  // 카드매출
  const DF = "'데이터'!$F$2:$F$200";  // 현금매출
  const DG = "'데이터'!$G$2:$G$200";  // 전기
  const DH = "'데이터'!$H$2:$H$200";  // 가스
  const DI = "'데이터'!$I$2:$I$200";  // 수도
  const DJ = "'데이터'!$J$2:$J$200";  // 정화조
  const DK = "'데이터'!$K$2:$K$200";  // 회식매출
  const DL = "'데이터'!$L$2:$L$200";  // 기타비용
  const DM = "'데이터'!$M$2:$M$200";  // 비고

  const subTotalRows = [];  // 월별 소계 행 번호 저장

  let row = 4;  // 데이터 시작 행 (1=타이틀, 2=설명, 3=헤더)

  for (let mn = 1; mn <= 12; mn++) {
    const firstRow = row;

    for (let wk = 1; wk <= 5; wk++) {
      const r = row;
      const cond = '(' + DA + '=' + mn + ')*(' + DB + '=' + wk + ')';

      // A, B: 월, 주차 (고정값)
      ws.getRange(r, 1).setValue(mn);
      ws.getRange(r, 2).setValue(wk);

      // C: 시작일
      ws.getRange(r, 3).setFormula('=IFERROR(SUMPRODUCT(' + cond + '*' + DC + '),"")');
      // D: 종료일
      ws.getRange(r, 4).setFormula('=IFERROR(SUMPRODUCT(' + cond + '*' + DD + '),"")');
      // E: 카드매출
      ws.getRange(r, 5).setFormula('=SUMPRODUCT(' + cond + '*' + DE + ')');
      // F: 현금매출
      ws.getRange(r, 6).setFormula('=SUMPRODUCT(' + cond + '*' + DF + ')');
      // G: 총매출
      ws.getRange(r, 7).setFormula('=IF(E' + r + '=0,"",E' + r + '+F' + r + ')');

      // H: 카드수수료 15%
      ws.getRange(r, 8).setFormula('=IF(E' + r + '=0,"",E' + r + '*0.15)');
      // I: 현금수수료 13%
      ws.getRange(r, 9).setFormula('=IF(E' + r + '=0,"",F' + r + '*0.13)');
      // J: 수수료합계
      ws.getRange(r, 10).setFormula('=IF(E' + r + '=0,"",H' + r + '+I' + r + ')');
      // K: 수수료 VAT
      ws.getRange(r, 11).setFormula('=IF(E' + r + '=0,"",J' + r + '*0.1)');

      // L: 임대료 (4주차에만 300만)
      ws.getRange(r, 12).setFormula('=IF(AND(E' + r + '<>0,B' + r + '=4),3000000,0)');
      // M: 임대료 VAT
      ws.getRange(r, 13).setFormula('=IF(L' + r + '=0,0,L' + r + '*0.1)');

      // N: 관리비+고정비 (4주차에만 120,900)
      ws.getRange(r, 14).setFormula('=IF(AND(E' + r + '<>0,B' + r + '=4),120900,0)');

      // O: 공과금 95%
      ws.getRange(r, 15).setFormula(
        '=(SUMPRODUCT(' + cond + '*' + DG + ')+SUMPRODUCT(' + cond + '*' + DH + ')+SUMPRODUCT(' + cond + '*' + DI + '))*0.95'
      );

      // P: 기타비용 (정화조 + 회식5% + 기타)
      ws.getRange(r, 16).setFormula(
        '=SUMPRODUCT(' + cond + '*' + DJ + ')+SUMPRODUCT(' + cond + '*' + DK + ')*0.05+SUMPRODUCT(' + cond + '*' + DL + ')'
      );

      // Q: 총 차감액
      ws.getRange(r, 17).setFormula('=IF(E' + r + '=0,"",J' + r + '+K' + r + '+L' + r + '+M' + r + '+N' + r + '+O' + r + '+P' + r + ')');

      // R: 미식가 카드지급
      ws.getRange(r, 18).setFormula('=IF(E' + r + '=0,"",E' + r + '-Q' + r + ')');

      // S: 현금 수령액
      ws.getRange(r, 19).setFormula('=IF(E' + r + '=0,"",F' + r + '-I' + r + '-I' + r + '*0.1)');

      // T: 비고
      ws.getRange(r, 20).setFormula('=IFERROR(INDEX(' + DM + ',MATCH(1,' + cond + ',0)),"")');

      row++;
    }

    // 월 소계 행
    const lastRow = row - 1;
    const sr = row;
    subTotalRows.push(sr);

    ws.getRange(sr, 1).setValue(mn + '월');
    ws.getRange(sr, 2).setValue('소계');

    // E~S 컬럼 합계
    const sumCols = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    sumCols.forEach(function(ci) {
      const col = String.fromCharCode(64 + ci);  // 5→E, 6→F ...
      ws.getRange(sr, ci).setFormula('=SUM(' + col + firstRow + ':' + col + lastRow + ')');
    });

    row++;
  }

  // 연간 합계 행
  const totalRow = row;
  ws.getRange(totalRow, 1).setValue('연간');
  ws.getRange(totalRow, 2).setValue('합계');

  const sumCols = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
  sumCols.forEach(function(ci) {
    const col = String.fromCharCode(64 + ci);
    const refs = subTotalRows.map(function(r) { return col + r; }).join('+');
    ws.getRange(totalRow, ci).setFormula('=' + refs);
  });

  // 대시보드 수식도 갱신
  setupDashboard_(ss, subTotalRows);

  SpreadsheetApp.getUi().alert(
    '✅ 수식 초기화 완료!',
    '정산 요약 + 대시보드 수식이 구글시트용으로 설정되었습니다.\n이제 데이터를 입력하면 자동 반영됩니다.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * 대시보드 수식 갱신 (setupFormulas에서 호출)
 */
function setupDashboard_(ss, subTotalRows) {
  const ws = ss.getSheetByName('대시보드');
  if (!ws) return;

  // 월별 정산 요약 테이블 (행 9~20, 열 B~M)
  // 정산 요약 시트의 소계 행에서 가져옴
  const srcCols = ['E','F','G','H','I','J','L','N','O','Q','R','S'];

  for (let mi = 0; mi < 12; mi++) {
    const r = 9 + mi;
    const srcRow = subTotalRows[mi];
    for (let ci = 0; ci < srcCols.length; ci++) {
      const col = srcCols[ci];
      ws.getRange(r, ci + 2).setFormula("='정산 요약'!" + col + srcRow);
    }
  }

  // 합계 행 (행 21)
  for (let ci = 2; ci <= 13; ci++) {
    const col = String.fromCharCode(64 + ci);
    ws.getRange(21, ci).setFormula('=SUM(' + col + '9:' + col + '20)');
  }
}

/**
 * 메뉴 추가 (시트 열 때 자동)
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧮 정산')
    .addItem('📤 전송', 'submitData')
    .addSeparator()
    .addItem('🔧 수식 초기화', 'setupFormulas')
    .addToUi();
}
