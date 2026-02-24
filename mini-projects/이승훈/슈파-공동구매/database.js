// database.js — 데이터베이스 설정
// 비유: "장부를 준비하는 파일". 어떤 정보를 어떤 형식으로 기록할지 정해둡니다.

const Database = require('better-sqlite3');
const path = require('path');

// 데이터베이스 파일 생성 (이 파일에 모든 데이터가 저장됩니다)
const db = new Database(path.join(__dirname, 'shupa.db'));

// 성능 최적화 설정
db.pragma('journal_mode = WAL');

// ──────────────────────────────────────
// 테이블 만들기 (장부의 양식을 정하는 것)
// ──────────────────────────────────────

// 상품 테이블 — 시나리오 문서의 "상품 정보 구조"를 그대로 반영
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    volume TEXT NOT NULL,
    package_unit TEXT NOT NULL,
    price INTEGER NOT NULL,
    shipping_fee TEXT NOT NULL,
    supplier TEXT NOT NULL,
    order_deadline TEXT DEFAULT '15:00',
    market_price INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    status TEXT DEFAULT '판매중',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

// 기존 테이블에 image 컬럼이 없으면 추가 (업그레이드 호환)
try {
  db.exec(`ALTER TABLE products ADD COLUMN image TEXT DEFAULT ''`);
} catch (e) {
  // 이미 컬럼이 있으면 무시
}

module.exports = db;
