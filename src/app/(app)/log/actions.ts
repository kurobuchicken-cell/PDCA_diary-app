"use server";

// リアクション追加のサーバーアクション（Step 7）。
// 親アカウントからのみ呼べる。

import { auth } from "@/auth";
import { addReaction } from "@/lib/sheets";
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

  // 過去ログのキャッシュを無効化
  revalidatePath("/log");
}
