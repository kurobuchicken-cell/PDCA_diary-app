// 後のステップで作る画面の「準備中」表示。
// ナビゲーションのリンク切れ(404)を防ぎつつ、開発の進捗を示す。

export default function ComingSoon({
  title,
  step,
}: {
  title: string;
  step: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-slate-400">この画面は {step} で作ります。</p>
      <span className="mt-2 text-4xl">🚧</span>
    </main>
  );
}
