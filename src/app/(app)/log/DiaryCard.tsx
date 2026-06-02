"use client";

// 日記カード（クライアントコンポーネント）。
// タップで詳細を展開するアコーディオン形式。
// 展開時に /api/reactions からリアクションを取得して表示する（6.4）。
// 親アカウント（isParent=true）のときだけリアクション追加フォームを出す。

import { useState, useEffect } from "react";
import type { Diary, Reaction } from "@/lib/types";
import VideoPlayer from "@/components/VideoPlayer";
import ReactionForm from "./ReactionForm";

const PDCA_LABELS: { key: keyof Diary; badge: string; color: string }[] = [
  { key: "plan", badge: "P", color: "bg-blue-500" },
  { key: "do", badge: "D", color: "bg-green-500" },
  { key: "check", badge: "C", color: "bg-amber-500" },
  { key: "action", badge: "A", color: "bg-accent" },
];

export default function DiaryCard({
  diary,
  isParent,
  dateLabel,
}: {
  diary: Diary;
  isParent: boolean;
  dateLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // null=未取得, Reaction[]=取得済み（展開時に fetch）
  const [reactions, setReactions] = useState<Reaction[] | null>(null);

  // カード展開時にリアクションを取得する（effect 内で async 関数を呼ぶ）
  useEffect(() => {
    if (!open || reactions !== null) return;
    async function load() {
      const r = await fetch(`/api/reactions?diary_id=${diary.id}`);
      const data = await r.json().catch(() => ({ reactions: [] }));
      setReactions(data.reactions ?? []);
    }
    load().catch(() => setReactions([]));
  }, [open, diary.id, reactions]);

  // reactions が null のままで open になっている間はローディング中とみなす
  const loading = open && reactions === null;

  // ReactionForm が保存したあとリアクションを再取得する
  function refreshReactions() {
    setReactions(null); // null にすると useEffect が再フェッチ
  }

  const hasTimes = diary.time100 || diary.time200;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* ヘッダー行（常に表示） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-slate-50"
      >
        {/* 日付 */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700 text-sm">{dateLabel}</p>
          {/* サマリー：plan か check の先頭50文字 */}
          {diary.plan || diary.check ? (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {(diary.plan || diary.check).slice(0, 50)}
            </p>
          ) : (
            <p className="text-xs text-slate-300 mt-0.5">（テキストなし）</p>
          )}
        </div>

        {/* バッジ群 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasTimes && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 font-medium">
              タイム
            </span>
          )}
          {diary.videoFileId && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600 font-medium">
              動画
            </span>
          )}
          <span className="text-slate-300 text-lg">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* 詳細（展開時のみ） */}
      {open && (
        <div className="border-t border-slate-100 px-4 py-4 flex flex-col gap-4">
          {/* PDCA 4項目 */}
          {PDCA_LABELS.map(({ key, badge, color }) => {
            const value = diary[key] as string;
            return (
              <div key={key}>
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${color} mr-2`}
                >
                  {badge}
                </span>
                {value ? (
                  <span className="text-slate-700 text-sm whitespace-pre-wrap">
                    {value}
                  </span>
                ) : (
                  <span className="text-slate-300 text-sm">（未入力）</span>
                )}
              </div>
            );
          })}

          {/* タイム */}
          {hasTimes && (
            <div className="rounded-xl bg-blue-50 p-3 flex gap-4 text-sm">
              {diary.time100 && (
                <span>
                  <span className="font-bold">100m</span> {diary.time100}秒
                </span>
              )}
              {diary.time200 && (
                <span>
                  <span className="font-bold">200m</span> {diary.time200}秒
                </span>
              )}
            </div>
          )}

          {/* 動画 */}
          {diary.videoFileId && (
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">練習動画</p>
              <VideoPlayer fileId={diary.videoFileId} />
            </div>
          )}

          {/* リアクション */}
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">
              親からのリアクション
            </p>
            {loading && (
              <p className="text-xs text-slate-400">読み込み中…</p>
            )}
            {reactions && reactions.length > 0 && (
              <ul className="flex flex-col gap-2">
                {reactions.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2"
                  >
                    <span className="text-xl">{r.stamp}</span>
                    {r.comment && (
                      <p className="text-sm text-slate-700 pt-0.5">
                        {r.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {reactions && reactions.length === 0 && !isParent && (
              <p className="text-xs text-slate-300">まだリアクションがありません</p>
            )}

            {/* 親アカウントのみリアクション追加フォームを表示 */}
            {isParent && (
              <ReactionForm
                diaryId={diary.id}
                onSaved={refreshReactions}
              />
            )}
          </div>
        </div>
      )}
    </article>
  );
}
