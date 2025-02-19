// auth.ts Auth.jsの設定と初期化を行う
import { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const config: NextAuthConfig = {
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
  // JWT セッション戦略を利用
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /*singInはユーザがサインイン直後に呼び出す*/ 
    async signIn({ user, account }) {
      // アカウントがnullの場合
      if (!account) {
        console.error("signIn callback: account is null");
        return false;
      }
      const providerAccountId = account.providerAccountId;
      try {
        /* Prismaの"findUnique"メソッドを使って、userテーブルから一意に識別できるユーザを探す */
        const existingUser = await prisma.user.findUnique({
          where: { user_id: providerAccountId }, // user_idがOAuthから受け取ったproviderAccountIdと一致するレコードを検索対象にする
        });
        if (!existingUser) {
          // 存在しない場合createする
          await prisma.user.create({
            data: {
              user_id: providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
        } else {
          // 存在する場合アップデートする
          await prisma.user.update({
            where: { user_id: providerAccountId },
            data: {
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    // JWT コールバックを明示的に実装
    async jwt({ token, user }) {
      token = token || {};
      if (user) {
        // user.id が存在しない場合、user.email を代替として利用
        token.sub = user.id ? user.id.toString() : user.email || token.sub || "";
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      return token;// 更新されたトークンを返す
    },
    async session({ session, token }) {
        session.user = {
          ...session.user,
          id: token.sub ?? "",
          name: token.name ?? "",
          email: token.email ?? "",
          image: token.picture ?? "",
        };
        return session;
      },
      /*リダイレクト処理 baseUrlはAuth.jsが用意しているもの。既定ではホームページ（"/"）にリダイレクトされる*/
    async redirect({ baseUrl }: { url: string; baseUrl: string }): Promise<string> {
      return baseUrl;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
