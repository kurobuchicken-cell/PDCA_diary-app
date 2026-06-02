"use client";

// スマホ画面下部の固定ナビゲーション。
// 要件の画面構成（ホーム/入力/カレンダー/グラフ/過去ログ）に対応。
// usePathname で「今いる画面」を判定し、その項目を強調表示する。

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/write", label: "書く", icon: "✏️" },
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/graph", label: "グラフ", icon: "📈" },
  { href: "/log", label: "ログ", icon: "🔍" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active ? "text-accent font-bold" : "text-slate-400"
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
