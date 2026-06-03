// proxy（旧middleware）＝全リクエストの「入口の門番」。
//
// 認証の2段階：
//  1. Googleログイン済みか（Auth.jsのセッション）
//  2. PINコードを入力済みか（pin_verified Cookie）
//
// 両方OK → 通す。どちらか欠けていれば適切なページへリダイレクト。

import { auth } from "@/auth";
import { NextResponse } from "next/server";
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
    if (isLoginPage) {
      // ログイン画面はそのまま表示。pin_verified が残っていれば削除する
      if (isPinVerified) {
        const res = NextResponse.next();
        res.cookies.set("pin_verified", "", { maxAge: 0, path: "/" });
        return res;
      }
      return; // PIN クッキー不要ならそのまま通す
    }
    // 保護ページ → /login へリダイレクト。同時に PIN クッキーを削除する
    const res = NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    if (isPinVerified) {
      res.cookies.set("pin_verified", "", { maxAge: 0, path: "/" });
    }
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
