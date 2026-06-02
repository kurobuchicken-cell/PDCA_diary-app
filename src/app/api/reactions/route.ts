// リアクション API（Step 7: 親リアクション）
//
// GET  /api/reactions?diary_id=xxx → 指定日記のリアクション一覧を返す
// POST /api/reactions               → リアクションを追加する（ログイン必須）
//
// 書き込みは親ユーザーのみ許可する。
// 親かどうかは環境変数 NOTIFY_PARENT_EMAIL と session のメールを比較して判定。

import { auth } from "@/auth";
import { getReactionsByDiaryId, addReaction } from "@/lib/sheets";
import { NextResponse } from "next/server";

function isParent(email: string | null | undefined): boolean {
  const parentEmail = process.env.NOTIFY_PARENT_EMAIL?.toLowerCase();
  return !!email && !!parentEmail && email.toLowerCase() === parentEmail;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const diaryId = searchParams.get("diary_id");
  if (!diaryId) {
    return NextResponse.json(
      { error: "diary_id is required" },
      { status: 400 }
    );
  }

  const reactions = await getReactionsByDiaryId(diaryId);
  return NextResponse.json({ reactions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // リアクション追加は親アカウントのみ
  if (!isParent(session.user.email)) {
    return NextResponse.json(
      { error: "Forbidden: 親アカウントのみリアクションを追加できます" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { diaryId, stamp, comment } = body as {
    diaryId?: string;
    stamp?: string;
    comment?: string;
  };

  if (!diaryId || !stamp) {
    return NextResponse.json(
      { error: "diaryId と stamp は必須です" },
      { status: 400 }
    );
  }

  const reaction = await addReaction({
    diaryId,
    fromUserId: session.user.email ?? "",
    stamp,
    comment: comment ?? "",
  });

  return NextResponse.json({ reaction }, { status: 201 });
}
