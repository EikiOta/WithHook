// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

    // ログイン済みの場合、削除状態をチェック
    if (token && pathname !== "/recover-account") {
      try {
        // Edge RuntimeからサーバーサイドAPIを呼び出す
        const baseUrl = req.nextUrl.origin;
        const checkResponse = await fetch(`${baseUrl}/api/user/delete/check-deleted`, {
          headers: {
            cookie: req.headers.get('cookie') || '',
          }
        });
        
        if (checkResponse.ok) {
          const { deleted } = await checkResponse.json();
          
          // 削除済みアカウントの場合、直接復旧ページへリダイレクト
          if (deleted) {
            return NextResponse.redirect(new URL("/recover-account", req.url));
          }
        }
      } catch (error) {
        // API呼び出しエラー時はログを記録するだけで処理を続行
        console.error("削除状態チェックエラー:", error);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};