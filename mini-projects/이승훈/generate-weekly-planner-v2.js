const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();
const ws = {};
const merges = [];

// 스타일 헬퍼
function c(v, opts = {}) {
  const cell = { v: v, t: typeof v === 'number' ? 'n' : 's' };
  const s = {};
  if (opts.bold) s.font = { ...(s.font || {}), bold: true, sz: opts.sz || 10 };
  else if (opts.sz) s.font = { ...(s.font || {}), sz: opts.sz };
  if (opts.color) s.font = { ...(s.font || {}), color: { rgb: opts.color }, sz: (s.font && s.font.sz) || opts.sz || 10 };
  if (opts.fill) s.fill = { fgColor: { rgb: opts.fill } };
  s.alignment = { horizontal: opts.align || 'center', vertical: 'center', wrapText: true };
  if (opts.border !== false) {
    s.border = {
      top: { style: 'thin', color: { rgb: opts.borderColor || 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: opts.borderColor || 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: opts.borderColor || 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: opts.borderColor || 'CCCCCC' } },
    };
  }
  cell.s = s;
  return cell;
}

function set(r, col, val) { ws[XLSX.utils.encode_cell({r, c: col})] = val; }
function merge(r1, c1, r2, c2) { merges.push({s:{r:r1,c:c1}, e:{r:r2,c:c2}}); }

let R = 0;

// ===== 행 0: 제목 =====
set(R, 0, c('주간 계획서', {bold:true, sz:16, fill:'1a365d', color:'FFFFFF'}));
merge(R, 0, R, 14);
R++;

// ===== 행 1: 기본 정보 =====
set(R, 0, c('월', {bold:true, fill:'E8EAF6', sz:10}));
set(R, 1, c('', {fill:'FFFFCC', sz:10}));
set(R, 2, c('주차', {bold:true, fill:'E8EAF6', sz:10}));
set(R, 3, c('', {fill:'FFFFCC', sz:10}));
set(R, 4, c('기간', {bold:true, fill:'E8EAF6', sz:10}));
set(R, 5, c('', {fill:'FFFFCC', sz:10})); merge(R, 5, R, 7);
set(R, 8, c('작성자', {bold:true, fill:'E8EAF6', sz:10}));
set(R, 9, c('', {fill:'FFFFCC', sz:10})); merge(R, 9, R, 10);
// 이번 주 한마디
set(R, 11, c('이번 주 한마디', {bold:true, fill:'FFF3E0', sz:10}));
set(R, 12, c('', {fill:'FFFFCC', sz:10, align:'left'})); merge(R, 12, R, 14);
R++;
R++; // 빈 행

// ===== 행 3~6: 이번 주 목표 (3개) =====
set(R, 0, c('🎯 이번 주 목표', {bold:true, sz:11, fill:'2E7D32', color:'FFFFFF'}));
merge(R, 0, R, 1);
set(R, 2, c('목표 내용', {bold:true, fill:'C8E6C9', sz:10}));
merge(R, 2, R, 10);
set(R, 11, c('완료 기준', {bold:true, fill:'C8E6C9', sz:10}));
merge(R, 11, R, 13);
set(R, 14, c('달성', {bold:true, fill:'C8E6C9', sz:10}));
R++;

for (let i = 1; i <= 3; i++) {
  set(R, 0, c('목표 ' + i, {bold:true, fill:'F1F8E9', sz:10}));
  merge(R, 0, R, 1);
  set(R, 2, c('', {sz:10, align:'left'})); merge(R, 2, R, 10);
  set(R, 11, c('', {sz:10, align:'left'})); merge(R, 11, R, 13);
  set(R, 14, c('☐', {fill:'FFFFCC', sz:10}));
  R++;
}
R++; // 빈 행

// ===== 일별 계획 (가로형: 월~일 = 열) =====
// 열 배치: 0=라벨, 1=공란, 2~3=월, 4~5=화, 6~7=수, 8~9=목, 10~11=금, 12~13=토, 14=일
// 실제로는 각 요일에 2열씩 (할일 + 목표번호)

set(R, 0, c('📅 일별 계획', {bold:true, sz:11, fill:'1565C0', color:'FFFFFF'}));
merge(R, 0, R, 14);
R++;

const days = ['월', '화', '수', '목', '금', '토', '일'];
const dayCols = [1, 3, 5, 7, 9, 11, 13]; // 각 요일 시작 열
const dayFills = ['BBDEFB','BBDEFB','BBDEFB','BBDEFB','BBDEFB','FFE0B2','FFCDD2'];

// 요일 헤더
set(R, 0, c('', {fill:'E3F2FD', sz:10}));
days.forEach((day, i) => {
  set(R, dayCols[i], c(day, {bold:true, fill:dayFills[i], sz:10}));
  merge(R, dayCols[i], R, dayCols[i]+1);
});
R++;

// 날짜 행
set(R, 0, c('날짜', {bold:true, fill:'E3F2FD', sz:9}));
days.forEach((_, i) => {
  set(R, dayCols[i], c('', {fill:'FFFFFF', sz:9}));
  merge(R, dayCols[i], R, dayCols[i]+1);
});
R++;

// 컨디션 행
set(R, 0, c('컨디션', {bold:true, fill:'E3F2FD', sz:9}));
days.forEach((_, i) => {
  set(R, dayCols[i], c('', {fill:'F5F5F5', sz:9}));
  merge(R, dayCols[i], R, dayCols[i]+1);
});
R++;

// 할일 헤더
set(R, 0, c('핵심 할일', {bold:true, fill:'E3F2FD', sz:9}));
days.forEach((_, i) => {
  set(R, dayCols[i], c('할일', {bold:true, fill:'E8EAF6', sz:8}));
  set(R, dayCols[i]+1, c('목표', {bold:true, fill:'E8EAF6', sz:8}));
});
R++;

// 할일 3줄
for (let t = 1; t <= 3; t++) {
  set(R, 0, c(t, {fill:'F5F5F5', sz:9}));
  days.forEach((_, i) => {
    set(R, dayCols[i], c('', {sz:9, align:'left'}));
    set(R, dayCols[i]+1, c('', {fill:'F5F5F5', sz:8}));
  });
  R++;
}

// 기타/메모 행
set(R, 0, c('메모', {bold:true, fill:'E3F2FD', sz:9}));
days.forEach((_, i) => {
  set(R, dayCols[i], c('', {sz:9, align:'left'}));
  merge(R, dayCols[i], R, dayCols[i]+1);
});
R++;
R++; // 빈 행

// ===== 핵심 프로젝트 진행 =====
set(R, 0, c('🚀 핵심 프로젝트 진행', {bold:true, sz:11, fill:'E65100', color:'FFFFFF'}));
merge(R, 0, R, 14);
R++;

set(R, 0, c('#', {bold:true, fill:'FFE0B2', sz:9}));
set(R, 1, c('프로젝트명', {bold:true, fill:'FFE0B2', sz:9})); merge(R, 1, R, 4);
set(R, 5, c('이번 주 할 것', {bold:true, fill:'FFE0B2', sz:9})); merge(R, 5, R, 10);
set(R, 11, c('진행상태', {bold:true, fill:'FFE0B2', sz:9})); merge(R, 11, R, 12);
set(R, 13, c('비고', {bold:true, fill:'FFE0B2', sz:9})); merge(R, 13, R, 14);
R++;

for (let i = 1; i <= 5; i++) {
  set(R, 0, c(i, {fill:'FFF3E0', sz:9}));
  set(R, 1, c('', {sz:9, align:'left'})); merge(R, 1, R, 4);
  set(R, 5, c('', {sz:9, align:'left'})); merge(R, 5, R, 10);
  set(R, 11, c('', {fill:'FFFFCC', sz:9})); merge(R, 11, R, 12);
  set(R, 13, c('', {sz:9, align:'left'})); merge(R, 13, R, 14);
  R++;
}
R++;

// ===== 주요 미팅/약속 + 마감 있는 것 (좌우 배치) =====
// 왼쪽: 미팅 (열 0~7), 오른쪽: 마감 (열 8~14)

set(R, 0, c('🤝 주요 미팅/약속', {bold:true, sz:11, fill:'6A1B9A', color:'FFFFFF'}));
merge(R, 0, R, 7);
set(R, 8, c('⚠️ 놓치면 안 되는 것 (마감)', {bold:true, sz:11, fill:'C62828', color:'FFFFFF'}));
merge(R, 8, R, 14);
R++;

// 헤더
set(R, 0, c('날짜', {bold:true, fill:'E1BEE7', sz:9}));
set(R, 1, c('시간', {bold:true, fill:'E1BEE7', sz:9}));
set(R, 2, c('대상', {bold:true, fill:'E1BEE7', sz:9})); merge(R, 2, R, 3);
set(R, 4, c('안건', {bold:true, fill:'E1BEE7', sz:9})); merge(R, 4, R, 6);
set(R, 7, c('비고', {bold:true, fill:'E1BEE7', sz:9}));

set(R, 8, c('마감일', {bold:true, fill:'FFCDD2', sz:9}));
set(R, 9, c('내용', {bold:true, fill:'FFCDD2', sz:9})); merge(R, 9, R, 13);
set(R, 14, c('완료', {bold:true, fill:'FFCDD2', sz:9}));
R++;

for (let i = 0; i < 5; i++) {
  set(R, 0, c('', {sz:9}));
  set(R, 1, c('', {sz:9}));
  set(R, 2, c('', {sz:9, align:'left'})); merge(R, 2, R, 3);
  set(R, 4, c('', {sz:9, align:'left'})); merge(R, 4, R, 6);
  set(R, 7, c('', {sz:9, align:'left'}));

  set(R, 8, c('', {sz:9}));
  set(R, 9, c('', {sz:9, align:'left'})); merge(R, 9, R, 13);
  set(R, 14, c('☐', {fill:'FFFFCC', sz:9}));
  R++;
}
R++;

// ===== 주간 회고 =====
set(R, 0, c('💭 주간 회고', {bold:true, sz:11, fill:'00695C', color:'FFFFFF'}));
merge(R, 0, R, 14);
R++;

const reviews = [
  {label: '✅ 잘한 것', fill: 'E0F2F1'},
  {label: '😅 아쉬운 것', fill: 'FFF8E1'},
  {label: '🔄 다음 주 개선점', fill: 'E8EAF6'},
  {label: '📚 이번 주 배운 것', fill: 'FCE4EC'},
];

reviews.forEach(item => {
  set(R, 0, c(item.label, {bold:true, fill:item.fill, sz:9}));
  merge(R, 0, R, 2);
  set(R, 3, c('', {sz:9, align:'left'}));
  merge(R, 3, R, 14);
  R++;
});

// ===== 시트 설정 =====
ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:R, c:14}});
ws['!merges'] = merges;
ws['!cols'] = [
  {wch: 10}, // A - 라벨
  {wch: 11}, // B - 월 할일
  {wch: 4},  // C - 월 목표
  {wch: 11}, // D - 화 할일
  {wch: 4},  // E - 화 목표
  {wch: 11}, // F - 수 할일
  {wch: 4},  // G - 수 목표
  {wch: 11}, // H - 목 할일
  {wch: 4},  // I - 목 목표
  {wch: 11}, // J - 금 할일
  {wch: 4},  // K - 금 목표
  {wch: 11}, // L - 토 할일
  {wch: 4},  // M - 토 목표
  {wch: 11}, // N - 일 할일
  {wch: 4},  // O - 일
];

ws['!rows'] = [];
for (let r = 0; r <= R; r++) {
  ws['!rows'][r] = { hpt: r === 0 ? 30 : 22 };
}

XLSX.utils.book_append_sheet(wb, ws, '주간계획서');

const outputPath = 'C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서-최종판.xlsx';
XLSX.writeFile(wb, outputPath);
console.log('완료: ' + outputPath);
