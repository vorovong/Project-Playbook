// ============================================
// monthly-report.js — 월 운영현황 자동 생성 (모듈화 버전)
//
// 사용법: node monthly-report.js <업체명> <월>
// 예시:   node monthly-report.js gongzon 2026-03
//
// 새 업체 추가: businesses/<업체명>/ 폴더 만들고
//   config.js, collectors.js, sheets.js 작성
// ============================================

require('dotenv').config();

const { createSubPage } = require('./lib/notion');
const { getMonthRange } = require('./lib/weeks');
const { fmt } = require('./lib/blocks');

async function main() {
  const bizName = process.argv[2];
  const month = process.argv[3];

  if (!bizName || !month || !/^\d{4}-\d{2}$/.test(month)) {
    console.log('사용법: node monthly-report.js <업체명> <월>');
    console.log('예시:   node monthly-report.js gongzon 2026-03');
    console.log('');
    // 사용 가능한 업체 목록
    const fs = require('fs');
    const path = require('path');
    const bizDir = path.join(__dirname, 'businesses');
    if (fs.existsSync(bizDir)) {
      const dirs = fs.readdirSync(bizDir).filter(d =>
        fs.statSync(path.join(bizDir, d)).isDirectory()
      );
      if (dirs.length > 0) {
        console.log('등록된 업체:', dirs.join(', '));
      }
    }
    return;
  }

  // 업체 모듈 로드
  let config, collectors, sheets;
  try {
    config = require(`./businesses/${bizName}/config`);
    collectors = require(`./businesses/${bizName}/collectors`);
    sheets = require(`./businesses/${bizName}/sheets`);
  } catch (e) {
    console.log(`❌ 업체 "${bizName}"을(를) 찾을 수 없습니다.`);
    console.log(`   businesses/${bizName}/ 폴더에 config.js, collectors.js, sheets.js가 있는지 확인하세요.`);
    return;
  }

  const label = month.slice(2).replace('-', '.');
  const range = getMonthRange(month);
  console.log(`\n=== ${config.name} ${label}월 운영현황 생성 ===`);
  console.log(`   기간: ${range.start} ~ ${range.end} (4주)\n`);

  // ── 데이터 수집 ──
  const data = {};
  for (let i = 0; i < collectors.collectors.length; i++) {
    const c = collectors.collectors[i];
    console.log(`${i + 1}. ${c.label} 조회...`);

    if (c.needsRange) {
      data[c.key] = await c.fn(config, month, range);
    } else {
      data[c.key] = await c.fn(config, month);
    }
  }

  // ── 메인 페이지 생성 ──
  console.log('\n페이지 생성 중...');
  const mainBlocks = sheets.mainSheet.build(config, month, data);
  const mainPage = await createSubPage(config.parentPageId, `${label}월 운영현황`, mainBlocks);

  if (!mainPage.id) {
    console.log('❌ 메인 페이지 생성 실패:', JSON.stringify(mainPage).slice(0, 300));
    return;
  }
  console.log(`✅ ${label}월 운영현황 (월 결산)`);

  // ── 서브페이지 생성 ──
  for (const sheet of sheets.subSheets) {
    const title = sheet.title(label);
    const blocks = sheet.build(config, month, data);
    const result = await createSubPage(mainPage.id, title, blocks);
    console.log(`  ${result.id ? '✅' : '❌'} ${title}`);
  }

  console.log(`\n✅ 완료! ${mainPage.url}`);
}

main().catch(console.error);
