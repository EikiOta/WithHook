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
          const newUser = await prisma.user.create({
            data: {
              providerAccountId: providerAccountId,
              nickname: user.name || "",
              profile_image: user.image || "",
            },
          });
          // 作成したレコードの内部ID（user_id）を user オブジェクトにセット
          user.id = newUser.user_id;
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
          // 既存レコードの user_id をセット
          user.id = existingUser.user_id;
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        // signIn時に user.id に DB の user_id がセットされるのでそれを使用
        token.sub = user.id ? user.id.toString() : token.sub;
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      // もし account 情報があれば、providerAccountId を念のため上書き
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