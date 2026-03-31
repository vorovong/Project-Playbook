// OKPOS 일자별 페이지 — 내부 프레임 + 실제 폼 필드 확인
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

  await topFrame.evaluate(() => fnMenuHV('V')).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const menuVFrame = page.frames().find(f => f.url().includes('menuv'));
  await menuVFrame.evaluate(() => echoMCLS('15'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => echoSCLS('15', '01'));
  await new Promise(r => setTimeout(r, 400));
  await menuVFrame.evaluate(() => jumpPAGE('000199'));
  await new Promise(r => setTimeout(r, 5000));

  // 모든 프레임 확인
  console.log('=== 전체 프레임 ===');
  for (const f of page.frames()) {
    if (f.url() !== 'about:blank') {
      console.log(`  ${f.name() || '(noname)'} → ${f.url()}`);
    }
  }

  // MainFrm 안의 하위 프레임 확인
  const mainFrame = page.frames().find(f => f.name() === 'MainFrm');
  const mainChildren = mainFrame.childFrames();
  console.log(`\nMainFrm 하위 프레임: ${mainChildren.length}개`);
  for (const child of mainChildren) {
    console.log(`  ${child.name()} → ${child.url()}`);

    // 각 하위 프레임의 input 필드 확인
    const inputs = await child.evaluate(() => {
      const els = document.querySelectorAll('input, select, button');
      return Array.from(els).map(el => ({
        tag: el.tagName,
        type: el.type || '',
        id: el.id || '',
        name: el.name || '',
        value: (el.value || '').slice(0, 30),
        text: el.innerText?.slice(0, 20) || '',
      })).filter(e => e.type !== 'hidden');
    }).catch(() => []);
    if (inputs.length > 0) {
      console.log('  필드:');
      inputs.forEach(i => console.log(`    [${i.tag}] id=${i.id} name=${i.name} val=${i.value} ${i.text}`));
    }
  }

  // ShowItemFrm이 탭 역할을 하는지 확인
  const showFrame = page.frames().find(f => f.name() === 'ShowItemFrm');
  if (showFrame) {
    const tabFrames = showFrame.childFrames();
    console.log(`\nShowItemFrm 하위: ${tabFrames.length}개`);
    for (const tf of tabFrames) {
      console.log(`  ${tf.name()} → ${tf.url()}`);
    }
  }

  // day_jump010.jsp 안에 탭 iframe 있을 수 있음
  const jumpUrl = mainFrame.url();
  if (jumpUrl.includes('day_jump')) {
    const jumpHtml = await mainFrame.content();
    const iframeMatches = jumpHtml.match(/<iframe[^>]+>/g);
    console.log('\n=== day_jump010 내부 iframe ===');
    if (iframeMatches) iframeMatches.forEach(m => console.log('  ' + m.slice(0, 200)));

    // 탭 구조 확인
    const tabs = jumpHtml.match(/fnGoToPage\([^)]+\)/g);
    console.log('\n=== fnGoToPage 호출 ===');
    if (tabs) tabs.forEach(t => console.log('  ' + t));
  }

  await page.screenshot({ path: 'okpos-field-check2.png', fullPage: true });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

main().catch(console.error);
