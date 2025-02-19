// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log("Cookie Header:", request.headers.get("cookie"));
  
  // 環境に応じた Cookie 名を設定する
  const cookieName =
    process.env.NODE_ENV === "production" // process.env.NODE_ENVはNode.jsの環境変数。開発環境時 -> development, 本番環境時 -> productionになる。
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,// process.env系はnode.jsでenvを取得する際に使う。
    cookieName,
  });
  console.log("Retrieved token:", token);

  const { pathname } = request.nextUrl;// {}で分割代入、nextUrlを取得する。これはURLの詳細な情報を持っているオブジェクト。

  // 認証用APIや静的ファイル、favicon.ico はそのまま通過。リクエストされたパスがいずれかから始まる場合は、NextResponse呼び出してミドルウェアがリクエストを終了する。
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 未ログイン状態で保護対象ページにアクセスした場合は /login へリダイレクト
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ログイン済み状態で /login ページにアクセスした場合はトップページへリダイレクト
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/*ミドルウェアが適用されるパスを指定している。「?!...」は否定の先読み表現。つまり?!以降のものは続いていないものが対象になる。
適用されるパスの例:

1. ミドルウェアが適用される: /dashboard、/profile、/login など、上記の除外条件に当てはまらないパス。
2. ミドルウェアが適用されない:
/api/auth/login（認証用 API のため）
/_next/static/some-file.js（Next.js の静的ファイルのため）
/_next/image?url=...（Next.js の画像最適化用のパス）
/favicon.ico（ファビコンのリクエスト）
*/ 
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
