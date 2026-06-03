// (app) グループのレイアウト＝ログインが必要なエリア共通の枠。
// ・ログインしていなければ /login へ（ミドルウェアに加えた二重の安全策）。
// ・上部に小さなバー（ユーザー表示＋ログアウト）、下部にナビを置く。
//
// これはサーバーコンポーネントなので、auth() でログイン情報を安全に取得できる。

import { auth, signOut } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-20">
        {/* 上部バー：誰でログインしているか＋ログアウト */}
        <div className="flex items-center justify-between py-3">
          <span className="truncate text-xs text-slate-400">
            {session.user.name ?? session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              // ログアウト時に PIN クッキーをサーバー側で確実に削除する
              const jar = await cookies();
              jar.delete("pin_verified");
              jar.delete("pin_verified_email");
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-2 py-1 text-xs text-slate-400 active:text-slate-600"
            >
              ログアウト
            </button>
          </form>
        </div>

        {children}
      </div>
      <BottomNav />
    </>
  );
}
