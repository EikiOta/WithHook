import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  console.log("Cookie Header:", request.headers.get("cookie"));

  // Auth.js のデフォルト設定に従って token を取得
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

  // token が存在し、かつ token.sub が存在する場合を認証済みと判断
  const isAuthenticated = token && token.sub;

  // 未認証状態の場合は "/login" 以外の全ページで "/login" へリダイレクト
  if (!isAuthenticated && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 認証済みの場合、"/login" で始まるページ（"/login"や"/login/"など）にアクセスされたらトップページへリダイレクト
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
