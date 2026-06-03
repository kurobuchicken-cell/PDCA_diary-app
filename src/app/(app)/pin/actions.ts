"use server";

// PIN コード検証のサーバーアクション。
// ログイン中のメールアドレスで親・子を判定し、対応するPINと比較する。
// 一致すれば HttpOnly Cookie を発行してアクセスを許可する。

import { auth } from "@/auth";
import { cookies } from "next/headers";

const COOKIE_NAME = "pin_verified";

function getExpectedPin(email: string): string | null {
  const parentEmail = process.env.NOTIFY_PARENT_EMAIL?.toLowerCase();
  const sonEmail = process.env.NOTIFY_SON_EMAIL?.toLowerCase();
  const lower = email.toLowerCase();
  if (lower === parentEmail) return process.env.PARENT_PIN ?? null;
  if (lower === sonEmail) return process.env.SON_PIN ?? null;
  return null;
}

export async function verifyPinAction(pin: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "ログインが必要です" };

  const expected = getExpectedPin(session.user.email);
  if (!expected) return { ok: false, error: "このアカウントはPIN未設定です" };
  if (pin !== expected) return { ok: false, error: "PINが違います" };

  // 正解 → PIN確認クッキーとメールアドレスクッキーを同時に発行する
  // メールアドレスを一緒に保存することで、別アカウントが同一ブラウザでログインした場合に
  // ミドルウェアが不一致を検出してPIN入力に戻せる（アカウント切り替わり防止）
  const jar = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  jar.set(COOKIE_NAME, "1", cookieOpts);
  jar.set("pin_verified_email", session.user.email.toLowerCase(), cookieOpts);

  return { ok: true };
}
