// myword/delete/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const deleted = await prisma.userWord.update({
      where: { user_words_id: id },
      data: { deleted_at: new Date() },
    });
    return NextResponse.json({ message: "削除しました", deleted });
  } catch (_error) {
    console.error(_error);
    return NextResponse.error();
  }
}
