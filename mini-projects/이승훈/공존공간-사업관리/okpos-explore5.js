// OKPOS 매출현황 서브메뉴 클릭 → 실제 매출 데이터 페이지 탐색
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
  await new Promise(r => setTimeout(r, 3000));

  const topFrame = page.frames().find(f => f.url().includes('top_frame'));

  // 패스워드 팝업 닫기
  await topFrame.evaluate(() => {
    const popup = document.getElementById('divPopupLayer0');
    if (popup) popup.style.display = 'none';
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));

  // 매출관리 호버 → 매출현황 서브메뉴 열기
  await topFrame.evaluate(() => {
    const el = document.getElementById('cswmMenuButtonGroup_15');
    if (el) {
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // 매출현황 서브메뉴 항목 찾기
  const subItems = await topFrame.evaluate(() => {
    const popup = document.getElementById('cswmPopupGroup_15');
    if (!popup) return [];
    const tds = popup.querySelectorAll('td');
    return Array.from(tds).map((td, i) => ({
      index: i,
      text: td.innerText?.trim().slice(0, 50),
      onclick: td.getAttribute('onclick')?.slice(0, 200) || '',
      onmouseover: td.getAttribute('onmouseover')?.slice(0, 200) || '',
      id: td.id || '',
      className: td.className || '',
    })).filter(t => t.text.length > 0);
  });
  console.log('=== 매출관리 서브메뉴 항목 ===');
  subItems.forEach(s => console.log(`  [${s.index}] ${s.text} | onclick: ${s.onclick} | mouseover: ${s.onmouseover}`));

  // 매출현황 호버 → 하위 항목 열기
  const salesStatusItem = subItems.find(s => s.text.includes('매출현황'));
  if (salesStatusItem) {
    await topFrame.evaluate((idx) => {
      const popup = document.getElementById('cswmPopupGroup_15');
      const tds = popup.querySelectorAll('td');
      tds[idx].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }, salesStatusItem.index);
    await new Promise(r => setTimeout(r, 1500));

    // 하위 메뉴 항목 탐색
    const subSub = await topFrame.evaluate(() => {
      const allDivs = document.querySelectorAll('div[id*="cswm"]');
      const items = [];
      allDivs.forEach(d => {
        if (d.offsetHeight > 0 && d.offsetWidth > 0 && d.id.includes('Sub')) {
          const tds = d.querySelectorAll('td');
          tds.forEach((td, i) => {
            if (td.innerText?.trim()) {
              items.push({
                divId: d.id,
                text: td.innerText.trim().slice(0, 50),
                onclick: td.getAttribute('onclick')?.slice(0, 200) || '',
              });
            }
          });
        }
      });
      return items;
    });
    console.log('\n=== 매출현황 하위 메뉴 ===');
    subSub.forEach(s => console.log(`  [${s.divId}] ${s.text} | onclick: ${s.onclick}`));

    // 모든 보이는 div 확인
    const visibleMenus = await topFrame.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      return Array.from(allDivs).filter(d => d.offsetHeight > 50 && d.offsetWidth > 50 && d.innerText.includes('매출'))
        .map(d => ({ id: d.id, text: d.innerText.trim().slice(0, 300) }));
    });
    console.log('\n=== 매출 포함 보이는 div ===');
    visibleMenus.forEach(v => console.log(`  ${v.id}: ${v.text}`));
  }

  await page.screenshot({ path: 'okpos-submenu.png', fullPage: true });
  console.log('\n스크린샷 저장: okpos-submenu.png');

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
