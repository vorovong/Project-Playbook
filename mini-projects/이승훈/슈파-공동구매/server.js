// server.js — 서버 메인 파일
// 비유: "주방 총괄". 모든 요청을 받아서 적절한 곳으로 전달하고 결과를 돌려줍니다.

const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./database');

// 이미지 업로드 설정 — 상품 사진을 public/uploads 폴더에 저장
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public', 'uploads'),
  filename: (req, file, cb) => {
    // 파일명: 시간_원본이름 (중복 방지)
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 최대 5MB
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다'));
    }
  }
});

const app = express();
const PORT = 3000;

// ──────────────────────────────────────
// 기본 설정
// ──────────────────────────────────────

// JSON 데이터를 받을 수 있게 설정 (API 요청용)
app.use(express.json());

// public 폴더의 파일들을 서빙 (관리자 화면 HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ──────────────────────────────────────
// 상품 API — 전달 창구 (시나리오 1: 상품 등록/관리)
// ──────────────────────────────────────

// 상품 목록 조회
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// 상품 1개 조회
app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  }
  res.json(product);
});

// 상품 등록 (이미지 포함)
app.post('/api/products', upload.single('image'), (req, res) => {
  const { name, volume, package_unit, price, shipping_fee, supplier, order_deadline, market_price } = req.body;

  // 필수 항목 확인
  if (!name || !volume || !package_unit || !price || !shipping_fee || !supplier) {
    return res.status(400).json({ error: '필수 항목을 모두 입력해주세요' });
  }

  // 이미지가 있으면 경로 저장, 없으면 빈 문자열
  const image = req.file ? '/uploads/' + req.file.filename : '';

  const result = db.prepare(`
    INSERT INTO products (name, volume, package_unit, price, shipping_fee, supplier, order_deadline, market_price, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, volume, package_unit, parseInt(price), shipping_fee, supplier, order_deadline || '15:00', parseInt(market_price) || 0, image);

  const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newProduct);
});

// 상품 수정 (이미지 포함)
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const { name, volume, package_unit, price, shipping_fee, supplier, order_deadline, market_price, status } = req.body;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  }

  // 새 이미지가 올라오면 교체, 아니면 기존 유지
  const image = req.file ? '/uploads/' + req.file.filename : existing.image;

  db.prepare(`
    UPDATE products SET
      name = ?, volume = ?, package_unit = ?, price = ?,
      shipping_fee = ?, supplier = ?, order_deadline = ?,
      market_price = ?, image = ?, status = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    name || existing.name,
    volume || existing.volume,
    package_unit || existing.package_unit,
    parseInt(price) || existing.price,
    shipping_fee || existing.shipping_fee,
    supplier || existing.supplier,
    order_deadline || existing.order_deadline,
    parseInt(market_price) || existing.market_price,
    image,
    status || existing.status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// 상품 삭제
app.delete('/api/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제되었습니다' });
});

// ──────────────────────────────────────
// 서버 시작
// ──────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 슈파 공동구매 관리 서버가 시작되었습니다!');
  console.log(`📍 관리자 화면: http://localhost:${PORT}`);
  console.log('');
  console.log('서버를 끄려면 Ctrl+C 를 누르세요.');
});
