// カレンダー画面（サーバーコンポーネント）。
// 入力した日を色分け表示し、月を前後に移動できる。連続記録日数も表示。
// 月の切り替えは URL の ?ym=YYYY-MM で行う（クリック状態を持たなくて済む）。

import Link from "next/link";
import { getDiaries } from "@/lib/sheets";
import { computeStreak } from "@/lib/diary";
import { todayKey } from "@/lib/date";
import {
  monthGrid,
  shiftMonth,
  formatYmLabel,
  dayOfMonth,
} from "@/lib/calendar";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const { ym } = await searchParams;
  const month = ym ?? todayKey().slice(0, 7); // 指定なければ今月

  const diaries = await getDiaries();
  const entryDays = new Set(diaries.map((d) => d.date)); // 入力済みの日
  const streak = computeStreak(diaries);
  const weeks = monthGrid(month);
  const today = todayKey();

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <p className="mt-1 text-sm text-slate-500">🔥 連続 {streak} 日</p>
      </header>

      {/* 月の移動 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendar?ym=${shiftMonth(month, -1)}`}
          className="rounded-lg px-3 py-1 text-slate-500 active:bg-slate-100"
        >
          ‹ 前月
        </Link>
        <span className="font-bold">{formatYmLabel(month)}</span>
        <Link
          href={`/calendar?ym=${shiftMonth(month, 1)}`}
          className="rounded-lg px-3 py-1 text-slate-500 active:bg-slate-100"
        >
          翌月 ›
        </Link>
      </div>

      {/* カレンダー本体 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {/* 曜日見出し */}
        <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-400">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        {/* 日付マス */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((dateKey, i) => {
            if (!dateKey) return <div key={i} className="aspect-square" />;
            const hasEntry = entryDays.has(dateKey);
            const isToday = dateKey === today;
            return (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-lg text-sm ${
                  hasEntry ? "bg-accent font-bold text-white" : "text-slate-600"
                } ${isToday ? "ring-2 ring-orange-300" : ""}`}
              >
                {dayOfMonth(dateKey)}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        <span className="mr-1 inline-block h-3 w-3 rounded bg-accent align-middle" />
        日記を書いた日
      </p>
    </main>
  );
}
