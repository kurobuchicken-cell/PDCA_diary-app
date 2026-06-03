// 過去ログ画面（サーバーコンポーネント）。
//
// URL パラメータ:
//   ?q=キーワード  … plan/do/check/action をテキスト全文検索
//   ?date=YYYY-MM  … 月単位でフィルタ
//
// 親アカウント判定はサーバー側で行い isParent を DiaryCard に渡す。
// リアクション取得・追加はクライアント側で API を叩く（DiaryCard / ReactionForm）。

import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getDiaries, getAllReactions } from "@/lib/sheets";
import { formatJaDate } from "@/lib/date";
import type { Diary } from "@/lib/types";
import LogSearch from "./LogSearch";
import DiaryCard from "./DiaryCard";

function isParentEmail(email: string | null | undefined): boolean {
  const parentEmail = process.env.NOTIFY_PARENT_EMAIL?.toLowerCase();
  return !!email && !!parentEmail && email.toLowerCase() === parentEmail;
}

/** キーワード検索：plan/do/check/action のいずれかに含まれるか */
function matchesQuery(diary: Diary, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    diary.plan.toLowerCase().includes(lower) ||
    diary.do.toLowerCase().includes(lower) ||
    diary.check.toLowerCase().includes(lower) ||
    diary.action.toLowerCase().includes(lower)
  );
}

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;
  const [session, allDiaries, allReactions, jar] = await Promise.all([
    auth(),
    getDiaries(),
    getAllReactions(),
    cookies(),
  ]);
  const isParent = isParentEmail(session?.user?.email);

  // 子アカウントのとき、reactions_last_seen より新しいリアクションがある日記IDを求める
  const lastSeen = jar.get("reactions_last_seen")?.value ?? "";
  const unreadDiaryIds = isParent
    ? new Set<string>()
    : new Set(
        allReactions
          .filter((r) => !lastSeen || r.createdAt > lastSeen)
          .map((r) => r.diaryId)
      );

  // フィルタ適用
  const filtered = allDiaries.filter((d) => {
    if (date && !d.date.startsWith(date)) return false;
    if (q && !matchesQuery(d, q)) return false;
    return true;
  });

  return (
    <main className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">過去ログ</h1>
        <p className="mt-1 text-xs text-slate-400">
          日記を検索・一覧表示します
        </p>
      </header>

      {/* 検索フォーム */}
      <LogSearch defaultQ={q ?? ""} defaultDate={date ?? ""} />

      {/* 件数表示 */}
      <p className="text-sm text-slate-500">
        {filtered.length > 0
          ? `${filtered.length} 件`
          : "条件に合う日記がありません"}
        {(q || date) && (
          <a href="/log" className="ml-3 text-accent underline text-xs">
            検索クリア
          </a>
        )}
      </p>

      {/* 日記リスト */}
      <ul className="flex flex-col gap-3">
        {filtered.map((diary) => (
          <li key={diary.id}>
            <DiaryCard
              diary={diary}
              isParent={isParent}
              dateLabel={formatJaDate(diary.date)}
              hasUnread={unreadDiaryIds.has(diary.id)}
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && allDiaries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          まだ日記がありません。
          <br />
          入力画面から最初の記録を書いてみましょう！
        </div>
      )}
    </main>
  );
}
