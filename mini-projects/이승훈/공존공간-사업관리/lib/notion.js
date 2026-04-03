// lib/notion.js — 노션 API 헬퍼 (모든 업체 공통)

const API_KEY = process.env.NOTION_API_KEY;

async function notionPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function queryAll(dbId, filter) {
  const allResults = [];
  let hasMore = true;
  let startCursor;

  while (hasMore) {
    const body = { page_size: 100 };
    if (filter) body.filter = filter;
    if (startCursor) body.start_cursor = startCursor;

    const data = await notionPost(`https://api.notion.com/v1/databases/${dbId}/query`, body);
    allResults.push(...(data.results || []));
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }
  return allResults;
}

async function createSubPage(parentId, title, blocks) {
  const firstBatch = blocks.slice(0, 100);
  const result = await notionPost('https://api.notion.com/v1/pages', {
    parent: { page_id: parentId },
    properties: { title: { title: [{ text: { content: title } }] } },
    children: firstBatch,
  });

  if (result.id && blocks.length > 100) {
    for (let i = 100; i < blocks.length; i += 100) {
      await fetch(`https://api.notion.com/v1/blocks/${result.id}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children: blocks.slice(i, i + 100) }),
      });
    }
  }
  return result;
}

module.exports = { notionPost, queryAll, createSubPage };
