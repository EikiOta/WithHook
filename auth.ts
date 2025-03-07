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
          // 内部IDをセットする
          user.id = newUser.user_id;
        } else {
          // 既存ユーザーがあれば、内部IDをセットする
          user.id = existingUser.user_id;
          
          // 必要に応じて情報を更新（削除済みでなければ）
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
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        // userオブジェクトがある場合は認証時なので、内部IDをtokenに設定
        token.sub = user.id || token.sub;
        token.name = user.name || "";
        token.email = user.email || "";
        token.picture = user.image || "";
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub ?? "", // このidが内部で生成されたuser_idになる
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