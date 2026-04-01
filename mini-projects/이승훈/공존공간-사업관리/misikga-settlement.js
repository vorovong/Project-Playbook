// ============================================
// misikga-settlement.js — 미식가의주방 주간/현금 정산
// 사용법:
//   node misikga-settlement.js weekly 2026-03-23 2026-03-29 --misoo 2000000
//   node misikga-settlement.js cash 2026-03
// ============================================

require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const SALES_DB = process.env.NOTION_SALES_DB;
const UTILITY_DB = process.env.NOTION_UTILITY_DB;
const PARENT_PAGE_ID = '334d0230-3dc0-819a-aeb8-f7a815692936'; // 미식가의주방 정산 페이지
const WEEKLY_DB = '334d0230-3dc0-81e3-9912-fbb6c7eaafcd';     // 주간정산 DB
const MONTHLY_DB = '334d0230-3dc0-8102-8fca-f92e96e59846';    // 월정산 DB

const RENT = 3_300_000; // 월 임대료 고정
const COMMISSION_RATE = 0.15;
const VAT_RATE = 0.10;

const fmt = (n) => n.toLocaleString();

// ── 노션 헬퍼 ──

async function notionPost(url, body) {
  const resp = await fetch(url, {
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

// 매출 DB에서 기간별 일자 데이터 조회 (title 필드는 범위 필터 불가 → 월 단위 조회 후 필터)
async function getSalesData(startDate, endDate) {
  const month = startDate.slice(0, 7); // 2026-03
  const allResults = [];
  let hasMore = true;
  let startCursor;

  while (hasMore) {
    const body = {
      filter: { property: '일자', title: { starts_with: month } },
      sorts: [{ property: '일자', direction: 'ascending' }],
      page_size: 100,
    };
    if (startCursor) body.start_cursor = startCursor;

    const data = await notionPost(`https://api.notion.com/v1/databases/${SALES_DB}/query`, body);
    allResults.push(...(data.results || []));
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  return allResults.map(page => {
    const p = page.properties;
    return {
      date: p['일자']?.title?.[0]?.text?.content || '',
      totalSales: p['총매출']?.number || 0,
      realSales: p['실매출']?.number || 0,
      card: p['신용카드']?.number || 0,
      cash: p['단순현금']?.number || 0,
      cashReceipt: p['현금영수']?.number || 0,
      discount: p['총할인']?.number || 0,
    };
  }).filter(d => d.date >= startDate && d.date <= endDate);
}

// 공과금 DB에서 해당 월 데이터 조회
async function getUtilityBills(month) {
  const data = await notionPost(`https://api.notion.com/v1/databases/${UTILITY_DB}/query`, {
    filter: { property: '청구월', rich_text: { equals: month } },
  });

  const bills = {};
  for (const page of (data.results || [])) {
    const p = page.properties;
    const type = p['종류']?.select?.name || '';
    const room = p['호실']?.title?.[0]?.text?.content || '';
    const amount = p['청구금액']?.number || 0;
    const usage = p['사용량']?.number || 0;

    if (!bills[type]) bills[type] = [];
    bills[type].push({ room, amount, usage });
  }
  return bills;
}

// 전월 태양광 발전량 조회
async function getSolarGeneration(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const data = await notionPost(`https://api.notion.com/v1/databases/${UTILITY_DB}/query`, {
    filter: {
      and: [
        { property: '청구월', rich_text: { equals: prevMonth } },
        { property: '종류', select: { equals: '태양광' } },
      ]
    }
  });

  if (data.results?.length > 0) {
    return data.results[0].properties['사용량']?.number || 0;
  }
  return 0;
}

// 정산 비율
function getRate(month) {
  return month <= '2026-03' ? 0.95 : 1.0;
}

// 공과금 계산 (settlement.js 로직 재사용)
async function calcUtilities(month) {
  const bills = await getUtilityBills(month);
  const rate = getRate(month);

  const gasAmount = (bills['가스'] || []).reduce((s, b) => s + b.amount, 0);
  const waterAmount = (bills['수도'] || []).reduce((s, b) => s + b.amount, 0);
  const elecBasement = (bills['전기'] || []).filter(b => b.room.includes('지하'));
  const elecCommon = (bills['전기'] || []).filter(b => b.room.includes('공용'));
  const elecBasementAmount = elecBasement.reduce((s, b) => s + b.amount, 0);
  const elecBasementUsage = elecBasement.reduce((s, b) => s + b.usage, 0);
  const elecCommonAmount = elecCommon.reduce((s, b) => s + b.amount, 0);

  const solarGeneration = await getSolarGeneration(month);
  const pricePerKwh = elecBasementUsage > 0 ? elecBasementAmount / elecBasementUsage : 0;
  const solarSavings = Math.round(solarGeneration * pricePerKwh);

  return {
    gas: Math.round(gasAmount * rate),
    elec: Math.round((elecBasementAmount + solarSavings) * rate) + Math.round(elecCommonAmount * rate),
    water: Math.round(waterAmount * rate),
    solar: Math.round(solarSavings * rate),
    total: Math.round(gasAmount * rate)
      + Math.round((elecBasementAmount + solarSavings) * rate)
      + Math.round(elecCommonAmount * rate)
      + Math.round(waterAmount * rate),
  };
}

// ── 노션 페이지 저장 ──

function textBlock(content, bold = false) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content }, annotations: { bold } }]
    }
  };
}

function tableRow(cells) {
  return {
    type: 'table_row',
    table_row: { cells: cells.map(c => [{ type: 'text', text: { content: String(c) } }]) }
  };
}

function tableBlock(rows, colCount) {
  return {
    object: 'block', type: 'table',
    table: { table_width: colCount, has_column_header: true, has_row_header: false, children: rows }
  };
}

async function saveWeeklyToNotion(title, weekNum, data) {
  const { startDate, endDate, cardTotal, commission, commissionVat, commissionTotal,
    settlementAmount, rent, rentMonth, utilities, misoo, misooNote, balance } = data;

  const rows = [
    tableRow(['항목', '금액', '날짜', '비고']),
    tableRow(['정산금액', fmt(settlementAmount), endDate, `${startDate.slice(5)}~${endDate.slice(8)}`]),
    tableRow(['입금 ①', '', '', '']),
    tableRow(['입금 ②', '', '', '']),
    tableRow(['입금 ③', '', '', '']),
  ];

  if (rent > 0) {
    rows.push(tableRow(['임대료 차감', `(${fmt(rent)})`, '', `${rentMonth}월 청구 임대료 차감`]));
  }

  if (utilities) {
    rows.push(tableRow(['전기세', utilities.elec ? `(${fmt(utilities.elec)})` : '', '', '']));
    rows.push(tableRow(['수도세', utilities.water ? `(${fmt(utilities.water)})` : '', '', '']));
    rows.push(tableRow(['가스비', utilities.gas ? `(${fmt(utilities.gas)})` : '', '', '']));
    rows.push(tableRow(['태양광', utilities.solar ? `(${fmt(utilities.solar)})` : '', '', '']));
    rows.push(tableRow(['공과금 소계', `(${fmt(utilities.total)})`, '', '']));
  } else {
    rows.push(tableRow(['전기세', '', '', '']));
    rows.push(tableRow(['수도세', '', '', '']));
    rows.push(tableRow(['가스비', '', '', '']));
    rows.push(tableRow(['태양광', '', '', '']));
    rows.push(tableRow(['공과금 소계', '-', '', '']));
  }

  if (misoo > 0) {
    rows.push(tableRow(['미수 차감(이월)', `(${fmt(misoo)})`, '', misooNote || `미수금 ${fmt(misoo)}원 차감`]));
  } else {
    rows.push(tableRow(['미수 차감(이월)', '', '', '']));
  }

  rows.push(tableRow(['잔금 (이체예정액)', fmt(balance), '', '']));

  // 수수료 요약 테이블
  const commissionTable = tableBlock([
    tableRow(['총매출(카드수수료만)', '수수료 15%', '수수료 부가세', '수수료 총액(부가세 포함)', '입금금액']),
    tableRow([fmt(cardTotal), fmt(commission), fmt(commissionVat), fmt(commissionTotal), fmt(settlementAmount)]),
  ], 5);

  const result = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: PARENT_PAGE_ID },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children: [
      commissionTable,
      { object: 'block', type: 'divider', divider: {} },
      textBlock(`${weekNum}주차 정산`, true),
      tableBlock(rows, 4),
    ]
  });

  return result;
}

// 주간정산 DB에 매출 요약 저장
async function saveWeeklyDB(weekLabel, period, sales) {
  const cardTotal = sales.reduce((s, d) => s + d.card, 0);
  const cashTotal = sales.reduce((s, d) => s + d.cash, 0);
  const cashReceiptTotal = sales.reduce((s, d) => s + d.cashReceipt, 0);
  const totalSales = sales.reduce((s, d) => s + d.totalSales, 0);
  const realSales = sales.reduce((s, d) => s + d.realSales, 0);
  const discount = sales.reduce((s, d) => s + d.discount, 0);

  return notionPost('https://api.notion.com/v1/pages', {
    parent: { database_id: WEEKLY_DB },
    properties: {
      '주차': { title: [{ text: { content: weekLabel } }] },
      '기간': { rich_text: [{ text: { content: period } }] },
      '영업일수': { number: sales.length },
      '💙 카드매출': { number: cardTotal },
      '현금매출': { number: cashTotal },
      '현금영수증': { number: cashReceiptTotal },
      '총매출': { number: totalSales },
      '실매출': { number: realSales },
      '총할인': { number: discount },
    }
  });
}

// ── 주간 정산 ──

async function weeklySettlement(startDate, endDate, misoo = 0, misooNote = '') {
  console.log(`\n=== 미식가의주방 주간정산 (${startDate} ~ ${endDate}) ===\n`);

  // 1. 매출 데이터 조회
  const sales = await getSalesData(startDate, endDate);
  if (sales.length === 0) {
    console.log('해당 기간 매출 데이터가 없습니다.');
    return;
  }

  const cardTotal = sales.reduce((s, d) => s + d.card, 0);
  console.log(`카드매출 합계: ${fmt(cardTotal)}원 (${sales.length}일)`);

  // 2. 수수료 계산
  const commission = Math.round(cardTotal * COMMISSION_RATE);
  const commissionVat = Math.round(commission * VAT_RATE);
  const commissionTotal = commission + commissionVat;
  const settlementAmount = cardTotal - commissionTotal;

  console.log(`수수료 15%: ${fmt(commission)}원`);
  console.log(`수수료 부가세: ${fmt(commissionVat)}원`);
  console.log(`수수료 총액: ${fmt(commissionTotal)}원`);
  console.log(`입금금액(정산금액): ${fmt(settlementAmount)}원`);

  // 3. 25일 포함 여부 확인 → 임대료 + 공과금
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = endDate.slice(0, 7);
  const day25 = new Date(`${month}-25`);
  const includes25 = day25 >= start && day25 <= end;

  let rent = 0;
  let rentMonth = '';
  let utilities = null;

  if (includes25) {
    rent = RENT;
    rentMonth = month.replace('-', '.').slice(2);
    console.log(`\n25일 포함 → 임대료 ${fmt(rent)}원 차감`);

    utilities = await calcUtilities(month);
    console.log(`공과금: 전기 ${fmt(utilities.elec)} / 수도 ${fmt(utilities.water)} / 가스 ${fmt(utilities.gas)} / 태양광 ${fmt(utilities.solar)}`);
    console.log(`공과금 소계: ${fmt(utilities.total)}원`);
  }

  // 4. 잔금 계산
  let balance = settlementAmount;
  if (rent > 0) balance -= rent;
  if (utilities) balance -= utilities.total;
  if (misoo > 0) balance -= misoo;

  console.log(`\n미수 차감: ${misoo > 0 ? fmt(misoo) + '원' : '없음'}`);
  console.log(`잔금 (이체예정액): ${fmt(balance)}원`);

  // 5. 주차 계산
  const weekDay = parseInt(startDate.slice(8, 10));
  const weekNum = Math.ceil(weekDay / 7);

  // 6. 노션 저장
  const title = `미식가 ${month.slice(2).replace('-', '.')}월 ${weekNum}주차 정산`;
  console.log(`\n노션 저장 중...`);

  const result = await saveWeeklyToNotion(title, weekNum, {
    startDate, endDate, cardTotal, commission, commissionVat, commissionTotal,
    settlementAmount, rent, rentMonth, utilities, misoo, misooNote, balance,
  });

  if (result.id) {
    console.log(`✅ 정산표 저장 완료: ${result.url}`);
  } else {
    console.log('❌ 정산표 저장 실패:', JSON.stringify(result).slice(0, 200));
  }

  // 7. 주간정산 DB에 매출 요약 저장
  const weekLabel = `${month.slice(2).replace('-', '.')}월 ${weekNum}주차`;
  const period = `${startDate} ~ ${endDate}`;
  const dbResult = await saveWeeklyDB(weekLabel, period, sales);
  if (dbResult.id) {
    console.log(`✅ 주간정산 DB 저장 완료`);
  }
}

// ── 현금매출 정산 (매월 첫 평일) ──

async function cashSettlement(month) {
  console.log(`\n=== 미식가의주방 현금매출 정산 (${month}) ===\n`);

  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  const sales = await getSalesData(startDate, endDate);
  if (sales.length === 0) {
    console.log('해당 월 매출 데이터가 없습니다.');
    return;
  }

  const cashTotal = sales.reduce((s, d) => s + d.cash, 0);
  const cashReceiptTotal = sales.reduce((s, d) => s + d.cashReceipt, 0);
  const totalCash = cashTotal + cashReceiptTotal;

  console.log(`단순현금: ${fmt(cashTotal)}원`);
  console.log(`현금영수증: ${fmt(cashReceiptTotal)}원`);
  console.log(`현금매출 합계: ${fmt(totalCash)}원`);

  // 노션 저장
  const title = `미식가 ${month.slice(2).replace('-', '.')}월 현금매출 정산`;
  const result = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: PARENT_PAGE_ID },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children: [
      textBlock(`${month} 현금매출 정산`, true),
      tableBlock([
        tableRow(['항목', '금액']),
        tableRow(['단순현금', fmt(cashTotal)]),
        tableRow(['현금영수증', fmt(cashReceiptTotal)]),
        tableRow(['현금매출 합계', fmt(totalCash)]),
      ], 2),
    ]
  });

  if (result.id) {
    console.log(`\n✅ 저장 완료: ${result.url}`);
  } else {
    console.log('❌ 저장 실패:', JSON.stringify(result).slice(0, 200));
  }
}

// ── 메인 ──

async function main() {
  const mode = process.argv[2]; // weekly, cash

  if (mode === 'weekly') {
    const startDate = process.argv[3];
    const endDate = process.argv[4];
    if (!startDate || !endDate) {
      console.log('사용법: node misikga-settlement.js weekly 2026-03-23 2026-03-29 --misoo 2000000');
      return;
    }

    // --misoo 파라미터 파싱
    let misoo = 0;
    let misooNote = '';
    const misooIdx = process.argv.indexOf('--misoo');
    if (misooIdx !== -1 && process.argv[misooIdx + 1]) {
      misoo = parseInt(process.argv[misooIdx + 1]);
      misooNote = process.argv[misooIdx + 2] || `미수금 ${fmt(misoo)}원 차감`;
    }

    await weeklySettlement(startDate, endDate, misoo, misooNote);

  } else if (mode === 'cash') {
    const month = process.argv[3];
    if (!month) {
      console.log('사용법: node misikga-settlement.js cash 2026-03');
      return;
    }
    await cashSettlement(month);

  } else {
    console.log('미식가의주방 정산');
    console.log('');
    console.log('사용법:');
    console.log('  주간정산: node misikga-settlement.js weekly 시작일 종료일 [--misoo 금액]');
    console.log('  현금정산: node misikga-settlement.js cash 월');
    console.log('');
    console.log('예시:');
    console.log('  node misikga-settlement.js weekly 2026-03-23 2026-03-29 --misoo 2000000');
    console.log('  node misikga-settlement.js cash 2026-03');
  }
}

main().catch(console.error);
