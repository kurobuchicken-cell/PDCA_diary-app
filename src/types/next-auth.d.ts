// NextAuth の型を「拡張」して、独自に追加した項目に型を付ける。
// これでアクセストークン等を any や抑制コメント無しに安全に扱える。

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Googleのアクセストークン（ドライブAPI呼び出しに使う） */
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** アクセストークンの有効期限（UNIX秒） */
    expiresAt?: number;
  }
}
