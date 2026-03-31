// OKPOS 매출현황 소분류 열기 → 일별매출 페이지 진입
require('dotenv').config();
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 로그인
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

  // 세로메뉴 열기 + 매출관리 + 매출현황 소분류
  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 800));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 1500));

  // 소분류(SCLS) 하위 메뉴 항목 찾기
  const scItems = await menuVFrame.evaluate(() => {
    const all = document.querySelectorAll('td, a, div');
    return Array.from(all).map(el => ({
      text: el.innerText?.trim().replace(/\n/g, ' ').slice(0, 60),
      onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
      display: el.offsetHeight > 0 ? 'visible' : 'hidden',
    })).filter(e => e.onclick && e.display === 'visible' && e.text.length < 30 && e.text.length > 0
      && !e.text.includes('관리') && !e.text.includes('메뉴'));
  });
  console.log('=== 매출현황 하위 항목 ===');
  scItems.forEach(m => console.log(`  ${m.text} | ${m.onclick}`));

  await page.screenshot({ path: 'okpos-sales-scls.png', fullPage: true });

  // fnMenuOpen이 있는 항목 찾아 클릭
  const menuOpenItems = scItems.filter(m => m.onclick.includes('fnMenuOpen'));
  if (menuOpenItems.length > 0) {
    // 일별매출 또는 첫 번째 항목 클릭
    const target = menuOpenItems.find(m => m.text.includes('일별') || m.text.includes('매출')) || menuOpenItems[0];
    console.log('\n클릭:', target.text, target.onclick);
    await menuVFrame.evaluate((code) => eval(code), target.onclick);
    await new Promise(r => setTimeout(r, 3000));

    const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
    console.log('MainFrm URL:', mainFrame.url());

    // 페이지 내용 확인
    const pageText = await mainFrame.evaluate(() => document.body?.innerText?.slice(0, 500));
    console.log('페이지 내용:', pageText);

    await page.screenshot({ path: 'okpos-daily-sales.png', fullPage: true });
  } else {
    console.log('fnMenuOpen 항목 없음. 전체 항목:');
    const allVisible = await menuVFrame.evaluate(() => {
      const all = document.querySelectorAll('*');
      return Array.from(all).filter(el => el.offsetHeight > 0 && el.getAttribute('onclick'))
        .map(el => ({ text: el.innerText?.trim().slice(0, 40), onclick: el.getAttribute('onclick').slice(0, 200) }))
        .filter(e => e.text.length > 0 && e.text.length < 20);
    });
    allVisible.forEach(m => console.log(`  ${m.text} | ${m.onclick}`));
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

main().catch(console.error);
