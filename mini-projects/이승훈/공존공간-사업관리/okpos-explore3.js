// OKPOS 매출관리 서브메뉴 + 매출현황 페이지 탐색
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

  // 2. top_frame에서 패스워드 팝업 닫기
  const topFrame = page.frames().find(f => f.url().includes('top_frame'));
  if (topFrame) {
    await topFrame.evaluate(() => {
      const popup = document.getElementById('divPopupLayer0');
      if (popup) popup.style.display = 'none';
    }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 500));

  // 3. ShowItemFrm (상단 탭) 소스 전체 보기
  const showFrame = page.frames().find(f => f.url().includes('showitem'));
  if (showFrame) {
    const html = await showFrame.content();
    console.log('\n=== ShowItemFrm HTML (일부) ===');
    console.log(html.slice(0, 3000));
  }

  // 4. 매출관리 메뉴 직접 URL 시도
  // 일반적인 OKPOS 패턴: /sale/xxx.jsp
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');

  // 5. top_frame 소스에서 메뉴 관련 JS 찾기
  if (topFrame) {
    const topHtml = await topFrame.content();
    // 매출 관련 키워드 검색
    const lines = topHtml.split('\n');
    console.log('\n=== top_frame 매출 관련 코드 ===');
    lines.forEach((line, i) => {
      if (line.includes('매출') || line.includes('sale') || line.includes('menu') || line.includes('Menu')) {
        console.log(`  L${i}: ${line.trim().slice(0, 150)}`);
      }
    });
  }

  // 6. MenuVFrm 소스 확인 (세로 메뉴)
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  if (menuVFrame) {
    const menuVHtml = await menuVFrame.content();
    console.log('\n=== MenuVFrm HTML (일부) ===');
    console.log(menuVHtml.slice(0, 2000));
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
