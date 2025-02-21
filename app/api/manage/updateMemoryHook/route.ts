import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { memory_hook_id, hookText, isPublic } = await request.json();
    const updated = await prisma.memoryHook.update({
      where: { memory_hook_id },
      data: { memory_hook: hookText, is_public: isPublic },
    });
    return NextResponse.json({ updated, message: "編集しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
