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

    // 復旧ページへのアクセスを許可（ログイン済みでも許可する）
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

    // ログイン済みの場合、削除済みアカウントかチェック（ローカルストレージも確認）
    if (token && pathname !== "/recover-account") {
      try {
        // 削除状態チェックAPIをフェッチ
        const response = await fetch(new URL("/api/user/delete/check-deleted", req.url));
        const data = await response.json();
        
        // 削除済みなら復旧ページへリダイレクト
        if (data.deleted === true) {
          console.log("削除済みアカウントを検出: 復旧ページへリダイレクト");
          return NextResponse.redirect(new URL("/recover-account", req.url));
        }
      } catch (error) {
        console.error("削除状態チェックエラー:", error);
        // エラー時はセーフティのため継続
      }
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