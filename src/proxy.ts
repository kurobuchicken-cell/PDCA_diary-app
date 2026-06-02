// proxy（旧middleware）＝全リクエストの「入口の門番」。Next 16の新名称。
// ログインしていない人を /login に送り返し、ログイン済みなら /login に来たら
// ホームへ戻す。これでアプリ全体が「家族だけ」に守られる。

import { auth, signOut } from "@/auth";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  // トークン更新に失敗した場合（invalid_grant など）はサインアウトしてログインへ
  if (req.auth?.error === "RefreshAccessTokenError") {
    await signOut({ redirect: false });
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

// 門番を通す対象。API・静的ファイル・画像・faviconは対象外（除外）。
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
