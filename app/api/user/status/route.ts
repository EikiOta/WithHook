// app/api/user/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "未ログイン状態です" }, { status: 401 });
  }
  
  try {
    // providerAccountId からユーザーを検索
    const user = await prisma.user.findUnique({
      where: { providerAccountId: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 関連データの数を取得
    const [
      totalMeanings,
      totalMemoryHooks,
      totalUserWords,
      activeMeanings,
      activeMemoryHooks,
      activeUserWords,
      deletedMeanings,
      deletedMemoryHooks,
      deletedUserWords
    ] = await Promise.all([
      // 合計
      prisma.meaning.count({ where: { user_id: user.user_id } }),
      prisma.memoryHook.count({ where: { user_id: user.user_id } }),
      prisma.userWord.count({ where: { user_id: user.user_id } }),
      
      // アクティブ（deleted_at = null）
      prisma.meaning.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.memoryHook.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.userWord.count({ where: { user_id: user.user_id, deleted_at: null } }),
      
      // 削除済み（deleted_at != null）
      prisma.meaning.count({ where: { user_id: user.user_id, deleted_at: { not: null } } }),
      prisma.memoryHook.count({ where: { user_id: user.user_id, deleted_at: { not: null } } }),
      prisma.userWord.count({ where: { user_id: user.user_id, deleted_at: { not: null } } })
    ]);

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        providerAccountId: user.providerAccountId,
        nickname: user.nickname,
        deleted_at: user.deleted_at,
        isDeleted: user.deleted_at !== null
      },
      data: {
        meanings: {
          total: totalMeanings,
          active: activeMeanings,
          deleted: deletedMeanings
        },
        memoryHooks: {
          total: totalMemoryHooks,
          active: activeMemoryHooks,
          deleted: deletedMemoryHooks
        },
        userWords: {
          total: totalUserWords,
          active: activeUserWords,
          deleted: deletedUserWords
        }
      }
    });

  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json({ error: "ステータス取得中にエラーが発生しました" }, { status: 500 });
  }
}