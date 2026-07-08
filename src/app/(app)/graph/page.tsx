// グラフ画面（サーバーコンポーネント）。
// 100m実測タイムと100m無風換算タイムの推移グラフを表示する。

import { getDiaries } from "@/lib/sheets";
import TimeChart, { type Point } from "@/components/TimeChart";

/**
 * 無風換算タイムを計算する。
 * 式: 記録 × ( 1.03 − 0.03 × (1 − 風速×記録÷100)² )
 * 風速は追い風＝プラス、向かい風＝マイナス。
 */
function calcWindAdjusted(
  record: number,
  direction: "none" | "tail" | "head" | undefined,
  speed: number | undefined
): number {
  if (!direction || direction === "none" || !speed) return record;
  const signed = direction === "tail" ? speed : -speed;
  return record * (1.03 - 0.03 * Math.pow(1 - (signed * record) / 100, 2));
}

export default async function GraphPage() {
  const diaries = await getDiaries();

  // 100m実測タイム
  const series100: Point[] = diaries
    .filter((d) => d.time100 && Number.isFinite(Number(d.time100)))
    .map((d) => ({ date: d.date, value: Number(d.time100) }));

  // 100m無風換算タイム（風データがある記録のみ）
  const seriesAdjusted: Point[] = diaries
    .filter((d) => d.time100 && Number.isFinite(Number(d.time100)))
    .map((d) => ({
      date: d.date,
      value: calcWindAdjusted(
        Number(d.time100),
        d.wind100Direction,
        d.wind100Speed
      ),
    }))
    // 無風の場合は実測と同じ値になるので省略（風データがある記録だけ表示）
    .filter((p, i) => {
      const d = diaries.filter(
        (d) => d.time100 && Number.isFinite(Number(d.time100))
      )[i];
      return d?.wind100Direction && d.wind100Direction !== "none";
    });

  const hasData = series100.length > 0;

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
            <TimeChart series100={series100} seriesAdjusted={seriesAdjusted} />
          </div>
          {/* 凡例 */}
          <div className="flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-accent" />
              100m実測
            </span>
            {seriesAdjusted.length > 0 && (
              <span className="flex items-center gap-1">
                <svg width="16" height="12" className="shrink-0">
                  <line
                    x1="0" y1="6" x2="16" y2="6"
                    stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"
                  />
                </svg>
                無風換算
              </span>
            )}
          </div>
          {seriesAdjusted.length === 0 && (
            <p className="text-center text-xs text-slate-400">
              タイム入力時に風向・風速を記録すると、無風換算タイムのグラフが表示されます。
            </p>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          まだタイム記録がありません。
          <br />
          日記の入力画面で 100m のタイムを記録すると、ここにグラフが出ます。
        </div>
      )}
    </main>
  );
}
