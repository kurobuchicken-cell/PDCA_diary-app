# HISTORY.md
コード・Gitだけでは追えない「なぜそうなったか」の経緯を記録する。

---

## 2026-07-01 画像が本番で表示されない問題

### 問題
`/hero.png` がローカルでは表示されるのに、Vercel 本番では表示されなかった。

### 原因
Vercel 本番では `middleware-manifest.json` が空になるケースがあり、`proxy.ts` の `config.matcher` による静的ファイル除外が効かなかった。その結果、画像リクエストにも proxy が適用され、NextAuth の auth() ラッパー内で `return;`（undefined）を返していたため、未認証扱いとなりリダイレクトが発生していた。

### 対処
1. `proxy.ts` の静的ファイル早期リターンを `return;` → `return NextResponse.next()` に変更。undefined を返すと NextAuth がデフォルト動作（リダイレクト）を適用するため、明示的に通過を指示する必要があった。
2. 静的ファイル向けの早期リターンを matcher 除外に加えてコード内にも残している（二重防衛）。

---

## 2026-07-01 PWA 起動時に /log が最初に表示される問題

### 問題
iOS ホーム画面に追加した PWA を起動すると、前回最後に開いていた `/log` がそのまま表示され、TOP画面（`/`）から始まらなかった。

### 原因
iOS Safari の PWA は前回終了時の URL を記憶しており、cold start 時にその URL を復元する。

### 試行錯誤
最初に `sessionStorage` を使って「初回起動フラグ（`s`）」を立てる方式を実装したが効かなかった。原因：iOS は PWA を閉じても `sessionStorage` を保持するため、一度フラグを立てると以降のセッションでも残り続け、リダイレクトが発動しなかった。

### 対処
`document.referrer` が空かどうかで cold start を判定する方式に変更（`layout.tsx` の `<head>` にインラインスクリプト）。

- ホーム画面アイコンからの起動（cold start）→ `document.referrer` が空 → `/` にリダイレクト
- アプリ内リンク経由のページ遷移 → `document.referrer` に直前 URL が入る → リダイレクトしない
- `navigator.standalone`（iOS）と `matchMedia('(display-mode:standalone)')` （Android）の両方をチェックし、PWA モード以外には適用しない
