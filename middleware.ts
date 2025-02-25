// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  console.log("Cookie Header:", request.headers.get("cookie"));

  // 本番環境では secureCookie オプションを true に設定
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  console.log("Retrieved token:", token);

  const { pathname } = request.nextUrl;

  // API や静的ファイルはそのまま通過
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // token の存在と token.sub で認証状態を判断
  const isAuthenticated = token && token.sub;

  // 未認証の場合、/login 以外の全ページは /login にリダイレクト
  if (!isAuthenticated && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 認証済みの場合、/login ページへのアクセスはトップページへリダイレクト
  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/* ミドルウェア適用パスの設定
   ※ /api/auth、/_next/static、/_next/image、/favicon.ico は除外 */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
