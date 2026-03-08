const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

// ===== 색상/스타일 헬퍼 =====
function cell(v, opts = {}) {
  const c = { v: v, t: typeof v === 'number' ? 'n' : 's' };
  const s = {};
  if (opts.bold) s.font = { ...(s.font || {}), bold: true };
  if (opts.fontSize) s.font = { ...(s.font || {}), sz: opts.fontSize };
  if (opts.color) s.font = { ...(s.font || {}), color: { rgb: opts.color } };
  if (opts.fill) s.fill = { fgColor: { rgb: opts.fill } };
  if (opts.align) s.alignment = { horizontal: opts.align, vertical: 'center', wrapText: true };
  else s.alignment = { vertical: 'center', wrapText: true };
  if (opts.border) {
    s.border = {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    };
  }
  c.s = s;
  return c;
}

// ===== 시트 데이터 구성 =====
const ws = {};
const merges = [];
let row = 0;

// --- 제목 ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('📋 주간 계획서', { bold: true, fontSize: 18, fill: '1a365d', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('월:', { bold: true, fill: 'E8EAF6', border: true });
ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true, fill: 'FFFFCC' });
ws[XLSX.utils.encode_cell({r: row, c: 2})] = cell('주차:', { bold: true, fill: 'E8EAF6', border: true });
ws[XLSX.utils.encode_cell({r: row, c: 3})] = cell('', { border: true, fill: 'FFFFCC' });
ws[XLSX.utils.encode_cell({r: row, c: 4})] = cell('기간:', { bold: true, fill: 'E8EAF6', border: true });
ws[XLSX.utils.encode_cell({r: row, c: 5})] = cell('', { border: true, fill: 'FFFFCC' });
merges.push({ s: {r: row, c: 5}, e: {r: row, c: 6} });
ws[XLSX.utils.encode_cell({r: row, c: 7})] = cell('작성자:', { bold: true, fill: 'E8EAF6', border: true });
ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('', { border: true, fill: 'FFFFCC' });
merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
row += 2;

// --- 1. 이번 주 목표 (3개) ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('🎯 이번 주 목표', { bold: true, fontSize: 13, fill: '2E7D32', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('번호', { bold: true, fill: 'C8E6C9', border: true, align: 'center' });
ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('목표', { bold: true, fill: 'C8E6C9', border: true, align: 'center' });
merges.push({ s: {r: row, c: 1}, e: {r: row, c: 7} });
ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('달성 여부', { bold: true, fill: 'C8E6C9', border: true, align: 'center' });
merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
row++;

for (let i = 1; i <= 3; i++) {
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell(i, { border: true, align: 'center', fill: 'F1F8E9' });
  ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 1}, e: {r: row, c: 7} });
  ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('', { border: true, align: 'center', fill: 'FFFFCC' });
  merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
  row++;
}
row++;

// --- 2. 일별 계획 (월~일) ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('📅 일별 계획', { bold: true, fontSize: 13, fill: '1565C0', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

const days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const dayColors = ['BBDEFB', 'BBDEFB', 'BBDEFB', 'BBDEFB', 'BBDEFB', 'FFE0B2', 'FFCDD2'];

days.forEach((day, di) => {
  // 요일 헤더
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell(day, { bold: true, fill: dayColors[di], border: true, align: 'center' });
  merges.push({ s: {r: row, c: 0}, e: {r: row, c: 0} });
  ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('핵심 할일 (최대 3개)', { bold: true, fill: dayColors[di], border: true, align: 'center' });
  merges.push({ s: {r: row, c: 1}, e: {r: row, c: 6} });
  ws[XLSX.utils.encode_cell({r: row, c: 7})] = cell('완료', { bold: true, fill: dayColors[di], border: true, align: 'center' });
  ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('기타/메모', { bold: true, fill: dayColors[di], border: true, align: 'center' });
  merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
  row++;

  // 할일 3줄
  for (let t = 1; t <= 3; t++) {
    ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell(t, { border: true, align: 'center' });
    ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true });
    merges.push({ s: {r: row, c: 1}, e: {r: row, c: 6} });
    ws[XLSX.utils.encode_cell({r: row, c: 7})] = cell('☐', { border: true, align: 'center', fill: 'FFFFCC' });
    ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('', { border: true });
    merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
    row++;
  }
});
row++;

// --- 3. 핵심 프로젝트 진행 ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('🚀 핵심 프로젝트 진행', { bold: true, fontSize: 13, fill: 'E65100', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('순서', { bold: true, fill: 'FFE0B2', border: true, align: 'center' });
ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('프로젝트명', { bold: true, fill: 'FFE0B2', border: true, align: 'center' });
merges.push({ s: {r: row, c: 1}, e: {r: row, c: 3} });
ws[XLSX.utils.encode_cell({r: row, c: 4})] = cell('이번 주 할 것', { bold: true, fill: 'FFE0B2', border: true, align: 'center' });
merges.push({ s: {r: row, c: 4}, e: {r: row, c: 7} });
ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('진행상태', { bold: true, fill: 'FFE0B2', border: true, align: 'center' });
merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
row++;

for (let i = 1; i <= 5; i++) {
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell(i, { border: true, align: 'center', fill: 'FFF3E0' });
  ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 1}, e: {r: row, c: 3} });
  ws[XLSX.utils.encode_cell({r: row, c: 4})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 4}, e: {r: row, c: 7} });
  ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('', { border: true, align: 'center', fill: 'FFFFCC' });
  merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
  row++;
}
row++;

// --- 4. 주요 미팅/약속 ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('🤝 주요 미팅/약속', { bold: true, fontSize: 13, fill: '6A1B9A', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('날짜', { bold: true, fill: 'E1BEE7', border: true, align: 'center' });
ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('시간', { bold: true, fill: 'E1BEE7', border: true, align: 'center' });
ws[XLSX.utils.encode_cell({r: row, c: 2})] = cell('대상', { bold: true, fill: 'E1BEE7', border: true, align: 'center' });
merges.push({ s: {r: row, c: 2}, e: {r: row, c: 3} });
ws[XLSX.utils.encode_cell({r: row, c: 4})] = cell('안건', { bold: true, fill: 'E1BEE7', border: true, align: 'center' });
merges.push({ s: {r: row, c: 4}, e: {r: row, c: 7} });
ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('비고', { bold: true, fill: 'E1BEE7', border: true, align: 'center' });
merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
row++;

for (let i = 0; i < 5; i++) {
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('', { border: true, align: 'center' });
  ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true, align: 'center' });
  ws[XLSX.utils.encode_cell({r: row, c: 2})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 2}, e: {r: row, c: 3} });
  ws[XLSX.utils.encode_cell({r: row, c: 4})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 4}, e: {r: row, c: 7} });
  ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
  row++;
}
row++;

// --- 5. 놓치면 안 되는 것 (마감 있는 것) ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('⚠️ 놓치면 안 되는 것 (마감 있는 것만)', { bold: true, fontSize: 13, fill: 'C62828', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('마감일', { bold: true, fill: 'FFCDD2', border: true, align: 'center' });
ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('내용', { bold: true, fill: 'FFCDD2', border: true, align: 'center' });
merges.push({ s: {r: row, c: 1}, e: {r: row, c: 7} });
ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('완료', { bold: true, fill: 'FFCDD2', border: true, align: 'center' });
merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
row++;

for (let i = 0; i < 5; i++) {
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('', { border: true, align: 'center' });
  ws[XLSX.utils.encode_cell({r: row, c: 1})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 1}, e: {r: row, c: 7} });
  ws[XLSX.utils.encode_cell({r: row, c: 8})] = cell('☐', { border: true, align: 'center', fill: 'FFFFCC' });
  merges.push({ s: {r: row, c: 8}, e: {r: row, c: 9} });
  row++;
}
row++;

// --- 6. 주간 회고 ---
ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('💭 주간 회고', { bold: true, fontSize: 13, fill: '00695C', color: 'FFFFFF', align: 'center' });
merges.push({ s: {r: row, c: 0}, e: {r: row, c: 9} });
row++;

const reviewItems = [
  { label: '✅ 잘한 것', fill: 'E0F2F1' },
  { label: '😅 아쉬운 것', fill: 'FFF8E1' },
  { label: '🔄 다음 주 개선점', fill: 'E8EAF6' },
];

reviewItems.forEach(item => {
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell(item.label, { bold: true, fill: item.fill, border: true, align: 'center' });
  merges.push({ s: {r: row, c: 0}, e: {r: row, c: 1} });
  ws[XLSX.utils.encode_cell({r: row, c: 2})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 2}, e: {r: row, c: 9} });
  row++;
  // 추가 작성 줄
  ws[XLSX.utils.encode_cell({r: row, c: 0})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 0}, e: {r: row, c: 1} });
  ws[XLSX.utils.encode_cell({r: row, c: 2})] = cell('', { border: true });
  merges.push({ s: {r: row, c: 2}, e: {r: row, c: 9} });
  row++;
});

// 시트 설정
ws['!ref'] = XLSX.utils.encode_range({ s: {r: 0, c: 0}, e: {r: row, c: 9} });
ws['!merges'] = merges;
ws['!cols'] = [
  { wch: 12 }, // A
  { wch: 12 }, // B
  { wch: 10 }, // C
  { wch: 10 }, // D
  { wch: 12 }, // E
  { wch: 12 }, // F
  { wch: 12 }, // G
  { wch: 8 },  // H
  { wch: 12 }, // I
  { wch: 12 }, // J
];

// 행 높이 설정
ws['!rows'] = [];
for (let r = 0; r <= row; r++) {
  ws['!rows'][r] = { hpt: r === 0 ? 36 : 24 };
}

XLSX.utils.book_append_sheet(wb, ws, '주간계획서');

const outputPath = 'C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서-개선판.xlsx';
XLSX.writeFile(wb, outputPath);
console.log('완료: ' + outputPath);
