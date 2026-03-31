// 노션 구조 확인 + DB 재배치 + 뷰 정리
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const WORKLOG_DB = process.env.NOTION_WORKLOG_DB;
const UTILITY_DB = process.env.NOTION_UTILITY_DB;
const SALES_DB = process.env.NOTION_SALES_DB;
const WEEKLY_DB = process.env.NOTION_WEEKLY_DB;
const MONTHLY_DB = process.env.NOTION_MONTHLY_DB;

async function notionGet(url) {
  const resp = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28' }
  });
  return resp.json();
}

async function notionPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}

async function main() {
  // 각 DB의 부모 확인
  console.log('=== 현재 DB 위치 ===');

  const dbs = {
    '업무일지': WORKLOG_DB,
    '공과금': UTILITY_DB,
    '일별매출': SALES_DB,
    '주간정산': WEEKLY_DB,
    '월정산': MONTHLY_DB,
  };

  for (const [name, id] of Object.entries(dbs)) {
    if (!id) { console.log(`  ${name}: ID 없음`); continue; }
    const db = await notionGet(`https://api.notion.com/v1/databases/${id}`);
    const parentType = db.parent?.type;
    const parentId = db.parent?.page_id || db.parent?.workspace || 'unknown';
    console.log(`  ${name} → 부모: ${parentType} ${parentId}`);
  }

  // 부모 페이지의 자식 확인
  console.log('\n=== 부모 페이지 구조 ===');
  const parentPageId = '334d0230-3dc0-805b-a0fb-e1915397fb55';
  const children = await notionGet(`https://api.notion.com/v1/blocks/${parentPageId}/children?page_size=50`);
  if (children.results) {
    children.results.forEach(block => {
      console.log(`  [${block.type}] ${block.id} ${block[block.type]?.title || ''}`);
    });
  }

  // 업무일지 DB 부모 페이지 확인
  const worklogDb = await notionGet(`https://api.notion.com/v1/databases/${WORKLOG_DB}`);
  const worklogParent = worklogDb.parent?.page_id;
  console.log(`\n업무일지 부모 페이지: ${worklogParent}`);

  if (worklogParent) {
    const worklogParentChildren = await notionGet(`https://api.notion.com/v1/blocks/${worklogParent}/children?page_size=50`);
    console.log('\n=== 업무일지 부모 페이지 자식들 ===');
    if (worklogParentChildren.results) {
      worklogParentChildren.results.forEach(block => {
        console.log(`  [${block.type}] ${block.id}`);
      });
    }
  }

  // 검색으로 전체 DB 목록
  console.log('\n=== 전체 DB 검색 ===');
  const search = await notionPost('https://api.notion.com/v1/search', {
    filter: { value: 'database', property: 'object' },
    page_size: 20,
  });
  if (search.results) {
    search.results.forEach(r => {
      const title = r.title?.[0]?.plain_text || '(제목없음)';
      const parent = r.parent?.page_id || r.parent?.workspace || 'unknown';
      console.log(`  ${title} (${r.id}) → 부모: ${parent}`);
    });
  }
}

main().catch(console.error);
