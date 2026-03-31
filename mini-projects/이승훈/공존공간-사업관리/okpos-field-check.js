// OKPOS 일자별 페이지 폼 필드 확인
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
  await topFrame.evaluate(() => {
    for (let i = 0; i < 10; i++) { const p = document.getElementById('divPopupLayer' + i); if (p) p.remove(); }
  }).catch(() => {});

  // 세로메뉴 → 매출현황 → 일자별
  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => jumpPAGE('000199'));
  await new Promise(r => setTimeout(r, 4000));

  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  console.log('MainFrm URL:', mainFrame.url());

  // 모든 input 필드 확인
  const inputs = await mainFrame.evaluate(() => {
    const els = document.querySelectorAll('input, select');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      type: el.type,
      id: el.id,
      name: el.name,
      value: el.value,
      className: el.className,
    }));
  });
  console.log('\n=== 폼 필드 ===');
  inputs.forEach(i => console.log(`  [${i.tag}] id=${i.id} name=${i.name} type=${i.type} value=${i.value}`));

  // 함수 확인
  const funcs = await mainFrame.evaluate(() => {
    const fns = [];
    for (const key of Object.keys(window)) {
      if (typeof window[key] === 'function' && (key.includes('Search') || key.includes('search') || key.includes('fn') || key.includes('Sheet'))) {
        fns.push(key);
      }
    }
    return fns.sort();
  });
  console.log('\n=== 관련 함수 ===');
  funcs.forEach(f => console.log('  ' + f));

  // IBSheet 객체 확인
  const sheets = await mainFrame.evaluate(() => {
    const names = [];
    for (const key of Object.keys(window)) {
      if (key.includes('Sheet') || key.includes('sheet')) {
        const val = window[key];
        if (val && typeof val === 'object' && typeof val.GetCellValue === 'function') {
          names.push(key);
        }
      }
    }
    return names;
  });
  console.log('\n=== IBSheet 객체 ===');
  sheets.forEach(s => console.log('  ' + s));

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
