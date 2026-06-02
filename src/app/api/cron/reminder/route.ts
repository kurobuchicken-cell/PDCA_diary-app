// 22時の未入力リマインド（定期実行で叩かれるエンドポイント）。
//
// 動作：今日の日記がまだ無ければ、本人＋親に「今日の日記がまだです」をメール送信。
//
// 本番では Vercel Cron が毎日この URL を呼ぶ（vercel.json で 13:00 UTC = 22:00 JST）。
// 誰でも叩けると困るので、CRON_SECRET で保護する。
//   Vercel Cron は Authorization: Bearer <CRON_SECRET> を自動で付けてくれる。

import { getDiaryByDate } from "@/lib/sheets";
import { sendMail, recipients } from "@/lib/mail";
import { todayKey } from "@/lib/date";

export async function GET(req: Request) {
  // 秘密の合言葉チェック
  const secret = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const today = await getDiaryByDate(todayKey());
  if (today) {
    return Response.json({ sent: false, reason: "今日はもう入力済み" });
  }

  const { parent, son } = recipients();
  const subject = "【PDCA日記】今日の日記がまだです";
  const message = "今日の日記がまだです。書いて1日を振り返ろう！🏃";
  await sendMail(son, subject, message);
  await sendMail(parent, subject, message);

  return Response.json({ sent: true, to: ["son", "parent"] });
}
