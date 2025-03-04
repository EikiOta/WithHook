// app/api/memoryHook/create/route.ts
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
    const userId = session.user.id;
    
    // Parse request body
    const { wordText, hookText, isPublic } = await request.json();
    if (!wordText || !hookText) {
      return NextResponse.json({ error: "単語と記憶hookは必須です" }, { status: 400 });
    }
    
    // Get or create word
    let wordRec = await prisma.word.findUnique({ where: { word: wordText } });
    if (!wordRec) {
      wordRec = await prisma.word.create({ data: { word: wordText } });
    }
    
    // Create new memory hook
    const newMemoryHook = await prisma.memoryHook.create({
      data: {
        word_id: wordRec.word_id,
        user_id: userId,
        memory_hook: hookText,
        is_public: isPublic,
      },
    });
    
    // Get the created memory hook with user info
    const createdMemoryHook = await prisma.memoryHook.findUnique({
      where: { memory_hook_id: newMemoryHook.memory_hook_id },
      include: { user: true },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "記憶hookを作成しました", 
      newMemoryHook: createdMemoryHook, 
      wordRec 
    });
  } catch (error) {
    console.error("Memory hook creation error:", error);
    return NextResponse.json({ 
      error: "記憶hookの作成中にエラーが発生しました" 
    }, { status: 500 });
  }
}