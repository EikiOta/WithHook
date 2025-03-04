// app/api/myword/save/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Get authenticated user
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "未ログイン状態です" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get request body
    const { wordParam, meaning_id, memory_hook_id } = await request.json();
    
    if (!wordParam || !meaning_id) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
    }

    // 3. Find or create word
    const foundWord = await prisma.word.upsert({
      where: { word: wordParam },
      update: {},
      create: { word: wordParam },
    });

    // 4. Check if user already has this word in their vocabulary list
    const existingUserWord = await prisma.userWord.findFirst({
      where: {
        user_id: userId,
        word_id: foundWord.word_id,
        deleted_at: null,
      },
    });

    let result;
    
    // 5. Update or create user word
    if (existingUserWord) {
      // Update existing record
      result = await prisma.userWord.update({
        where: { user_words_id: existingUserWord.user_words_id },
        data: { 
          meaning_id, 
          memory_hook_id,
          updated_at: new Date() 
        },
      });
      
      return NextResponse.json({ 
        message: "My単語帳を更新しました", 
        updated: result,
        isNew: false
      });
    } else {
      // Create new record
      result = await prisma.userWord.create({
        data: {
          user_id: userId,
          word_id: foundWord.word_id,
          meaning_id,
          memory_hook_id,
        },
      });
      
      return NextResponse.json({ 
        message: "My単語帳に追加しました", 
        created: result,
        isNew: true 
      });
    }
  } catch (error) {
    console.error("Error in save to my words API:", error);
    return NextResponse.json({ error: "保存処理に失敗しました" }, { status: 500 });
  }
}