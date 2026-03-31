// ============================================
// okpos-sales.js — OKPOS 미식가의 주방 매출 자동 수집
// 주간정산 / 현금매출결산 / 월별 대시보드 데이터 추출
// ============================================
require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

const OKPOS_ID = process.env.OKPOS_ID;
const OKPOS_PW = process.env.OKPOS_PW;
const API_KEY = process.env.NOTION_API_KEY;
const SALES_DB = process.env.NOTION_SALES_DB;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

const YOIL_MAP = { '1': '일', '2': '월', '3': '화', '4': '수', '5': '목', '6': '금', '7': '토' };

// ── 로그인 ──
async function loginOkpos() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('https://kis.okpos.co.kr/login/login_form.jsp', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('#user_id', OKPOS_ID);
  await page.type('#user_pwd', OKPOS_PW);
  await page.evaluate(() => doSubmit());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  // 팝업 제거
  const topFrame = page.frames().find(f => f.url().includes('top_frame'));
  await topFrame.evaluate(() => {
    for (let i = 0; i < 10; i++) {
      const p = document.getElementById('divPopupLayer' + i);
      if (p) p.remove();
    }
  }).catch(() => {});

  return { browser, page, topFrame };
}

// ── 메뉴 네비게이션 ──
async function navigateTo(page, topFrame, pageCode) {
  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate((code) => jumpPAGE(code), pageCode);
  await new Promise(r => setTimeout(r, 4000));

  return page.frames().find(f => f.name() === 'MainFrm');
}

// ── IBSheet 데이터 추출 (인덱스 기반, 서브헤더 지원) ──
async function extractSheetData(frame, sheetName = 'mySheet1') {
  return await frame.evaluate((name) => {
    const sheet = window[name];
    if (!sheet) return null;

    // 1행(서브헤더)에서 실제 컬럼명 추출 (0행은 상위 카테고리)
    const colCount = 30;
    const subHeaders = [];
    for (let c = 0; c < colCount; c++) {
      try {
        const val = sheet.GetCellValue(1, c);
        subHeaders.push(val != null ? String(val) : `col${c}`);
      } catch(e) { break; }
    }

    // 서브헤더가 컬럼명과 같으면(=서브헤더가 없는 시트) 0행 사용
    const isSubHeader = subHeaders.some(h => ['총매출', '실매출', '총할인', '단순현금'].includes(h));
    const dataStartRow = isSubHeader ? 2 : 1;

    const cols = isSubHeader ? subHeaders : [];
    if (!isSubHeader) {
      for (let c = 0; c < colCount; c++) {
        try {
          const val = sheet.GetCellValue(0, c);
          cols.push(val != null ? String(val) : `col${c}`);
        } catch(e) { break; }
      }
    }

    // 데이터 추출
    const rows = [];
    try {
      const rowCount = sheet.RowCount();
      for (let r = dataStartRow; r <= rowCount; r++) {
        const row = {};
        for (let c = 0; c < cols.length; c++) {
          try { row[cols[c]] = sheet.GetCellValue(r, c); } catch(e) {}
        }
        rows.push(row);
      }
    } catch(e) {}

    return { cols, rows };
  }, sheetName);
}

// ── 하위 프레임 찾기 (day_total010.jsp 등) ──
function findContentFrame(page) {
  // MainFrm의 하위 프레임에서 실제 컨텐츠 프레임 찾기
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  if (!mainFrame) return null;
  const children = mainFrame.childFrames();
  if (children.length > 0) return children[0]; // 탭 내부 프레임
  return mainFrame;
}

// ── 1. 일자별 매출 조회 (주간/월간) ──
async function fetchDailySales(page, topFrame, startDate, endDate) {
  console.log(`일자별 매출 조회: ${startDate} ~ ${endDate}`);
  await navigateTo(page, topFrame, '000199');

  const contentFrame = findContentFrame(page);
  if (!contentFrame) throw new Error('컨텐츠 프레임을 찾을 수 없음');
  console.log('  프레임:', contentFrame.url());

  // 날짜 설정 (date1_1, date1_2)
  await contentFrame.evaluate((start, end) => {
    document.getElementById('date1_1').value = start;
    document.getElementById('date1_2').value = end;
  }, startDate, endDate);
  await new Promise(r => setTimeout(r, 500));

  // 조회 버튼 클릭
  await contentFrame.evaluate(() => {
    if (typeof fnSearch === 'function') fnSearch();
    else {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(el => el.innerText?.includes('조회'));
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 5000));

  // IBSheet 데이터 추출
  const sheetData = await extractSheetData(contentFrame);
  if (sheetData && sheetData.rows.length > 0) {
    console.log(`  ${sheetData.rows.length}일 데이터 추출`);
    console.log('  컬럼:', sheetData.cols.join(', '));
    return sheetData;
  }

  // IBSheet 실패 시 테이블에서 직접 추출
  console.log('  IBSheet 실패, 테이블에서 추출 시도...');
  const tableData = await contentFrame.evaluate(() => {
    const headerCells = document.querySelectorAll('.GridHeader td, .GridHeader th, [class*="Header"] td');
    const headers = Array.from(headerCells).map(c => c.innerText.trim()).filter(h => h);

    const dataCells = document.querySelectorAll('.GridData td, [class*="Data"] td');
    const rows = [];
    let currentRow = [];
    dataCells.forEach(cell => {
      currentRow.push(cell.innerText.trim());
      if (currentRow.length === headers.length) {
        rows.push([...currentRow]);
        currentRow = [];
      }
    });

    return { headers, rows };
  });

  return tableData;
}

// ── 2. 당일매출상세 조회 (결제수단별) ──
async function fetchDailyDetail(page, topFrame, date) {
  console.log(`당일매출상세 조회: ${date}`);
  await navigateTo(page, topFrame, '000183');

  // 당일매출상세는 MainFrm 직접 (하위 탭 없음)
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');

  // 날짜 필드 찾기
  const inputs = await mainFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).filter(el => el.type !== 'hidden')
      .map(el => ({ id: el.id, name: el.name, value: el.value }));
  });
  console.log('  필드:', JSON.stringify(inputs));

  // 날짜 설정
  await mainFrame.evaluate((d) => {
    const dateInput = document.getElementById('date1') || document.getElementById('sale_date')
      || document.querySelector('input[id*="date"]');
    if (dateInput) dateInput.value = d;
  }, date);
  await new Promise(r => setTimeout(r, 500));

  // 조회
  await mainFrame.evaluate(() => {
    if (typeof fnSearch === 'function') fnSearch();
    else {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(el => el.innerText?.includes('조회'));
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 5000));

  // IBSheet에서 결제수단별 합계 추출
  const summary = await mainFrame.evaluate(() => {
    const sheets = ['mySheet1', 'mySheet', 'Sheet1'];
    for (const name of sheets) {
      const sheet = window[name];
      if (!sheet) continue;
      try {
        const cols = [];
        const colCount = sheet.ColCount();
        for (let c = 0; c < colCount; c++) cols.push(sheet.GetSaveName(c));

        const rows = [];
        const rowCount = sheet.RowCount();
        for (let r = 1; r <= rowCount; r++) {
          const row = {};
          cols.forEach(col => {
            try { row[col] = sheet.GetCellValue(r, col); } catch(e) {}
          });
          rows.push(row);
        }
        return { cols, rows };
      } catch(e) {}
    }
    return { rawText: document.body?.innerText?.slice(0, 2000) };
  });

  return summary;
}

// ── 노션 저장 ──
async function queryNotionSales(date) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${SALES_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: '일자', title: { equals: date } }
    })
  });
  const data = await resp.json();
  return (data.results || []).length > 0;
}

async function addToNotion(row) {
  const date = `${row['일자'].slice(0,4)}-${row['일자'].slice(4,6)}-${row['일자'].slice(6,8)}`;
  const yoil = YOIL_MAP[row['요일']] || row['요일'];

  const resp = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: SALES_DB },
      properties: {
        '일자': { title: [{ text: { content: date } }] },
        '요일': { select: { name: yoil } },
        '총매출': { number: row['총매출'] || 0 },
        '총할인': { number: row['총할인'] || 0 },
        '실매출': { number: row['실매출'] || 0 },
        '가액': { number: row['가액'] || 0 },
        '부가세': { number: row['부가세'] || 0 },
        '영수건수': { number: row['영수건수'] || 0 },
        '고객수': { number: row['고객수'] || 0 },
        '결제합계': { number: row['결제합계'] || 0 },
        '단순현금': { number: row['단순현금'] || 0 },
        '현금영수': { number: row['현금영수'] || 0 },
        '신용카드': { number: row['신용카드'] || 0 },
        '외상': { number: row['외상'] || 0 },
        '상품권': { number: row['상품권'] || 0 },
        '식권': { number: row['식권'] || 0 },
        '회원포인트': { number: row['회원포인트'] || 0 },
      }
    })
  });
  return resp.json();
}

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
  });
}

async function saveToNotion(data) {
  if (!data || !data.rows || data.rows.length === 0) {
    console.log('  저장할 데이터 없음');
    return 0;
  }

  let newCount = 0;
  let totalSales = 0;

  for (const row of data.rows) {
    if (!row['일자'] || row['일자'].length !== 8) continue;
    const date = `${row['일자'].slice(0,4)}-${row['일자'].slice(4,6)}-${row['일자'].slice(6,8)}`;

    const exists = await queryNotionSales(date);
    if (exists) {
      console.log(`  ⏭️  ${date} — 이미 등록됨`);
      continue;
    }

    await addToNotion(row);
    newCount++;
    totalSales += row['실매출'] || 0;
    const yoil = YOIL_MAP[row['요일']] || '';
    console.log(`  ✅ ${date}(${yoil}) — 실매출 ${(row['실매출'] || 0).toLocaleString()}원`);
  }

  return { newCount, totalSales };
}

// ── 날짜 유틸 ──
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function getLastWeekRange() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getWeekRange(d);
}

function getMonthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, date.getMonth() + 1, 0).getDate();
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${lastDay}`,
  };
}

// ── 메인 ──
async function main() {
  const mode = process.argv[2] || 'weekly'; // weekly, cash, monthly, all

  const { browser, page, topFrame } = await loginOkpos();
  console.log('OKPOS 로그인 성공\n');

  try {
    if (mode === 'weekly' || mode === 'all') {
      const lastWeek = getLastWeekRange();
      console.log(`\n=== 주간정산 (${lastWeek.start} ~ ${lastWeek.end}) ===`);
      const weeklyData = await fetchDailySales(page, topFrame, lastWeek.start, lastWeek.end);
      const result = await saveToNotion(weeklyData);
      if (result.newCount > 0) {
        const msg = `🍽️ <b>미식가의주방 주간매출</b> (${lastWeek.start} ~ ${lastWeek.end})\n\n`
          + `신규 등록: ${result.newCount}일\n`
          + `<b>실매출 합계: ${result.totalSales.toLocaleString()}원</b>`;
        await sendTelegram(msg);
        console.log('📨 텔레그램 알림 전송');
      }
    }

    if (mode === 'monthly' || mode === 'all') {
      const monthRange = getMonthRange();
      console.log(`\n=== 월별 매출 (${monthRange.start} ~ ${monthRange.end}) ===`);
      const monthlyData = await fetchDailySales(page, topFrame, monthRange.start, monthRange.end);
      const result = await saveToNotion(monthlyData);
      if (result.newCount > 0) {
        const msg = `📊 <b>미식가의주방 월매출</b> (${monthRange.start} ~ ${monthRange.end})\n\n`
          + `신규 등록: ${result.newCount}일\n`
          + `<b>실매출 합계: ${result.totalSales.toLocaleString()}원</b>`;
        await sendTelegram(msg);
        console.log('📨 텔레그램 알림 전송');
      }
    }

  } catch(e) {
    console.error('에러:', e.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
