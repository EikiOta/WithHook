// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  console.log("Cookie Header:", request.headers.get("cookie"));

  // Cookie 名のカスタム指定は削除し、NextAuth のデフォルトに任せる
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  console.log("Retrieved token:", token);

  const { pathname } = request.nextUrl;

  // 認証用 API や静的ファイルはそのまま通過
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 未認証の場合は /login へリダイレクト
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 既に認証済みの場合、/login へアクセスしたらトップへリダイレクト
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/* ミドルウェア適用パスの設定
   - 適用対象: /api/auth/*、/_next/*、/favicon.ico を除く全ページ */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
