// アプリ全体で使うデータの「型」を定義する。
// ここを基準にすることで、保存先がローカル(Step1)→スプレッドシート(Step3)に
// 変わっても、画面側のコードはほぼ書き換えずに済む。

/** 日記1件（PDCA記録）= スプレッドシートの diaries シート1行に対応 */
export type Diary = {
  id: string; // 例: d_20260601
  date: string; // 対象日 YYYY-MM-DD
  plan: string; // P: 今日の課題・テーマ
  do: string; // D: 練習内容・本数・コンディション
  check: string; // C: できた点・できなかった点・気づき
  action: string; // A: 明日への修正・継続方針
  time100?: string; // 任意: 100mタイム（秒）例 "13.45"
  time200?: string; // 任意: 200mタイム（秒）
  createdAt: string; // 入力日時(ISO)。タイムスタンプ自動記録
  inputSeconds: number; // 入力にかかった秒数（3〜5分で完了の計測用）
  videoFileId?: string; // 紐づく動画のGoogleドライブ ファイルID（Step 6・無→未設定）
};

/** 日記の入力フォームの中身（id/createdAt等の自動項目を除いたもの） */
export type DiaryInput = {
  plan: string;
  do: string;
  check: string;
  action: string;
  time100?: string;
  time200?: string;
};

/** 親リアクション1件（DESIGN.md §2.4 reactions シート1行に対応） */
export type Reaction = {
  id: string; // 例: r_<timestamp>_<random>
  diaryId: string; // 紐づく日記ID
  fromUserId: string; // 送った人のメールアドレス
  stamp: string; // スタンプ絵文字（👍🔥💪 等）
  comment: string; // 一言コメント（空文字可）
  createdAt: string; // ISO タイムスタンプ
};

/** リアクションの入力データ（id/createdAt は自動付与） */
export type ReactionInput = {
  diaryId: string;
  fromUserId: string;
  stamp: string;
  comment: string;
};
