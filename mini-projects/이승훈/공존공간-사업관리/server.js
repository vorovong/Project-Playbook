// ============================================
// 🏢 server.js — 공존공간 사업관리 서버 (주방 총괄)
// PDF 업로드, 사업 등록/조회/수정/삭제를 처리
// ============================================

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');
const { extractTextFromPDF } = require('./pdf-parser');

const app = express();
const PORT = 3001; // 슈파-공동구매(3000)와 겹치지 않게

// ── 기본 설정 ──
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── PDF 업로드 설정 ──
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public', 'uploads'),
  filename: (req, file, cb) => {
    // 파일명: 업로드시각_원본이름
    const uniqueName = Date.now() + '_' + Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB 제한 (PDF는 좀 클 수 있음)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드할 수 있습니다'));
    }
  }
});

// ============================================
// 📄 PDF 업로드 API
// ============================================

// PDF 업로드 + 텍스트 추출
app.post('/api/pdf/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PDF 파일을 선택해주세요' });
  }

  try {
    const filePath = req.file.path;
    const result = await extractTextFromPDF(filePath);

    // PDF 파일 정보를 DB에 저장
    const stmt = db.prepare(`
      INSERT INTO pdf_files (original_name, saved_name, file_path, extracted_text, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const info = stmt.run(
      originalName,
      req.file.filename,
      filePath,
      result.text,
      req.file.size
    );

    res.status(201).json({
      message: 'PDF 업로드 및 텍스트 추출 완료',
      pdfId: info.lastInsertRowid,
      fileName: originalName,
      pages: result.pages,
      textLength: result.text.length,
      textPreview: result.text.substring(0, 500) + (result.text.length > 500 ? '...' : '')
    });
  } catch (error) {
    console.error('PDF 처리 오류:', error);
    res.status(500).json({ error: 'PDF 텍스트 추출에 실패했습니다. 스캔된 이미지 PDF일 수 있습니다.' });
  }
});

// PDF의 전체 추출 텍스트 조회
app.get('/api/pdf/:id/text', (req, res) => {
  const pdf = db.prepare('SELECT * FROM pdf_files WHERE id = ?').get(req.params.id);
  if (!pdf) {
    return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
  }
  res.json({
    id: pdf.id,
    fileName: pdf.original_name,
    text: pdf.extracted_text,
    uploadedAt: pdf.uploaded_at
  });
});

// 업로드된 PDF 목록
app.get('/api/pdf', (req, res) => {
  const pdfs = db.prepare(`
    SELECT pf.id, pf.original_name, pf.file_size, pf.uploaded_at, pf.project_id,
           p.name as project_name,
           LENGTH(pf.extracted_text) as text_length
    FROM pdf_files pf
    LEFT JOIN projects p ON pf.project_id = p.id
    ORDER BY pf.uploaded_at DESC
  `).all();
  res.json(pdfs);
});

// PDF 삭제
app.delete('/api/pdf/:id', (req, res) => {
  const pdf = db.prepare('SELECT * FROM pdf_files WHERE id = ?').get(req.params.id);
  if (!pdf) {
    return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
  }

  // 파일 삭제
  try {
    if (fs.existsSync(pdf.file_path)) {
      fs.unlinkSync(pdf.file_path);
    }
  } catch (e) {
    console.error('파일 삭제 실패:', e);
  }

  // DB에서 삭제
  db.prepare('DELETE FROM pdf_files WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제 완료' });
});

// ============================================
// 🏗️ 사업(프로젝트) API
// ============================================

// 사업 등록
app.post('/api/projects', (req, res) => {
  const { name, type, status, start_date, end_date, budget, organization,
          summary, achievements, improvements, risks, notes, pdf_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: '사업명은 필수입니다' });
  }

  const stmt = db.prepare(`
    INSERT INTO projects (name, type, status, start_date, end_date, budget, organization,
                          summary, achievements, improvements, risks, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    name,
    type || '기타',
    status || '완료',
    start_date || null,
    end_date || null,
    budget || null,
    organization || null,
    summary || null,
    achievements || null,
    improvements || null,
    risks || null,
    notes || null
  );

  // PDF가 연결되어 있으면 PDF의 project_id 업데이트
  if (pdf_id) {
    db.prepare('UPDATE pdf_files SET project_id = ? WHERE id = ?').run(info.lastInsertRowid, pdf_id);
  }

  res.status(201).json({
    message: '사업 등록 완료',
    id: info.lastInsertRowid
  });
});

// 사업 목록 조회
app.get('/api/projects', (req, res) => {
  const { type, status } = req.query;

  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const projects = db.prepare(sql).all(...params);
  res.json(projects);
});

// 사업 상세 조회 (연결된 PDF 포함)
app.get('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '사업을 찾을 수 없습니다' });
  }

  // 연결된 PDF 파일 목록
  const pdfs = db.prepare('SELECT id, original_name, uploaded_at FROM pdf_files WHERE project_id = ?')
    .all(req.params.id);

  // 연결된 분석 결과 (Phase 2용)
  const analyses = db.prepare('SELECT id, analysis_type, created_at FROM analyses WHERE project_id = ?')
    .all(req.params.id);

  res.json({ ...project, pdfs, analyses });
});

// 사업 수정
app.put('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '사업을 찾을 수 없습니다' });
  }

  const { name, type, status, start_date, end_date, budget, organization,
          summary, achievements, improvements, risks, notes } = req.body;

  db.prepare(`
    UPDATE projects SET
      name = ?, type = ?, status = ?, start_date = ?, end_date = ?,
      budget = ?, organization = ?, summary = ?, achievements = ?,
      improvements = ?, risks = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    name || project.name,
    type || project.type,
    status || project.status,
    start_date !== undefined ? start_date : project.start_date,
    end_date !== undefined ? end_date : project.end_date,
    budget !== undefined ? budget : project.budget,
    organization !== undefined ? organization : project.organization,
    summary !== undefined ? summary : project.summary,
    achievements !== undefined ? achievements : project.achievements,
    improvements !== undefined ? improvements : project.improvements,
    risks !== undefined ? risks : project.risks,
    notes !== undefined ? notes : project.notes,
    req.params.id
  );

  res.json({ message: '수정 완료' });
});

// 사업 삭제
app.delete('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '사업을 찾을 수 없습니다' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제 완료' });
});

// PDF를 사업에 연결
app.post('/api/projects/:id/pdf', (req, res) => {
  const { pdf_id } = req.body;
  if (!pdf_id) {
    return res.status(400).json({ error: 'PDF ID가 필요합니다' });
  }

  db.prepare('UPDATE pdf_files SET project_id = ? WHERE id = ?').run(req.params.id, pdf_id);
  res.json({ message: 'PDF 연결 완료' });
});

// ============================================
// 📊 통계 API
// ============================================
app.get('/api/stats', (req, res) => {
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const totalPdfs = db.prepare('SELECT COUNT(*) as count FROM pdf_files').get().count;

  const byType = db.prepare(`
    SELECT type, COUNT(*) as count FROM projects GROUP BY type ORDER BY count DESC
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY count DESC
  `).all();

  res.json({ totalProjects, totalPdfs, byType, byStatus });
});

// ============================================
// 🏠 임차인 API
// ============================================

// 임차인 등록
app.post('/api/tenants', (req, res) => {
  const { name, location, contact_name, contact_phone, settlement_type,
          commission_card, commission_cash, monthly_rent,
          contract_start, contract_end, notes } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: '임차인명과 위치는 필수입니다' });
  }

  const stmt = db.prepare(`
    INSERT INTO tenants (name, location, contact_name, contact_phone, settlement_type,
                         commission_card, commission_cash, monthly_rent,
                         contract_start, contract_end, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    name, location, contact_name || null, contact_phone || null,
    settlement_type || 'commission',
    commission_card || 0, commission_cash || 0, monthly_rent || 0,
    contract_start || null, contract_end || null, notes || null
  );

  res.status(201).json({ message: '임차인 등록 완료', id: info.lastInsertRowid });
});

// 임차인 목록
app.get('/api/tenants', (req, res) => {
  const tenants = db.prepare(`
    SELECT t.*,
      (SELECT COALESCE(SUM(remaining), 0) FROM receivables WHERE tenant_id = t.id) as total_receivable
    FROM tenants t
    ORDER BY t.location, t.name
  `).all();
  res.json(tenants);
});

// 임차인 상세
app.get('/api/tenants/:id', (req, res) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: '임차인을 찾을 수 없습니다' });

  const settlements = db.prepare(
    'SELECT * FROM settlements WHERE tenant_id = ? ORDER BY period_start DESC LIMIT 12'
  ).all(req.params.id);

  const rentPayments = db.prepare(
    'SELECT * FROM rent_payments WHERE tenant_id = ? ORDER BY year DESC, month DESC LIMIT 12'
  ).all(req.params.id);

  const receivables = db.prepare(
    'SELECT * FROM receivables WHERE tenant_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  res.json({ ...tenant, settlements, rentPayments, receivables });
});

// 임차인 수정
app.put('/api/tenants/:id', (req, res) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: '임차인을 찾을 수 없습니다' });

  const { name, location, contact_name, contact_phone, settlement_type,
          commission_card, commission_cash, monthly_rent,
          contract_start, contract_end, status, notes } = req.body;

  db.prepare(`
    UPDATE tenants SET
      name = ?, location = ?, contact_name = ?, contact_phone = ?,
      settlement_type = ?, commission_card = ?, commission_cash = ?,
      monthly_rent = ?, contract_start = ?, contract_end = ?,
      status = ?, notes = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    name || tenant.name, location || tenant.location,
    contact_name !== undefined ? contact_name : tenant.contact_name,
    contact_phone !== undefined ? contact_phone : tenant.contact_phone,
    settlement_type || tenant.settlement_type,
    commission_card !== undefined ? commission_card : tenant.commission_card,
    commission_cash !== undefined ? commission_cash : tenant.commission_cash,
    monthly_rent !== undefined ? monthly_rent : tenant.monthly_rent,
    contract_start !== undefined ? contract_start : tenant.contract_start,
    contract_end !== undefined ? contract_end : tenant.contract_end,
    status || tenant.status,
    notes !== undefined ? notes : tenant.notes,
    req.params.id
  );

  res.json({ message: '수정 완료' });
});

// 임차인 삭제
app.delete('/api/tenants/:id', (req, res) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: '임차인을 찾을 수 없습니다' });
  db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제 완료' });
});

// ============================================
// 💰 정산 API
// ============================================

// 정산 등록
app.post('/api/settlements', (req, res) => {
  const { tenant_id, week_label, period_start, period_end,
          sales_card, sales_cash, expenses, expense_detail, notes } = req.body;

  if (!tenant_id || !period_start || !period_end) {
    return res.status(400).json({ error: '임차인, 기간은 필수입니다' });
  }

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenant_id);
  if (!tenant) return res.status(404).json({ error: '임차인을 찾을 수 없습니다' });

  const cardAmt = sales_card || 0;
  const cashAmt = sales_cash || 0;
  const totalSales = cardAmt + cashAmt;
  const expAmt = expenses || 0;

  let commissionAmt = 0;
  if (tenant.settlement_type === 'commission') {
    commissionAmt = Math.round(cardAmt * (tenant.commission_card / 100))
                  + Math.round(cashAmt * (tenant.commission_cash / 100));
  }

  const netAmt = totalSales - commissionAmt - expAmt;

  const stmt = db.prepare(`
    INSERT INTO settlements (tenant_id, week_label, period_start, period_end,
                             sales_card, sales_cash, sales_total,
                             commission_amount, expenses, expense_detail,
                             net_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    tenant_id, week_label || '', period_start, period_end,
    cardAmt, cashAmt, totalSales,
    commissionAmt, expAmt, expense_detail || null,
    netAmt, notes || null
  );

  res.status(201).json({ message: '정산 등록 완료', id: info.lastInsertRowid, net_amount: netAmt });
});

// 정산 목록 (임차인별)
app.get('/api/tenants/:id/settlements', (req, res) => {
  const { year, month } = req.query;
  let sql = 'SELECT * FROM settlements WHERE tenant_id = ?';
  const params = [req.params.id];

  if (year && month) {
    sql += " AND period_start >= ? AND period_start < ?";
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? `${parseInt(year)+1}-01-01` : `${year}-${String(parseInt(month)+1).padStart(2, '0')}-01`;
    params.push(start, nextMonth);
  }

  sql += ' ORDER BY period_start DESC';
  res.json(db.prepare(sql).all(...params));
});

// 정산 수금 처리
app.put('/api/settlements/:id/pay', (req, res) => {
  db.prepare(`
    UPDATE settlements SET is_paid = 1, paid_date = datetime('now', 'localtime') WHERE id = ?
  `).run(req.params.id);
  res.json({ message: '수금 처리 완료' });
});

// ============================================
// 🏦 월세 수금 API
// ============================================

// 월세 등록
app.post('/api/rent-payments', (req, res) => {
  const { tenant_id, year, month, rent_amount, maintenance_fee, utility_fee, notes } = req.body;

  if (!tenant_id || !year || !month) {
    return res.status(400).json({ error: '임차인, 연도, 월은 필수입니다' });
  }

  const rent = rent_amount || 0;
  const maint = maintenance_fee || 0;
  const util = utility_fee || 0;
  const total = rent + maint + util;

  const stmt = db.prepare(`
    INSERT INTO rent_payments (tenant_id, year, month, rent_amount, maintenance_fee,
                               utility_fee, total_due, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(tenant_id, year, month, rent, maint, util, total, notes || null);
  res.status(201).json({ message: '월세 등록 완료', id: info.lastInsertRowid });
});

// 월세 수금 처리
app.put('/api/rent-payments/:id/pay', (req, res) => {
  const { paid_amount } = req.body;
  const payment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: '찾을 수 없습니다' });

  const amt = paid_amount || payment.total_due;
  db.prepare(`
    UPDATE rent_payments SET paid_amount = ?, is_paid = 1, paid_date = datetime('now', 'localtime')
    WHERE id = ?
  `).run(amt, req.params.id);
  res.json({ message: '수금 처리 완료' });
});

// 월세 현황 (연도별)
app.get('/api/rent-payments', (req, res) => {
  const { year, tenant_id } = req.query;
  let sql = `
    SELECT rp.*, t.name as tenant_name, t.location
    FROM rent_payments rp
    JOIN tenants t ON rp.tenant_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (year) { sql += ' AND rp.year = ?'; params.push(year); }
  if (tenant_id) { sql += ' AND rp.tenant_id = ?'; params.push(tenant_id); }

  sql += ' ORDER BY rp.year DESC, rp.month DESC, t.name';
  res.json(db.prepare(sql).all(...params));
});

// ============================================
// 📊 통합 대시보드 API
// ============================================
app.get('/api/dashboard', (req, res) => {
  const totalTenants = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'").get().count;
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;

  // 이번 달 수금 현황
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const rentThisMonth = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) as paid,
           COALESCE(SUM(total_due), 0) as total_due,
           COALESCE(SUM(paid_amount), 0) as total_paid
    FROM rent_payments WHERE year = ? AND month = ?
  `).get(thisYear, thisMonth);

  // 총 미수금
  const totalReceivable = db.prepare('SELECT COALESCE(SUM(remaining), 0) as total FROM receivables').get().total;

  // 이번 달 정산 합계
  const monthStart = `${thisYear}-${String(thisMonth).padStart(2, '0')}-01`;
  const nextMonth = thisMonth === 12 ? `${thisYear+1}-01-01` : `${thisYear}-${String(thisMonth+1).padStart(2, '0')}-01`;
  const settlementThisMonth = db.prepare(`
    SELECT COALESCE(SUM(sales_total), 0) as total_sales,
           COALESCE(SUM(commission_amount), 0) as total_commission,
           COALESCE(SUM(net_amount), 0) as total_net
    FROM settlements WHERE period_start >= ? AND period_start < ?
  `).get(monthStart, nextMonth);

  // 임차인별 요약
  const tenantSummary = db.prepare(`
    SELECT t.id, t.name, t.location, t.settlement_type,
      (SELECT COALESCE(SUM(remaining), 0) FROM receivables WHERE tenant_id = t.id) as receivable,
      (SELECT COALESCE(SUM(sales_total), 0) FROM settlements
       WHERE tenant_id = t.id AND period_start >= ? AND period_start < ?) as month_sales
    FROM tenants t WHERE t.status = 'active'
    ORDER BY t.location, t.name
  `).all(monthStart, nextMonth);

  res.json({
    totalTenants, totalProjects, totalReceivable,
    rentThisMonth, settlementThisMonth, tenantSummary
  });
});

// ============================================
// 🔍 네이버 플레이스 순위 API
// ============================================

const configPath = path.join(__dirname, 'naver-rank-config.json');

function loadRankConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveRankConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

// 설정 조회
app.get('/api/naver-rank/config', (req, res) => {
  res.json(loadRankConfig());
});

// 업체 추가
app.post('/api/naver-rank/business', (req, res) => {
  const { name, location, category, keywords } = req.body;
  if (!name) return res.status(400).json({ error: '업체명은 필수입니다' });

  const config = loadRankConfig();
  const exists = config.businesses.find(b => b.name === name);
  if (exists) return res.status(409).json({ error: '이미 등록된 업체입니다' });

  config.businesses.push({
    name,
    location: location || '',
    category: category || '',
    keywords: keywords || [],
  });
  saveRankConfig(config);
  res.status(201).json({ message: '업체 추가 완료' });
});

// 업체 삭제
app.delete('/api/naver-rank/business/:name', (req, res) => {
  const config = loadRankConfig();
  config.businesses = config.businesses.filter(b => b.name !== req.params.name);
  saveRankConfig(config);
  res.json({ message: '삭제 완료' });
});

// 키워드 추가
app.post('/api/naver-rank/business/:name/keywords', (req, res) => {
  const { keywords } = req.body; // string[]
  if (!keywords || !keywords.length) return res.status(400).json({ error: '키워드를 입력하세요' });

  const config = loadRankConfig();
  const biz = config.businesses.find(b => b.name === req.params.name);
  if (!biz) return res.status(404).json({ error: '업체를 찾을 수 없습니다' });

  for (const kw of keywords) {
    if (!biz.keywords.includes(kw)) biz.keywords.push(kw);
  }
  saveRankConfig(config);
  res.json({ message: `${keywords.length}개 키워드 추가`, total: biz.keywords.length });
});

// 키워드 삭제
app.delete('/api/naver-rank/business/:name/keywords', (req, res) => {
  const { keywords } = req.body;
  const config = loadRankConfig();
  const biz = config.businesses.find(b => b.name === req.params.name);
  if (!biz) return res.status(404).json({ error: '업체를 찾을 수 없습니다' });

  biz.keywords = biz.keywords.filter(k => !keywords.includes(k));
  saveRankConfig(config);
  res.json({ message: '삭제 완료', total: biz.keywords.length });
});

// 키워드 자동 생성
app.post('/api/naver-rank/business/:name/auto-keywords', (req, res) => {
  const config = loadRankConfig();
  const biz = config.businesses.find(b => b.name === req.params.name);
  if (!biz) return res.status(404).json({ error: '업체를 찾을 수 없습니다' });

  const loc = biz.location || '';
  const cat = biz.category || '';

  // 주소에서 지역명 추출
  const parts = loc.replace(/\s+/g, ' ').split(' ');
  const areas = [];
  for (const p of parts) {
    const clean = p.replace(/(시|구|동|읍|면|리)$/, '');
    if (clean.length >= 1) areas.push(p.replace(/(시|구)$/, ''));
  }
  // 역 이름 추가 (동명 + 역)
  const dong = parts.find(p => p.endsWith('동'));
  const gu = parts.find(p => p.endsWith('구'));
  const city = parts.find(p => p.endsWith('시') || p.length <= 3);

  const bases = [...new Set([city, gu?.replace('구', ''), dong?.replace('동', ''), ...areas].filter(Boolean))];

  // 카테고리별 메뉴 키워드
  const menuMap = {
    '양식': ['파스타', '스테이크', '리조또', '브런치', '오므라이스'],
    '한식': ['한정식', '백반', '된장찌개', '비빔밥', '국밥'],
    '일식': ['초밥', '라멘', '돈카츠', '사시미', '우동'],
    '중식': ['짜장면', '짬뽕', '탕수육', '마라탕', '양꼬치'],
    '카페': ['카페', '커피', '디저트', '브런치', '케이크'],
    '퓨전': ['퓨전', '다이닝', '레스토랑', '비스트로'],
  };
  const menus = menuMap[cat] || ['맛집'];
  const situations = ['맛집', '데이트', '점심', '저녁', '모임', '회식', '레스토랑'];

  const generated = new Set();
  for (const base of bases) {
    for (const s of situations) generated.add(base + s);
    for (const m of menus) generated.add(base + m);
    generated.add(base + '맛집');
  }
  // 역 근처 키워드
  if (city) {
    generated.add(city + '역맛집');
    generated.add(city + '역' + (cat || '맛집'));
    for (const m of menus) generated.add(city + '역' + m);
    for (const s of situations) generated.add(city + '역' + s);
  }

  const newKeywords = [...generated].filter(k => !biz.keywords.includes(k));
  res.json({ generated: newKeywords, count: newKeywords.length });
});

// 검색 실행 (SSE 스트리밍)
app.get('/api/naver-rank/search', async (req, res) => {
  const { business } = req.query;
  const config = loadRankConfig();
  const biz = config.businesses.find(b => b.name === business);
  if (!biz) return res.status(404).json({ error: '업체를 찾을 수 없습니다' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const today = new Date().toLocaleDateString('sv-SE');
  const results = [];

  // totalCount 캡처용 리스너
  let searchVolume = 0;
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('allSearch') && url.includes('query')) {
      try {
        const json = await resp.json();
        if (json?.result?.place?.totalCount != null) {
          searchVolume = json.result.place.totalCount;
        }
      } catch {}
    }
  });

  for (let i = 0; i < biz.keywords.length; i++) {
    const kw = biz.keywords[i];
    let rank = -1;
    let total = 0;
    searchVolume = 0;

    try {
      await page.goto('https://map.naver.com/p/search/' + encodeURIComponent(kw), {
        waitUntil: 'networkidle2', timeout: 20000,
      });

      let frame;
      try {
        await page.waitForSelector('iframe#searchIframe', { timeout: 8000 });
        frame = await (await page.$('iframe#searchIframe')).contentFrame();
        await new Promise(r => setTimeout(r, 3500));
      } catch { frame = null; }

      if (frame) {
        const cls = await frame.evaluate(() => {
          const li = document.querySelector('li');
          if (!li) return null;
          const a = li.querySelector('a');
          if (!a) return null;
          const span = a.querySelector('span');
          return span ? span.className.split(' ')[0] : null;
        });

        if (cls) {
          for (let pg = 1; pg <= 5; pg++) {
            if (pg > 1) {
              const prevFirst = await frame.evaluate((c) => {
                const s = document.querySelector('span.' + c);
                return s ? s.textContent.trim() : '';
              }, cls);

              const clicked = await frame.evaluate((pn) => {
                for (const b of document.querySelectorAll('a, button')) {
                  if (b.textContent.trim() === String(pn)) { b.click(); return true; }
                }
                return false;
              }, pg);
              if (!clicked) break;

              for (let w = 0; w < 12; w++) {
                await new Promise(r => setTimeout(r, 400));
                const curr = await frame.evaluate((c) => {
                  const s = document.querySelector('span.' + c);
                  return s ? s.textContent.trim() : '';
                }, cls);
                if (curr && curr !== prevFirst) break;
              }
            }

            const names = await frame.evaluate((c) => {
              return Array.from(document.querySelectorAll('span.' + c)).map(e => e.textContent.trim());
            }, cls);

            let found = false;
            for (const name of names) {
              total++;
              if (name.includes(biz.name)) { rank = total; found = true; break; }
            }
            if (found) break;
          }
        }
      }
    } catch {}

    results.push({ keyword: kw, rank, total, searchVolume });
    res.write(`data: ${JSON.stringify({ index: i, keyword: kw, rank, searchVolume, done: false })}\n\n`);

    // 노션 저장
    try {
      const NOTION_API_KEY = process.env.NOTION_API_KEY;
      const RANK_DB = process.env.NOTION_RANK_DB || '336d0230-3dc0-81c9-a361-c3d6e4c9130b';
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: RANK_DB },
          properties: {
            '날짜': { title: [{ text: { content: today } }] },
            '키워드': { rich_text: [{ text: { content: kw } }] },
            '순위': { number: rank > 0 ? rank : null },
            '업체명': { rich_text: [{ text: { content: biz.name } }] },
            '총검색량': { number: searchVolume },
          },
        }),
      });
    } catch {}

    if (i < biz.keywords.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await browser.close();

  const ranked = results.filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
  res.write(`data: ${JSON.stringify({ done: true, results, ranked })}\n\n`);
  res.end();
});

// 업체 정보 네이버에서 자동 감지
app.post('/api/naver-rank/detect', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '업체명을 입력하세요' });

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto('https://map.naver.com/p/search/' + encodeURIComponent(name), {
      waitUntil: 'networkidle2', timeout: 20000,
    });
    await page.waitForSelector('iframe#searchIframe', { timeout: 10000 });
    const frame = await (await page.$('iframe#searchIframe')).contentFrame();
    await new Promise(r => setTimeout(r, 4000));

    const info = await frame.evaluate(() => {
      const text = document.body.innerText;
      return text.slice(0, 3000);
    });

    // 주소 추출 (시/구/동 패턴)
    const addrMatch = info.match(/([\uAC00-\uD7A3]+\s[\uAC00-\uD7A3]+구\s[\uAC00-\uD7A3]+동)/);
    const location = addrMatch ? addrMatch[1] : '';

    // 카테고리 추출 (업체명 바로 뒤 줄)
    const lines = info.split('\n').map(l => l.trim()).filter(Boolean);
    const cats = ['한식', '양식', '일식', '중식', '카페', '퓨전', '분식', '치킨', '피자',
      '퓨전음식', '고기', '해산물', '주점', '요리주점', '호프', '와인바', '이자카야',
      '막걸리', '전통주점', '소고기구이', '돼지고기구이', '곱창', '족발', '보쌈',
      '국밥', '냉면', '칼국수', '초밥', '라멘', '돈카츠', '짜장면', '짬뽕',
      '베이커리', '디저트', '브런치', '샐러드', '뷔페', '패스트푸드', '샌드위치',
      '태국음식', '베트남음식', '인도음식', '멕시코음식', '주류제조'];
    let category = '';
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const f = cats.find(c => lines[i] === c || lines[i].includes(c));
      if (f) { category = f; break; }
    }

    await browser.close();
    res.json({ name, location, category, found: !!location });
  } catch (e) {
    await browser.close();
    res.status(500).json({ error: '감지 실패: ' + e.message });
  }
});

// ── 서버 시작 ──
app.listen(PORT, () => {
  console.log(`🏢 공존공간 사업관리 도구가 시작되었습니다`);
  console.log(`📍 브라우저에서 열기: http://localhost:${PORT}`);
});
