// app/api/user/delete/route.ts - 完全に修正したバージョン
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

export async function POST() {
  console.log("===== DELETE USER API CALLED =====");
  
  try {
    // セッション情報を取得
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`Deleting user with ID: ${userId}`);
    
    // 新しいPrismaインスタンスを作成（グローバルインスタンスを避ける）
    const prisma = new PrismaClient({
      log: ['error', 'warn']
    });
    
    try {
      // ユーザー検索
      const user = await prisma.user.findUnique({
        where: { user_id: userId }
      });

      if (!user) {
        await prisma.$disconnect();
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log(`Found user: ${user.user_id}`);
      
      // 削除タイムスタンプ
      const now = new Date();
      
      // 段階的に処理を実行（トランザクションを避ける）
      // 1. ユーザーの論理削除
      console.log("Step 1: Updating user...");
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: { deleted_at: now }
      });
      console.log("User marked as deleted");
      
      // 2. 関連レコードも論理削除
      // アクティブな意味を取得して更新
      console.log("Step 2: Updating meanings...");
      const activeMeanings = await prisma.meaning.findMany({
        where: { 
          user_id: userId,
          deleted_at: null
        }
      });
      
      let meaningCount = 0;
      for (const meaning of activeMeanings) {
        const deletionPrefix = "この意味はユーザによって削除されました（元の意味: ";
        const newMeaning = `${deletionPrefix}${meaning.meaning}）`;
        
        await prisma.meaning.update({
          where: { meaning_id: meaning.meaning_id },
          data: { deleted_at: now, meaning: newMeaning }
        });
        meaningCount++;
      }
      console.log(`Updated ${meaningCount} meanings`);
      
      // 記憶hooksを更新
      console.log("Step 3: Updating memory hooks...");
      const activeMemoryHooks = await prisma.memoryHook.findMany({
        where: { 
          user_id: userId,
          deleted_at: null
        }
      });
      
      let hookCount = 0;
      for (const hook of activeMemoryHooks) {
        const deletionPrefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
        const newHook = `${deletionPrefix}${hook.memory_hook}）`;
        
        await prisma.memoryHook.update({
          where: { memory_hook_id: hook.memory_hook_id },
          data: { deleted_at: now, memory_hook: newHook }
        });
        hookCount++;
      }
      console.log(`Updated ${hookCount} memory hooks`);
      
      // UserWordを更新
      console.log("Step 4: Updating user words...");
      const wordUpdate = await prisma.userWord.updateMany({
        where: { 
          user_id: userId,
          deleted_at: null 
        },
        data: { deleted_at: now }
      });
      console.log(`Updated ${wordUpdate.count} user words`);
      
      // 接続を閉じる
      await prisma.$disconnect();
      
      // 成功レスポンス
      return NextResponse.json({ 
        success: true,
        deletedCounts: {
          user: 1,
          meanings: meaningCount,
          memoryHooks: hookCount,
          userWords: wordUpdate.count
        }
      });
    } catch (dbError) {
      // エラー時は接続を確実に閉じる
      await prisma.$disconnect();
      
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        error: "Database operation failed",
        message: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json({ 
      error: "Account deletion failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}