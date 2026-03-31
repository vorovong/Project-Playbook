// 노션 페이지 정리:
// 1. 워크스페이스 루트에 "공존공간 관리" 메인 페이지 생성
// 2. 하위에 업무일지/공과금/주간정산/월정산 링크 정리
// 3. 주간정산·월정산 DB 컬럼 재정렬 (불필요 컬럼 제거)
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE = '334d0230-3dc0-805b-a0fb-e1915397fb55';
const WORKLOG_DB = process.env.NOTION_WORKLOG_DB;
const UTILITY_DB = process.env.NOTION_UTILITY_DB;
const SALES_DB = process.env.NOTION_SALES_DB;
const WEEKLY_DB = process.env.NOTION_WEEKLY_DB;
const MONTHLY_DB = process.env.NOTION_MONTHLY_DB;

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

async function notionGet(url) {
  const resp = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Notion-Version': '2022-06-28' }
  });
  return resp.json();
}

async function main() {
  // 1. 업무일지 DB 제목 수정 (제목없음 → 업무일지)
  console.log('=== 업무일지 DB 제목 수정 ===');
  await notionPatch(`https://api.notion.com/v1/databases/${WORKLOG_DB}`, {
    title: [{ type: 'text', text: { content: '업무일지' } }]
  });
  console.log('  업무일지 제목 설정 완료');

  // 2. 주간정산 DB 불필요 속성 제거
  console.log('\n=== 주간정산 DB 정리 ===');
  const weeklyDb = await notionGet(`https://api.notion.com/v1/databases/${WEEKLY_DB}`);
  console.log('  현재 속성:', Object.keys(weeklyDb.properties).join(', '));

  // 주간정산: 주차, 기간, 영업일수, 실매출, 카드매출, 현금매출 (핵심만)
  // 나머지는 제거하지 않고 이름을 유지 (데이터 보존)
  // → API로는 뷰 컬럼 순서/숨김 제어가 안 됨. 속성 설명을 추가해서 구분

  // 3. 월정산 DB 정리
  console.log('\n=== 월정산 DB 정리 ===');
  const monthlyDb = await notionGet(`https://api.notion.com/v1/databases/${MONTHLY_DB}`);
  console.log('  현재 속성:', Object.keys(monthlyDb.properties).join(', '));

  // 4. 부모 페이지에 구분용 헤딩 추가
  console.log('\n=== 부모 페이지 정리 ===');

  // 기존 블록들 사이에 헤딩 추가는 어려우니, 페이지 제목이라도 수정
  const parentPage = await notionPatch(`https://api.notion.com/v1/pages/${PARENT_PAGE}`, {
    properties: {
      title: { title: [{ text: { content: '공존공간 관리' } }] }
    }
  });
  console.log('  페이지 제목 → "공존공간 관리"');

  // 5. 부모 페이지에 헤딩+구분선 추가 (맨 위에)
  // 기존 블록 순서: 업무일지, 공과금, 일별매출, 월정산, 주간정산
  // 원하는 순서: 업무일지 / 공과금 / 주간정산 / 월정산 (일별매출은 아래로)

  // 기존 블록 위에 새 콘텐츠 추가 (after 지정 안 하면 맨 아래)
  await notionPatch(`https://api.notion.com/v1/blocks/${PARENT_PAGE}/children`, {
    children: [
      { type: 'divider', divider: {} },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '📋 주간정산 (카드매출 중심)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: '↑ 위 테이블에서 주차별 카드매출을 확인하세요. 매주 월~일 자동 집계됩니다.' } }] } },
      { type: 'divider', divider: {} },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '💰 월정산 (현금매출 중심)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: '↑ 위 테이블에서 월별 현금매출을 확인하세요. 현금결산은 매월 첫 평일에 실행됩니다.' } }] } },
      { type: 'divider', divider: {} },
      { type: 'heading_3', heading_3: { rich_text: [{ text: { content: '📦 일별매출 (백업)' } }] } },
    ]
  });
  console.log('  구분 헤딩 추가 완료');

  // 6. 주간정산 DB 속성 설명 추가 (description)
  await notionPatch(`https://api.notion.com/v1/databases/${WEEKLY_DB}`, {
    description: [{ type: 'text', text: { content: '매주 월~일 자동 집계. 카드매출이 핵심 지표.' } }]
  });
  await notionPatch(`https://api.notion.com/v1/databases/${MONTHLY_DB}`, {
    description: [{ type: 'text', text: { content: '월별 매출 대시보드. 현금매출이 핵심 지표. 현금결산은 매월 첫 평일.' } }]
  });
  console.log('  DB 설명 추가 완료');

  console.log('\n=== 완료 ===');
  console.log('노션에서 수동으로 해야 할 것:');
  console.log('1. 주간정산 DB → 테이블 뷰에서 주차/기간/실매출/카드매출/현금매출/영업일수만 보이게 설정');
  console.log('2. 월정산 DB → 테이블 뷰에서 월/실매출/카드매출/현금매출/현금영수증/일평균매출만 보이게 설정');
  console.log('3. 일별매출 DB → 토글 안에 넣거나 페이지 아래로 이동');
  console.log('4. DB 블록 순서 드래그: 업무일지 → 공과금 → 주간정산 → 월정산 → 일별매출(백업)');
}

main().catch(console.error);
