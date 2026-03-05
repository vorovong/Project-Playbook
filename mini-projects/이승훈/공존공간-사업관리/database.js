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

console.log('📁 데이터베이스 준비 완료 (gongzon.db)');

module.exports = db;
