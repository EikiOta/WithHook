// app/api/meaning/create/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const userId = session.user.id; // これで内部的なuser_idが取得される
    
    // Parse request body
    const { wordText, meaningText, isPublic } = await request.json();
    if (!wordText || !meaningText) {
      return NextResponse.json({ error: "単語と意味は必須です" }, { status: 400 });
    }
    
    // Get or create word
    let wordRec = await prisma.word.findUnique({ where: { word: wordText } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordText } });
    }
    
    // Check if user already created a meaning for this word
    const existing = await prisma.meaning.findFirst({
      where: { 
        word_id: wordRec.word_id, 
        user_id: userId, 
        deleted_at: null 
      },
    });
    
    if (existing) {
      return NextResponse.json({ 
        error: "既にあなたはこの単語の意味を登録済みです。" 
      }, { status: 400 });
    }
    
    // Create new meaning
    const newMeaning = await prisma.meaning.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        meaning: meaningText,
        is_public: isPublic,
      },
    });
    
    // Get the created meaning with user info
    const createdMeaning = await prisma.meaning.findUnique({
      where: { meaning_id: newMeaning.meaning_id },
      include: { user: true },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "意味を作成しました", 
      newMeaning: createdMeaning, 
      wordRec 
    });
  } catch (error) {
    console.error("Meaning creation error:", error);
    return NextResponse.json({ 
      error: "意味の作成中にエラーが発生しました" 
    }, { status: 500 });
  }
}