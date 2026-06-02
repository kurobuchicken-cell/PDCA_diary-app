// Googleとのやり取り（ログイン・コールバック・ログアウト）を受け取るAPI。
// 中身は auth.ts が用意した handlers をそのまま公開するだけ。
// この1ファイルで /api/auth/* のすべてのリクエストを処理する。

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
