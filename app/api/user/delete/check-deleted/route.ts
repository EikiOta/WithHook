// app/api/user/check-deleted/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Auth.js v5 の auth 関数
import prisma from "@/lib/prisma";

// Node.js Runtime で実行するよう指定
export const runtime = "nodejs";

// 補助型: deleted_at を含む User の型
type UserWithDeleted = {
  user_id: string;
  providerAccountId: string | null;
  nickname: string | null;
  profile_image: string | null;
  createdAt: Date;
  updatedAt: Date;
  deleted_at?: Date | null;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function GET(_request: Request) {
/* eslint-enable @typescript-eslint/no-unused-vars */
  const session = await auth();
  if (!session?.user) {
    // 未ログインの場合は削除状態の判定不要として false を返す
    return NextResponse.json({ deleted: false });
  }

  // セッションの user.id（通常はプロバイダ固有ID）をキーにユーザーを検索
  const user = (await prisma.user.findUnique({
    where: { providerAccountId: session.user.id },
  })) as UserWithDeleted | null;

  if (user && user.deleted_at) {
    return NextResponse.json({ deleted: true });
  }
  return NextResponse.json({ deleted: false });
}
