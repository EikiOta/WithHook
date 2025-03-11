// auth.ts
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        return { ...token };
      }
    },
    
    async session({ session, token }) {
      try {
        // 既存のセッションとユーザーオブジェクトを変更
        if (session?.user && token) {
          // 新しいセッションオブジェクトを作成して返す
          return {
            ...session,
            user: {
              ...session.user,
              id: token.sub || "",
              name: token.name || "",
              email: token.email || "",
              image: token.picture || ""
            }
          };
        }
        
        return session;
      } catch (error) {
        console.error("セッション処理中エラー:", error);
        return session;
      }
    }
  }
});