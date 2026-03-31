// OKPOS 일자별 매출 + 당일매출상세현황 데이터 추출
require('dotenv').config();
const puppeteer = require('puppeteer');

async function login(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('https://kis.okpos.co.kr/login/login_form.jsp', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('#user_id', process.env.OKPOS_ID);
  await page.type('#user_pwd', process.env.OKPOS_PW);
  await page.evaluate(() => doSubmit());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const topFrame = page.frames().find(f => f.url().includes('top_frame'));
  await topFrame.evaluate(() => {
    for (let i = 0; i < 10; i++) {
      const p = document.getElementById('divPopupLayer' + i);
      if (p) p.remove();
    }
  }).catch(() => {});

  return { page, topFrame };
}

async function openPage(page, topFrame, pageCode) {
  // 세로메뉴 열기
  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 500));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 500));

  // jumpPAGE 실행
  await menuVFrame.evaluate((code) => jumpPAGE(code), pageCode);
  await new Promise(r => setTimeout(r, 4000));

  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  return mainFrame;
}

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const { page, topFrame } = await login(browser);

  // 1. 당일매출상세현황
  console.log('=== 당일매출상세현황 (000183) ===');
  let mainFrame = await openPage(page, topFrame, '000183');
  console.log('URL:', mainFrame.url());

  // ShowItemFrm에 로드된 페이지 확인
  const showFrame = page.frames().find(f => f.url().includes('showitem') || f.name() === 'ShowItemFrm');
  if (showFrame) {
    const showUrl = showFrame.url();
    console.log('ShowItemFrm URL:', showUrl);
  }

  // 모든 프레임 URL 재확인
  for (const f of page.frames()) {
    if (f.url() !== 'about:blank' && !f.url().includes('login')) {
      console.log(`  Frame: ${f.name()} → ${f.url()}`);
    }
  }

  await page.screenshot({ path: 'okpos-daily-detail.png', fullPage: true });
  console.log('스크린샷: okpos-daily-detail.png');

  // MainFrm 내용
  const bodyText = await mainFrame.evaluate(() => document.body?.innerText?.slice(0, 1000));
  console.log('\n페이지 내용:\n', bodyText);

  // 테이블 데이터 추출 시도
  const tableData = await mainFrame.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const results = [];
    tables.forEach((table, ti) => {
      const rows = table.querySelectorAll('tr');
      if (rows.length > 0 && rows.length < 50) {
        const data = [];
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.innerText.trim());
          if (cells.length > 0) data.push(cells);
        });
        if (data.length > 0) results.push({ tableIndex: ti, rows: data });
      }
    });
    return results;
  });
  console.log('\n=== 테이블 데이터 ===');
  tableData.forEach(t => {
    console.log(`\nTable ${t.tableIndex}:`);
    t.rows.forEach(r => console.log('  ' + r.join(' | ')));
  });

  // 2. 일자별 매출
  console.log('\n\n=== 일자별 매출현황 (000199) ===');
  mainFrame = await openPage(page, topFrame, '000199');
  console.log('URL:', mainFrame.url());
  await page.screenshot({ path: 'okpos-daily-list.png', fullPage: true });

  const bodyText2 = await mainFrame.evaluate(() => document.body?.innerText?.slice(0, 1000));
  console.log('\n페이지 내용:\n', bodyText2);

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

main().catch(console.error);
