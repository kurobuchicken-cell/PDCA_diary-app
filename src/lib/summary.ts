// 週次サマリー(6.2)の本文を作る純粋関数。
// 内容：今週の記録日数・連続日数・タイムの変化・今週書いた Check / Action。

import type { Diary } from "./types";
import { todayKey, prevDateKey, formatJaDate } from "./date";
import { computeStreak } from "./diary";

/** 直近7日（今日含む）の日付キー一覧 */
function last7Days(): string[] {
  const days: string[] = [];
  let c = todayKey();
  for (let i = 0; i < 7; i++) {
    days.push(c);
    c = prevDateKey(c);
  }
  return days;
}

/** あるタイム列の「週内の最初→最後」の変化を1行の文にする */
function timeChangeLine(
  label: string,
  week: Diary[],
  pick: (d: Diary) => string | undefined
): string | null {
  const pts = week
    .map((d) => ({ date: d.date, v: Number(pick(d)) }))
    .filter((p) => Number.isFinite(p.v) && p.v > 0);
  if (pts.length === 0) return null;
  if (pts.length === 1) return `${label}: ${pts[0].v.toFixed(2)}秒`;
  const first = pts[0].v;
  const last = pts[pts.length - 1].v;
  const diff = last - first;
  const note = diff < 0 ? "速くなった！🎉" : diff > 0 ? "やや遅い" : "変化なし";
  const sign = diff > 0 ? "+" : "";
  return `${label}: ${first.toFixed(2)} → ${last.toFixed(2)}秒 (${sign}${diff.toFixed(2)}) ${note}`;
}

/** 週次サマリーの本文(テキスト)を作る */
export function buildWeeklySummary(diaries: Diary[]): string {
  const set = new Set(last7Days());
  const week = diaries
    .filter((d) => set.has(d.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const lines: string[] = [];
  lines.push("【今週のふりかえり】");
  lines.push("");
  lines.push(`📝 記録した日数：7日中 ${week.length}日`);
  lines.push(`🔥 連続記録：${computeStreak(diaries)}日`);

  // タイムの変化
  const t100 = timeChangeLine("100m", week, (d) => d.time100);
  const t200 = timeChangeLine("200m", week, (d) => d.time200);
  if (t100 || t200) {
    lines.push("");
    lines.push("⏱ タイムの変化");
    if (t100) lines.push(`　${t100}`);
    if (t200) lines.push(`　${t200}`);
  }

  // 今週の Check / Action 抜粋
  const reflections = week.filter((d) => d.check || d.action);
  if (reflections.length > 0) {
    lines.push("");
    lines.push("💭 今週の気づき・修正");
    for (const d of reflections) {
      lines.push(`■ ${formatJaDate(d.date)}`);
      if (d.check) lines.push(`　C: ${d.check}`);
      if (d.action) lines.push(`　A: ${d.action}`);
    }
  }

  lines.push("");
  lines.push("来週も一歩ずつ！🏃");
  return lines.join("\n");
}
