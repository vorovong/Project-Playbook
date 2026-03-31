// ============================================
// notion-autofill.js — 카테고리 자동 분류
// 카테고리가 비어있는 업무 일지를 찾아서 자동 채움
// ============================================

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_WORKLOG_DB;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

async function queryDatabase(body = {}) {
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

const CATEGORY_RULES = [
  { name: '회계/세무', keywords: ['세무', '법인세', '세금계산서', '세무회계온', '결산', '부가세', '원천', '가산세', '지방소득세', '국고보조금', '중소기업확인서'] },
  { name: '정산', keywords: ['정산', '주간정산', '미수금', '미입금', '입금내역', '운영정산', '수수료'] },
  { name: '임대관리', keywords: ['임대료', '임대차', '공과금', '월세', '미식가', '골디스', '포토인더박스', '포인박', '한전'] },
  { name: '사업정산', keywords: ['글로컬', '소상공인협업', '증빙', '지출결의', '결과보고서', '정보공시', '보조금', 'CSP'] },
  { name: '인사/급여', keywords: ['급여', '4대보험', '퇴사', '월차', '경력증명서', '상실신고', '연말정산'] },
  { name: '재생전술', keywords: ['재생전술', '예약플랫폼', '문의응대', '원데이클래스', '클래스'] },
  { name: '콘텐츠', keywords: ['인스타', '모오', '효와복', '컨텐츠', '콘텐츠', '업로드', '사진', '영상', '나스'] },
  { name: '시설관리', keywords: ['청소', '정수기', 'SK매직', '승강기', '공사', '수리', '점검', '택배'] },
];

function classifyCategories(text) {
  const found = new Set();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) { found.add(rule.name); break; }
    }
  }
  if (found.size === 0) found.add('기타');
  return [...found];
}

function classifyType(text) {
  if (text.includes('업무계획') || text.includes('계획')) return '업무계획';
  return '업무보고';
}

async function getPageText(pageId) {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  const texts = [];
  for (const block of blocks.results) {
    if (block.type === 'to_do' && block.to_do?.rich_text) {
      texts.push(block.to_do.rich_text.map(t => t.plain_text).join(''));
    } else if (block.type === 'paragraph' && block.paragraph?.rich_text) {
      texts.push(block.paragraph.rich_text.map(t => t.plain_text).join(''));
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      texts.push(block.bulleted_list_item.rich_text.map(t => t.plain_text).join(''));
    }
  }
  return texts.join('\n');
}

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
  });
}

async function getTodayEntries() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await queryDatabase({
    filter: {
      property: '날짜',
      date: { equals: today }
    }
  });
  return data.results || [];
}

async function sendDailyReport() {
  const pages = await getTodayEntries();
  if (pages.length === 0) {
    await sendTelegram('📋 오늘 업무일지가 없습니다.');
    return;
  }

  let msg = `📋 <b>오늘의 업무일지</b> (${pages.length}건)\n`;

  for (const page of pages) {
    const title = page.properties['']?.title?.[0]?.plain_text
      || page.properties['title']?.title?.[0]?.plain_text
      || page.properties['이름']?.title?.[0]?.plain_text
      || '(제목없음)';
    const person = page.properties['담당자']?.select?.name || '';
    const category = (page.properties['카테고리']?.multi_select || []).map(c => c.name).join(', ');
    const bodyText = await getPageText(page.id);

    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `<b>${title}</b>\n`;
    if (person) msg += `👤 ${person}`;
    if (category) msg += `  📁 ${category}`;
    if (person || category) msg += `\n`;
    if (bodyText.trim()) msg += `\n${bodyText.trim()}\n`;
  }

  await sendTelegram(msg);
  console.log('📨 텔레그램 전송 완료');
}

async function autofill() {
  // 카테고리가 비어있는 항목 조회
  const data = await queryDatabase({
    filter: {
      property: '카테고리',
      multi_select: { is_empty: true }
    }
  });

  const pages = data.results || [];
  if (pages.length === 0) {
    console.log('✅ 분류할 항목이 없습니다. 모두 완료!');
  } else {
    console.log(`📋 ${pages.length}건 자동 분류 시작...\n`);

    for (const page of pages) {
      const title = page.properties['']?.title?.[0]?.plain_text
        || page.properties['title']?.title?.[0]?.plain_text
        || page.properties['이름']?.title?.[0]?.plain_text
        || '(제목없음)';

      // 본문 텍스트 읽기
      const bodyText = await getPageText(page.id);
      const fullText = title + '\n' + bodyText;

      // 분류
      const categories = classifyCategories(fullText);

      // 구분 자동 채우기 (비어있으면)
      const currentType = page.properties['구분']?.select?.name;
      const updates = {
        '카테고리': { multi_select: categories.map(c => ({ name: c })) },
      };
      if (!currentType) {
        updates['구분'] = { select: { name: classifyType(fullText) } };
      }

      // 날짜 자동 채우기 (비어있으면)
      const currentDate = page.properties['날짜']?.date?.start;
      if (!currentDate) {
        const match = fullText.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const year = new Date().getFullYear();
          updates['날짜'] = { date: { start: `${year}-${match[1]}-${match[2]}` } };
        }
      }

      // 담당자 자동 채우기 (비어있으면)
      const currentPerson = page.properties['담당자']?.select?.name;
      if (!currentPerson) {
        const personMatch = fullText.match(/(엄수빈|이승훈|박승현|김민호)/);
        if (personMatch) {
          updates['담당자'] = { select: { name: personMatch[1] } };
        }
      }

      await notion.pages.update({
        page_id: page.id,
        properties: updates,
      });

      console.log(`  ✅ ${title}`);
      console.log(`     카테고리: ${categories.join(', ')}`);
      if (updates['구분']) console.log(`     구분: ${updates['구분'].select.name}`);
      if (updates['날짜']) console.log(`     날짜: ${updates['날짜'].date.start}`);
      if (updates['담당자']) console.log(`     담당자: ${updates['담당자'].select.name}`);
      console.log('');
    }

    console.log(`\n🎉 ${pages.length}건 자동 분류 완료!`);
  }

  // 텔레그램으로 오늘 업무일지 전송
  await sendDailyReport();
}

autofill().catch(console.error);
