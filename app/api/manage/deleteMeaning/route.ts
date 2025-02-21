import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { meaning_id } = await request.json();
    // My単語帳にこの意味が使用されているかチェック
    const userWordRecord = await prisma.userWord.findFirst({
      where: {
        meaning_id,
        is_deleted: false,
      },
    });
    if (userWordRecord) {
      // すでにMy単語帳に登録されている場合は削除をブロック
      return NextResponse.json(
        { error: "この意味はMy単語帳で使用中のため削除できません" },
        { status: 400 }
      );
    }
    const deleted = await prisma.meaning.update({
      where: { meaning_id },
      data: { is_deleted: true },
    });
    return NextResponse.json({ deleted, message: "削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
