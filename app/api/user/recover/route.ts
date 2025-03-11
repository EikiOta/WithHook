// app/api/user/recover/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

export async function POST() {
  try {
    // セッション情報を取得
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    // ユーザーID
    const userId = session.user.id;
    
    // 新しいPrismaClientインスタンスを作成
    const prisma = new PrismaClient();
    
    try {
      // 削除済みユーザーの検索
      const deletedUser = await prisma.user.findFirst({
        where: {
          user_id: userId,
          deleted_at: { not: null }
        }
      });

      if (!deletedUser) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "復旧可能なアカウントが見つかりません" },
          { status: 404 }
        );
      }

      const userDeletedAt = deletedUser.deleted_at;
      if (!userDeletedAt) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: "削除日時が無効です" },
          { status: 400 }
        );
      }

      // 1. ユーザーアカウントを復旧
      const recoveredUser = await prisma.user.update({
        where: { user_id: userId },
        data: { deleted_at: null }
      });
      
      // 2. 削除された意味を検索して復旧
      const deletedMeanings = await prisma.meaning.findMany({
        where: { 
          user_id: userId,
          deleted_at: userDeletedAt // 同じタイムスタンプで削除されたもの
        }
      });
      
      // 削除メッセージのプレフィックス
      const meaningPrefix = "この意味はユーザによって削除されました（元の意味: ";
      const hookPrefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
      
      let meaningCount = 0;
      for (const meaning of deletedMeanings) {
        // 削除メッセージから元のテキストを抽出
        let originalText = meaning.meaning;
        if (originalText.startsWith(meaningPrefix)) {
          originalText = originalText.substring(
            meaningPrefix.length, 
            originalText.length - 1 // 末尾の "）" を除去
          );
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
      
      // 3. 削除された記憶hookを検索して復旧
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
        if (originalText.startsWith(hookPrefix)) {
          originalText = originalText.substring(
            hookPrefix.length, 
            originalText.length - 1 // 末尾の "）" を除去
          );
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
      
      // 4. 削除されたユーザー単語を復旧
      const wordUpdate = await prisma.userWord.updateMany({
        where: { 
          user_id: userId,
          deleted_at: userDeletedAt
        },
        data: { deleted_at: null }
      });
      
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
      
      return NextResponse.json({ 
        error: "データベース操作に失敗しました",
        message: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: "アカウント復旧に失敗しました",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}