// ============================================
// monthly-report.js — 월 운영현황 자동 생성
// 사용법: node monthly-report.js 2026-03
// ============================================

require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
const SALES_DB = process.env.NOTION_SALES_DB;
const UTILITY_DB = process.env.NOTION_UTILITY_DB;
const PHOTO_DB = process.env.NOTION_PHOTO_DB;
const PURCHASE_DB = process.env.NOTION_PURCHASE_DB;
const CLASS_DB = process.env.NOTION_CLASS_DB;
const PARENT_PAGE_ID = '337d0230-3dc0-81f0-85bc-c5112b56347f'; // 월정산 페이지 (공존공간 바로 아래)

const fmt = (n) => n.toLocaleString();

// ── 주차 기반 월 범위 계산 ──
// 규칙: 매월 1일이 속한 주의 월요일부터 시작 (1일이 일요일이면 다음 월요일)
// 4주(28일) = 해당 월, 나머지는 다음 달로 이월

function getMonthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const dow = first.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

  // 1일 기준 월요일 찾기: 일요일이면 +1, 나머지는 -(dow-1)
  const offset = dow === 0 ? 1 : -(dow - 1);
  const startDate = new Date(first.getTime() + offset * 86400000);
  const endDate = new Date(startDate.getTime() + 27 * 86400000); // 28일 (4주)

  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(startDate.getTime() + w * 7 * 86400000);
    const wEnd = new Date(wStart.getTime() + 6 * 86400000);
    weeks.push({ num: w + 1, start: toStr(wStart), end: toStr(wEnd) });
  }

  return { start: toStr(startDate), end: toStr(endDate), weeks };
}

// ── 고정값 설정 ──

const CONFIG = {
  인건비: {
    오피스: [
      { 이름: '박승현', 금액: 5_000_000 },
      { 이름: '엄수빈', 금액: 2_450_000 },
    ],
    재생전술: [
      { 이름: '박주진', 금액: 50_000 },
    ],
  },
  고정비: {
    대출이자: 1_695_556,
    정수기: 54_910,
    통신요금: 127_030,
    캡스: 121_000,
    기장료: 275_000,
    승강기보수료: 121_000,
  },
  임대료수익: 7_635_400,
  수수료: { 카드: 0.15, 현금: 0.13 },
  부가세율: 0.10,
  감가상각율: 0.02,
  포토인더박스_운영수수료율: 0.15,
  포토인더박스_임대료: 550_000,
};

// ── 노션 헬퍼 ──

async function notionPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function queryAll(dbId, filter) {
  const allResults = [];
  let hasMore = true;
  let startCursor;

  while (hasMore) {
    const body = { page_size: 100 };
    if (filter) body.filter = filter;
    if (startCursor) body.start_cursor = startCursor;

    const data = await notionPost(`https://api.notion.com/v1/databases/${dbId}/query`, body);
    allResults.push(...(data.results || []));
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }
  return allResults;
}

// ── 블록 헬퍼 ──

function heading2(content) {
  return {
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function heading3(content) {
  return {
    object: 'block', type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function text(content, bold = false) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content }, annotations: { bold } }] },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

function row(cells) {
  return {
    type: 'table_row',
    table_row: { cells: cells.map(c => [{ type: 'text', text: { content: String(c) } }]) },
  };
}

function table(rows, colCount) {
  return {
    object: 'block', type: 'table',
    table: { table_width: colCount, has_column_header: true, has_row_header: false, children: rows },
  };
}

// ── 데이터 수집 함수들 ──

// 1. 미식가의주방 매출
async function fetchMisikga(month, range) {
  // 주차 범위가 월 경계를 넘을 수 있으므로 관련 월 모두 조회
  const months = new Set();
  months.add(range.start.slice(0, 7));
  months.add(range.end.slice(0, 7));

  let allResults = [];
  for (const m of months) {
    const results = await queryAll(SALES_DB, { property: '일자', title: { starts_with: m } });
    allResults.push(...results);
  }

  const days = allResults.map(page => {
    const p = page.properties;
    return {
      date: p['일자']?.title?.[0]?.text?.content || '',
      총매출: p['총매출']?.number || 0,
      실매출: p['실매출']?.number || 0,
      총할인: p['총할인']?.number || 0,
      카드: p['신용카드']?.number || 0,
      현금: p['단순현금']?.number || 0,
      현금영수: p['현금영수']?.number || 0,
      영수건수: p['영수건수']?.number || 0,
      고객수: p['고객수']?.number || 0,
    };
  })
    .filter(d => d.date >= range.start && d.date <= range.end)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 주차별 그룹 (range.weeks 기준)
  const weeks = {};
  for (const w of range.weeks) {
    weeks[w.num] = { days: [], label: `${w.num}주차`, start: w.start, end: w.end };
  }
  for (const d of days) {
    for (const w of range.weeks) {
      if (d.date >= w.start && d.date <= w.end) {
        weeks[w.num].days.push(d);
        break;
      }
    }
  }

  const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);
  const 총매출 = sum(days, '총매출');
  const 실매출 = sum(days, '실매출');
  const 총할인 = sum(days, '총할인');
  const 카드합계 = sum(days, '카드');
  const 현금합계 = sum(days, '현금');
  const 현금영수합계 = sum(days, '현금영수');
  const 영수건수합계 = sum(days, '영수건수');

  // 수수료 계산
  const 카드수수료 = Math.round(카드합계 * CONFIG.수수료.카드);
  const 카드수수료부가세 = Math.round(카드수수료 * CONFIG.부가세율);
  const 카드수수료총액 = 카드수수료 + 카드수수료부가세;
  const 카드입금액 = 카드합계 - 카드수수료총액;

  const 현금총 = 현금합계 + 현금영수합계;
  const 현금수수료 = Math.round(현금총 * CONFIG.수수료.현금);
  const 현금수수료부가세 = Math.round(현금수수료 * CONFIG.부가세율);
  const 현금수수료총액 = 현금수수료 + 현금수수료부가세;

  const 수수료후입금 = 카드입금액 + 현금총 - 현금수수료총액;

  return {
    days, weeks, 총매출, 실매출, 총할인, 영수건수합계,
    카드합계, 현금합계, 현금영수합계, 현금총,
    카드수수료, 카드수수료부가세, 카드수수료총액, 카드입금액,
    현금수수료, 현금수수료부가세, 현금수수료총액,
    수수료후입금,
  };
}

// 2. 공과금
async function fetchUtilities(month) {
  const results = await queryAll(UTILITY_DB, { property: '청구월', rich_text: { equals: month } });

  const bills = {};
  for (const page of results) {
    const p = page.properties;
    const type = p['종류']?.select?.name || '';
    const room = p['호실']?.title?.[0]?.text?.content || '';
    const amount = p['청구금액']?.number || 0;
    const usage = p['사용량']?.number || 0;

    if (!bills[type]) bills[type] = [];
    bills[type].push({ room, amount, usage });
  }

  // 정산 비율 (2026-03까지 95%, 이후 100%)
  const rate = month <= '2026-03' ? 0.95 : 1.0;
  const rateLabel = rate === 1 ? '100%' : `${Math.round(rate * 100)}%`;

  // 고지서 원금액
  const gas = bills['가스'] || [];
  const water = bills['수도'] || [];
  const elecBasement = (bills['전기'] || []).filter(b => b.room.includes('지하'));
  const elecCommon = (bills['전기'] || []).filter(b => b.room.includes('공용'));

  const 가스_고지서 = gas.reduce((s, b) => s + b.amount, 0);
  const 수도_고지서 = water.reduce((s, b) => s + b.amount, 0);
  const 전기_지하_고지서 = elecBasement.reduce((s, b) => s + b.amount, 0);
  const 전기_지하_사용량 = elecBasement.reduce((s, b) => s + b.usage, 0);
  const 전기_공용_고지서 = elecCommon.reduce((s, b) => s + b.amount, 0);

  // 태양광 (전월 발전량)
  const [y, m] = month.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const solarResults = await queryAll(UTILITY_DB, {
    and: [
      { property: '청구월', rich_text: { equals: prevMonth } },
      { property: '종류', select: { equals: '태양광' } },
    ]
  });
  const 태양광발전량 = solarResults.length > 0 ? (solarResults[0].properties['사용량']?.number || 0) : 0;
  const 단가 = 전기_지하_사용량 > 0 ? 전기_지하_고지서 / 전기_지하_사용량 : 0;
  const 태양광절감액 = Math.round(태양광발전량 * 단가);

  // 정산 금액 (rate 적용)
  const 가스비 = Math.round(가스_고지서 * rate);
  const 전기_지하 = Math.round((전기_지하_고지서 + 태양광절감액) * rate);
  const 전기_공용 = Math.round(전기_공용_고지서 * rate);
  const 전기세 = 전기_지하 + 전기_공용;
  const 수도세 = Math.round(수도_고지서 * rate);
  const 합계 = 가스비 + 전기세 + 수도세;

  return {
    가스비, 수도세, 전기세, 합계, rate, rateLabel,
    // 상세 (공과금 시트용)
    가스_고지서, 수도_고지서,
    전기_지하_고지서, 전기_지하, 전기_공용_고지서, 전기_공용,
    태양광절감액, 태양광발전량, 단가, 전기_지하_사용량,
    prevMonth,
  };
}

// 3. 포토인더박스
async function fetchPhoto(month) {
  const results = await queryAll(PHOTO_DB, { property: '월', title: { equals: month } });

  if (results.length === 0) {
    const empty = { 수량: 0, 단가: 0, 금액: 0 };
    return {
      부스: [], 총매출: 0, 카드합계: 0, 현금합계: 0,
      재고: { 필름: { ...empty }, 캡슐: { ...empty }, 봉투: { ...empty } },
      사용: { 필름: { ...empty }, 캡슐: { ...empty }, 봉투: { ...empty } },
    };
  }

  const p = results[0].properties;
  const booths = [1, 2, 3, 4].map(n => ({
    번호: n,
    카드: p[`${n}번부스_카드`]?.number || 0,
    현금: p[`${n}번부스_현금`]?.number || 0,
  }));
  booths.forEach(b => b.합계 = b.카드 + b.현금);

  const 카드합계 = booths.reduce((s, b) => s + b.카드, 0);
  const 현금합계 = booths.reduce((s, b) => s + b.현금, 0);
  const 총매출 = 카드합계 + 현금합계;

  const 재고 = {
    필름: { 수량: p['필름_재고']?.number || 0, 단가: p['필름_단가']?.number || 0 },
    캡슐: { 수량: p['캡슐_재고']?.number || 0, 단가: 0 },
    봉투: { 수량: p['봉투_재고']?.number || 0, 단가: 0 },
  };
  재고.필름.금액 = 재고.필름.수량 * 재고.필름.단가;

  const 사용 = {
    필름: { 수량: p['필름_사용']?.number || 0, 단가: p['필름_단가']?.number || 0 },
    캡슐: { 수량: p['캡슐_사용']?.number || 0, 단가: 0 },
    봉투: { 수량: p['봉투_사용']?.number || 0, 단가: 0 },
  };
  사용.필름.금액 = 사용.필름.수량 * 사용.필름.단가;

  return { 부스: booths, 총매출, 카드합계, 현금합계, 재고, 사용 };
}

// 4. 구매내역
async function fetchPurchases(month) {
  const results = await queryAll(PURCHASE_DB, {
    property: '일자', date: { on_or_after: `${month}-01` },
  });

  // 월 범위 필터
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  const items = results.map(page => {
    const p = page.properties;
    return {
      품목: p['품목']?.title?.[0]?.text?.content || '',
      일자: p['일자']?.date?.start || '',
      금액: p['금액']?.number || 0,
      배송비: p['배송비']?.number || 0,
      구분: p['구분']?.select?.name || '',
      채널: p['채널']?.select?.name || '',
    };
  }).filter(d => d.일자 <= endDate);

  // 채널별 합산
  const byChannel = {};
  const byPart = {};
  for (const item of items) {
    const ch = item.채널 || '기타';
    const pt = item.구분 || '기타';
    byChannel[ch] = (byChannel[ch] || 0) + item.금액 + item.배송비;
    byPart[pt] = (byPart[pt] || 0) + item.금액 + item.배송비;
  }

  const 합계 = items.reduce((s, d) => s + d.금액 + d.배송비, 0);

  return { items, byChannel, byPart, 합계 };
}

// 5. 재생전술
async function fetchClasses(month) {
  const results = await queryAll(CLASS_DB, {
    property: '날짜', date: { on_or_after: `${month}-01` },
  });

  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  const classes = results.map(page => {
    const p = page.properties;
    return {
      이름: p['클래스명']?.title?.[0]?.text?.content || '',
      날짜: p['날짜']?.date?.start || '',
      유형: p['유형']?.select?.name || '',
      플랫폼: p['플랫폼']?.select?.name || '',
      인원: p['인원']?.number || 0,
      판매가격: p['판매가격']?.number || 0,
      정산수수료: p['정산수수료']?.number || 0,
      정산금액: p['정산금액']?.number || 0,
      재료비_인당: p['재료비_인당']?.number || 0,
      강사비: p['강사비']?.number || 0,
    };
  }).filter(d => d.날짜 <= endDate);

  let 총매출 = 0, 총정산금액 = 0, 총재료비 = 0, 총강사비 = 0;
  for (const c of classes) {
    총매출 += c.판매가격;
    총정산금액 += c.정산금액 || c.판매가격;
    총재료비 += c.재료비_인당 * c.인원;
    총강사비 += c.강사비;
  }

  return { classes, 총매출, 총정산금액, 총재료비, 총강사비, 순이익: 총정산금액 - 총재료비 - 총강사비 };
}

// ── 서브페이지 생성 헬퍼 ──

async function createSubPage(parentId, title, blocks) {
  const firstBatch = blocks.slice(0, 100);
  const result = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: parentId },
    properties: { title: { title: [{ text: { content: title } }] } },
    children: firstBatch,
  });

  if (result.id && blocks.length > 100) {
    for (let i = 100; i < blocks.length; i += 100) {
      await fetch(`https://api.notion.com/v1/blocks/${result.id}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children: blocks.slice(i, i + 100) }),
      });
    }
  }
  return result;
}

// ── 각 시트별 블록 생성 ──

function build월결산(month, misikga, utilities, photo, purchases, classes) {
  const 인건비합계 = Object.values(CONFIG.인건비).flat().reduce((s, p) => s + p.금액, 0);
  const 고정비합계 = Object.values(CONFIG.고정비).reduce((s, v) => s + v, 0);

  const 포토_운영수수료 = Math.round(photo.총매출 * CONFIG.포토인더박스_운영수수료율);
  const 포토_재고차이 = photo.사용.필름.금액 > 0 ? photo.사용.필름.금액 - photo.재고.필름.금액 : 0;
  const 포토_순매출 = photo.총매출 - 포토_운영수수료 - CONFIG.포토인더박스_임대료 - 포토_재고차이;

  const 재생전술구매 = purchases.byPart['재생전술'] || 0;
  const 미식가_수수료수입 = misikga.카드수수료총액 + misikga.현금수수료총액;

  const 총매출 = 미식가_수수료수입 + photo.총매출 + classes.총매출;
  const 부가세 = Math.round(총매출 * CONFIG.부가세율);
  const 카드수수료_전체 = Math.round(총매출 * 0.013);
  const 감가상각 = Math.round(총매출 * CONFIG.감가상각율);
  const 기타지출 = CONFIG.고정비.캡스;

  const 총지출 = 인건비합계 + utilities.합계 + 고정비합계 + purchases.합계 + 감가상각;
  const 순매출 = 총매출 - 부가세 - 카드수수료_전체 - 기타지출;
  const 순이익 = 순매출 - 총지출;

  const label = month.slice(2).replace('-', '.');
  const blocks = [];

  // 월 결산 요약
  blocks.push(heading2(`${label}월 결산`));
  blocks.push(table([
    row(['매출', '', '지출', '']),
    row(['총 매출', fmt(총매출), '총 지출', fmt(총지출)]),
    row(['*임대료 매출 제외', '', '', '']),
    row(['부가세(10%)', fmt(부가세), '전기세', fmt(utilities.전기세)]),
    row(['카드수수료(1.3%)', fmt(카드수수료_전체), '가스비', fmt(utilities.가스비)]),
    row(['기타지출', fmt(기타지출), '수도세', fmt(utilities.수도세)]),
    row(['순 매출액', fmt(순매출), '임대료', '0']),
    row(['', '', '대출이자', fmt(CONFIG.고정비.대출이자)]),
    row(['', '', '감가상각(실매출 2%)', fmt(감가상각)]),
    row(['전체 인건비', `${fmt(인건비합계)} (${총매출 > 0 ? (인건비합계 / 총매출 * 100).toFixed(1) : 0}%)`, '', '']),
    row(['순이익', fmt(순이익), '', '']),
  ], 4));

  blocks.push(divider());

  // 부문별 상세 (원본 구글시트 형식)
  blocks.push(divider());

  // 오피스 (미식가의주방)
  blocks.push(table([
    row(['내용', '', '금액', '내용', '금액']),
    row(['오피스', '매출 (미식가의주방)', fmt(미식가_수수료수입), '인건비', fmt(인건비합계)]),
    row(['', '', '', '사업비 지출', '0']),
    row(['', '', '', '온라인 구매', '0']),
    row(['', '', '', '오프라인 구매', '0']),
    row(['', '순 매출액', fmt(미식가_수수료수입 - 인건비합계), '합계', fmt(인건비합계)]),
  ], 5));

  // 포토인더박스
  blocks.push(table([
    row(['포토인더박스', '매출', fmt(photo.총매출), `운영수수료(15%)`, fmt(포토_운영수수료)]),
    row(['', '', '', '임대료', fmt(CONFIG.포토인더박스_임대료)]),
    row(['', '', '', '온/오프라인 구매', '0']),
    row(['', '', '', '이월 재고자산', fmt(photo.사용.필름.금액)]),
    row(['', '', '', '금월 재고자산', fmt(photo.재고.필름.금액)]),
    row(['', '순 매출액', fmt(포토_순매출), '합계', fmt(포토_운영수수료 + CONFIG.포토인더박스_임대료 + 포토_재고차이)]),
  ], 5));

  // 재생전술
  blocks.push(table([
    row(['재생전술 (워크샵,소규모)', '매출', fmt(classes.총매출), '강의 재료비', fmt(classes.총재료비)]),
    row(['', '', '', '막걸리 재료비', '0']),
    row(['', '', '', '인건비', fmt(classes.총강사비)]),
    row(['', '', '', '오프라인 구매', '0']),
    row(['', '', '', '온라인 구매', fmt(재생전술구매)]),
    row(['', '순 매출액', fmt(classes.순이익 - 재생전술구매), '합계', fmt(classes.총재료비 + classes.총강사비 + 재생전술구매)]),
  ], 5));

  blocks.push(divider());

  // 임대료수익 + 기타수익 + 고정비
  blocks.push(table([
    row(['임대료수익', fmt(CONFIG.임대료수익)]),
    row(['기타수익', '0']),
    row(['기타지출', fmt(기타지출)]),
    row(['정수기 임대료', fmt(CONFIG.고정비.정수기)]),
    row(['통신요금', fmt(CONFIG.고정비.통신요금)]),
    row(['캡스', fmt(CONFIG.고정비.캡스)]),
    row(['기장료', fmt(CONFIG.고정비.기장료)]),
    row(['승강기보수료', fmt(CONFIG.고정비.승강기보수료)]),
  ], 2));

  return blocks;
}

function build미식가총매출(month, misikga) {
  const blocks = [];
  const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);

  // 월 요약
  blocks.push(table([
    row(['항목', '금액']),
    row(['총매출', fmt(misikga.총매출)]),
    row(['총할인', fmt(misikga.총할인)]),
    row(['실매출', fmt(misikga.실매출)]),
    row(['영수건수', fmt(misikga.영수건수합계)]),
    row(['카드매출', fmt(misikga.카드합계)]),
    row(['현금매출 (단순+영수)', fmt(misikga.현금총)]),
  ], 2));

  blocks.push(divider());

  // 수수료 계산
  blocks.push(heading2('수수료 계산'));
  blocks.push(table([
    row(['구분', '총매출', '수수료', '부가세', '수수료총액', '입금액']),
    row(['카드(15%)', fmt(misikga.카드합계), fmt(misikga.카드수수료), fmt(misikga.카드수수료부가세), fmt(misikga.카드수수료총액), fmt(misikga.카드입금액)]),
    row(['현금(13%)', fmt(misikga.현금총), fmt(misikga.현금수수료), fmt(misikga.현금수수료부가세), fmt(misikga.현금수수료총액), '']),
  ], 6));

  blocks.push(divider());

  // 주차별 매출
  const weekNums = Object.keys(misikga.weeks).sort();
  for (const wn of weekNums) {
    const w = misikga.weeks[wn];
    blocks.push(heading2(`${w.label}`));

    const dayRows = [row(['일자', '요일', '총매출', '총할인', '실매출', '카드', '현금', '현금영수', '영수건수'])];
    for (const d of w.days) {
      const date = d.date;
      const dayOfWeek = ['일','월','화','수','목','금','토'][new Date(date).getDay()];
      dayRows.push(row([
        date, dayOfWeek, fmt(d.총매출), fmt(d.총할인), fmt(d.실매출),
        fmt(d.카드), fmt(d.현금), fmt(d.현금영수), d.영수건수,
      ]));
    }
    dayRows.push(row([
      '합계', '', fmt(sum(w.days, '총매출')), fmt(sum(w.days, '총할인')),
      fmt(sum(w.days, '실매출')), fmt(sum(w.days, '카드')),
      fmt(sum(w.days, '현금')), fmt(sum(w.days, '현금영수')),
      sum(w.days, '영수건수'),
    ]));
    blocks.push(table(dayRows, 9));
  }

  return blocks;
}

function build미식가공과금(month, utilities) {
  const label = month.slice(2).replace('-', '.');
  const blocks = [];

  blocks.push(heading2(`미식가의 주방_공과금 정산_${label}월`));

  // 원본 형식: 내역 | 총액 | 정산% 금액 | 날짜/구분 | 고지서 금액
  blocks.push(table([
    row(['내역', '총액', `${utilities.rateLabel} 금액`, '날짜/구분', '고지서 금액']),
    row(['가스비', fmt(utilities.가스비), fmt(utilities.가스비), '', fmt(utilities.가스_고지서)]),
    row(['전기세', fmt(utilities.전기세), fmt(utilities.전기_지하), '지하', fmt(utilities.전기_지하_고지서)]),
    row(['', '', '', '태양광', fmt(utilities.태양광절감액)]),
    row(['', '', fmt(utilities.전기_공용), '공용', fmt(utilities.전기_공용_고지서)]),
    row(['수도세', fmt(utilities.수도세), fmt(utilities.수도세), '', fmt(utilities.수도_고지서)]),
    row([`${month.slice(5)}월 공과금 합계`, `₩${fmt(utilities.합계)}`, '', '', '']),
  ], 5));

  return blocks;
}

function build포토인더박스(month, photo) {
  const blocks = [];

  if (photo.부스.length > 0) {
    // 부스별 카드매출
    blocks.push(heading2('카드 매출'));
    const cardRows = [row(['부스', '금액'])];
    for (const b of photo.부스) cardRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.카드)}`]));
    blocks.push(table(cardRows, 2));

    // 부스별 현금매출
    blocks.push(heading2('현금 매출'));
    const cashRows = [row(['부스', '금액'])];
    for (const b of photo.부스) cashRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.현금)}`]));
    blocks.push(table(cashRows, 2));

    // 부스별 총매출
    blocks.push(heading2('총 매출'));
    const totalRows = [row(['부스', '금액'])];
    for (const b of photo.부스) totalRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.합계)}`]));
    totalRows.push(row(['합계', `₩${fmt(photo.총매출)}`]));
    blocks.push(table(totalRows, 2));

    blocks.push(divider());

    // 정산
    const 운영수수료 = Math.round(photo.총매출 * CONFIG.포토인더박스_운영수수료율);
    const 재고차이 = photo.사용.필름.금액 > 0 ? photo.사용.필름.금액 - photo.재고.필름.금액 : 0;
    const 순매출 = photo.총매출 - 운영수수료 - CONFIG.포토인더박스_임대료 - 재고차이;

    blocks.push(heading2('정산'));
    blocks.push(table([
      row(['수입 내용', '금액', '지출 내용', '금액']),
      row(['매출', fmt(photo.총매출), '인건비', '0']),
      row(['', '', '오프라인 구매', '0']),
      row(['', '', '온라인 구매', '0']),
      row(['', '', '이월 재고자산', fmt(photo.사용.필름.금액)]),
      row(['', '', '금월 재고자산', fmt(photo.재고.필름.금액)]),
      row(['순 매출액', fmt(순매출), '합계', fmt(재고차이)]),
    ], 4));

    blocks.push(divider());

    // 재고
    blocks.push(heading2('재고'));
    blocks.push(table([
      row(['품목', '수량', '금액']),
      row(['필름', photo.재고.필름.수량, `₩${fmt(photo.재고.필름.금액)}`]),
      row(['꽃가루 캡슐', photo.재고.캡슐.수량, '₩0']),
      row(['포장봉투', photo.재고.봉투.수량, '₩0']),
    ], 3));

    // 사용량
    blocks.push(heading2('사용량'));
    blocks.push(table([
      row(['품목', '수량', '금액']),
      row(['필름', photo.사용.필름.수량, `₩${fmt(photo.사용.필름.금액)}`]),
      row(['꽃가루 캡슐', photo.사용.캡슐.수량, '₩0']),
      row(['포장봉투', photo.사용.봉투.수량, '₩0']),
    ], 3));
  } else {
    blocks.push(text('데이터 없음'));
  }

  return blocks;
}

function build인건비() {
  const 인건비합계 = Object.values(CONFIG.인건비).flat().reduce((s, p) => s + p.금액, 0);
  const laborRows = [row(['소속', '이름', '금액', '비고'])];
  for (const [dept, members] of Object.entries(CONFIG.인건비)) {
    for (const m of members) {
      laborRows.push(row([dept, m.이름, `₩${fmt(m.금액)}`, '공존예산 지출']));
    }
  }
  laborRows.push(row(['합계', '', `₩${fmt(인건비합계)}`, '']));

  return [
    heading2('인건비 세부 내역'),
    table(laborRows, 4),
  ];
}

function build구매내역(purchases) {
  const blocks = [];

  // 온라인
  blocks.push(heading2('온라인 구매'));
  const online = purchases.items.filter(d => d.채널 !== '오프라인');
  if (online.length > 0) {
    const onRows = [row(['일자', '금액', '배송비', '품목', '구분'])];
    for (const item of online) {
      onRows.push(row([item.일자, fmt(item.금액), fmt(item.배송비), item.품목, item.구분]));
    }
    blocks.push(table(onRows, 5));
  } else {
    blocks.push(text('없음'));
  }

  blocks.push(divider());

  // 오프라인
  blocks.push(heading2('오프라인 영수증'));
  const offline = purchases.items.filter(d => d.채널 === '오프라인');
  if (offline.length > 0) {
    const offRows = [row(['날짜', '금액', '구매내역', '파트', '구매처'])];
    for (const item of offline) {
      offRows.push(row([item.일자, fmt(item.금액), item.품목, item.구분, '']));
    }
    blocks.push(table(offRows, 5));
  } else {
    blocks.push(text('없음'));
  }

  blocks.push(divider());

  // 파트별 합산
  blocks.push(heading2('파트별 합산'));
  const partRows = [row(['파트', '금액'])];
  for (const [part, amount] of Object.entries(purchases.byPart)) {
    partRows.push(row([part, fmt(amount)]));
  }
  partRows.push(row(['합계', `₩${fmt(purchases.합계)}`]));
  blocks.push(table(partRows, 2));

  return blocks;
}

function build재생전술(classes) {
  const blocks = [];

  // 워크샵
  const workshops = classes.classes.filter(c => c.유형 === '워크샵');
  blocks.push(heading2('워크샵'));
  if (workshops.length > 0) {
    for (const c of workshops) {
      const 재료비총 = c.재료비_인당 * c.인원;
      const 이익 = (c.정산금액 || c.판매가격) - 재료비총 - c.강사비;
      const 이익률 = (c.정산금액 || c.판매가격) > 0 ? (이익 / (c.정산금액 || c.판매가격) * 100).toFixed(1) : '0';

      blocks.push(heading3(`${c.이름} (${c.날짜})`));
      blocks.push(table([
        row(['날짜', '플랫폼', '인원', '결제여부', '진행여부']),
        row([c.날짜, c.플랫폼, c.인원, '', 'O']),
      ], 5));
      blocks.push(table([
        row(['구분', '인원', '판매가격']),
        row([c.플랫폼 === '유선예약' ? '기업' : c.플랫폼, c.인원, fmt(c.판매가격)]),
      ], 3));
      blocks.push(table([
        row(['재료비(인당)', '인원', '총 재료비', '영업이익', '이익률']),
        row([fmt(c.재료비_인당), c.인원, fmt(재료비총), fmt(이익), `${이익률}%`]),
      ], 5));
    }
  } else {
    blocks.push(text('없음'));
  }

  blocks.push(divider());

  // 소규모
  const smalls = classes.classes.filter(c => c.유형 === '소규모');
  blocks.push(heading2('소규모'));
  if (smalls.length > 0) {
    for (const c of smalls) {
      const 재료비총 = c.재료비_인당 * c.인원;
      const 이익 = (c.정산금액 || c.판매가격) - 재료비총 - c.강사비;
      blocks.push(heading3(`${c.이름} (${c.날짜})`));
      blocks.push(table([
        row(['플랫폼', '인원', '판매가격', '정산수수료', '정산금액']),
        row([c.플랫폼, c.인원, fmt(c.판매가격), fmt(c.정산수수료), fmt(c.정산금액 || c.판매가격)]),
      ], 5));
    }
  } else {
    blocks.push(text('없음'));
  }

  return blocks;
}

// ── 메인 ──

async function main() {
  const month = process.argv[2];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.log('사용법: node monthly-report.js 2026-03');
    return;
  }

  const label = month.slice(2).replace('-', '.');
  const range = getMonthRange(month);
  console.log(`\n=== ${label}월 운영현황 생성 ===`);
  console.log(`   기간: ${range.start} ~ ${range.end} (4주)\n`);

  // 데이터 수집
  console.log('1. 미식가의주방 매출 조회...');
  const misikga = await fetchMisikga(month, range);
  console.log(`   실매출: ${fmt(misikga.실매출)}원 (${misikga.days.length}일)`);

  console.log('2. 공과금 조회...');
  const utilities = await fetchUtilities(month);
  console.log(`   합계: ${fmt(utilities.합계)}원`);

  console.log('3. 포토인더박스 조회...');
  const photo = await fetchPhoto(month);
  console.log(`   총매출: ${fmt(photo.총매출)}원`);

  console.log('4. 구매내역 조회...');
  const purchases = await fetchPurchases(month);
  console.log(`   합계: ${fmt(purchases.합계)}원 (${purchases.items.length}건)`);

  console.log('5. 재생전술 조회...');
  const classes = await fetchClasses(month);
  console.log(`   총매출: ${fmt(classes.총매출)}원 (${classes.classes.length}건)`);

  // ── 부모 페이지 생성: "26.03월 운영현황" ──
  console.log('\n페이지 생성 중...');
  const mainBlocks = build월결산(month, misikga, utilities, photo, purchases, classes);
  const mainPage = await createSubPage(PARENT_PAGE_ID, `${label}월 운영현황`, mainBlocks);

  if (!mainPage.id) {
    console.log('❌ 메인 페이지 생성 실패:', JSON.stringify(mainPage).slice(0, 300));
    return;
  }
  console.log(`✅ ${label}월 운영현황 (월 결산)`);

  // ── 서브페이지들 생성 ──
  const parentId = mainPage.id;

  const r1 = await createSubPage(parentId, `미식가의주방 (${label} 총매출)`, build미식가총매출(month, misikga));
  console.log(`  ${r1.id ? '✅' : '❌'} 미식가의주방 총매출`);

  const r2 = await createSubPage(parentId, `미식가의주방 공과금`, build미식가공과금(month, utilities));
  console.log(`  ${r2.id ? '✅' : '❌'} 미식가의주방 공과금`);

  const r3 = await createSubPage(parentId, `포토인더박스 (${label})`, build포토인더박스(month, photo));
  console.log(`  ${r3.id ? '✅' : '❌'} 포토인더박스`);

  const r4 = await createSubPage(parentId, '인건비', build인건비());
  console.log(`  ${r4.id ? '✅' : '❌'} 인건비`);

  const r5 = await createSubPage(parentId, '구매내역', build구매내역(purchases));
  console.log(`  ${r5.id ? '✅' : '❌'} 구매내역`);

  const r6 = await createSubPage(parentId, '재생전술', build재생전술(classes));
  console.log(`  ${r6.id ? '✅' : '❌'} 재생전술`);

  console.log(`\n✅ 완료! ${mainPage.url}`);

  // 요약
  const 미식가_수수료 = misikga.카드수수료총액 + misikga.현금수수료총액;
  console.log(`\n=== 요약 ===`);
  console.log(`  미식가 수수료 수입: ${fmt(미식가_수수료)}원`);
  console.log(`  포토인더박스: ${fmt(photo.총매출)}원`);
  console.log(`  재생전술: ${fmt(classes.총매출)}원`);
  console.log(`  임대료수익: ${fmt(CONFIG.임대료수익)}원`);
}

main().catch(console.error);
