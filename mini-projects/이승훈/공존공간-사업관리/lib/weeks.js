// lib/weeks.js — 주차 기반 월 범위 계산 (모든 업체 공통)
// 규칙: 매월 1일이 속한 주의 월요일부터 시작 (1일이 일요일이면 다음 월요일)
// 4주(28일) = 해당 월, 나머지는 다음 달로 이월

function getMonthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const dow = first.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

  const offset = dow === 0 ? 1 : -(dow - 1);
  const startDate = new Date(first.getTime() + offset * 86400000);
  const endDate = new Date(startDate.getTime() + 27 * 86400000); // 28일 (4주)

  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(startDate.getTime() + w * 7 * 86400000);
    const wEnd = new Date(wStart.getTime() + 6 * 86400000);
    weeks.push({ num: w + 1, start: toStr(wStart), end: toStr(wEnd) });
  }

  return { start: toStr(startDate), end: toStr(endDate), weeks };
}

module.exports = { getMonthRange };
