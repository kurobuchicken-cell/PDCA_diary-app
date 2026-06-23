"use client";

// iOS の Gmail・Mail 等のアプリ内ブラウザ（WKWebView）では
// Google OAuth が disallowed_useragent エラーになる。
// 内蔵ブラウザを検知したとき、x-safari-https:// スキームで Safari に誘導する。

import { useSyncExternalStore } from "react";

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iOS ホーム画面アプリ（PWA standalone）
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true;
  // Gmail アプリ内ブラウザ
  if (/GSA\//.test(ua)) return true;
  // Facebook, Instagram, LINE 等のアプリ内ブラウザ
  if (/FBAN|FBAV|Instagram|Line\//.test(ua)) return true;
  // iOS + WebView（Safariではなく汎用WKWebView）の判定
  // 本物の Safari は "Version/XX" を持つ。WebView は持たないことが多い。
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const hasVersion = /Version\//.test(ua);
  const hasSafari = /Safari\//.test(ua);
  if (isIOS && hasSafari && !hasVersion) return true;
  return false;
}

// UA は実行中に変化しないため subscribe は何もしない（購読不要の外部値として扱う）
const noopSubscribe = () => () => {};

export default function SafariGuard() {
  const blocked = useSyncExternalStore(
    noopSubscribe,
    isInAppBrowser,
    () => false // サーバー側は常に未ブロック（ハイドレーション不整合を防ぐ）
  );

  if (!blocked) return null;

  const safariUrl = `x-safari-https://${window.location.host}${window.location.pathname}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white px-8 text-center">
      <p className="text-4xl">🌐</p>
      <h2 className="text-xl font-bold text-slate-800">
        Safariで開いてください
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed">
        このブラウザではGoogleログインができません。
        <br />
        下のボタンをタップするとSafariで開きます。
      </p>
      <a
        href={safariUrl}
        className="w-full rounded-xl bg-accent py-4 text-center text-base font-bold text-white shadow active:scale-95"
      >
        Safariで開く →
      </a>
      <p className="text-xs text-slate-400">
        次回からはSafariのブックマークからアクセスすると便利です
      </p>
    </div>
  );
}
