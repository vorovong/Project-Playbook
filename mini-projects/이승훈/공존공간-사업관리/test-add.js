require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_WORKLOG_DB;

// v5 API 구조 확인
console.log('Available methods on notion:');
console.log('- notion.pages:', typeof notion.pages, Object.keys(notion.pages || {}).join(', '));
console.log('- notion.databases:', typeof notion.databases, Object.keys(notion.databases || {}).join(', '));
console.log('- notion.blocks:', typeof notion.blocks, Object.keys(notion.blocks || {}).join(', '));

// 직접 fetch로 테스트
(async () => {
  try {
    const resp = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.NOTION_API_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: 1 })
    });
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const props = data.results[0].properties;
      console.log('\n=== 속성 목록 ===');
      for (const key in props) {
        console.log(key, ':', props[key].type);
      }
    } else {
      console.log('\n항목 없음, 빈 DB');
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
})();
