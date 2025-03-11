// auth.ts の修正
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// アプリの環境変数確認
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("警告: NEXTAUTH_SECRET環境変数が設定されていません");
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !account.providerAccountId) {
        console.error("signIn: アカウント情報が不足しています");
        return false;
      }

      try {
        // プロバイダから提供される固有ID
        const providerAccountId = account.providerAccountId;
        
        // ユーザー検索
        const existingUser = await prisma.user.findUnique({
          where: { providerAccountId: providerAccountId },
        });
        
        if (!existingUser) {
          // 新規ユーザー作成
          const newUser = await prisma.user.create({
            data: {
              providerAccountId: providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
          // 内部IDを設定
          user.id = newUser.user_id;
        } else {
          // 既存ユーザーの内部ID設定
          user.id = existingUser.user_id;
          
          // 削除済みでなければ更新
          if (!existingUser.deleted_at) {
            await prisma.user.update({
              where: { user_id: existingUser.user_id },
              data: {
                nickname: user.name || "",
                profile_image: user.image || "",
              },
            });
          }
        }
        return true;
      } catch (error) {
        console.error("signIn処理中エラー:", error);
        return false;
      }
    },
    
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = user.id;
          token.name = user.name || "";
          token.email = user.email || "";
          token.picture = user.image || "";
        }
        return token;
      } catch (error) {
        console.error("JWT処理中エラー:", error);
        // エラー時でも有効なトークンを返す
        return { ...token };
      }
    },
    
    async session({ session, token }) {
      try {
        if (!session) session = { user: {}, expires: "" };
        if (!session.user) session.user = {};
        
        if (token) {
          session.user.id = token.sub || "";
          session.user.name = token.name || "";
          session.user.email = token.email || "";
          session.user.image = token.picture || "";
        }
        
        return session;
      } catch (error) {
        console.error("セッション処理中エラー:", error);
        // 最小限のセッション情報を返す
        return {
          user: { id: token?.sub || "" },
          expires: session?.expires || ""
        };
      }
    }
  }
});