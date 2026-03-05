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

// ── 서버 시작 ──
app.listen(PORT, () => {
  console.log(`🏢 공존공간 사업관리 도구가 시작되었습니다`);
  console.log(`📍 브라우저에서 열기: http://localhost:${PORT}`);
});
