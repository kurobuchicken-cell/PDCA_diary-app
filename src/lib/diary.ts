// 日記リストから情報を「計算するだけ」の純粋関数たち（保存などの副作用は無い）。
// 純粋関数はテストしやすく、サーバー・クライアントどちらからでも安全に呼べる。

import type { Diary } from "./types";
import { todayKey, prevDateKey } from "./date";

/** 指定日の日記を探す（なければ null） */
export function findByDate(diaries: Diary[], dateKey: string): Diary | null {
  return diaries.find((d) => d.date === dateKey) ?? null;
}

/**
 * 連続記録日数（ストリーク・要件6.1）を計算する。
 * 今日まだ書いていなくても、昨日までの連続は維持する（その日のうちは途切れない扱い）。
 * 日付は文字列(YYYY-MM-DD)で前日へ遡るので、タイムゾーンの影響を受けない。
 */
export function computeStreak(diaries: Diary[]): number {
  const days = new Set(diaries.map((d) => d.date));
  let cursor = todayKey();

  if (!days.has(cursor)) {
    cursor = prevDateKey(cursor);
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = prevDateKey(cursor);
  }
  return streak;
}
