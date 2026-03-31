// 노션에 미식가의주방 매출 DB 생성
require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE = '334d0230-3dc0-805b-a0fb-e1915397fb55'; // 공과금 DB와 같은 부모

async function main() {
  const resp = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: PARENT_PAGE },
      title: [{ type: 'text', text: { content: '미식가의주방 매출' } }],
      properties: {
        '일자': { title: {} },
        '요일': { select: {
          options: [
            { name: '월', color: 'gray' },
            { name: '화', color: 'gray' },
            { name: '수', color: 'gray' },
            { name: '목', color: 'gray' },
            { name: '금', color: 'blue' },
            { name: '토', color: 'purple' },
            { name: '일', color: 'red' },
          ]
        }},
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
      }
    })
  });

  const result = await resp.json();
  if (result.id) {
    console.log('DB 생성 성공!');
    console.log('DB ID:', result.id);
    console.log('URL:', result.url);
    console.log('\n.env에 추가할 값:');
    console.log(`NOTION_SALES_DB=${result.id}`);
  } else {
    console.log('에러:', JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
