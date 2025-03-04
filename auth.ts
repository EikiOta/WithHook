// auth.ts
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { auth, handlers, signIn, signOut } = NextAuth({
  // Auth.js v5では環境変数に AUTH_ プレフィックスを利用するのが推奨されます
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
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) {
        console.error("signIn callback: account is null");
        return false;
      }
      // プロバイダから提供される固有ID
      const providerAccountId = account.providerAccountId;
      try {
        // providerAccountId でユーザー検索（既存ユーザーがあれば取得）
        const existingUser = await prisma.user.findUnique({
          where: { providerAccountId: providerAccountId },
        });
        
        if (!existingUser) {
          // 存在しなければ、新規ユーザー作成
          await prisma.user.create({
            data: {
              providerAccountId: providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
          // providerAccountId を一貫して使う
          user.id = providerAccountId;
        } else {
          // 既存ユーザーがあれば、必要に応じて情報を更新
          // ただし、deleted_atの値は更新しない（復旧ページでの処理に任せる）
          if (!existingUser.deleted_at) {
            await prisma.user.update({
              where: { providerAccountId: providerAccountId },
              data: {
                nickname: user.name || "",
                profile_image: user.image || "",
              },
            });
          }
          // 一貫性を保つため providerAccountId を設定
          user.id = providerAccountId;
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        // user.id は providerAccountId なので、そのまま token.sub に設定
        token.sub = user.id || token.sub;
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      // このコメントはもう必要ないが、一貫性のため providerAccountId を使い続ける
      if (account && account.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
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
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
});