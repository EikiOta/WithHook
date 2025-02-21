import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { meaning_id, meaningText, isPublic } = await request.json();
    const updated = await prisma.meaning.update({
      where: { meaning_id },
      data: { meaning: meaningText, is_public: isPublic },
    });
    return NextResponse.json({ updated, message: "編集しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
