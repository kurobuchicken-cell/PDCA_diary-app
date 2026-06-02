// 週次サマリー(6.2)：定期実行で叩かれるエンドポイント。
// 本番では Vercel Cron が毎週日曜22時(JST)に呼ぶ（vercel.json）。
// 親＋本人にサマリーメールを送る。CRON_SECRET で保護。

import { getDiaries } from "@/lib/sheets";
import { buildWeeklySummary } from "@/lib/summary";
import { sendMail, recipients } from "@/lib/mail";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const diaries = await getDiaries();
  const body = buildWeeklySummary(diaries);
  const subject = "【PDCA日記】今週のふりかえり";

  const { parent, son } = recipients();
  await sendMail(son, subject, body);
  await sendMail(parent, subject, body);

  return Response.json({ sent: true });
}
