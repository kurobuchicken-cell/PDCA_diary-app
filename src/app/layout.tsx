// ルートレイアウト＝全ページ共通の最小の枠（html/body・フォント・全体CSS）。
// 画面ごとの見た目（ナビなど）は各レイアウトで足す。ログイン画面はナビ無しにしたいので、
// ナビは (app) グループのレイアウト側に置く。

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "陸上PDCA日記",
  description: "毎日の練習をPDCAで記録・振り返りする日記アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* PWA 起動時に常にホーム画面から始めるためのスクリプト。
          iOS はアプリを閉じると sessionStorage が消えるため、再起動判定に使う。 */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if((navigator.standalone||matchMedia('(display-mode:standalone)').matches)&&!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');if(location.pathname!='/')location.replace('/');}` }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
