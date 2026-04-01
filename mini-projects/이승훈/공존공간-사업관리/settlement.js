// ============================================
// settlement.js — 월별 공과금 정산표 생성
// 노션 공과금 DB → 정산표 계산 → 노션 페이지 저장
// 사용법: node settlement.js 2026-03
// ============================================

require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_UTILITY_DB;
const PARENT_PAGE_ID = '334d0230-3dc0-81c8-ada2-eb1ef4e3be45'; // 공과금 페이지

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

async function queryNotion(body) {
  return notionPost(`https://api.notion.com/v1/databases/${DB_ID}/query`, body);
}

function parseBills(data) {
  return (data.results || []).map(page => {
    const p = page.properties;
    return {
      room: p['호실']?.title?.[0]?.text?.content || '',
      month: p['청구월']?.rich_text?.[0]?.text?.content || '',
      type: p['종류']?.select?.name || '',
      usage: p['사용량']?.number || 0,
      amount: p['청구금액']?.number || 0,
    };
  });
}

function prevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getRate(month) {
  return month <= '2026-03' ? 0.95 : 1.0;
}

const fmt = (n) => n.toLocaleString();

// 노션 블록 헬퍼
function textBlock(content) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content } }]
    }
  };
}

function headingBlock(content) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content } }]
    }
  };
}

function tableRow(cells) {
  return {
    type: 'table_row',
    table_row: {
      cells: cells.map(c => [{ type: 'text', text: { content: String(c) } }])
    }
  };
}

function tableBlock(rows, colCount) {
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: colCount,
      has_column_header: true,
      has_row_header: false,
      children: rows
    }
  };
}

function dividerBlock() {
  return { object: 'block', type: 'divider', divider: {} };
}

async function saveToNotion(month, rateLabel, data) {
  const { gasAmount, gasSettled, elecBasementAmount, solarSavings, elecBasementSettled,
    elecCommonAmount, elecCommonSettled, elecTotal, waterAmount, waterSettled,
    total, solarMonth, solarGeneration, pricePerKwh, elecBasementUsage } = data;

  const title = `${month.replace('-', '.')}월 공과금 정산`;

  // 정산표 테이블
  const settlementTable = tableBlock([
    tableRow(['내역', '총액', `${rateLabel} 금액`, '구분', '고지서 금액']),
    tableRow(['가스비', fmt(gasSettled), fmt(gasSettled), '', fmt(gasAmount)]),
    tableRow(['전기세', fmt(elecTotal), fmt(elecBasementSettled), '지하', fmt(elecBasementAmount)]),
    tableRow(['', '', '', '태양광', fmt(solarSavings)]),
    tableRow(['', '', fmt(elecCommonSettled), '공용', fmt(elecCommonAmount)]),
    tableRow(['수도세', fmt(waterSettled), fmt(waterSettled), '', fmt(waterAmount)]),
    tableRow([`${month.slice(5)}월 공과금 합계`, `₩${fmt(total)}`, '', '', '']),
  ], 5);

  // 계산 과정
  const calcText = [
    `태양광: ${solarMonth} 발전량 ${fmt(solarGeneration)} kWh × ${pricePerKwh.toFixed(2)}원/kWh = ${fmt(solarSavings)}원`,
    `  kWh당 = 지하 고지금액 ${fmt(elecBasementAmount)} ÷ 사용량 ${fmt(elecBasementUsage)} = ${pricePerKwh.toFixed(2)}원`,
    `가스: ${fmt(gasAmount)} × ${rateLabel} = ${fmt(gasSettled)}`,
    `전기(지하): (${fmt(elecBasementAmount)} + ${fmt(solarSavings)}) × ${rateLabel} = ${fmt(elecBasementSettled)}`,
    `전기(공용): ${fmt(elecCommonAmount)} × ${rateLabel} = ${fmt(elecCommonSettled)}`,
    `수도: ${fmt(waterAmount)} × ${rateLabel} = ${fmt(waterSettled)}`,
  ].join('\n');

  const result = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: PARENT_PAGE_ID },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children: [
      settlementTable,
      dividerBlock(),
      headingBlock('계산 과정'),
      textBlock(calcText),
    ]
  });

  return result;
}

async function main() {
  let month = process.argv[2];
  if (!month) {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }

  const rate = getRate(month);
  const rateLabel = rate === 1 ? '100%' : `${Math.round(rate * 100)}%`;
  const solarMonth = prevMonth(month);

  // 해당 월 공과금 조회
  const billsData = await queryNotion({
    filter: { property: '청구월', rich_text: { equals: month } },
  });
  const bills = parseBills(billsData);

  // 전월 태양광 발전량 조회
  const solarData = await queryNotion({
    filter: {
      and: [
        { property: '청구월', rich_text: { equals: solarMonth } },
        { property: '종류', select: { equals: '태양광' } },
      ]
    }
  });
  const solarBills = parseBills(solarData);
  const solarGeneration = solarBills.length > 0 ? solarBills[0].usage : 0;

  if (bills.length === 0) {
    console.log(`${month} 공과금 데이터가 없습니다.`);
    return;
  }

  // 분류
  const gas = bills.filter(b => b.type === '가스');
  const water = bills.filter(b => b.type === '수도');
  const elecBasement = bills.filter(b => b.type === '전기' && b.room.includes('지하'));
  const elecCommon = bills.filter(b => b.type === '전기' && b.room.includes('공용'));

  // 고지서 금액
  const gasAmount = gas.reduce((s, b) => s + b.amount, 0);
  const waterAmount = water.reduce((s, b) => s + b.amount, 0);
  const elecBasementAmount = elecBasement.reduce((s, b) => s + b.amount, 0);
  const elecBasementUsage = elecBasement.reduce((s, b) => s + b.usage, 0);
  const elecCommonAmount = elecCommon.reduce((s, b) => s + b.amount, 0);

  // 태양광 절감액 계산
  const pricePerKwh = elecBasementUsage > 0 ? elecBasementAmount / elecBasementUsage : 0;
  const solarSavings = Math.round(solarGeneration * pricePerKwh);

  // 정산 계산
  const gasSettled = Math.round(gasAmount * rate);
  const elecBasementSettled = Math.round((elecBasementAmount + solarSavings) * rate);
  const elecCommonSettled = Math.round(elecCommonAmount * rate);
  const elecTotal = elecBasementSettled + elecCommonSettled;
  const waterSettled = Math.round(waterAmount * rate);
  const total = gasSettled + elecTotal + waterSettled;

  // 콘솔 출력
  console.log(`\n========================================`);
  console.log(`  ${month.replace('-', '.')}월 공과금 정산 (${rateLabel})`);
  console.log(`========================================\n`);

  const pad = (s, len) => s.padStart(len);
  console.log(`내역            총액        ${rateLabel} 금액      구분        고지서 금액`);
  console.log(`─────────────────────────────────────────────────────────────────`);
  console.log(`가스비      ${pad(fmt(gasSettled), 10)}    ${pad(fmt(gasSettled), 10)}                  ${pad(fmt(gasAmount), 10)}`);
  console.log(`전기세      ${pad(fmt(elecTotal), 10)}    ${pad(fmt(elecBasementSettled), 10)}    지하        ${pad(fmt(elecBasementAmount), 10)}`);
  console.log(`                                            태양광      ${pad(fmt(solarSavings), 10)}`);
  console.log(`                        ${pad(fmt(elecCommonSettled), 10)}    공용        ${pad(fmt(elecCommonAmount), 10)}`);
  console.log(`수도세      ${pad(fmt(waterSettled), 10)}    ${pad(fmt(waterSettled), 10)}                  ${pad(fmt(waterAmount), 10)}`);
  console.log(`─────────────────────────────────────────────────────────────────`);
  console.log(`합계        ${pad('₩' + fmt(total), 10)}`);

  // 노션 저장
  console.log('\n노션 저장 중...');
  const result = await saveToNotion(month, rateLabel, {
    gasAmount, gasSettled, elecBasementAmount, solarSavings, elecBasementSettled,
    elecCommonAmount, elecCommonSettled, elecTotal, waterAmount, waterSettled,
    total, solarMonth, solarGeneration, pricePerKwh, elecBasementUsage,
  });

  if (result.id) {
    console.log(`✅ 노션 저장 완료: ${result.url}`);
  } else {
    console.log('❌ 노션 저장 실패:', JSON.stringify(result).slice(0, 200));
  }
}

main().catch(console.error);
