require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// 최근 공과금 메일 스캔
async function scanMail(config, label) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({ ...config, tlsOptions: { rejectUnauthorized: false } });
    const results = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err2) => {
        if (!err2) {
          imap.getBoxes((e, boxes) => {
            console.log(`[${label}] 메일함 목록:`, Object.keys(boxes || {}).join(', '));
          });
        }
      });
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { reject(err); return; }

        // 최근 30일 메일 검색
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceStr = since.toISOString().slice(0, 10);

        imap.search([['SINCE', sinceStr]], (err, uids) => {
          if (err) { reject(err); return; }
          if (!uids || uids.length === 0) {
            console.log(`[${label}] 최근 30일 메일 없음`);
            imap.end();
            resolve(results);
            return;
          }

          // 최근 50개만
          const recent = uids.slice(-50);
          console.log(`[${label}] 최근 30일 메일 ${uids.length}개 중 ${recent.length}개 확인...`);

          const f = imap.fetch(recent, { bodies: '', struct: true });
          let count = 0;

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const from = parsed.from?.text || '';
                const subject = parsed.subject || '';
                const date = parsed.date?.toISOString().slice(0, 10) || '';

                // 공과금 관련 키워드
                const keywords = ['전기', '한전', '가스', '수도', '통신', '인터넷', 'KT', 'SK', 'LG',
                  '요금', '청구', '납부', '고지', '공과금', '관리비', '전기료', '가스비',
                  '한국전력', '도시가스', '수도요금', 'SK브로드밴드', 'SK매직', '정수기'];

                const text = from + ' ' + subject;
                const isUtility = keywords.some(kw => text.includes(kw));

                results.push({ date, from: from.slice(0, 50), subject: subject.slice(0, 80), isUtility });
                count++;
              });
            });
          });

          f.once('end', () => {
            setTimeout(() => {
              imap.end();
              resolve(results);
            }, 2000);
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

async function main() {
  // 네이버 IMAP
  console.log('=== 네이버 메일 스캔 ===\n');
  try {
    const naverResults = await scanMail({
      user: process.env.NAVER_EMAIL,
      password: process.env.NAVER_PASSWORD,
      host: 'imap.naver.com',
      port: 993,
      tls: true,
    }, '네이버');

    const naverUtility = naverResults.filter(r => r.isUtility);
    console.log(`\n공과금 관련 메일 ${naverUtility.length}건:`);
    naverUtility.forEach(r => console.log(`  ${r.date} | ${r.from} | ${r.subject}`));
    if (naverUtility.length === 0) {
      console.log('  (없음 - 최근 메일 목록:)');
      naverResults.slice(-10).forEach(r => console.log(`  ${r.date} | ${r.from} | ${r.subject}`));
    }
  } catch (e) {
    console.log('네이버 접속 실패:', e.message);
  }

  // Gmail IMAP
  console.log('\n=== Gmail 스캔 ===\n');
  try {
    const gmailResults = await scanMail({
      user: process.env.GMAIL_EMAIL,
      password: process.env.GMAIL_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    }, 'Gmail');

    const gmailUtility = gmailResults.filter(r => r.isUtility);
    console.log(`\n공과금 관련 메일 ${gmailUtility.length}건:`);
    gmailUtility.forEach(r => console.log(`  ${r.date} | ${r.from} | ${r.subject}`));
    if (gmailUtility.length === 0) {
      console.log('  (없음 - 최근 메일 목록:)');
      gmailResults.slice(-10).forEach(r => console.log(`  ${r.date} | ${r.from} | ${r.subject}`));
    }
  } catch (e) {
    console.log('Gmail 접속 실패:', e.message);
  }
}

main().catch(console.error);
