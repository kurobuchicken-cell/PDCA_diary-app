// proxy（旧middleware）＝全リクエストの「入口の門番」。
//
// 認証の2段階：
//  1. Googleログイン済みか（Auth.jsのセッション）
//  2. PINコードを入力済みか（pin_verified Cookie）
//
// 両方OK → 通す。どちらか欠けていれば適切なページへリダイレクト。

import { auth } from "@/auth";
import type { NextRequest } from "next/server";

const PIN_COOKIE = "pin_verified";

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isPinVerified = req.cookies.get(PIN_COOKIE)?.value === "1";

  const isLoginPage = pathname === "/login";
  const isPinPage = pathname === "/pin";

  // 未ログイン → ログイン画面へ（pin_verified クッキーも同時に削除）
  if (!isLoggedIn) {
    const dest = isLoginPage ? null : new URL("/login", req.nextUrl.origin);
    const res = dest
      ? Response.redirect(dest)
      : new Response(null, { status: 200 });
    // セッションが切れたら PIN クッキーも無効化する
    if (isPinVerified) {
      res.headers.set(
        "Set-Cookie",
        "pin_verified=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
      );
    }
    if (!dest) return; // ログイン画面はそのまま表示
    return res;
  }

  // ログイン済みでログイン画面 → PIN画面へ（PINが通れば / へ）
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(
      new URL(isPinVerified ? "/" : "/pin", req.nextUrl.origin)
    );
  }

  // ログイン済みでPIN未入力 → PIN画面へ（PIN画面自体は除外）
  if (isLoggedIn && !isPinVerified && !isPinPage) {
    return Response.redirect(new URL("/pin", req.nextUrl.origin));
  }

  // ログイン済みでPIN入力済み、かつPIN画面にいる → ホームへ
  if (isLoggedIn && isPinVerified && isPinPage) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
