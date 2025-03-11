// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  try {
    // トークン取得試行
    let token;
    try {
      token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET
      });
    } catch (tokenError) {
      console.error("トークン取得エラー:", tokenError);
    }

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

    return NextResponse.next();
  } catch (err) {
    console.error("ミドルウェアエラー:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};