// 【Step 3】データ層：Googleスプレッドシートへの読み書き（サーバー専用）。
//
// "server-only" を付けることで、このファイルが誤ってブラウザ側に混ざるのを防ぐ
// （サービスアカウントの秘密鍵を扱うため、絶対にクライアントへ出してはいけない）。
//
// 接続にはサービスアカウント（アプリ専用のロボット用アカウント）を使う。
// 必要な環境変数：
//   GOOGLE_SERVICE_ACCOUNT_EMAIL … ロボットのメール
//   GOOGLE_PRIVATE_KEY            … ロボットの秘密鍵
//   SPREADSHEET_ID                … 書き込む先のスプレッドシートID

import "server-only";
import { google } from "googleapis";
import type { Diary, DiaryInput, Reaction, ReactionInput } from "./types";

// スプレッドシート内の「タブ名」と、列の並び（この順で1行に保存する）
const SHEET = "diaries";
const HEADERS = [
  "id",
  "date",
  "plan",
  "do",
  "check",
  "action",
  "time100",
  "time200",
  "createdAt",
  "inputSeconds",
  "videoFileId", // K列：動画のDriveファイルID（Step 6で追加）
] as const;

/** スプレッドシート操作クライアントを作る（サービスアカウントで認証） */
function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // .env には改行を \n と書くので、本物の改行に戻す
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id) throw new Error("SPREADSHEET_ID が設定されていません(.env.local)");
  return id;
}

/** 1行(配列) → Diary オブジェクトに変換 */
function rowToDiary(row: string[]): Diary {
  const [
    id,
    date,
    plan,
    doVal,
    check,
    action,
    time100,
    time200,
    createdAt,
    inputSeconds,
    videoFileId,
  ] = row;
  return {
    id: id ?? "",
    date: date ?? "",
    plan: plan ?? "",
    do: doVal ?? "",
    check: check ?? "",
    action: action ?? "",
    time100: time100 || undefined,
    time200: time200 || undefined,
    createdAt: createdAt ?? "",
    inputSeconds: Number(inputSeconds ?? 0),
    videoFileId: videoFileId || undefined,
  };
}

/** Diary → 1行(配列) に変換（HEADERS の順番どおり） */
function diaryToRow(d: Diary): string[] {
  return [
    d.id,
    d.date,
    d.plan,
    d.do,
    d.check,
    d.action,
    d.time100 ?? "",
    d.time200 ?? "",
    d.createdAt,
    String(d.inputSeconds),
    d.videoFileId ?? "",
  ];
}

/** 全日記を取得（新しい日付順） */
export async function getDiaries(): Promise<Diary[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A2:K`, // 1行目はヘッダーなので2行目から
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[1]) // date が空の行は無視
    .map(rowToDiary)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 指定日の日記を取得（なければ null） */
export async function getDiaryByDate(dateKey: string): Promise<Diary | null> {
  const all = await getDiaries();
  return all.find((d) => d.date === dateKey) ?? null;
}

/**
 * 日記を保存する。1日1件。同じ日付の行があれば上書き、なければ追記。
 * 既存の作成日時(createdAt)は維持する。
 */
export async function upsertDiary(
  input: DiaryInput,
  inputSeconds: number,
  dateKey: string,
  createdAtIso: string,
  // 動画ID。未指定(undefined)なら、編集時は既存の動画を維持する。
  videoFileId?: string
): Promise<{ diary: Diary; isNew: boolean }> {
  const sheets = getSheetsClient();
  await ensureHeaders(); // 初回でもヘッダー行を用意しておく
  const id = `d_${dateKey.replaceAll("-", "")}`;

  // 既存行を探すため、日付の列(B列)だけ読む
  const dateCol = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!B2:B`,
  });
  const dates = (dateCol.data.values ?? []).map((r) => r[0]);
  const foundIndex = dates.findIndex((d) => d === dateKey); // 0始まり

  // 既存があれば、その行の createdAt・動画ID を引き継ぐ
  let createdAt = createdAtIso;
  let video = videoFileId;
  if (foundIndex >= 0) {
    const existing = await getDiaryByDate(dateKey);
    if (existing?.createdAt) createdAt = existing.createdAt;
    // 編集時に動画が指定されていなければ、既存の動画を保持する
    if (video === undefined) video = existing?.videoFileId;
  }

  const diary: Diary = {
    id,
    date: dateKey,
    plan: input.plan.trim(),
    do: input.do.trim(),
    check: input.check.trim(),
    action: input.action.trim(),
    time100: input.time100?.trim() || undefined,
    time200: input.time200?.trim() || undefined,
    createdAt,
    inputSeconds,
    videoFileId: video || undefined,
  };
  const row = diaryToRow(diary);

  if (foundIndex >= 0) {
    // 上書き（B2が0番目なので、実際の行番号は index+2）
    const rowNumber = foundIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A${rowNumber}:K${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } else {
    // 追記
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A:K`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  }

  // isNew = 既存行が無かった（=新規作成）なら true
  return { diary, isNew: foundIndex < 0 };
}

/**
 * 初回セットアップ用：1行目にヘッダーが無ければ書き込む。
 * （シートのタブ名が "diaries" である前提）
 */
export async function ensureHeaders(): Promise<void> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A1:K1`,
  });
  // 列数が HEADERS より少なければ（未設定 or 旧J列まで）ヘッダーを書き直して最新化する
  const cols = res.data.values?.[0]?.length ?? 0;
  if (cols < HEADERS.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A1:K1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

// =====================================================================
// reactions シート操作（Step 7: 親リアクション）
// =====================================================================

const REACTIONS_SHEET = "reactions";
const REACTIONS_HEADERS = [
  "id",
  "diaryId",
  "fromUserId",
  "stamp",
  "comment",
  "createdAt",
] as const;

/** 1行(配列) → Reaction オブジェクトに変換 */
function rowToReaction(row: string[]): Reaction {
  const [id, diaryId, fromUserId, stamp, comment, createdAt] = row;
  return {
    id: id ?? "",
    diaryId: diaryId ?? "",
    fromUserId: fromUserId ?? "",
    stamp: stamp ?? "",
    comment: comment ?? "",
    createdAt: createdAt ?? "",
  };
}

/** reactions シートのヘッダーを初回のみ書き込む */
async function ensureReactionsHeaders(): Promise<void> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${REACTIONS_SHEET}!A1:F1`,
  });
  const cols = res.data.values?.[0]?.length ?? 0;
  if (cols < REACTIONS_HEADERS.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${REACTIONS_SHEET}!A1:F1`,
      valueInputOption: "RAW",
      requestBody: { values: [REACTIONS_HEADERS as unknown as string[]] },
    });
  }
}

/** 指定日記IDに対するリアクションを全件取得（新しい順） */
export async function getReactionsByDiaryId(
  diaryId: string
): Promise<Reaction[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${REACTIONS_SHEET}!A2:F`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[1] === diaryId) // diaryId 列（B列）で絞り込み
    .map(rowToReaction)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** リアクションを追加する（reactions シートに1行追記） */
export async function addReaction(input: ReactionInput): Promise<Reaction> {
  await ensureReactionsHeaders();
  const sheets = getSheetsClient();

  // id は "r_" + タイムスタンプ + ランダム4桁
  const id = `r_${Date.now()}_${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
  const createdAt = new Date().toISOString();

  const reaction: Reaction = {
    id,
    diaryId: input.diaryId,
    fromUserId: input.fromUserId,
    stamp: input.stamp,
    comment: input.comment,
    createdAt,
  };

  const row = [
    reaction.id,
    reaction.diaryId,
    reaction.fromUserId,
    reaction.stamp,
    reaction.comment,
    reaction.createdAt,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${REACTIONS_SHEET}!A:F`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return reaction;
}
