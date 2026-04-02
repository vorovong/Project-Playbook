// ============================================
// naver-place-rank.js — 네이버 플레이스 키워드별 순위 추적
// 사용법:
//   node naver-place-rank.js              (전체 키워드 검색 + 노션 저장)
//   node naver-place-rank.js --dry-run    (검색만, 노션 저장 안 함)
// ============================================

require('dotenv').config();

const puppeteer = require('puppeteer');

const API_KEY = process.env.NOTION_API_KEY;
const RANK_DB = '336d0230-3dc0-81c9-a361-c3d6e4c9130b';

// ── 설정 ──

const TARGET = '미식가의주방'; // 추적 대상 업체명
const MAX_PAGES = 5;           // 키워드당 최대 검색 페이지 (페이지당 10개 = 최대 50위)
const DELAY_BETWEEN = 3000;    // 키워드 간 대기 (ms) — 캡차 방지

const KEYWORDS = [
  // 지역 + 맛집
  '수원맛집', '수원역맛집', '장안동맛집', '팔달구맛집', '수원역근처맛집',
  '수원시맛집', '수원중심맛집', '화성행궁맛집', '행궁동맛집', '수원역주변맛집',
  // 지역 + 양식
  '수원양식', '수원역양식', '장안동양식', '팔달구양식', '수원서양식당',
  // 지역 + 메뉴
  '수원파스타', '수원역파스타', '수원스테이크', '수원역스테이크', '수원리조또',
  '수원오므라이스', '수원돈까스', '수원함박스테이크', '수원필라프', '수원크림파스타',
  // 지역 + 용도/상황
  '수원역데이트', '수원역점심', '수원역저녁', '수원역회식', '수원역모임',
  '수원데이트맛집', '수원기념일맛집', '수원소개팅맛집', '수원역데이트맛집', '수원분위기맛집',
  // 지역 + 업종
  '수원레스토랑', '수원역레스토랑', '수원브런치', '수원카페맛집', '수원이탈리안',
  '수원역이탈리안', '수원프렌치', '수원비스트로', '수원다이닝', '수원역다이닝',
  // 세부 지역
  '장안동파스타', '장안동스테이크', '장안동레스토랑', '장안동데이트',
  '팔달구파스타', '팔달구스테이크', '팔달구레스토랑', '팔달구데이트',
];

// ── 노션 헬퍼 ──

async function notionPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function saveToNotion(date, keyword, rank, searchVolume) {
  return notionPost('https://api.notion.com/v1/pages', {
    parent: { database_id: RANK_DB },
    properties: {
      '날짜': { title: [{ text: { content: date } }] },
      '키워드': { rich_text: [{ text: { content: keyword } }] },
      '순위': { number: rank > 0 ? rank : null },
      '업체명': { rich_text: [{ text: { content: TARGET } }] },
      '총검색량': { number: searchVolume },
    },
  });
}

// ── 검색 로직 ──

async function findNameClass(frame) {
  return frame.evaluate(() => {
    const li = document.querySelector('li');
    if (!li) return null;
    const a = li.querySelector('a');
    if (!a) return null;
    const span = a.querySelector('span');
    return span ? span.className.split(' ')[0] : null;
  });
}

async function getNames(frame, cls) {
  return frame.evaluate((c) => {
    return Array.from(document.querySelectorAll('span.' + c)).map(e => e.textContent.trim());
  }, cls);
}

async function searchKeyword(page, keyword) {
  try {
    await page.goto('https://map.naver.com/p/search/' + encodeURIComponent(keyword), {
      waitUntil: 'networkidle2', timeout: 20000,
    });

    let frame;
    try {
      await page.waitForSelector('iframe#searchIframe', { timeout: 8000 });
      const handle = await page.$('iframe#searchIframe');
      frame = await handle.contentFrame();
      await new Promise(r => setTimeout(r, 3500));
    } catch {
      return { keyword, rank: -1, total: 0 };
    }

    const cls = await findNameClass(frame);
    if (!cls) return { keyword, rank: -1, total: 0 };

    let totalCount = 0;

    for (let pg = 1; pg <= MAX_PAGES; pg++) {
      if (pg > 1) {
        const prevFirst = await frame.evaluate((c) => {
          const s = document.querySelector('span.' + c);
          return s ? s.textContent.trim() : '';
        }, cls);

        const clicked = await frame.evaluate((pn) => {
          for (const b of document.querySelectorAll('a, button')) {
            if (b.textContent.trim() === String(pn)) { b.click(); return true; }
          }
          return false;
        }, pg);
        if (!clicked) break;

        for (let w = 0; w < 15; w++) {
          await new Promise(r => setTimeout(r, 400));
          const curr = await frame.evaluate((c) => {
            const s = document.querySelector('span.' + c);
            return s ? s.textContent.trim() : '';
          }, cls);
          if (curr && curr !== prevFirst) break;
        }
      }

      const names = await getNames(frame, cls);
      for (const name of names) {
        totalCount++;
        if (name.includes(TARGET)) {
          return { keyword, rank: totalCount, total: totalCount };
        }
      }
    }

    return { keyword, rank: -1, total: totalCount };
  } catch {
    return { keyword, rank: -1, total: 0 };
  }
}

// ── 메인 ──

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

  console.log(`\n=== 네이버 플레이스 순위 검색 (${today}) ===`);
  console.log(`대상: ${TARGET} | 키워드: ${KEYWORDS.length}개 | 최대 ${MAX_PAGES * 10}위까지\n`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // 총검색량 캡처용 리스너
  let searchVolume = 0;
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('allSearch') && url.includes('query')) {
      try {
        const json = await resp.json();
        if (json?.result?.place?.totalCount != null) {
          searchVolume = json.result.place.totalCount;
        }
      } catch {}
    }
  });

  const results = [];

  for (let i = 0; i < KEYWORDS.length; i++) {
    const kw = KEYWORDS[i];
    searchVolume = 0;
    const result = await searchKeyword(page, kw);
    result.searchVolume = searchVolume;
    results.push(result);

    const display = result.rank > 0
      ? `★ ${result.rank}위`
      : `순위권 밖`;
    const vol = searchVolume > 0 ? ` (${searchVolume.toLocaleString()}개)` : '';
    console.log(`${String(i + 1).padStart(2)}. ${kw} → ${display}${vol}`);

    // 노션 저장
    if (!dryRun) {
      await saveToNotion(today, kw, result.rank, searchVolume);
    }

    // 캡차 방지 대기
    if (i < KEYWORDS.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN));
    }
  }

  await browser.close();

  // 결과 요약
  const ranked = results.filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
  console.log(`\n=== 결과 요약 ===`);
  console.log(`검색 키워드: ${KEYWORDS.length}개`);
  console.log(`순위 잡힌 키워드: ${ranked.length}개`);

  if (ranked.length > 0) {
    console.log('\n순위 목록:');
    ranked.forEach(r => console.log(`  ${r.keyword}: ${r.rank}위`));
  }

  if (!dryRun) {
    console.log(`\n✅ 노션 저장 완료 (${results.length}건)`);
  } else {
    console.log('\n(dry-run: 노션 저장 안 함)');
  }
}

main().catch(console.error);
