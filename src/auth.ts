// 認証の中心設定（Auth.js / NextAuth v5）。
//
// ・Googleアカウントでログインする。
// ・「家族だけ」にするため、許可したメールアドレス以外はログインを拒否する。
//   許可リストは環境変数 ALLOWED_EMAILS に「カンマ区切り」で書く。
//   例) ALLOWED_EMAILS="son@gmail.com,parent@gmail.com"
//
// ここで作られる auth / signIn / signOut / handlers を、各所で使う。
//
// ※ アクセストークンの自動リフレッシュは行わない。
//   invalid_grant を避けるため、ログイン時のトークンをセッション期間中そのまま使う。
//   アクセストークンの有効期限（約1時間）が切れたらユーザーに再ログインを促す。

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** 環境変数から「許可メール一覧」を読み取る（小文字に統一） */
function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // 動画をドライブに保存するため drive.file 権限を要求。
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          // "login" でログイン済みでもパスワード入力を強制する
          prompt: "login consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // ログイン可否の判定。許可リストに無いメールは false を返して拒否する。
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      const list = allowedEmails();
      if (list.length === 0) return false;
      return !!email && list.includes(email);
    },
    // ログイン時にアクセストークンを JWT に保存する（リフレッシュは行わない）
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // セッションにアクセストークンを載せる
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
