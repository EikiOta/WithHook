// app/api/meaning/delete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { meaning_id } = await request.json();
    const record = await prisma.meaning.findUnique({ where: { meaning_id } });
    if (!record) {
      return NextResponse.json({ error: "対象レコードが見つかりません" }, { status: 404 });
    }
    
    // すでに削除済みかどうかをチェック
    if (record.is_deleted) {
      // すでに削除済みの場合は状態を変更せず、現在のレコードを返す
      return NextResponse.json({ deleted: record, message: "既に削除済みです" });
    }
    
    const deletionPrefix = "この意味はユーザによって削除されました（元の意味: ";
    // 新しい削除メッセージを作成
    const newMeaning = `${deletionPrefix}${record.meaning}）`;
    
    console.log("削除時意味: " + newMeaning);
    
    const deleted = await prisma.meaning.update({
      where: { meaning_id },
      data: { 
        is_deleted: true,
        meaning: newMeaning,
      },
    });
    
    return NextResponse.json({ deleted, message: "削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}