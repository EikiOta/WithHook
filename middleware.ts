// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  console.log("Middleware called for path:", req.nextUrl.pathname);
  console.log("Cookie Header:", req.headers.get("cookie")?.substring(0, 20) + "...");

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
  console.log("Retrieved token:", token ? "Exists" : "None");

  const { pathname } = req.nextUrl;

  // API、Next.js 内部、favicon はそのまま通過
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    console.log("Skipping middleware checks for internal path");
    return NextResponse.next();
  }

  // 復旧ページへのアクセスを許可
  if (pathname === "/recover-account") {
    console.log("Allowing access to recover-account page");
    return NextResponse.next();
  }

  // 未ログインの場合は /login へリダイレクト
  if (!token && pathname !== "/login") {
    console.log("No token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // token が存在する場合、削除状態をチェック
  if (token && pathname !== "/recover-account") {
    // 復旧ページからの直後のリダイレクトの場合はスキップ
    const skipCheck = req.headers.get("referer")?.includes("/recover-account") && 
                     pathname === "/";
                     
    if (skipCheck) {
      console.log("Skipping deleted check after recovery page redirect");
      return NextResponse.next();
    }
    
    // 正しいAPI pathを指定
    const checkUrl = new URL("/api/user/delete/check-deleted", req.url);
    try {
      console.log("Calling check-deleted API");
      const response = await fetch(checkUrl.toString(), { 
        cache: "no-store",
        headers: {
          cookie: req.headers.get("cookie") || ""
        }
      });
      
      if (!response.ok) {
        console.error("Error from check-deleted API:", response.status);
        return NextResponse.next();
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Deleted status check result:", data);
        
        if (data.deleted) {
          console.log("User is deleted, redirecting to recover page");
          return NextResponse.redirect(new URL("/recover-account", req.url));
        }
      } else {
        console.error("Unexpected content type from check-deleted API:", contentType);
      }
    } catch (err) {
      console.error("Error checking deletion status:", err);
    }
  }

  // ログイン済みで /login にアクセス中ならトップへリダイレクト
  if (token && pathname === "/login") {
    console.log("User already logged in, redirecting to home");
    return NextResponse.redirect(new URL("/", req.url));
  }

  console.log("Proceeding with request");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};