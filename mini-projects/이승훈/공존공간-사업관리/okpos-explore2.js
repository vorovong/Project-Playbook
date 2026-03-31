// OKPOS 매출관리 메뉴 탐색
require('dotenv').config();
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. 로그인
  console.log('로그인 중...');
  await page.goto('https://kis.okpos.co.kr/login/login_form.jsp', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('#user_id', process.env.OKPOS_ID);
  await page.type('#user_pwd', process.env.OKPOS_PW);
  await page.evaluate(() => doSubmit());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  // 2. 패스워드 변경 팝업 닫기
  try {
    const popupFrame = page.frames().find(f => f.url().includes('passwd010'));
    if (popupFrame) {
      await popupFrame.evaluate(() => {
        const closeBtn = document.querySelector('button') || document.querySelector('[onclick*="close"]');
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }
    // 팝업 div 직접 닫기 시도
    const mainFrame = page.frames().find(f => f.url().includes('top_frame'));
    if (mainFrame) {
      await mainFrame.evaluate(() => {
        const popup = document.getElementById('divPopupLayer0');
        if (popup) popup.style.display = 'none';
      });
    }
  } catch(e) { console.log('팝업 닫기:', e.message); }
  await new Promise(r => setTimeout(r, 1000));

  // 3. 매출관리 메뉴 클릭 — MenuItemFrm에서 찾기
  const menuFrame = page.frames().find(f => f.url().includes('menuitem'));
  if (menuFrame) {
    console.log('\n=== 메뉴 프레임 링크 ===');
    const menuLinks = await menuFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('a, td, div, span')).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim().slice(0, 80),
        onclick: el.getAttribute('onclick')?.slice(0, 100) || '',
        id: el.id || '',
      })).filter(l => l.text && l.text.length > 0 && l.text.length < 30);
    });
    menuLinks.forEach(l => {
      if (l.onclick) console.log(`  [${l.tag}] ${l.text} → onclick: ${l.onclick}`);
    });
  }

  // 4. ShowItemFrm (상단 메뉴바) 탐색
  const showFrame = page.frames().find(f => f.url().includes('showitem'));
  if (showFrame) {
    console.log('\n=== 상단 메뉴바 ===');
    const topLinks = await showFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('a, td, div, span')).map(el => ({
        text: el.innerText?.trim().slice(0, 50),
        onclick: el.getAttribute('onclick')?.slice(0, 150) || '',
        id: el.id || '',
      })).filter(l => l.onclick && l.text.length > 0 && l.text.length < 20);
    });
    topLinks.forEach(l => console.log(`  ${l.text} → ${l.onclick}`));
  }

  // 5. 매출관리 클릭 후 서브메뉴 확인
  if (showFrame) {
    try {
      await showFrame.evaluate(() => {
        const els = Array.from(document.querySelectorAll('td, a, div'));
        const salesMenu = els.find(el => el.innerText?.trim() === '매출관리');
        if (salesMenu) salesMenu.click();
      });
      await new Promise(r => setTimeout(r, 2000));

      // 서브메뉴 확인
      if (menuFrame) {
        const subMenus = await menuFrame.evaluate(() => {
          return Array.from(document.querySelectorAll('a, td, div, span')).map(el => ({
            text: el.innerText?.trim().slice(0, 50),
            onclick: el.getAttribute('onclick')?.slice(0, 150) || '',
          })).filter(l => l.text.length > 0 && l.text.length < 30);
        });
        console.log('\n=== 매출관리 서브메뉴 ===');
        const seen = new Set();
        subMenus.forEach(l => {
          const key = l.text;
          if (!seen.has(key) && (l.onclick || l.text.includes('매출') || l.text.includes('정산') || l.text.includes('결제'))) {
            seen.add(key);
            console.log(`  ${l.text} → ${l.onclick}`);
          }
        });
      }
    } catch(e) { console.log('매출관리 클릭 에러:', e.message); }
  }

  await page.screenshot({ path: 'okpos-sales-menu.png', fullPage: true });
  console.log('\n스크린샷 저장: okpos-sales-menu.png');

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

main().catch(console.error);
