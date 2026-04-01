// ============================================
// water-bill.js — 수원시 수도요금 조회 → 노션 DB 저장
// ============================================

require('dotenv').config();
const puppeteer = require('puppeteer');

const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_UTILITY_DB;
const WATER_CUSTOMERS = [
  { custid: '수도-공존공간', custno: '2020002531', name: '(주)공존공간', room: '전체' },
];

async function queryDB(body = {}) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}

async function addToNotion(bill) {
  await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: DB_ID },
      properties: {
        '호실': { title: [{ text: { content: bill.room } }] },
        '청구월': { rich_text: [{ text: { content: bill.month } }] },
        '종류': { select: { name: '수도' } },
        '사용량': { number: bill.usage },
        '청구금액': { number: bill.amount },
        '고객번호': { rich_text: [{ text: { content: bill.custid } }] },
        '납기일': { date: { start: bill.dueDate } },
      }
    })
  });
}

async function isAlreadyRegistered(month, custid) {
  const data = await queryDB({
    filter: {
      and: [
        { property: '청구월', rich_text: { equals: month } },
        { property: '고객번호', rich_text: { equals: custid } },
      ]
    }
  });
  return (data.results || []).length > 0;
}

async function fetchWaterBill(cust) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const bills = [];

  try {
    await page.goto('https://water.suwon.go.kr/', { waitUntil: 'networkidle2', timeout: 30000 });

    // 고객번호 10자리 각 칸에 입력
    const digits = cust.custno.split('');
    for (let i = 0; i < 10; i++) {
      await page.type(`#search_num${i + 1}`, digits[i]);
    }

    // 수용가명 입력
    await page.type('#search_name', cust.name);

    // 조회 버튼 클릭
    await page.evaluate(() => searchCuso());

    // 결과 대기
    await new Promise(r => setTimeout(r, 5000));

    // 모든 테이블 row에서 고지년월 패턴이 있는 행 추출
    const data = await page.evaluate(() => {
      const allRows = document.querySelectorAll('tr');
      const results = [];
      for (const row of allRows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 9) continue;
        const monthText = cells[1]?.innerText?.trim();
        if (/\d{4}\.\d{2}/.test(monthText)) {
          results.push({
            monthText,
            usage: cells[4]?.innerText?.trim(),
            amount: cells[9]?.innerText?.trim(),
          });
        }
      }
      return results;
    });

    for (const d of data) {
      const month = d.monthText.replace('.', '-'); // 2026.03 → 2026-03
      const usage = parseInt(d.usage.replace(/[^0-9]/g, '')) || 0;
      const amount = parseInt(d.amount.replace(/[^0-9]/g, '')) || 0;

      // 납기일: 해당월 말일
      const [y, m] = month.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const dueDate = `${y}-${m}-${lastDay}`;

      bills.push({
        custid: cust.custid,
        room: cust.room,
        month,
        usage,
        amount,
        dueDate,
      });
    }

  } catch (e) {
    console.log('  에러:', e.message);
  } finally {
    await browser.close();
  }

  return bills;
}

async function main() {
  console.log('🚰 수도요금 조회 중...\n');

  let newCount = 0;
  let totalAmount = 0;
  const newBills = [];

  for (const cust of WATER_CUSTOMERS) {
    console.log(`고객: ${cust.name} (${cust.custno})`);
    const bills = await fetchWaterBill(cust);
    console.log(`  ${bills.length}건 발견`);

    for (const bill of bills) {
      const exists = await isAlreadyRegistered(bill.month, bill.custid);
      if (exists) {
        console.log(`  ⏭️  ${bill.month} 수도 - 이미 등록됨`);
        continue;
      }

      await addToNotion(bill);
      newCount++;
      totalAmount += bill.amount;
      newBills.push(bill);
      console.log(`  ✅ ${bill.month} 수도 - ${bill.amount.toLocaleString()}원 (${bill.usage}㎥)`);
    }
  }

  if (newCount === 0) {
    console.log('\n새로 등록할 수도요금이 없습니다.');
    return;
  }

  console.log(`\n🎉 ${newCount}건 신규 등록 완료! 합계: ${totalAmount.toLocaleString()}원`);
}

main().catch(console.error);
