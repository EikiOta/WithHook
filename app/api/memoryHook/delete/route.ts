// app/api/memoryHook/delete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { memory_hook_id } = await request.json();
    const record = await prisma.memoryHook.findUnique({ where: { memory_hook_id } });
    if (!record) {
      return NextResponse.json({ error: "対象レコードが見つかりません" }, { status: 404 });
    }
    
    // すでに削除済みかどうかをチェック（deleted_at が null でなければ削除済みとみなす）
    if (record.deleted_at !== null) {
      return NextResponse.json({ deleted: record, message: "既に削除済みです" });
    }
    
    const deletionPrefix = "この記憶hookはユーザによって削除されました（元の記憶hook: ";
    // 新しい削除メッセージを作成
    const newMemoryHook = `${deletionPrefix}${record.memory_hook}）`;
    
    console.log("削除時記憶hook: " + newMemoryHook);
    
    const deleted = await prisma.memoryHook.update({
      where: { memory_hook_id },
      data: { 
        deleted_at: new Date(),
        memory_hook: newMemoryHook,
      },
    });
    
    return NextResponse.json({ deleted, message: "削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}