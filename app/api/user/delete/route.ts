// app/api/user/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma"; 

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

    const userId = user.user_id;
    console.log(`Deleting user with user_id=${userId}, providerAccountId=${providerAccountId}`);

    // === 診断パート：データ量の確認 ===
    console.log("=== DIAGNOSTIC INFORMATION ===");
    
    // DB全体のレコード数を確認
    const totalMeanings = await prisma.meaning.count();
    const totalMemoryHooks = await prisma.memoryHook.count();
    const totalUserWords = await prisma.userWord.count();
    console.log(`Total records in DB: Meanings=${totalMeanings}, MemoryHooks=${totalMemoryHooks}, UserWords=${totalUserWords}`);
    
    // このユーザーの関連データを検索
    const userMeanings = await prisma.meaning.findMany({
      where: { user_id: userId },
      select: { meaning_id: true, user_id: true, deleted_at: true }
    });
    
    const userMemoryHooks = await prisma.memoryHook.findMany({
      where: { user_id: userId },
      select: { memory_hook_id: true, user_id: true, deleted_at: true }
    });
    
    const userWords = await prisma.userWord.findMany({
      where: { user_id: userId },
      select: { user_words_id: true, user_id: true, deleted_at: true }
    });

    console.log(`User related data (including already deleted): Meanings=${userMeanings.length}, MemoryHooks=${userMemoryHooks.length}, UserWords=${userWords.length}`);
    
    // すでに削除済みのデータがあるか確認
    const alreadyDeletedMeanings = userMeanings.filter(m => m.deleted_at !== null).length;
    const alreadyDeletedHooks = userMemoryHooks.filter(h => h.deleted_at !== null).length;
    const alreadyDeletedWords = userWords.filter(w => w.deleted_at !== null).length;
    
    console.log(`Already deleted data: Meanings=${alreadyDeletedMeanings}, MemoryHooks=${alreadyDeletedHooks}, UserWords=${alreadyDeletedWords}`);

    // アクティブなデータ (削除対象)
    const activeMeanings = userMeanings.filter(m => m.deleted_at === null);
    const activeHooks = userMemoryHooks.filter(h => h.deleted_at === null);
    const activeWords = userWords.filter(w => w.deleted_at === null);
    
    console.log(`Active data to delete: Meanings=${activeMeanings.length}, MemoryHooks=${activeHooks.length}, UserWords=${activeWords.length}`);
    
    if (activeMeanings.length > 0) {
      console.log("Sample active meanings:", activeMeanings.slice(0, 3));
    }
    
    // === 重要：user_idの型と値の確認 ===
    console.log(`User ID type: ${typeof userId}`);
    console.log(`User ID value: "${userId}"`);
    
    // サンプルクエリで状態を確認
    if (totalMeanings > 0) {
      const sampleMeaning = await prisma.meaning.findFirst({
        select: { meaning_id: true, user_id: true, deleted_at: true }
      });
      console.log(`Sample meaning from DB: ${JSON.stringify(sampleMeaning)}`);
      console.log(`Sample meaning user_id type: ${typeof sampleMeaning.user_id}`);
    }
    
    console.log("=== END DIAGNOSTIC ===");

    // ユーザー削除の実行
    console.log("Starting user deletion...");
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { deleted_at: now }
    });
    console.log("User deleted:", updatedUser.user_id, updatedUser.deleted_at);

    // 関連データの削除（アクティブなデータがある場合）
    // ここではIDを直接指定して削除してみる
    let meaningResults = { count: 0 };
    let hookResults = { count: 0 };
    let wordResults = { count: 0 };
    
    if (activeMeanings.length > 0) {
      const meaningIds = activeMeanings.map(m => m.meaning_id);
      console.log(`Trying to delete meanings by IDs: ${meaningIds.join(', ')}`);
      
      // 各IDごとに個別に削除
      for (const id of meaningIds) {
        try {
          await prisma.meaning.update({
            where: { meaning_id: id },
            data: { deleted_at: now }
          });
          meaningResults.count++;
        } catch (e) {
          console.error(`Failed to delete meaning ${id}:`, e);
        }
      }
    }
    
    if (activeHooks.length > 0) {
      const hookIds = activeHooks.map(h => h.memory_hook_id);
      console.log(`Trying to delete memory hooks by IDs: ${hookIds.join(', ')}`);
      
      for (const id of hookIds) {
        try {
          await prisma.memoryHook.update({
            where: { memory_hook_id: id },
            data: { deleted_at: now }
          });
          hookResults.count++;
        } catch (e) {
          console.error(`Failed to delete memory hook ${id}:`, e);
        }
      }
    }
    
    if (activeWords.length > 0) {
      const wordIds = activeWords.map(w => w.user_words_id);
      console.log(`Trying to delete user words by IDs: ${wordIds.join(', ')}`);
      
      for (const id of wordIds) {
        try {
          await prisma.userWord.update({
            where: { user_words_id: id },
            data: { deleted_at: now }
          });
          wordResults.count++;
        } catch (e) {
          console.error(`Failed to delete user word ${id}:`, e);
        }
      }
    }
    
    // 最後に、もう一度通常の更新クエリを試みる
    try {
      console.log("Attempting standard update query as last resort");
      
      // バルク更新を試みる
      const bulkMeaningResults = await prisma.meaning.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      });
      console.log("Bulk meanings deleted:", bulkMeaningResults.count);
      
      const bulkHookResults = await prisma.memoryHook.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      });
      console.log("Bulk memory hooks deleted:", bulkHookResults.count);
      
      const bulkWordResults = await prisma.userWord.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { deleted_at: now }
      });
      console.log("Bulk user words deleted:", bulkWordResults.count);
      
      // 最終結果に加算
      meaningResults.count += bulkMeaningResults.count;
      hookResults.count += bulkHookResults.count;
      wordResults.count += bulkWordResults.count;
    } catch (e) {
      console.error("Failed bulk update:", e);
    }
    
    // 削除成功!
    return NextResponse.json({ 
      success: true,
      deletedCounts: {
        user: 1,
        meanings: meaningResults.count,
        memoryHooks: hookResults.count,
        userWords: wordResults.count
      }
    });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}