// app/api/user/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request) {
  // セッション情報を取得
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now = new Date();

  try {
    // トランザクションを利用して、以下を実施する：
    // 1. ユーザーテーブルの該当ユーザーの deleted_at を now に更新
    // 2. meanings テーブル：user_id が一致かつ deleted_at が null のものに now を設定
    // 3. memory_hooks テーブル：同様に更新
    // 4. user_words テーブル：同様に更新
    await prisma.$transaction([
      prisma.user.update({
        where: { user_id: userId },
        data: { deleted_at: now }
      }),
      prisma.meaning.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      }),
      prisma.memoryHook.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      }),
      prisma.userWord.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}
