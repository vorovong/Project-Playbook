// businesses/gongzon/sheets.js — 공존공간 시트 빌더
// 새 업체: 시트 구성에 맞게 수정

const { heading2, heading3, text, divider, row, table, fmt } = require('../../lib/blocks');

function build월결산(config, month, data) {
  const { misikga, utilities, photo, purchases, classes } = data;
  const 인건비합계 = Object.values(config.인건비).flat().reduce((s, p) => s + p.금액, 0);
  const 고정비합계 = Object.values(config.고정비).reduce((s, v) => s + v, 0);

  const 포토_운영수수료 = Math.round(photo.총매출 * config.포토인더박스_운영수수료율);
  const 포토_재고차이 = photo.사용.필름.금액 > 0 ? photo.사용.필름.금액 - photo.재고.필름.금액 : 0;
  const 포토_순매출 = photo.총매출 - 포토_운영수수료 - config.포토인더박스_임대료 - 포토_재고차이;

  const 재생전술구매 = purchases.byPart['재생전술'] || 0;
  const 미식가_수수료수입 = misikga.카드수수료총액 + misikga.현금수수료총액;

  const 총매출 = 미식가_수수료수입 + photo.총매출 + classes.총매출;
  const 부가세 = Math.round(총매출 * config.부가세율);
  const 카드수수료_전체 = Math.round(총매출 * 0.013);
  const 감가상각 = Math.round(총매출 * config.감가상각율);
  const 기타지출 = config.고정비.캡스;

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
    row(['', '', '대출이자', fmt(config.고정비.대출이자)]),
    row(['', '', '감가상각(실매출 2%)', fmt(감가상각)]),
    row(['전체 인건비', `${fmt(인건비합계)} (${총매출 > 0 ? (인건비합계 / 총매출 * 100).toFixed(1) : 0}%)`, '', '']),
    row(['순이익', fmt(순이익), '', '']),
  ], 4));

  blocks.push(divider());
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
    row(['', '', '', '임대료', fmt(config.포토인더박스_임대료)]),
    row(['', '', '', '온/오프라인 구매', '0']),
    row(['', '', '', '이월 재고자산', fmt(photo.사용.필름.금액)]),
    row(['', '', '', '금월 재고자산', fmt(photo.재고.필름.금액)]),
    row(['', '순 매출액', fmt(포토_순매출), '합계', fmt(포토_운영수수료 + config.포토인더박스_임대료 + 포토_재고차이)]),
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

  // 임대료수익 + 고정비
  blocks.push(table([
    row(['임대료수익', fmt(config.임대료수익)]),
    row(['기타수익', '0']),
    row(['기타지출', fmt(기타지출)]),
    row(['정수기 임대료', fmt(config.고정비.정수기)]),
    row(['통신요금', fmt(config.고정비.통신요금)]),
    row(['캡스', fmt(config.고정비.캡스)]),
    row(['기장료', fmt(config.고정비.기장료)]),
    row(['승강기보수료', fmt(config.고정비.승강기보수료)]),
  ], 2));

  return blocks;
}

function build미식가총매출(config, month, data) {
  const { misikga } = data;
  const blocks = [];
  const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);

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

  blocks.push(heading2('수수료 계산'));
  blocks.push(table([
    row(['구분', '총매출', '수수료', '부가세', '수수료총액', '입금액']),
    row(['카드(15%)', fmt(misikga.카드합계), fmt(misikga.카드수수료), fmt(misikga.카드수수료부가세), fmt(misikga.카드수수료총액), fmt(misikga.카드입금액)]),
    row(['현금(13%)', fmt(misikga.현금총), fmt(misikga.현금수수료), fmt(misikga.현금수수료부가세), fmt(misikga.현금수수료총액), '']),
  ], 6));

  blocks.push(divider());

  const weekNums = Object.keys(misikga.weeks).sort();
  for (const wn of weekNums) {
    const w = misikga.weeks[wn];
    blocks.push(heading2(`${w.label}`));

    const dayRows = [row(['일자', '요일', '총매출', '총할인', '실매출', '카드', '현금', '현금영수', '영수건수'])];
    for (const d of w.days) {
      const dayOfWeek = ['일','월','화','수','목','금','토'][new Date(d.date).getDay()];
      dayRows.push(row([
        d.date, dayOfWeek, fmt(d.총매출), fmt(d.총할인), fmt(d.실매출),
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

function build미식가공과금(config, month, data) {
  const { utilities } = data;
  const label = month.slice(2).replace('-', '.');

  return [
    heading2(`미식가의 주방_공과금 정산_${label}월`),
    table([
      row(['내역', '총액', `${utilities.rateLabel} 금액`, '날짜/구분', '고지서 금액']),
      row(['가스비', fmt(utilities.가스비), fmt(utilities.가스비), '', fmt(utilities.가스_고지서)]),
      row(['전기세', fmt(utilities.전기세), fmt(utilities.전기_지하), '지하', fmt(utilities.전기_지하_고지서)]),
      row(['', '', '', '태양광', fmt(utilities.태양광절감액)]),
      row(['', '', fmt(utilities.전기_공용), '공용', fmt(utilities.전기_공용_고지서)]),
      row(['수도세', fmt(utilities.수도세), fmt(utilities.수도세), '', fmt(utilities.수도_고지서)]),
      row([`${month.slice(5)}월 공과금 합계`, `₩${fmt(utilities.합계)}`, '', '', '']),
    ], 5),
  ];
}

function build포토인더박스(config, month, data) {
  const { photo } = data;
  const blocks = [];

  if (photo.부스.length > 0) {
    blocks.push(heading2('카드 매출'));
    const cardRows = [row(['부스', '금액'])];
    for (const b of photo.부스) cardRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.카드)}`]));
    blocks.push(table(cardRows, 2));

    blocks.push(heading2('현금 매출'));
    const cashRows = [row(['부스', '금액'])];
    for (const b of photo.부스) cashRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.현금)}`]));
    blocks.push(table(cashRows, 2));

    blocks.push(heading2('총 매출'));
    const totalRows = [row(['부스', '금액'])];
    for (const b of photo.부스) totalRows.push(row([`${b.번호}번 부스`, `₩${fmt(b.합계)}`]));
    totalRows.push(row(['합계', `₩${fmt(photo.총매출)}`]));
    blocks.push(table(totalRows, 2));

    blocks.push(divider());

    const 운영수수료 = Math.round(photo.총매출 * config.포토인더박스_운영수수료율);
    const 재고차이 = photo.사용.필름.금액 > 0 ? photo.사용.필름.금액 - photo.재고.필름.금액 : 0;
    const 순매출 = photo.총매출 - 운영수수료 - config.포토인더박스_임대료 - 재고차이;

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

    blocks.push(heading2('재고'));
    blocks.push(table([
      row(['품목', '수량', '금액']),
      row(['필름', photo.재고.필름.수량, `₩${fmt(photo.재고.필름.금액)}`]),
      row(['꽃가루 캡슐', photo.재고.캡슐.수량, '₩0']),
      row(['포장봉투', photo.재고.봉투.수량, '₩0']),
    ], 3));

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

function build인건비(config, month, data) {
  const 인건비합계 = Object.values(config.인건비).flat().reduce((s, p) => s + p.금액, 0);
  const laborRows = [row(['소속', '이름', '금액', '비고'])];
  for (const [dept, members] of Object.entries(config.인건비)) {
    for (const m of members) {
      laborRows.push(row([dept, m.이름, `₩${fmt(m.금액)}`, '공존예산 지출']));
    }
  }
  laborRows.push(row(['합계', '', `₩${fmt(인건비합계)}`, '']));

  return [heading2('인건비 세부 내역'), table(laborRows, 4)];
}

function build구매내역(config, month, data) {
  const { purchases } = data;
  const blocks = [];

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

  blocks.push(heading2('파트별 합산'));
  const partRows = [row(['파트', '금액'])];
  for (const [part, amount] of Object.entries(purchases.byPart)) {
    partRows.push(row([part, fmt(amount)]));
  }
  partRows.push(row(['합계', `₩${fmt(purchases.합계)}`]));
  blocks.push(table(partRows, 2));

  return blocks;
}

function build재생전술(config, month, data) {
  const { classes } = data;
  const blocks = [];

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

  const smalls = classes.classes.filter(c => c.유형 === '소규모');
  blocks.push(heading2('소규모'));
  if (smalls.length > 0) {
    for (const c of smalls) {
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

// 시트 목록 (오케스트레이터가 순서대로 생성)
module.exports = {
  // 메인 페이지 (월 결산)
  mainSheet: { build: build월결산 },
  // 서브페이지들
  subSheets: [
    { key: 'misikga-sales', title: (label) => `미식가의주방 (${label} 총매출)`, build: build미식가총매출 },
    { key: 'misikga-utility', title: () => '미식가의주방 공과금', build: build미식가공과금 },
    { key: 'photo', title: (label) => `포토인더박스 (${label})`, build: build포토인더박스 },
    { key: 'labor', title: () => '인건비', build: build인건비 },
    { key: 'purchase', title: () => '구매내역', build: build구매내역 },
    { key: 'class', title: () => '재생전술', build: build재생전술 },
  ],
};
