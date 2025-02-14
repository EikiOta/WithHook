// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // ログ確認用に Cookie ヘッダーを出力
  console.log("Cookie Header:", request.headers.get("cookie"));

  // Cookie 名を明示的に指定
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "authjs.session-token",
  });
  console.log("Retrieved token:", token);

  const { pathname } = request.nextUrl;

  // 認証用APIや静的ファイル、favicon.ico はそのまま通過
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 未ログインの場合、保護対象ページなら /login へリダイレクト
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ログイン済みの場合、/login ページにアクセスしたらホームにリダイレクト
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
