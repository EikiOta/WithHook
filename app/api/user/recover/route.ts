// app/api/user/recover/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

export async function POST() {
  console.log("===== RECOVER USER API CALLED =====");
  
  try {
    // セッション情報を取得
    const session = await auth();
    if (!session?.user?.id) {
      console.log("No authenticated user found in session");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    // ユーザーID
    const userId = session.user.id;
    console.log(`Processing recovery for user_id: ${userId}`);
    
    // 新しいPrismaClientインスタンスを作成（共有インスタンスを避ける）
    const prisma = new PrismaClient({
      log: ['error', 'warn']
    });
    
    try {
      // 削除済みユーザーの検索
      const deletedUser = await prisma.user.findFirst({
        where: {
          user_id: userId,
          deleted_at: { not: null }
        }
      });

      if (!deletedUser) {
        console.log(`No deleted user found with ID: ${userId}`);
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "復旧可能なアカウントが見つかりません" },
          { status: 404 }
        );
      }

      const userDeletedAt = deletedUser.deleted_at;
      console.log(`Found deleted user with timestamp: ${userDeletedAt?.toISOString()}`);
      
      if (!userDeletedAt) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "削除日時が無効です" },
          { status: 400 }
        );
      }

      // 削除されたレコードの取得（段階的に処理）
      // 1. まずユーザーを復旧
      console.log("Step 1: Recovering user account...");
      const recoveredUser = await prisma.user.update({
        where: { user_id: userId },
        data: { deleted_at: null }
      });
      console.log("User account recovered successfully");
      
      // 2. 削除された意味を検索して復旧
      console.log("Step 2: Recovering meanings...");
      const deletedMeanings = await prisma.meaning.findMany({
        where: { 
          user_id: userId,
          deleted_at: userDeletedAt // 同じタイムスタンプで削除されたもの
        }
      });
      
      let meaningCount = 0;
      for (const meaning of deletedMeanings) {
        // 削除メッセージから元のテキストを抽出
        let originalText = meaning.meaning;
        const prefix = "この意味はユーザによって削除されました（元の意味: ";
        if (originalText.startsWith(prefix)) {
          originalText = originalText.substring(prefix.length, originalText.length - 1); // 末尾の "）" を除去
        }
        
        await prisma.meaning.update({
          where: { meaning_id: meaning.meaning_id },
          data: { 
            deleted_at: null,
            meaning: originalText
          }
        });
        meaningCount++;
      }
      console.log(`Recovered ${meaningCount} meanings`);
      
      // 3. 削除された記憶hookを検索して復旧
      console.log("Step 3: Recovering memory hooks...");
      const deletedMemoryHooks = await prisma.memoryHook.findMany({
        where: { 
          user_id: userId,
          deleted_at: userDeletedAt // 同じタイムスタンプで削除されたもの
        }
      });
      
      let hookCount = 0;
      for (const hook of deletedMemoryHooks) {
        // 削除メッセージから元のテキストを抽出
        let originalText = hook.memory_hook;
        const prefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
        if (originalText.startsWith(prefix)) {
          originalText = originalText.substring(prefix.length, originalText.length - 1); // 末尾の "）" を除去
        }
        
        await prisma.memoryHook.update({
          where: { memory_hook_id: hook.memory_hook_id },
          data: { 
            deleted_at: null,
            memory_hook: originalText
          }
        });
        hookCount++;
      }
      console.log(`Recovered ${hookCount} memory hooks`);
      
      // 4. 削除されたユーザー単語を復旧
      console.log("Step 4: Recovering user words...");
      const wordUpdate = await prisma.userWord.updateMany({
        where: { 
          user_id: userId,
          deleted_at: userDeletedAt
        },
        data: { deleted_at: null }
      });
      console.log(`Recovered ${wordUpdate.count} user words`);
      
      // 接続を閉じる
      await prisma.$disconnect();
      
      // 成功レスポンス
      return NextResponse.json({ 
        success: true,
        message: "アカウントと関連データの復旧が完了しました",
        recoveredCounts: {
          user: 1,
          meanings: meaningCount,
          memoryHooks: hookCount,
          userWords: wordUpdate.count
        }
      });
      
    } catch (dbError) {
      // エラー時は必ず接続を閉じる
      await prisma.$disconnect();
      
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        error: "データベース操作に失敗しました",
        message: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json({ 
      error: "アカウント復旧に失敗しました",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}