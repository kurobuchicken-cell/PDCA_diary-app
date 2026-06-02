// 認証の中心設定（Auth.js / NextAuth v5）。
//
// ・Googleアカウントでログインする。
// ・「家族だけ」にするため、許可したメールアドレス以外はログインを拒否する。
//   許可リストは環境変数 ALLOWED_EMAILS に「カンマ区切り」で書く。
//   例) ALLOWED_EMAILS="son@gmail.com,parent@gmail.com"
//
// ここで作られる auth / signIn / signOut / handlers を、各所で使う。

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

/** 環境変数から「許可メール一覧」を読み取る（小文字に統一） */
function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// アクセストークンの有効期限が切れたら、refresh_token で更新する。
// （Googleのアクセストークンは約1時間で切れるため、長く使うには更新が必要）
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) return token;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID ?? "",
        client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    token.accessToken = data.access_token;
    token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
    // Googleは更新時にrefresh_tokenを返さないことが多いので、返ってきた時だけ更新
    if (data.refresh_token) token.refreshToken = data.refresh_token;
    return token;
  } catch (e) {
    console.error("アクセストークン更新失敗:", e);
    // invalid_grant などトークン無効エラーは error フラグを立てて返す。
    // middleware がこのフラグを見てサインアウトへ誘導する。
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // 動画をドライブに保存するため drive.file 権限を要求。
      // access_type=offline + prompt=consent で refresh_token を得る。
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login", // 未ログイン時に見せる画面
  },
  callbacks: {
    // ログイン可否の判定。許可リストに無いメールは false を返して拒否する。
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      const list = allowedEmails();
      // 許可リスト未設定（開発初期）なら、誰でも入れてしまわないよう拒否する
      if (list.length === 0) return false;
      return !!email && list.includes(email);
    },
    // Googleのトークンを JWT に保存し、期限切れ前に自動更新する
    async jwt({ token, account }) {
      // 初回ログイン時：プロバイダから受け取ったトークンを保存
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // UNIX秒
        return token;
      }
      // まだ期限内（60秒の余裕を持たせる）ならそのまま使う
      if (token.expiresAt && Date.now() < token.expiresAt * 1000 - 60_000) {
        return token;
      }
      // 期限切れ：更新する
      return refreshAccessToken(token);
    },
    // クライアント/サーバーから使えるよう、セッションにアクセストークンを載せる
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      // トークン更新エラー時はセッションにフラグを渡す（middleware でサインアウト）
      if (token.error) session.error = token.error as string;
      return session;
    },
  },
});
