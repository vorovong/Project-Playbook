// ============================================
// notion-worklog.js — 업무 일지 자동화
// 카톡 업무 보고 텍스트 → 노션 DB 자동 등록 + 카테고리 분류
// ============================================

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_WORKLOG_DB;
const NOTION_VERSION = '2022-06-28';

// Notion API v5에서 databases.query가 없으므로 직접 fetch
async function queryDatabase(databaseId, body = {}) {
  const resp = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}

// -- 카테고리 자동 분류 규칙 --
const CATEGORY_RULES = [
  { name: '회계/세무', keywords: ['세무', '법인세', '세금계산서', '세무회계온', '결산', '부가세', '원천', '가산세', '지방소득세', '국고보조금'] },
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

function extractDate(text) {
  const match = text.match(/(\d{2})\/(\d{2})/);
  if (match) {
    const year = new Date().getFullYear();
    return `${year}-${match[1]}-${match[2]}`;
  }
  return new Date().toISOString().split('T')[0];
}

function extractPerson(text) {
  const match = text.match(/(엄수빈|이승훈|박승현|김민호)/);
  return match ? match[1] : '엄수빈';
}

function parseTaskLines(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.match(/^\d{2}\/\d{2}/))
    .filter(line => !line.includes('업무계획') && !line.includes('업무보고'))
    .filter(line => !line.match(/^엄수빈$|^이승훈$/));
}

// -- 노션에 업무 일지 등록 --
async function addWorklog(rawText) {
  const date = extractDate(rawText);
  const person = extractPerson(rawText);
  const type = classifyType(rawText);
  const categories = classifyCategories(rawText);
  const tasks = parseTaskLines(rawText);
  const title = `${date.slice(5).replace('-', '/')} ${person}`;

  console.log(`\n📋 업무 일지 등록`);
  console.log(`   제목: ${title}`);
  console.log(`   담당자: ${person}`);
  console.log(`   날짜: ${date}`);
  console.log(`   구분: ${type}`);
  console.log(`   카테고리: ${categories.join(', ')}`);
  console.log(`   업무 ${tasks.length}건:`);
  tasks.forEach((t, i) => console.log(`     ${i + 1}. ${t}`));

  const children = tasks.map(task => ({
    object: 'block',
    type: 'to_do',
    to_do: {
      rich_text: [{ type: 'text', text: { content: task } }],
      checked: false,
    }
  }));

  const response = await notion.pages.create({
    parent: { database_id: DB_ID },
    properties: {
      title: { title: [{ type: 'text', text: { content: title } }] },
      '담당자': { select: { name: person } },
      '날짜': { date: { start: date } },
      '구분': { select: { name: type } },
      '카테고리': { multi_select: categories.map(c => ({ name: c })) },
    },
    children: children,
  });

  console.log(`\n✅ 등록 완료! ID: ${response.id}`);
  return response;
}

// -- 업무 일지 조회 --
async function getWorklogs(startDate, endDate) {
  const data = await queryDatabase(DB_ID, {
    filter: {
      and: [
        { property: '날짜', date: { on_or_after: startDate } },
        { property: '날짜', date: { on_or_before: endDate } },
      ]
    },
    sorts: [{ property: '날짜', direction: 'ascending' }],
  });
  return data.results || [];
}

// -- 주간 분석 리포트 --
async function weeklyReport(startDate, endDate) {
  const logs = await getWorklogs(startDate, endDate);

  if (logs.length === 0) {
    console.log('해당 기간 업무 일지가 없습니다.');
    return;
  }

  const categoryCount = {};
  let totalTasks = 0;

  for (const log of logs) {
    const categories = log.properties['카테고리']?.multi_select || [];
    for (const cat of categories) {
      categoryCount[cat.name] = (categoryCount[cat.name] || 0) + 1;
    }
    const blocks = await notion.blocks.children.list({ block_id: log.id });
    const todos = blocks.results.filter(b => b.type === 'to_do');
    totalTasks += todos.length;
  }

  console.log(`\n📊 주간 업무 리포트 (${startDate} ~ ${endDate})`);
  console.log(`   총 일지: ${logs.length}건`);
  console.log(`   총 업무: ${totalTasks}건`);
  console.log(`\n   카테고리별 빈도:`);

  const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    const bar = '█'.repeat(count);
    console.log(`     ${cat.padEnd(10)} ${bar} ${count}회`);
  }
}

// -- CLI --
const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
  const text = args.slice(1).join(' ');
  if (!text) { console.log('사용법: node notion-worklog.js add "03/31 엄수빈 업무보고 ..."'); process.exit(1); }
  addWorklog(text).catch(console.error);
} else if (command === 'report') {
  const start = args[1], end = args[2];
  if (!start || !end) { console.log('사용법: node notion-worklog.js report 2026-03-24 2026-03-31'); process.exit(1); }
  weeklyReport(start, end).catch(console.error);
} else if (command === 'test') {
  (async () => {
    try {
      const data = await queryDatabase(DB_ID, { page_size: 1 });
      if (data.object === 'list') {
        console.log('✅ 노션 연결 성공!');
        console.log(`   항목 수: ${data.results.length}건`);
        if (data.results.length > 0) {
          console.log('   속성:', Object.keys(data.results[0].properties).join(', '));
        }
      } else {
        console.error('❌ 연결 실패:', data.message || JSON.stringify(data));
      }
    } catch (err) {
      console.error('❌ 연결 실패:', err.message);
    }
  })();
} else {
  console.log(`
📋 공존공간 업무 일지 도구

사용법:
  node notion-worklog.js test                          연결 테스트
  node notion-worklog.js add "업무 내용 텍스트"          업무 일지 등록
  node notion-worklog.js report 2026-03-24 2026-03-31  주간 리포트
  `);
}
