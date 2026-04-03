// businesses/gongzon/config.js — 공존공간 설정값
// 새 업체: 이 파일을 복사해서 값만 바꾸면 됨

module.exports = {
  name: '공존공간',
  parentPageId: '337d0230-3dc0-81f0-85bc-c5112b56347f', // 월정산 페이지

  // 노션 DB ID (.env에서 가져옴)
  db: {
    sales: process.env.NOTION_SALES_DB,
    utility: process.env.NOTION_UTILITY_DB,
    photo: process.env.NOTION_PHOTO_DB,
    purchase: process.env.NOTION_PURCHASE_DB,
    class: process.env.NOTION_CLASS_DB,
  },

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
