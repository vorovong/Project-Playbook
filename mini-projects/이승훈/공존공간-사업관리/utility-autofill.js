// ============================================
// utility-autofill.js — 공과금 메일 자동 수집
// 네이버 메일 청구·결제 폴더에서 전기요금 추출 → 노션 DB 저장
// ============================================

require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_UTILITY_DB;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
  });
}

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

// 이미 등록된 데이터인지 확인
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
  const tvcnt = link.match(/tvcnt=\s*(\d+)/)?.[1];
  const chrgamt = link.match(/chrgamt=\s*([0-9,]+)/)?.[1];
  const yy = link.match(/yy=(\d{4})/)?.[1];
  const mm = link.match(/mm=(\d{2})/)?.[1];
  const dd = link.match(/dddd=(\d{2})/)?.[1];

  // 호실 추출
  let room = addr2;
  const roomMatch = addr2.match(/(\d+층[\d호]*)/);
  if (roomMatch) room = roomMatch[1];

  return {
    type: '전기',
    custid: custid || '',
    room: room || '미확인',
    month: yy && mm ? `${yy}-${mm}` : '',
    usage: tvcnt ? parseInt(tvcnt) : 0,
    amount: chrgamt ? parseInt(chrgamt.replace(/,/g, '')) : 0,
    dueDate: yy && mm && dd ? `${yy}-${mm}-${dd}` : '',
  };
}

// 네이버 메일에서 공과금 메일 읽기
function readNaverMail() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.NAVER_EMAIL,
      password: process.env.NAVER_PASSWORD,
      host: 'imap.naver.com',
      port: 993,
      tls: true,
    });

    const bills = [];

    imap.once('ready', () => {
      imap.openBox('청구·결제', true, (err, box) => {
        if (err) { reject(err); return; }

        // 최근 60일
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

                // 한전 메일
                if (from.includes('kepco')) {
                  const bill = parseKepcoEmail(html);
                  if (bill && bill.custid) bills.push(bill);
                }
              });
            });
          });
          f.once('end', () => setTimeout(() => { imap.end(); resolve(bills); }, 3000));
        });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
}

async function main() {
  console.log('📧 네이버 메일에서 공과금 확인 중...\n');

  const bills = await readNaverMail();
  console.log(`메일에서 ${bills.length}건 발견\n`);

  let newCount = 0;
  let totalAmount = 0;
  const newBills = [];

  for (const bill of bills) {
    const exists = await isAlreadyRegistered(bill.month, bill.custid);
    if (exists) {
      console.log(`  ⏭️  ${bill.month} ${bill.room} - 이미 등록됨`);
      continue;
    }

    await addToNotion(bill);
    newCount++;
    totalAmount += bill.amount;
    newBills.push(bill);
    console.log(`  ✅ ${bill.month} ${bill.room} - ${bill.amount.toLocaleString()}원`);
  }

  if (newCount === 0) {
    console.log('\n새로 등록할 공과금이 없습니다.');
    return;
  }

  console.log(`\n🎉 ${newCount}건 신규 등록 완료! 합계: ${totalAmount.toLocaleString()}원`);

  // 텔레그램 알림
  let msg = `⚡ <b>공과금 신규 등록</b> (${newCount}건)\n\n`;
  for (const b of newBills) {
    msg += `${b.room} | ${b.type} | ${b.amount.toLocaleString()}원\n`;
  }
  msg += `\n<b>합계: ${totalAmount.toLocaleString()}원</b>`;
  await sendTelegram(msg);
  console.log('📨 텔레그램 알림 전송 완료');
}

main().catch(console.error);
