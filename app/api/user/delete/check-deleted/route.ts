// app/api/user/delete/check-deleted/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Node.js Runtime で実行するよう指定
export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function GET(_request: Request) {
/* eslint-enable @typescript-eslint/no-unused-vars */
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
  
  try {
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
    return NextResponse.json({ deleted: false, error: String(error) });
  }
}