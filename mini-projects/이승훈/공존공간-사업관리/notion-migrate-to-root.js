// 공존공간 바로 아래로 전부 이동 (서브페이지 재생성 + 데이터 복사)
// 결과: 공존공간 > 미식가의주방 정산 / 업무일지 / 공과금
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const ROOT_PAGE = '334d0230-3dc0-8080-a461-e42928823882'; // 공존공간
const OLD_PARENT = '334d0230-3dc0-805b-a0fb-e1915397fb55'; // 공존공간 관리 (삭제 예정)

const OLD_WORKLOG_DB = process.env.NOTION_WORKLOG_DB;
const OLD_UTILITY_DB = process.env.NOTION_UTILITY_DB;
const OLD_SALES_DB = process.env.NOTION_SALES_DB;
const OLD_WEEKLY_DB = process.env.NOTION_WEEKLY_DB;
const OLD_MONTHLY_DB = process.env.NOTION_MONTHLY_DB;

async function notionReq(method, url, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(url, opts);
  return resp.json();
}
const get = (url) => notionReq('GET', url);
const post = (url, body) => notionReq('POST', url, body);
const patch = (url, body) => notionReq('PATCH', url, body);
const del = (url) => notionReq('DELETE', url);

async function queryAll(dbId) {
  let all = [], cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await post(`https://api.notion.com/v1/databases/${dbId}/query`, body);
    all = all.concat(r.results || []);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return all;
}

function convertProp(oldProp) {
  if (!oldProp) return null;
  const t = oldProp.type;
  if (t === 'title') {
    const text = oldProp.title?.[0]?.plain_text || '';
    return text ? { title: [{ text: { content: text } }] } : null;
  }
  if (t === 'rich_text') {
    const text = oldProp.rich_text?.[0]?.plain_text || '';
    return text ? { rich_text: [{ text: { content: text } }] } : null;
  }
  if (t === 'number') {
    return oldProp.number != null ? { number: oldProp.number } : null;
  }
  if (t === 'select') {
    return oldProp.select?.name ? { select: { name: oldProp.select.name } } : null;
  }
  if (t === 'multi_select') {
    const names = (oldProp.multi_select || []).map(s => ({ name: s.name }));
    return names.length ? { multi_select: names } : null;
  }
  if (t === 'date') {
    return oldProp.date ? { date: oldProp.date } : null;
  }
  if (t === 'status') {
    return oldProp.status?.name ? { status: { name: oldProp.status.name } } : null;
  }
  if (t === 'checkbox') {
    return { checkbox: oldProp.checkbox || false };
  }
  // people, relation, formula, rollup 등은 복사 불가
  return null;
}

async function copyData(oldDbId, newDbId, propNames) {
  const pages = await queryAll(oldDbId);
  console.log(`    ${pages.length}건 읽기`);
  let copied = 0;
  for (const page of pages) {
    const newProps = {};
    for (const key of propNames) {
      const val = convertProp(page.properties[key]);
      if (val) newProps[key] = val;
    }
    await post('https://api.notion.com/v1/pages', {
      parent: { database_id: newDbId },
      properties: newProps,
    });
    copied++;
  }
  console.log(`    ${copied}건 복사 완료`);
}

async function main() {
  // === 1. 미식가의주방 정산 서브페이지 (공존공간 바로 아래) ===
  console.log('=== 1. 미식가의주방 정산 페이지 생성 ===');
  const misikPage = await post('https://api.notion.com/v1/pages', {
    parent: { page_id: ROOT_PAGE },
    properties: { title: { title: [{ text: { content: '미식가의주방 정산' } }] } },
    icon: { type: 'emoji', emoji: '🍽️' },
  });
  console.log('  ID:', misikPage.id);

  // 주간정산 DB
  console.log('  주간정산 DB...');
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
  const newWeekly = await post('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: misikPage.id },
    title: [{ type: 'text', text: { content: '주간정산' } }],
    description: [{ type: 'text', text: { content: '매주 월~일 자동 집계. 카드매출이 핵심.' } }],
    properties: weeklyProps,
  });
  console.log('  주간정산 DB ID:', newWeekly.id);
  await copyData(OLD_WEEKLY_DB, newWeekly.id, Object.keys(weeklyProps));

  // 월정산 DB
  console.log('  월정산 DB...');
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
  const newMonthly = await post('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: misikPage.id },
    title: [{ type: 'text', text: { content: '월정산' } }],
    description: [{ type: 'text', text: { content: '월별 매출 대시보드. 현금매출이 핵심. 현금결산은 매월 첫 평일.' } }],
    properties: monthlyProps,
  });
  console.log('  월정산 DB ID:', newMonthly.id);
  await copyData(OLD_MONTHLY_DB, newMonthly.id, Object.keys(monthlyProps));

  // 일별매출 DB
  console.log('  일별매출 DB...');
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
  const newSales = await post('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: misikPage.id },
    title: [{ type: 'text', text: { content: '일별매출 (백업)' } }],
    properties: salesProps,
  });
  console.log('  일별매출 DB ID:', newSales.id);
  await copyData(OLD_SALES_DB, newSales.id, Object.keys(salesProps));

  // === 2. 업무일지 서브페이지 ===
  console.log('\n=== 2. 업무일지 페이지 생성 ===');
  const worklogPage = await post('https://api.notion.com/v1/pages', {
    parent: { page_id: ROOT_PAGE },
    properties: { title: { title: [{ text: { content: '업무일지' } }] } },
    icon: { type: 'emoji', emoji: '📋' },
  });
  console.log('  ID:', worklogPage.id);

  const worklogDbProps = {
    '제목': { title: {} },
    '담당자': { select: { options: [
      { name: '엄수빈', color: 'blue' },
    ]}},
    '날짜': { date: {} },
    '구분': { select: { options: [
      { name: '업무보고', color: 'red' },
      { name: '업무계획', color: 'green' },
    ]}},
    '상태': { status: {} },
    '카테고리': { multi_select: { options: [
      { name: '기타', color: 'gray' },
      { name: '시설관리', color: 'pink' },
      { name: '콘텐츠', color: 'red' },
      { name: '재생전술', color: 'brown' },
      { name: '인사/급여', color: 'yellow' },
      { name: '사업정산', color: 'blue' },
      { name: '임대관리', color: 'green' },
      { name: '정산', color: 'purple' },
      { name: '회계/세무', color: 'default' },
    ]}},
  };
  const newWorklog = await post('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: worklogPage.id },
    title: [{ type: 'text', text: { content: '업무일지' } }],
    properties: worklogDbProps,
  });
  console.log('  업무일지 DB ID:', newWorklog.id);

  // 업무일지 데이터 복사 (담당자는 원래 people 타입이라 select로 변환)
  const worklogPages = await queryAll(OLD_WORKLOG_DB);
  console.log(`    ${worklogPages.length}건 읽기`);
  let wCopied = 0;
  for (const page of worklogPages) {
    const p = page.properties;
    const newProps = {};
    // 제목 (title)
    const titleKey = Object.keys(p).find(k => p[k].type === 'title');
    const titleText = p[titleKey]?.title?.[0]?.plain_text || '';
    if (titleText) newProps['제목'] = { title: [{ text: { content: titleText } }] };
    // 담당자 (people → select 변환)
    if (p['담당자']?.people?.[0]?.name) {
      newProps['담당자'] = { select: { name: p['담당자'].people[0].name } };
    }
    // 날짜
    if (p['날짜']?.date) newProps['날짜'] = { date: p['날짜'].date };
    // 구분
    if (p['구분']?.select?.name) newProps['구분'] = { select: { name: p['구분'].select.name } };
    // 상태
    if (p['상태']?.status?.name) newProps['상태'] = { status: { name: p['상태'].status.name } };
    // 카테고리
    const cats = (p['카테고리']?.multi_select || []).map(s => ({ name: s.name }));
    if (cats.length) newProps['카테고리'] = { multi_select: cats };

    await post('https://api.notion.com/v1/pages', { parent: { database_id: newWorklog.id }, properties: newProps });
    wCopied++;
  }
  console.log(`    ${wCopied}건 복사 완료`);

  // === 3. 공과금 서브페이지 ===
  console.log('\n=== 3. 공과금 페이지 생성 ===');
  const utilityPage = await post('https://api.notion.com/v1/pages', {
    parent: { page_id: ROOT_PAGE },
    properties: { title: { title: [{ text: { content: '공과금' } }] } },
    icon: { type: 'emoji', emoji: '💡' },
  });
  console.log('  ID:', utilityPage.id);

  const utilityDbProps = {
    '호실': { title: {} },
    '종류': { select: { options: [
      { name: '전기', color: 'yellow' },
      { name: '수도', color: 'blue' },
      { name: '가스', color: 'orange' },
      { name: '인터넷', color: 'green' },
      { name: '정수기', color: 'purple' },
    ]}},
    '청구월': { rich_text: {} },
    '청구금액': { number: { format: 'number_with_commas' } },
    '사용량': { number: { format: 'number' } },
    '납기일': { date: {} },
    '고객번호': { rich_text: {} },
  };
  const newUtility = await post('https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: utilityPage.id },
    title: [{ type: 'text', text: { content: '공과금' } }],
    properties: utilityDbProps,
  });
  console.log('  공과금 DB ID:', newUtility.id);
  await copyData(OLD_UTILITY_DB, newUtility.id, Object.keys(utilityDbProps));

  // === 4. 공존공간 관리 페이지 삭제 (아카이브) ===
  console.log('\n=== 4. 공존공간 관리 페이지 아카이브 ===');
  const archived = await patch(`https://api.notion.com/v1/pages/${OLD_PARENT}`, { archived: true });
  console.log('  아카이브:', archived.archived ? '완료' : '실패');

  // === 결과 출력 ===
  console.log('\n=== 완료! ===');
  console.log(`\n.env 업데이트:`);
  console.log(`NOTION_WORKLOG_DB=${newWorklog.id}`);
  console.log(`NOTION_UTILITY_DB=${newUtility.id}`);
  console.log(`NOTION_SALES_DB=${newSales.id}`);
  console.log(`NOTION_WEEKLY_DB=${newWeekly.id}`);
  console.log(`NOTION_MONTHLY_DB=${newMonthly.id}`);
  console.log(`\n미식가의주방 정산: ${misikPage.url}`);
  console.log(`업무일지: ${worklogPage.url}`);
  console.log(`공과금: ${utilityPage.url}`);
}

main().catch(console.error);
