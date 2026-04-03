// businesses/gongzon/collectors.js — 공존공간 데이터 수집
// 새 업체: POS/메일/DB 구조에 맞게 수정

const { queryAll } = require('../../lib/notion');

// 1. 미식가의주방 매출 (OKPOS → 노션 DB)
async function fetchMisikga(config, month, range) {
  const months = new Set();
  months.add(range.start.slice(0, 7));
  months.add(range.end.slice(0, 7));

  let allResults = [];
  for (const m of months) {
    const results = await queryAll(config.db.sales, { property: '일자', title: { starts_with: m } });
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

  // 주차별 그룹
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

  const 카드수수료 = Math.round(카드합계 * config.수수료.카드);
  const 카드수수료부가세 = Math.round(카드수수료 * config.부가세율);
  const 카드수수료총액 = 카드수수료 + 카드수수료부가세;
  const 카드입금액 = 카드합계 - 카드수수료총액;

  const 현금총 = 현금합계 + 현금영수합계;
  const 현금수수료 = Math.round(현금총 * config.수수료.현금);
  const 현금수수료부가세 = Math.round(현금수수료 * config.부가세율);
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
async function fetchUtilities(config, month) {
  const results = await queryAll(config.db.utility, { property: '청구월', rich_text: { equals: month } });

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

  const rate = month <= '2026-03' ? 0.95 : 1.0;
  const rateLabel = rate === 1 ? '100%' : `${Math.round(rate * 100)}%`;

  const gas = bills['가스'] || [];
  const water = bills['수도'] || [];
  const elecBasement = (bills['전기'] || []).filter(b => b.room.includes('지하'));
  const elecCommon = (bills['전기'] || []).filter(b => b.room.includes('공용'));

  const 가스_고지서 = gas.reduce((s, b) => s + b.amount, 0);
  const 수도_고지서 = water.reduce((s, b) => s + b.amount, 0);
  const 전기_지하_고지서 = elecBasement.reduce((s, b) => s + b.amount, 0);
  const 전기_지하_사용량 = elecBasement.reduce((s, b) => s + b.usage, 0);
  const 전기_공용_고지서 = elecCommon.reduce((s, b) => s + b.amount, 0);

  // 태양광
  const [y, m] = month.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const solarResults = await queryAll(config.db.utility, {
    and: [
      { property: '청구월', rich_text: { equals: prevMonth } },
      { property: '종류', select: { equals: '태양광' } },
    ]
  });
  const 태양광발전량 = solarResults.length > 0 ? (solarResults[0].properties['사용량']?.number || 0) : 0;
  const 단가 = 전기_지하_사용량 > 0 ? 전기_지하_고지서 / 전기_지하_사용량 : 0;
  const 태양광절감액 = Math.round(태양광발전량 * 단가);

  const 가스비 = Math.round(가스_고지서 * rate);
  const 전기_지하 = Math.round((전기_지하_고지서 + 태양광절감액) * rate);
  const 전기_공용 = Math.round(전기_공용_고지서 * rate);
  const 전기세 = 전기_지하 + 전기_공용;
  const 수도세 = Math.round(수도_고지서 * rate);
  const 합계 = 가스비 + 전기세 + 수도세;

  return {
    가스비, 수도세, 전기세, 합계, rate, rateLabel,
    가스_고지서, 수도_고지서,
    전기_지하_고지서, 전기_지하, 전기_공용_고지서, 전기_공용,
    태양광절감액, 태양광발전량, 단가, 전기_지하_사용량,
    prevMonth,
  };
}

// 3. 포토인더박스
async function fetchPhoto(config, month) {
  const results = await queryAll(config.db.photo, { property: '월', title: { equals: month } });

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
async function fetchPurchases(config, month) {
  const results = await queryAll(config.db.purchase, {
    property: '일자', date: { on_or_after: `${month}-01` },
  });

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
async function fetchClasses(config, month) {
  const results = await queryAll(config.db.class, {
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

// 수집 함수 목록 (오케스트레이터가 순서대로 실행)
module.exports = {
  collectors: [
    { key: 'misikga', label: '미식가의주방 매출', fn: fetchMisikga, needsRange: true },
    { key: 'utilities', label: '공과금', fn: fetchUtilities },
    { key: 'photo', label: '포토인더박스', fn: fetchPhoto },
    { key: 'purchases', label: '구매내역', fn: fetchPurchases },
    { key: 'classes', label: '재생전술', fn: fetchClasses },
  ],
};
