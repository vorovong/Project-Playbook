// ========================================
// 📋 팀 업무일지 — Apps Script (구글 시트 전용)
//
// 사용법:
// 1. 구글 시트를 새로 만든다 (sheets.new)
// 2. 확장 프로그램 > Apps Script 클릭
// 3. 이 코드 전체를 복사해서 붙여넣기
// 4. ▶ 실행 버튼 클릭 (함수: createWorklog)
// 5. 권한 승인 → 완료!
// ========================================

function createWorklog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 기존 시트 정리 (Sheet1 등)
  var sheets = ss.getSheets();

  // 설정
  var members = ['수빈', '승훈', '팀원3'];
  var memberCategories = {
    '수빈': ['회계/세무', '사업비 정산', '포인박 이관', '재생전술', '기타'],
    '승훈': ['슈파', '공존공간', '신도시/투자', '기획/전략', '기타'],
    '팀원3': ['업무1', '업무2', '업무3', '업무4', '기타']
  };
  var days = ['월', '화', '수', '목', '금'];
  var dayDates = ['3/24', '3/25', '3/26', '3/27', '3/28'];

  // ========================================
  // 시트 1: 📍 스케줄 보드
  // ========================================
  var sched = ss.insertSheet('📍 스케줄 보드', 0);
  sched.setColumnWidth(1, 100);
  for (var c = 2; c <= 6; c++) sched.setColumnWidth(c, 140);

  // 제목
  sched.getRange('A1:F1').merge()
    .setValue('📍  주간 스케줄 보드')
    .setFontSize(16).setFontWeight('bold').setFontColor('#FFFFFF')
    .setBackground('#1B2A4A')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sched.setRowHeight(1, 44);

  // 기간 정보
  sched.getRange('A2:B2').merge()
    .setValue('📅 3월 4주차')
    .setFontSize(11).setFontWeight('bold')
    .setBackground('#E3F2FD')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sched.getRange('C2:D2').merge()
    .setValue('3/24 ~ 3/28')
    .setFontSize(11)
    .setBackground('#FFF9C4')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sched.getRange('E2:F2').merge()
    .setValue('💡 외근/미팅 일정을 적어주세요')
    .setFontSize(9).setFontColor('#888888')
    .setBackground('#F5F5F5')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sched.setRowHeight(2, 28);

  // 간격
  sched.setRowHeight(3, 6);

  // 요일 헤더
  var headerRow = 4;
  sched.getRange(headerRow, 1).setValue('')
    .setBackground('#ECEFF1').setFontWeight('bold');
  var dayLabels = ['월요일', '화요일', '수요일', '목요일', '금요일'];
  for (var i = 0; i < 5; i++) {
    sched.getRange(headerRow, i + 2)
      .setValue(dayLabels[i])
      .setFontSize(11).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#1565C0')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  sched.setRowHeight(headerRow, 30);
  setBorders(sched, headerRow, 1, headerRow, 6, 'medium');

  // 날짜 행
  var dateRow = 5;
  sched.getRange(dateRow, 1).setValue('📆 날짜')
    .setFontSize(9).setFontWeight('bold')
    .setBackground('#CFD8DC')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  for (var i = 0; i < 5; i++) {
    sched.getRange(dateRow, i + 2)
      .setValue(dayDates[i])
      .setFontSize(9).setFontColor('#999999').setFontStyle('italic')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  sched.setRowHeight(dateRow, 22);
  setBorders(sched, dateRow, 1, dateRow, 6, 'thin');

  // 팀원별 스케줄
  var allMembers = ['대표(박승현)', '수빈', '승훈', '팀원3'];
  var schedExamples = {
    '대표(박승현)': ['14:00 수원시청', '', '사무실', '10:00 투자미팅', '사무실'],
    '수빈': ['사무실', '사무실', '사무실', '10:00 도시재단', '사무실'],
    '승훈': ['사무실', '외근(행궁동)', '사무실', '사무실', '사무실'],
    '팀원3': ['사무실', '사무실', '사무실', '사무실', '사무실']
  };
  var memberFills = ['#FFE0B2', '#E8F5E9', '#E3F2FD', '#F3E5F5'];

  for (var mi = 0; mi < allMembers.length; mi++) {
    var r = 6 + mi;
    var name = allMembers[mi];
    sched.getRange(r, 1).setValue(name)
      .setFontSize(10).setFontWeight('bold')
      .setBackground(memberFills[mi])
      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    var examples = schedExamples[name];
    for (var di = 0; di < 5; di++) {
      var cell = sched.getRange(r, di + 2);
      cell.setValue(examples[di] || '')
        .setFontSize(9).setFontColor('#999999').setFontStyle('italic')
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setWrap(true);
    }
    sched.setRowHeight(r, 36);
    setBorders(sched, r, 1, r, 6, 'thin');
  }

  // 안내
  sched.getRange('A11:F11').merge()
    .setValue('💡 "사무실"은 기본값. 외근/미팅/휴가 등 변경 사항만 적어주세요. 시간+장소 형태 권장 (예: 14:00 수원시청)')
    .setFontSize(9).setFontColor('#888888')
    .setHorizontalAlignment('center');

  // ========================================
  // 시트 2~4: 팀원별 업무일지
  // ========================================
  for (var mi = 0; mi < members.length; mi++) {
    var name = members[mi];
    var ws = ss.insertSheet(name, mi + 1);
    var cats = memberCategories[name];

    ws.setColumnWidth(1, 50);   // A: #
    ws.setColumnWidth(2, 220);  // B: 할 일
    ws.setColumnWidth(3, 400);  // C: 결과 (넓게)
    ws.setColumnWidth(4, 90);   // D: 상태

    var R = 1;

    // 제목
    ws.getRange(R, 1, 1, 4).merge()
      .setValue('📋  ' + name + ' — 주간 업무일지')
      .setFontSize(14).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#1B2A4A')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.setRowHeight(R, 38);
    setBorders(ws, R, 1, R, 4, 'medium');
    R++;

    // 기본 정보
    ws.getRange(R, 1).setValue('📅 주차')
      .setFontSize(10).setFontWeight('bold')
      .setBackground('#D1C4E9')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.getRange(R, 2).setValue('3월 4주차')
      .setFontSize(11)
      .setBackground('#FFF9C4')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.getRange(R, 3).setValue('3/24 ~ 3/28')
      .setFontSize(11)
      .setBackground('#FFF9C4')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.getRange(R, 4).setValue('')
      .setBackground('#F5F5F5');
    ws.setRowHeight(R, 26);
    setBorders(ws, R, 1, R, 4, 'thin');
    R++;

    // 간격
    ws.setRowHeight(R, 6);
    R++;

    // ===== 이번 주 업무 계획 =====
    ws.getRange(R, 1, 1, 4).merge()
      .setValue('📌  이번 주 업무 계획')
      .setFontSize(12).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#1B5E20')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.setRowHeight(R, 30);
    setBorders(ws, R, 1, R, 4, 'medium');
    R++;

    // 계획 헤더
    ws.getRange(R, 1).setValue('#')
      .setFontSize(10).setFontWeight('bold')
      .setBackground('#A5D6A7')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.getRange(R, 2, 1, 2).merge()
      .setValue('업무 내용')
      .setFontSize(10).setFontWeight('bold')
      .setBackground('#A5D6A7')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.getRange(R, 4).setValue('완료')
      .setFontSize(10).setFontWeight('bold')
      .setBackground('#A5D6A7')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.setRowHeight(R, 24);
    setBorders(ws, R, 1, R, 4, 'thin');
    R++;

    // 계획 항목 7줄
    var planExamples = [];
    if (name === '수빈') {
      planExamples = [
        '글로컬 전체 결과보고서 제출',
        '소상공인협업활성화 정보공시',
        '포토인더박스 사업이관 진행',
        '재생전술 예약 관리',
        '창고 물품 리스트 업데이트', '', ''
      ];
    }

    for (var i = 0; i < 7; i++) {
      ws.getRange(R, 1).setValue(i + 1)
        .setFontSize(10).setFontWeight('bold').setFontColor('#1B5E20')
        .setBackground('#E8F5E9')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 2, 1, 2).merge()
        .setValue(planExamples[i] || '')
        .setFontSize(planExamples[i] ? 9 : 10)
        .setFontColor(planExamples[i] ? '#999999' : '#000000')
        .setFontStyle(planExamples[i] ? 'italic' : 'normal')
        .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);

      // 드롭다운
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['☐ 미완', '🔄 진행중', '✅ 완료'], true)
        .setAllowInvalid(false).build();
      ws.getRange(R, 4).setValue('☐ 미완')
        .setFontSize(10)
        .setBackground('#FFF9C4')
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setDataValidation(rule);

      ws.setRowHeight(R, 26);
      setBorders(ws, R, 1, R, 4, 'thin');
      R++;
    }

    // 간격
    ws.setRowHeight(R, 6);
    R++;

    // ===== 일간 업무 =====
    ws.getRange(R, 1, 1, 4).merge()
      .setValue('📅  일간 업무')
      .setFontSize(12).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#0D47A1')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.setRowHeight(R, 30);
    setBorders(ws, R, 1, R, 4, 'medium');
    R++;

    // 수빈 예시 데이터
    var dailyExamples = {};
    if (name === '수빈') {
      dailyExamples = {
        '월': [
          ['결과보고서 제출', '제출 완료', '✅ 완료'],
          ['수원세무서 주질검사 소통', '전화 완료, 서류 메일 발송', '✅ 완료'],
          ['ESG경영지원센터 기사수정', '초안 작성 중', '🔄 진행중']
        ],
        '화': [
          ['증빙보완 취합', '취합 완료, 결과보고서 검수 중', '🔄 진행중'],
          ['양수도계약서 작성', '', ''],
          ['효와복 인스타 업로드', '', '']
        ]
      };
    }

    var dailyRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['🔄 진행중', '✅ 완료', '⏸ 보류'], true)
      .setAllowInvalid(false).build();

    // 각 요일별 블록
    for (var di = 0; di < 5; di++) {
      var day = days[di];

      // 요일 헤더
      ws.getRange(R, 1, 1, 4).merge()
        .setValue(day + '요일 (' + dayDates[di] + ')')
        .setFontSize(11).setFontWeight('bold').setFontColor('#FFFFFF')
        .setBackground('#1565C0')
        .setHorizontalAlignment('left').setVerticalAlignment('middle');
      ws.setRowHeight(R, 26);
      setBorders(ws, R, 1, R, 4, 'medium');
      R++;

      // 서브 헤더: # | 🌅 오늘 할 일 | 📝 결과 | 상태
      ws.getRange(R, 1).setValue('#')
        .setFontSize(9).setFontWeight('bold')
        .setBackground('#BBDEFB')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 2).setValue('🌅 오늘 할 일 (아침)')
        .setFontSize(9).setFontWeight('bold')
        .setBackground('#BBDEFB')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 3).setValue('📝 결과 (퇴근 전)')
        .setFontSize(9).setFontWeight('bold')
        .setBackground('#BBDEFB')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 4).setValue('상태')
        .setFontSize(9).setFontWeight('bold')
        .setBackground('#BBDEFB')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.setRowHeight(R, 22);
      setBorders(ws, R, 1, R, 4, 'thin');
      R++;

      // 할 일 5줄
      var examples = dailyExamples[day] || [];
      for (var ti = 0; ti < 5; ti++) {
        var ex = examples[ti] || null;

        ws.getRange(R, 1).setValue(ti + 1)
          .setFontSize(9).setFontColor('#1565C0')
          .setBackground('#E3F2FD')
          .setHorizontalAlignment('center').setVerticalAlignment('middle');
        ws.getRange(R, 2).setValue(ex ? ex[0] : '')
          .setFontSize(ex ? 9 : 10)
          .setFontColor(ex ? '#999999' : '#000000')
          .setFontStyle(ex ? 'italic' : 'normal')
          .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
        ws.getRange(R, 3).setValue(ex ? ex[1] : '')
          .setFontSize(ex ? 9 : 10)
          .setFontColor(ex ? '#999999' : '#000000')
          .setFontStyle(ex ? 'italic' : 'normal')
          .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
        ws.getRange(R, 4).setValue(ex ? ex[2] : '')
          .setFontSize(10)
          .setBackground('#FFF9C4')
          .setHorizontalAlignment('center').setVerticalAlignment('middle')
          .setDataValidation(dailyRule);

        ws.setRowHeight(R, 40);
        setBorders(ws, R, 1, R, 4, 'thin');
        R++;
      }

      // 💬 소통 행
      ws.getRange(R, 1).setValue('💬')
        .setFontSize(10)
        .setBackground('#F3E5F5')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 2, 1, 3).merge()
        .setValue('')
        .setBackground('#F3E5F5')
        .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
      ws.setRowHeight(R, 24);
      setBorders(ws, R, 1, R, 4, 'thin');
      R++;

      // 요일 간 간격
      ws.setRowHeight(R, 4);
      R++;
    }

    // ===== 주간 회고 =====
    ws.setRowHeight(R, 6);
    R++;

    ws.getRange(R, 1, 1, 4).merge()
      .setValue('💭  주간 회고 (금요일에 작성)')
      .setFontSize(12).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#004D40')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    ws.setRowHeight(R, 30);
    setBorders(ws, R, 1, R, 4, 'medium');
    R++;

    var revItems = [
      { label: '✅ 잘한 것', fill: '#B2DFDB', iFill: '#E0F2F1' },
      { label: '😅 아쉬운 것', fill: '#FFE082', iFill: '#FFF8E1' },
      { label: '📋 다음 주 중점', fill: '#90CAF9', iFill: '#E3F2FD' }
    ];

    for (var ri = 0; ri < revItems.length; ri++) {
      var item = revItems[ri];
      ws.getRange(R, 1).setValue(item.label)
        .setFontSize(10).setFontWeight('bold')
        .setBackground(item.fill)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      ws.getRange(R, 2, 1, 3).merge()
        .setValue('')
        .setBackground(item.iFill)
        .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
      ws.setRowHeight(R, 32);
      setBorders(ws, R, 1, R, 4, 'thin');
      R++;
    }
  }

  // ========================================
  // 시트 5: 📊 대표 대시보드
  // ========================================
  var dash = ss.insertSheet('📊 대표 대시보드', members.length + 1);
  dash.setColumnWidth(1, 100);
  dash.setColumnWidth(2, 90);
  dash.setColumnWidth(3, 440);

  var R = 1;
  dash.getRange(R, 1, 1, 3).merge()
    .setValue('📊  주간 요약 — 대표 대시보드')
    .setFontSize(14).setFontWeight('bold').setFontColor('#FFFFFF')
    .setBackground('#1B2A4A')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(R, 38);
  setBorders(dash, R, 1, R, 3, 'medium');
  R++;

  dash.getRange(R, 1, 1, 3).merge()
    .setValue('3월 4주차 (3/24 ~ 3/28)')
    .setFontSize(11).setFontWeight('bold')
    .setBackground('#E3F2FD')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(R, 28);
  setBorders(dash, R, 1, R, 3, 'thin');
  R++;

  dash.setRowHeight(R, 6);
  R++;

  var statusLabels = [
    { label: '✅ 완료', fill: '#C8E6C9' },
    { label: '🔄 진행중', fill: '#FFF9C4' },
    { label: '📋 주요 소통', fill: '#E1BEE7' },
    { label: '📌 다음 주', fill: '#BBDEFB' }
  ];
  var dashFills = ['#E8F5E9', '#E3F2FD', '#F3E5F5'];

  for (var mi = 0; mi < members.length; mi++) {
    dash.getRange(R, 1, 1, 3).merge()
      .setValue('👤  ' + members[mi])
      .setFontSize(11).setFontWeight('bold').setFontColor('#FFFFFF')
      .setBackground('#37474F')
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    dash.setRowHeight(R, 28);
    setBorders(dash, R, 1, R, 3, 'medium');
    R++;

    for (var si = 0; si < statusLabels.length; si++) {
      var sl = statusLabels[si];
      dash.getRange(R, 1).setValue('')
        .setBackground(dashFills[mi]);
      dash.getRange(R, 2).setValue(sl.label)
        .setFontSize(9).setFontWeight('bold')
        .setBackground(sl.fill)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      dash.getRange(R, 3).setValue('')
        .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
      dash.setRowHeight(R, 28);
      setBorders(dash, R, 1, R, 3, 'thin');
      R++;
    }

    dash.setRowHeight(R, 6);
    R++;
  }

  dash.getRange(R, 1, 1, 3).merge()
    .setValue('💡 v1: 수동 작성. v2에서 팀원 시트에서 자동 수집 예정')
    .setFontSize(9).setFontColor('#888888')
    .setHorizontalAlignment('center');

  // ========================================
  // 시트 6: 사용법
  // ========================================
  var help = ss.insertSheet('사용법', members.length + 2);
  help.setColumnWidth(1, 700);

  var helpTexts = [
    ['📋 팀 업무일지 — 사용법', 16, true],
    ['', 11, false],
    ['1단계: 매일 사용하기', 13, true],
    ['   • 자기 이름 탭(시트)을 클릭', 11, false],
    ['   • 월요일 아침: "이번 주 업무 계획" 작성', 11, false],
    ['   • 매일 퇴근 전: 해당 요일의 "진행 기록"에 오늘 한 일 작성', 11, false],
    ['   • 금요일: "주간 회고" 작성', 11, false],
    ['', 11, false],
    ['2단계: 스케줄 공유', 13, true],
    ['   • "📍 스케줄 보드" 탭에 외근/미팅 일정 입력', 11, false],
    ['   • 기본은 "사무실" — 변경 사항만 적으면 됨', 11, false],
    ['   • 팀 전원이 한눈에 확인 가능', 11, false],
    ['', 11, false],
    ['3단계: 주간 마무리', 13, true],
    ['   • 대표님: "📊 대표 대시보드"에서 전체 팀원 주간 요약 확인', 11, false],
    ['   • 업무일지 메뉴 > "새 주차 시작"으로 다음 주 초기화', 11, false],
    ['   • 업무일지 메뉴 > "이번 주 보관"으로 이번 주 백업', 11, false],
    ['', 11, false],
    ['💡 팁', 13, true],
    ['   • 핸드폰에서 구글 시트 앱으로 "📍 스케줄 보드"를 즐겨찾기 해두세요', 11, false],
    ['   • 카테고리(회계/세무, 재생전술 등)는 사람마다 다르게 설정 가능', 11, false],
    ['   • 팀원 추가 시: 시트를 복사해서 이름만 바꾸면 됨', 11, false]
  ];

  for (var i = 0; i < helpTexts.length; i++) {
    var item = helpTexts[i];
    var cell = help.getRange(i + 1, 1);
    cell.setValue(item[0])
      .setFontSize(item[1])
      .setFontWeight(item[2] ? 'bold' : 'normal')
      .setVerticalAlignment('middle').setWrap(true);
    help.setRowHeight(i + 1, item[0] ? 24 : 12);
  }

  // 기존 Sheet1 삭제
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name === 'Sheet1' || name === '시트1') {
      ss.deleteSheet(sheets[i]);
    }
  }

  // 스프레드시트 이름 변경
  ss.rename('📋 팀 업무일지 — 3월 4주차');

  // 첫 시트로 이동
  ss.setActiveSheet(sched);

  SpreadsheetApp.getUi().alert(
    '✅ 팀 업무일지 생성 완료!\n\n' +
    '시트 구성:\n' +
    '📍 스케줄 보드 — 팀 일정 공유\n' +
    '📋 수빈/승훈/팀원3 — 개인 업무일지\n' +
    '📊 대표 대시보드 — 주간 요약\n' +
    '📖 사용법\n\n' +
    '업무일지 메뉴가 추가되었습니다!'
  );
}

// ========================================
// 테두리 헬퍼
// ========================================
function setBorders(sheet, startRow, startCol, endRow, endCol, weight) {
  var border = weight === 'medium' ? SpreadsheetApp.BorderStyle.SOLID_MEDIUM : SpreadsheetApp.BorderStyle.SOLID;
  sheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1)
    .setBorder(true, true, true, true, true, true, '#333333', border);
}

// ========================================
// 메뉴 + 운영 기능
// ========================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('업무일지')
    .addItem('새 주차 시작', 'newWeek')
    .addItem('이번 주 보관', 'archiveWeek')
    .addToUi();
}

function fmtDate(d) {
  return (d.getMonth() + 1) + '/' + d.getDate();
}

function newWeek() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '새 주차 시작',
    '모든 팀원 시트의 진행 기록과 스케줄을 초기화합니다.\n업무 계획은 유지됩니다.\n\n저장하지 않은 내용은 사라집니다. 계속할까요?',
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
  var weekLabel = nextMonth + '월 ' + weekOfMonth + '주차';

  var nextFri = new Date(nextMon);
  nextFri.setDate(nextMon.getDate() + 4);
  var period = fmtDate(nextMon) + ' ~ ' + fmtDate(nextFri);

  var dayDates = [];
  for (var i = 0; i < 5; i++) {
    var d = new Date(nextMon);
    d.setDate(nextMon.getDate() + i);
    dayDates.push(fmtDate(d));
  }

  // 스케줄 보드 업데이트
  var schedSheet = ss.getSheetByName('📍 스케줄 보드');
  if (schedSheet) {
    schedSheet.getRange('A2:B2').setValue('📅 ' + weekLabel);
    schedSheet.getRange('C2:D2').setValue(period);
    // 날짜 행
    for (var i = 0; i < 5; i++) {
      schedSheet.getRange(5, i + 2).setValue(dayDates[i]);
    }
    // 스케줄 내용 초기화
    for (var r = 6; r <= 9; r++) {
      for (var c = 2; c <= 6; c++) {
        schedSheet.getRange(r, c).setValue('사무실')
          .setFontColor('#999999').setFontStyle('italic');
      }
    }
  }

  // 팀원 시트 초기화
  var skipSheets = ['📍 스케줄 보드', '📊 대표 대시보드', '사용법'];
  var memberSheets = ss.getSheets().filter(function(s) {
    return skipSheets.indexOf(s.getName()) === -1;
  });

  var days = ['월', '화', '수', '목', '금'];

  memberSheets.forEach(function(sheet) {
    // 주차 정보 업데이트
    sheet.getRange(2, 2).setValue(weekLabel);
    sheet.getRange(2, 3).setValue(period);

    // 요일 헤더 날짜 업데이트 + 일간 기록 내용 초기화
    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      var val = sheet.getRange(r, 1).getValue();
      if (typeof val === 'string') {
        // 요일 헤더 찾아서 날짜 업데이트
        for (var di = 0; di < 5; di++) {
          if (val.indexOf(days[di] + '요일') === 0) {
            sheet.getRange(r, 1, 1, 4).setValue(days[di] + '요일 (' + dayDates[di] + ')');
          }
        }
      }
      // 일간 기록 영역 (카테고리 옆 내용 칸) 비우기
      var cellB = sheet.getRange(r, 2).getValue();
      if (typeof cellB === 'string' && cellB.length > 0 &&
          cellB.indexOf('업무 내용') === -1 && cellB.indexOf('완료') === -1 &&
          cellB.indexOf('주차') === -1) {
        // 카테고리 행의 C열(내용)만 비움 — 일간 기록 영역
        var cellA = sheet.getRange(r, 1).getValue();
        if (cellA === '' || cellA === null) {
          sheet.getRange(r, 3).setValue('');
        }
      }
    }

    // 업무 계획 완료 상태 초기화
    for (var r = 6; r <= 12; r++) {
      var cellD = sheet.getRange(r, 4);
      if (cellD.getValue() !== '') {
        cellD.setValue('☐ 미완');
      }
    }
  });

  // 스프레드시트 이름 업데이트
  ss.rename('📋 팀 업무일지 — ' + weekLabel);

  ui.alert('✅ ' + weekLabel + '로 시작합니다!\n기간: ' + period);
}

function archiveWeek() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schedSheet = ss.getSheetByName('📍 스케줄 보드');
  var period = schedSheet ? schedSheet.getRange('A2:B2').getValue() : '주차정보없음';

  var copyName = period.replace('📅 ', '') + ' (보관)';
  ss.copy(copyName);

  SpreadsheetApp.getUi().alert(
    '✅ 보관 완료!\n\n' +
    '"' + copyName + '" 파일로 저장했습니다.\n' +
    '구글 드라이브에서 확인하세요.'
  );
}
