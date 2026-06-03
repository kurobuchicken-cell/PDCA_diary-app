"use server";

// リアクション追加のサーバーアクション（Step 7）。
// 親アカウントからのみ呼べる。

import { auth } from "@/auth";
import { addReaction } from "@/lib/sheets";
import { sendMail, recipients } from "@/lib/mail";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

function isParent(email: string | null | undefined): boolean {
  const parentEmail = process.env.NOTIFY_PARENT_EMAIL?.toLowerCase();
  return !!email && !!parentEmail && email.toLowerCase() === parentEmail;
}

export async function addReactionAction(
  diaryId: string,
  stamp: string,
  comment: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("ログインが必要です");
  if (!isParent(session.user.email))
    throw new Error("親アカウントのみリアクションを追加できます");

  await addReaction({
    diaryId,
    fromUserId: session.user.email ?? "",
    stamp,
    comment,
  });

  // 子にメールで通知する
  const { son } = recipients();
  await sendMail(
    son,
    "【PDCA日記】親からの返信があります",
    `過去ログに親からのリアクション・コメントが届きました。\n\nアプリで確認してみよう！\nhttps://pdca-diary-app.vercel.app/log`
  );

  // 過去ログのキャッシュを無効化
  revalidatePath("/log");
}

/** 子が過去ログを見たときに呼ぶ。reactions_last_seen クッキーを現在時刻に更新する。 */
export async function markReactionsSeenAction(): Promise<void> {
  const jar = await cookies();
  jar.set("reactions_last_seen", new Date().toISOString(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
