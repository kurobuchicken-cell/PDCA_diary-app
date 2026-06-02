// ブラウザからドライブへ直接アップロードするために使うアクセストークンを返すAPI。
//
// PARENT_GOOGLE_REFRESH_TOKEN が設定されている場合は、誰がログインしていても
// 常に親のアクセストークンを返す。これにより息子がアップロードしても
// 親のドライブに保存される。
// 未設定の場合はログイン中のユーザー自身のトークンを使う（フォールバック）。

import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/** 親のリフレッシュトークンからアクセストークンを生成する（サーバー専用） */
async function getParentAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("親のアクセストークン取得に失敗しました");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("unauthorized", { status: 401 });
  }

  // 環境変数に親のリフレッシュトークンが設定されていれば、常に親のトークンを使う
  const parentRefreshToken = process.env.PARENT_GOOGLE_REFRESH_TOKEN;
  if (parentRefreshToken) {
    try {
      const accessToken = await getParentAccessToken(parentRefreshToken);
      return Response.json({ accessToken });
    } catch (e) {
      console.error("親トークン取得失敗、自分のトークンにフォールバック:", e);
    }
  }

  // フォールバック：ログイン中のユーザー自身のトークン（JWTから取得）
  const jwtToken = await getToken({ req, secret: process.env.AUTH_SECRET });
  return Response.json({ accessToken: jwtToken?.accessToken ?? null });
}
