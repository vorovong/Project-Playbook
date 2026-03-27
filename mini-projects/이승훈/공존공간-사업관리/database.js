// ============================================
// 📁 database.js — 사업관리 장부
// 공존공간의 모든 사업 정보를 보관하는 곳
// ============================================

const Database = require('better-sqlite3');
const path = require('path');

// 데이터베이스 파일 생성 (같은 폴더에 gongzon.db 파일이 만들어짐)
const db = new Database(path.join(__dirname, 'gongzon.db'));

// 성능 최적화 설정
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// 테이블 1: 사업 정보 (projects)
// 각 사업의 핵심 정보를 저장하는 표
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT '기타',
    status TEXT NOT NULL DEFAULT '진행중',
    start_date TEXT,
    end_date TEXT,
    budget TEXT,
    organization TEXT,
    summary TEXT,
    achievements TEXT,
    improvements TEXT,
    risks TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

// ============================================
// 테이블 2: PDF 파일 기록 (pdf_files)
// 업로드된 PDF 파일과 추출된 텍스트를 저장
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS pdf_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    original_name TEXT NOT NULL,
    saved_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    file_size INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  )
`);

// ============================================
// 테이블 3: AI 분석 결과 (analyses) — Phase 2에서 사용
// 분석 결과를 저장해서 재사용
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    analysis_type TEXT NOT NULL,
    result TEXT NOT NULL,
    model_used TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`);

// ============================================
// 테이블 4: 임차인 (tenants)
// 각 임차인의 기본 정보와 정산 방식
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    settlement_type TEXT NOT NULL DEFAULT 'commission',
    commission_card REAL DEFAULT 0,
    commission_cash REAL DEFAULT 0,
    monthly_rent INTEGER DEFAULT 0,
    contract_start TEXT,
    contract_end TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

// ============================================
// 테이블 5: 주간 정산 (settlements)
// 임차인별 주간 정산 기록
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    week_label TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    sales_card INTEGER DEFAULT 0,
    sales_cash INTEGER DEFAULT 0,
    sales_total INTEGER DEFAULT 0,
    commission_amount INTEGER DEFAULT 0,
    expenses INTEGER DEFAULT 0,
    expense_detail TEXT,
    net_amount INTEGER DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    paid_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  )
`);

// ============================================
// 테이블 6: 월세 수금 (rent_payments)
// 월별 월세/관리비 수금 추적
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS rent_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    rent_amount INTEGER DEFAULT 0,
    maintenance_fee INTEGER DEFAULT 0,
    utility_fee INTEGER DEFAULT 0,
    total_due INTEGER DEFAULT 0,
    paid_amount INTEGER DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    paid_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  )
`);

// ============================================
// 테이블 7: 미수금 (receivables)
// 임차인별 미수금 추적
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    weekly_deduction INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  )
`);

console.log('📁 데이터베이스 준비 완료 (gongzon.db)');

module.exports = db;
