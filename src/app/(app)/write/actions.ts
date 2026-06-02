"use server";

// サーバーアクション：フォームから呼ばれ、サーバー側で日記を保存する。
// "use server" のおかげで、この関数はサーバーでだけ実行される＝秘密情報も安全。
//
// 流れ：ログイン確認 → スプレッドシートへ保存 →（新規なら親にLINE通知）→ 表示を最新化。

import { auth } from "@/auth";
import { upsertDiary } from "@/lib/sheets";
import { sendMail, recipients } from "@/lib/mail";
import { revalidatePath } from "next/cache";
import { formatJaDate } from "@/lib/date";
import type { DiaryInput } from "@/lib/types";

export async function saveDiaryAction(
  input: DiaryInput,
  inputSeconds: number,
  dateKey: string,
  // 動画ID。新たにアップロードした時だけ渡す。未指定なら既存を維持。
  videoFileId?: string
) {
  // 念のためサーバー側でもログイン確認（家族以外は保存させない）
  const session = await auth();
  if (!session?.user) {
    throw new Error("ログインが必要です");
  }

  const { isNew } = await upsertDiary(
    input,
    inputSeconds,
    dateKey,
    new Date().toISOString(),
    videoFileId
  );

  // 入力完了通知：新規に書いたときだけ、親にメールで知らせる（編集時は通知しない）
  if (isNew) {
    const { parent } = recipients();
    await sendMail(
      parent,
      "【PDCA日記】今日の日記を書きました",
      `${formatJaDate(dateKey)}の日記を書きました📓\n\nアプリで内容を確認できます。`
    );
  }

  // ホームと過去ログのキャッシュを無効化し、次の表示で最新を取り直す
  revalidatePath("/");
  revalidatePath("/write");
}
