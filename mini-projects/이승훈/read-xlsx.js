const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\leeha\\OneDrive\\바탕 화면\\주간계획서.xlsx');
console.log('시트 목록:', wb.SheetNames);
wb.SheetNames.forEach(name => {
  console.log('\n=== ' + name + ' ===');
  const ws = wb.Sheets[name];
  console.log('범위:', ws['!ref']);
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  data.slice(0, 40).forEach((row, i) => {
    const hasContent = row.some(c => c !== '');
    if (hasContent) console.log('행' + i + ':', JSON.stringify(row));
  });
  // 병합 셀 확인
  if (ws['!merges']) {
    console.log('병합셀:', JSON.stringify(ws['!merges'].slice(0, 20)));
  }
});
