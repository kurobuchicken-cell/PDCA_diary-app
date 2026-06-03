// ブラウザからGoogleドライブへ動画を直接アップロードするための関数群。
//
// なぜブラウザから直接？：Vercelのサーバーは1リクエスト4.5MBまでで、動画は超えやすい。
// ブラウザ→ドライブに直接送れば、その制限を受けない。
//
// 流れ：①サーバーからアクセストークン取得 → ②ドライブへ再開可能アップロード
//       → ③家族のメールに閲覧権限を付与 → ④ファイルIDを返す。

/** サーバー(/api/drive/token)から現在のアクセストークンを取得 */
async function getAccessToken(): Promise<string> {
  const res = await fetch("/api/drive/token");
  if (!res.ok) throw new Error("アクセストークンの取得に失敗しました");
  const data = (await res.json()) as { accessToken: string | null };
  if (!data.accessToken) {
    throw new Error(
      "ドライブの権限がありません。一度ログアウトして、ログインし直してください。"
    );
  }
  return data.accessToken;
}

/** 再開可能アップロードで動画を1ファイル送る。戻り値はファイルID。 */
async function resumableUpload(file: File, token: string): Promise<string> {
  // 保存先フォルダID（環境変数で指定。未設定なら Drive のルートへ）
  const folderId = process.env.NEXT_PUBLIC_DRIVE_FOLDER_ID;
  const metadata: Record<string, unknown> = { name: file.name };
  if (folderId) metadata.parents = [folderId];

  // ① アップロード開始を要求し、専用のアップロードURL(Location)を受け取る
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": file.type || "video/mp4",
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!initRes.ok) throw new Error("アップロード開始に失敗しました");
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("アップロードURLが取得できませんでした");

  // ② 実体(バイト列)をアップロードURLへ送る
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "video/mp4" },
    body: file,
  });
  if (!putRes.ok) throw new Error("動画のアップロードに失敗しました");
  const data = (await putRes.json()) as { id: string };
  return data.id;
}

/** 家族のメールアドレスに閲覧権限を付与（失敗しても全体は止めない） */
async function shareWithFamily(
  fileId: string,
  token: string,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "user",
            emailAddress: email,
          }),
        }
      );
    } catch (e) {
      console.error("共有設定に失敗:", email, e);
    }
  }
}

/** 動画をアップロードし、家族に共有し、ファイルIDを返す（画面から呼ぶ入口） */
export async function uploadVideoToDrive(
  file: File,
  shareEmails: string[]
): Promise<string> {
  const token = await getAccessToken();
  const fileId = await resumableUpload(file, token);
  await shareWithFamily(fileId, token, shareEmails);
  return fileId;
}
