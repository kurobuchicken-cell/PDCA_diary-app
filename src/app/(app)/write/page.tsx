// 入力画面（サーバーコンポーネント）。
// サーバー側で「今日の日記」をスプレッドシートから読み込み、
// 入力フォーム(DiaryForm)に初期値として渡す。フォーム自体は操作が必要なので
// クライアントコンポーネントに分けている。

import { auth } from "@/auth";
import { getDiaryByDate } from "@/lib/sheets";
import { todayKey } from "@/lib/date";
import DiaryForm from "./DiaryForm";

// 動画を共有する相手＝家族メール（ALLOWED_EMAILS）のうち、自分以外。
// 自分のドライブのファイルなので、自分への共有は不要（相手にだけ閲覧権限を渡す）。
function shareTargets(myEmail: string | null | undefined): string[] {
  const me = (myEmail ?? "").toLowerCase();
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((e) => e.toLowerCase() !== me);
}

export default async function WritePage() {
  const session = await auth();
  const today = await getDiaryByDate(todayKey());
  return (
    <DiaryForm initial={today} shareEmails={shareTargets(session?.user?.email)} />
  );
}
