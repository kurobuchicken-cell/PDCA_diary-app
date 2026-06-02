// 【Step 4】メール通知（サーバー専用）。
//
// あなたのGmailから nodemailer 経由でメールを送る。
// 必要な環境変数：
//   GMAIL_USER          … 送信に使うGmailアドレス
//   GMAIL_APP_PASSWORD  … そのGmailの「アプリパスワード」（通常のパスワードではない）
// 通知の宛先：
//   NOTIFY_PARENT_EMAIL … 親
//   NOTIFY_SON_EMAIL    … 本人（息子）
//
// ※ アプリパスワードは2段階認証を有効にすると作れる。手順は別途案内。

import "server-only";
import nodemailer from "nodemailer";

// 送信用の接続(transporter)を作る。Gmailのサービス設定を使う。
function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD が未設定です");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/** メールを1通送る。宛先が空ならスキップ（エラーで止めない）。 */
export async function sendMail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  if (!to) return;
  try {
    const transport = getTransport();
    await transport.sendMail({
      from: `"陸上PDCA日記" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (e) {
    // 通知失敗で本体の処理を止めないよう、ログだけ残す
    console.error("メール送信失敗:", (e as Error).message);
  }
}

/** 通知の宛先（環境変数から） */
export function recipients() {
  return {
    parent: process.env.NOTIFY_PARENT_EMAIL ?? "",
    son: process.env.NOTIFY_SON_EMAIL ?? "",
  };
}
