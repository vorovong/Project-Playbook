// ============================================
// create-operation-dbs.js — 월 운영현황용 노션 DB 3개 생성
// 1회만 실행. 생성된 DB ID를 .env에 추가할 것
// ============================================

require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE = '334d0230-3dc0-819a-aeb8-f7a815692936'; // 미식가의주방 정산 페이지 (활성)

async function createDB(title, properties) {
  const resp = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: PARENT_PAGE },
      title: [{ type: 'text', text: { content: title } }],
      properties,
    }),
  });
  const result = await resp.json();
  if (result.id) {
    console.log(`✅ ${title} 생성 완료`);
    console.log(`   DB ID: ${result.id}`);
    return result.id;
  } else {
    console.log(`❌ ${title} 생성 실패:`, JSON.stringify(result, null, 2));
    return null;
  }
}

async function main() {
  console.log('=== 월 운영현황 DB 생성 ===\n');

  // 1. 포토인더박스 매출 DB
  const photoId = await createDB('포토인더박스 매출', {
    '월': { title: {} },
    '1번부스_카드': { number: { format: 'number' } },
    '2번부스_카드': { number: { format: 'number' } },
    '3번부스_카드': { number: { format: 'number' } },
    '4번부스_카드': { number: { format: 'number' } },
    '1번부스_현금': { number: { format: 'number' } },
    '2번부스_현금': { number: { format: 'number' } },
    '3번부스_현금': { number: { format: 'number' } },
    '4번부스_현금': { number: { format: 'number' } },
    '필름_재고': { number: { format: 'number' } },
    '필름_단가': { number: { format: 'number' } },
    '캡슐_재고': { number: { format: 'number' } },
    '봉투_재고': { number: { format: 'number' } },
    '필름_사용': { number: { format: 'number' } },
    '캡슐_사용': { number: { format: 'number' } },
    '봉투_사용': { number: { format: 'number' } },
  });

  // 2. 구매내역 DB
  const purchaseId = await createDB('구매내역', {
    '품목': { title: {} },
    '일자': { date: {} },
    '금액': { number: { format: 'number' } },
    '배송비': { number: { format: 'number' } },
    '구분': { select: {
      options: [
        { name: '재생전술', color: 'green' },
        { name: '사무실', color: 'blue' },
        { name: '양조장', color: 'purple' },
        { name: '로컬페스타', color: 'orange' },
        { name: '팝업', color: 'pink' },
      ]
    }},
    '채널': { select: {
      options: [
        { name: '네이버', color: 'green' },
        { name: '쿠팡', color: 'brown' },
        { name: '기타온라인', color: 'gray' },
        { name: '오프라인', color: 'yellow' },
      ]
    }},
    '구매처': { rich_text: {} },
    '비고': { rich_text: {} },
  });

  // 3. 재생전술 DB
  const classId = await createDB('재생전술 클래스', {
    '클래스명': { title: {} },
    '날짜': { date: {} },
    '유형': { select: {
      options: [
        { name: '워크샵', color: 'blue' },
        { name: '소규모', color: 'green' },
      ]
    }},
    '플랫폼': { select: {
      options: [
        { name: '유선예약', color: 'gray' },
        { name: '솜씨당', color: 'orange' },
        { name: '프립', color: 'purple' },
        { name: '카카오톡', color: 'yellow' },
      ]
    }},
    '인원': { number: { format: 'number' } },
    '판매가격': { number: { format: 'number' } },
    '정산수수료': { number: { format: 'number' } },
    '정산금액': { number: { format: 'number' } },
    '재료비_인당': { number: { format: 'number' } },
    '강사비': { number: { format: 'number' } },
    '비고': { rich_text: {} },
  });

  // .env에 추가할 값 출력
  console.log('\n=== .env에 추가할 값 ===');
  if (photoId) console.log(`NOTION_PHOTO_DB=${photoId}`);
  if (purchaseId) console.log(`NOTION_PURCHASE_DB=${purchaseId}`);
  if (classId) console.log(`NOTION_CLASS_DB=${classId}`);
}

main().catch(console.error);
