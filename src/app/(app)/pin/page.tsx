"use client";

// PIN入力画面。Googleログイン後に表示される第二認証。
// 親・子でPINが異なる。正解するとホームへ進める。

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPinAction } from "./actions";

export default function PinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInput(digit: string) {
    if (pin.length >= 4) return;
    setPin((p) => p + digit);
    setError(null);
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setError(null);
  }

  function handleSubmit() {
    if (pin.length === 0) return;
    startTransition(async () => {
      const result = await verifyPinAction(pin);
      if (result.ok) {
        router.replace("/");
      } else {
        setError(result.error ?? "エラーが発生しました");
        setPin("");
      }
    });
  }

  const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-6">
      <div className="text-center">
        <p className="text-4xl mb-3">🔒</p>
        <h1 className="text-xl font-bold text-slate-700">PINコードを入力</h1>
        <p className="mt-1 text-sm text-slate-400">このアプリ専用の暗証番号です</p>
      </div>

      {/* PIN 表示 */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all ${
              pin.length > i
                ? "border-accent bg-accent"
                : "border-slate-300 bg-white"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* テンキー */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {DIGITS.map((d, i) => {
          if (d === "") return <div key={i} />;
          if (d === "⌫") {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="flex h-16 items-center justify-center rounded-2xl bg-white text-xl text-slate-500 shadow-sm active:scale-95"
              >
                {d}
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleInput(d)}
              disabled={isPending}
              className="flex h-16 items-center justify-center rounded-2xl bg-white text-xl font-bold text-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {d}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={pin.length === 0 || isPending}
        className="w-64 rounded-xl bg-accent py-4 text-base font-bold text-white shadow active:scale-95 disabled:opacity-40"
      >
        {isPending ? "確認中…" : "確認"}
      </button>
    </main>
  );
}
