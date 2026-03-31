// OKPOS 매출관리 클릭 → 서브메뉴 탐색 → 매출 페이지 스크린샷
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

  // 패스워드 팝업 닫기
  const topFrame = page.frames().find(f => f.url().includes('top_frame'));
  if (topFrame) {
    await topFrame.evaluate(() => {
      const popup = document.getElementById('divPopupLayer0');
      if (popup) popup.style.display = 'none';
    }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 500));

  // 매출관리 메뉴 클릭 (cswmMenuButtonGroup_15가 매출관리일 가능성)
  // 상단 메뉴 버튼 텍스트 확인
  if (topFrame) {
    const menuInfo = await topFrame.evaluate(() => {
      const groups = ['10', '15', '20', '25', '28', '30', '40'];
      return groups.map(id => {
        const el = document.getElementById('cswmMenuButtonGroup_' + id);
        return { id, text: el ? el.closest('td')?.innerText?.trim() || el.innerText?.trim() : 'not found' };
      });
    });
    console.log('=== 메뉴 버튼 매핑 ===');
    menuInfo.forEach(m => console.log(`  Group ${m.id}: ${m.text}`));

    // 매출관리 클릭
    await topFrame.evaluate(() => {
      const el = document.getElementById('cswmMenuButtonGroup_15');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'okpos-after-sales-click.png', fullPage: true });

    // 드롭다운/서브메뉴 확인
    const subMenu = await topFrame.evaluate(() => {
      // cswm 서브메뉴 찾기
      const allDivs = document.querySelectorAll('div[id*="cswm"]');
      const visible = [];
      allDivs.forEach(d => {
        if (d.offsetHeight > 0 && d.offsetWidth > 0) {
          visible.push({ id: d.id, text: d.innerText?.slice(0, 200) });
        }
      });
      return visible;
    });
    console.log('\n=== 보이는 서브메뉴 ===');
    subMenu.forEach(s => console.log(`  ${s.id}: ${s.text}`));
  }

  // 일반적인 OKPOS 매출 페이지 URL 직접 시도
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  if (mainFrame) {
    const testUrls = [
      '/sale/sale010.jsp',       // 일별매출
      '/sale/sale020.jsp',       // 기간별매출
      '/sale/sale030.jsp',       // 결제수단별
      '/sale/sale100.jsp',       // 매출현황
      '/sale/saleStat010.jsp',   // 매출통계
    ];
    for (const url of testUrls) {
      try {
        await mainFrame.goto('https://kis.okpos.co.kr' + url, { waitUntil: 'networkidle2', timeout: 5000 });
        const title = await mainFrame.title();
        const bodyText = await mainFrame.evaluate(() => document.body?.innerText?.slice(0, 100));
        console.log(`\n${url} → title: ${title}, body: ${bodyText}`);
        if (bodyText && !bodyText.includes('error') && !bodyText.includes('404') && bodyText.length > 10) {
          await page.screenshot({ path: `okpos-${url.replace(/\//g, '-').replace('.jsp', '')}.png`, fullPage: true });
          console.log(`  스크린샷 저장!`);
        }
      } catch(e) {
        console.log(`${url} → 실패: ${e.message.slice(0, 50)}`);
      }
    }
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

main().catch(console.error);
