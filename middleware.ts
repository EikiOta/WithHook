// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  console.log("Cookie Header:", request.headers.get("cookie"));

  // NextAuth のデフォルト設定を利用するため、cookieName オプションは指定しない
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  console.log("Retrieved token:", token);

  const { pathname } = request.nextUrl;

  // 認証用APIや静的ファイル、favicon.ico はそのまま通過
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 未ログイン状態で保護対象ページにアクセスした場合は /login へリダイレクト
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログイン済み状態で /login ページにアクセスした場合はトップページへリダイレクト
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/* ミドルウェアが適用されるパスを指定
   - 適用される例: /dashboard, /profile, /login（ただし /login はリダイレクト対象）
   - 適用されない例: /api/auth/*, /_next/static/*, /_next/image*, /favicon.ico */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
