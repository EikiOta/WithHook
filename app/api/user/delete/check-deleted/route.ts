// app/api/user/delete/check-deleted/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

// Node.js Runtime で実行するよう指定
export const runtime = "nodejs";

export async function GET() {
  console.log("===== CHECK DELETED API CALLED =====");
  
  try {
    // セッション情報を取得
    const session = await auth();
    console.log("Check-deleted API called, session:", 
                session?.user ? `Exists (id: ${session.user.id})` : "None");
    
    if (!session?.user) {
      console.log("No authenticated user found");
      return NextResponse.json({ deleted: false });
    }

    const userId = session.user.id;
    console.log(`Checking deleted status for user ID: ${userId}`);
    
    // 新しいPrismaインスタンスを使用（問題を避けるため）
    const prisma = new PrismaClient();
    
    try {
      // ユーザー検索
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      await prisma.$disconnect();

      if (!user) {
        console.log(`User not found with user_id: ${userId}`);
        return NextResponse.json({ deleted: false });
      }

      console.log(`User found: user_id=${user.user_id}, deleted_at=${user.deleted_at?.toISOString() || 'null'}`);

      // 削除済みかどうかを返す
      const isDeleted = user.deleted_at !== null;
      console.log(`User is ${isDeleted ? 'deleted' : 'active'}`);
      return NextResponse.json({ deleted: isDeleted });
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  } catch (error) {
    console.error("Error in check-deleted API:", error);
    
    // エラーメッセージを安全に取得
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error";
    
    return NextResponse.json({ 
      deleted: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}