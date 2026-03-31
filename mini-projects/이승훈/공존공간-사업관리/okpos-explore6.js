// OKPOS 세로 메뉴 열기 + MainFrm 매출 데이터 추출
require('dotenv').config();
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 로그인
  await page.goto('https://kis.okpos.co.kr/login/login_form.jsp', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('#user_id', process.env.OKPOS_ID);
  await page.type('#user_pwd', process.env.OKPOS_PW);
  await page.evaluate(() => doSubmit());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const topFrame = page.frames().find(f => f.url().includes('top_frame'));

  // 패스워드 팝업 완전히 제거
  await topFrame.evaluate(() => {
    // 모든 팝업 레이어 숨기기
    for (let i = 0; i < 10; i++) {
      const p = document.getElementById('divPopupLayer' + i);
      if (p) { p.style.display = 'none'; p.remove(); }
    }
    // 오버레이도 제거
    const overlays = document.querySelectorAll('[id*="overlay"], [id*="Overlay"], .overlay');
    overlays.forEach(o => o.remove());
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'okpos-clean.png', fullPage: true });

  // MainFrm에서 현재 보이는 매출 데이터 추출
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  if (mainFrame) {
    const mainUrl = mainFrame.url();
    console.log('MainFrm URL:', mainUrl);

    const mainHtml = await mainFrame.content();
    // 매출 관련 스크립트/데이터 검색
    const lines = mainHtml.split('\n');
    console.log('\n=== MainFrm 매출/sale 관련 코드 ===');
    lines.forEach((line, i) => {
      if (line.includes('매출') || line.includes('sale') || line.includes('Sale') || line.includes('실매출') || line.includes('조회')) {
        console.log(`  L${i}: ${line.trim().slice(0, 200)}`);
      }
    });
  }

  // 세로 메뉴 열기
  await topFrame.evaluate(() => {
    if (typeof fnMenuHV === 'function') fnMenuHV('V');
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'okpos-vmenu.png', fullPage: true });

  // MenuVFrm에서 매출관리 하위 전체 메뉴 가져오기
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  if (menuVFrame) {
    const menuItems = await menuVFrame.evaluate(() => {
      const els = document.querySelectorAll('a, td, div, span, li');
      return Array.from(els).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim().slice(0, 60),
        onclick: el.getAttribute('onclick')?.slice(0, 200) || '',
        href: el.getAttribute('href')?.slice(0, 200) || '',
        className: el.className || '',
      })).filter(e => e.text && e.text.length > 0 && e.text.length < 30 &&
        (e.onclick || e.href) && !e.text.includes('\n'));
    });
    console.log('\n=== 세로 메뉴 전체 항목 ===');
    menuItems.forEach(m => console.log(`  [${m.tag}] ${m.text} | onclick: ${m.onclick} | href: ${m.href}`));
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
