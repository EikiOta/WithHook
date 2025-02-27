// app/api/memoryHook/delete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { memory_hook_id } = await request.json();
    // My単語帳の使用チェックは行わず、常に削除実行（削除日時を設定し、記憶hookテキストを上書き）
    const deleted = await prisma.memoryHook.update({
      where: { memory_hook_id },
      data: {
        deleted_at: new Date(),
        memory_hook: `この記憶hookはユーザによって削除されました`
      },
    });
    return NextResponse.json({ deleted, message: "削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
