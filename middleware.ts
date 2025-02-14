// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // NextAuth の secret を指定してトークンを取得
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // NextAuth の認証用APIや静的ファイルはそのまま通過させる
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 未ログイン状態で保護対象ページ（例: トップ画面など）にアクセスした場合は、/login にリダイレクト
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ログイン済み状態で /login ページにアクセスした場合は、トップページ（"/"）へリダイレクト
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // その他はそのままリクエストを許可
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
