require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  try {
    const db = await notion.databases.retrieve({ database_id: process.env.NOTION_WORKLOG_DB });
    console.log('DB title:', db.title[0] ? db.title[0].plain_text : 'no title');
    for (const key in db.properties) {
      const prop = db.properties[key];
      console.log(key, ':', prop.type);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
