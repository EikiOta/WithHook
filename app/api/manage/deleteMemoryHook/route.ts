import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { memory_hook_id } = await request.json();
    const deleted = await prisma.memoryHook.update({
      where: { memory_hook_id },
      data: { is_deleted: true },
    });
    return NextResponse.json({ deleted, message: "削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
