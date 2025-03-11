// middleware.ts を修正
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  console.log("===== ミドルウェア開始 =====");
  console.log("リクエストパス:", req.nextUrl.pathname);
  console.log("Cookieリスト:", req.cookies.getAll().map(c => c.name));
  
  try {
    // 環境変数チェック
    console.log("NEXTAUTH_SECRET 設定済み:", !!process.env.NEXTAUTH_SECRET);
    
    // トークン取得試行
    let token;
    try {
      token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
      });
      console.log("トークン取得:", token ? "成功" : "失敗");
      if (token) {
        console.log("トークン内容:", { 
          sub: token.sub, 
          name: token.name,
          iat: token.iat,
          exp: token.exp
        });
      }
    } catch (tokenError) {
      console.error("トークン取得エラー:", tokenError);
    }

    // 以下は通常処理（ログを追加）
    const { pathname } = req.nextUrl;
    
    // 認証チェック不要パスの処理
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico"
    ) {
      console.log("内部パスのため認証チェックをスキップ");
      console.log("===== ミドルウェア終了 =====");
      return NextResponse.next();
    }

    // 特別ページの処理
    if (pathname === "/recover-account") {
      console.log("リカバリーページへのアクセスを許可");
      console.log("===== ミドルウェア終了 =====");
      return NextResponse.next();
    }

    if (!token && pathname !== "/login") {
      console.log("トークンなし、ログインページへリダイレクト");
      console.log("===== ミドルウェア終了 =====");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token && pathname === "/login") {
      console.log("トークンあり、ログインページからホームへリダイレクト");
      console.log("===== ミドルウェア終了 =====");
      return NextResponse.redirect(new URL("/", req.url));
    }

    console.log("通常フローで続行");
    console.log("===== ミドルウェア終了 =====");
    return NextResponse.next();
  } catch (err) {
    console.error("ミドルウェアエラー:", err);
    console.log("===== ミドルウェアエラーで終了 =====");
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};