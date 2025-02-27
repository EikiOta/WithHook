// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  console.log("Cookie Header:", req.headers.get("cookie"));

  // 環境に応じた Cookie 名の設定
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });
  console.log("Retrieved token:", token);

  const { pathname } = req.nextUrl;

  // API、Next.js 内部、favicon はそのまま通過
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 未ログインの場合は /login へリダイレクト
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // token が存在する場合、内部 API を呼んで削除状態をチェック
  if (token) {
    const checkUrl = new URL("/api/user/check-deleted", req.url);
    try {
      const response = await fetch(checkUrl.toString(), { cache: "no-store" });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.deleted) {
          return NextResponse.redirect(new URL("/login", req.url));
        }
      } else {
        console.error("Unexpected content type from check-deleted API:", contentType);
      }
    } catch (err) {
      console.error("Error checking deletion status:", err);
      // エラーが発生した場合は安全側に倒す（ここではそのまま続行）
    }
  }

  // ログイン済みで /login にアクセス中ならトップへリダイレクト
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
