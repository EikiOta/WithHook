// app/api/user/delete/check-deleted/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Node.js Runtime で実行するよう指定
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    console.log("Check-deleted API called, session:", session?.user ? "Exists (id: " + session.user.id + ")" : "None");
    
    if (!session?.user) {
      // 未ログインの場合は削除状態の判定不要として false を返す
      console.log("No session, returning deleted=false");
      return NextResponse.json({ deleted: false });
    }

    // session.user.idは内部user_idとして扱う
    const userId = session.user.id;
    console.log("User ID from session:", userId);
    
    // user_idでユーザー検索
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      console.log("User not found with user_id:", userId);
      return NextResponse.json({ deleted: false });
    }

    console.log(`User found: user_id=${user.user_id}, deleted_at=${user.deleted_at?.toISOString() || 'null'}`);

    if (user.deleted_at) {
      console.log("User is deleted, returning deleted=true");
      return NextResponse.json({ deleted: true });
    }
    
    console.log("User not deleted, returning deleted=false");
    return NextResponse.json({ deleted: false });
  } catch (error) {
    console.error("Error in check-deleted API:", error);
    
    // エラーメッセージを安全に取得
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error";
    
    // 確実にJSONレスポンスを返す
    return new NextResponse(
      JSON.stringify({ 
        deleted: false, 
        error: errorMessage 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}