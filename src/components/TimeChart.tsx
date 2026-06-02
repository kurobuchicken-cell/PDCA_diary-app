// タイム推移の折れ線グラフ（SVGを手書き）。外部ライブラリ不要・静的に描画。
//
// 考え方：
//  ・横(x)は日付の並び順、縦(y)はタイム(秒)。
//  ・y軸は「大きい値ほど上」。タイムは小さいほど速いので、
//    ラインが下がるほど速くなった＝成長、と読める。

export type Point = { date: string; value: number };

type Props = {
  series100: Point[];
  series200: Point[];
};

// 描画領域のサイズ（viewBox基準。実寸は親に合わせて伸縮）
const W = 320;
const H = 200;
const PAD_L = 34; // 左の目盛り用
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 24; // 下の日付用
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

export default function TimeChart({ series100, series200 }: Props) {
  // x軸＝両系列の日付をまとめて昇順に並べたもの
  const dates = Array.from(
    new Set([...series100, ...series200].map((p) => p.date))
  ).sort();

  // y軸の範囲（両系列の最小・最大。少し余白を持たせる）
  const values = [...series100, ...series200].map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const pad = (maxV - minV) * 0.15 || 1; // 全部同じ値でも潰れないように
  const lo = minV - pad;
  const hi = maxV + pad;

  const xFor = (date: string) => {
    const i = dates.indexOf(date);
    if (dates.length <= 1) return PAD_L + CHART_W / 2;
    return PAD_L + (i / (dates.length - 1)) * CHART_W;
  };
  const yFor = (v: number) =>
    PAD_T + ((hi - v) / (hi - lo)) * CHART_H; // 大きい値ほど上

  const toPolyline = (s: Point[]) =>
    s
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((p) => `${xFor(p.date).toFixed(1)},${yFor(p.value).toFixed(1)}`)
      .join(" ");

  // y目盛り（下・中・上の3本）
  const ticks = [lo, (lo + hi) / 2, hi];
  // x日付ラベル（多すぎないよう最大5個に間引く）
  const labelStep = Math.max(1, Math.ceil(dates.length / 5));
  const xLabels = dates.filter((_, i) => i % labelStep === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {/* y目盛り線とラベル */}
      {ticks.map((t, i) => {
        const y = yFor(t);
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={y}
              x2={W - PAD_R}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text x={4} y={y + 3} fontSize={9} fill="#94a3b8">
              {t.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* x日付ラベル */}
      {xLabels.map((d) => {
        const [, m, day] = d.split("-");
        return (
          <text
            key={d}
            x={xFor(d)}
            y={H - 8}
            fontSize={9}
            fill="#94a3b8"
            textAnchor="middle"
          >
            {Number(m)}/{Number(day)}
          </text>
        );
      })}

      {/* 200m（青） */}
      {series200.length > 0 && (
        <polyline
          points={toPolyline(series200)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      )}
      {series200.map((p) => (
        <circle key={`b${p.date}`} cx={xFor(p.date)} cy={yFor(p.value)} r={3} fill="#3b82f6" />
      ))}

      {/* 100m（オレンジ） */}
      {series100.length > 0 && (
        <polyline
          points={toPolyline(series100)}
          fill="none"
          stroke="#f97316"
          strokeWidth={2}
        />
      )}
      {series100.map((p) => (
        <circle key={`o${p.date}`} cx={xFor(p.date)} cy={yFor(p.value)} r={3} fill="#f97316" />
      ))}
    </svg>
  );
}
