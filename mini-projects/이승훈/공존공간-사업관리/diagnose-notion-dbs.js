// ============================================
// diagnose-notion-dbs.js — 노션 DB 진단
// 박승현 대표 회신용: ③컬럼사용현황 + ⑥지난사업분류
// ============================================
//
// 각 DB에 대해:
//  1) 스키마(전체 컬럼) 가져오기
//  2) 모든 페이지 query (페이징 처리)
//  3) 컬럼별 "값 있음 / 빈 칸" 카운트
//  4) 사업명 셀렉트가 있으면 사업별 카운트
//  5) 마지막 데이터 입력일 (가장 최근 created_time)
//
// 결과: handoff/2026-04-07-진단A-노션DB.md 로 저장

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2022-06-28';

async function notionFetch(url, opts = {}) {
  const resp = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) {
    const msg = data.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

const notion = {
  databases: {
    retrieve: ({ database_id }) =>
      notionFetch(`https://api.notion.com/v1/databases/${database_id}`),
    query: ({ database_id, start_cursor, page_size }) =>
      notionFetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
        method: 'POST',
        body: { start_cursor, page_size },
      }),
  },
};

const DBS = [
  { key: 'SALES',    label: '일별매출',         id: process.env.NOTION_SALES_DB },
  { key: 'WEEKLY',   label: '주간정산',         id: process.env.NOTION_WEEKLY_DB },
  { key: 'MONTHLY',  label: '월정산',           id: process.env.NOTION_MONTHLY_DB },
  { key: 'PHOTO',    label: '포토인더박스 매출', id: process.env.NOTION_PHOTO_DB },
  { key: 'PURCHASE', label: '구매내역',         id: process.env.NOTION_PURCHASE_DB },
  { key: 'CLASS',    label: '재생전술 클래스',   id: process.env.NOTION_CLASS_DB },
  { key: 'UTILITY',  label: '공과금',           id: process.env.NOTION_UTILITY_DB },
  { key: 'WORKLOG',  label: '업무일지',         id: process.env.NOTION_WORKLOG_DB },
  { key: 'RANK',     label: '네이버순위',       id: process.env.NOTION_RANK_DB },
];

// 노션 프로퍼티 값이 "비어있는지" 판정
function isEmpty(prop) {
  if (!prop) return true;
  const t = prop.type;
  const v = prop[t];
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'object') {
    if (t === 'rich_text' || t === 'title') {
      return !v.length || v.every(r => !r.plain_text || !r.plain_text.trim());
    }
    if (t === 'number') return prop.number == null;
    if (t === 'select') return !v;
    if (t === 'multi_select') return !v.length;
    if (t === 'date') return !v;
    if (t === 'people') return !v.length;
    if (t === 'files') return !v.length;
    if (t === 'checkbox') return false; // checkbox는 false도 값
    if (t === 'formula') return false; // formula는 항상 계산값 있음
    if (t === 'rollup') return false;
  }
  return false;
}

async function fetchAllPages(dbId) {
  const pages = [];
  let cursor = undefined;
  let safety = 0;
  while (true) {
    safety++;
    if (safety > 50) break; // 최대 5000개
    const resp = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor;
  }
  return pages;
}

async function diagnoseDb(db) {
  if (!db.id) {
    return { ...db, error: '.env에 ID 없음', skipped: true };
  }
  try {
    const meta = await notion.databases.retrieve({ database_id: db.id });
    const props = meta.properties || {};
    const propNames = Object.keys(props);

    const pages = await fetchAllPages(db.id);

    // 컬럼별 채워짐 카운트
    const colStats = {};
    for (const name of propNames) {
      colStats[name] = { type: props[name].type, filled: 0, total: pages.length };
    }
    for (const page of pages) {
      for (const name of propNames) {
        if (!isEmpty(page.properties[name])) {
          colStats[name].filled++;
        }
      }
    }

    // 사업명 셀렉트 후보 찾기
    const bizCounts = {};
    const bizPropName = propNames.find(n => {
      const t = props[n].type;
      const lower = n.toLowerCase();
      return (t === 'select' || t === 'multi_select') &&
        (n.includes('사업') || n.includes('업체') || n.includes('구분') ||
         n.includes('종류') || lower.includes('biz') || lower.includes('type'));
    });
    if (bizPropName) {
      for (const page of pages) {
        const p = page.properties[bizPropName];
        const val = p && (p.select?.name || p.multi_select?.map(s => s.name).join(','));
        if (val) bizCounts[val] = (bizCounts[val] || 0) + 1;
      }
    }

    // 마지막 입력일
    let latest = null;
    for (const page of pages) {
      const t = page.created_time;
      if (!latest || t > latest) latest = t;
    }

    return {
      ...db,
      title: meta.title?.[0]?.plain_text || db.label,
      total_pages: pages.length,
      columns_total: propNames.length,
      columns: colStats,
      biz_prop: bizPropName || null,
      biz_counts: bizCounts,
      latest_created: latest,
    };
  } catch (e) {
    return { ...db, error: e.message };
  }
}

function pad(s, n) { return (s + ' '.repeat(n)).slice(0, n); }

function renderReport(results) {
  const lines = [];
  lines.push('---');
  lines.push('type: diagnosis');
  lines.push('created: 2026-04-07');
  lines.push('purpose: 박승현 대표 회신 ③ 컬럼 사용현황 + ⑥ 지난 사업 분류 자동 진단');
  lines.push('---');
  lines.push('');
  lines.push('# 진단 A — 노션 DB 컬럼 사용현황 + 사업 분류');
  lines.push('');
  lines.push('> 자동 진단: 김비서 / 2026-04-07');
  lines.push('> 방법: 노션 API로 9개 DB 전체 페이지 query → 컬럼별 채워짐 비율 + 사업별 데이터 건수 집계');
  lines.push('');

  // 요약 표
  lines.push('## 요약');
  lines.push('');
  lines.push('| DB | 전체 컬럼 | 데이터 건수 | 사용 컬럼 | 미사용 컬럼 | 마지막 입력 |');
  lines.push('|---|:---:|:---:|:---:|:---:|---|');
  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.label} | - | - | - | - | ❌ ${r.error} |`);
      continue;
    }
    const used = Object.values(r.columns).filter(c => c.filled > 0).length;
    const unused = r.columns_total - used;
    const last = r.latest_created ? r.latest_created.slice(0, 10) : '(없음)';
    lines.push(`| ${r.label} | ${r.columns_total} | ${r.total_pages} | ${used} | ${unused} | ${last} |`);
  }
  lines.push('');

  // DB별 상세
  lines.push('## DB별 컬럼 사용 상세');
  lines.push('');
  for (const r of results) {
    lines.push(`### ${r.label}`);
    lines.push('');
    if (r.error) {
      lines.push(`❌ 오류: ${r.error}`);
      lines.push('');
      continue;
    }
    lines.push(`- 데이터 건수: **${r.total_pages}**`);
    lines.push(`- 마지막 입력일: ${r.latest_created || '(없음)'}`);
    lines.push('');
    lines.push('| 컬럼명 | 타입 | 채워진 건수 | 사용률 |');
    lines.push('|---|---|:---:|:---:|');
    const cols = Object.entries(r.columns).sort((a, b) => b[1].filled - a[1].filled);
    for (const [name, c] of cols) {
      const rate = c.total ? Math.round((c.filled / c.total) * 100) : 0;
      const flag = c.filled === 0 ? ' ⚠️' : '';
      lines.push(`| ${name}${flag} | ${c.type} | ${c.filled}/${c.total} | ${rate}% |`);
    }
    lines.push('');
    if (r.biz_prop && Object.keys(r.biz_counts).length) {
      lines.push(`**사업/구분별 분포 (${r.biz_prop}):**`);
      lines.push('');
      lines.push('| 값 | 건수 |');
      lines.push('|---|:---:|');
      for (const [k, v] of Object.entries(r.biz_counts).sort((a, b) => b[1] - a[1])) {
        lines.push(`| ${k} | ${v} |`);
      }
      lines.push('');
    }
  }

  // 지난 사업 분류
  lines.push('## ⑥ 지난 사업 자동 분류');
  lines.push('');
  lines.push('데이터 0건 또는 6개월 이상 미입력 = 정리 후보');
  lines.push('');
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString();
  lines.push('| DB / 사업 | 데이터 건수 | 마지막 입력 | 분류 |');
  lines.push('|---|:---:|---|---|');
  for (const r of results) {
    if (r.error) continue;
    if (r.total_pages === 0) {
      lines.push(`| ${r.label} | 0 | - | 🔴 빈 DB (정리 후보) |`);
    } else if (r.latest_created && r.latest_created < cutoff) {
      lines.push(`| ${r.label} | ${r.total_pages} | ${r.latest_created.slice(0,10)} | 🟡 6개월+ 미입력 |`);
    } else {
      lines.push(`| ${r.label} | ${r.total_pages} | ${r.latest_created?.slice(0,10) || '-'} | 🟢 활성 |`);
    }
    // 사업별 카운트도 같이
    if (r.biz_counts && Object.keys(r.biz_counts).length) {
      for (const [k, v] of Object.entries(r.biz_counts).sort((a, b) => b[1] - a[1])) {
        const oldHit = (k.includes('양조') || k.includes('페스타') || k.includes('팝업'));
        lines.push(`| └ ${k} | ${v} | - | ${oldHit ? '🟡 정리후보(이름매칭)' : ''} |`);
      }
    }
  }
  lines.push('');

  // 박승현 표 형식 응답
  lines.push('## 박승현 대표 표 형식 응답');
  lines.push('');
  lines.push('| DB명 | 전체 컬럼 수 | 실제 사용 컬럼 | 미사용 컬럼 |');
  lines.push('|------|:---:|------|------|');
  const targetLabels = ['일별매출', '주간정산', '월정산', '포토인더박스 매출', '구매내역', '재생전술 클래스'];
  for (const label of targetLabels) {
    const r = results.find(x => x.label === label);
    if (!r || r.error) {
      lines.push(`| ${label} | ? | ? | ? |`);
      continue;
    }
    const used = Object.entries(r.columns).filter(([_, c]) => c.filled > 0).map(([n]) => n);
    const unused = Object.entries(r.columns).filter(([_, c]) => c.filled === 0).map(([n]) => n);
    lines.push(`| ${label} | ${r.columns_total} | ${used.join(', ') || '(없음)'} | ${unused.join(', ') || '(없음)'} |`);
  }
  lines.push('');

  return lines.join('\n');
}

(async () => {
  console.log('[진단] 노션 DB 9개 조회 시작...\n');
  const results = [];
  for (const db of DBS) {
    process.stdout.write(`  - ${db.label} ... `);
    const r = await diagnoseDb(db);
    if (r.error) console.log(`❌ ${r.error}`);
    else console.log(`✅ ${r.total_pages}건 / ${r.columns_total}컬럼`);
    results.push(r);
  }
  console.log('\n[진단] 보고서 생성 중...');
  const md = renderReport(results);
  const outPath = path.join(__dirname, 'handoff', '2026-04-07-진단A-노션DB.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`[완료] ${outPath}`);
})();
