"use client";

// PDCA入力フォーム（クライアントコンポーネント）。
// ・全項目「任意」（継続しやすさ優先）。空でも保存できる。
// ・入力にかかった秒数を自動計測（3〜5分で完了の検証用）。
// ・保存はサーバーアクション(saveDiaryAction)を呼ぶ＝スプレッドシートに書き込む。

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDiaryAction } from "./actions";
import { uploadVideoToDrive } from "@/lib/driveClient";
import VideoPlayer from "@/components/VideoPlayer";
import { formatJaDate, todayKey } from "@/lib/date";
import type { Diary } from "@/lib/types";

const STEPS = [
  {
    key: "plan",
    badge: "P",
    title: "Plan（計画）",
    hint: "今日の課題・テーマ",
    placeholder: "例）スタート改善 / 後半の粘りを鍛える",
  },
  {
    key: "do",
    badge: "D",
    title: "Do（実行）",
    hint: "練習内容・本数・コンディション",
    placeholder: "例）100m×5本　体調：良好",
  },
  {
    key: "check",
    badge: "C",
    title: "Check（確認）",
    hint: "できた点・できなかった点・気づき",
    placeholder: "例）スタートは改善。後半で肩に力が入った",
  },
  {
    key: "action",
    badge: "A",
    title: "Action（修正）",
    hint: "明日への修正・継続・変更方針",
    placeholder: "例）腕振りを意識して走る。同じメニュー継続",
  },
] as const;

type FieldKey = (typeof STEPS)[number]["key"];

// 風速の選択肢（0.1〜2.0を0.1刻み）
const WIND_SPEEDS = Array.from({ length: 20 }, (_, i) =>
  ((i + 1) * 0.1).toFixed(1)
);

export default function DiaryForm({
  initial,
  dateKey,
  shareEmails,
}: {
  initial: Diary | null;
  dateKey: string;
  shareEmails: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [restDay, setRestDay] = useState(initial?.restDay ?? false);
  const [form, setForm] = useState<Record<FieldKey, string>>({
    plan: initial?.plan ?? "",
    do: initial?.do ?? "",
    check: initial?.check ?? "",
    action: initial?.action ?? "",
  });
  const [time100, setTime100] = useState(initial?.time100 ?? "");
  const [time200, setTime200] = useState(initial?.time200 ?? "");
  const [wind100Direction, setWind100Direction] = useState<"none" | "tail" | "head">(
    initial?.wind100Direction ?? "none"
  );
  const [wind100Speed, setWind100Speed] = useState(
    initial?.wind100Speed != null ? String(initial.wind100Speed.toFixed(1)) : "1.0"
  );

  // 動画：選択中のファイル / 既に保存済みの動画ID / アップロード中表示 / エラー
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 入力開始時刻を記録（refなのでsetStateにならない）
  const startedAt = useRef<number>(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function handleSave() {
    const inputSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    setError(null);
    startTransition(async () => {
      try {
        // 動画が選ばれていれば、先にドライブへアップロードしてIDを得る
        let videoFileId: string | undefined;
        if (videoFile) {
          setUploading(true);
          videoFileId = await uploadVideoToDrive(videoFile, shareEmails);
          setUploading(false);
        }
        await saveDiaryAction(
          {
            ...form,
            time100,
            time200,
            restDay,
            wind100Direction,
            wind100Speed:
              wind100Direction === "none" ? 0 : Number(wind100Speed),
          },
          inputSeconds,
          dateKey,
          videoFileId
        );
        router.push("/");
      } catch (e) {
        setUploading(false);
        setError((e as Error).message ?? "保存に失敗しました");
      }
    });
  }

  return (
    <main className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-slate-500">{formatJaDate(dateKey)}</p>
        <h1 className="text-2xl font-bold">
          {dateKey === todayKey() ? "今日の日記を書く" : "日記を修正する"}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          全部書かなくてもOK。続けることが一番大事。
        </p>
      </header>

      {/* 部活なし日チェック */}
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="checkbox"
          checked={restDay}
          onChange={(e) => setRestDay(e.target.checked)}
          className="h-5 w-5 accent-accent"
        />
        <div>
          <p className="font-bold text-slate-700">今日は部活がない</p>
          <p className="text-xs text-slate-400">
            チェックすると連続記録を維持したまま休日として記録されます
          </p>
        </div>
      </label>

      {/* 部活なし選択時は PDCA フォームを非表示 */}
      {restDay && (
        <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
          🏖️ 今日はお休みとして記録します。連続記録は維持されます。
        </div>
      )}

      {/* PDCA 4ステップ（部活なし日は非表示） */}
      {!restDay && STEPS.map((step) => (
        <section key={step.key} className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {step.badge}
            </span>
            <span className="font-bold">{step.title}</span>
          </label>
          <p className="text-xs text-slate-400">{step.hint}</p>
          <textarea
            value={form[step.key]}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, [step.key]: e.target.value }))
            }
            placeholder={step.placeholder}
            rows={3}
            className="resize-none rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
          />
        </section>
      ))}

      {/* 任意：タイム記録（部活なし日は非表示） */}
      {!restDay && (
        <section className="rounded-2xl border border-dashed border-slate-300 p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-500">
            タイム記録（任意）
          </h2>
          <div className="flex flex-col gap-3">
            {/* 100m タイム入力 */}
            <label className="flex flex-col gap-1 text-sm">
              100m（秒）
              <input
                value={time100}
                onChange={(e) => setTime100(e.target.value)}
                inputMode="decimal"
                placeholder="13.45"
                className="rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
              />
            </label>
            {/* 100m 風向・風速（タイムが入力されている時に表示） */}
            {time100 && (
              <div className="flex gap-2">
                {/* 風向選択 */}
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  風向
                  <select
                    value={wind100Direction}
                    onChange={(e) =>
                      setWind100Direction(e.target.value as "none" | "tail" | "head")
                    }
                    className="rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="none">無風</option>
                    <option value="tail">追い風</option>
                    <option value="head">向かい風</option>
                  </select>
                </label>
                {/* 風速選択（無風以外の時のみ） */}
                {wind100Direction !== "none" && (
                  <label className="flex flex-1 flex-col gap-1 text-sm">
                    風速（m/s）
                    <select
                      value={wind100Speed}
                      onChange={(e) => setWind100Speed(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
                    >
                      {WIND_SPEEDS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            {/* 200m タイム入力 */}
            <label className="flex flex-col gap-1 text-sm">
              200m（秒）
              <input
                value={time200}
                onChange={(e) => setTime200(e.target.value)}
                inputMode="decimal"
                placeholder="27.80"
                className="rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
              />
            </label>
          </div>
        </section>
      )}

      {/* 任意：練習動画（部活なし日は非表示） */}
      {!restDay && <section className="rounded-2xl border border-dashed border-slate-300 p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-500">
          練習動画（任意）
        </h2>

        {/* 既に保存済みの動画があれば再生表示（新しい動画を選んでいない時） */}
        {initial?.videoFileId && !videoFile && (
          <div className="mb-3">
            <VideoPlayer fileId={initial.videoFileId} />
            <p className="mt-1 text-xs text-slate-400">
              保存済みの動画です。差し替えるなら下から選び直してください。
            </p>
          </div>
        )}

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:font-bold file:text-white"
        />
        {videoFile && (
          <p className="mt-2 text-xs text-slate-500">
            選択中：{videoFile.name}
          </p>
        )}
      </section>}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-xl bg-accent py-4 text-lg font-bold text-white shadow active:scale-95 disabled:opacity-50"
      >
        {uploading ? "動画アップロード中…" : isPending ? "保存中…" : "保存する"}
      </button>
    </main>
  );
}
