// app/api/debug/auth/route.ts を作成
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 現在のセッション情報
    const session = await auth();
    const sessionInfo = session ? {
      userId: session.user?.id,
      userName: session.user?.name,
      expires: session.expires
    } : "No session";

    // ユーザーテーブルのサンプルデータ（最大5件）
    const userSamples = await prisma.user.findMany({
      take: 5,
      select: {
        user_id: true,
        providerAccountId: true,
        nickname: true,
        deleted_at: true,
        createdAt: true
      }
    });
    
    // テーブル情報
    const tableInfo = {
      userCount: await prisma.user.count(),
      meaningCount: await prisma.meaning.count(),
      memoryHookCount: await prisma.memoryHook.count(),
      wordCount: await prisma.word.count(),
      userWordCount: await prisma.userWord.count()
    };

    // 環境情報
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasSecretKey: !!process.env.NEXTAUTH_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL
    };

    // 現在のユーザー情報（ログイン中の場合）
    let currentUserInfo = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { user_id: session.user.id },
        select: {
          user_id: true,
          providerAccountId: true,
          nickname: true,
          deleted_at: true,
          createdAt: true
        }
      });
      currentUserInfo = user;
    }

    return NextResponse.json({
      session: sessionInfo,
      currentUser: currentUserInfo,
      userSamples,
      tableInfo,
      envInfo
    });
  } catch (error) {
    console.error("デバッグAPI エラー:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}