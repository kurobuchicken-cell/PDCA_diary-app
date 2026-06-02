"use client";

// 検索フォーム（クライアントコンポーネント）。
// 送信時に URL パラメータを更新し、サーバーコンポーネント（page.tsx）が再フェッチする。

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogSearch({
  defaultQ,
  defaultDate,
}: {
  defaultQ: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [date, setDate] = useState(defaultDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (date) params.set("date", date);
    const query = params.toString();
    router.push(query ? `/log?${query}` : "/log");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="キーワード検索（Plan / Do / Check / Action）"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
      />
      <div className="flex gap-2">
        {/* 月単位フィルタ：YYYY-MM の input[type=month] */}
        <input
          type="month"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white active:scale-95"
        >
          検索
        </button>
      </div>
    </form>
  );
}
