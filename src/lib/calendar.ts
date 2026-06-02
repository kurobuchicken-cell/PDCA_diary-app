// カレンダー表示のための計算（純粋関数）。日付は文字列(YYYY-MM-DD)で扱い、
// タイムゾーンの影響を受けないようにする。

/** "YYYY-MM" の月を、週ごと(日曜始まり)の grid にする。月外のマスは null。 */
export function monthGrid(ym: string): (string | null)[][] {
  const [y, m] = ym.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=日
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null); // 月初までの空白
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${y}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null); // 月末以降の空白

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "YYYY-MM" を delta ヶ月ずらす */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** "YYYY-MM" → "2026年6月" */
export function formatYmLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}年${m}月`;
}

/** "YYYY-MM-DD" → 日にちの数字（"06" など先頭ゼロを除く） */
export function dayOfMonth(dateKey: string): number {
  return Number(dateKey.split("-")[2]);
}
