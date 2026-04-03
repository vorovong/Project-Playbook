// lib/blocks.js — 노션 블록 빌더 (모든 업체 공통)

function heading2(content) {
  return {
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function heading3(content) {
  return {
    object: 'block', type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function text(content, bold = false) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content }, annotations: { bold } }] },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

function row(cells) {
  return {
    type: 'table_row',
    table_row: { cells: cells.map(c => [{ type: 'text', text: { content: String(c) } }]) },
  };
}

function table(rows, colCount) {
  return {
    object: 'block', type: 'table',
    table: { table_width: colCount, has_column_header: true, has_row_header: false, children: rows },
  };
}

function fmt(n) {
  return n.toLocaleString();
}

module.exports = { heading2, heading3, text, divider, row, table, fmt };
