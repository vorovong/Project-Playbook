// 노션 기존 DB 구조 확인 + 부모 페이지 찾기
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const UTILITY_DB = process.env.NOTION_UTILITY_DB;

async function notionGet(url) {
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
    }
  });
  return resp.json();
}

async function main() {
  // 공과금 DB 정보 확인
  console.log('=== 공과금 DB 정보 ===');
  const db = await notionGet(`https://api.notion.com/v1/databases/${UTILITY_DB}`);
  console.log('제목:', db.title?.[0]?.plain_text);
  console.log('부모:', JSON.stringify(db.parent));
  console.log('속성:', Object.keys(db.properties).join(', '));

  // 검색으로 매출 관련 DB 있는지 확인
  console.log('\n=== 매출 관련 검색 ===');
  const search = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '매출', filter: { value: 'database', property: 'object' } })
  });
  const searchResult = await search.json();
  if (searchResult.results?.length > 0) {
    searchResult.results.forEach(r => {
      console.log(`  DB: ${r.title?.[0]?.plain_text} (${r.id})`);
    });
  } else {
    console.log('  매출 관련 DB 없음');
  }
}

main().catch(console.error);
