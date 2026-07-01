// ホーム画面（サーバーコンポーネント）。
// サーバー側でスプレッドシートから日記を読み込み、計算して表示する。
// データ取得が await で書けるのがサーバーコンポーネントの良いところ。

import Link from "next/link";
import { cookies } from "next/headers";
import { getDiaries, getAllReactions } from "@/lib/sheets";
import { computeStreak, findByDate } from "@/lib/diary";
import { formatJaDate, todayKey } from "@/lib/date";
import { auth } from "@/auth";

function isSonEmail(email: string | null | undefined): boolean {
  const sonEmail = process.env.NOTIFY_SON_EMAIL?.toLowerCase();
  return !!email && !!sonEmail && email.toLowerCase() === sonEmail;
}

export default async function HomePage() {
  const [session, diaries, reactions, jar] = await Promise.all([
    auth(),
    getDiaries(),
    getAllReactions(),
    cookies(),
  ]);

  const today = findByDate(diaries, todayKey());
  const streak = computeStreak(diaries);
  const latest = diaries[0] ?? null;

  // 子アカウントのとき、未読リアクションがあるかチェックする
  const isSon = isSonEmail(session?.user?.email);
  const lastSeen = jar.get("reactions_last_seen")?.value ?? "";
  const hasUnread =
    isSon &&
    reactions.some(
      (r) => !lastSeen || r.createdAt > lastSeen
    );

  return (
    <main className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-slate-500">{formatJaDate(todayKey())}</p>
        <h1 className="text-2xl font-bold">陸上PDCA日記</h1>
      </header>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hero.png" alt="なーいくん PDCAプロジェクト" className="w-full rounded-2xl" />

      {/* 親からの未読リアクション通知 */}
      {hasUnread && (
        <Link
          href="/log"
          className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-blue-700"
        >
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-bold text-sm">過去ログに親からの返信があります</p>
            <p className="text-xs opacity-75">タップして確認する</p>
          </div>
        </Link>
      )}

      {/* 連続記録カウント（6.1） */}
      <section className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white shadow">
        <span className="text-4xl">🔥</span>
        <div>
          <p className="text-sm opacity-90">連続記録</p>
          <p className="text-3xl font-bold leading-tight">
            {streak}
            <span className="ml-1 text-base font-medium">日</span>
          </p>
        </div>
      </section>

      {/* 今日の入力状況 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-bold text-slate-500">今日の入力</h2>
        {today ? (
          <div className="flex items-center justify-between">
            <p className="font-bold text-green-600">✓ 今日の日記は完了！</p>
            <Link
              href="/write"
              className="text-sm font-medium text-accent underline"
            >
              修正する
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-slate-600">まだ今日の日記がありません。</p>
            <Link
              href="/write"
              className="rounded-xl bg-accent py-3 text-center font-bold text-white active:scale-95"
            >
              ✏️ 今日の日記を書く
            </Link>
          </div>
        )}
      </section>

      {/* 直近の振り返り */}
      {latest && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-bold text-slate-500">
            直近の振り返り（{formatJaDate(latest.date)}）
          </h2>
          {latest.check ? (
            <p className="mb-2 text-slate-700">
              <span className="mr-1 font-bold text-orange-500">C</span>
              {latest.check}
            </p>
          ) : null}
          {latest.action ? (
            <p className="text-slate-700">
              <span className="mr-1 font-bold text-orange-500">A</span>
              {latest.action}
            </p>
          ) : null}
          {!latest.check && !latest.action && (
            <p className="text-slate-400">振り返りの記入はありません。</p>
          )}
        </section>
      )}
    </main>
  );
}
