// app/api/user/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request) {
  // セッション情報を取得
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // providerAccountIdとしてセッションからユーザーIDを取得
  const providerAccountId = session.user.id;
  const now = new Date();

  try {
    // providerAccountIdからユーザーを検索
    const user = await prisma.user.findUnique({
      where: { providerAccountId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`Deleting user with user_id: ${user.user_id}, providerAccountId: ${providerAccountId}`);

    // 削除前のデータ数を確認
    const beforeCount = await Promise.all([
      prisma.meaning.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.memoryHook.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.userWord.count({ where: { user_id: user.user_id, deleted_at: null } })
    ]);
    
    console.log(`Before deletion - Meanings: ${beforeCount[0]}, MemoryHooks: ${beforeCount[1]}, UserWords: ${beforeCount[2]}`);

    // トランザクションを利用して、削除処理を実行
    const results = await prisma.$transaction([
      // 1. ユーザーテーブルの該当ユーザーの deleted_at を now に更新
      prisma.user.update({
        where: { user_id: user.user_id },
        data: { deleted_at: now }
      }),
      // 2. meanings テーブル：user_id が一致かつ deleted_at が null のものに now を設定
      prisma.meaning.updateMany({
        where: { user_id: user.user_id, deleted_at: null },
        data: { deleted_at: now }
      }),
      // 3. memory_hooks テーブル：同様に更新
      prisma.memoryHook.updateMany({
        where: { user_id: user.user_id, deleted_at: null },
        data: { deleted_at: now }
      }),
      // 4. user_words テーブル：同様に更新
      prisma.userWord.updateMany({
        where: { user_id: user.user_id, deleted_at: null },
        data: { deleted_at: now }
      })
    ]);

    // 削除結果のログ出力
    console.log(`Deletion results:`, JSON.stringify(results));

    // 削除後のデータ数を確認
    const afterCount = await Promise.all([
      prisma.meaning.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.memoryHook.count({ where: { user_id: user.user_id, deleted_at: null } }),
      prisma.userWord.count({ where: { user_id: user.user_id, deleted_at: null } })
    ]);
    
    console.log(`After deletion - Meanings: ${afterCount[0]}, MemoryHooks: ${afterCount[1]}, UserWords: ${afterCount[2]}`);

    // 削除されていない場合の警告
    if (afterCount[0] !== 0 || afterCount[1] !== 0 || afterCount[2] !== 0) {
      console.warn("Some records were not marked as deleted!");
    }

    return NextResponse.json({ 
      success: true,
      deletedCounts: {
        meanings: beforeCount[0] - afterCount[0],
        memoryHooks: beforeCount[1] - afterCount[1],
        userWords: beforeCount[2] - afterCount[2]
      }
    });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}