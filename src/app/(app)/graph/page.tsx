// グラフ画面（サーバーコンポーネント）。
// diaries に入っているタイム(100m/200m)を抜き出して、推移グラフを描く。
// 6.3: 日記テキストを書いた日 vs 書かなかった日のタイム平均も比較する。

import { getDiaries } from "@/lib/sheets";
import TimeChart, { type Point } from "@/components/TimeChart";

/** 平均を小数点2桁で返す。値がなければ null */
function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

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

  // 6.3 相関：日記テキストあり(PDCA いずれか記入)の日 vs テキストなし(タイムのみ)の日
  // タイムを持つ日記を「テキスト有」と「テキスト無」に分類
  const diariesWithTime100 = diaries.filter(
    (d) => d.time100 && Number.isFinite(Number(d.time100))
  );
  const diariesWithTime200 = diaries.filter(
    (d) => d.time200 && Number.isFinite(Number(d.time200))
  );

  const hasText = (d: (typeof diaries)[number]) =>
    !!(d.plan || d.do || d.check || d.action);

  const avg100WithText = avg(
    diariesWithTime100.filter(hasText).map((d) => Number(d.time100))
  );
  const avg100NoText = avg(
    diariesWithTime100.filter((d) => !hasText(d)).map((d) => Number(d.time100))
  );
  const avg200WithText = avg(
    diariesWithTime200.filter(hasText).map((d) => Number(d.time200))
  );
  const avg200NoText = avg(
    diariesWithTime200.filter((d) => !hasText(d)).map((d) => Number(d.time200))
  );

  // 両グループにデータがあるときだけ相関セクションを表示
  const showCorrelation =
    (avg100WithText !== null && avg100NoText !== null) ||
    (avg200WithText !== null && avg200NoText !== null);

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

      {/* 6.3 相関セクション：日記テキストとタイムの関係 */}
      {showCorrelation && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-bold text-slate-700">
            📊 日記とタイムの相関
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            PDCA テキストを書いた日と書かなかった日の平均タイムを比較します。
          </p>
          <div className="flex flex-col gap-3">
            {avg100WithText !== null && avg100NoText !== null && (
              <CorrelationRow
                label="100m"
                withText={avg100WithText}
                noText={avg100NoText}
                count100={{
                  withText: diariesWithTime100.filter(hasText).length,
                  noText: diariesWithTime100.filter((d) => !hasText(d)).length,
                }}
              />
            )}
            {avg200WithText !== null && avg200NoText !== null && (
              <CorrelationRow
                label="200m"
                withText={avg200WithText}
                noText={avg200NoText}
                count100={{
                  withText: diariesWithTime200.filter(hasText).length,
                  noText: diariesWithTime200.filter((d) => !hasText(d)).length,
                }}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/** 相関比較の1行コンポーネント */
function CorrelationRow({
  label,
  withText,
  noText,
  count100,
}: {
  label: string;
  withText: number;
  noText: number;
  count100: { withText: number; noText: number };
}) {
  // タイムは小さいほど速い。差がマイナス=テキスト有の方が速い
  const diff = withText - noText;
  const faster = diff < 0 ? "テキストあり" : diff > 0 ? "テキストなし" : "同等";
  const diffAbs = Math.abs(diff).toFixed(2);

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-2 text-xs font-bold text-slate-600">{label}</p>
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-lg bg-orange-100 p-2">
          <p className="text-xs text-orange-600 font-medium mb-0.5">
            📓 日記あり（{count100.withText}日）
          </p>
          <p className="text-lg font-bold text-orange-700">
            {withText.toFixed(2)}
            <span className="text-xs font-normal">秒</span>
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2">
          <p className="text-xs text-slate-500 font-medium mb-0.5">
            📭 日記なし（{count100.noText}日）
          </p>
          <p className="text-lg font-bold text-slate-600">
            {noText.toFixed(2)}
            <span className="text-xs font-normal">秒</span>
          </p>
        </div>
      </div>
      {diff !== 0 && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          {faster}の方が{" "}
          <span className="font-bold text-slate-700">{diffAbs}秒</span> 速い
        </p>
      )}
    </div>
  );
}
