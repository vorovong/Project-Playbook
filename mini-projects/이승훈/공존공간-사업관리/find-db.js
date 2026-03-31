require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  // 페이지 안의 블록들을 조회해서 데이터베이스 블록 찾기
  const pageId = '334d02303dc0805ba0fbe1915397fb55';
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  for (const block of blocks.results) {
    console.log(`type: ${block.type}, id: ${block.id}`);
    if (block.type === 'child_database') {
      console.log(`\n✅ 데이터베이스 ID 발견: ${block.id}`);
    }
  }
})();
