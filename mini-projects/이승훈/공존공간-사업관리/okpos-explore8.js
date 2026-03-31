// OKPOS 매출현황 소분류 메뉴 + 일별매출 페이지 데이터 추출
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

  // 팝업 제거
  await topFrame.evaluate(() => {
    for (let i = 0; i < 10; i++) {
      const p = document.getElementById('divPopupLayer' + i);
      if (p) p.remove();
    }
  }).catch(() => {});

  // 세로메뉴 열기
  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  // 매출관리(15) 클릭
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 1000));

  // 매출현황 > 클릭 (소분류 열기)
  // 소분류 메뉴 구조 파악 - 전체 HTML에서 매출현황 관련 찾기
  const menuHTML = await menuVFrame.content();
  const sclsMatches = menuHTML.match(/echoSCLS\([^)]+\)/g);
  console.log('=== echoSCLS 호출 ===');
  if (sclsMatches) sclsMatches.forEach(m => console.log('  ' + m));

  const menuMatches = menuHTML.match(/fnMenuOpen\([^)]+\)/g);
  console.log('\n=== fnMenuOpen 호출 ===');
  if (menuMatches) menuMatches.forEach(m => console.log('  ' + m));

  // echoMCLS 후 생기는 중분류 항목 클릭
  // 매출현황의 > 화살표 클릭
  const midMenuItems = await menuVFrame.evaluate(() => {
    const all = document.querySelectorAll('td, a, div');
    return Array.from(all).map(el => ({
      text: el.innerText?.trim().slice(0, 40),
      onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
      style: el.getAttribute('style')?.slice(0, 100) || '',
      display: el.offsetHeight > 0 ? 'visible' : 'hidden',
    })).filter(e => e.onclick && e.display === 'visible' && e.text.length < 20);
  });
  console.log('\n=== 보이는 클릭 가능 항목 ===');
  midMenuItems.forEach(m => console.log(`  ${m.text} | ${m.onclick}`));

  // 매출현황 클릭 시도 (echoSCLS)
  const salesItem = midMenuItems.find(m => m.text === '매출현황');
  if (salesItem) {
    console.log('\n매출현황 소분류 열기:', salesItem.onclick);
    await menuVFrame.evaluate((code) => eval(code), salesItem.onclick);
    await new Promise(r => setTimeout(r, 1500));

    // 소분류 항목 확인
    const smallItems = await menuVFrame.evaluate(() => {
      const all = document.querySelectorAll('td, a');
      return Array.from(all).map(el => ({
        text: el.innerText?.trim().slice(0, 40),
        onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
        display: el.offsetHeight > 0 ? 'visible' : 'hidden',
      })).filter(e => e.onclick && e.display === 'visible' && e.text.length < 20 && e.text.length > 0);
    });
    console.log('\n=== 매출현황 소분류 항목 ===');
    smallItems.forEach(m => console.log(`  ${m.text} | ${m.onclick}`));

    await page.screenshot({ path: 'okpos-sales-sub.png', fullPage: true });
  }

  // 첫 번째 소분류 메뉴(일별매출 등) 클릭
  // fnMenuOpen으로 찾기
  const openItems = midMenuItems.filter(m => m.onclick.includes('fnMenuOpen'));
  if (openItems.length > 0) {
    console.log('\n첫 번째 fnMenuOpen 클릭:', openItems[0].text, openItems[0].onclick);
    await menuVFrame.evaluate((code) => eval(code), openItems[0].onclick);
    await new Promise(r => setTimeout(r, 3000));

    // MainFrm URL 확인
    const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
    if (mainFrame) {
      console.log('\nMainFrm URL:', mainFrame.url());
    }
    await page.screenshot({ path: 'okpos-sales-page.png', fullPage: true });
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
