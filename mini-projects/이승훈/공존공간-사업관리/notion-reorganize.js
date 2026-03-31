// 노션 재구성: 미식가의주방 정산 서브페이지 생성 + DB 이동(재생성+데이터복사)
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE = '334d0230-3dc0-805b-a0fb-e1915397fb55';
const OLD_SALES_DB = process.env.NOTION_SALES_DB;
const OLD_WEEKLY_DB = process.env.NOTION_WEEKLY_DB;
const OLD_MONTHLY_DB = process.env.NOTION_MONTHLY_DB;

async function notionPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp.json();
}
async function notionPatch(url, body) {
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp.json();
}
async function notionGet(url) {
  const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28' } });
  return resp.json();
}
async function notionDelete(url) {
  const resp = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28' } });
  return resp.json();
}

// DB 속성 정의
const weeklyProps = {
  '주차': { title: {} },
  '기간': { rich_text: {} },
  '영업일수': { number: { format: 'number' } },
  '실매출': { number: { format: 'number' } },
  '카드매출': { number: { format: 'number' } },
  '현금매출': { number: { format: 'number' } },
  '현금영수증': { number: { format: 'number' } },
  '총매출': { number: { format: 'number' } },
  '총할인': { number: { format: 'number' } },
  '외상': { number: { format: 'number' } },
  '총영수건수': { number: { format: 'number' } },
  '총고객수': { number: { format: 'number' } },
  '일평균매출': { number: { format: 'number' } },
};

const monthlyProps = {
  '월': { title: {} },
  '영업일수': { number: { format: 'number' } },
  '실매출': { number: { format: 'number' } },
  '카드매출': { number: { format: 'number' } },
  '현금매출': { number: { format: 'number' } },
  '현금영수증': { number: { format: 'number' } },
  '총매출': { number: { format: 'number' } },
  '총할인': { number: { format: 'number' } },
  '외상': { number: { format: 'number' } },
  '총영수건수': { number: { format: 'number' } },
  '총고객수': { number: { format: 'number' } },
  '일평균매출': { number: { format: 'number' } },
  '객단가평균': { number: { format: 'number' } },
};

const salesProps = {
  '일자': { title: {} },
  '요일': { select: { options: [
    { name: '월', color: 'gray' }, { name: '화', color: 'gray' }, { name: '수', color: 'gray' },
    { name: '목', color: 'gray' }, { name: '금', color: 'blue' }, { name: '토', color: 'purple' }, { name: '일', color: 'red' },
  ]}},
  '주차': { rich_text: {} },
  '총매출': { number: { format: 'number' } },
  '총할인': { number: { format: 'number' } },
  '실매출': { number: { format: 'number' } },
  '가액': { number: { format: 'number' } },
  '부가세': { number: { format: 'number' } },
  '영수건수': { number: { format: 'number' } },
  '고객수': { number: { format: 'number' } },
  '결제합계': { number: { format: 'number' } },
  '단순현금': { number: { format: 'number' } },
  '현금영수': { number: { format: 'number' } },
  '신용카드': { number: { format: 'number' } },
  '외상': { number: { format: 'number' } },
  '상품권': { number: { format: 'number' } },
  '식권': { number: { format: 'number' } },
  '회원포인트': { number: { format: 'number' } },
};

async function copyDbData(oldDbId, newDbId, propMapping) {
  // 전체 데이터 읽기
  let allResults = [];
  let cursor = undefined;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const query = await notionPost(`https://api.notion.com/v1/databases/${oldDbId}/query`, body);
    allResults = allResults.concat(query.results || []);
    cursor = query.has_more ? query.next_cursor : undefined;
  } while (cursor);

  console.log(`    ${allResults.length}건 읽기 완료`);

  // 새 DB에 복사
  for (const page of allResults) {
    const newProps = {};
    for (const [key, config] of Object.entries(propMapping)) {
      const oldProp = page.properties[key];
      if (!oldProp) continue;

      if (oldProp.type === 'title') {
        const text = oldProp.title?.[0]?.plain_text || '';
        if (text) newProps[key] = { title: [{ text: { content: text } }] };
      } else if (oldProp.type === 'rich_text') {
        const text = oldProp.rich_text?.[0]?.plain_text || '';
        if (text) newProps[key] = { rich_text: [{ text: { content: text } }] };
      } else if (oldProp.type === 'number') {
        if (oldProp.number != null) newProps[key] = { number: oldProp.number };
      } else if (oldProp.type === 'select') {
        if (oldProp.select?.name) newProps[key] = { select: { name: oldProp.select.name } };
      }
    }

    await notionPost('https://api.notion.com/v1/pages', {
      parent: { database_id: newDbId },
      properties: newProps,
    });
  }
  console.log(`    ${allResults.length}건 복사 완료`);
}

async function main() {
  // 1. "미식가의주방 정산" 서브페이지 생성
  console.log('=== 1. 미식가의주방 정산 페이지 생성 ===');
  const subPage = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: PARENT_PAGE },
    properties: {
      title: { title: [{ text: { content: '미식가의주방 정산' } }] }
    },
  });
  const subPageId = subPage.id;
  console.log('  페이지 ID:', subPageId);

  // 2. 서브페이지 안에 주간정산 DB 생성
  console.log('\n=== 2. 주간정산 DB 생성 ===');
  const newWeekly = await notionPost('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: subPageId },
    title: [{ type: 'text', text: { content: '주간정산' } }],
    description: [{ type: 'text', text: { content: '매주 월~일 자동 집계. 카드매출이 핵심.' } }],
    properties: weeklyProps,
  });
  console.log('  DB ID:', newWeekly.id);

  // 데이터 복사
  console.log('  데이터 복사 중...');
  await copyDbData(OLD_WEEKLY_DB, newWeekly.id, weeklyProps);

  // 3. 서브페이지 안에 월정산 DB 생성
  console.log('\n=== 3. 월정산 DB 생성 ===');
  const newMonthly = await notionPost('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: subPageId },
    title: [{ type: 'text', text: { content: '월정산' } }],
    description: [{ type: 'text', text: { content: '월별 매출 대시보드. 현금매출이 핵심. 현금결산은 매월 첫 평일.' } }],
    properties: monthlyProps,
  });
  console.log('  DB ID:', newMonthly.id);

  console.log('  데이터 복사 중...');
  await copyDbData(OLD_MONTHLY_DB, newMonthly.id, monthlyProps);

  // 4. 서브페이지 안에 일별매출 DB 생성 (백업)
  console.log('\n=== 4. 일별매출 DB 생성 (백업) ===');
  const newSales = await notionPost('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: subPageId },
    title: [{ type: 'text', text: { content: '일별매출 (백업)' } }],
    properties: salesProps,
  });
  console.log('  DB ID:', newSales.id);

  console.log('  데이터 복사 중...');
  await copyDbData(OLD_SALES_DB, newSales.id, salesProps);

  // 5. 기존 부모 페이지에서 옛 DB 블록 삭제 (아카이브)
  console.log('\n=== 5. 기존 DB 블록 정리 ===');
  const oldBlocks = await notionGet(`https://api.notion.com/v1/blocks/${PARENT_PAGE}/children?page_size=50`);
  for (const block of oldBlocks.results || []) {
    // 기존 3개 매출 DB + 아까 추가한 헤딩/구분선 삭제
    if (block.type === 'child_database' && [OLD_SALES_DB, OLD_WEEKLY_DB, OLD_MONTHLY_DB].includes(block.id.replace(/-/g, ''))) {
      // DB 블록은 삭제하면 DB 자체가 아카이브됨
      await notionDelete(`https://api.notion.com/v1/blocks/${block.id}`);
      console.log(`  삭제: ${block.id}`);
    }
    // 아까 추가한 헤딩/구분선도 정리
    if (block.type === 'heading_2' || block.type === 'heading_3') {
      const text = block[block.type]?.rich_text?.[0]?.plain_text || '';
      if (text.includes('주간정산') || text.includes('월정산') || text.includes('일별매출')) {
        await notionDelete(`https://api.notion.com/v1/blocks/${block.id}`);
        console.log(`  삭제 헤딩: ${text}`);
      }
    }
    if (block.type === 'divider') {
      await notionDelete(`https://api.notion.com/v1/blocks/${block.id}`);
      console.log(`  삭제: divider`);
    }
    if (block.type === 'paragraph') {
      const text = block.paragraph?.rich_text?.[0]?.plain_text || '';
      if (text.includes('위 테이블') || text.includes('카드매출') || text.includes('현금결산')) {
        await notionDelete(`https://api.notion.com/v1/blocks/${block.id}`);
        console.log(`  삭제 paragraph: ${text.slice(0, 30)}`);
      }
    }
  }

  // 결과 출력
  console.log('\n=== 완료! ===');
  console.log(`\n.env 업데이트 필요:`);
  console.log(`NOTION_SALES_DB=${newSales.id}`);
  console.log(`NOTION_WEEKLY_DB=${newWeekly.id}`);
  console.log(`NOTION_MONTHLY_DB=${newMonthly.id}`);
  console.log(`\n서브페이지: ${subPage.url}`);
}

main().catch(console.error);
