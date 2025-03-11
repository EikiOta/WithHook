// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ミドルウェアはEdge Runtimeで実行されるため、
// このままではPrismaやAPIを直接使用できない
// これらはNode.jsランタイムでのみ動作する

export async function middleware(req: NextRequest) {
  try {
    // トークン取得試行
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    });

    const { pathname } = req.nextUrl;
    
    // API、Next.js内部パス、faviconはチェックをスキップ
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // 復旧ページへのアクセスを許可
    if (pathname === "/recover-account") {
      return NextResponse.next();
    }

    // 未ログインの場合は/loginへリダイレクト
    if (!token && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ログイン済みで/loginにアクセス中ならトップへリダイレクト
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ログイン済みの場合の処理
    // 注意: Edge Runtimeではデータベースに直接アクセスできないため、
    // 削除済みアカウントの検出は再度クライアントサイドで行う必要がある
    
    // 削除状態の情報がトークンに含まれていれば使用
    if (token && pathname !== "/recover-account") {
      // ここでは単にNextResponseを返し、
      // クライアントサイドのDeletedUserCheckに任せる
    }

    return NextResponse.next();
  } catch {
    // エラーパラメータを完全に省略
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};