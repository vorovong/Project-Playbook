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
// 카카오 스킬 API — 챗봇이 호출하는 API
// 모두 /api/kakao/ 아래에 배치
// ──────────────────────────────────────

// 주문번호 생성 함수 (SH-20260225-001 형식)
function generateOrderNumber() {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  // 오늘 주문 건수 조회
  const count = db.prepare(
    "SELECT COUNT(*) as cnt FROM orders WHERE order_number LIKE ?"
  ).get(`SH-${dateStr}-%`);

  const seq = String((count.cnt || 0) + 1).padStart(3, '0');
  return `SH-${dateStr}-${seq}`;
}

// 1) 상품 목록 (챗봇 카드형)
app.post('/api/kakao/products', (req, res) => {
  const products = db.prepare(
    "SELECT * FROM products WHERE status = '판매중' ORDER BY name"
  ).all();

  const items = products.map(p => ({
    title: p.name,
    description: `${p.volume} (${p.package_unit}) — ${p.price.toLocaleString()}원`,
    thumbnail: { imageUrl: p.image || '' },
    buttons: [
      {
        action: 'message',
        label: '주문하기',
        messageText: `${p.name} 주문`
      }
    ]
  }));

  res.json({
    version: '2.0',
    template: {
      outputs: [{
        carousel: {
          type: 'basicCard',
          items: items.length > 0 ? items : [{
            title: '현재 판매중인 상품이 없습니다',
            description: '곧 새로운 상품이 등록될 예정입니다!'
          }]
        }
      }]
    }
  });
});

// 2) 고객 등록 여부 확인
app.post('/api/kakao/customer/check', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;
  if (!kakaoId) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '사용자 정보를 확인할 수 없습니다.' } }]
      }
    });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE kakao_id = ?').get(kakaoId);

  if (customer) {
    res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: `${customer.name}님, 안녕하세요! 주문을 시작할게요.` } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' },
          { action: 'message', label: '장바구니 보기', messageText: '장바구니 보기' }
        ]
      }
    });
  } else {
    res.json({
      version: '2.0',
      template: {
        outputs: [{
          simpleText: {
            text: '처음 주문하시는군요! 배송을 위해 정보를 등록해주세요.\n\n아래 형식으로 입력해주세요:\n등록 홍길동 010-1234-5678 서울시 강남구 123'
          }
        }]
      }
    });
  }
});

// 3) 신규 고객 등록
app.post('/api/kakao/customer/register', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;
  const utterance = req.body.userRequest?.utterance || '';

  // "등록 이름 연락처 주소" 형식 파싱
  const match = utterance.match(/^등록\s+(\S+)\s+(\S+)\s+(.+)$/);

  if (!match) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{
          simpleText: {
            text: '형식이 맞지 않아요. 아래처럼 입력해주세요:\n등록 홍길동 010-1234-5678 서울시 강남구 123'
          }
        }]
      }
    });
  }

  const [, name, phone, address] = match;

  try {
    db.prepare(
      'INSERT INTO customers (kakao_id, name, phone, address) VALUES (?, ?, ?, ?)'
    ).run(kakaoId, name, phone, address);

    res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: `${name}님, 등록이 완료되었습니다! 이제 주문하실 수 있어요.` } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' }
        ]
      }
    });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      res.json({
        version: '2.0',
        template: {
          outputs: [{ simpleText: { text: '이미 등록된 고객입니다. 바로 주문하실 수 있어요!' } }],
          quickReplies: [
            { action: 'message', label: '상품 보기', messageText: '상품 보기' }
          ]
        }
      });
    } else {
      res.json({
        version: '2.0',
        template: {
          outputs: [{ simpleText: { text: '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' } }]
        }
      });
    }
  }
});

// 4) 장바구니에 상품 추가
app.post('/api/kakao/cart/add', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;
  const utterance = req.body.userRequest?.utterance || '';

  const customer = db.prepare('SELECT * FROM customers WHERE kakao_id = ?').get(kakaoId);
  if (!customer) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '먼저 고객 등록이 필요합니다.' } }],
        quickReplies: [
          { action: 'message', label: '주문하기', messageText: '주문하기' }
        ]
      }
    });
  }

  // "상품명 수량박스" 형식 파싱 (예: "청송 사과 3박스" 또는 "청송 사과 3")
  const match = utterance.match(/^(.+?)\s+(\d+)\s*(?:박스|개)?$/);
  if (!match) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{
          simpleText: { text: '상품명과 수량을 입력해주세요.\n예: 청송 사과 3박스' }
        }]
      }
    });
  }

  const [, productName, quantityStr] = match;
  const quantity = parseInt(quantityStr);

  const product = db.prepare(
    "SELECT * FROM products WHERE name LIKE ? AND status = '판매중'"
  ).get(`%${productName.trim()}%`);

  if (!product) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: `"${productName}" 상품을 찾을 수 없습니다. 상품명을 다시 확인해주세요.` } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' }
        ]
      }
    });
  }

  // 이미 장바구니에 같은 상품이 있으면 수량 합산
  const existing = db.prepare(
    'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?'
  ).get(customer.id, product.id);

  if (existing) {
    db.prepare(
      'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
    ).run(quantity, existing.id);
  } else {
    db.prepare(
      'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)'
    ).run(customer.id, product.id, quantity);
  }

  const subtotal = product.price * quantity;

  res.json({
    version: '2.0',
    template: {
      outputs: [{
        simpleText: {
          text: `장바구니에 추가했어요!\n\n${product.name} ${quantity}${product.package_unit}\n${subtotal.toLocaleString()}원`
        }
      }],
      quickReplies: [
        { action: 'message', label: '상품 더 추가', messageText: '상품 보기' },
        { action: 'message', label: '장바구니 보기', messageText: '장바구니 보기' },
        { action: 'message', label: '주문 완료', messageText: '주문 완료' }
      ]
    }
  });
});

// 5) 장바구니 내용 확인
app.post('/api/kakao/cart/view', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;

  const customer = db.prepare('SELECT * FROM customers WHERE kakao_id = ?').get(kakaoId);
  if (!customer) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '먼저 고객 등록이 필요합니다.' } }],
        quickReplies: [
          { action: 'message', label: '주문하기', messageText: '주문하기' }
        ]
      }
    });
  }

  const items = db.prepare(`
    SELECT ci.quantity, p.name, p.price, p.package_unit
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = ?
  `).all(customer.id);

  if (items.length === 0) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '장바구니가 비어있어요.' } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' }
        ]
      }
    });
  }

  let total = 0;
  const lines = items.map(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return `- ${item.name} ${item.quantity}${item.package_unit} : ${subtotal.toLocaleString()}원`;
  });

  res.json({
    version: '2.0',
    template: {
      outputs: [{
        simpleText: {
          text: `장바구니 내역\n\n${lines.join('\n')}\n\n합계: ${total.toLocaleString()}원`
        }
      }],
      quickReplies: [
        { action: 'message', label: '상품 더 추가', messageText: '상품 보기' },
        { action: 'message', label: '주문 완료', messageText: '주문 완료' }
      ]
    }
  });
});

// 6) 주문 확정
app.post('/api/kakao/order/confirm', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;
  const utterance = req.body.userRequest?.utterance || '';

  const customer = db.prepare('SELECT * FROM customers WHERE kakao_id = ?').get(kakaoId);
  if (!customer) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '먼저 고객 등록이 필요합니다.' } }]
      }
    });
  }

  // 장바구니 확인
  const cartItems = db.prepare(`
    SELECT ci.*, p.name as product_name, p.price, p.package_unit
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = ?
  `).all(customer.id);

  if (cartItems.length === 0) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '장바구니가 비어있어요. 먼저 상품을 담아주세요.' } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' }
        ]
      }
    });
  }

  // 결제방식 파싱 (기본: 카드결제)
  let paymentMethod = '카드결제';
  if (utterance.includes('정산') || utterance.includes('계좌')) {
    paymentMethod = '주별정산';
  }

  // 주문 생성 (트랜잭션)
  const createOrder = db.transaction(() => {
    const orderNumber = generateOrderNumber();
    let totalAmount = 0;

    // 주문 생성
    const orderResult = db.prepare(
      'INSERT INTO orders (order_number, customer_id, payment_method, total_amount) VALUES (?, ?, ?, 0)'
    ).run(orderNumber, customer.id, paymentMethod);

    const orderId = orderResult.lastInsertRowid;

    // 장바구니 → 주문항목으로 복사
    for (const item of cartItems) {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(orderId, item.product_id, item.product_name, item.quantity, item.price, subtotal);
    }

    // 총 금액 업데이트
    db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);

    // 장바구니 비우기
    db.prepare('DELETE FROM cart_items WHERE customer_id = ?').run(customer.id);

    return { orderNumber, totalAmount };
  });

  const { orderNumber, totalAmount } = createOrder();

  const itemLines = cartItems.map(item =>
    `- ${item.product_name} ${item.quantity}${item.package_unit}`
  ).join('\n');

  res.json({
    version: '2.0',
    template: {
      outputs: [{
        simpleText: {
          text: `주문이 완료되었습니다!\n\n주문번호: ${orderNumber}\n${itemLines}\n\n합계: ${totalAmount.toLocaleString()}원\n결제: ${paymentMethod}\n\n15시 전 주문 → 당일출고\n15시 이후 → 익일출고`
        }
      }],
      quickReplies: [
        { action: 'message', label: '내 주문 확인', messageText: '내 주문 확인' },
        { action: 'message', label: '상품 보기', messageText: '상품 보기' }
      ]
    }
  });
});

// 7) 내 주문 내역
app.post('/api/kakao/order/list', (req, res) => {
  const kakaoId = req.body.userRequest?.user?.id;

  const customer = db.prepare('SELECT * FROM customers WHERE kakao_id = ?').get(kakaoId);
  if (!customer) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '등록된 고객 정보가 없습니다.' } }]
      }
    });
  }

  const orders = db.prepare(`
    SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(customer.id);

  if (orders.length === 0) {
    return res.json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '아직 주문 내역이 없어요.' } }],
        quickReplies: [
          { action: 'message', label: '상품 보기', messageText: '상품 보기' }
        ]
      }
    });
  }

  const lines = orders.map(o => {
    const items = db.prepare(
      'SELECT product_name, quantity FROM order_items WHERE order_id = ?'
    ).all(o.id);
    const itemText = items.map(i => `${i.product_name} ${i.quantity}개`).join(', ');
    return `[${o.order_number}]\n${itemText}\n${o.total_amount.toLocaleString()}원 | ${o.status}\n${o.created_at}`;
  });

  res.json({
    version: '2.0',
    template: {
      outputs: [{
        simpleText: {
          text: `최근 주문 내역\n\n${lines.join('\n\n')}`
        }
      }]
    }
  });
});

// ──────────────────────────────────────
// 관리자 주문/고객 API
// ──────────────────────────────────────

// 주문 목록 조회 (날짜/상태 필터)
app.get('/api/orders', (req, res) => {
  const { date, status } = req.query;
  let sql = `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += " AND DATE(o.created_at) = ?";
    params.push(date);
  }
  if (status) {
    sql += " AND o.status = ?";
    params.push(status);
  }

  sql += " ORDER BY o.created_at DESC";

  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

// 주문 상세 (항목 포함)
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  order.items = items;

  res.json(order);
});

// 주문 상태 변경
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['접수', '배송준비', '배송중', '배송완료'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '올바른 상태값이 아닙니다' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: '상태가 변경되었습니다', status });
});

// 고객 목록
app.get('/api/customers', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id) as total_spent
    FROM customers c
    ORDER BY c.created_at DESC
  `).all();
  res.json(customers);
});

// 고객 상세 + 주문 이력
app.get('/api/customers/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
  }

  const orders = db.prepare(`
    SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC
  `).all(customer.id);

  customer.orders = orders;
  res.json(customer);
});

// ──────────────────────────────────────
// 서버 시작
// ──────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 슈파 공동구매 관리 서버가 시작되었습니다!');
  console.log(`📍 관리자 화면: http://localhost:${PORT}`);
  console.log(`📍 상품 웹뷰:   http://localhost:${PORT}/shop.html`);
  console.log('');
  console.log('서버를 끄려면 Ctrl+C 를 누르세요.');
});
