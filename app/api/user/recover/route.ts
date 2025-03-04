// app/api/user/recover/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  // セッション情報を取得
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // providerAccountIdを取得
  const providerAccountId = session.user.id;

  try {
    // deleted_atが設定されているユーザーを検索
    const deletedUser = await prisma.user.findFirst({
      where: {
        providerAccountId: providerAccountId,
        deleted_at: { not: null }
      },
    });

    if (!deletedUser) {
      return NextResponse.json(
        { error: "復旧可能なアカウントが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザーの削除日時を取得
    const userDeletedAt = deletedUser.deleted_at;

    // トランザクションを利用してユーザーおよび関連レコードを復旧
    await prisma.$transaction([
      // Userテーブルの復旧
      prisma.user.update({
        where: { user_id: deletedUser.user_id },
        data: { deleted_at: null }
      }),
      // Meaningテーブルの復旧
      // アカウント削除時に同時に削除された意味（削除日時が同じもの）のみ復旧
      prisma.meaning.updateMany({
        where: { 
          user_id: deletedUser.user_id,
          deleted_at: userDeletedAt
        },
        data: { deleted_at: null }
      }),
      // MemoryHookテーブルの復旧
      // アカウント削除時に同時に削除された記憶hook（削除日時が同じもの）のみ復旧
      prisma.memoryHook.updateMany({
        where: { 
          user_id: deletedUser.user_id,
          deleted_at: userDeletedAt
        },
        data: { deleted_at: null }
      }),
      // UserWordテーブルの復旧
      prisma.userWord.updateMany({
        where: { 
          user_id: deletedUser.user_id,
          deleted_at: { not: null }
        },
        data: { deleted_at: null }
      })
    ]);

    // 成功レスポンスの返却
    return NextResponse.json({ 
      success: true,
      message: "アカウントと関連データの復旧が完了しました" 
    });
    
  } catch (error) {
    console.error("Error during account recovery:", error);
    return NextResponse.json(
      { error: "アカウント復旧処理に失敗しました" },
      { status: 500 }
    );
  }
}