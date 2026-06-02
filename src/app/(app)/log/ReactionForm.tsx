"use client";

// リアクション追加フォーム（クライアントコンポーネント）。
// 親アカウントのみ表示される（DiaryCard で isParent を確認済み）。
// スタンプを選んで一言コメントを添えてサーバーアクションを呼ぶ。

import { useState, useTransition } from "react";
import { addReactionAction } from "./actions";

const STAMPS = ["👍", "🔥", "💪", "🎉", "✨"];

export default function ReactionForm({
  diaryId,
  onSaved,
}: {
  diaryId: string;
  onSaved: () => void;
}) {
  const [stamp, setStamp] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stamp) {
      setError("スタンプを選んでください");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addReactionAction(diaryId, stamp, comment);
        setStamp("");
        setComment("");
        onSaved(); // 親コンポーネントにリアクション再取得を指示
      } catch (e) {
        setError((e as Error).message ?? "送信に失敗しました");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 flex flex-col gap-2"
    >
      <p className="text-xs font-bold text-amber-700">リアクションを送る</p>

      {/* スタンプ選択 */}
      <div className="flex gap-2">
        {STAMPS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStamp(s)}
            className={`text-2xl rounded-xl px-2 py-1 transition-all ${
              stamp === s
                ? "bg-amber-200 ring-2 ring-amber-400 scale-110"
                : "bg-white active:scale-95"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 一言コメント */}
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="一言コメント（任意）"
        maxLength={100}
        className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-amber-400 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {isPending ? "送信中…" : "送る"}
      </button>
    </form>
  );
}
