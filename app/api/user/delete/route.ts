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

    // アクティブな意味と記憶hookを取得して、テキスト内容を更新する処理のため
    const activeMeanings = await prisma.meaning.findMany({
      where: { 
        user_id: providerAccountId,
        deleted_at: null
      }
    });
    
    const activeMemoryHooks = await prisma.memoryHook.findMany({
      where: { 
        user_id: providerAccountId,
        deleted_at: null
      }
    });
    
    console.log(`Found active data: Meanings=${activeMeanings.length}, MemoryHooks=${activeMemoryHooks.length}`);

    // トランザクションを使用して、一連の更新を実行
    const results = await prisma.$transaction(async (tx) => {
      // 1. ユーザーを論理削除
      const updatedUser = await tx.user.update({
        where: { user_id: userId },
        data: { deleted_at: now }
      });
      console.log("User deleted:", updatedUser.user_id, updatedUser.deleted_at);
      
      // 2. 各Meaningを個別に更新（テキスト内容も変更）
      let meaningCount = 0;
      for (const meaning of activeMeanings) {
        const deletionPrefix = "この意味はユーザによって削除されました（元の意味: ";
        const newMeaning = `${deletionPrefix}${meaning.meaning}）`;
        
        await tx.meaning.update({
          where: { meaning_id: meaning.meaning_id },
          data: { 
            deleted_at: now,
            meaning: newMeaning
          }
        });
        meaningCount++;
      }
      console.log(`Updated ${meaningCount} meanings with deletion message`);
      
      // 3. 各MemoryHookを個別に更新（テキスト内容も変更）- 意味と同様の形式に
      let hookCount = 0;
      for (const hook of activeMemoryHooks) {
        const deletionPrefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
        const newHook = `${deletionPrefix}${hook.memory_hook}）`;
        
        await tx.memoryHook.update({
          where: { memory_hook_id: hook.memory_hook_id },
          data: { 
            deleted_at: now,
            memory_hook: newHook
          }
        });
        hookCount++;
      }
      console.log(`Updated ${hookCount} memory hooks with deletion message`);
      
      // 4. UserWordの論理削除（バルク更新）- user_idを使用
      const wordUpdate = await tx.userWord.updateMany({
        where: { 
          user_id: userId,
          deleted_at: null 
        },
        data: { deleted_at: now }
      });
      console.log(`Updated ${wordUpdate.count} user words`);
      
      return {
        user: 1,
        meanings: meaningCount,
        memoryHooks: hookCount,
        userWords: wordUpdate.count
      };
    });
    
    // 削除成功!
    return NextResponse.json({ 
      success: true,
      deletedCounts: results
    });
  } catch (error) {
    console.error("Error during account deletion:", error);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}