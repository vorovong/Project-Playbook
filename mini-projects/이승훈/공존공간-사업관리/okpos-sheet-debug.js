// IBSheet 구조 디버그
require('dotenv').config();
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('https://kis.okpos.co.kr/login/login_form.jsp', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('#user_id', process.env.OKPOS_ID);
  await page.type('#user_pwd', process.env.OKPOS_PW);
  await page.evaluate(() => doSubmit());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const topFrame = page.frames().find(f => f.url().includes('top_frame'));
  await topFrame.evaluate(() => { for (let i = 0; i < 10; i++) { const p = document.getElementById('divPopupLayer' + i); if (p) p.remove(); } }).catch(() => {});

  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => jumpPAGE('000199'));
  await new Promise(r => setTimeout(r, 5000));

  // 하위 프레임
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  const contentFrame = mainFrame.childFrames()[0];
  console.log('Content frame:', contentFrame.url());

  // 날짜 설정 + 조회
  await contentFrame.evaluate(() => {
    document.getElementById('date1_1').value = '2026-03-24';
    document.getElementById('date1_2').value = '2026-03-30';
    fnSearch();
  });
  await new Promise(r => setTimeout(r, 5000));

  // IBSheet 디버그
  const debug = await contentFrame.evaluate(() => {
    const sheet = window.mySheet1;
    if (!sheet) return { error: 'mySheet1 not found', sheets: Object.keys(window).filter(k => k.includes('Sheet') || k.includes('sheet')) };

    const info = {
      type: typeof sheet,
      methods: [],
      rowCount: 0,
      colCount: 0,
    };

    // 메서드 목록
    for (const key in sheet) {
      if (typeof sheet[key] === 'function') info.methods.push(key);
    }

    // 행/열 수
    try { info.rowCount = sheet.RowCount(); } catch(e) { info.rowCountErr = e.message; }
    try { info.colCount = sheet.ColCount(); } catch(e) { info.colCountErr = e.message; }

    // SaveName 시도
    try {
      info.saveNames = [];
      for (let c = 0; c < 30; c++) {
        try {
          const name = sheet.GetSaveName(c);
          if (name) info.saveNames.push({ col: c, name });
        } catch(e) { break; }
      }
    } catch(e) { info.saveNameErr = e.message; }

    // Header 텍스트 시도
    try {
      info.headerTexts = [];
      for (let c = 0; c < 30; c++) {
        try {
          const text = sheet.GetCellValue(0, c); // 0행이 헤더일 수 있음
          if (text) info.headerTexts.push({ col: c, text });
        } catch(e) { break; }
      }
    } catch(e) {}

    // GetSaveData 시도 (전체 데이터를 문자열로)
    try {
      info.saveData = sheet.GetSaveData().slice(0, 2000);
    } catch(e) { info.saveDataErr = e.message; }

    // 첫 행 컬럼 인덱스로 값 읽기
    try {
      info.firstRowByIndex = [];
      for (let c = 0; c < 20; c++) {
        const val = sheet.GetCellValue(1, c);
        info.firstRowByIndex.push(val);
      }
    } catch(e) { info.firstRowByIndexErr = e.message; }

    return info;
  });

  console.log(JSON.stringify(debug, null, 2));

  await page.screenshot({ path: 'okpos-sheet-debug.png', fullPage: true });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
