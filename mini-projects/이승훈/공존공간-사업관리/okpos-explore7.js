// OKPOS 세로메뉴 매출관리 → 하위 메뉴 열기
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
  await new Promise(r => setTimeout(r, 1500));

  // 서브메뉴 항목 가져오기
  const subMenus = await menuVFrame.evaluate(() => {
    const els = document.querySelectorAll('td, a, div, span');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      text: el.innerText?.trim().slice(0, 60),
      onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
      className: el.className || '',
      id: el.id || '',
    })).filter(e => e.text && e.text.length > 0 && e.text.length < 30 && !e.text.includes('\n'));
  });
  console.log('=== 매출관리 하위 메뉴 ===');
  const seen = new Set();
  subMenus.forEach(m => {
    const key = m.text + m.onclick;
    if (!seen.has(key) && (m.onclick || m.className)) {
      seen.add(key);
      console.log(`  [${m.tag}] ${m.text} | class: ${m.className} | onclick: ${m.onclick}`);
    }
  });

  await page.screenshot({ path: 'okpos-vmenu-sales.png', fullPage: true });
  console.log('\n스크린샷 저장: okpos-vmenu-sales.png');

  // 매출현황 하위 메뉴 클릭 시도
  // MCLS(중분류) 클릭
  const salesStatusMenu = subMenus.find(m => m.text === '매출현황' && m.onclick);
  if (salesStatusMenu) {
    console.log('\n매출현황 클릭:', salesStatusMenu.onclick);
    await menuVFrame.evaluate((onclick) => {
      eval(onclick);
    }, salesStatusMenu.onclick);
    await new Promise(r => setTimeout(r, 1500));

    // 소분류 메뉴
    const subSub = await menuVFrame.evaluate(() => {
      const els = document.querySelectorAll('td, a');
      return Array.from(els).map(el => ({
        text: el.innerText?.trim().slice(0, 60),
        onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
      })).filter(e => e.text && e.text.length > 0 && e.text.length < 30 && !e.text.includes('\n') && e.onclick);
    });
    console.log('\n=== 매출현황 소분류 ===');
    subSub.forEach(m => console.log(`  ${m.text} | onclick: ${m.onclick}`));

    await page.screenshot({ path: 'okpos-vmenu-sales-sub.png', fullPage: true });
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
