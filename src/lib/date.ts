// 日付まわりの小さなユーティリティ。
// 「今日」は必ず日本時間(Asia/Tokyo)で判定する。
// ※ Vercelなどのサーバーは標準でUTCで動くため、何もしないと日本と日付がずれる。
//   それを防ぐため、明示的に日本時間で計算する。

const TZ = "Asia/Tokyo";

/** Date → "YYYY-MM-DD"（日本時間基準）。en-CA は YYYY-MM-DD 形式を返す */
export function toDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** 今日の "YYYY-MM-DD"（日本時間） */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** "YYYY-MM-DD" の前日を返す（文字列ベースで安全に計算） */
export function prevDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" を「6月1日(日)」のような表示用文字列に */
export function formatJaDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getUTCDay()];
  return `${m}月${d}日(${week})`;
}
