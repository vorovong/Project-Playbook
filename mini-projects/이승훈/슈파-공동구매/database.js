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

// ──────────────────────────────────────
// 고객 테이블 — 카카오 챗봇으로 주문하는 고객 정보
// ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kakao_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

// ──────────────────────────────────────
// 주문 테이블 — 고객이 확정한 주문 건
// ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT '카드결제',
    status TEXT NOT NULL DEFAULT '접수',
    total_amount INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )
`);

// ──────────────────────────────────────
// 주문항목 테이블 — 주문 안에 들어있는 상품들
// 주문 당시 가격을 별도로 저장 (나중에 상품 가격이 바뀌어도 기록 보존)
// ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

// ──────────────────────────────────────
// 장바구니 테이블 — 채팅으로 상품을 하나씩 담을 때 임시 저장
// 주문 확정하면 order_items로 복사 후 장바구니를 비움
// ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

module.exports = db;
