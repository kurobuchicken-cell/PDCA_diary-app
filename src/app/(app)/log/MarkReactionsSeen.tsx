"use client";

// 過去ログ画面を開いたとき、子アカウントの未読リアクションを既読にする。
// useEffect で一度だけ markReactionsSeenAction を呼ぶだけの最小コンポーネント。

import { useEffect } from "react";
import { markReactionsSeenAction } from "./actions";

export default function MarkReactionsSeen() {
  useEffect(() => {
    markReactionsSeenAction().catch(() => {});
  }, []);

  return null;
}
