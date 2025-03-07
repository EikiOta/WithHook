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
  
  // 内部user_idを取得
  const userId = session.user.id;
  console.log("Attempting to recover user with user_id:", userId);

  try {
    // deleted_atが設定されているユーザーを検索
    const deletedUser = await prisma.user.findFirst({
      where: {
        user_id: userId,
        deleted_at: { not: null }
      },
    });

    if (!deletedUser) {
      console.log("No deleted user found with user_id:", userId);
      return NextResponse.json(
        { error: "復旧可能なアカウントが見つかりません" },
        { status: 404 }
      );
    }

    console.log(`Found deleted user: user_id=${userId}, deleted_at=${deletedUser.deleted_at?.toISOString()}`);

    // ユーザーの削除日時を取得
    const userDeletedAt = deletedUser.deleted_at;
    if (!userDeletedAt) {
      return NextResponse.json({ error: "Invalid deletion timestamp" }, { status: 400 });
    }

    // 削除された意味と記憶hookを取得（テキスト復元のため）
    const deletedMeanings = await prisma.meaning.findMany({
      where: { 
        user_id: userId,
        deleted_at: userDeletedAt
      }
    });
    
    const deletedMemoryHooks = await prisma.memoryHook.findMany({
      where: { 
        user_id: userId,
        deleted_at: userDeletedAt
      }
    });
    
    console.log(`Found deleted data: Meanings=${deletedMeanings.length}, MemoryHooks=${deletedMemoryHooks.length}`);

    // 削除されたMy単語帳の数を確認
    const deletedUserWords = await prisma.userWord.count({
      where: { 
        user_id: userId,
        deleted_at: userDeletedAt
      }
    });
    
    console.log(`Records to recover - UserWords: ${deletedUserWords}`);

    try {
      // トランザクションを利用してユーザーおよび関連レコードを復旧
      await prisma.$transaction(async (tx) => {
        // Userテーブルの復旧
        await tx.user.update({
          where: { user_id: userId },
          data: { deleted_at: null }
        });
        
        // 各Meaningを個別に復旧（テキスト内容も元に戻す）
        let meaningCount = 0;
        for (const meaning of deletedMeanings) {
          // 削除メッセージから元のテキストを抽出
          let originalText = meaning.meaning;
          const prefix = "この意味はユーザによって削除されました（元の意味: ";
          if (originalText.startsWith(prefix)) {
            originalText = originalText.substring(prefix.length, originalText.length - 1); // 末尾の "）" を除去
          }
          
          await tx.meaning.update({
            where: { meaning_id: meaning.meaning_id },
            data: { 
              deleted_at: null,
              meaning: originalText
            }
          });
          meaningCount++;
        }
        console.log(`Restored ${meaningCount} meanings with original text`);
        
        // 各MemoryHookを個別に復旧（テキスト内容も元に戻す）- 意味と同様の処理
        let hookCount = 0;
        for (const hook of deletedMemoryHooks) {
          // 削除メッセージから元のテキストを抽出
          let originalText = hook.memory_hook;
          const prefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
          if (originalText.startsWith(prefix)) {
            originalText = originalText.substring(prefix.length, originalText.length - 1); // 末尾の "）" を除去
          }
          
          await tx.memoryHook.update({
            where: { memory_hook_id: hook.memory_hook_id },
            data: { 
              deleted_at: null,
              memory_hook: originalText
            }
          });
          hookCount++;
        }
        console.log(`Restored ${hookCount} memory hooks with original text`);
        
        // UserWordテーブルの復旧 (バルク更新)
        const wordUpdate = await tx.userWord.updateMany({
          where: { 
            user_id: userId,
            deleted_at: userDeletedAt
          },
          data: { deleted_at: null }
        });
        console.log(`Restored ${wordUpdate.count} user words`);
        
        return {
          user: 1,
          meanings: meaningCount,
          memoryHooks: hookCount,
          userWords: wordUpdate.count
        };
      });
      
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

      // 成功レスポンスの返却
      return NextResponse.json({ 
        success: true,
        message: "アカウントと関連データの復旧が完了しました",
        recoveredCounts: {
          user: 1,
          meanings: activeAfterMeanings,
          memoryHooks: activeAfterMemoryHooks,
          userWords: activeAfterUserWords
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