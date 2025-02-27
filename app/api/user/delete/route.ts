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
    // トランザクションを利用してユーザーおよび関連レコードを論理削除
    await prisma.$transaction([
      // Userテーブルの論理削除
      prisma.user.update({
        where: { user_id: userId },
        data: { deleted_at: now }
      }),
      // Meaningテーブルの論理削除（対象ユーザーのレコードすべて）
      prisma.meaning.updateMany({
        where: { user_id: userId },
        data: { deleted_at: now }
      }),
      // MemoryHookテーブルの論理削除
      prisma.memoryHook.updateMany({
        where: { user_id: userId },
        data: { deleted_at: now }
      }),
      // UserWordテーブルの論理削除
      prisma.userWord.updateMany({
        where: { user_id: userId },
        data: { deleted_at: now }
      })
    ]);

    // 成功レスポンスの返却
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}
