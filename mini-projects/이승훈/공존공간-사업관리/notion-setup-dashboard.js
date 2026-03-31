// 1. 일별 매출 DB에 '주차' 속성 추가
// 2. 월 정산 대시보드 DB 생성
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const SALES_DB = process.env.NOTION_SALES_DB;
const PARENT_PAGE = '334d0230-3dc0-805b-a0fb-e1915397fb55';

async function notionPatch(url, body) {
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
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
  // 1. 일별 매출 DB에 '주차' 속성 추가
  console.log('=== 일별 매출 DB에 주차 속성 추가 ===');
  const updateDb = await notionPatch(`https://api.notion.com/v1/databases/${SALES_DB}`, {
    properties: {
      '주차': {
        rich_text: {}
      }
    }
  });
  if (updateDb.id) {
    console.log('주차 속성 추가 완료');
  } else {
    console.log('에러:', JSON.stringify(updateDb));
  }

  // 기존 데이터에 주차 값 채우기
  console.log('\n=== 기존 데이터에 주차 값 채우기 ===');
  const query = await notionPost(`https://api.notion.com/v1/databases/${SALES_DB}/query`, {
    sorts: [{ property: '일자', direction: 'ascending' }],
    page_size: 100,
  });

  for (const page of query.results || []) {
    const date = page.properties['일자']?.title?.[0]?.plain_text;
    if (!date) continue;

    const d = new Date(date);
    const weekLabel = getWeekLabel(d);

    await notionPatch(`https://api.notion.com/v1/pages/${page.id}`, {
      properties: {
        '주차': { rich_text: [{ text: { content: weekLabel } }] }
      }
    });
    console.log(`  ${date} → ${weekLabel}`);
  }

  // 2. 월 정산 대시보드 DB 생성
  console.log('\n=== 월 정산 대시보드 DB 생성 ===');
  const dashDb = await notionPost('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: PARENT_PAGE },
    title: [{ type: 'text', text: { content: '미식가의주방 월정산' } }],
    properties: {
      '월': { title: {} },
      '영업일수': { number: { format: 'number' } },
      '총매출': { number: { format: 'number' } },
      '총할인': { number: { format: 'number' } },
      '실매출': { number: { format: 'number' } },
      '카드매출': { number: { format: 'number' } },
      '현금매출': { number: { format: 'number' } },
      '현금영수증': { number: { format: 'number' } },
      '외상': { number: { format: 'number' } },
      '총영수건수': { number: { format: 'number' } },
      '총고객수': { number: { format: 'number' } },
      '일평균매출': { number: { format: 'number' } },
      '객단가평균': { number: { format: 'number' } },
    }
  });

  if (dashDb.id) {
    console.log('월정산 대시보드 DB 생성 완료!');
    console.log('DB ID:', dashDb.id);
    console.log('URL:', dashDb.url);
    console.log(`\n.env에 추가: NOTION_MONTHLY_DB=${dashDb.id}`);

    // 3월 데이터 바로 집계해서 넣기
    console.log('\n=== 3월 집계 데이터 입력 ===');
    const marchData = (query.results || []).filter(p => {
      const date = p.properties['일자']?.title?.[0]?.plain_text;
      return date && date.startsWith('2026-03');
    });

    let totalSales = 0, totalDiscount = 0, netSales = 0;
    let cardSales = 0, cashSales = 0, cashReceipt = 0, credit = 0;
    let totalReceipts = 0, totalCustomers = 0;

    for (const p of marchData) {
      const props = p.properties;
      totalSales += props['총매출']?.number || 0;
      totalDiscount += props['총할인']?.number || 0;
      netSales += props['실매출']?.number || 0;
      cardSales += props['신용카드']?.number || 0;
      cashSales += props['단순현금']?.number || 0;
      cashReceipt += props['현금영수']?.number || 0;
      credit += props['외상']?.number || 0;
      totalReceipts += props['영수건수']?.number || 0;
      totalCustomers += props['고객수']?.number || 0;
    }

    const bizDays = marchData.length;
    const avgDaily = bizDays > 0 ? Math.round(netSales / bizDays) : 0;
    const avgPerCustomer = totalCustomers > 0 ? Math.round(netSales / totalCustomers) : 0;

    await notionPost('https://api.notion.com/v1/pages', {
      parent: { database_id: dashDb.id },
      properties: {
        '월': { title: [{ text: { content: '2026-03' } }] },
        '영업일수': { number: bizDays },
        '총매출': { number: totalSales },
        '총할인': { number: totalDiscount },
        '실매출': { number: netSales },
        '카드매출': { number: cardSales },
        '현금매출': { number: cashSales },
        '현금영수증': { number: cashReceipt },
        '외상': { number: credit },
        '총영수건수': { number: totalReceipts },
        '총고객수': { number: totalCustomers },
        '일평균매출': { number: avgDaily },
        '객단가평균': { number: avgPerCustomer },
      }
    });

    console.log(`3월 집계 완료!`);
    console.log(`  영업일수: ${bizDays}일`);
    console.log(`  총매출: ${totalSales.toLocaleString()}원`);
    console.log(`  실매출: ${netSales.toLocaleString()}원`);
    console.log(`  카드: ${cardSales.toLocaleString()}원 / 현금: ${cashSales.toLocaleString()}원`);
    console.log(`  일평균: ${avgDaily.toLocaleString()}원 / 객단가: ${avgPerCustomer.toLocaleString()}원`);
  } else {
    console.log('에러:', JSON.stringify(dashDb));
  }
}

function getWeekLabel(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-based

  // 해당 월의 첫 월요일 찾기
  const firstDay = new Date(y, m, 1);
  let firstMon = new Date(firstDay);
  const dow = firstDay.getDay();
  if (dow === 0) firstMon.setDate(2); // 일→월
  else if (dow === 1) firstMon = firstDay; // 이미 월
  else firstMon.setDate(firstDay.getDate() + (8 - dow)); // 다음 월요일

  // 주차 계산
  const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
  if (d < firstMon) return `${monthStr} 1주차`;

  const diffDays = Math.floor((d - firstMon) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;
  return `${monthStr} ${weekNum}주차`;
}

main().catch(console.error);
