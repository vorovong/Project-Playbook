// 주간정산 DB 생성 + 3월 주차별 데이터 집계 입력
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const SALES_DB = process.env.NOTION_SALES_DB;
const PARENT_PAGE = '334d0230-3dc0-805b-a0fb-e1915397fb55';

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

function getWeekInfo(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const firstDay = new Date(y, m, 1);
  let firstMon = new Date(firstDay);
  const dow = firstDay.getDay();
  if (dow === 0) firstMon.setDate(2);
  else if (dow !== 1) firstMon.setDate(firstDay.getDate() + (8 - dow));

  const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
  if (d < firstMon) return { label: `${monthStr} 1주차`, weekNum: 1, month: monthStr };
  const diffDays = Math.floor((d - firstMon) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;
  return { label: `${monthStr} ${weekNum}주차`, weekNum, month: monthStr };
}

function getWeekDateRange(dateStr) {
  // dateStr에 해당하는 주의 월~일 범위
  const d = new Date(dateStr);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

async function main() {
  // 1. 주간정산 DB 생성
  console.log('=== 주간정산 DB 생성 ===');
  const weeklyDb = await notionPost('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: PARENT_PAGE },
    title: [{ type: 'text', text: { content: '미식가의주방 주간정산' } }],
    properties: {
      '주차': { title: {} },
      '기간': { rich_text: {} },
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
    }
  });

  if (!weeklyDb.id) {
    console.log('에러:', JSON.stringify(weeklyDb));
    return;
  }
  console.log('DB ID:', weeklyDb.id);
  console.log('URL:', weeklyDb.url);
  console.log(`\n.env에 추가: NOTION_WEEKLY_DB=${weeklyDb.id}`);

  // 2. 일별 매출 DB에서 전체 데이터 읽기
  console.log('\n=== 일별 데이터 읽기 ===');
  const query = await notionPost(`https://api.notion.com/v1/databases/${SALES_DB}/query`, {
    sorts: [{ property: '일자', direction: 'ascending' }],
    page_size: 100,
  });

  // 3. 주차별로 그룹핑
  const weekGroups = {};
  for (const page of query.results || []) {
    const props = page.properties;
    const date = props['일자']?.title?.[0]?.plain_text;
    if (!date) continue;

    const { label } = getWeekInfo(date);
    const range = getWeekDateRange(date);

    if (!weekGroups[label]) {
      weekGroups[label] = {
        range: `${range.start} ~ ${range.end}`,
        days: 0,
        총매출: 0, 총할인: 0, 실매출: 0,
        카드매출: 0, 현금매출: 0, 현금영수증: 0, 외상: 0,
        총영수건수: 0, 총고객수: 0,
      };
    }
    const g = weekGroups[label];
    g.days++;
    g.총매출 += props['총매출']?.number || 0;
    g.총할인 += props['총할인']?.number || 0;
    g.실매출 += props['실매출']?.number || 0;
    g.카드매출 += props['신용카드']?.number || 0;
    g.현금매출 += props['단순현금']?.number || 0;
    g.현금영수증 += props['현금영수']?.number || 0;
    g.외상 += props['외상']?.number || 0;
    g.총영수건수 += props['영수건수']?.number || 0;
    g.총고객수 += props['고객수']?.number || 0;
  }

  // 4. 주차별 노션 입력
  console.log('\n=== 주간정산 데이터 입력 ===');
  const sortedWeeks = Object.keys(weekGroups).sort();
  for (const label of sortedWeeks) {
    const g = weekGroups[label];
    const avgDaily = g.days > 0 ? Math.round(g.실매출 / g.days) : 0;

    await notionPost('https://api.notion.com/v1/pages', {
      parent: { database_id: weeklyDb.id },
      properties: {
        '주차': { title: [{ text: { content: label } }] },
        '기간': { rich_text: [{ text: { content: g.range } }] },
        '영업일수': { number: g.days },
        '총매출': { number: g.총매출 },
        '총할인': { number: g.총할인 },
        '실매출': { number: g.실매출 },
        '카드매출': { number: g.카드매출 },
        '현금매출': { number: g.현금매출 },
        '현금영수증': { number: g.현금영수증 },
        '외상': { number: g.외상 },
        '총영수건수': { number: g.총영수건수 },
        '총고객수': { number: g.총고객수 },
        '일평균매출': { number: avgDaily },
      }
    });
    console.log(`  ✅ ${label} (${g.range}) — ${g.days}일, 실매출 ${g.실매출.toLocaleString()}원`);
  }

  console.log('\n완료!');
}

main().catch(console.error);
