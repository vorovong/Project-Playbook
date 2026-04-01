// ============================================
// rems-solar.js — REMS 태양광 발전량 조회 → 노션 저장
// 매월 1회 실행: 전월 발전량(kWh)만 저장 (절감액 계산은 settlement.js에서)
// 사용법: node rems-solar.js [월] (예: node rems-solar.js 2026-02)
// ============================================

require('dotenv').config();
const puppeteer = require('puppeteer');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_UTILITY_DB = process.env.NOTION_UTILITY_DB;
const REMS_ID = 'sqi-658';
const REMS_PW = 'qwer123!';

// ── 노션 헬퍼 ──

async function notionFetch(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}

async function isAlreadyRegistered(month) {
  const data = await notionFetch(`https://api.notion.com/v1/databases/${NOTION_UTILITY_DB}/query`, {
    filter: {
      and: [
        { property: '청구월', rich_text: { equals: month } },
        { property: '종류', select: { equals: '태양광' } },
      ]
    }
  });
  return (data.results || []).length > 0;
}

async function saveToNotion(record) {
  return notionFetch('https://api.notion.com/v1/pages', {
    parent: { database_id: NOTION_UTILITY_DB },
    properties: {
      '호실': { title: [{ text: { content: '전체' } }] },
      '청구월': { rich_text: [{ text: { content: record.month } }] },
      '종류': { select: { name: '태양광' } },
      '사용량': { number: record.generation },       // 발전량 kWh
      '청구금액': { number: 0 },                      // 절감액은 settlement.js에서 계산
      '고객번호': { rich_text: [{ text: { content: `REMS-${REMS_ID}` } }] },
      '납기일': { date: { start: `${record.month}-01` } },
    }
  });
}

// ── REMS 발전량 조회 ──

async function fetchSolarData(month) {
  const [year, mm] = month.split('-');
  const lastDay = new Date(parseInt(year), parseInt(mm), 0).getDate();
  const start = `${year}${mm}01`;
  const end = `${year}${mm}${String(lastDay).padStart(2, '0')}`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://rems.energy.or.kr/pub/view/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.type('#login_id', REMS_ID);
    await page.type('#password', REMS_PW);
    await page.click('#loginBtn');
    await new Promise(r => setTimeout(r, 5000));

    const url = `https://rems.energy.or.kr/admin/anly/cmpConsmSct/loadMeain?consmId=${REMS_ID}&start=${start}&end=${end}&subDate=0&radioVal=2`;
    const resp = await page.evaluate(async (apiUrl) => {
      const r = await fetch(apiUrl);
      return r.json();
    }, url);

    if (!resp || resp.length === 0 || !resp[0].statsData || resp[0].statsData.length === 0) {
      return null;
    }

    const stats = resp[0].statsData[0];
    return {
      generation: stats.power,
      efficiency: stats.efic,
      co2: stats.co2,
    };
  } finally {
    await browser.close();
  }
}

// ── 메인 ──

async function main() {
  // 대상 월 결정
  let month = process.argv[2];
  if (!month) {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }

  console.log(`☀️  태양광 발전량 조회 — ${month}\n`);

  const exists = await isAlreadyRegistered(month);
  if (exists) {
    console.log(`이미 ${month} 태양광 데이터가 등록되어 있습니다.`);
    return;
  }

  const solar = await fetchSolarData(month);
  if (!solar) {
    console.log('발전량 데이터를 가져올 수 없습니다.');
    return;
  }

  console.log(`발전량: ${solar.generation.toLocaleString()} kWh`);
  console.log(`평균효율: ${solar.efficiency}%`);
  console.log(`CO2저감량: ${solar.co2} kgCO2`);

  await saveToNotion({ month, generation: solar.generation });
  console.log(`\n✅ 노션 저장 완료 (${month} / ${solar.generation.toLocaleString()} kWh)`);
}

main().catch(console.error);
