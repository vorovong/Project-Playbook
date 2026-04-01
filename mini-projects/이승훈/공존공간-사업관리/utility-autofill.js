// ============================================
// utility-autofill.js — 공과금 메일 자동 수집
// 네이버 + Gmail에서 전기/가스 요금 추출 → 노션 DB 저장
// ============================================

require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_UTILITY_DB;
async function queryDB(body = {}) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}

async function addToNotion(bill) {
  const resp = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: DB_ID },
      properties: {
        '호실': { title: [{ text: { content: bill.room } }] },
        '청구월': { rich_text: [{ text: { content: bill.month } }] },
        '종류': { select: { name: bill.type } },
        '사용량': { number: bill.usage },
        '청구금액': { number: bill.amount },
        '고객번호': { rich_text: [{ text: { content: bill.custid } }] },
        '납기일': { date: { start: bill.dueDate } },
      }
    })
  });
  return resp.json();
}

async function isAlreadyRegistered(month, custid) {
  const data = await queryDB({
    filter: {
      and: [
        { property: '청구월', rich_text: { equals: month } },
        { property: '고객번호', rich_text: { equals: custid } },
      ]
    }
  });
  return (data.results || []).length > 0;
}

// 한전 메일에서 청구 정보 추출
function parseKepcoEmail(html) {
  const link = html.match(/individual_POST_PAGE[^"]+/)?.[0] || '';
  if (!link) return null;

  const custid = link.match(/custid=([0-9-]+)/)?.[1]?.trim();
  const addr2 = link.match(/addr2=([^&]+)/)?.[1]?.trim() || '';
  const tvcnt = link.match(/tvcnt=\s*([0-9,]+)/)?.[1];
  const chrgamt = link.match(/chrgamt=\s*([0-9,]+)/)?.[1];
  const yy = link.match(/yy=(\d{4})/)?.[1];
  const mm = link.match(/mm=(\d{2})/)?.[1];
  const dd = link.match(/dddd=(\d{2})/)?.[1];

  let room = addr2;
  const roomMatch = addr2.match(/(\d+층[\d호]*)/);
  if (roomMatch) room = roomMatch[1];

  return {
    type: '전기',
    custid: custid || '',
    room: room || '미확인',
    month: yy && mm ? `${yy}-${mm}` : '',
    usage: tvcnt ? parseInt(tvcnt.replace(/,/g, '')) : 0,
    amount: chrgamt ? parseInt(chrgamt.replace(/,/g, '')) : 0,
    dueDate: yy && mm && dd ? `${yy}-${mm}-${dd}` : '',
  };
}

// 빌코리아(삼천리 도시가스) 메일에서 청구 정보 추출
function parseBillkoreaEmail(html, subject) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

  const amountMatch = text.match(/청구금액[^0-9]*([0-9,]+)\s*원/);
  const usageMatch = text.match(/총사용열량\(MJ\)\s*([0-9,]+)/);
  const dueDateMatch = subject.match(/(\d{4})년\s*(\d{2})월\s*(\d{2})일/);
  const monthMatch = text.match(/빌코리아\s*(\d{4})\.(\d{1,2})/);

  const month = monthMatch ? `${monthMatch[1]}-${monthMatch[2].padStart(2, '0')}` : '';
  const dueDate = dueDateMatch ? `${dueDateMatch[1]}-${dueDateMatch[2]}-${dueDateMatch[3]}` : '';
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
  const usage = usageMatch ? parseInt(usageMatch[1].replace(/,/g, '')) : 0;

  if (!amount) return null;

  return {
    type: '가스',
    custid: '삼천리-공존공간',
    room: '전체',
    month,
    usage,
    amount,
    dueDate,
  };
}

// 메일함에서 공과금 메일 읽기 (범용)
function readMailbox(config, folder, label) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const bills = [];

    imap.once('ready', () => {
      imap.openBox(folder, true, (err, box) => {
        if (err) { console.log(`[${label}] 폴더 열기 실패:`, err.message); imap.end(); resolve(bills); return; }

        const since = new Date();
        since.setDate(since.getDate() - 60);

        imap.search([['SINCE', since.toISOString().slice(0, 10)]], (err, uids) => {
          if (err) { reject(err); return; }
          if (!uids || uids.length === 0) {
            imap.end();
            resolve(bills);
            return;
          }

          const f = imap.fetch(uids, { bodies: '' });
          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const from = parsed.from?.text || '';
                const html = parsed.html || '';
                const subject = parsed.subject || '';

                if (from.includes('kepco')) {
                  const bill = parseKepcoEmail(html);
                  if (bill && bill.custid) bills.push(bill);
                }
                if (from.includes('billkorea')) {
                  const bill = parseBillkoreaEmail(html, subject);
                  if (bill) bills.push(bill);
                }
              });
            });
          });
          f.once('end', () => setTimeout(() => { imap.end(); resolve(bills); }, 3000));
        });
      });
    });

    imap.once('error', (err) => { console.log(`[${label}] 접속 실패:`, err.message); resolve(bills); });
    imap.connect();
  });
}

async function main() {
  console.log('📧 공과금 메일 확인 중...\n');

  // 네이버 메일
  const naverBills = await readMailbox({
    user: process.env.NAVER_EMAIL,
    password: process.env.NAVER_PASSWORD,
    host: 'imap.naver.com',
    port: 993,
    tls: true,
  }, '청구·결제', '네이버');
  console.log(`[네이버] ${naverBills.length}건 발견`);

  // Gmail
  const gmailBills = await readMailbox({
    user: process.env.GMAIL_EMAIL,
    password: process.env.GMAIL_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  }, 'INBOX', 'Gmail');
  console.log(`[Gmail] ${gmailBills.length}건 발견\n`);

  const allBills = [...naverBills, ...gmailBills];

  let newCount = 0;
  let totalAmount = 0;
  const newBills = [];

  for (const bill of allBills) {
    const exists = await isAlreadyRegistered(bill.month, bill.custid);
    if (exists) {
      console.log(`  ⏭️  ${bill.month} ${bill.room} ${bill.type} - 이미 등록됨`);
      continue;
    }

    await addToNotion(bill);
    newCount++;
    totalAmount += bill.amount;
    newBills.push(bill);
    console.log(`  ✅ ${bill.month} ${bill.room} ${bill.type} - ${bill.amount.toLocaleString()}원`);
  }

  if (newCount === 0) {
    console.log('\n새로 등록할 공과금이 없습니다.');
    return;
  }

  console.log(`\n🎉 ${newCount}건 신규 등록 완료! 합계: ${totalAmount.toLocaleString()}원`);
}

main().catch(console.error);
