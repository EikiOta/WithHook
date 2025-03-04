// app/api/user/recover/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function POST() {
  // セッション情報を取得
  const session = await auth();
  console.log("Recover API called, session:", session?.user ? "Exists" : "None");
  
  if (!session || !session.user || !session.user.id) {
    console.log("No session found in recover API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // providerAccountIdを取得
  const providerAccountId = session.user.id;
  console.log("Attempting to recover user with providerAccountId:", providerAccountId);

  try {
    // deleted_atが設定されているユーザーを検索
    const deletedUser = await prisma.user.findFirst({
      where: {
        providerAccountId: providerAccountId,
        deleted_at: { not: null }
      },
    });

    if (!deletedUser) {
      console.log("No deleted user found with providerAccountId:", providerAccountId);
      return NextResponse.json(
        { error: "復旧可能なアカウントが見つかりません" },
        { status: 404 }
      );
    }

    const userId = deletedUser.user_id;
    console.log(`Found deleted user: user_id=${userId}, deleted_at=${deletedUser.deleted_at?.toISOString()}`);

    // ユーザーの削除日時を取得
    const userDeletedAt = deletedUser.deleted_at;
    if (!userDeletedAt) {
      return NextResponse.json({ error: "Invalid deletion timestamp" }, { status: 400 });
    }

    // 削除データの数を確認
    const [deletedMeanings, deletedMemoryHooks, deletedUserWords] = await Promise.all([
      prisma.meaning.count({ 
        where: { 
          user_id: userId, 
          deleted_at: userDeletedAt 
        } 
      }),
      prisma.memoryHook.count({ 
        where: { 
          user_id: userId, 
          deleted_at: userDeletedAt 
        } 
      }),
      prisma.userWord.count({ 
        where: { 
          user_id: userId, 
          deleted_at: userDeletedAt 
        } 
      })
    ]);
    
    console.log(`Records to recover - Meanings: ${deletedMeanings}, MemoryHooks: ${deletedMemoryHooks}, UserWords: ${deletedUserWords}`);

    try {
      // トランザクションを利用してユーザーおよび関連レコードを復旧
      const results = await prisma.$transaction([
        // Userテーブルの復旧
        prisma.user.update({
          where: { user_id: userId },
          data: { deleted_at: null }
        }),
        // Meaningテーブルの復旧
        prisma.meaning.updateMany({
          where: { 
            user_id: userId,
            deleted_at: userDeletedAt
          },
          data: { deleted_at: null }
        }),
        // MemoryHookテーブルの復旧
        prisma.memoryHook.updateMany({
          where: { 
            user_id: userId,
            deleted_at: userDeletedAt
          },
          data: { deleted_at: null }
        }),
        // UserWordテーブルの復旧
        prisma.userWord.updateMany({
          where: { 
            user_id: userId,
            deleted_at: userDeletedAt
          },
          data: { deleted_at: null }
        })
      ]);

      console.log("Recovery transaction completed. Results:", JSON.stringify(results));
      
      // 復旧後のデータ数を確認
      const [activeAfterMeanings, activeAfterMemoryHooks, activeAfterUserWords] = await Promise.all([
        prisma.meaning.count({ 
          where: { 
            user_id: userId, 
            deleted_at: null 
          } 
        }),
        prisma.memoryHook.count({ 
          where: { 
            user_id: userId, 
            deleted_at: null 
          } 
        }),
        prisma.userWord.count({ 
          where: { 
            user_id: userId, 
            deleted_at: null 
          } 
        })
      ]);
      
      console.log(`After recovery - Active Meanings: ${activeAfterMeanings}, Active MemoryHooks: ${activeAfterMemoryHooks}, Active UserWords: ${activeAfterUserWords}`);
      
      // 再確認: ユーザーが正しく復旧されたか確認
      const verifyUser = await prisma.user.findUnique({
        where: { user_id: userId }
      });
      
      console.log("Verification after recovery:", verifyUser ? 
        `User exists, deleted_at=${verifyUser.deleted_at?.toISOString() || 'null'}` : 
        "User not found");
      
      if (verifyUser && verifyUser.deleted_at !== null) {
        console.log("WARNING: User still marked as deleted after recovery!");
      }

      // 成功レスポンスの返却
      return NextResponse.json({ 
        success: true,
        message: "アカウントと関連データの復旧が完了しました",
        recoveredCounts: {
          user: verifyUser && verifyUser.deleted_at === null ? 1 : 0,
          meanings: results[1].count,
          memoryHooks: results[2].count,
          userWords: results[3].count
        }
      });
    } catch (txError) {
      console.error("Transaction error:", txError);
      return NextResponse.json(
        { error: "データベーストランザクションに失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error during account recovery:", error);
    return NextResponse.json(
      { error: "アカウント復旧処理に失敗しました" },
      { status: 500 }
    );
  }
}