// app/api/user/delete/check-deleted/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

// Node.js Runtime で実行するよう指定
export const runtime = "nodejs";

export async function GET() {
  try {
    // セッション情報を取得
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ deleted: false });
    }

    const userId = session.user.id;
    
    // 新しいPrismaインスタンスを使用
    const prisma = new PrismaClient();
    
    try {
      // ユーザー検索
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      await prisma.$disconnect();

      if (!user) {
        return NextResponse.json({ deleted: false });
      }

      // 削除済みかどうかを返す
      const isDeleted = user.deleted_at !== null;
      return NextResponse.json({ deleted: isDeleted }, {
        headers: {
          // CORSヘッダーを追加して同一オリジンからのアクセスを許可
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error";
    
    return NextResponse.json({ 
      deleted: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}