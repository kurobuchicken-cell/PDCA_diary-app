// グラフ画面（サーバーコンポーネント）。
// diaries に入っているタイム(100m/200m)を抜き出して、推移グラフを描く。

import { getDiaries } from "@/lib/sheets";
import TimeChart, { type Point } from "@/components/TimeChart";

export default async function GraphPage() {
  const diaries = await getDiaries();

  // 数値として有効なタイムだけを {date, value} に変換
  const toPoints = (
    pick: (d: (typeof diaries)[number]) => string | undefined
  ): Point[] =>
    diaries
      .map((d) => ({ date: d.date, raw: pick(d) }))
      .filter((p): p is { date: string; raw: string } => !!p.raw)
      .map((p) => ({ date: p.date, value: Number(p.raw) }))
      .filter((p) => Number.isFinite(p.value));

  const series100 = toPoints((d) => d.time100);
  const series200 = toPoints((d) => d.time200);
  const hasData = series100.length + series200.length > 0;

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">タイム推移</h1>
        <p className="mt-1 text-xs text-slate-400">
          ラインが下がるほどタイムが速い＝成長！
        </p>
      </header>

      {hasData ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <TimeChart series100={series100} series200={series200} />
          </div>
          {/* 凡例 */}
          <div className="flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-accent" />
              100m
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              200m
            </span>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          まだタイム記録がありません。
          <br />
          日記の入力画面で 100m / 200m のタイムを記録すると、ここにグラフが出ます。
        </div>
      )}
    </main>
  );
}
