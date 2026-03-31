// OKPOS 로그인 후 매출 메뉴 구조 탐색
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

  // 2. 로그인 후 URL 확인
  console.log('현재 URL:', page.url());

  // 3. 스크린샷
  await page.screenshot({ path: 'okpos-main.png', fullPage: true });
  console.log('메인 페이지 스크린샷 저장: okpos-main.png');

  // 4. 메뉴 구조 탐색
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim().slice(0, 50),
      href: a.href,
    })).filter(l => l.text && l.text.length > 0);
  });
  console.log('\n=== 메뉴 링크 ===');
  links.forEach(l => console.log(`  ${l.text} → ${l.href}`));

  // 5. iframe 확인
  const frames = page.frames();
  console.log(`\n=== 프레임 ${frames.length}개 ===`);
  for (const frame of frames) {
    console.log(`  ${frame.name() || '(no name)'} → ${frame.url()}`);
  }

  // 잠시 대기 후 종료
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(console.error);
